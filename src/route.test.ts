import assert from "node:assert/strict";
import test from "node:test";
import { createRouteCard, renderRouteCard } from "./route.js";
import type { RepoScan } from "./schemas.js";

const baseScan: RepoScan = {
  repoPath: "/tmp/repo",
  scannedAt: "2026-07-02T00:00:00.000Z",
  readiness: "strong_existing_harness",
  readinessReason: "Test scan",
  fileCount: 3,
  stack: {
    packageManager: "npm",
    hasPackageJson: true,
    hasTypeScript: true,
    hasNext: true,
    hasVite: false,
    hasReact: true,
    hasZod: false,
    hasOpenAI: false,
    hasVercelAi: false,
    hasSupabase: false,
  },
  commands: [{ name: "test", command: "node --test", category: "test" }],
  harness: {
    agentRuleFiles: ["AGENTS.md"],
    workflowFiles: [],
    docsFiles: ["README.md"],
    promptFiles: [],
    schemaFiles: [],
    fixtureFiles: [],
    evalFiles: [],
    providerFiles: [],
  },
  risks: {
    hasEnvAccess: false,
    hasExternalProviderCode: false,
    hasDatabaseOrMigrationCode: false,
    hasAuthCode: false,
    hasApiRoutes: false,
  },
  currentRails: ["README.md", "test script"],
  missingRails: [],
  recommendedFirstHarness: "Use existing rails.",
  notVerified: [],
};

test("route classifies tiny answer as silent with no recommended tools", () => {
  const card = createRouteCard({ task: "Explain how this helper works", scan: baseScan });

  assert.equal(card.status, "go");
  assert.equal(card.mode, "tiny_answer");
  assert.equal(card.surface, "silent");
  assert.deepEqual(card.recommendedTools, []);
  assert.equal(card.firstMove, "Answer directly; do not show a Lumo card unless the user asks.");
});

test("route classifies lightweight patch with optional preflight and required review", () => {
  const card = createRouteCard({ task: "Make a small README copy update", scan: baseScan });

  assert.equal(card.status, "go");
  assert.equal(card.mode, "lightweight_patch");
  assert.equal(card.recommendedTools[0]?.tool, "preflight");
  assert.equal(card.recommendedTools[0]?.required, false);
  assert.equal(card.recommendedTools[1]?.tool, "review");
  assert.equal(card.recommendedTools[1]?.required, true);
});

test("route classifies standard feature and can recommend harness-map first from map gaps", () => {
  const card = createRouteCard({
    task: "Add a settings page empty state",
    scan: baseScan,
    harnessMap: { status: "check_again", gaps: ["No scoped workflow"], notVerified: ["Map was partial"] },
  });

  assert.equal(card.status, "check_again");
  assert.equal(card.mode, "standard_feature");
  assert.equal(card.recommendedTools[0]?.tool, "harness-map");
  assert.equal(card.recommendedTools[1]?.tool, "preflight");
  assert.ok(card.notVerified.includes("Map was partial"));
});

test("route classifies bugfix investigation with preflight then checkpoint then review", () => {
  const card = createRouteCard({ task: "Debug the failing test and find the root cause", scan: baseScan });

  assert.equal(card.status, "check_again");
  assert.equal(card.mode, "bugfix_investigation");
  assert.deepEqual(card.recommendedTools.map((tool) => tool.tool), ["preflight", "checkpoint", "review"]);
});

test("route classifies long agent thread with thread-checkpoint", () => {
  const card = createRouteCard({ task: "Continue the autonomous agent thread from this handoff", scan: baseScan });

  assert.equal(card.status, "check_again");
  assert.equal(card.mode, "long_agent_thread");
  assert.equal(card.recommendedTools[0]?.tool, "thread-checkpoint");
});

test("route classifies PR release work with pr-status", () => {
  const card = createRouteCard({ task: "Review this PR and check CI before merge", scan: baseScan });

  assert.equal(card.status, "check_again");
  assert.equal(card.mode, "pr_release");
  assert.equal(card.recommendedTools[0]?.tool, "pr-status");
});

test("route classifies harness improvement with harness-map and optional learn after friction", () => {
  const card = createRouteCard({ task: "Improve Lumo harness workflow after this repeated friction", scan: baseScan });

  assert.equal(card.status, "check_again");
  assert.equal(card.mode, "harness_improvement");
  assert.deepEqual(card.recommendedTools.map((tool) => tool.tool), ["harness-map", "learn"]);
});

test("route escalates risky tasks to pause", () => {
  const card = createRouteCard({ task: "Update billing and production deploy behavior", scan: baseScan });

  assert.equal(card.status, "pause");
  assert.equal(card.surface, "decision_card");
});

test("route escalates broad or parked v0.2 work to pivot", () => {
  const card = createRouteCard({ task: "Build MCP server and make everything production-ready", scan: baseScan });

  assert.equal(card.status, "pivot");
  assert.equal(card.surface, "decision_card");
});

test("route renderer includes required headings and read-only footer", () => {
  const card = createRouteCard({ task: "Add a settings page empty state", scan: baseScan });
  const rendered = renderRouteCard(card, { repoPath: baseScan.repoPath, task: "Add a settings page empty state" });

  assert.match(rendered, /# Lumo Route/);
  assert.match(rendered, /## Status:/);
  assert.match(rendered, /## Mode:/);
  assert.match(rendered, /## Recommended Tools/);
  assert.match(rendered, /Read-only: no files were written and no external systems were queried/);
});

test("route rejects blank tasks", () => {
  assert.throws(() => createRouteCard({ task: "  ", scan: baseScan }), /--task is required for route/);
});
