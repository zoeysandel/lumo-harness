import type { RepoScan } from "./schemas.js";

export function renderReadinessReport(scan: RepoScan): string {
  const stack = [
    scan.stack.hasTypeScript ? "TypeScript" : null,
    scan.stack.hasNext ? "Next.js" : null,
    scan.stack.hasVite ? "Vite" : null,
    scan.stack.hasReact ? "React" : null,
    scan.stack.hasOpenAI ? "OpenAI" : null,
    scan.stack.hasVercelAi ? "Vercel AI SDK" : null,
    scan.stack.hasSupabase ? "Supabase" : null,
  ].filter(Boolean);

  return [
    "# Lumo Harness Agent Readiness",
    "",
    `Repo: ${scan.repoPath}`,
    `Scanned: ${scan.scannedAt}`,
    `Files scanned: ${scan.fileCount}`,
    "",
    `## Verdict: ${scan.readiness}`,
    "",
    scan.readinessReason,
    "",
    "## Stack Signals",
    "",
    `- Package manager: ${scan.stack.packageManager ?? "UNCONFIRMED"}`,
    `- Stack: ${stack.length > 0 ? stack.join(", ") : "UNCONFIRMED"}`,
    "",
    "## Found Rails",
    "",
    ...scan.currentRails.map((rail) => `- ${rail}`),
    "",
    "## Top Missing Rails",
    "",
    ...scan.missingRails.map(
      (rail) => `- ${rail.title} -> ${rail.suggestedFile}: ${rail.whyItMatters}`,
    ),
    "",
    "## Recommended First Harness",
    "",
    scan.recommendedFirstHarness,
    "",
    "## Commands Detected",
    "",
    ...formatCommands(scan),
    "",
    "## Risk Signals",
    "",
    `- External provider code: ${yesNo(scan.risks.hasExternalProviderCode)}`,
    `- Database or migration code: ${yesNo(scan.risks.hasDatabaseOrMigrationCode)}`,
    `- Auth code: ${yesNo(scan.risks.hasAuthCode)}`,
    `- Env access: ${yesNo(scan.risks.hasEnvAccess)}`,
    `- API routes: ${yesNo(scan.risks.hasApiRoutes)}`,
    "",
    "## Not Verified",
    "",
    ...scan.notVerified.map((item) => `- ${item}`),
    "",
    "Mode: preview only. No files were written to the target repo.",
    "",
  ].join("\n");
}

function formatCommands(scan: RepoScan): string[] {
  if (scan.commands.length === 0) return ["- No package scripts detected."];
  return scan.commands.map((command) => `- ${command.name} (${command.category}): \`${command.command}\``);
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}
