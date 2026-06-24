import path from "node:path";
import type { CodexSynthesis } from "./codex-synthesis.js";
import type { RepoCommand, RepoScan, RiskSignals } from "./schemas.js";

type BadgeTone = "good" | "warn" | "danger" | "neutral";
type RubricItem = {
  title: string;
  score: 0 | 1 | 2;
  evidence: string;
  next: string;
};

export function renderHtmlReadinessReport(scan: RepoScan, codexSynthesis?: CodexSynthesis): string {
  const repoName = path.basename(scan.repoPath);
  const stack = formatStack(scan);
  const riskItems = formatRiskItems(scan.risks);
  const rubric = buildRubric(scan);
  const rubricScore = rubric.reduce((total, item) => total + item.score, 0);
  const rubricMax = rubric.length * 2;
  const readinessTone = readinessBadgeTone(scan.readiness);
  const missingCount = scan.missingRails.length;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Lumo Harness Report - ${escapeHtml(repoName)}</title>
  <style>
${styles()}
  </style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">Lumo Harness</p>
        <h1>Lumo Rubric Report</h1>
        <p class="summary">A heuristic check of how ready this repo is for controlled Codex or Claude Code work. The report scores repo rails, verification, workflow clarity, risk gates, boundaries, and proof habits.</p>
      </div>
      <div class="meta-card">
        <span class="label">Repo</span>
        <strong>${escapeHtml(repoName)}</strong>
        <span class="label">Scanned</span>
        <time>${escapeHtml(scan.scannedAt)}</time>
      </div>
    </header>

    <section class="verdict">
      ${badge(readinessLabel(scan.readiness), readinessTone)}
      <span>Rubric ${rubricScore}/${rubricMax}</span>
      <span>${scan.fileCount} files scanned</span>
      <span>${scan.currentRails.length} current rails</span>
      <span>${missingCount} missing rails</span>
      <span>${riskItems.filter((item) => item.active).length} active risk signals</span>
    </section>

    ${panel(
      "Lumo Rubric",
      `<div class="rubric">${rubric.map(renderRubricItem).join("")}</div>`,
    )}

    ${codexSynthesis ? renderCodexSynthesisPanel(codexSynthesis) : ""}

    <section class="grid two">
      ${panel("Stack", stack.length > 0 ? stack.map((item) => pill(item)).join("") : muted("No stack signals detected."))}
      ${panel(
        "Smallest Next Improvement",
        `<p class="large">${escapeHtml(recommendSmallestMove(scan, rubric))}</p><p class="muted">Preview only. Lumo does not write files to the target repo by default.</p>`,
      )}
    </section>

    <section class="grid two">
      ${panel("Current Rails", list(scan.currentRails))}
      ${panel(
        "Top Missing Rails",
        scan.missingRails.length > 0
          ? scan.missingRails
              .map(
                (rail) => `<article class="rail">
                  ${badge(`P${rail.priority}`, rail.priority === 1 ? "danger" : "warn")}
                  <div>
                    <strong>${escapeHtml(rail.title)}</strong>
                    <p>${escapeHtml(rail.whyItMatters)}</p>
                    <code>${escapeHtml(rail.suggestedFile)}</code>
                  </div>
                </article>`,
              )
              .join("")
          : muted("No missing rails detected by the current scanner."),
      )}
    </section>

    <section class="grid two">
      ${panel(
        "Risk Seams",
        riskItems
          .map(
            (item) => `<div class="risk ${item.active ? "risk-active" : ""}">
              ${badge(item.active ? "present" : "not seen", item.active ? "warn" : "neutral")}
              <span>${escapeHtml(item.label)}</span>
            </div>`,
          )
          .join(""),
      )}
      ${panel("Commands", formatCommands(scan.commands))}
    </section>

    ${panel(
      "Not Verified",
      list(codexSynthesis ? [...scan.notVerified, ...codexSynthesis.notVerified] : scan.notVerified),
    )}

    <footer>
      Generated locally by Lumo Harness. This report is heuristic and does not prove runtime behavior.
    </footer>
  </main>
</body>
</html>
`;
}

function styles(): string {
  return `    :root {
      color-scheme: light;
      --bg: #f7f7f4;
      --surface: #ffffff;
      --surface-soft: #fbfbf9;
      --text: #1d1d1f;
      --muted: #6f6f76;
      --border: #e5e2dc;
      --code: #f1f0ec;
      --good: #18794e;
      --good-bg: #edf8f2;
      --warn: #9a5b13;
      --warn-bg: #fff7e6;
      --danger: #b42318;
      --danger-bg: #fff1f0;
      --neutral-bg: #f0f0ed;
      --radius: 8px;
      --shadow: 0 20px 60px rgba(30, 28, 24, 0.07);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0)),
        var(--bg);
      color: var(--text);
      font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .page {
      width: min(1040px, calc(100% - 32px));
      margin: 0 auto;
      padding: 48px 0 64px;
    }

    .hero {
      display: grid;
      grid-template-columns: 1fr minmax(220px, 300px);
      gap: 24px;
      align-items: end;
      margin-bottom: 24px;
    }

    .eyebrow, .label {
      margin: 0 0 6px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: clamp(32px, 4vw, 52px);
      line-height: 1;
      letter-spacing: 0;
    }

    .summary {
      max-width: 680px;
      margin: 18px 0 0;
      color: var(--muted);
      font-size: 16px;
    }

    .meta-card, .panel, .verdict {
      background: rgba(255,255,255,0.88);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }

    .meta-card {
      display: grid;
      gap: 2px;
      padding: 16px;
    }

    .meta-card strong, .meta-card time {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 13px;
    }

    .verdict {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      padding: 14px;
      margin-bottom: 18px;
      color: var(--muted);
    }

    .grid {
      display: grid;
      gap: 18px;
      margin-bottom: 18px;
    }

    .grid.two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .panel {
      padding: 18px;
    }

    .panel h2 {
      margin: 0 0 14px;
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .badge, .pill {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      white-space: nowrap;
    }

    .badge {
      padding: 6px 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pill {
      margin: 0 8px 8px 0;
      padding: 8px 10px;
      background: var(--surface-soft);
      border: 1px solid var(--border);
    }

    .tone-good { color: var(--good); background: var(--good-bg); }
    .tone-warn { color: var(--warn); background: var(--warn-bg); }
    .tone-danger { color: var(--danger); background: var(--danger-bg); }
    .tone-neutral { color: var(--muted); background: var(--neutral-bg); }

    ul {
      margin: 0;
      padding-left: 18px;
    }

    li + li {
      margin-top: 8px;
    }

    .rail {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px;
      padding: 12px 0;
      border-top: 1px solid var(--border);
    }

    .rail:first-child {
      border-top: 0;
      padding-top: 0;
    }

    .rail p {
      margin: 4px 0 8px;
      color: var(--muted);
    }

    .risk {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 0;
      border-top: 1px solid var(--border);
    }

    .risk:first-child { border-top: 0; padding-top: 0; }
    .risk-active span:last-child { color: var(--text); font-weight: 650; }

    .rubric {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .rubric-item {
      background: var(--surface-soft);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px;
    }

    .rubric-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .rubric-title {
      font-weight: 760;
    }

    .score {
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      white-space: nowrap;
    }

    .meter {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 4px;
      margin-bottom: 10px;
    }

    .meter span {
      height: 6px;
      border-radius: 999px;
      background: var(--neutral-bg);
    }

    .meter .filled-good { background: var(--good); }
    .meter .filled-warn { background: var(--warn); }
    .meter .filled-danger { background: var(--danger); }

    .rubric-item p {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
    }

    .rubric-item p + p {
      margin-top: 8px;
    }

    .synthesis {
      margin-top: 10px;
      white-space: pre-wrap;
    }

    .synthesis-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }

    code, pre {
      border-radius: 6px;
      background: var(--code);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
    }

    code { padding: 3px 5px; }

    pre {
      margin: 0;
      padding: 14px;
      overflow-x: auto;
      white-space: pre-wrap;
      color: #2d2a25;
    }

    .large {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 750;
    }

    .muted {
      color: var(--muted);
    }

    footer {
      margin-top: 22px;
      color: var(--muted);
      font-size: 12px;
      text-align: center;
    }

    @media (max-width: 760px) {
      .page { width: min(100% - 24px, 1040px); padding-top: 28px; }
      .hero, .grid.two, .rubric { grid-template-columns: 1fr; }
      h1 { font-size: 34px; }
    }`;
}

function panel(title: string, body: string): string {
  return `<section class="panel">
      <h2>${escapeHtml(title)}</h2>
      ${body}
    </section>`;
}

function badge(label: string, tone: BadgeTone): string {
  return `<span class="badge tone-${tone}">${escapeHtml(label)}</span>`;
}

function pill(label: string): string {
  return `<span class="pill">${escapeHtml(label)}</span>`;
}

function muted(message: string): string {
  return `<p class="muted">${escapeHtml(message)}</p>`;
}

function list(items: string[]): string {
  if (items.length === 0) return muted("None detected.");
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function formatStack(scan: RepoScan): string[] {
  return [
    scan.stack.packageManager ? `Package manager: ${scan.stack.packageManager}` : null,
    scan.stack.hasTypeScript ? "TypeScript" : null,
    scan.stack.hasNext ? "Next.js" : null,
    scan.stack.hasVite ? "Vite" : null,
    scan.stack.hasReact ? "React" : null,
    scan.stack.hasZod ? "Zod/schema signals" : null,
    scan.stack.hasOpenAI ? "OpenAI" : null,
    scan.stack.hasVercelAi ? "Vercel AI SDK" : null,
    scan.stack.hasSupabase ? "Supabase" : null,
  ].filter((item): item is string => item !== null);
}

function formatRiskItems(risks: RiskSignals): Array<{ label: string; active: boolean }> {
  return [
    { label: "External provider code", active: risks.hasExternalProviderCode },
    { label: "Database or migration code", active: risks.hasDatabaseOrMigrationCode },
    { label: "Auth code", active: risks.hasAuthCode },
    { label: "Environment access", active: risks.hasEnvAccess },
    { label: "API routes", active: risks.hasApiRoutes },
  ];
}

function formatCommands(commands: RepoCommand[]): string {
  if (commands.length === 0) return muted("No package scripts detected.");
  return `<pre>${escapeHtml(commands.map((command) => `${command.name.padEnd(16)} ${command.command}`).join("\n"))}</pre>`;
}

function renderCodexSynthesisPanel(synthesis: CodexSynthesis): string {
  const statusTone = synthesis.status === "success" ? "good" : "danger";
  return panel(
    "Codex Synthesis",
    `<div class="synthesis-meta">
      ${badge(synthesis.status, statusTone)}
      <code>${escapeHtml(synthesis.command)}</code>
    </div>
    <pre class="synthesis">${escapeHtml(synthesis.content.trim())}</pre>`,
  );
}

function buildRubric(scan: RepoScan): RubricItem[] {
  const verificationCategories = new Set(
    scan.commands
      .filter((command) => ["lint", "typecheck", "test", "build"].includes(command.category))
      .map((command) => command.category),
  );
  const activeRiskCount = formatRiskItems(scan.risks).filter((item) => item.active).length;
  const hasRootAgents = scan.harness.agentRuleFiles.includes("AGENTS.md");
  const hasAnyAgentRules = scan.harness.agentRuleFiles.length > 0;
  const hasRiskGate = scan.missingRails.every((rail) => rail.title !== "Add provider and data approval gates");

  return [
    {
      title: "Repo Contract",
      score: hasRootAgents ? 2 : hasAnyAgentRules ? 1 : 0,
      evidence: hasAnyAgentRules
        ? `Found ${scan.harness.agentRuleFiles.join(", ")}.`
        : "No repo-level AGENTS.md or adapter file detected.",
      next: hasRootAgents ? "Keep it short and update only when repeated friction appears." : "Add a small root AGENTS.md.",
    },
    {
      title: "Verification Rail",
      score: verificationCategories.size >= 3 ? 2 : verificationCategories.size > 0 ? 1 : 0,
      evidence:
        verificationCategories.size > 0
          ? `Detected ${Array.from(verificationCategories).join(", ")} commands.`
          : "No lint, typecheck, test, or build script detected.",
      next: verificationCategories.size >= 3 ? "Name the preferred command order in AGENTS.md." : "Name one safe local verification command.",
    },
    {
      title: "Workflow Shape",
      score: scan.harness.workflowFiles.length > 0 ? 2 : scan.harness.docsFiles.length > 1 ? 1 : 0,
      evidence:
        scan.harness.workflowFiles.length > 0
          ? `Found ${scan.harness.workflowFiles.slice(0, 3).join(", ")}.`
          : "No explicit bugfix, feature, or review workflow found.",
      next: scan.harness.workflowFiles.length > 0 ? "Keep workflows task-sized." : "Add one workflow doc for feature work or bugfixes.",
    },
    {
      title: "Risk Gates",
      score: activeRiskCount === 0 || (hasRiskGate && hasAnyAgentRules) ? 2 : hasRiskGate || hasAnyAgentRules ? 1 : 0,
      evidence:
        activeRiskCount > 0
          ? `${activeRiskCount} risky seams detected.`
          : "No active provider, auth, database, env, or API risk signal detected.",
      next: activeRiskCount > 0 ? "Make stop conditions explicit before provider, data, auth, or external I/O changes." : "Keep this lightweight.",
    },
    {
      title: "Boundary Discipline",
      score: scan.stack.hasZod || scan.harness.schemaFiles.length > 0 ? 2 : scan.risks.hasApiRoutes ? 1 : 0,
      evidence:
        scan.stack.hasZod || scan.harness.schemaFiles.length > 0
          ? "Schema or validation signals detected."
          : scan.risks.hasApiRoutes
            ? "API routes found, but schema boundaries are unclear."
            : "No API boundary or schema signal detected.",
      next:
        scan.stack.hasZod || scan.harness.schemaFiles.length > 0
          ? "Tell agents to reuse existing validation patterns."
          : "Document where request validation and domain boundaries belong.",
    },
    {
      title: "Proof Habit",
      score: scan.harness.evalFiles.length > 0 || scan.harness.fixtureFiles.length > 0 ? 2 : verificationCategories.has("test") ? 1 : 0,
      evidence:
        scan.harness.evalFiles.length > 0 || scan.harness.fixtureFiles.length > 0
          ? "Fixture, eval, mock, or example files detected."
          : verificationCategories.has("test")
            ? "Tests exist, but no fixture/eval habit was detected."
            : "No repeatable proof habit detected.",
      next:
        scan.harness.evalFiles.length > 0 || scan.harness.fixtureFiles.length > 0
          ? "Point agents at the smallest representative fixture."
          : "Add one tiny fixture or example for common agent work.",
    },
  ];
}

function renderRubricItem(item: RubricItem): string {
  const tone = item.score === 2 ? "good" : item.score === 1 ? "warn" : "danger";
  const meterClass = item.score === 2 ? "filled-good" : item.score === 1 ? "filled-warn" : "filled-danger";

  return `<article class="rubric-item">
    <div class="rubric-head">
      <span class="rubric-title">${escapeHtml(item.title)}</span>
      <span class="score">${item.score}/2</span>
    </div>
    <div class="meter">
      <span class="${item.score >= 1 ? meterClass : ""}"></span>
      <span class="${item.score >= 2 ? meterClass : ""}"></span>
    </div>
    ${badge(item.score === 2 ? "strong" : item.score === 1 ? "partial" : "missing", tone)}
    <p>${escapeHtml(item.evidence)}</p>
    <p><strong>Next:</strong> ${escapeHtml(item.next)}</p>
  </article>`;
}

function recommendSmallestMove(scan: RepoScan, rubric: RubricItem[]): string {
  const weakest = rubric.find((item) => item.score === 0) ?? rubric.find((item) => item.score === 1);
  return weakest?.next ?? scan.recommendedFirstHarness;
}

function readinessLabel(readiness: RepoScan["readiness"]): string {
  return readiness.replaceAll("_", " ");
}

function readinessBadgeTone(readiness: RepoScan["readiness"]): BadgeTone {
  if (readiness === "strong_existing_harness") return "good";
  if (readiness === "agent_ready_with_gaps" || readiness === "partial") return "warn";
  return "danger";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
