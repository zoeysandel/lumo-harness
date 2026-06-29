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

test("preflight prints a read-only decision card", async () => {
  const result = await runCli([
    "preflight",
    "--path",
    "fixtures/nextjs-dashboard-action-risk",
    "--task",
    "Add a compact empty state to the intake action card.",
  ]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /# Lumo Preflight/);
  assert.match(result.stdout, /## Status: go/);
  assert.match(result.stdout, /Recommended Route/);
  assert.match(result.stdout, /Mode: deterministic/);
  assert.match(result.stdout, /Read-only/);
});

test("preflight supports machine-readable json for agent callers", async () => {
  const result = await runCli([
    "preflight",
    "--path",
    "fixtures/nextjs-dashboard-action-risk",
    "--task",
    "Update billing and auth behavior before syncing this action to the CRM provider.",
    "--format",
    "json",
  ]);
  const parsed = JSON.parse(result.stdout) as {
    task: string;
    preflight: {
      status: string;
      userDecision: string;
    };
  };

  assert.equal(result.code, 0);
  assert.equal(parsed.preflight.status, "pause");
  assert.match(parsed.preflight.userDecision, /Approve the risky seam/i);
});

test("preflight can include optional Codex interpretation", async () => {
  const fakeDir = await mkdtemp(path.join(os.tmpdir(), "lumo-fake-codex-"));
  const fakeCodex = path.join(fakeDir, "codex");

  try {
    await writeFakeCodex(fakeCodex);

    const result = await runCli(
      [
        "preflight",
        "--path",
        "fixtures/nextjs-dashboard-action-risk",
        "--task",
        "Add a compact empty state to the intake action card.",
        "--with-codex",
        "--format",
        "json",
      ],
      { LUMO_CODEX_BIN: fakeCodex, LUMO_FAKE_CODEX_MODE: "preflight" },
    );
    const parsed = JSON.parse(result.stdout) as {
      preflight: {
        status: string;
        mode: string;
        why: string;
      };
      codexPreflight: {
        status: string;
      };
    };

    assert.equal(result.code, 0);
    assert.equal(parsed.codexPreflight.status, "success");
    assert.equal(parsed.preflight.status, "check_again");
    assert.equal(parsed.preflight.mode, "deterministic_plus_codex");
    assert.match(parsed.preflight.why, /Fake Codex interpreted/i);
  } finally {
    await rm(fakeDir, { recursive: true, force: true });
  }
});

test("preflight requires task text", async () => {
  const result = await runCli(["preflight", "--path", "fixtures/nextjs-dashboard-action-risk"]);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /--task is required for preflight/);
});

test("checkpoint prints a read-only steering card from git changes", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "lumo-checkpoint-"));
  const repoCopy = path.join(outputDir, "repo");

  try {
    await cp(path.join(repoRoot, "fixtures/minimal-ts"), repoCopy, { recursive: true });
    await runProcess("git", ["init"], repoCopy);
    await runProcess("git", ["add", "."], repoCopy);
    await runProcess("git", ["-c", "user.name=Lumo Test", "-c", "user.email=lumo@example.test", "commit", "-m", "baseline"], repoCopy);
    await writeFile(path.join(repoCopy, "src/index.ts"), "export const hello = (name: string) => `Hello, ${name}!`;\n", "utf8");

    const result = await runCli([
      "checkpoint",
      "--path",
      repoCopy,
      "--task",
      "Update the greeting helper.",
    ]);

    assert.equal(result.code, 0);
    assert.match(result.stdout, /# Lumo Checkpoint/);
    assert.match(result.stdout, /## Status: go/);
    assert.match(result.stdout, /src\/index\.ts/);
    assert.match(result.stdout, /Read-only/);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("checkpoint supports machine-readable json", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "lumo-checkpoint-json-"));
  const repoCopy = path.join(outputDir, "repo");

  try {
    await cp(path.join(repoRoot, "fixtures/minimal-ts"), repoCopy, { recursive: true });
    await runProcess("git", ["init"], repoCopy);
    await runProcess("git", ["add", "."], repoCopy);
    await runProcess("git", ["-c", "user.name=Lumo Test", "-c", "user.email=lumo@example.test", "commit", "-m", "baseline"], repoCopy);
    await writeFile(path.join(repoCopy, "src/auth.ts"), "export const canAccess = true;\n", "utf8");

    const result = await runCli([
      "checkpoint",
      "--path",
      repoCopy,
      "--task",
      "Update the greeting helper.",
      "--format",
      "json",
    ]);
    const parsed = JSON.parse(result.stdout) as {
      checkpoint: {
        status: string;
        riskSignal: string;
      };
    };

    assert.equal(result.code, 0);
    assert.equal(parsed.checkpoint.status, "pause");
    assert.match(parsed.checkpoint.riskSignal, /auth\/session\/security/i);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("checkpoint can include optional Codex interpretation", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "lumo-checkpoint-codex-"));
  const repoCopy = path.join(outputDir, "repo");
  const fakeDir = await mkdtemp(path.join(os.tmpdir(), "lumo-fake-codex-"));
  const fakeCodex = path.join(fakeDir, "codex");

  try {
    await writeFakeCodex(fakeCodex);
    await cp(path.join(repoRoot, "fixtures/minimal-ts"), repoCopy, { recursive: true });
    await runProcess("git", ["init"], repoCopy);
    await runProcess("git", ["add", "."], repoCopy);
    await runProcess("git", ["-c", "user.name=Lumo Test", "-c", "user.email=lumo@example.test", "commit", "-m", "baseline"], repoCopy);
    await writeFile(path.join(repoCopy, "src/index.ts"), "export const hello = (name: string) => `Hello, ${name}!`;\n", "utf8");

    const result = await runCli(
      [
        "checkpoint",
        "--path",
        repoCopy,
        "--task",
        "Update the greeting helper.",
        "--with-codex",
        "--format",
        "json",
      ],
      { LUMO_CODEX_BIN: fakeCodex, LUMO_FAKE_CODEX_MODE: "checkpoint" },
    );
    const parsed = JSON.parse(result.stdout) as {
      checkpoint: {
        status: string;
        mode: string;
        why: string;
      };
      codexCheckpoint: {
        status: string;
      };
    };

    assert.equal(result.code, 0);
    assert.equal(parsed.codexCheckpoint.status, "success");
    assert.equal(parsed.checkpoint.status, "check_again");
    assert.equal(parsed.checkpoint.mode, "deterministic_plus_codex");
    assert.match(parsed.checkpoint.why, /Fake Codex interpreted/i);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
    await rm(fakeDir, { recursive: true, force: true });
  }
});

test("checkpoint requires task text", async () => {
  const result = await runCli(["checkpoint", "--path", "fixtures/nextjs-dashboard-action-risk"]);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /--task is required for checkpoint/);
});

test("review prints a read-only completion card from git changes", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "lumo-review-"));
  const repoCopy = path.join(outputDir, "repo");

  try {
    await cp(path.join(repoRoot, "fixtures/minimal-ts"), repoCopy, { recursive: true });
    await runProcess("git", ["init"], repoCopy);
    await runProcess("git", ["add", "."], repoCopy);
    await runProcess("git", ["-c", "user.name=Lumo Test", "-c", "user.email=lumo@example.test", "commit", "-m", "baseline"], repoCopy);
    await writeFile(path.join(repoCopy, "src/index.ts"), "export const hello = (name: string) => `Hello, ${name}!`;\n", "utf8");

    const result = await runCli([
      "review",
      "--path",
      repoCopy,
      "--task",
      "Update the greeting helper.",
    ]);

    assert.equal(result.code, 0);
    assert.match(result.stdout, /# Lumo Review/);
    assert.match(result.stdout, /## Status: check_again/);
    assert.match(result.stdout, /no test-like file/i);
    assert.match(result.stdout, /Read-only/);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("review supports machine-readable json", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "lumo-review-json-"));
  const repoCopy = path.join(outputDir, "repo");

  try {
    await cp(path.join(repoRoot, "fixtures/minimal-ts"), repoCopy, { recursive: true });
    await runProcess("git", ["init"], repoCopy);
    await runProcess("git", ["add", "."], repoCopy);
    await runProcess("git", ["-c", "user.name=Lumo Test", "-c", "user.email=lumo@example.test", "commit", "-m", "baseline"], repoCopy);
    await writeFile(path.join(repoCopy, "src/index.test.ts"), "import './index';\n", "utf8");

    const result = await runCli([
      "review",
      "--path",
      repoCopy,
      "--task",
      "Update the greeting helper.",
      "--format",
      "json",
    ]);
    const parsed = JSON.parse(result.stdout) as {
      review: {
        status: string;
        proofSignal: string;
      };
    };

    assert.equal(result.code, 0);
    assert.equal(parsed.review.status, "go");
    assert.match(parsed.review.proofSignal, /test-like file changed/i);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("review can include optional Codex interpretation", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "lumo-review-codex-"));
  const repoCopy = path.join(outputDir, "repo");
  const fakeDir = await mkdtemp(path.join(os.tmpdir(), "lumo-fake-codex-"));
  const fakeCodex = path.join(fakeDir, "codex");

  try {
    await writeFakeCodex(fakeCodex);
    await cp(path.join(repoRoot, "fixtures/minimal-ts"), repoCopy, { recursive: true });
    await runProcess("git", ["init"], repoCopy);
    await runProcess("git", ["add", "."], repoCopy);
    await runProcess("git", ["-c", "user.name=Lumo Test", "-c", "user.email=lumo@example.test", "commit", "-m", "baseline"], repoCopy);
    await writeFile(path.join(repoCopy, "src/index.ts"), "export const hello = (name: string) => `Hello, ${name}!`;\n", "utf8");

    const result = await runCli(
      [
        "review",
        "--path",
        repoCopy,
        "--task",
        "Update the greeting helper.",
        "--with-codex",
        "--format",
        "json",
      ],
      { LUMO_CODEX_BIN: fakeCodex, LUMO_FAKE_CODEX_MODE: "review" },
    );
    const parsed = JSON.parse(result.stdout) as {
      review: {
        status: string;
        mode: string;
        why: string;
      };
      codexReview: {
        status: string;
      };
    };

    assert.equal(result.code, 0);
    assert.equal(parsed.codexReview.status, "success");
    assert.equal(parsed.review.status, "check_again");
    assert.equal(parsed.review.mode, "deterministic_plus_codex");
    assert.match(parsed.review.why, /Fake Codex interpreted/i);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
    await rm(fakeDir, { recursive: true, force: true });
  }
});

test("review requires task text", async () => {
  const result = await runCli(["review", "--path", "fixtures/nextjs-dashboard-action-risk"]);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /--task is required for review/);
});

test("thread-checkpoint prints a read-only steering card from a packet", async () => {
  const result = await runCli([
    "thread-checkpoint",
    "--input",
    "docs/cases/tab-3017-thread-checkpoint.md",
    "--task",
    "Decide whether TAB-3017 should still be framed as direct-send.",
  ]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /# Lumo Thread Checkpoint/);
  assert.match(result.stdout, /## Status: pivot/);
  assert.match(result.stdout, /Direct-send can possibly cause duplicate outbound/i);
  assert.match(result.stdout, /Reframe TAB-3017/i);
  assert.match(result.stdout, /Read-only: no files were written/);
});

test("thread-checkpoint supports machine-readable json", async () => {
  const result = await runCli([
    "thread-checkpoint",
    "--input",
    "docs/cases/tab-3017-thread-checkpoint.md",
    "--format",
    "json",
  ]);
  const parsed = JSON.parse(result.stdout) as {
    threadCheckpoint: {
      status: string;
      notProven: string[];
      recommendation: string;
    };
  };

  assert.equal(result.code, 0);
  assert.equal(parsed.threadCheckpoint.status, "pivot");
  assert.ok(parsed.threadCheckpoint.notProven.some((item) => /direct-send/i.test(item)));
  assert.match(parsed.threadCheckpoint.recommendation, /Reframe TAB-3017/i);
});

test("thread-checkpoint requires input", async () => {
  const result = await runCli(["thread-checkpoint"]);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /--input is required for thread-checkpoint/);
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

function runProcess(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with ${code}: ${stderr}`));
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
      "if [ \"$LUMO_FAKE_CODEX_MODE\" = \"preflight\" ]; then",
      "  cat > \"$out\" <<'EOF'",
      "{",
      "  \"status\": \"check_again\",",
      "  \"why\": \"Fake Codex interpreted the task and wants one context check first.\",",
      "  \"route\": \"Inspect the target component and nearest tests before implementation.\",",
      "  \"contextNeeded\": [\"Target component\", \"Nearest test or fixture\"],",
      "  \"stopIf\": [\"The slice expands into auth, billing, database, or provider behavior\"],",
      "  \"userDecision\": \"Let the agent inspect context first, then continue if still local.\",",
      "  \"notVerified\": [\"No runtime behavior was checked by fake Codex\"]",
      "}",
      "EOF",
      "  exit 0",
      "fi",
      "if [ \"$LUMO_FAKE_CODEX_MODE\" = \"checkpoint\" ]; then",
      "  cat > \"$out\" <<'EOF'",
      "{",
      "  \"status\": \"check_again\",",
      "  \"why\": \"Fake Codex interpreted the in-progress diff and wants one verification check first.\",",
      "  \"route\": \"Run the narrow verification command before continuing.\",",
      "  \"scopeSignal\": \"Small diff, but verification is UNCONFIRMED.\",",
      "  \"riskSignal\": \"No risky files detected by fake Codex.\",",
      "  \"stopIf\": [\"The diff expands beyond the greeting helper\"],",
      "  \"userDecision\": \"Let the agent verify before continuing.\",",
      "  \"notVerified\": [\"No real verification was run by fake Codex\"]",
      "}",
      "EOF",
      "  exit 0",
      "fi",
      "if [ \"$LUMO_FAKE_CODEX_MODE\" = \"review\" ]; then",
      "  cat > \"$out\" <<'EOF'",
      "{",
      "  \"status\": \"check_again\",",
      "  \"why\": \"Fake Codex interpreted the review state and wants verification before done.\",",
      "  \"completionSignal\": \"The diff may solve the task, but completion is UNCONFIRMED.\",",
      "  \"proofSignal\": \"No real verification was run by fake Codex.\",",
      "  \"riskSignal\": \"No risky files detected by fake Codex.\",",
      "  \"recommendation\": \"Run the narrow verification command before claiming done.\",",
      "  \"userDecision\": \"Let the agent verify before final answer.\",",
      "  \"notVerified\": [\"No real verification was run by fake Codex\"]",
      "}",
      "EOF",
      "  exit 0",
      "fi",
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
