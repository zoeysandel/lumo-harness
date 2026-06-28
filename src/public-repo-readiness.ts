import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export type PublicRepoCheckStatus = "pass" | "fail";

export type PublicRepoCheck = {
  name: string;
  status: PublicRepoCheckStatus;
  detail: string;
};

export type PublicRepoReadinessReport = {
  status: "ready" | "not_ready";
  checks: PublicRepoCheck[];
};

const requiredPublicPaths = [
  "README.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  ".gitignore",
  "src",
  "scripts",
  "fixtures",
  "docs",
  "docs/lumo-init-mvp-scope.md",
  "docs/lumo-v0-test-brief.md",
  "docs/control-layer-walkthrough.md",
  "docs/golden-use-case.md",
  "docs/nextjs-harness-quality-bar.md",
  "docs/dogfood-nextjs-larger-projects.md",
  "docs/first-tester-decision-map.md",
  "docs/first-tester-feedback-scenarios.md",
  "docs/private-tester-share-manifest.md",
  "docs/public-repo-checklist.md",
  "docs/examples/dashboard-action-proof-card.html",
  "docs/examples/dashboard-action-manual-review.md",
  "docs/examples/dashboard-action-x-draft.md",
  "docs/examples/screenshots/dashboard-action-proof-card.png",
];

const requiredIgnoredPaths = [
  "node_modules/",
  "dist/",
  ".env",
  ".env.*",
  ".lumo/",
  "coverage/",
  "eval-runs/",
  "tmp/",
  "*.log",
];

const shareSafeDocs = [
  "docs/public-repo-checklist.md",
  "docs/lumo-v0-test-brief.md",
  "docs/control-layer-walkthrough.md",
  "docs/lumo-init-mvp-scope.md",
  "docs/golden-use-case.md",
  "docs/nextjs-harness-quality-bar.md",
  "docs/dogfood-nextjs-larger-projects.md",
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
  "docs/first-tester-packet.generated.md",
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

export async function checkPublicRepoReadiness(repoRoot: string): Promise<PublicRepoReadinessReport> {
  const checks: PublicRepoCheck[] = [];

  checks.push(await requiredPublicFilesExist(repoRoot));
  checks.push(await localOutputsAreIgnored(repoRoot));
  checks.push(await stableDocsAreShareSafe(repoRoot));
  checks.push(await checklistHasClaimBoundary(repoRoot));
  checks.push(await testerGateIsStillExplicit(repoRoot));
  checks.push(await packageHasPublishGuard(repoRoot));

  return {
    status: checks.some((check) => check.status === "fail") ? "not_ready" : "ready",
    checks,
  };
}

export function renderPublicRepoReadinessReport(report: PublicRepoReadinessReport): string {
  return [
    "# Lumo Public Repo Readiness",
    "",
    `Status: ${report.status}`,
    "",
    "| Check | Status | Detail |",
    "| --- | --- | --- |",
    ...report.checks.map((check) => `| ${check.name} | ${check.status.toUpperCase()} | ${escapeTableCell(check.detail)} |`),
    "",
    report.status === "ready"
      ? "Next: keep this as a local gate. Do not publish or post until the private tester checkpoint moves past `pending_manual_send`."
      : "Next: fix failing checks before sending a tester snapshot or creating a public repo.",
    "",
  ].join("\n");
}

async function requiredPublicFilesExist(repoRoot: string): Promise<PublicRepoCheck> {
  const missing: string[] = [];

  for (const relativePath of requiredPublicPaths) {
    try {
      await stat(path.join(repoRoot, relativePath));
    } catch {
      missing.push(relativePath);
    }
  }

  return missing.length === 0
    ? pass("Public package paths", `${requiredPublicPaths.length} expected paths present`)
    : fail("Public package paths", `Missing: ${missing.join(", ")}`);
}

async function localOutputsAreIgnored(repoRoot: string): Promise<PublicRepoCheck> {
  const gitignore = await readText(repoRoot, ".gitignore");
  const ignoredLines = new Set(gitignore.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  const missing = requiredIgnoredPaths.filter((ignoredPath) => !ignoredLines.has(ignoredPath));

  return missing.length === 0
    ? pass("Local output ignore rules", "Generated outputs, env files, and logs are ignored")
    : fail("Local output ignore rules", `Missing .gitignore entries: ${missing.join(", ")}`);
}

async function stableDocsAreShareSafe(repoRoot: string): Promise<PublicRepoCheck> {
  const hits: string[] = [];

  for (const relativePath of shareSafeDocs) {
    const content = await readText(repoRoot, relativePath);

    for (const pattern of forbiddenTextPatterns) {
      if (pattern.test(content)) {
        hits.push(`${relativePath} matched ${pattern}`);
      }
    }
  }

  return hits.length === 0
    ? pass("Share-safe stable docs", `${shareSafeDocs.length} stable docs checked`)
    : fail("Share-safe stable docs", hits.join("; "));
}

async function checklistHasClaimBoundary(repoRoot: string): Promise<PublicRepoCheck> {
  const checklist = await readText(repoRoot, "docs/public-repo-checklist.md");
  const required = [
    /Nothing has been published/i,
    /Do not publish these generated\/local folders/i,
    /Lumo helps make agent work smaller, more reviewable, and easier to prove/i,
    /Lumo guarantees better output/i,
    /Do not publish a public launch claim until at least one private tester/i,
  ];
  const missing = required.filter((pattern) => !pattern.test(checklist)).map(String);

  return missing.length === 0
    ? pass("Claim boundary", "Checklist separates safe claim, no-go claims, and publish gate")
    : fail("Claim boundary", `Missing: ${missing.join(", ")}`);
}

async function testerGateIsStillExplicit(repoRoot: string): Promise<PublicRepoCheck> {
  const feedbackLog = await readText(repoRoot, "docs/first-tester-feedback-log.md");
  const checklist = await readText(repoRoot, "docs/public-repo-checklist.md");
  const generatedPacket = await readText(repoRoot, "docs/first-tester-packet.generated.md");

  const checks = [
    /Manual send status \| `not_sent`/.test(feedbackLog),
    /pending_manual_send/.test(checklist),
    /Status: draft only\. Nothing has been sent\./.test(generatedPacket),
  ];

  return checks.every(Boolean)
    ? pass("Tester send gate", "Tester invite remains approved but not sent")
    : fail("Tester send gate", "Expected pending_manual_send / not_sent status was not found");
}

async function packageHasPublishGuard(repoRoot: string): Promise<PublicRepoCheck> {
  const packageJson = JSON.parse(await readText(repoRoot, "package.json")) as {
    private?: boolean;
    scripts?: Record<string, string>;
  };
  const missingScripts = ["build", "check:local", "test", "typecheck", "tester:check", "tester:feedback", "tester:next", "tester:share", "public:check"].filter(
    (scriptName) => !packageJson.scripts?.[scriptName],
  );

  if (missingScripts.length > 0) {
    return fail("Package publish guard", `Missing scripts: ${missingScripts.join(", ")}`);
  }

  return packageJson.private === true
    ? pass("Package publish guard", "`private: true` prevents accidental npm publishing")
    : fail("Package publish guard", "`private: true` is required before public GitHub readiness");
}

async function readText(repoRoot: string, relativePath: string): Promise<string> {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

function pass(name: string, detail: string): PublicRepoCheck {
  return { name, status: "pass", detail };
}

function fail(name: string, detail: string): PublicRepoCheck {
  return { name, status: "fail", detail };
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
