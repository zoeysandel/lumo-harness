import type { FeedbackCheckpointReport } from "./tester-feedback.js";

export function renderTesterNextAction(report: FeedbackCheckpointReport): string {
  const lines = [
    "# Lumo Tester Next Action",
    "",
    `Current feedback status: ${report.status}`,
    `Invite approval: ${report.approvalStatus}`,
    "",
  ];

  if (report.status === "unsafe_or_incomplete") {
    return [
      ...lines,
      "Fix the failing feedback-log checks before using this for a product decision.",
      "",
      "Run:",
      "",
      fenced("npm run tester:feedback"),
      "",
    ].join("\n");
  }

  if (report.status === "pending_first_tester") {
    return [
      ...lines,
      "Zoey has not approved the first tester send gate yet.",
      "",
      "Next:",
      "",
      "- Review `docs/first-tester-review-packet.md`.",
      "- Choose `approve_as_is`, `edit_then_send`, or `hold`.",
      "- Do not contact a tester from this command.",
      "",
    ].join("\n");
  }

  if (report.status === "pending_manual_send") {
    return [
      ...lines,
      "Nothing has been sent by this command.",
      "",
      "After Zoey manually sends the approved DM, update only this receipt section:",
      "",
      "| File | Field | Set To |",
      "| --- | --- | --- |",
      "| `docs/first-tester-feedback-log.md` | `Manual send status` | `sent` |",
      "| `docs/first-tester-feedback-log.md` | `Sent date` | `YYYY-MM-DD` |",
      "| `docs/first-tester-feedback-log.md` | `Notes` | redacted / paraphrased only |",
      "",
      "Keep `Recipient label` as `tester-001`. Do not add private names, handles, email addresses, phone numbers, profile URLs, or raw message bodies.",
      "",
      "Then run:",
      "",
      fenced("npm run tester:feedback"),
      "",
      "Expected next status:",
      "",
      fenced("pending_feedback_after_send"),
      "",
    ].join("\n");
  }

  if (report.status === "pending_feedback_after_send") {
    return [
      ...lines,
      "The invite has been recorded as sent. Wait for the tester response, then summarize feedback without raw private messages.",
      "",
      "Update:",
      "",
      "- `Feedback Capture`: short signal per question.",
      "- `Evidence Notes`: redacted observations and paraphrased tester comments.",
      "- `Decision Gate`: mark each gate as pass / partial / fail.",
      "",
      "Then run:",
      "",
      fenced("npm run tester:feedback"),
      "",
      "Expected next status:",
      "",
      fenced("feedback_recorded_needs_decision"),
      "",
    ].join("\n");
  }

  if (report.status === "feedback_recorded_needs_decision") {
    return [
      ...lines,
      "Feedback is recorded. Choose one product decision before changing the next Lumo checkpoint.",
      "",
      "Choose one:",
      "",
      "- `expand_to_3_testers`",
      "- `tighten_docs`",
      "- `tighten_eval`",
      "- `pause_public_story`",
      "",
      "Use the 0-2 signal scorecard as evidence, not as an automatic verdict:",
      "",
      "- mostly `2`, including product pull `2` -> usually `expand_to_3_testers`",
      "- unclear brief or proof, but some product pull -> usually `tighten_docs`",
      "- reviewability, risk gates, or repo-pattern fit scored `0`/`1` with a concrete missing signal -> usually `tighten_eval`",
      "- tester heard a safety guarantee, every-stack claim, or overclaim -> usually `pause_public_story`",
      "",
      "Do not average the scores. Ask: which specific Lumo promise failed to become visible?",
      "",
      "Then run:",
      "",
      fenced("npm run tester:feedback"),
      "",
      "Expected next status:",
      "",
      fenced("feedback_recorded_with_decision"),
      "",
    ].join("\n");
  }

  return [
    ...lines,
    "Feedback and decision are recorded. Use the decision to choose the next Lumo checkpoint.",
    "",
    ...(report.decision ? decisionNextAction(report.decision) : ["Decision value was not parsed. Re-run `npm run tester:feedback` and check the Decision section."]),
    "",
  ].join("\n");
}

function decisionNextAction(decision: NonNullable<FeedbackCheckpointReport["decision"]>): string[] {
  if (decision === "expand_to_3_testers") {
    return [
      "Decision: `expand_to_3_testers`.",
      "",
      "Next checkpoint: ask two more private testers to run or review the same TypeScript/Next.js proof. Do not post publicly yet unless a separate public gate is approved.",
    ];
  }

  if (decision === "tighten_docs") {
    return [
      "Decision: `tighten_docs`.",
      "",
      "Next checkpoint: tighten `docs/first-tester-proof-brief.md`, `docs/public-tester-quickstart.md`, or the proof-card explanation, then rerun tester and public readiness gates before inviting another tester.",
    ];
  }

  if (decision === "tighten_eval") {
    return [
      "Decision: `tighten_eval`.",
      "",
      "Next checkpoint: improve the same TypeScript/Next.js use case or build one larger fixture only if the tester named a specific missing signal. Do not expand to another stack.",
    ];
  }

  return [
    "Decision: `pause_public_story`.",
    "",
    "Next checkpoint: rework positioning and claim boundaries before any X post, public repo announcement, or broader tester ask.",
  ];
}

function fenced(value: string): string {
  return ["```bash", value, "```"].join("\n");
}
