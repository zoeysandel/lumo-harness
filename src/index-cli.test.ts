import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
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

function runCli(args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", cliPath, ...args], {
      cwd: repoRoot,
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
