import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { checkTesterShare, renderTesterShareReport } from "./tester-share.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

test("tester share check renders the approved minimum handoff without sending", async () => {
  const report = await checkTesterShare(repoRoot);
  const rendered = renderTesterShareReport(report);

  assert.equal(report.status, "ready_to_share");
  assert.equal(report.testerReadiness, "ready");
  assert.equal(report.testerFeedback, "pending_manual_send");
  assert.equal(report.publicReadiness, "ready");
  assert.equal(report.checks.some((check) => check.status === "fail"), false);
  assert.deepEqual(report.minimumShareSet, [
    "docs/first-tester-proof-brief.md",
    "docs/lumo-v0-test-brief.md",
    "docs/public-tester-quickstart.md",
    "docs/examples/dashboard-action-proof-card.html",
    "docs/examples/dashboard-action-manual-review.md",
    "docs/examples/screenshots/dashboard-action-proof-card.png",
  ]);
  assert.ok(report.doNotShare.includes("eval-runs/"));
  assert.ok(report.doNotShare.includes("tmp/"));
  assert.match(rendered, /Lumo Tester Share Check/);
  assert.match(rendered, /Status: ready_to_share/);
  assert.match(rendered, /Nothing has been sent by this command/);
  assert.match(rendered, /Zoey manually sends the approved DM/);
  assert.doesNotMatch(rendered, /\/Users\//);
});
