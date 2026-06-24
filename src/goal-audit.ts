import { readFile } from "node:fs/promises";
import path from "node:path";
import { checkPublicRepoReadiness, type PublicRepoReadinessReport } from "./public-repo-readiness.js";
import { checkTesterFeedback, type FeedbackCheckpointReport } from "./tester-feedback.js";
import { checkTesterReadiness, type TesterReadinessReport } from "./tester-readiness.js";
import { checkTesterShare, type TesterShareReport } from "./tester-share.js";

export type GoalAuditStatus =
  | "local_loop_ready_external_feedback_pending"
  | "local_loop_ready_feedback_needs_decision"
  | "local_loop_ready_feedback_recorded"
  | "not_ready";

export type GoalAuditCheck = {
  name: string;
  status: "pass" | "fail";
  detail: string;
};

export type GoalAuditReport = {
  status: GoalAuditStatus;
  checks: GoalAuditCheck[];
  testerReadiness: TesterReadinessReport["status"];
  testerFeedback: FeedbackCheckpointReport["status"];
  testerShare: TesterShareReport["status"];
  publicReadiness: PublicRepoReadinessReport["status"];
};

export async function checkGoalAudit(repoRoot: string): Promise<GoalAuditReport> {
  const [auditDoc, packageJsonContent, testerReadiness, testerFeedback, testerShare, publicReadiness] = await Promise.all([
    readText(repoRoot, "docs/goal-completion-audit.md"),
    readText(repoRoot, "package.json"),
    checkTesterReadiness(repoRoot),
    checkTesterFeedback(repoRoot),
    checkTesterShare(repoRoot),
    checkPublicRepoReadiness(repoRoot),
  ]);

  const packageJson = JSON.parse(packageJsonContent) as { scripts?: Record<string, string> };
  const checks: GoalAuditCheck[] = [
    auditDocReflectsCurrentGoal(auditDoc),
    localGatesAreReady(testerReadiness, testerFeedback, testerShare, publicReadiness),
    feedbackGateIsSafe(testerFeedback),
    packageScriptsIncludeAuditCommands(packageJson.scripts ?? {}),
  ];

  const hasFailure = checks.some((check) => check.status === "fail");

  return {
    status: hasFailure ? "not_ready" : summarizeGoalStatus(testerFeedback.status),
    checks,
    testerReadiness: testerReadiness.status,
    testerFeedback: testerFeedback.status,
    testerShare: testerShare.status,
    publicReadiness: publicReadiness.status,
  };
}

export function renderGoalAuditReport(report: GoalAuditReport): string {
  return [
    "# Lumo Goal Audit",
    "",
    `Status: ${report.status}`,
    "",
    "| Gate | Status | Detail |",
    "| --- | --- | --- |",
    ...report.checks.map((check) => `| ${check.name} | ${check.status.toUpperCase()} | ${escapeTableCell(check.detail)} |`),
    "",
    "## Current Sub-Statuses",
    "",
    "| Area | Status |",
    "| --- | --- |",
    `| Tester readiness | ${report.testerReadiness} |`,
    `| Tester feedback | ${report.testerFeedback} |`,
    `| Tester share | ${report.testerShare} |`,
    `| Public repo readiness | ${report.publicReadiness} |`,
    "",
    nextStep(report),
    "",
  ].join("\n");
}

function auditDocReflectsCurrentGoal(content: string): GoalAuditCheck {
  const required = [
    /Build and validate Lumo through a checkpointed, reproducible loop/i,
    /local_loop_ready/i,
    /external_feedback_pending/i,
    /level 5: larger local dogfood completed/i,
    /level 6: private tester pending/i,
    /2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk/i,
    /2026-06-23T23-01-20-024Z-nextjs-client-portal-risk/i,
    /2026-06-24T02-00-29-943Z-nextjs-ops-console-advanced-risk/i,
    /control_case/i,
    /advanced_pressure_case_useful_signal_with_caveat/i,
    /pending_manual_send/i,
    /ready_to_share/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(content)).map(String);

  return missing.length === 0
    ? pass("Goal audit doc", "Goal, latest proof, eval ladder, and pending tester gate are explicit")
    : fail("Goal audit doc", `Missing: ${missing.join(", ")}`);
}

function localGatesAreReady(
  testerReadiness: TesterReadinessReport,
  testerFeedback: FeedbackCheckpointReport,
  testerShare: TesterShareReport,
  publicReadiness: PublicRepoReadinessReport,
): GoalAuditCheck {
  return summarizeGoalLocalGates(testerReadiness.status, testerFeedback.status, testerShare.status, publicReadiness.status);
}

export function summarizeGoalLocalGates(
  testerReadinessStatus: TesterReadinessReport["status"],
  testerFeedbackStatus: FeedbackCheckpointReport["status"],
  testerShareStatus: TesterShareReport["status"],
  publicReadinessStatus: PublicRepoReadinessReport["status"],
): GoalAuditCheck {
  const failures: string[] = [];

  if (testerReadinessStatus === "not_ready") {
    failures.push("tester readiness not ready");
  }

  if (testerFeedbackStatus === "pending_manual_send" && testerShareStatus === "not_ready") {
    failures.push("tester share not ready");
  }

  if (publicReadinessStatus === "not_ready") {
    failures.push("public repo readiness not ready");
  }

  const shareDetail =
    testerFeedbackStatus === "pending_manual_send"
      ? "tester share is ready for pending manual send"
      : "tester share is no longer a blocking pre-send gate";

  return failures.length === 0
    ? pass("Local gates", `Tester readiness and public repo readiness are ready; ${shareDetail}`)
    : fail("Local gates", failures.join("; "));
}

function feedbackGateIsSafe(testerFeedback: FeedbackCheckpointReport): GoalAuditCheck {
  if (testerFeedback.status === "unsafe_or_incomplete") {
    return fail("Tester feedback gate", "Feedback log is unsafe or incomplete");
  }

  return pass("Tester feedback gate", `Current feedback status is ${testerFeedback.status}`);
}

function packageScriptsIncludeAuditCommands(scripts: Record<string, string>): GoalAuditCheck {
  const required = ["build", "check:local", "test", "typecheck", "tester:check", "tester:feedback", "tester:next", "tester:share", "public:check", "goal:audit"];
  const missing = required.filter((scriptName) => !scripts[scriptName]);

  return missing.length === 0
    ? pass("Package scripts", "Full local gate scripts are present")
    : fail("Package scripts", `Missing scripts: ${missing.join(", ")}`);
}

function summarizeGoalStatus(feedbackStatus: FeedbackCheckpointReport["status"]): GoalAuditStatus {
  if (feedbackStatus === "feedback_recorded_with_decision") {
    return "local_loop_ready_feedback_recorded";
  }

  if (feedbackStatus === "feedback_recorded_needs_decision") {
    return "local_loop_ready_feedback_needs_decision";
  }

  return "local_loop_ready_external_feedback_pending";
}

function nextStep(report: GoalAuditReport): string {
  if (report.status === "not_ready") {
    return "Next: fix failing local gates before making tester or public claims.";
  }

  if (report.status === "local_loop_ready_feedback_recorded") {
    return "Next: use the recorded tester decision to choose the next Lumo checkpoint.";
  }

  if (report.status === "local_loop_ready_feedback_needs_decision") {
    return "Next: choose `expand_to_3_testers`, `tighten_docs`, `tighten_eval`, or `pause_public_story`.";
  }

  return "Next: Zoey manually sends the approved private tester invite, then records summarized feedback. No external action has been taken by this command.";
}

async function readText(repoRoot: string, relativePath: string): Promise<string> {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

function pass(name: string, detail: string): GoalAuditCheck {
  return { name, status: "pass", detail };
}

function fail(name: string, detail: string): GoalAuditCheck {
  return { name, status: "fail", detail };
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
