import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { generatePreviewPack } from "./preview.js";
import { renderReadinessReport } from "./reporter.js";
import { scanRepository } from "./scanner.js";

const minimalFixture = fileURLToPath(new URL("../fixtures/minimal-ts/", import.meta.url));
const strongFixture = fileURLToPath(new URL("../fixtures/strong-ts/", import.meta.url));
const dashboardFixture = fileURLToPath(new URL("../fixtures/nextjs-dashboard-action-risk/", import.meta.url));

test("minimal TypeScript repo gets missing agent rails", async () => {
  const scan = await scanRepository({ repoPath: minimalFixture });

  assert.equal(scan.stack.hasTypeScript, true);
  assert.equal(scan.harness.agentRuleFiles.length, 0);
  assert.ok(["not_ready", "partial"].includes(scan.readiness));
  assert.equal(scan.missingRails[0]?.suggestedFile, "AGENTS.md");
});

test("strong TypeScript fixture detects existing rails", async () => {
  const scan = await scanRepository({ repoPath: strongFixture });

  assert.ok(scan.harness.agentRuleFiles.includes("AGENTS.md"));
  assert.equal(scan.stack.hasZod, true);
  assert.ok(["agent_ready_with_gaps", "strong_existing_harness"].includes(scan.readiness));
});

test("report and preview remain read-only", async () => {
  const scan = await scanRepository({ repoPath: strongFixture });
  const report = renderReadinessReport(scan);
  const preview = generatePreviewPack(scan);

  assert.match(report, /No files were written/);
  assert.equal(preview.mode, "preview_only");
  assert.ok(preview.files.some((file) => file.path === "AGENTS.md.draft"));
});

test("Next.js preview includes implementation quality rails", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixture });
  const preview = generatePreviewPack(scan);
  const agents = preview.files.find((file) => file.path === "AGENTS.md.draft")?.content ?? "";

  assert.equal(scan.stack.hasNext, true);
  assert.match(agents, /TypeScript\/Next\.js Quality Bar/);
  assert.match(agents, /dependency injection at risky boundaries/i);
  assert.match(agents, /repository\/service pattern/i);
  assert.match(agents, /Apply SOLID pragmatically/i);
  assert.match(agents, /Apply DRY after the second real duplication/i);
  assert.match(agents, /colocated tests or fixtures/i);
});
