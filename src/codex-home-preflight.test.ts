import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkCodexHome, renderCodexHomePreflight } from "./codex-home-preflight.js";

test("custom Codex home preflight passes when no global AGENTS exists", async () => {
  const codexHome = await mkdtemp(path.join(os.tmpdir(), "lumo-codex-home-"));
  const report = await checkCodexHome({
    codexHome,
    caseName: "nextjs-dashboard-action-risk",
    requireNoGlobalAgents: true,
  });

  assert.equal(report.ready, true);
  assert.match(report.command, /--require-no-global-agents/);
  assert.ok(report.checks.some((check) => check.name === "Global AGENTS.md" && check.status === "pass"));

  const rendered = renderCodexHomePreflight(report);
  assert.match(rendered, /Status: ready/);
  assert.match(rendered, /does not copy auth files/i);
});

test("custom Codex home preflight fails strict mode when global AGENTS exists", async () => {
  const codexHome = await mkdtemp(path.join(os.tmpdir(), "lumo-codex-home-"));
  await writeFile(path.join(codexHome, "AGENTS.md"), "# Global rules\n");

  const report = await checkCodexHome({
    codexHome,
    caseName: "nextjs-dashboard-action-risk",
    requireNoGlobalAgents: true,
  });

  assert.equal(report.ready, false);
  assert.ok(report.checks.some((check) => check.name === "Global AGENTS.md" && check.status === "fail"));
});
