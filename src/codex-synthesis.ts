import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { RepoScan } from "./schemas.js";

export type CodexSynthesis = {
  status: "success" | "failed";
  content: string;
  command: string;
  notVerified: string[];
};

export async function runCodexSynthesis(
  scan: RepoScan,
  options: { timeoutMs?: number } = {},
): Promise<CodexSynthesis> {
  const codexBin = process.env.LUMO_CODEX_BIN ?? "codex";
  const timeoutMs = options.timeoutMs ?? 90_000;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "lumo-codex-synthesis-"));
  const finalPath = path.join(tempDir, "final.md");
  const prompt = buildCodexSynthesisPrompt(scan);

  try {
    const result = await runProcessWithInput(
      codexBin,
      [
        "exec",
        "--cd",
        scan.repoPath,
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
      prompt,
      scan.repoPath,
      timeoutMs,
    );

    if (result.timedOut) {
      throw new Error(`Codex synthesis timed out after ${timeoutMs}ms.`);
    }

    if (result.code !== 0) {
      throw new Error(
        [
          `Codex exited with code ${result.code}.`,
          result.stderr ? `stderr: ${trimForError(result.stderr)}` : null,
          result.stdout ? `stdout: ${trimForError(result.stdout)}` : null,
        ]
          .filter(Boolean)
          .join(" "),
      );
    }

    const content = await readFile(finalPath, "utf8").catch(() => null);
    if (!content) {
      throw new Error(
        [
          "Codex completed but did not write the output-last-message file.",
          result.stderr ? `stderr: ${trimForError(result.stderr)}` : null,
          result.stdout ? `stdout: ${trimForError(result.stdout)}` : null,
        ]
          .filter(Boolean)
          .join(" "),
      );
    }

    return {
      status: "success",
      content,
      command: "codex exec --sandbox read-only --ephemeral --ignore-user-config --ignore-rules",
      notVerified: [
        "Codex synthesis is model judgment, not deterministic proof.",
        "No files were written by Lumo.",
        "No tests, browser checks, provider calls, database calls, or production flows were executed by Lumo.",
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "failed",
      content: [
        "# Codex Synthesis Failed",
        "",
        "Lumo completed the deterministic scan, but the optional Codex synthesis did not finish.",
        "",
        `Reason: ${message}`,
        "",
        `Timeout: ${timeoutMs}ms`,
      ].join("\n"),
      command: "codex exec --sandbox read-only --ephemeral --ignore-user-config --ignore-rules",
      notVerified: [
        "Codex CLI availability or authentication was not proven.",
        "No LLM-assisted interpretation was produced.",
      ],
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export function buildCodexSynthesisPrompt(scan: RepoScan): string {
  return [
    "You are helping produce a Lumo Harness repo-readiness synthesis for a coding-agent user.",
    "",
    "Rules:",
    "- Read only. Do not edit, create, delete, move, or format files.",
    "- Do not run commands that write caches, install packages, start servers, hit providers, or mutate state.",
    "- Use repository evidence where helpful, but keep the final answer concise.",
    "- Do not include absolute local paths, secrets, env values, raw private data, or contact data.",
    "- If evidence is missing, say UNCONFIRMED.",
    "- Recommend a small editable harness, not a big framework.",
    "",
    "Deterministic Lumo scan:",
    fencedJson(redactScan(scan)),
    "",
    "Return exactly these sections:",
    "",
    "# Codex Synthesis",
    "",
    "## Repo Interpretation",
    "2-4 bullets about what kind of repo this appears to be and how a coding agent should approach it.",
    "",
    "## Existing Style And Patterns",
    "2-4 bullets about visible patterns, boundaries, commands, or architecture habits. Mark weak evidence as UNCONFIRMED.",
    "",
    "## Harness Gaps",
    "3 bullets max. Tie each gap to concrete agent behavior.",
    "",
    "## Proposed Small Harness",
    "Name the smallest files or sections to add/update. Include why each exists.",
    "",
    "## Do Not Add Yet",
    "2-4 bullets preventing overbuilding.",
    "",
    "## Not Verified",
    "List what was not proven.",
  ].join("\n");
}

function redactScan(scan: RepoScan): Omit<RepoScan, "repoPath"> & { repoName: string } {
  const { repoPath: _repoPath, ...safeScan } = scan;
  return {
    ...safeScan,
    repoName: path.basename(scan.repoPath),
  };
}

function fencedJson(value: unknown): string {
  return ["```json", JSON.stringify(value, null, 2), "```"].join("\n");
}

function runProcessWithInput(
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

function trimForError(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 800);
}
