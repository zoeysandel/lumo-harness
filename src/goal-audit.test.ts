import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { checkGoalAudit, renderGoalAuditReport, summarizeGoalLocalGates } from "./goal-audit.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

test("goal audit summarizes local readiness without pretending external validation is done", async () => {
  const report = await checkGoalAudit(repoRoot);
  const rendered = renderGoalAuditReport(report);

  assert.equal(report.status, "local_loop_ready_external_feedback_pending");
  assert.equal(report.checks.some((check) => check.status === "fail"), false);
  assert.ok(["ready", "ready_with_warnings"].includes(report.testerReadiness));
  assert.equal(report.testerFeedback, "pending_manual_send");
  assert.equal(report.testerShare, "ready_to_share");
  assert.equal(report.publicReadiness, "ready");
  assert.match(rendered, /Lumo Goal Audit/);
  assert.match(rendered, /tester share is ready for pending manual send/);
  assert.match(rendered, /pending_manual_send/);
  assert.match(rendered, /ready_to_share/);
  assert.match(rendered, /No external action has been taken by this command/);
});

test("goal audit only treats tester share as blocking before manual send", () => {
  const beforeSend = summarizeGoalLocalGates("ready", "pending_manual_send", "not_ready", "ready");
  const afterSend = summarizeGoalLocalGates("ready", "pending_feedback_after_send", "not_ready", "ready");

  assert.equal(beforeSend.status, "fail");
  assert.match(beforeSend.detail, /tester share not ready/);
  assert.equal(afterSend.status, "pass");
  assert.match(afterSend.detail, /no longer a blocking pre-send gate/);
});
