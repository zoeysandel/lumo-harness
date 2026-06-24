import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export type ReadinessStatus = "pass" | "warn" | "fail";

export type ReadinessCheck = {
  name: string;
  status: ReadinessStatus;
  detail: string;
};

export type TesterReadinessReport = {
  status: "ready" | "ready_with_warnings" | "not_ready";
  checks: ReadinessCheck[];
};

export type TesterPacket = {
  approvalStatus: "pending_zoey_review" | "approved_as_is";
  readiness: TesterReadinessReport;
  inviteMessage: string;
  feedbackTemplate: string;
};

export type GeneratedTesterPacketValidation = {
  status: "pass" | "fail";
  checks: ReadinessCheck[];
};

const requiredFiles = [
  "README.md",
  "docs/first-tester-proof-brief.md",
  "docs/lumo-v0-test-brief.md",
  "docs/first-tester-invite-draft.md",
  "docs/public-tester-quickstart.md",
  "docs/first-tester-review-packet.md",
  "docs/first-tester-feedback-log.md",
  "docs/first-tester-decision-map.md",
  "docs/first-tester-feedback-scenarios.md",
  "docs/private-tester-share-manifest.md",
  "docs/examples/README.md",
  "docs/examples/AGENTS.md.draft",
  "docs/examples/CLAUDE.md.draft",
  "docs/examples/workflows/bugfix.md",
  "docs/examples/workflows/feature.md",
  "docs/examples/workflows/review.md",
  "docs/examples/dashboard-action-proof-card.html",
  "docs/examples/dashboard-action-manual-review.md",
  "docs/examples/dashboard-action-x-draft.md",
  "docs/examples/screenshots/dashboard-action-proof-card.png",
];

const shareSafeExampleFiles = [
  "docs/examples/README.md",
  "docs/examples/AGENTS.md.draft",
  "docs/examples/CLAUDE.md.draft",
  "docs/examples/workflows/bugfix.md",
  "docs/examples/workflows/feature.md",
  "docs/examples/workflows/review.md",
  "docs/examples/dashboard-action-proof-card.html",
  "docs/examples/dashboard-action-manual-review.md",
  "docs/examples/dashboard-action-x-draft.md",
];

const forbiddenTextPatterns = [
  /\/Users\//,
  /zoeysandel/i,
  /file:\/\//i,
  /OPENAI_API_KEY/,
  /CRM_WEBHOOK/,
  /DATABASE_URL/,
  /BILLING_API_KEY/,
  /sk-[A-Za-z0-9_-]+/,
];

export async function checkTesterReadiness(repoRoot: string): Promise<TesterReadinessReport> {
  const checks: ReadinessCheck[] = [];
  const packageJson = await readText(repoRoot, "package.json");

  checks.push(await requiredFilesExist(repoRoot));
  checks.push(await exampleTextIsShareSafe(repoRoot));
  checks.push(await proofCardHasBoundaries(repoRoot));
  checks.push(await xDraftIsDraftOnly(repoRoot));
  checks.push(await quickstartHasReproductionPath(repoRoot));
  checks.push(await reviewPacketKeepsHumanGate(repoRoot));
  checks.push(await inviteDraftMatchesCurrentWedge(repoRoot));
  checks.push(await packageScriptsExist(packageJson));
  checks.push(await screenshotLooksNonEmpty(repoRoot));
  checks.push(await sourceRunIsOptional(repoRoot));

  return {
    status: summarizeStatus(checks),
    checks,
  };
}

export function renderTesterReadinessReport(report: TesterReadinessReport): string {
  const icon: Record<ReadinessStatus, string> = {
    pass: "PASS",
    warn: "WARN",
    fail: "FAIL",
  };

  return [
    "# Lumo Tester Readiness",
    "",
    `Status: ${report.status}`,
    "",
    "| Check | Status | Detail |",
    "| --- | --- | --- |",
    ...report.checks.map((check) => `| ${check.name} | ${icon[check.status]} | ${escapeTableCell(check.detail)} |`),
    "",
    report.status === "not_ready"
      ? "Next: fix failing checks before asking a private tester."
      : "Next: Zoey can review the first tester packet and decide whether to send it.",
    "",
  ].join("\n");
}

export async function buildTesterPacket(repoRoot: string): Promise<TesterPacket> {
  const readiness = await checkTesterReadiness(repoRoot);
  const inviteDraft = await readText(repoRoot, "docs/first-tester-invite-draft.md");
  const reviewPacket = await readText(repoRoot, "docs/first-tester-review-packet.md");

  return {
    approvalStatus: /approved_as_is/i.test(reviewPacket) ? "approved_as_is" : "pending_zoey_review",
    readiness,
    inviteMessage: extractFencedBlockAfterHeading(inviteDraft, "Short DM") ?? "UNCONFIRMED: Short DM block missing.",
    feedbackTemplate:
      extractFencedBlockAfterHeading(inviteDraft, "Feedback Template") ?? "UNCONFIRMED: Feedback Template block missing.",
  };
}

export function renderTesterPacket(packet: TesterPacket): string {
  return [
    "# Lumo First Tester Packet",
    "",
    "Status: draft only. Nothing has been sent.",
    `Approval: ${packet.approvalStatus}.`,
    "",
    "## Readiness",
    "",
    renderTesterReadinessReport(packet.readiness).trim(),
    "",
    "## Decision Gate",
    "",
    "| Decision | Meaning |",
    "| --- | --- |",
    "| `approve_as_is` | Send the DM manually to one private tester. |",
    "| `edit_then_send` | Edit the message first, then send manually. |",
    "| `hold` | Tighten proof/docs before asking anyone. |",
    "",
    "## Exact DM Draft",
    "",
    fenced(packet.inviteMessage.trim()),
    "",
    "## Files To Point Tester At",
    "",
    "Use `docs/private-tester-share-manifest.md` before sharing anything externally.",
    "",
    "- `docs/first-tester-proof-brief.md`",
    "- `docs/lumo-v0-test-brief.md`",
    "- `docs/public-tester-quickstart.md`",
    "- `docs/examples/dashboard-action-proof-card.html`",
    "- `docs/examples/dashboard-action-manual-review.md`",
    "- `docs/examples/screenshots/dashboard-action-proof-card.png`",
    "",
    "## Feedback Template",
    "",
    fenced(packet.feedbackTemplate.trim()),
    "",
    "## After Feedback Routing",
    "",
    "Use `docs/first-tester-decision-map.md` after feedback is recorded. Use `docs/first-tester-feedback-scenarios.md` only as synthetic examples of the four routes. This is for choosing the next Lumo checkpoint, not for making a public claim.",
    "",
    "## Claim Boundary",
    "",
    "Use:",
    "",
    fenced(
      [
        "Lumo is testing whether repo-level rails make coding-agent output more bounded,",
        "reviewable, and honest about what was not verified.",
      ].join("\n"),
    ),
    "",
    "Avoid:",
    "",
    "- `Lumo makes AI coding safe.`",
    "- `Lumo guarantees better code.`",
    "- `Lumo works for every repo.`",
    "",
    "## Next Step",
    "",
    packet.readiness.status === "not_ready"
      ? "Fix the failing readiness checks before asking a tester."
      : packet.approvalStatus === "approved_as_is"
        ? "Zoey manually sends the approved DM to one private tester, then records summarized feedback."
        : "Zoey reviews this packet and chooses `approve_as_is`, `edit_then_send`, or `hold`.",
    "",
  ].join("\n");
}

export async function validateGeneratedTesterPacket(repoRoot: string): Promise<GeneratedTesterPacketValidation> {
  const inviteDraft = await readText(repoRoot, "docs/first-tester-invite-draft.md");
  const generatedPacket = await readText(repoRoot, "docs/first-tester-packet.generated.md");
  const inviteMessage = extractFencedBlockAfterHeading(inviteDraft, "Short DM") ?? "";
  const feedbackTemplate = extractFencedBlockAfterHeading(inviteDraft, "Feedback Template") ?? "";
  const checks = [
    generatedPacketMatchesSource("Generated packet DM", generatedPacket, inviteMessage),
    generatedPacketMatchesSource("Generated packet feedback template", generatedPacket, feedbackTemplate),
    generatedPacketHasHumanGate(generatedPacket),
    generatedPacketIsShareSafe(generatedPacket),
  ];

  return {
    status: checks.some((check) => check.status === "fail") ? "fail" : "pass",
    checks,
  };
}

function summarizeStatus(checks: ReadinessCheck[]): TesterReadinessReport["status"] {
  if (checks.some((check) => check.status === "fail")) return "not_ready";
  if (checks.some((check) => check.status === "warn")) return "ready_with_warnings";
  return "ready";
}

function extractFencedBlockAfterHeading(content: string, heading: string): string | null {
  const match = content.match(new RegExp(`## ${escapeRegExp(heading)}\\n\\n\`\`\`txt\\n([\\s\\S]*?)\\n\`\`\``));
  return match?.[1] ?? null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function requiredFilesExist(repoRoot: string): Promise<ReadinessCheck> {
  const missing: string[] = [];

  for (const file of requiredFiles) {
    try {
      const stats = await stat(path.join(repoRoot, file));
      if (!stats.isFile()) missing.push(file);
    } catch {
      missing.push(file);
    }
  }

  return missing.length === 0
    ? pass("Required tester files", `${requiredFiles.length} files present`)
    : fail("Required tester files", `Missing: ${missing.join(", ")}`);
}

async function exampleTextIsShareSafe(repoRoot: string): Promise<ReadinessCheck> {
  const hits: string[] = [];

  for (const file of shareSafeExampleFiles) {
    const content = await readText(repoRoot, file);

    for (const pattern of forbiddenTextPatterns) {
      if (pattern.test(content)) {
        hits.push(`${file} matched ${pattern}`);
      }
    }
  }

  return hits.length === 0
    ? pass("Share-safe example text", "No local paths, obvious secret markers, or private-name markers found")
    : fail("Share-safe example text", hits.join("; "));
}

function generatedPacketMatchesSource(name: string, generatedPacket: string, sourceBlock: string): ReadinessCheck {
  if (!sourceBlock.trim()) {
    return fail(name, "Source block missing");
  }

  return generatedPacket.includes(sourceBlock.trim())
    ? pass(name, "Generated packet matches current source block")
    : fail(name, "Generated packet is stale; rerun `npm run tester:packet`");
}

function generatedPacketHasHumanGate(generatedPacket: string): ReadinessCheck {
  const required = [
    /Status: draft only\. Nothing has been sent\./i,
    /Approval: approved_as_is\.|Approval: pending_zoey_review\./i,
    /approve_as_is/i,
    /edit_then_send/i,
    /hold/i,
    /Zoey reviews this packet|Zoey manually sends the approved DM/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(generatedPacket)).map(String);

  return missing.length === 0
    ? pass("Generated packet human gate", "Draft-only send/edit/hold gate is present")
    : fail("Generated packet human gate", `Missing: ${missing.join(", ")}`);
}

function generatedPacketIsShareSafe(generatedPacket: string): ReadinessCheck {
  const hits = forbiddenTextPatterns.filter((pattern) => pattern.test(generatedPacket)).map(String);

  return hits.length === 0
    ? pass("Generated packet share safety", "No local paths, obvious secret markers, or private-name markers found")
    : fail("Generated packet share safety", `Unsafe marker: ${hits.join(", ")}`);
}

async function proofCardHasBoundaries(repoRoot: string): Promise<ReadinessCheck> {
  const content = await readText(repoRoot, "docs/examples/dashboard-action-proof-card.html");
  const required = [
    /Same prompt\. Same fixture/i,
    /Eval hypothesis/i,
    /Harness lever/i,
    /False positive avoided/i,
    /What this proves/i,
    /What this does not prove/i,
    /clean-room behavior independent from a user's global Codex setup/i,
    /Touched risk seams: auth and db\/persistence/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(content)).map(String);

  if (/guarantees better code|makes AI development safe/i.test(content)) {
    missing.push("overclaim boundary");
  }

  return missing.length === 0
    ? pass("Proof card boundary", "Hypothesis, proof, non-proof, and risk seam signal are visible")
    : fail("Proof card boundary", `Missing or unsafe: ${missing.join(", ")}`);
}

async function xDraftIsDraftOnly(repoRoot: string): Promise<ReadinessCheck> {
  const content = await readText(repoRoot, "docs/examples/dashboard-action-x-draft.md");
  const required = [
    /Status: draft only\. Do not post without Zoey approval\./i,
    /Eval hypothesis:/i,
    /What this does not prove:/i,
    /clean-room behavior independent from a user's global Codex setup/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(content)).map(String);

  return missing.length === 0
    ? pass("X draft safety", "Draft-only approval gate and non-proof boundary are present")
    : fail("X draft safety", `Missing: ${missing.join(", ")}`);
}

async function quickstartHasReproductionPath(repoRoot: string): Promise<ReadinessCheck> {
  const content = await readText(repoRoot, "docs/public-tester-quickstart.md");
  const required = [
    /npm install/i,
    /npm run build/i,
    /npm run preview:dashboard/i,
    /npm run eval:codex -- --case nextjs-stateful-ai-risk/i,
    /npm run eval:card/i,
    /What This Proves/i,
    /What This Does Not Prove/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(content)).map(String);

  return missing.length === 0
    ? pass("Quickstart reproduction path", "Install, preview, eval, card, proof, and non-proof steps are documented")
    : fail("Quickstart reproduction path", `Missing: ${missing.join(", ")}`);
}

async function reviewPacketKeepsHumanGate(repoRoot: string): Promise<ReadinessCheck> {
  const content = await readText(repoRoot, "docs/first-tester-review-packet.md");
  const required = [
    /Nothing has been sent\./i,
    /pending_zoey_review|approved_as_is/i,
    /approve_as_is/i,
    /edit_then_send/i,
    /hold/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(content)).map(String);

  return missing.length === 0
    ? pass("Private tester human gate", "Send/edit/hold decision is explicit and nothing is marked sent")
    : fail("Private tester human gate", `Missing: ${missing.join(", ")}`);
}

async function inviteDraftMatchesCurrentWedge(repoRoot: string): Promise<ReadinessCheck> {
  const content = await readText(repoRoot, "docs/first-tester-invite-draft.md");
  const required = [
    /Status: draft only\. Do not post or send without Zoey reviewing the exact text\./i,
    /TypeScript\/Next\.js/i,
    /Codex\/Claude Code/i,
    /local-user-mode/i,
    /globale Codex AGENTS\.md|global AGENTS\.md/i,
    /review surface[\s\S]*risk boundaries/i,
    /Score these signals 0-2/i,
    /Smaller first slice/i,
    /Risky seams avoided or gated/i,
    /Final answer was honest about not-verified work/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(content)).map(String);

  return missing.length === 0
    ? pass("Tester invite wedge", "Invite names the TypeScript/Next.js scope, local-user-mode caveat, and draft-only gate")
    : fail("Tester invite wedge", `Missing: ${missing.join(", ")}`);
}

async function packageScriptsExist(packageJson: string): Promise<ReadinessCheck> {
  const parsed = JSON.parse(packageJson) as { scripts?: Record<string, string> };
  const scripts = parsed.scripts ?? {};
  const required = [
    "build",
    "check:local",
    "test",
    "typecheck",
    "preview:dashboard",
    "eval:codex",
    "eval:codex-home",
    "eval:card",
    "tester:check",
    "tester:feedback",
    "tester:next",
    "tester:packet",
    "tester:share",
  ];
  const missing = required.filter((script) => !scripts[script]);

  return missing.length === 0
    ? pass("Package scripts", `${required.length} expected scripts present`)
    : fail("Package scripts", `Missing scripts: ${missing.join(", ")}`);
}

async function screenshotLooksNonEmpty(repoRoot: string): Promise<ReadinessCheck> {
  const stats = await stat(path.join(repoRoot, "docs/examples/screenshots/dashboard-action-proof-card.png"));

  return stats.size > 10_000
    ? pass("Proof screenshot", `${stats.size} bytes`)
    : fail("Proof screenshot", `Screenshot is too small (${stats.size} bytes)`);
}

async function sourceRunIsOptional(repoRoot: string): Promise<ReadinessCheck> {
  const sourceRun = "eval-runs/2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk/comparison.md";

  try {
    const content = await readText(repoRoot, sourceRun);

    return /Eval Quality Gate/i.test(content) && /Instruction Environment/i.test(content)
      ? pass("Optional source run", "Local source run exists and includes the eval quality gate plus instruction environment")
      : warn("Optional source run", "Local source run exists but does not show the eval quality gate plus instruction environment");
  } catch {
    return warn("Optional source run", "Ignored eval-runs are absent; stable docs/examples remain enough for a tester preview");
  }
}

async function readText(repoRoot: string, relativePath: string): Promise<string> {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

function pass(name: string, detail: string): ReadinessCheck {
  return { name, status: "pass", detail };
}

function warn(name: string, detail: string): ReadinessCheck {
  return { name, status: "warn", detail };
}

function fail(name: string, detail: string): ReadinessCheck {
  return { name, status: "fail", detail };
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function fenced(value: string): string {
  return ["```txt", value, "```"].join("\n");
}
