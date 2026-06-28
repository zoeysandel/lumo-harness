import type { RepoCommand, RepoScan } from "./schemas.js";

export type PreflightStatus = "go" | "check_again" | "pause" | "pivot";

export type PreflightCard = {
  status: PreflightStatus;
  mode: "deterministic" | "deterministic_plus_codex";
  why: string;
  route: string;
  contextNeeded: string[];
  checks: string[];
  stopIf: string[];
  userDecision: string;
  evidence: string[];
  notVerified: string[];
};

export type CodexPreflightSuggestion = {
  status: PreflightStatus;
  why: string;
  route: string;
  contextNeeded: string[];
  stopIf: string[];
  userDecision: string;
  notVerified: string[];
};

type TaskRisk = {
  labels: string[];
  matchedTerms: string[];
};

const RISK_TERMS: Array<{ label: string; pattern: RegExp }> = [
  { label: "auth/session", pattern: /\b(auth|login|logout|session|permission|role|tenant|oauth)\b/i },
  { label: "billing/payment", pattern: /\b(billing|stripe|payment|invoice|subscription|checkout)\b/i },
  { label: "database/migration", pattern: /\b(database|db|migration|schema|prisma|drizzle|supabase|sql)\b/i },
  { label: "provider/external I/O", pattern: /\b(provider|openai|anthropic|api call|webhook|email|notification|crm|external)\b/i },
  { label: "secrets/env/deploy", pattern: /\b(env|secret|token|key|deploy|production|vercel)\b/i },
  { label: "destructive action", pattern: /\b(delete|remove|purge|drop|wipe|destroy)\b/i },
];

const BROAD_TASK_PATTERN = /\b(rewrite everything|rebuild everything|make it production ready|fix everything|clean up the whole|entire app|whole app)\b/i;

export function createPreflightCard(scan: RepoScan, task: string): PreflightCard {
  const trimmedTask = task.trim();
  if (!trimmedTask) {
    throw new Error("--task is required for preflight.");
  }

  const taskRisk = detectTaskRisk(trimmedTask);
  const verificationCommands = preferredVerificationCommands(scan.commands);
  const hasRiskyRepoSeam =
    scan.risks.hasAuthCode ||
    scan.risks.hasDatabaseOrMigrationCode ||
    scan.risks.hasExternalProviderCode ||
    scan.risks.hasEnvAccess ||
    scan.risks.hasApiRoutes;

  if (BROAD_TASK_PATTERN.test(trimmedTask)) {
    return buildCard(scan, {
      status: "pivot",
      why: "The task is too broad for a safe first agent slice.",
      route: "Narrow the request into one visible user outcome or one bug reproduction before implementation.",
      taskRisk,
      verificationCommands,
      extraContext: ["The current product goal or issue that defines the intended outcome."],
      userDecision: "Choose the first small outcome Lumo should route.",
    });
  }

  if (taskRisk.labels.length > 0 && hasRiskyRepoSeam) {
    return buildCard(scan, {
      status: "pause",
      why: `The task mentions ${taskRisk.labels.join(", ")} and this repo has matching risk seams.`,
      route: "Do read-only discovery first. Do not implement until the risky seam and approval boundary are clear.",
      taskRisk,
      verificationCommands,
      extraContext: riskContext(taskRisk),
      userDecision: "Approve the risky seam explicitly, or narrow the task to a safe local slice.",
    });
  }

  if (taskRisk.labels.length > 0) {
    return buildCard(scan, {
      status: "check_again",
      why: `The task mentions ${taskRisk.labels.join(", ")}; Lumo needs one context pass before coding.`,
      route: "Inspect the relevant local files and rules first, then propose the smallest implementation slice.",
      taskRisk,
      verificationCommands,
      extraContext: riskContext(taskRisk),
      userDecision: "Let the agent gather read-only context first, then decide whether implementation is safe.",
    });
  }

  if (scan.readiness === "not_ready" || verificationCommands.length === 0) {
    return buildCard(scan, {
      status: "check_again",
      why: "The repo does not yet expose enough verification or agent-readiness rails for confident implementation.",
      route: "Find the narrowest local context and name a verification command before changing code.",
      taskRisk,
      verificationCommands,
      extraContext: ["README or package scripts that explain how this repo is checked."],
      userDecision: "Decide whether to add/confirm a verification command before implementation.",
    });
  }

  return buildCard(scan, {
    status: "go",
    why: "The task looks bounded and the repo has enough local rails for a small first slice.",
    route: "Make the smallest useful first slice, follow existing repo patterns, then run the narrowest available verification command before claiming done.",
    taskRisk,
    verificationCommands,
    extraContext: [],
    userDecision: "No user decision is needed before read-only context gathering and a small implementation slice.",
  });
}

export function renderPreflightCard(card: PreflightCard, input: { repoPath: string; task: string }): string {
  return [
    "# Lumo Preflight",
    "",
    `Repo: ${input.repoPath}`,
    `Task: ${input.task}`,
    "",
    `## Status: ${card.status}`,
    "",
    `Mode: ${card.mode}`,
    "",
    card.why,
    "",
    "## Recommended Route",
    "",
    card.route,
    "",
    "## Context Needed",
    "",
    ...formatList(card.contextNeeded),
    "",
    "## Checks",
    "",
    ...formatList(card.checks),
    "",
    "## Stop If",
    "",
    ...formatList(card.stopIf),
    "",
    "## User Decision",
    "",
    card.userDecision,
    "",
    "## Evidence Used",
    "",
    ...formatList(card.evidence),
    "",
    "## Not Verified",
    "",
    ...formatList(card.notVerified),
    "",
    "Read-only: no files were written to the target repo.",
    "",
  ].join("\n");
}

export function mergeCodexPreflightSuggestion(
  deterministicCard: PreflightCard,
  suggestion: CodexPreflightSuggestion,
): PreflightCard {
  const status = stricterStatus(deterministicCard.status, suggestion.status);
  const codexStatusLowered = status !== suggestion.status;

  return {
    ...deterministicCard,
    status,
    mode: "deterministic_plus_codex",
    why: codexStatusLowered
      ? `${deterministicCard.why} Codex suggested a less cautious status, so Lumo kept the deterministic safety floor.`
      : suggestion.why.trim() || deterministicCard.why,
    route: suggestion.route.trim() || deterministicCard.route,
    contextNeeded: dedupe([...deterministicCard.contextNeeded, ...suggestion.contextNeeded]),
    stopIf: dedupe([...deterministicCard.stopIf, ...suggestion.stopIf]),
    userDecision: suggestion.userDecision.trim() || deterministicCard.userDecision,
    evidence: dedupe([...deterministicCard.evidence, "Codex preflight synthesis completed in read-only mode."]),
    notVerified: dedupe([
      ...deterministicCard.notVerified,
      ...suggestion.notVerified,
      "Codex synthesis is model judgment; deterministic safety gates remain authoritative.",
    ]),
  };
}

function buildCard(
  scan: RepoScan,
  input: {
    status: PreflightStatus;
    why: string;
    route: string;
    taskRisk: TaskRisk;
    verificationCommands: RepoCommand[];
    extraContext: string[];
    userDecision: string;
  },
): PreflightCard {
  const checks =
    input.verificationCommands.length > 0
      ? input.verificationCommands.map((command) => `${command.name}: ${command.command}`)
      : ["UNCONFIRMED: no lint, typecheck, test, or build script was detected."];

  return {
    status: input.status,
    mode: "deterministic",
    why: input.why,
    route: input.route,
    contextNeeded: dedupe([
      "Nearest repo agent rules: AGENTS.md, CLAUDE.md, or scoped rules if present.",
      "Target files and their direct callers/routes/components.",
      "Existing tests, fixtures, or examples around the touched behavior.",
      ...input.extraContext,
    ]),
    checks,
    stopIf: dedupe([
      "The implementation needs auth, billing, database, migration, provider I/O, env, deploy, or external side effects.",
      "The first slice grows beyond the user's requested outcome.",
      "The agent cannot name what changed and how it was verified.",
      ...input.taskRisk.labels.map((label) => `The task requires changing ${label} behavior without explicit approval.`),
    ]),
    userDecision: input.userDecision,
    evidence: [
      `Readiness: ${scan.readiness} (${scan.readinessReason})`,
      `Stack: ${formatStack(scan)}`,
      `Found rails: ${scan.currentRails.slice(0, 3).join(" | ")}`,
      `Task risk terms: ${input.taskRisk.matchedTerms.length > 0 ? input.taskRisk.matchedTerms.join(", ") : "none detected"}`,
    ],
    notVerified: [
      "No package scripts were executed.",
      "No runtime, browser, database, provider, Linear, PR, or session history was inspected.",
      "This preflight routes the first slice; it does not prove the final implementation.",
    ],
  };
}

function stricterStatus(left: PreflightStatus, right: PreflightStatus): PreflightStatus {
  return severity(right) > severity(left) ? right : left;
}

function severity(status: PreflightStatus): number {
  if (status === "go") return 0;
  if (status === "check_again") return 1;
  if (status === "pause") return 2;
  return 3;
}

function detectTaskRisk(task: string): TaskRisk {
  const matches = RISK_TERMS.filter((entry) => entry.pattern.test(task));
  return {
    labels: matches.map((entry) => entry.label),
    matchedTerms: matches.map((entry) => entry.label),
  };
}

function preferredVerificationCommands(commands: RepoCommand[]): RepoCommand[] {
  const priority = new Map([
    ["typecheck", 1],
    ["test", 2],
    ["lint", 3],
    ["build", 4],
  ]);

  return commands
    .filter((command) => priority.has(command.category))
    .sort((left, right) => {
      const leftPriority = priority.get(left.category) ?? 99;
      const rightPriority = priority.get(right.category) ?? 99;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return left.name.localeCompare(right.name);
    })
    .slice(0, 4);
}

function riskContext(taskRisk: TaskRisk): string[] {
  const context: string[] = [];
  if (taskRisk.labels.includes("auth/session")) context.push("Auth/session rules and existing authorization tests.");
  if (taskRisk.labels.includes("billing/payment")) context.push("Billing/payment provider boundaries and rollback expectations.");
  if (taskRisk.labels.includes("database/migration")) context.push("Schema, migration, repository, and data ownership boundaries.");
  if (taskRisk.labels.includes("provider/external I/O")) context.push("Provider adapters, webhook/email behavior, and side-effect gates.");
  if (taskRisk.labels.includes("secrets/env/deploy")) context.push("Env/secrets/deploy rules and server-only boundaries.");
  if (taskRisk.labels.includes("destructive action")) context.push("Deletion behavior, reversibility, and approval requirements.");
  return context;
}

function formatStack(scan: RepoScan): string {
  const stack = [
    scan.stack.hasTypeScript ? "TypeScript" : null,
    scan.stack.hasNext ? "Next.js" : null,
    scan.stack.hasVite ? "Vite" : null,
    scan.stack.hasReact ? "React" : null,
    scan.stack.hasOpenAI ? "OpenAI" : null,
    scan.stack.hasVercelAi ? "Vercel AI SDK" : null,
    scan.stack.hasSupabase ? "Supabase" : null,
  ].filter(Boolean);
  return stack.length > 0 ? stack.join(", ") : "UNCONFIRMED";
}

function formatList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- None."];
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}
