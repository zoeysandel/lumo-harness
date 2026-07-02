import assert from "node:assert/strict";
import test from "node:test";
import { createLearnCard, renderLearnCard } from "./learn.js";
import type { RepoScan } from "./schemas.js";

const baseScan: RepoScan = {
  repoPath: "/tmp/repo",
  scannedAt: "2026-07-02T00:00:00.000Z",
  readiness: "strong_existing_harness",
  readinessReason: "Test scan",
  fileCount: 3,
  stack: {
    packageManager: "npm",
    hasPackageJson: true,
    hasTypeScript: true,
    hasNext: true,
    hasVite: false,
    hasReact: true,
    hasZod: false,
    hasOpenAI: false,
    hasVercelAi: false,
    hasSupabase: false,
  },
  commands: [{ name: "test", command: "node --test", category: "test" }],
  harness: {
    agentRuleFiles: ["AGENTS.md"],
    workflowFiles: ["workflows/review.md"],
    docsFiles: ["README.md"],
    promptFiles: [],
    schemaFiles: [],
    fixtureFiles: [],
    evalFiles: [],
    providerFiles: [],
  },
  risks: {
    hasEnvAccess: false,
    hasExternalProviderCode: false,
    hasDatabaseOrMigrationCode: false,
    hasAuthCode: false,
    hasApiRoutes: false,
  },
  currentRails: ["AGENTS.md", "test script"],
  missingRails: [],
  recommendedFirstHarness: "Use existing rails.",
  notVerified: [],
};

function packet(body: string): string {
  return `# Lumo Learn Packet\n\n${body}`;
}

test("learn proposes deterministic_check for repeated CI/setup friction", () => {
  const card = createLearnCard({
    content: packet("## Friction\n- CI setup check failed again.\n\n## Repeated Signal\n- repeated\n\n## Evidence\n- Redacted verification facts.\n\n## Desired Next Time\n- Add a preflight check before work."),
    scan: baseScan,
  });

  assert.equal(card.status, "go");
  assert.equal(card.proposal.type, "deterministic_check");
  assert.equal(card.proposal.target, "nearest local verification script or Lumo preflight note");
});

test("learn proposes repo_rule for repeated approval and safety friction", () => {
  const card = createLearnCard({
    content: packet("## Friction\n- Approval gate was missed again.\n\n## Repeated Signal\n- repeated\n\n## Evidence\n- Redacted approval facts.\n\n## Desired Next Time\n- Pause at the safety boundary."),
    scan: baseScan,
  });

  assert.equal(card.status, "go");
  assert.equal(card.proposal.type, "repo_rule");
  assert.equal(card.proposal.target, "AGENTS.md");
});

test("learn proposes workflow_note for repeated release process friction", () => {
  const card = createLearnCard({
    content: packet("## Friction\n- Release readiness and runtime proof blurred again.\n\n## Repeated Signal\n- repeated\n\n## Evidence\n- Redacted release facts.\n\n## Desired Next Time\n- Separate PR status and runtime proof in the runbook."),
    scan: baseScan,
  });

  assert.equal(card.status, "go");
  assert.equal(card.proposal.type, "workflow_note");
  assert.equal(card.proposal.target, "workflows/review.md");
});

test("learn proposes skill_prompt_update for repeated agent instruction friction", () => {
  const card = createLearnCard({
    content: packet("## Friction\n- Skill prompt tool use instruction was missed again.\n\n## Repeated Signal\n- repeated\n\n## Evidence\n- Redacted agent-behavior facts.\n\n## Desired Next Time\n- Update the prompt instruction after review."),
  });

  assert.equal(card.status, "go");
  assert.equal(card.proposal.type, "skill_prompt_update");
});

test("learn proposes do_nothing for one-off or unclear friction", () => {
  const card = createLearnCard({
    content: packet("## Friction\n- Unclear moment.\n\n## Repeated Signal\n- one_off\n\n## Evidence\n- Redacted facts.\n\n## Desired Next Time\n- Unknown."),
  });

  assert.equal(card.status, "go");
  assert.equal(card.proposal.type, "do_nothing");
});

test("learn returns check_again when repeated signal or evidence is missing", () => {
  const card = createLearnCard({ content: packet("## Friction\n- Something happened.\n\n## Desired Next Time\n- Maybe improve later.") });

  assert.equal(card.status, "check_again");
  assert.equal(card.proposal.type, "do_nothing");
});

test("learn pauses and redacts sensitive-looking packet evidence", () => {
  const card = createLearnCard({
    content: packet("## Friction\n- api_key abc123 was used with production CRM data again.\n\n## Repeated Signal\n- repeated\n\n## Evidence\n- secret api_key abc123\n\n## Desired Next Time\n- Add a rule."),
    task: "Learn from production secret friction",
  });
  const rendered = renderLearnCard(card, { inputSource: "stdin", task: "Learn from production secret friction" });

  assert.equal(card.status, "pause");
  assert.equal(card.proposal.type, "do_nothing");
  assert.ok(card.evidence.some((item) => item === "Sensitive content present; not echoed."));
  assert.doesNotMatch(rendered, /abc123/);
  assert.doesNotMatch(rendered, /api_key abc123/);
});

test("learn pivots on broad auto-writing platform automation", () => {
  const card = createLearnCard({
    content: packet("## Friction\n- Build MCP server and auto-write global rules next time.\n\n## Repeated Signal\n- repeated\n\n## Evidence\n- Redacted facts.\n\n## Desired Next Time\n- Automatic rule rewrite."),
  });

  assert.equal(card.status, "pivot");
  assert.equal(card.proposal.type, "do_nothing");
});

test("learn renderer includes required headings and read-only footer", () => {
  const card = createLearnCard({
    content: packet("## Friction\n- CI check failed again.\n\n## Repeated Signal\n- repeated\n\n## Evidence\n- Redacted facts.\n\n## Desired Next Time\n- Add a check."),
  });
  const rendered = renderLearnCard(card, { inputPath: "packet.md", inputSource: "file" });

  assert.match(rendered, /# Lumo Learn/);
  assert.match(rendered, /## Status:/);
  assert.match(rendered, /## Proposal/);
  assert.match(rendered, /## Blocked Actions/);
  assert.match(rendered, /Read-only: no files were written and no external systems were queried/);
});

test("learn rejects empty packets", () => {
  assert.throws(() => createLearnCard({ content: "  " }), /Learn input must be a non-empty packet/);
});
