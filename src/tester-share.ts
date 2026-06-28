import { readFile } from "node:fs/promises";
import path from "node:path";
import { checkPublicRepoReadiness, type PublicRepoReadinessReport } from "./public-repo-readiness.js";
import { checkTesterFeedback, type FeedbackCheckpointReport } from "./tester-feedback.js";
import { checkTesterReadiness, type TesterReadinessReport } from "./tester-readiness.js";

export type TesterShareStatus = "ready_to_share" | "not_ready";

export type TesterShareCheck = {
  name: string;
  status: "pass" | "fail";
  detail: string;
};

export type TesterShareReport = {
  status: TesterShareStatus;
  checks: TesterShareCheck[];
  minimumShareSet: string[];
  doNotShare: string[];
  testerReadiness: TesterReadinessReport["status"];
  testerFeedback: FeedbackCheckpointReport["status"];
  publicReadiness: PublicRepoReadinessReport["status"];
};

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

export async function checkTesterShare(repoRoot: string): Promise<TesterShareReport> {
  const [manifest, testerReadiness, testerFeedback, publicReadiness] = await Promise.all([
    readFile(path.join(repoRoot, "docs/private-tester-share-manifest.md"), "utf8"),
    checkTesterReadiness(repoRoot),
    checkTesterFeedback(repoRoot),
    checkPublicRepoReadiness(repoRoot),
  ]);
  const minimumShareSet = extractFencedBlockAfterHeading(manifest, "Minimum Share Set");
  const doNotShare = extractFencedBlockAfterHeading(manifest, "Do Not Share");
  const checks = [
    manifestHasExpectedLists(minimumShareSet, doNotShare),
    manifestIsShareSafe(manifest),
    localGatesAreReady(testerReadiness, publicReadiness),
    firstTesterSendGateIsReady(testerFeedback),
  ];

  return {
    status: checks.some((check) => check.status === "fail") ? "not_ready" : "ready_to_share",
    checks,
    minimumShareSet,
    doNotShare,
    testerReadiness: testerReadiness.status,
    testerFeedback: testerFeedback.status,
    publicReadiness: publicReadiness.status,
  };
}

export function renderTesterShareReport(report: TesterShareReport): string {
  return [
    "# Lumo Tester Share Check",
    "",
    `Status: ${report.status}`,
    "",
    "| Area | Status |",
    "| --- | --- |",
    `| Tester readiness | ${report.testerReadiness} |`,
    `| Tester feedback | ${report.testerFeedback} |`,
    `| Public repo readiness | ${report.publicReadiness} |`,
    "",
    "| Check | Status | Detail |",
    "| --- | --- | --- |",
    ...report.checks.map((check) => `| ${check.name} | ${check.status.toUpperCase()} | ${escapeTableCell(check.detail)} |`),
    "",
    "## Minimum Share Set",
    "",
    ...report.minimumShareSet.map((item) => `- \`${item}\``),
    "",
    "## Keep Local",
    "",
    ...report.doNotShare.map((item) => `- \`${item}\``),
    "",
    "Nothing has been sent by this command.",
    "",
    report.status === "ready_to_share"
      ? "Next: Zoey manually sends the approved DM and points the tester at the minimum share set."
      : "Next: fix failing share/readiness checks before contacting a tester.",
    "",
  ].join("\n");
}

function manifestHasExpectedLists(minimumShareSet: string[], doNotShare: string[]): TesterShareCheck {
  const requiredShare = [
    "docs/first-tester-proof-brief.md",
    "docs/lumo-v0-test-brief.md",
    "docs/control-layer-walkthrough.md",
    "docs/public-tester-quickstart.md",
    "docs/examples/dashboard-action-proof-card.html",
    "docs/examples/dashboard-action-manual-review.md",
    "docs/examples/screenshots/dashboard-action-proof-card.png",
  ];
  const requiredLocal = ["eval-runs/", "tmp/", "dist/", "node_modules/", ".env", ".env.*", "*.log"];
  const missingShare = requiredShare.filter((item) => !minimumShareSet.includes(item));
  const missingLocal = requiredLocal.filter((item) => !doNotShare.includes(item));
  const failures = [...missingShare.map((item) => `share ${item}`), ...missingLocal.map((item) => `local ${item}`)];

  return failures.length === 0
    ? pass("Share manifest lists", "Minimum share set and keep-local list are explicit")
    : fail("Share manifest lists", `Missing: ${failures.join(", ")}`);
}

function manifestIsShareSafe(manifest: string): TesterShareCheck {
  const hits = forbiddenTextPatterns.filter((pattern) => pattern.test(manifest)).map(String);

  return hits.length === 0
    ? pass("Manifest share safety", "No local paths, private-name markers, or secret-like markers found")
    : fail("Manifest share safety", `Unsafe marker: ${hits.join(", ")}`);
}

function localGatesAreReady(testerReadiness: TesterReadinessReport, publicReadiness: PublicRepoReadinessReport): TesterShareCheck {
  const failures: string[] = [];

  if (testerReadiness.status === "not_ready") {
    failures.push("tester readiness not ready");
  }

  if (publicReadiness.status === "not_ready") {
    failures.push("public readiness not ready");
  }

  return failures.length === 0
    ? pass("Local readiness gates", "Tester readiness and public readiness are ready")
    : fail("Local readiness gates", failures.join("; "));
}

function firstTesterSendGateIsReady(testerFeedback: FeedbackCheckpointReport): TesterShareCheck {
  if (testerFeedback.approvalStatus !== "approved_as_is") {
    return fail("Manual send gate", "First tester invite is not approved as-is");
  }

  if (testerFeedback.status !== "pending_manual_send") {
    return fail("Manual send gate", `Expected pending_manual_send, got ${testerFeedback.status}`);
  }

  return pass("Manual send gate", "Invite is approved as-is and still pending manual send");
}

function extractFencedBlockAfterHeading(content: string, heading: string): string[] {
  const match = content.match(new RegExp(`## ${escapeRegExp(heading)}[\\s\\S]*?\`\`\`txt\\n([\\s\\S]*?)\\n\`\`\``));
  return match?.[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean) ?? [];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pass(name: string, detail: string): TesterShareCheck {
  return { name, status: "pass", detail };
}

function fail(name: string, detail: string): TesterShareCheck {
  return { name, status: "fail", detail };
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
