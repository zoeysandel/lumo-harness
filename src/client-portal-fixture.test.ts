import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";
import { scanRepository } from "./scanner.js";

const execFileAsync = promisify(execFile);
const fixtureRoot = new URL("../fixtures/nextjs-client-portal-risk/", import.meta.url);

test("client portal dogfood fixture verifies before Codex changes it", async () => {
  const requiredFiles = [
    "README.md",
    "package.json",
    "tsconfig.json",
    "scripts/verify.mjs",
    "src/app/page.tsx",
    "src/app/api/health/route.ts",
    "src/components/client-card.tsx",
    "src/lib/http.ts",
    "src/lib/auth.ts",
    "src/lib/db.ts",
    "src/lib/email-provider.ts",
    "src/lib/crm.ts",
    "src/lib/billing.ts",
  ];

  for (const file of requiredFiles) {
    const stats = await stat(new URL(file, fixtureRoot));
    assert.equal(stats.isFile(), true, `${file} should exist in the client portal fixture`);
  }

  const { stdout } = await execFileAsync("node", ["scripts/verify.mjs"], {
    cwd: fixtureRoot,
  });

  assert.match(stdout, /fixture verification passed/i);
});

test("client portal dogfood case is wired into the Codex eval runner", async () => {
  const evalRunner = await readFile(new URL("../scripts/eval-codex-comparison.ts", import.meta.url), "utf8");

  assert.match(evalRunner, /"nextjs-client-portal-risk"/);
  assert.match(evalRunner, /Add a production-ready client escalation workflow/i);
  assert.match(evalRunner, /src\/components\/client-card\.tsx/);
  assert.match(evalRunner, /src\/lib\/http\.ts/);
  assert.match(evalRunner, /src\/lib\/email-provider\.ts/);
  assert.match(evalRunner, /sendClientEscalationToCrm/);
  assert.match(evalRunner, /createBillingReview/);
  assert.match(evalRunner, /CLIENT_BILLING_TOKEN/);
});

test("Codex eval runner captures workflow papercuts outside repo diffs", async () => {
  const evalRunner = await readFile(new URL("../scripts/eval-codex-comparison.ts", import.meta.url), "utf8");

  assert.match(evalRunner, /os\.tmpdir/);
  assert.match(evalRunner, /lumo-harness-workflow-papercuts/);
  assert.match(evalRunner, /LUMO_WORKFLOW_PAPERCUT_LOG/);
  assert.match(evalRunner, /workflow-papercuts\.md/);
  assert.match(evalRunner, /Do not write this file inside the repo/);
  assert.match(evalRunner, /Workflow Papercut Logs/);
});

test("client portal dogfood fixture scans as a TypeScript Next.js repo with risk seams", async () => {
  const scan = await scanRepository({ repoPath: fixtureRoot.pathname });

  assert.equal(scan.stack.hasTypeScript, true);
  assert.equal(scan.stack.hasNext, true);
  assert.equal(scan.stack.hasReact, true);
  assert.equal(scan.risks.hasAuthCode, true);
  assert.equal(scan.risks.hasEnvAccess, true);
  assert.equal(scan.risks.hasApiRoutes, true);
  assert.ok(scan.commands.some((command) => command.name === "build"));
});
