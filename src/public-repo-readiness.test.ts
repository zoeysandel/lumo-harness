import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { checkPublicRepoReadiness, renderPublicRepoReadinessReport } from "./public-repo-readiness.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

test("public repo readiness is a local gate and does not publish", async () => {
  const report = await checkPublicRepoReadiness(repoRoot);
  const rendered = renderPublicRepoReadinessReport(report);

  assert.equal(report.status, "ready");
  assert.equal(report.checks.some((check) => check.status === "fail"), false);
  assert.ok(report.checks.some((check) => check.name === "Local output ignore rules"));
  assert.ok(report.checks.some((check) => check.name === "Share-safe stable docs"));
  assert.ok(report.checks.some((check) => check.name === "Tester send gate"));
  assert.match(rendered, /Status: ready/);
  assert.match(rendered, /Do not publish or post until the private tester checkpoint/);
});
