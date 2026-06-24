import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { checkTesterFeedback, checkTesterFeedbackContent, renderTesterFeedbackReport } from "./tester-feedback.js";
import { renderTesterNextAction } from "./tester-next.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const approvedReviewPacket = "Status: approved_as_is";

test("tester feedback checkpoint stays explicit while manual send is pending", async () => {
  const report = await checkTesterFeedback(repoRoot);

  assert.equal(report.status, "pending_manual_send");
  assert.equal(report.checks.some((check) => check.status === "fail"), false);
  assert.ok(report.checks.some((check) => check.name === "Feedback questions"));
  assert.ok(report.checks.some((check) => check.name === "Signal scorecard"));
  assert.ok(report.checks.some((check) => check.name === "Manual send receipt"));
  assert.ok(report.checks.some((check) => check.name === "Private data hygiene"));
  assert.ok(report.checks.some((check) => /Instruction mode|preflight/i.test(check.detail)));
});

test("tester feedback report explains the next human gate", async () => {
  const report = await checkTesterFeedback(repoRoot);
  const rendered = renderTesterFeedbackReport(report);

  assert.match(rendered, /# Lumo Tester Feedback Checkpoint/);
  assert.match(rendered, /Approval: approved_as_is/);
  assert.match(rendered, /Status: pending_manual_send/);
  assert.match(rendered, /Zoey manually sends the approved invite/);
});

test("tester next action explains the manual-send receipt without mutating state", async () => {
  const report = await checkTesterFeedback(repoRoot);
  const rendered = renderTesterNextAction(report);

  assert.equal(report.status, "pending_manual_send");
  assert.match(rendered, /Nothing has been sent by this command/);
  assert.match(rendered, /Manual send status/);
  assert.match(rendered, /`sent`/);
  assert.match(rendered, /Sent date/);
  assert.match(rendered, /Do not add private names/i);
  assert.match(rendered, /pending_feedback_after_send/);
});

test("tester next action moves from sent receipt to feedback capture instructions", async () => {
  const template = await feedbackTemplate();
  const sent = template.replace("| Manual send status | `not_sent` |", "| Manual send status | `sent` |");
  const report = checkTesterFeedbackContent(sent, approvedReviewPacket);
  const rendered = renderTesterNextAction(report);

  assert.equal(report.status, "pending_feedback_after_send");
  assert.match(rendered, /Wait for the tester response/);
  assert.match(rendered, /Feedback Capture/);
  assert.match(rendered, /feedback_recorded_needs_decision/);
});

test("tester feedback state machine detects pending feedback after manual send", async () => {
  const template = await feedbackTemplate();
  const sent = template.replace("| Manual send status | `not_sent` |", "| Manual send status | `sent` |");
  const report = checkTesterFeedbackContent(sent, approvedReviewPacket);

  assert.equal(report.status, "pending_feedback_after_send");
});

test("tester feedback state machine detects recorded feedback that still needs a decision", async () => {
  const template = await feedbackTemplate();
  const withFeedback = template
    .replace("| Manual send status | `not_sent` |", "| Manual send status | `sent` |")
    .replace("Observed:\n- \n\nTester said, paraphrased:\n- ", "Observed:\n- Ran dashboard action eval.\n\nTester said, paraphrased:\n- Proof was clear but setup was slow.");
  const report = checkTesterFeedbackContent(withFeedback, approvedReviewPacket);
  const renderedNext = renderTesterNextAction(report);

  assert.equal(report.status, "feedback_recorded_needs_decision");
  assert.match(renderedNext, /0-2 signal scorecard/i);
  assert.match(renderedNext, /mostly `2`/i);
  assert.match(renderedNext, /reviewability, risk gates, or repo-pattern fit scored `0`\/`1`/i);
  assert.match(renderedNext, /which specific Lumo promise failed to become visible/i);
});

test("tester feedback state machine detects recorded feedback with decision", async () => {
  const template = await feedbackTemplate();
  const withDecision = template
    .replace("| Manual send status | `not_sent` |", "| Manual send status | `sent` |")
    .replace("Observed:\n- \n\nTester said, paraphrased:\n- ", "Observed:\n- Ran dashboard action eval.\n\nTester said, paraphrased:\n- Wants this before risky Codex feature work.")
    .replace(
      "Current default until feedback exists:\n\n```txt\npending_manual_send\n```",
      "Decision recorded after feedback:\n\n```txt\nexpand_to_3_testers\n```",
    );
  const report = checkTesterFeedbackContent(withDecision, approvedReviewPacket);
  const renderedFeedback = renderTesterFeedbackReport(report);
  const renderedNext = renderTesterNextAction(report);

  assert.equal(report.status, "feedback_recorded_with_decision");
  assert.equal(report.decision, "expand_to_3_testers");
  assert.match(renderedFeedback, /Decision: expand_to_3_testers/);
  assert.match(renderedNext, /ask two more private testers/i);
  assert.match(renderedNext, /Do not post publicly yet/i);
});

test("tester next action maps tighten_eval to one sharper TypeScript case", async () => {
  const report = checkTesterFeedbackContent(recordedFeedbackWithDecision("tighten_eval"), approvedReviewPacket);
  const rendered = renderTesterNextAction(report);

  assert.equal(report.status, "feedback_recorded_with_decision");
  assert.equal(report.decision, "tighten_eval");
  assert.match(rendered, /Decision: `tighten_eval`/);
  assert.match(rendered, /same TypeScript\/Next\.js use case/i);
  assert.match(rendered, /tester named a specific missing signal/i);
  assert.match(rendered, /Do not expand to another stack/i);
});

test("tester next action maps docs and positioning decisions to bounded checkpoints", async () => {
  const docsReport = checkTesterFeedbackContent(recordedFeedbackWithDecision("tighten_docs"), approvedReviewPacket);
  const docsRendered = renderTesterNextAction(docsReport);
  const pauseReport = checkTesterFeedbackContent(recordedFeedbackWithDecision("pause_public_story"), approvedReviewPacket);
  const pauseRendered = renderTesterNextAction(pauseReport);

  assert.equal(docsReport.status, "feedback_recorded_with_decision");
  assert.equal(docsReport.decision, "tighten_docs");
  assert.match(docsRendered, /first-tester-proof-brief/);
  assert.match(docsRendered, /public-tester-quickstart/);
  assert.equal(pauseReport.status, "feedback_recorded_with_decision");
  assert.equal(pauseReport.decision, "pause_public_story");
  assert.match(pauseRendered, /claim boundaries/i);
  assert.match(pauseRendered, /before any X post/i);
});

test("tester feedback state machine waits for approval when invite is not approved", async () => {
  const report = checkTesterFeedbackContent(await feedbackTemplate(), "Status: pending_zoey_review");

  assert.equal(report.approvalStatus, "pending_zoey_review");
  assert.equal(report.status, "pending_first_tester");
});

test("tester feedback state machine fails on raw private contact data", async () => {
  const withPrivateEmail = `${await feedbackTemplate()}\nRaw contact: person@example.com\n`;
  const report = checkTesterFeedbackContent(withPrivateEmail, approvedReviewPacket);

  assert.equal(report.status, "unsafe_or_incomplete");
  assert.ok(report.checks.some((check) => check.name === "Private data hygiene" && check.status === "fail"));
});

async function feedbackTemplate(): Promise<string> {
  return readFile(new URL("../docs/first-tester-feedback-log.md", import.meta.url), "utf8");
}

function recordedFeedbackWithDecision(decision: "expand_to_3_testers" | "tighten_docs" | "tighten_eval" | "pause_public_story"): string {
  return [
    "# First Tester Feedback Log",
    "",
    "## Test Setup",
    "",
    "| Field | Value |",
    "| --- | --- |",
    "| Tester label | `tester-001` |",
    "| MVP scope fit | TypeScript/Next.js app builder: yes |",
    "| Eval run | `nextjs-ops-console-advanced-risk`, `nextjs-stateful-ai-risk`, or `nextjs-dashboard-action-risk` |",
    "| Instruction mode | `local-user-mode` or `custom-CODEX_HOME` |",
    "| Custom Codex-home preflight | yes / no / n/a |",
    "",
    "## Manual Send Receipt",
    "",
    "| Field | Value |",
    "| --- | --- |",
    "| Manual send status | `sent` |",
    "| Recipient label | `tester-001` |",
    "| Message version | `docs/first-tester-packet.generated.md` |",
    "",
    "## Feedback Capture",
    "",
    "| Question | Signal |",
    "| --- | --- |",
    "| Was the TypeScript/Next.js first-use-case scope clear? | yes |",
    "| Was the local-user-mode / global `AGENTS.md` caveat clear? | yes |",
    "| Did they use the custom Codex-home preflight? | no |",
    "| If they used preflight, did it clarify or block anything? | n/a |",
    "| Would they use this before a Codex/Claude feature task? | yes |",
    "",
    "## Signal Scorecard",
    "",
    "Use `0` when the signal was not visible, `1` when it was partially visible, and `2` when it was clearly visible.",
    "",
    "| Signal | Score | Note |",
    "| --- | --- | --- |",
    "| Smaller first slice | 2 | Smaller local slice. |",
    "| Better repo-pattern fit | 1 | Partially visible. |",
    "| Risky seams avoided or gated | 2 | No auth/db seam. |",
    "| Verification was clear | 2 | Command was visible. |",
    "| Final answer was honest about not-verified work | 2 | Limits were clear. |",
    "| Tester would use this before a real Codex/Claude task | 2 | Yes for risky work. |",
    "",
    "## Evidence Notes",
    "",
    "Observed:",
    "- Ran dashboard action eval.",
    "",
    "Tester said, paraphrased:",
    "- Proof was clear enough to decide.",
    "",
    "## Decision Gate",
    "",
    "| Gate | Pass Criteria | Result |",
    "| --- | --- | --- |",
    "| Understandable | Tester can explain comparison | pass |",
    "",
    "Options kept for audit: `expand_to_3_testers`, `tighten_docs`, `tighten_eval`, `pause_public_story`, `pending_feedback_after_send`.",
    "",
    "## Decision",
    "",
    "Decision recorded after feedback:",
    "",
    "```txt",
    decision,
    "```",
    "",
    "## Product Learning",
    "",
    "What we learned:",
    "- Useful signal.",
  ].join("\n");
}
