import { readFile } from "node:fs/promises";
import path from "node:path";

export type FeedbackCheckpointStatus =
  | "pending_first_tester"
  | "pending_manual_send"
  | "pending_feedback_after_send"
  | "feedback_recorded_needs_decision"
  | "feedback_recorded_with_decision"
  | "unsafe_or_incomplete";

export type FeedbackDecision = "expand_to_3_testers" | "tighten_docs" | "tighten_eval" | "pause_public_story";

export type FeedbackCheckpointCheck = {
  name: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type FeedbackCheckpointReport = {
  approvalStatus: "pending_zoey_review" | "approved_as_is";
  status: FeedbackCheckpointStatus;
  decision?: FeedbackDecision;
  checks: FeedbackCheckpointCheck[];
};

const requiredSections = [
  "## Test Setup",
  "## Manual Send Receipt",
  "## Feedback Capture",
  "## Signal Scorecard",
  "## Evidence Notes",
  "## Decision Gate",
  "## Decision",
  "## Product Learning",
];

const unsafePrivateDataPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+31|0031|0)[\s-]?(?:6|20|30|40|50|70|10)[\d\s-]{6,}\b/i,
  /https?:\/\/(?:www\.)?(?:linkedin\.com|x\.com|twitter\.com)\/[^\s)]+/i,
];

export async function checkTesterFeedback(repoRoot: string): Promise<FeedbackCheckpointReport> {
  const content = await readFile(path.join(repoRoot, "docs/first-tester-feedback-log.md"), "utf8");
  const reviewPacket = await readFile(path.join(repoRoot, "docs/first-tester-review-packet.md"), "utf8");
  return checkTesterFeedbackContent(content, reviewPacket);
}

export function checkTesterFeedbackContent(content: string, reviewPacket: string): FeedbackCheckpointReport {
  const checks: FeedbackCheckpointCheck[] = [];

  checks.push(requiredSectionsExist(content));
  checks.push(privateDataLooksRedacted(content));
  checks.push(feedbackHasTesterScope(content));
  checks.push(manualSendReceiptIsExplicit(content));
  checks.push(feedbackCaptureHasCurrentQuestions(content));
  checks.push(signalScorecardHasCurrentSignals(content));
  checks.push(decisionGateHasCurrentOptions(content));

  const hasFailure = checks.some((check) => check.status === "fail");
  const feedbackRecorded = hasFeedbackRecorded(content);
  const decision = parseDecision(content);
  const approvalStatus = /approved_as_is/i.test(reviewPacket) ? "approved_as_is" : "pending_zoey_review";
  const manualSendRecorded = hasManualSendRecorded(content);

  return {
    approvalStatus,
    status: hasFailure
      ? "unsafe_or_incomplete"
      : feedbackRecorded && decision
        ? "feedback_recorded_with_decision"
        : feedbackRecorded
          ? "feedback_recorded_needs_decision"
          : approvalStatus === "approved_as_is" && manualSendRecorded
            ? "pending_feedback_after_send"
            : approvalStatus === "approved_as_is"
              ? "pending_manual_send"
              : "pending_first_tester",
    decision,
    checks,
  };
}

export function renderTesterFeedbackReport(report: FeedbackCheckpointReport): string {
  const icon = {
    pass: "PASS",
    warn: "WARN",
    fail: "FAIL",
  } as const;

  return [
    "# Lumo Tester Feedback Checkpoint",
    "",
    `Approval: ${report.approvalStatus}`,
    `Status: ${report.status}`,
    ...(report.decision ? [`Decision: ${report.decision}`] : []),
    "",
    "| Check | Status | Detail |",
    "| --- | --- | --- |",
    ...report.checks.map((check) => `| ${check.name} | ${icon[check.status]} | ${escapeTableCell(check.detail)} |`),
    "",
    nextStep(report),
    "",
  ].join("\n");
}

function requiredSectionsExist(content: string): FeedbackCheckpointCheck {
  const missing = requiredSections.filter((section) => !content.includes(section));

  return missing.length === 0
    ? pass("Feedback log structure", `${requiredSections.length} required sections present`)
    : fail("Feedback log structure", `Missing: ${missing.join(", ")}`);
}

function privateDataLooksRedacted(content: string): FeedbackCheckpointCheck {
  const hits = unsafePrivateDataPatterns.filter((pattern) => pattern.test(content)).map(String);

  return hits.length === 0
    ? pass("Private data hygiene", "No obvious email, phone, or public profile URL found")
    : fail("Private data hygiene", `Possible raw private data: ${hits.join(", ")}`);
}

function feedbackHasTesterScope(content: string): FeedbackCheckpointCheck {
  const required = [
    /Tester label \| `tester-001`/i,
    /MVP scope fit \| TypeScript\/Next\.js app builder/i,
    /Eval run \| `nextjs-ops-console-advanced-risk`, `nextjs-stateful-ai-risk`, or `nextjs-dashboard-action-risk`/i,
    /Instruction mode \| `local-user-mode` or `custom-CODEX_HOME`/i,
    /Custom Codex-home preflight \| yes \/ no \/ n\/a/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(content)).map(String);

  return missing.length === 0
    ? pass("Tester scope", "TypeScript/Next.js tester scope, eval choice, instruction mode, and preflight status are explicit")
    : fail("Tester scope", `Missing: ${missing.join(", ")}`);
}

function manualSendReceiptIsExplicit(content: string): FeedbackCheckpointCheck {
  const required = [
    /Manual send status \| `(?:not_sent|sent)`/i,
    /Recipient label \| `tester-001`/i,
    /Message version \| `docs\/first-tester-packet\.generated\.md`/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(content)).map(String);

  return missing.length === 0
    ? pass("Manual send receipt", "Manual send status is explicit without private recipient data")
    : fail("Manual send receipt", `Missing: ${missing.join(", ")}`);
}

function feedbackCaptureHasCurrentQuestions(content: string): FeedbackCheckpointCheck {
  const required = [
    /Was the TypeScript\/Next\.js first-use-case scope clear\?/i,
    /Was the local-user-mode \/ global `AGENTS\.md` caveat clear\?/i,
    /Did they use the custom Codex-home preflight\?/i,
    /If they used preflight, did it clarify or block anything\?/i,
    /Would they use this before a Codex\/Claude feature task\?/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(content)).map(String);

  return missing.length === 0
    ? pass("Feedback questions", "Wedge clarity, instruction caveat, preflight usefulness, and product pull are captured")
    : fail("Feedback questions", `Missing: ${missing.join(", ")}`);
}

function signalScorecardHasCurrentSignals(content: string): FeedbackCheckpointCheck {
  const required = [
    /Use `0` when the signal was not visible, `1` when it was partially visible, and\s+`2` when it was clearly visible/i,
    /Smaller first slice/i,
    /Better repo-pattern fit/i,
    /Risky seams avoided or gated/i,
    /Verification was clear/i,
    /Final answer was honest about not-verified work/i,
    /Tester would use this before a real Codex\/Claude task/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(content)).map(String);

  return missing.length === 0
    ? pass("Signal scorecard", "Concrete 0-2 signals are present for reviewability, risk, verification, honesty, and product pull")
    : fail("Signal scorecard", `Missing: ${missing.join(", ")}`);
}

function decisionGateHasCurrentOptions(content: string): FeedbackCheckpointCheck {
  const required = [
    /expand_to_3_testers/i,
    /tighten_docs/i,
    /tighten_eval/i,
    /pause_public_story/i,
    /pending_(?:first_tester|manual_send|feedback_after_send)/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(content)).map(String);

  return missing.length === 0
    ? pass("Decision options", "Feedback-to-next-step decisions are explicit")
    : fail("Decision options", `Missing: ${missing.join(", ")}`);
}

function hasManualSendRecorded(content: string): boolean {
  return /Manual send status \| `sent`/i.test(content);
}

function hasFeedbackRecorded(content: string): boolean {
  return !/Observed:\n- \n\nTester said, paraphrased:\n- /m.test(content);
}

function parseDecision(content: string): FeedbackDecision | undefined {
  if (/Current default until feedback exists:\n\n```txt\npending_(?:first_tester|manual_send|feedback_after_send)\n```/m.test(content)) {
    return undefined;
  }

  const explicitDecision = content.match(
    /Decision recorded after feedback:\s*```txt\s*(expand_to_3_testers|tighten_docs|tighten_eval|pause_public_story)\s*```/m,
  )?.[1];

  return explicitDecision as FeedbackDecision | undefined;
}

function nextStep(report: FeedbackCheckpointReport): string {
  if (report.status === "unsafe_or_incomplete") {
    return "Next: fix the feedback log before using it for a product decision.";
  }

  if (report.status === "feedback_recorded_with_decision") {
    return "Next: use the recorded decision to choose the next Lumo checkpoint.";
  }

  if (report.status === "feedback_recorded_needs_decision") {
    return "Next: choose `expand_to_3_testers`, `tighten_docs`, `tighten_eval`, or `pause_public_story`.";
  }

  if (report.status === "pending_feedback_after_send") {
    return "Next: wait for the tester response, then record summarized feedback without raw private messages.";
  }

  if (report.status === "pending_manual_send") {
    return "Next: Zoey manually sends the approved invite to one private tester. No tester feedback has been recorded yet.";
  }

  return "Next: Zoey approves, edits, or holds the first tester invite. No tester feedback has been recorded yet.";
}

function pass(name: string, detail: string): FeedbackCheckpointCheck {
  return { name, status: "pass", detail };
}

function fail(name: string, detail: string): FeedbackCheckpointCheck {
  return { name, status: "fail", detail };
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
