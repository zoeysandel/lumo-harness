import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildTesterPacket,
  checkTesterReadiness,
  renderTesterPacket,
  renderTesterReadinessReport,
} from "./tester-readiness.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

test("tester readiness package is ready or warning-only", async () => {
  const report = await checkTesterReadiness(repoRoot);

  assert.notEqual(report.status, "not_ready");
  assert.equal(report.checks.some((check) => check.status === "fail"), false);
  assert.ok(report.checks.some((check) => check.name === "Proof card boundary"));
  assert.ok(report.checks.some((check) => check.name === "Tester invite wedge"));
});

test("tester readiness report is understandable", async () => {
  const report = await checkTesterReadiness(repoRoot);
  const rendered = renderTesterReadinessReport(report);

  assert.match(rendered, /# Lumo Tester Readiness/);
  assert.match(rendered, /Status: ready/);
  assert.match(rendered, /Private tester human gate/);
  assert.match(rendered, /Tester invite wedge/);
  assert.match(rendered, /Next: Zoey can review the first tester packet/);
});

test("tester packet renders the send gate without claiming it was sent", async () => {
  const packet = await buildTesterPacket(repoRoot);
  const rendered = renderTesterPacket(packet);

  assert.match(rendered, /# Lumo First Tester Packet/);
  assert.match(rendered, /Status: draft only\. Nothing has been sent\./);
  assert.match(rendered, /Approval: approved_as_is\./);
  assert.match(rendered, /approve_as_is/);
  assert.match(rendered, /docs\/private-tester-share-manifest\.md/);
  assert.match(rendered, /docs\/first-tester-proof-brief\.md/);
  assert.match(rendered, /docs\/control-layer-walkthrough\.md/);
  assert.match(rendered, /docs\/first-tester-decision-map\.md/);
  assert.match(rendered, /docs\/first-tester-feedback-scenarios\.md/);
  assert.match(rendered, /synthetic examples of the four routes/);
  assert.match(rendered, /Did the preflight\/checkpoint\/review idea make sense\?/);
  assert.match(rendered, /Did the proof card make the baseline vs Lumo difference obvious\?/);
  assert.match(rendered, /Score these signals 0-2/);
  assert.match(rendered, /Risky seams avoided or gated/);
  assert.match(rendered, /TypeScript\/Next\.js/);
  assert.match(rendered, /local-user-mode/);
  assert.match(rendered, /Lumo is testing whether repo-level rails/);
  assert.match(rendered, /Avoid:[\s\S]*Lumo guarantees better code\./);
  assert.match(rendered, /manually sends the approved DM/);
});
