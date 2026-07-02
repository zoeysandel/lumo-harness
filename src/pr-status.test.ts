import assert from "node:assert/strict";
import test from "node:test";
import { createPrStatusCard, renderPrStatusCard, type PrStatusInput } from "./pr-status.js";

test("pr-status returns go when metadata is clear", () => {
  const card = createPrStatusCard(clearInput());

  assert.equal(card.status, "go");
  assert.equal(card.checks.success, 2);
  assert.equal(card.reviewThreads.activeBotFindings, 0);
  assert.match(card.recommendation, /continue the approved/i);
});

test("pr-status pauses on active bot findings even when checks pass", () => {
  const input = clearInput();
  input.reviewThreads = [
    {
      isResolved: false,
      isOutdated: false,
      comments: { nodes: [{ author: { login: "chatgpt-codex-connector" }, body: "Potential blocker" }] },
    },
  ];
  const card = createPrStatusCard(input);

  assert.equal(card.status, "pause");
  assert.equal(card.reviewThreads.activeBotFindings, 1);
  assert.match(card.why, /active bot finding/i);
});

test("pr-status asks to check again while checks are pending", () => {
  const input = clearInput();
  input.view.statusCheckRollup = [
    { name: "build", status: "COMPLETED", conclusion: "SUCCESS" },
    { name: "release-gate", status: "IN_PROGRESS", conclusion: null },
  ];
  const card = createPrStatusCard(input);

  assert.equal(card.status, "check_again");
  assert.equal(card.checks.pending, 1);
  assert.match(card.userDecision, /No product decision/i);
});

test("pr-status treats merged PRs as a release-proof handoff", () => {
  const input = clearInput();
  input.view.state = "MERGED";
  input.view.mergeStateStatus = "UNKNOWN";
  input.reviewThreads = [
    {
      isResolved: false,
      isOutdated: false,
      comments: { nodes: [{ author: { login: "chatgpt-codex-connector" }, body: "Late stale metadata" }] },
    },
  ];
  const card = createPrStatusCard(input);

  assert.equal(card.status, "check_again");
  assert.match(card.why, /already merged/i);
  assert.match(card.recommendation, /deployment status/i);
});

test("pr-status render shows proof and not-verified boundaries", () => {
  const rendered = renderPrStatusCard(createPrStatusCard(clearInput()));

  assert.match(rendered, /# Lumo PR Status/);
  assert.match(rendered, /## Status: go/);
  assert.match(rendered, /## Evidence Used/);
  assert.match(rendered, /did not read CI logs/i);
  assert.match(rendered, /Read-only: no GitHub mutation was performed/);
});

function clearInput(): PrStatusInput {
  return {
    repo: "tabmedianl/linkwise-backend",
    pr: 2192,
    view: {
      number: 2192,
      title: "Release develop to main",
      url: "https://github.com/tabmedianl/linkwise-backend/pull/2192",
      state: "OPEN",
      isDraft: false,
      headRefName: "codex-release",
      baseRefName: "main",
      mergeStateStatus: "CLEAN",
      reviewDecision: "APPROVED",
      statusCheckRollup: [
        { name: "verify-prod-migrations", status: "COMPLETED", conclusion: "SUCCESS" },
        { name: "release-gate-evaluator", status: "COMPLETED", conclusion: "SUCCESS" },
      ],
    },
    reviewThreads: [
      {
        isResolved: false,
        isOutdated: true,
        comments: { nodes: [{ author: { login: "chatgpt-codex-connector" }, body: "Old finding" }] },
      },
    ],
  };
}
