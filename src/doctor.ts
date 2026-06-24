import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { RepoScan } from "./schemas.js";

type CheckStatus = "pass" | "warn" | "fail";

type DoctorCheck = {
  name: string;
  status: CheckStatus;
  detail: string;
};

export type DoctorReport = {
  status: CheckStatus;
  checks: DoctorCheck[];
};

export async function runDoctor(
  scan: RepoScan,
  options: { withCodex?: boolean; timeoutMs?: number } = {},
): Promise<DoctorReport> {
  const codexBin = process.env.LUMO_CODEX_BIN ?? "codex";
  const checks: DoctorCheck[] = [
    pass("Repository", `${path.basename(scan.repoPath)} readable, ${scan.fileCount} files scanned`),
    scan.stack.hasPackageJson
      ? pass("Package manifest", "package.json detected")
      : warn("Package manifest", "No package.json detected; Lumo can still report, but TypeScript/Next.js defaults may be weak"),
    scan.commands.length > 0
      ? pass("Package scripts", `${scan.commands.length} scripts detected`)
      : warn("Package scripts", "No package scripts detected; verification command will be UNCONFIRMED"),
    scan.commands.some((command) => ["lint", "typecheck", "test", "build"].includes(command.category))
      ? pass("Verification rail", "At least one lint/typecheck/test/build command detected")
      : warn("Verification rail", "No deterministic verification command detected"),
  ];

  checks.push(await checkCodexVersion(codexBin));

  if (options.withCodex) {
    checks.push(await checkCodexSmoke(codexBin, scan.repoPath, options.timeoutMs ?? 30_000));
  }

  return {
    status: summarize(checks),
    checks,
  };
}

export function renderDoctorReport(report: DoctorReport): string {
  return [
    "# Lumo Doctor",
    "",
    `Status: ${report.status}`,
    "",
    "| Check | Status | Detail |",
    "| --- | --- | --- |",
    ...report.checks.map((check) => `| ${check.name} | ${check.status.toUpperCase()} | ${escapeTable(check.detail)} |`),
    "",
    report.status === "fail"
      ? "Next: fix the failing check before running `analyze --with-codex` or `init --write`."
      : "Next: run `analyze --html --with-codex` for a report, then `init --dry-run` for proposed harness files.",
    "",
  ].join("\n");
}

async function checkCodexVersion(codexBin: string): Promise<DoctorCheck> {
  try {
    const result = await runProcess(codexBin, ["--version"], "", process.cwd(), 10_000);
    if (result.code !== 0) {
      return warn("Codex CLI", `Command exited with ${result.code}: ${trim(result.stderr || result.stdout)}`);
    }
    return pass("Codex CLI", trim(result.stdout || result.stderr) || "codex command found");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail("Codex CLI", `Not available: ${message}`);
  }
}

async function checkCodexSmoke(codexBin: string, repoPath: string, timeoutMs: number): Promise<DoctorCheck> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "lumo-codex-doctor-"));
  const finalPath = path.join(tempDir, "final.md");

  try {
    const result = await runProcess(
      codexBin,
      [
        "exec",
        "--cd",
        repoPath,
        "--sandbox",
        "read-only",
        "--skip-git-repo-check",
        "--ephemeral",
        "--ignore-user-config",
        "--ignore-rules",
        "--output-last-message",
        finalPath,
        "-",
      ],
      "Reply with OK only.",
      repoPath,
      timeoutMs,
    );

    if (result.timedOut) {
      return warn("Codex smoke", `Timed out after ${timeoutMs}ms`);
    }

    if (result.code !== 0) {
      return warn("Codex smoke", `Command exited with ${result.code}: ${trim(result.stderr || result.stdout)}`);
    }

    const final = await readFile(finalPath, "utf8").catch(() => "");
    return /OK/i.test(final)
      ? pass("Codex smoke", "codex exec responded in read-only sandbox")
      : warn("Codex smoke", "codex exec completed, but final response was not the expected smoke output");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return warn("Codex smoke", `Could not prove login/readiness: ${message}`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function runProcess(
  command: string,
  args: string[],
  input: string,
  cwd: string,
  timeoutMs: number,
): Promise<{ code: number | null; stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });

    child.stdin.end(input);
  });
}

function summarize(checks: DoctorCheck[]): CheckStatus {
  if (checks.some((check) => check.status === "fail")) return "fail";
  if (checks.some((check) => check.status === "warn")) return "warn";
  return "pass";
}

function pass(name: string, detail: string): DoctorCheck {
  return { name, detail, status: "pass" };
}

function warn(name: string, detail: string): DoctorCheck {
  return { name, detail, status: "warn" };
}

function fail(name: string, detail: string): DoctorCheck {
  return { name, detail, status: "fail" };
}

function trim(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

function escapeTable(value: string): string {
  return value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}
