import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";
import { scanRepository } from "./scanner.js";

const execFileAsync = promisify(execFile);
const fixtureRoot = new URL("../fixtures/nextjs-ops-console-advanced-risk/", import.meta.url);

test("ops console advanced fixture verifies before Codex changes it", async () => {
  const requiredFiles = [
    "README.md",
    "package.json",
    "tsconfig.json",
    "scripts/verify.mjs",
    "src/app/page.tsx",
    "src/app/accounts/[accountId]/page.tsx",
    "src/app/api/ops/impact-preview/route.ts",
    "src/components/action-panel.tsx",
    "src/components/risk-badge.tsx",
    "src/lib/http.ts",
    "src/lib/validation/impact-preview.ts",
    "src/lib/risk-seams/auth.ts",
    "src/lib/risk-seams/db.ts",
    "src/lib/risk-seams/provider-api.ts",
    "src/lib/risk-seams/billing.ts",
    "src/lib/risk-seams/notifications.ts",
    "src/lib/risk-seams/audit-log.ts",
    "src/lib/risk-seams/ai-provider.ts",
  ];

  for (const file of requiredFiles) {
    const stats = await stat(new URL(file, fixtureRoot));
    assert.equal(stats.isFile(), true, `${file} should exist in the ops console fixture`);
  }

  const { stdout } = await execFileAsync("node", ["scripts/verify.mjs"], {
    cwd: fixtureRoot,
  });

  assert.match(stdout, /fixture verification passed/i);
});

test("ops console advanced case is wired into the Codex eval runner", async () => {
  const evalRunner = await readFile(new URL("../scripts/eval-codex-comparison.ts", import.meta.url), "utf8");

  assert.match(evalRunner, /"nextjs-ops-console-advanced-risk"/);
  assert.match(evalRunner, /containment-plan workflow/i);
  assert.match(evalRunner, /ActionPanel/);
  assert.match(evalRunner, /RiskBadge/);
  assert.match(evalRunner, /src\/lib\/risk-seams\/\*/);
  assert.match(evalRunner, /Client interaction added/);
  assert.match(evalRunner, /Browser-to-route fetch added/);
});

test("ops console fixture does not publish first-slice answer key in README", async () => {
  const readme = await readFile(new URL("README.md", fixtureRoot), "utf8");

  assert.doesNotMatch(readme, /Intended Eval Prompt/i);
  assert.doesNotMatch(readme, /The first slice should add/i);
  assert.match(readme, /Product Pressure/i);
  assert.match(readme, /coding agent must decide[\s\S]*workflow depth belongs/i);
});

test("ops console advanced fixture scans as a TypeScript Next.js repo with app routes", async () => {
  const scan = await scanRepository({ repoPath: fixtureRoot.pathname });

  assert.equal(scan.stack.hasTypeScript, true);
  assert.equal(scan.stack.hasNext, true);
  assert.equal(scan.stack.hasReact, true);
  assert.equal(scan.risks.hasAuthCode, true);
  assert.equal(scan.risks.hasApiRoutes, true);
  assert.ok(scan.commands.some((command) => command.name === "build"));
});
