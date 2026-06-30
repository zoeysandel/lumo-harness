import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createThreadCheckpointCard, renderThreadCheckpointCard } from "./thread-checkpoint.js";

const tab3017CasePath = fileURLToPath(new URL("../docs/cases/tab-3017-thread-checkpoint.md", import.meta.url));

test("thread checkpoint pivots the TAB-3017 case away from the old framing", async () => {
  const content = await readFile(tab3017CasePath, "utf8");
  const card = createThreadCheckpointCard({
    content,
    inputPath: tab3017CasePath,
    task: "Decide whether TAB-3017 should still be framed as direct-send.",
  });

  assert.equal(card.status, "pivot");
  assert.match(card.currentFraming, /Direct-send can possibly cause duplicate outbound/i);
  assert.ok(card.evidence.some((item) => /incident was not just a UI artifact/i.test(item)));
  assert.ok(card.notProven.some((item) => /Whether direct-send was involved/i.test(item)));
  assert.match(card.driftRisk, /miss the incident path/i);
  assert.match(card.recommendation, /Reframe TAB-3017/i);
  assert.match(card.userDecision, /Approve Linear reframe/i);
});

test("thread checkpoint renders a readable decision card", async () => {
  const content = await readFile(tab3017CasePath, "utf8");
  const card = createThreadCheckpointCard({ content, inputPath: tab3017CasePath });
  const rendered = renderThreadCheckpointCard(card, { inputPath: tab3017CasePath });

  assert.match(rendered, /# Lumo Thread Checkpoint/);
  assert.match(rendered, /## Status: pivot/);
  assert.match(rendered, /## Current Framing/);
  assert.match(rendered, /## Not Proven/);
  assert.match(rendered, /Read-only: no files were written/);
});

test("thread checkpoint asks to check again for unconfirmed packets", () => {
  const card = createThreadCheckpointCard({
    content: [
      "# Small Packet",
      "",
      "Current framing: add a feature.",
      "",
      "Not proven: verification command has not run.",
    ].join("\n"),
  });

  assert.equal(card.status, "check_again");
  assert.match(card.notProven.join(" "), /verification command/i);
});

test("thread checkpoint preserves agent packet section prose", () => {
  const card = createThreadCheckpointCard({
    content: [
      "# Lumo Thread Checkpoint Packet",
      "",
      "Status: `pivot`",
      "",
      "Current framing: the thread is separating a code-risk from an incident path.",
      "",
      "## What Was Proven",
      "",
      "- The direct-send code-risk exists.",
      "- The incident evidence points elsewhere.",
      "",
      "## What Stayed Unproven",
      "",
      "- Direct-send caused this incident.",
      "",
      "## Drift Risk",
      "",
      "The thread may keep treating the incident as proof for the wrong code path.",
      "",
      "## Recommendation",
      "",
      "Reframe the issue and trace the first outbound before choosing a fix.",
      "",
      "## User Decision",
      "",
      "Ask Zoey before any Linear update, code fix, provider call, or production mutation.",
      "",
      "## Not Verified",
      "",
      "- Provider logs were not checked.",
      "- Runtime application logs were not checked.",
    ].join("\n"),
  });

  assert.equal(card.status, "pivot");
  assert.match(card.driftRisk, /wrong code path/i);
  assert.match(card.recommendation, /trace the first outbound/i);
  assert.match(card.userDecision, /Ask Zoey before any Linear update/i);
  assert.ok(card.notVerified.some((item) => /Provider logs were not checked/i.test(item)));
  assert.ok(card.notVerified.some((item) => /Thread checkpoint inspected the supplied packet only/i.test(item)));
});
