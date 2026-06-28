import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createPreflightCard, mergeCodexPreflightSuggestion, renderPreflightCard } from "./preflight.js";
import { scanRepository } from "./scanner.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const dashboardFixturePath = path.join(repoRoot, "fixtures/nextjs-dashboard-action-risk");

test("preflight returns go for a bounded UI task with local verification rails", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createPreflightCard(scan, "Add a compact empty state to the intake action card.");

  assert.equal(card.status, "go");
  assert.match(card.route, /smallest useful first slice/i);
  assert.ok(card.contextNeeded.some((item) => /target files/i.test(item)));
  assert.ok(card.checks.some((item) => /build|lint/i.test(item)));
  assert.match(card.userDecision, /No user decision/i);
});

test("preflight pauses when a task mentions a risky seam present in the repo", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createPreflightCard(scan, "Update billing and auth behavior before syncing this action to the CRM provider.");

  assert.equal(card.status, "pause");
  assert.match(card.why, /billing\/payment/i);
  assert.match(card.why, /auth\/session/i);
  assert.match(card.why, /provider\/external I\/O/i);
  assert.match(card.route, /read-only discovery/i);
  assert.match(card.userDecision, /Approve the risky seam/i);
  assert.ok(card.stopIf.some((item) => /explicit approval/i.test(item)));
});

test("preflight pivots broad production-ready tasks into a narrower first outcome", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createPreflightCard(scan, "Make the entire app production ready.");

  assert.equal(card.status, "pivot");
  assert.match(card.route, /Narrow the request/i);
  assert.match(card.userDecision, /Choose the first small outcome/i);
});

test("preflight renderer keeps the user-facing card readable", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const task = "Add a compact empty state to the intake action card.";
  const card = createPreflightCard(scan, task);
  const rendered = renderPreflightCard(card, { repoPath: scan.repoPath, task });

  assert.match(rendered, /# Lumo Preflight/);
  assert.match(rendered, /## Status: go/);
  assert.match(rendered, /Mode: deterministic/);
  assert.match(rendered, /## Recommended Route/);
  assert.match(rendered, /## User Decision/);
  assert.match(rendered, /Read-only/);
});

test("Codex suggestion can make a deterministic card more cautious", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const deterministicCard = createPreflightCard(scan, "Add a compact empty state to the intake action card.");
  const merged = mergeCodexPreflightSuggestion(deterministicCard, {
    status: "check_again",
    why: "Codex sees that the UI change may need a fixture update before coding.",
    route: "Inspect the component and fixture first, then make the smallest UI slice.",
    contextNeeded: ["The existing intake action card fixture."],
    stopIf: ["The empty state requires auth or provider behavior."],
    userDecision: "Let the agent inspect the fixture first.",
    notVerified: ["Fixture behavior was not checked yet."],
  });

  assert.equal(merged.status, "check_again");
  assert.equal(merged.mode, "deterministic_plus_codex");
  assert.match(merged.why, /fixture update/i);
  assert.ok(merged.contextNeeded.some((item) => /fixture/i.test(item)));
});

test("Codex suggestion cannot lower the deterministic safety floor", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const deterministicCard = createPreflightCard(
    scan,
    "Update billing and auth behavior before syncing this action to the CRM provider.",
  );
  const merged = mergeCodexPreflightSuggestion(deterministicCard, {
    status: "go",
    why: "Codex thinks this is fine.",
    route: "Implement directly.",
    contextNeeded: [],
    stopIf: [],
    userDecision: "No decision needed.",
    notVerified: [],
  });

  assert.equal(deterministicCard.status, "pause");
  assert.equal(merged.status, "pause");
  assert.match(merged.why, /safety floor/i);
});
