import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createHarnessMapCard, readHarnessMapState, renderHarnessMapCard } from "./harness-map.js";
import { scanRepository } from "./scanner.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const dashboardFixturePath = path.join(repoRoot, "fixtures/nextjs-dashboard-action-risk");
const minimalFixturePath = path.join(repoRoot, "fixtures/minimal-ts");

test("harness-map returns check_again when explicit global layers are not checked", async () => {
  const scan = await scanRepository({ repoPath: minimalFixturePath });
  const state = await readHarnessMapState({ repoPath: dashboardFixturePath, codexHome: null, agentsHome: null });
  const card = createHarnessMapCard(scan, state);

  assert.equal(card.status, "check_again");
  assert.equal(card.layers.globalCodex.status, "not_checked");
  assert.ok(card.gaps.some((gap) => /Global Codex layer was not checked/i.test(gap)));
  assert.ok(card.privacyBoundary.some((item) => /skill bodies/i.test(item)));
});

test("harness-map detects fake homes with metadata only", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lumo-harness-map-"));
  const codexHome = path.join(root, "codex");
  const agentsHome = path.join(root, "agents");

  try {
    await mkdir(path.join(codexHome, "skills", "safe-skill"), { recursive: true });
    await mkdir(path.join(agentsHome, "skills", "agent-skill"), { recursive: true });
    await mkdir(path.join(codexHome, "plugins", "proof-plugin"), { recursive: true });
    await writeFile(path.join(codexHome, "AGENTS.md"), "SECRET GLOBAL RULE BODY\n", "utf8");
    await writeFile(path.join(agentsHome, "AGENTS.md"), "SECRET AGENTS RULE BODY\n", "utf8");
    await writeFile(path.join(codexHome, "skills", "safe-skill", "SKILL.md"), "SECRET SKILL BODY\n", "utf8");
    await writeFile(path.join(agentsHome, "skills", "agent-skill", "SKILL.md"), "SECRET AGENT SKILL BODY\n", "utf8");
    await writeFile(path.join(codexHome, "plugins", "proof-plugin", "plugin.json"), '{"name":"proof-plugin"}\n', "utf8");

    const scan = await scanRepository({ repoPath: dashboardFixturePath });
    const state = await readHarnessMapState({ repoPath: dashboardFixturePath, codexHome, agentsHome });
    const card = createHarnessMapCard(scan, state);
    const rendered = renderHarnessMapCard(card, { repoPath: scan.repoPath });

    assert.equal(card.layers.globalCodex.status, "found");
    assert.equal(card.layers.globalAgents.status, "found");
    assert.equal(card.layers.skills.status, "found");
    assert.equal(card.layers.plugins.status, "found");
    assert.ok(card.layers.skills.items.some((item) => item.label === "safe-skill"));
    assert.ok(card.layers.plugins.items.some((item) => item.label === "proof-plugin"));
    assert.doesNotMatch(rendered, /SECRET/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("harness-map pauses when risky seams lack provider or data gates", async () => {
  const scan = await scanRepository({ repoPath: dashboardFixturePath });
  const root = await mkdtemp(path.join(os.tmpdir(), "lumo-harness-map-home-"));

  try {
    await writeFile(path.join(root, "AGENTS.md"), "body not read\n", "utf8");
    const state = await readHarnessMapState({ repoPath: dashboardFixturePath, codexHome: root, agentsHome: root });
    const card = createHarnessMapCard(scan, state);

    assert.equal(card.status, "pause");
    assert.ok(card.gaps.some((gap) => /provider and data approval gates/i.test(gap)));
    assert.match(card.userDecision, /Approve the risky seam/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("harness-map detects repo gaps and renderer headings", async () => {
  const scan = await scanRepository({ repoPath: minimalFixturePath });
  const state = await readHarnessMapState({ repoPath: minimalFixturePath });
  const card = createHarnessMapCard(scan, state);
  const rendered = renderHarnessMapCard(card, { repoPath: scan.repoPath });

  assert.equal(card.status, "check_again");
  assert.equal(card.layers.repoAgents.status, "missing");
  assert.ok(card.gaps.some((gap) => /Add a root AGENTS\.md/i.test(gap)));
  assert.match(rendered, /# Lumo Harness Map/);
  assert.match(rendered, /## Global\/User Layer/);
  assert.match(rendered, /## Repo Agent Layer/);
  assert.match(rendered, /## Privacy Boundary/);
  assert.match(rendered, /Read-only: no files were written and no external systems were queried/);
});

test("harness-map reads repo plugin manifest names only", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lumo-repo-plugin-"));

  try {
    await mkdir(path.join(root, ".codex-plugin"), { recursive: true });
    await writeFile(path.join(root, "package.json"), '{"scripts":{"test":"node --test"}}\n', "utf8");
    await writeFile(path.join(root, ".codex-plugin", "plugin.json"), '{"displayName":"Repo Proof Plugin","secret":"not-rendered"}\n', "utf8");
    const scan = await scanRepository({ repoPath: root });
    const state = await readHarnessMapState({ repoPath: root });
    const card = createHarnessMapCard(scan, state);
    const rendered = renderHarnessMapCard(card, { repoPath: scan.repoPath });

    assert.ok(card.layers.plugins.items.some((item) => item.label === "Repo Proof Plugin"));
    assert.doesNotMatch(rendered, /not-rendered/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
