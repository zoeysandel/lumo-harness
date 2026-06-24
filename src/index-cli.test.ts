import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmod, cp, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const cliPath = fileURLToPath(new URL("./index.ts", import.meta.url));
const dashboardFixturePath = path.join(repoRoot, "fixtures/nextjs-dashboard-action-risk");

test("preview command prints draft file contents without writing", async () => {
  const result = await runCli(["preview", "--path", "fixtures/nextjs-dashboard-action-risk"]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /# Lumo Harness Preview/);
  assert.match(result.stdout, /Mode: preview_only/);
  assert.match(result.stdout, /No files were written to the target repo/);
  assert.match(result.stdout, /## AGENTS\.md\.draft/);
  assert.match(result.stdout, /## CLAUDE\.md\.draft/);
  assert.match(result.stdout, /## workflows\/feature\.md/);
  assert.match(result.stdout, /TypeScript\/Next\.js Defaults/);
  assert.match(result.stdout, /Final Response Contract/);
  assert.match(result.stdout, /prefer local state, local route logic/i);
});

test("preview command supports machine-readable json", async () => {
  const result = await runCli(["preview", "--path", "fixtures/nextjs-dashboard-action-risk", "--format", "json"]);
  const parsed = JSON.parse(result.stdout) as {
    mode: string;
    files: Array<{ path: string }>;
  };

  assert.equal(result.code, 0);
  assert.equal(parsed.mode, "preview_only");
  assert.deepEqual(
    parsed.files.map((file) => file.path),
    ["AGENTS.md.draft", "CLAUDE.md.draft", "workflows/bugfix.md", "workflows/feature.md", "workflows/review.md"],
  );
});

test("preview command does not write to the target repo", async () => {
  const before = await snapshotFiles(dashboardFixturePath);
  const result = await runCli(["preview", "--path", "fixtures/nextjs-dashboard-action-risk"]);
  const after = await snapshotFiles(dashboardFixturePath);

  assert.equal(result.code, 0);
  assert.deepEqual(after, before);
});

test("doctor checks repo basics and local Codex CLI availability", async () => {
  const fakeDir = await mkdtemp(path.join(os.tmpdir(), "lumo-fake-codex-"));
  const fakeCodex = path.join(fakeDir, "codex");

  try {
    await writeFakeCodex(fakeCodex);
    const result = await runCli(
      ["doctor", "--path", "fixtures/nextjs-dashboard-action-risk", "--with-codex"],
      { LUMO_CODEX_BIN: fakeCodex },
    );

    assert.equal(result.code, 0);
    assert.match(result.stdout, /# Lumo Doctor/);
    assert.match(result.stdout, /Codex CLI/);
    assert.match(result.stdout, /Codex smoke/);
    assert.match(result.stdout, /PASS/);
  } finally {
    await rm(fakeDir, { recursive: true, force: true });
  }
});

test("analyze command can render an HTML readiness report", async () => {
  const result = await runCli(["analyze", "--path", "fixtures/nextjs-dashboard-action-risk", "--html"]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /<!doctype html>/i);
  assert.match(result.stdout, /Lumo Rubric Report/);
  assert.match(result.stdout, /Lumo Rubric/);
  assert.match(result.stdout, /Repo Contract/);
  assert.match(result.stdout, /Verification Rail/);
  assert.match(result.stdout, /Smallest Next Improvement/);
  assert.doesNotMatch(result.stdout, /Codex Setup Query/);
  assert.match(result.stdout, /Generated locally by Lumo Harness/);
});

test("scan html output can be written to a report file", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "lumo-report-"));
  const outputPath = path.join(outputDir, "report.html");

  try {
    const result = await runCli([
      "scan",
      "--path",
      "fixtures/nextjs-dashboard-action-risk",
      "--format",
      "html",
      "--output",
      outputPath,
    ]);
    const report = await readFile(outputPath, "utf8");

    assert.equal(result.code, 0);
    assert.match(result.stdout, new RegExp(`Wrote ${escapeRegExp(outputPath)}`));
    assert.match(report, /<title>Lumo Harness Report/);
    assert.match(report, /nextjs-dashboard-action-risk/);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("analyze can include optional Codex synthesis from a local Codex CLI", async () => {
  const fakeDir = await mkdtemp(path.join(os.tmpdir(), "lumo-fake-codex-"));
  const fakeCodex = path.join(fakeDir, "codex");

  try {
    await writeFakeCodex(fakeCodex);

    const result = await runCli(
      ["analyze", "--path", "fixtures/nextjs-dashboard-action-risk", "--html", "--with-codex"],
      { LUMO_CODEX_BIN: fakeCodex },
    );

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Codex Synthesis/);
    assert.match(result.stdout, /Fake Codex synthesis for test/);
    assert.match(result.stdout, /read-only/);
  } finally {
    await rm(fakeDir, { recursive: true, force: true });
  }
});

test("init previews proposed harness files without writing", async () => {
  const before = await snapshotFiles(dashboardFixturePath);
  const result = await runCli(["init", "--path", "fixtures/nextjs-dashboard-action-risk", "--dry-run"]);
  const after = await snapshotFiles(dashboardFixturePath);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /# Lumo Init Preview/);
  assert.match(result.stdout, /No files were written/);
  assert.match(result.stdout, /AGENTS\.md/);
  assert.match(result.stdout, /CLAUDE\.md/);
  assert.deepEqual(after, before);
});

test("init write creates harness files in a temp repo and refuses overwrites", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "lumo-init-"));
  const repoCopy = path.join(outputDir, "repo");

  try {
    await cp(path.join(repoRoot, "fixtures/minimal-ts"), repoCopy, { recursive: true });
    const result = await runCli(["init", "--path", repoCopy, "--write"]);
    const agents = await readFile(path.join(repoCopy, "AGENTS.md"), "utf8");
    const claude = await readFile(path.join(repoCopy, "CLAUDE.md"), "utf8");
    const bugfix = await readFile(path.join(repoCopy, "workflows/bugfix.md"), "utf8");
    const secondRun = await runCli(["init", "--path", repoCopy, "--write"]);

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Files written/);
    assert.match(agents, /Generated by Lumo Harness/);
    assert.match(agents, /Final Response Contract/);
    assert.match(claude, /Follow `AGENTS\.md`/);
    assert.match(bugfix, /Bugfix Workflow/);
    assert.notEqual(secondRun.code, 0);
    assert.match(secondRun.stderr, /Refusing to overwrite existing file/);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

function runCli(
  args: string[],
  env: Record<string, string> = {},
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", cliPath, ...args], {
      cwd: repoRoot,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function writeFakeCodex(fakeCodex: string): Promise<void> {
  await writeFile(
    fakeCodex,
    [
      "#!/bin/sh",
      "if [ \"$1\" = \"--version\" ]; then",
      "  echo \"codex fake-test\"",
      "  exit 0",
      "fi",
      "out=\"\"",
      "while [ \"$#\" -gt 0 ]; do",
      "  if [ \"$1\" = \"--output-last-message\" ]; then",
      "    shift",
      "    out=\"$1\"",
      "  fi",
      "  shift",
      "done",
      "cat > \"$out\" <<'EOF'",
      "# Codex Synthesis",
      "",
      "## Repo Interpretation",
      "- Fake Codex synthesis for test.",
      "OK",
      "EOF",
    ].join("\n"),
    "utf8",
  );
  await chmod(fakeCodex, 0o755);
}

async function snapshotFiles(root: string): Promise<Record<string, string>> {
  const entries = await readdir(root, { withFileTypes: true });
  const snapshot: Record<string, string> = {};

  for (const entry of entries) {
    const absolutePath = path.join(root, entry.name);
    const relativePath = path.relative(root, absolutePath);

    if (entry.isDirectory()) {
      const childSnapshot = await snapshotFiles(absolutePath);

      for (const [childPath, content] of Object.entries(childSnapshot)) {
        snapshot[path.join(entry.name, childPath)] = content;
      }

      continue;
    }

    if (entry.isFile()) {
      snapshot[relativePath] = await readFile(absolutePath, "utf8");
    }
  }

  return Object.fromEntries(Object.entries(snapshot).sort(([left], [right]) => left.localeCompare(right)));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
