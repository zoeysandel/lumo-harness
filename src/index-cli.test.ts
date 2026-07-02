import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmod, cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
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

test("thread-checkpoint accepts piped stdin", async () => {
  const packet = await readFile(path.join(repoRoot, "docs/cases/tab-3017-thread-checkpoint.md"), "utf8");
  const result = await runCli(
    [
      "thread-checkpoint",
      "--stdin",
      "--task",
      "Decide whether TAB-3017 should still be framed as direct-send.",
      "--format",
      "json",
    ],
    {},
    packet,
  );
  const parsed = JSON.parse(result.stdout) as {
    inputPath: string | null;
    inputSource: string;
    threadCheckpoint: {
      status: string;
      evidenceUsed: string[];
    };
  };

  assert.equal(result.code, 0);
  assert.equal(parsed.inputPath, null);
  assert.equal(parsed.inputSource, "stdin");
  assert.equal(parsed.threadCheckpoint.status, "pivot");
  assert.ok(parsed.threadCheckpoint.evidenceUsed.some((item) => /Input packet: stdin/i.test(item)));
});

test("thread-checkpoint accepts --input - as stdin", async () => {
  const packet = await readFile(path.join(repoRoot, "docs/cases/tab-3017-thread-checkpoint.md"), "utf8");
  const result = await runCli(["thread-checkpoint", "--input", "-", "--format", "json"], {}, packet);
  const parsed = JSON.parse(result.stdout) as {
    inputSource: string;
    threadCheckpoint: {
      status: string;
    };
  };

  assert.equal(result.code, 0);
  assert.equal(parsed.inputSource, "stdin");
  assert.equal(parsed.threadCheckpoint.status, "pivot");
});

test("thread-checkpoint requires input", async () => {
  const result = await runCli(["thread-checkpoint"]);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /--input or --stdin is required for thread-checkpoint/);
});

test("thread-checkpoint rejects empty stdin packets", async () => {
  const result = await runCli(["thread-checkpoint", "--stdin"], {}, "");

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Thread checkpoint input must be a non-empty packet/);
});

test("harness-map prints a read-only cockpit map", async () => {
  const result = await runCli(["harness-map", "--path", "fixtures/nextjs-dashboard-action-risk"]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /# Lumo Harness Map/);
  assert.match(result.stdout, /## Status: check_again|## Status: pause/);
  assert.match(result.stdout, /## Global\/User Layer/);
  assert.match(result.stdout, /## Privacy Boundary/);
  assert.match(result.stdout, /Read-only: no files were written and no external systems were queried/);
});

test("harness-map supports machine-readable json", async () => {
  const result = await runCli(["harness-map", "--path", "fixtures/nextjs-dashboard-action-risk", "--format", "json"]);
  const parsed = JSON.parse(result.stdout) as {
    repoPath: string;
    harnessMap: {
      status: string;
      mode: string;
      layers: { commands: { items: Array<{ label: string }> } };
    };
  };

  assert.equal(result.code, 0);
  assert.ok(parsed.repoPath.endsWith("fixtures/nextjs-dashboard-action-risk"));
  assert.ok(["check_again", "pause"].includes(parsed.harnessMap.status));
  assert.equal(parsed.harnessMap.mode, "deterministic");
  assert.ok(parsed.harnessMap.layers.commands.items.some((item) => item.label === "build"));
});

test("harness-map detects explicit fake Codex and Agents homes without rendering bodies", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lumo-cli-harness-map-"));
  const codexHome = path.join(root, "codex");
  const agentsHome = path.join(root, "agents");

  try {
    await writeFile(path.join(root, "placeholder"), "", "utf8");
    await mkdir(path.join(codexHome, "skills", "map-skill"), { recursive: true });
    await mkdir(path.join(agentsHome, "skills", "agent-map-skill"), { recursive: true });
    await mkdir(path.join(codexHome, "plugins", "map-plugin"), { recursive: true });
    await writeFile(path.join(codexHome, "AGENTS.md"), "SECRET CODEX BODY\n", "utf8");
    await writeFile(path.join(agentsHome, "AGENTS.md"), "SECRET AGENTS BODY\n", "utf8");
    await writeFile(path.join(codexHome, "skills", "map-skill", "SKILL.md"), "SECRET SKILL BODY\n", "utf8");
    await writeFile(path.join(agentsHome, "skills", "agent-map-skill", "SKILL.md"), "SECRET AGENT SKILL BODY\n", "utf8");
    await writeFile(path.join(codexHome, "plugins", "map-plugin", "plugin.json"), '{"name":"map-plugin"}\n', "utf8");

    const result = await runCli([
      "harness-map",
      "--path",
      "fixtures/nextjs-dashboard-action-risk",
      "--codex-home",
      codexHome,
      "--agents-home",
      agentsHome,
      "--format",
      "json",
    ]);
    const parsed = JSON.parse(result.stdout) as {
      harnessMap: {
        layers: {
          globalCodex: { status: string };
          globalAgents: { status: string };
          skills: { items: Array<{ label: string }> };
          plugins: { items: Array<{ label: string }> };
        };
      };
    };

    assert.equal(result.code, 0);
    assert.equal(parsed.harnessMap.layers.globalCodex.status, "found");
    assert.equal(parsed.harnessMap.layers.globalAgents.status, "found");
    assert.ok(parsed.harnessMap.layers.skills.items.some((item) => item.label === "map-skill"));
    assert.ok(parsed.harnessMap.layers.plugins.items.some((item) => item.label === "map-plugin"));
    assert.doesNotMatch(result.stdout, /SECRET/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("harness-map does not write to the target repo", async () => {
  const before = await snapshotFiles(dashboardFixturePath);
  const result = await runCli(["harness-map", "--path", "fixtures/nextjs-dashboard-action-risk"]);
  const after = await snapshotFiles(dashboardFixturePath);

  assert.equal(result.code, 0);
  assert.deepEqual(after, before);
});

test("route prints a read-only route card", async () => {
  const result = await runCli([
    "route",
    "--path",
    "fixtures/nextjs-dashboard-action-risk",
    "--task",
    "Debug the failing health check test",
  ]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /# Lumo Route/);
  assert.match(result.stdout, /## Mode: bugfix_investigation/);
  assert.match(result.stdout, /preflight/);
  assert.match(result.stdout, /Read-only: no files were written and no external systems were queried/);
});

test("route supports machine-readable json", async () => {
  const result = await runCli([
    "route",
    "--path",
    "fixtures/nextjs-dashboard-action-risk",
    "--task",
    "Review this PR and check CI before merge",
    "--format",
    "json",
  ]);
  const parsed = JSON.parse(result.stdout) as {
    repoPath: string | null;
    route: {
      mode: string;
      recommendedTools: Array<{ tool: string }>;
    };
  };

  assert.equal(result.code, 0);
  assert.ok(parsed.repoPath?.endsWith("fixtures/nextjs-dashboard-action-risk"));
  assert.equal(parsed.route.mode, "pr_release");
  assert.equal(parsed.route.recommendedTools[0]?.tool, "pr-status");
});

test("route requires task text", async () => {
  const missing = await runCli(["route", "--path", "fixtures/nextjs-dashboard-action-risk"]);
  const blank = await runCli(["route", "--task", "   "]);

  assert.equal(missing.code, 2);
  assert.match(missing.stderr, /--task is required for route/);
  assert.equal(blank.code, 2);
  assert.match(blank.stderr, /--task is required for route/);
});

test("route --no-scan works without a repo path", async () => {
  const result = await runCli(["route", "--no-scan", "--task", "Explain the current behavior", "--format", "json"]);
  const parsed = JSON.parse(result.stdout) as {
    repoPath: string | null;
    route: { mode: string; surface: string; recommendedTools: unknown[] };
  };

  assert.equal(result.code, 0);
  assert.equal(parsed.repoPath, null);
  assert.equal(parsed.route.mode, "tiny_answer");
  assert.equal(parsed.route.surface, "silent");
  assert.deepEqual(parsed.route.recommendedTools, []);
});

test("route consumes minimal harness-map json context", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lumo-route-map-"));
  const mapPath = path.join(root, "map.json");

  try {
    await writeFile(
      mapPath,
      JSON.stringify({ harnessMap: { status: "check_again", gaps: ["No repo AGENTS.md"], notVerified: ["Map fixture partial"] } }),
      "utf8",
    );
    const result = await runCli([
      "route",
      "--no-scan",
      "--map",
      mapPath,
      "--task",
      "Add a settings page empty state",
      "--format",
      "json",
    ]);
    const parsed = JSON.parse(result.stdout) as {
      route: {
        status: string;
        recommendedTools: Array<{ tool: string }>;
        notVerified: string[];
      };
    };

    assert.equal(result.code, 0);
    assert.equal(parsed.route.status, "check_again");
    assert.equal(parsed.route.recommendedTools[0]?.tool, "harness-map");
    assert.ok(parsed.route.notVerified.includes("Map fixture partial"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("route does not write to the target repo", async () => {
  const before = await snapshotFiles(dashboardFixturePath);
  const result = await runCli([
    "route",
    "--path",
    "fixtures/nextjs-dashboard-action-risk",
    "--task",
    "Add a small docs note",
  ]);
  const after = await snapshotFiles(dashboardFixturePath);

  assert.equal(result.code, 0);
  assert.deepEqual(after, before);
});

test("learn prints a read-only proposal card from file input", async () => {
  const result = await runCli([
    "learn",
    "--input",
    "docs/cases/lumo-learn-dogfood.md",
    "--task",
    "Learn from repeated release status friction",
  ]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /# Lumo Learn/);
  assert.match(result.stdout, /## Status: go/);
  assert.match(result.stdout, /Type: deterministic_check|Type: workflow_note/);
  assert.match(result.stdout, /Read-only: no files were written and no external systems were queried/);
});

test("learn supports machine-readable json and optional repo scan", async () => {
  const result = await runCli([
    "learn",
    "--input",
    "docs/cases/lumo-learn-dogfood.md",
    "--path",
    "fixtures/nextjs-dashboard-action-risk",
    "--format",
    "json",
  ]);
  const parsed = JSON.parse(result.stdout) as {
    inputPath: string | null;
    inputSource: string;
    task: string | null;
    learn: {
      mode: string;
      proposal: { type: string };
      evidence: string[];
    };
  };

  assert.equal(result.code, 0);
  assert.ok(parsed.inputPath?.endsWith("docs/cases/lumo-learn-dogfood.md"));
  assert.equal(parsed.inputSource, "file");
  assert.equal(parsed.task, null);
  assert.equal(parsed.learn.mode, "deterministic");
  assert.ok(parsed.learn.evidence.some((item) => /Repo scanned:/i.test(item)));
});

test("learn accepts piped stdin", async () => {
  const packet = "# Lumo Learn Packet\n\n## Friction\n- CI setup failed again.\n\n## Repeated Signal\n- repeated\n\n## Evidence\n- Redacted facts.\n\n## Desired Next Time\n- Add a check.\n";
  const result = await runCli(["learn", "--stdin", "--format", "json"], {}, packet);
  const parsed = JSON.parse(result.stdout) as {
    inputPath: string | null;
    inputSource: string;
    learn: { proposal: { type: string } };
  };

  assert.equal(result.code, 0);
  assert.equal(parsed.inputPath, null);
  assert.equal(parsed.inputSource, "stdin");
  assert.equal(parsed.learn.proposal.type, "deterministic_check");
});

test("learn accepts --input - as stdin", async () => {
  const packet = "# Lumo Learn Packet\n\n## Friction\n- Approval gate missed again.\n\n## Repeated Signal\n- repeated\n\n## Evidence\n- Redacted facts.\n\n## Desired Next Time\n- Add a repo rule.\n";
  const result = await runCli(["learn", "--input", "-", "--format", "json"], {}, packet);
  const parsed = JSON.parse(result.stdout) as {
    inputSource: string;
    learn: { proposal: { type: string } };
  };

  assert.equal(result.code, 0);
  assert.equal(parsed.inputSource, "stdin");
  assert.equal(parsed.learn.proposal.type, "repo_rule");
});

test("learn requires input and rejects empty packets", async () => {
  const missing = await runCli(["learn"]);
  const empty = await runCli(["learn", "--stdin"], {}, "");

  assert.equal(missing.code, 2);
  assert.match(missing.stderr, /--input or --stdin is required for learn/);
  assert.equal(empty.code, 1);
  assert.match(empty.stderr, /Learn input must be a non-empty packet/);
});

test("learn does not echo raw sensitive content", async () => {
  const packet = "# Lumo Learn Packet\n\n## Friction\n- secret token abc123 touched production CRM again.\n\n## Repeated Signal\n- repeated\n\n## Evidence\n- token abc123\n\n## Desired Next Time\n- Add a rule.\n";
  const result = await runCli(["learn", "--stdin"], {}, packet);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /## Status: pause/);
  assert.match(result.stdout, /Sensitive content present; not echoed/);
  assert.doesNotMatch(result.stdout, /abc123/);
});

test("learn does not write to the target repo", async () => {
  const before = await snapshotFiles(dashboardFixturePath);
  const result = await runCli([
    "learn",
    "--input",
    "docs/cases/lumo-learn-dogfood.md",
    "--path",
    "fixtures/nextjs-dashboard-action-risk",
  ]);
  const after = await snapshotFiles(dashboardFixturePath);

  assert.equal(result.code, 0);
  assert.deepEqual(after, before);
});

test("pr-status prints a read-only GitHub PR steering card", async () => {
  const fakeDir = await mkdtemp(path.join(os.tmpdir(), "lumo-fake-gh-"));
  const fakeGh = path.join(fakeDir, "gh");

  try {
    await writeFakeGh(fakeGh);
    const result = await runCli(
      ["pr-status", "--repo", "tabmedianl/linkwise-backend", "--pr", "2192"],
      { LUMO_GH_BIN: fakeGh },
    );

    assert.equal(result.code, 0);
    assert.match(result.stdout, /# Lumo PR Status/);
    assert.match(result.stdout, /## Status: go/);
    assert.match(result.stdout, /release-gate-evaluator/);
    assert.match(result.stdout, /Active bot findings: 0/);
    assert.match(result.stdout, /Read-only: no GitHub mutation was performed/);
  } finally {
    await rm(fakeDir, { recursive: true, force: true });
  }
});

test("pr-status supports machine-readable json", async () => {
  const fakeDir = await mkdtemp(path.join(os.tmpdir(), "lumo-fake-gh-"));
  const fakeGh = path.join(fakeDir, "gh");

  try {
    await writeFakeGh(fakeGh);
    const result = await runCli(
      ["pr-status", "--repo", "tabmedianl/linkwise-backend", "--pr", "2192", "--format", "json"],
      { LUMO_GH_BIN: fakeGh },
    );
    const parsed = JSON.parse(result.stdout) as {
      prStatus: {
        status: string;
        reviewThreads: {
          activeBotFindings: number;
          outdatedUnresolved: number;
        };
      };
    };

    assert.equal(result.code, 0);
    assert.equal(parsed.prStatus.status, "go");
    assert.equal(parsed.prStatus.reviewThreads.activeBotFindings, 0);
    assert.equal(parsed.prStatus.reviewThreads.outdatedUnresolved, 1);
  } finally {
    await rm(fakeDir, { recursive: true, force: true });
  }
});

test("pr-status requires repo and PR number", async () => {
  const missingRepo = await runCli(["pr-status", "--pr", "2192"]);
  const missingPr = await runCli(["pr-status", "--repo", "tabmedianl/linkwise-backend"]);

  assert.equal(missingRepo.code, 2);
  assert.match(missingRepo.stderr, /--repo is required/);
  assert.equal(missingPr.code, 2);
  assert.match(missingPr.stderr, /--pr is required/);
});

function runCli(
  args: string[],
  env: Record<string, string> = {},
  stdin?: string,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", cliPath, ...args], {
      cwd: repoRoot,
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdin.end(stdin ?? "");
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

async function writeFakeGh(fakeGh: string): Promise<void> {
  await writeFile(
    fakeGh,
    [
      "#!/usr/bin/env node",
      "const args = process.argv.slice(2);",
      "if (args[0] === 'pr' && args[1] === 'view') {",
      "  console.log(JSON.stringify({",
      "    number: 2192,",
      "    title: 'Release develop to main',",
      "    url: 'https://github.com/tabmedianl/linkwise-backend/pull/2192',",
      "    state: 'OPEN',",
      "    isDraft: false,",
      "    baseRefName: 'main',",
      "    headRefName: 'codex-release',",
      "    headRefOid: 'abc123',",
      "    mergeable: 'MERGEABLE',",
      "    mergeStateStatus: 'CLEAN',",
      "    reviewDecision: 'APPROVED',",
      "    statusCheckRollup: [",
      "      { name: 'verify-prod-migrations', status: 'COMPLETED', conclusion: 'SUCCESS' },",
      "      { name: 'release-gate-evaluator', status: 'COMPLETED', conclusion: 'SUCCESS' }",
      "    ]",
      "  }));",
      "  process.exit(0);",
      "}",
      "if (args[0] === 'api' && args[1] === 'graphql') {",
      "  console.log(JSON.stringify({",
      "    data: { repository: { pullRequest: { reviewThreads: { nodes: [",
      "      { isResolved: false, isOutdated: true, comments: { nodes: [",
      "        { author: { login: 'chatgpt-codex-connector' }, body: 'Outdated finding' }",
      "      ] } }",
      "    ] } } } }",
      "  }));",
      "  process.exit(0);",
      "}",
      "console.error('unexpected gh args: ' + args.join(' '));",
      "process.exit(1);",
    ].join("\n"),
    "utf8",
  );
  await chmod(fakeGh, 0o755);
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
