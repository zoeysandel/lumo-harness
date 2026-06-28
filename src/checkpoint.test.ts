import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { GitCheckpointState } from "./checkpoint.js";
import { createCheckpointCard, mergeCodexCheckpointSuggestion, renderCheckpointCard } from "./checkpoint.js";
import { scanRepository } from "./scanner.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const dashboardFixturePath = path.join(repoRoot, "fixtures/nextjs-dashboard-action-risk");

test("checkpoint asks to check again when there are no changes yet", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createCheckpointCard(scan, "Add a compact empty state.", gitState([]));

  assert.equal(card.status, "check_again");
  assert.match(card.why, /no current git changes/i);
  assert.match(card.userDecision, /rerun checkpoint/i);
});

test("checkpoint returns go for a small local diff", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createCheckpointCard(
    scan,
    "Add a compact empty state.",
    gitState(["src/components/intake-action-card.tsx", "src/app/page.tsx"]),
  );

  assert.equal(card.status, "go");
  assert.match(card.scopeSignal, /2 files changed/i);
  assert.match(card.riskSignal, /No risky/i);
});

test("checkpoint pauses when risky files are touched", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createCheckpointCard(
    scan,
    "Add a compact empty state.",
    gitState(["src/components/intake-action-card.tsx", "src/lib/auth.ts"]),
  );

  assert.equal(card.status, "pause");
  assert.match(card.why, /risky files/i);
  assert.match(card.riskSignal, /auth\/session\/security/i);
  assert.match(card.userDecision, /Approve the risky seam/i);
});

test("checkpoint pivots when the diff becomes too broad", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createCheckpointCard(
    scan,
    "Add a compact empty state.",
    gitState([
      "src/app/page.tsx",
      "src/components/a.tsx",
      "docs/one.md",
      "scripts/one.mjs",
      "fixtures/a.json",
      "tests/a.test.ts",
      "README.md",
      "package.json",
      "src/lib/ui.ts",
      "src/styles/theme.ts",
      "workflows/feature.md",
    ]),
  );

  assert.equal(card.status, "pivot");
  assert.match(card.route, /split the work/i);
});

test("checkpoint renderer keeps the steering card readable", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const task = "Add a compact empty state.";
  const card = createCheckpointCard(scan, task, gitState(["src/components/intake-action-card.tsx"]));
  const rendered = renderCheckpointCard(card, { repoPath: scan.repoPath, task });

  assert.match(rendered, /# Lumo Checkpoint/);
  assert.match(rendered, /## Status: go/);
  assert.match(rendered, /## Scope Signal/);
  assert.match(rendered, /## Risk Signal/);
  assert.match(rendered, /Read-only/);
});

test("Codex suggestion can make checkpoint more cautious", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const deterministicCard = createCheckpointCard(
    scan,
    "Add a compact empty state.",
    gitState(["src/components/intake-action-card.tsx"]),
  );
  const merged = mergeCodexCheckpointSuggestion(deterministicCard, {
    status: "check_again",
    why: "Codex sees that the changed component may need a fixture update before continuing.",
    route: "Inspect the fixture and rerun the narrow verification command.",
    scopeSignal: "Small diff, but fixture coverage is UNCONFIRMED.",
    riskSignal: "No risky files detected.",
    stopIf: ["The fixture update expands into auth or provider behavior."],
    userDecision: "Let the agent check the fixture before continuing.",
    notVerified: ["Fixture behavior was not inspected."],
  });

  assert.equal(merged.status, "check_again");
  assert.equal(merged.mode, "deterministic_plus_codex");
  assert.match(merged.why, /fixture update/i);
  assert.match(merged.scopeSignal, /UNCONFIRMED/i);
});

test("Codex suggestion cannot lower checkpoint safety floor", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const deterministicCard = createCheckpointCard(
    scan,
    "Add a compact empty state.",
    gitState(["src/app/page.tsx", "src/lib/auth.ts"]),
  );
  const merged = mergeCodexCheckpointSuggestion(deterministicCard, {
    status: "go",
    why: "Codex thinks this is fine.",
    route: "Keep going.",
    scopeSignal: "Looks small.",
    riskSignal: "No risk.",
    stopIf: [],
    userDecision: "No decision needed.",
    notVerified: [],
  });

  assert.equal(deterministicCard.status, "pause");
  assert.equal(merged.status, "pause");
  assert.match(merged.why, /safety floor/i);
});

function gitState(changedFiles: string[]): GitCheckpointState {
  return {
    isGitRepo: true,
    statusLines: changedFiles.map((file) => ` M ${file}`),
    changedFiles,
    diffStat: changedFiles.map((file) => `${file} | 1 +`),
    notVerified: ["Synthetic git state for test."],
  };
}
