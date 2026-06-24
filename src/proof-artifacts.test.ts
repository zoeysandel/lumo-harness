import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const exampleRoot = new URL("../docs/examples/", import.meta.url);
const docsRoot = new URL("../docs/", import.meta.url);

const textExampleFiles = [
  "README.md",
  "AGENTS.md.draft",
  "CLAUDE.md.draft",
  "workflows/bugfix.md",
  "workflows/feature.md",
  "workflows/review.md",
  "dashboard-action-proof-card.html",
  "dashboard-action-manual-review.md",
  "dashboard-action-x-draft.md",
];

const forbiddenTextPatterns = [
  /\/Users\//,
  /zoeysandel/i,
  /file:\/\//i,
  /OPENAI_API_KEY/,
  /CRM_WEBHOOK/,
  /DATABASE_URL/,
  /BILLING_API_KEY/,
  /sk-[A-Za-z0-9_-]+/,
];

test("stable proof example artifacts exist", async () => {
  for (const file of textExampleFiles) {
    const stats = await stat(new URL(file, exampleRoot));
    assert.equal(stats.isFile(), true, `${file} should be a file`);
  }

  const screenshot = await stat(new URL("screenshots/dashboard-action-proof-card.png", exampleRoot));
  assert.equal(screenshot.isFile(), true, "example proof card screenshot should be a file");
  assert.ok(screenshot.size > 10_000, "example proof card screenshot should not be empty");
});

test("stable proof examples avoid local paths and secret-like markers", async () => {
  for (const file of textExampleFiles) {
    const content = await readFile(new URL(file, exampleRoot), "utf8");

    for (const pattern of forbiddenTextPatterns) {
      assert.equal(pattern.test(content), false, `${file} should not include ${pattern}`);
    }
  }
});

test("stable proof card keeps the current claim boundary visible", async () => {
  const content = await readFile(new URL("dashboard-action-proof-card.html", exampleRoot), "utf8");

  assert.match(content, /Same prompt\. Same fixture/i);
  assert.match(content, /Eval hypothesis/i);
  assert.match(content, /False positive avoided/i);
  assert.match(content, /Touched risk seams: auth and db\/persistence/i);
  assert.match(content, /What this proves/i);
  assert.match(content, /What this does not prove/i);
  assert.match(content, /clean-room behavior independent from a user's global Codex setup/i);
  assert.doesNotMatch(content, /guarantees better code/i);
  assert.ok(repoRoot.endsWith("/lumo-harness/"), "test should resolve from the repo root");
});

test("stable harness draft examples show repo rails without apply-mode claims", async () => {
  const agents = await readFile(new URL("AGENTS.md.draft", exampleRoot), "utf8");
  const claude = await readFile(new URL("CLAUDE.md.draft", exampleRoot), "utf8");
  const bugfix = await readFile(new URL("workflows/bugfix.md", exampleRoot), "utf8");
  const feature = await readFile(new URL("workflows/feature.md", exampleRoot), "utf8");
  const review = await readFile(new URL("workflows/review.md", exampleRoot), "utf8");

  assert.match(agents, /Keep changes in the smallest reviewable slice/i);
  assert.match(agents, /Name the intended first slice before broad implementation/i);
  assert.match(agents, /Do not include generated build output/i);
  assert.match(agents, /git status --short/i);
  assert.match(agents, /TypeScript\/Next\.js Defaults/i);
  assert.match(agents, /TypeScript\/Next\.js Quality Bar/i);
  assert.match(agents, /Apply ICE for slice choice/i);
  assert.match(agents, /dependency injection at risky boundaries/i);
  assert.match(agents, /repository\/service pattern/i);
  assert.match(agents, /Apply SOLID pragmatically/i);
  assert.match(agents, /Apply DRY after the second real duplication/i);
  assert.match(agents, /Review success by behavior shape/i);
  assert.match(agents, /Final Response Contract/i);
  assert.match(agents, /Treat AI\/provider calls as gated/i);
  assert.match(agents, /Verification Commands/i);
  assert.match(agents, /Review Gates/i);
  assert.match(agents, /Do not write to production systems without explicit human approval/i);
  assert.match(claude, /Follow `AGENTS\.md` as the source of truth/i);
  assert.match(claude, /first-slice, verification, no-go seam, and final-response contract/i);
  assert.match(bugfix, /Reproduce or locate the failing behavior/i);
  assert.match(bugfix, /Prefer one failing case or fixture/i);
  assert.match(feature, /smallest user-visible slice/i);
  assert.match(feature, /prefer local state, local route logic/i);
  assert.match(review, /Find correctness, safety, privacy, and missing-test risks/i);
  assert.match(review, /stayed inside the intended slice and avoided risky seams/i);
  assert.match(review, /Stop Conditions/i);
  assert.doesNotMatch(agents, /applied|installed|written to your repo/i);
  assert.doesNotMatch(claude, /applied|installed|written to your repo/i);
});

test("eval ladder keeps larger evals behind a clear decision gate", async () => {
  const ladder = await readFile(new URL("eval-ladder.md", docsRoot), "utf8");
  const initScope = await readFile(new URL("lumo-init-mvp-scope.md", docsRoot), "utf8");
  const goldenUseCase = await readFile(new URL("golden-use-case.md", docsRoot), "utf8");
  const nextjsQualityBar = await readFile(new URL("nextjs-harness-quality-bar.md", docsRoot), "utf8");
  const dogfood = await readFile(new URL("dogfood-nextjs-larger-projects.md", docsRoot), "utf8");
  const readme = await readFile(new URL("../README.md", docsRoot), "utf8");
  const proofMatrix = await readFile(new URL("proof-matrix.md", docsRoot), "utf8");

  assert.match(ladder, /master one use case before expanding/i);
  assert.match(ladder, /Do not jump to level 6/i);
  assert.match(ladder, /Current Checkpoint Decision/i);
  assert.match(ladder, /Does Lumo clearly feel better than normal Codex usage/i);
  assert.match(ladder, /not useful\s+when they only make the demo look more serious/i);
  assert.match(ladder, /Run a bigger eval only when/i);
  assert.match(ladder, /Tune one primary element per eval rerun/i);
  assert.match(ladder, /Run one advanced pressure rerun before sending this larger-work story/i);
  assert.match(ladder, /nextjs-client-portal-risk/i);
  assert.match(ladder, /Advanced pressure rerun/i);
  assert.match(ladder, /nextjs-ops-console-advanced-risk/i);
  assert.match(initScope, /Add clean AI-coding defaults to your TypeScript\/Next\.js repo/i);
  assert.match(initScope, /Generated Files/i);
  assert.match(initScope, /`AGENTS\.md`/);
  assert.match(initScope, /`\.lumo\/commands\.md`/);
  assert.match(initScope, /`\.lumo\/risks\.md`/);
  assert.match(initScope, /Do not generate `CLAUDE\.md` by default/i);
  assert.match(initScope, /Terminal Checkpoints/i);
  assert.match(initScope, /Integrations In MVP/i);
  assert.match(initScope, /Do not scaffold or claim support for integrations in v1/i);
  assert.match(initScope, /Run Lumo before a real TypeScript\/Next\.js feature task/i);
  assert.match(goldenUseCase, /The Use Case We Are Mastering/i);
  assert.match(goldenUseCase, /existing TypeScript\/Next\.js app/i);
  assert.match(goldenUseCase, /The Three Cases We Need/i);
  assert.match(goldenUseCase, /Smoke \/ overfit check/i);
  assert.match(goldenUseCase, /Realistic risk case/i);
  assert.match(goldenUseCase, /Control \/ calibration case/i);
  assert.match(goldenUseCase, /Larger dogfood case/i);
  assert.match(goldenUseCase, /nextjs-client-portal-risk/i);
  assert.match(nextjsQualityBar, /New clean Next\.js repo/i);
  assert.match(nextjsQualityBar, /Existing Next\.js repo/i);
  assert.match(nextjsQualityBar, /Repository Pattern Rule/i);
  assert.match(nextjsQualityBar, /dependency injection/i);
  assert.match(nextjsQualityBar, /SOLID/i);
  assert.match(nextjsQualityBar, /DRY/i);
  assert.match(nextjsQualityBar, /Lumo cannot guarantee/i);
  assert.match(dogfood, /advanced pressure run completed/i);
  assert.match(dogfood, /nextjs-client-portal-risk/i);
  assert.match(dogfood, /advanced pressure run completed/i);
  assert.match(dogfood, /nextjs-ops-console-advanced-risk/i);
  assert.match(dogfood, /client escalation workflow/i);
  assert.match(dogfood, /useful_signal \| control_case \| baseline_better/i);
  assert.match(dogfood, /baseline_slightly_better_for_first_slice/i);
  assert.match(readme, /docs\/eval-ladder\.md/);
  assert.match(readme, /docs\/dogfood-nextjs-larger-projects\.md/);
  assert.match(readme, /docs\/lumo-init-mvp-scope\.md/);
  assert.match(readme, /docs\/golden-use-case\.md/);
  assert.match(readme, /docs\/nextjs-harness-quality-bar\.md/);
  assert.match(readme, /nextjs-client-portal-risk/);
  assert.match(proofMatrix, /eval-ladder\.md/);
  assert.match(proofMatrix, /nextjs-client-portal-risk/);
  assert.match(proofMatrix, /nextjs-ops-console-advanced-risk/);
});

test("completion audit reflects the current proof and next checkpoint", async () => {
  const audit = await readFile(new URL("goal-completion-audit.md", docsRoot), "utf8");
  const proofBrief = await readFile(new URL("first-tester-proof-brief.md", docsRoot), "utf8");
  const dashboardProof = await readFile(new URL("dashboard-action-risk-proof.md", docsRoot), "utf8");

  assert.match(audit, /level 5: larger local dogfood completed/i);
  assert.match(audit, /level 6: private tester pending/i);
  assert.match(audit, /advanced_pressure_case_useful_signal_with_caveat/i);
  assert.match(audit, /docs\/eval-ladder\.md/i);
  assert.match(audit, /2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk/);
  assert.match(audit, /2026-06-23T23-01-20-024Z-nextjs-client-portal-risk/);
  assert.match(audit, /nextjs-ops-console-advanced-risk/);
  assert.match(audit, /control_case/);
  assert.match(audit, /\+269 \/ -2/);
  assert.match(audit, /\+182 \/ -0/);
  assert.match(audit, /\+130 \/ -1/);
  assert.match(audit, /\+177 \/ -1/);
  assert.match(audit, /pending_manual_send/);
  assert.match(audit, /ready_to_share/);
  assert.match(audit, /lumo_helped, with boundary caveat/i);
  assert.match(proofBrief, /2026-06-24T02-00-29-943Z-nextjs-ops-console-advanced-risk/);
  assert.match(proofBrief, /private-tester-share-manifest\.md/);
  assert.match(proofBrief, /eval-runs\/` are intentionally not part of the minimum\s+tester share set/i);
  assert.match(dashboardProof, /2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk/);
  assert.match(dashboardProof, /\+269 \/ -2/);
  assert.match(dashboardProof, /\+182 \/ -0/);
});

test("demo walkthrough is short, shareable, and bounded", async () => {
  const demo = await readFile(new URL("demo-walkthrough.md", docsRoot), "utf8");
  const readme = await readFile(new URL("../README.md", docsRoot), "utf8");
  const proofBrief = await readFile(new URL("first-tester-proof-brief.md", docsRoot), "utf8");

  assert.match(demo, /Two-Minute Demo Walkthrough/i);
  assert.match(demo, /Same fixture repo/i);
  assert.match(demo, /docs\/examples\/dashboard-action-proof-card\.html/);
  assert.match(demo, /docs\/examples\/dashboard-action-manual-review\.md/);
  assert.match(demo, /level 5: private tester/i);
  assert.match(demo, /pending_manual_send/i);
  assert.match(demo, /ready_to_share/i);
  assert.match(demo, /does not prove Lumo always improves code/i);
  assert.match(demo, /Would you run something like this before asking Codex or Claude Code/i);
  assert.match(demo, /Do not say:[\s\S]*Lumo makes AI coding safe/i);
  assert.match(demo, /Do not say:[\s\S]*Lumo guarantees better code/i);
  assert.match(readme, /docs\/demo-walkthrough\.md/);
  assert.match(proofBrief, /demo-walkthrough\.md/);
});

test("manual review records human judgment without turning it into a broad claim", async () => {
  const manualReview = await readFile(new URL("dashboard-action-manual-review.md", exampleRoot), "utf8");
  const dashboardProof = await readFile(new URL("dashboard-action-risk-proof.md", docsRoot), "utf8");
  const examplesReadme = await readFile(new URL("README.md", exampleRoot), "utf8");

  assert.match(manualReview, /lumo_helped/);
  assert.match(manualReview, /plausible working code/i);
  assert.match(manualReview, /auth and database seams/i);
  assert.match(manualReview, /UI completeness/i);
  assert.match(manualReview, /It does not support a broad safety claim/i);
  assert.match(dashboardProof, /dashboard-action-manual-review\.md/);
  assert.match(examplesReadme, /dashboard-action-manual-review\.md/);
});

test("mvp gaps reflect current local readiness and remaining tester gate", async () => {
  const gaps = await readFile(new URL("mvp-gaps.md", docsRoot), "utf8");

  assert.match(gaps, /local loop ready; ready to share; first private tester still pending/i);
  assert.match(gaps, /2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk/);
  assert.match(gaps, /dashboard-action-manual-review\.md/);
  assert.match(gaps, /docs\/demo-walkthrough\.md/);
  assert.match(gaps, /npm run check:local/);
  assert.match(gaps, /npm run tester:next/);
  assert.match(gaps, /npm run tester:share/);
  assert.match(gaps, /pending_manual_send/);
  assert.match(gaps, /ready_to_share/);
  assert.match(gaps, /useful signal with caveat/i);
  assert.match(gaps, /nextjs-ops-console-advanced-risk/);
  assert.match(gaps, /Lumo guarantees better output/);
});

test("public repo checklist separates stable proof docs from local generated output", async () => {
  const checklist = await readFile(new URL("public-repo-checklist.md", docsRoot), "utf8");
  const reviewPacket = await readFile(new URL("first-tester-review-packet.md", docsRoot), "utf8");
  const gitignore = await readFile(new URL("../.gitignore", docsRoot), "utf8");
  const readme = await readFile(new URL("../README.md", docsRoot), "utf8");
  const decisionMap = await readFile(new URL("first-tester-decision-map.md", docsRoot), "utf8");
  const feedbackScenarios = await readFile(new URL("first-tester-feedback-scenarios.md", docsRoot), "utf8");
  const shareManifest = await readFile(new URL("private-tester-share-manifest.md", docsRoot), "utf8");

  assert.match(checklist, /Nothing has been published/i);
  assert.match(checklist, /docs\/examples\/dashboard-action-proof-card\.html/);
  assert.match(checklist, /docs\/examples\/dashboard-action-manual-review\.md/);
  assert.match(checklist, /docs\/lumo-init-mvp-scope\.md/);
  assert.match(checklist, /docs\/golden-use-case\.md/);
  assert.match(checklist, /docs\/nextjs-harness-quality-bar\.md/);
  assert.match(checklist, /docs\/dogfood-nextjs-larger-projects\.md/);
  assert.match(checklist, /docs\/first-tester-decision-map\.md/);
  assert.match(checklist, /docs\/first-tester-feedback-scenarios\.md/);
  assert.match(checklist, /docs\/private-tester-share-manifest\.md/);
  assert.match(checklist, /npm run check:local/);
  assert.match(checklist, /Do not publish these generated\/local folders/i);
  assert.match(checklist, /eval-runs\//);
  assert.match(checklist, /pending_manual_send/);
  assert.match(checklist, /ready_to_share/);
  assert.match(reviewPacket, /docs\/examples\/dashboard-action-manual-review\.md/);
  assert.match(reviewPacket, /local `eval-runs\/` output/);
  assert.match(reviewPacket, /0-2 signal scorecard/);
  assert.match(reviewPacket, /docs\/first-tester-decision-map\.md/);
  assert.match(reviewPacket, /docs\/first-tester-feedback-scenarios\.md/);
  assert.match(reviewPacket, /synthetic examples only/i);
  assert.doesNotMatch(reviewPacket, /Optional if they will not run the eval immediately:[\s\S]*eval-runs\/2026/);
  assert.match(checklist, /Do not publish a public launch claim until at least one private tester/i);
  assert.match(gitignore, /^eval-runs\/$/m);
  assert.match(gitignore, /^tmp\/$/m);
  assert.match(gitignore, /^dist\/$/m);
  assert.match(readme, /docs\/public-repo-checklist\.md/);
  assert.match(readme, /docs\/first-tester-decision-map\.md/);
  assert.match(readme, /docs\/first-tester-feedback-scenarios\.md/);
  assert.match(decisionMap, /expand_to_3_testers/);
  assert.match(decisionMap, /tighten_docs/);
  assert.match(decisionMap, /tighten_eval/);
  assert.match(decisionMap, /pause_public_story/);
  assert.match(decisionMap, /Scorecard Interpretation/);
  assert.match(decisionMap, /Do not average the scores/i);
  assert.match(decisionMap, /Which specific Lumo promise failed to become visible/i);
  assert.match(decisionMap, /Do not build a larger eval unless the tester names a concrete missing signal/i);
  assert.match(decisionMap, /first-tester-feedback-scenarios\.md/);
  assert.match(feedbackScenarios, /Status: synthetic examples only/i);
  assert.match(feedbackScenarios, /Do not use these examples as product proof/i);
  assert.match(feedbackScenarios, /Clear Value/i);
  assert.match(feedbackScenarios, /Useful But Confusing/i);
  assert.match(feedbackScenarios, /Proof Not Convincing/i);
  assert.match(feedbackScenarios, /Wrong Expectation/i);
  assert.match(feedbackScenarios, /expand_to_3_testers/);
  assert.match(feedbackScenarios, /tighten_docs/);
  assert.match(feedbackScenarios, /tighten_eval/);
  assert.match(feedbackScenarios, /pause_public_story/);
  assert.match(shareManifest, /Minimum Share Set/i);
  assert.match(shareManifest, /Do Not Share/i);
  assert.match(shareManifest, /first-tester-feedback-scenarios\.md/);
  assert.match(shareManifest, /eval-runs\//);
  assert.match(shareManifest, /tmp\//);
  assert.match(shareManifest, /pending_manual_send/);
  assert.doesNotMatch(shareManifest, /\/Users\//);
});
