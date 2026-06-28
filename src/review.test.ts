import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { GitReviewState } from "./review.js";
import { createReviewCard, mergeCodexReviewSuggestion, renderReviewCard } from "./review.js";
import { scanRepository } from "./scanner.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const dashboardFixturePath = path.join(repoRoot, "fixtures/nextjs-dashboard-action-risk");

test("review asks for another check when there are no changes", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createReviewCard(scan, "Add empty state.", gitState([]));

  assert.equal(card.status, "check_again");
  assert.match(card.why, /no current git changes/i);
});

test("review returns go for a small diff with a test-like file", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createReviewCard(
    scan,
    "Add empty state.",
    gitState(["src/components/intake-action-card.tsx", "src/components/intake-action-card.test.tsx"], "+expect(true)\n"),
  );

  assert.equal(card.status, "go");
  assert.match(card.proofSignal, /test-like file changed/i);
});

test("review asks for proof when no test-like file is changed", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createReviewCard(scan, "Add empty state.", gitState(["src/components/intake-action-card.tsx"]));

  assert.equal(card.status, "check_again");
  assert.match(card.proofSignal, /no test-like file/i);
});

test("review pauses on risky files", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createReviewCard(scan, "Add empty state.", gitState(["src/lib/auth.ts", "src/lib/auth.test.ts"]));

  assert.equal(card.status, "pause");
  assert.match(card.riskSignal, /auth\/session\/security/i);
});

test("review pivots on broad diffs", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const card = createReviewCard(
    scan,
    "Add empty state.",
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
  assert.match(card.recommendation, /Split/i);
});

test("Codex suggestion cannot lower review safety floor", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const deterministicCard = createReviewCard(scan, "Add empty state.", gitState(["src/lib/auth.ts"]));
  const merged = mergeCodexReviewSuggestion(deterministicCard, {
    status: "go",
    why: "Codex thinks this is fine.",
    completionSignal: "Looks done.",
    proofSignal: "Looks proven.",
    riskSignal: "No risk.",
    recommendation: "Claim done.",
    userDecision: "No decision needed.",
    notVerified: [],
  });

  assert.equal(deterministicCard.status, "pause");
  assert.equal(merged.status, "pause");
  assert.match(merged.why, /safety floor/i);
});

test("review renderer keeps the completion card readable", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const task = "Add empty state.";
  const card = createReviewCard(scan, task, gitState(["src/components/intake-action-card.tsx"]));
  const rendered = renderReviewCard(card, { repoPath: scan.repoPath, task });

  assert.match(rendered, /# Lumo Review/);
  assert.match(rendered, /## Completion Signal/);
  assert.match(rendered, /## Proof Signal/);
  assert.match(rendered, /Read-only/);
});

function gitState(changedFiles: string[], diffTextSample = ""): GitReviewState {
  return {
    isGitRepo: true,
    statusLines: changedFiles.map((file) => ` M ${file}`),
    changedFiles,
    diffStat: changedFiles.map((file) => `${file} | 1 +`),
    diffTextSample,
    notVerified: ["Synthetic git state for test."],
  };
}
