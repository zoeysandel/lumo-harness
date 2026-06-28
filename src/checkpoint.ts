import { spawn } from "node:child_process";
import type { PreflightStatus } from "./preflight.js";
import type { RepoCommand, RepoScan } from "./schemas.js";

export type CheckpointStatus = PreflightStatus;

export type GitCheckpointState = {
  isGitRepo: boolean;
  statusLines: string[];
  changedFiles: string[];
  diffStat: string[];
  notVerified: string[];
};

export type CheckpointCard = {
  status: CheckpointStatus;
  mode: "deterministic" | "deterministic_plus_codex";
  why: string;
  route: string;
  scopeSignal: string;
  riskSignal: string;
  changedFiles: string[];
  checks: string[];
  stopIf: string[];
  userDecision: string;
  evidence: string[];
  notVerified: string[];
};

export type CodexCheckpointSuggestion = {
  status: CheckpointStatus;
  why: string;
  route: string;
  scopeSignal: string;
  riskSignal: string;
  stopIf: string[];
  userDecision: string;
  notVerified: string[];
};

const RISKY_FILE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "auth/session/security", pattern: /(^|\/)(auth|session|security|middleware)\b|auth|permission|role|tenant/i },
  { label: "billing/payment", pattern: /billing|stripe|payment|invoice|subscription|checkout/i },
  { label: "database/migration/schema", pattern: /(^|\/)(db|database|migrations?|schema|prisma|drizzle|supabase)(\/|\.|$)/i },
  { label: "provider/API/external I/O", pattern: /provider|openai|anthropic|webhook|email|notification|crm|api/i },
  { label: "env/secrets/deploy/config", pattern: /(^|\/)(\.env|env|config|deploy|vercel)|secret|token|key/i },
  { label: "destructive/delete behavior", pattern: /delete|remove|purge|drop|destroy|wipe/i },
];

export async function readGitCheckpointState(repoPath: string): Promise<GitCheckpointState> {
  const isGitRepo = await isInsideGitRepo(repoPath);
  if (!isGitRepo) {
    return {
      isGitRepo: false,
      statusLines: [],
      changedFiles: [],
      diffStat: [],
      notVerified: ["Git state was not available; checkpoint could not inspect in-progress changes."],
    };
  }

  const [status, unstagedNames, stagedNames, unstagedStat, stagedStat] = await Promise.all([
    runGit(repoPath, ["status", "--short"]),
    runGit(repoPath, ["diff", "--name-only"]),
    runGit(repoPath, ["diff", "--cached", "--name-only"]),
    runGit(repoPath, ["diff", "--stat"]),
    runGit(repoPath, ["diff", "--cached", "--stat"]),
  ]);

  const statusLines = lines(status.stdout);
  const changedFiles = dedupe([
    ...lines(unstagedNames.stdout),
    ...lines(stagedNames.stdout),
    ...statusLines.map(parseStatusFile).filter(Boolean),
  ]).sort();

  return {
    isGitRepo: true,
    statusLines,
    changedFiles,
    diffStat: [...lines(unstagedStat.stdout), ...lines(stagedStat.stdout)],
    notVerified: [
      "Git checkpoint inspected file names and diff stat only; it did not inspect full diff hunks.",
      "No tests, builds, browser checks, provider calls, database calls, or runtime flows were executed.",
    ],
  };
}

export function createCheckpointCard(scan: RepoScan, task: string, gitState: GitCheckpointState): CheckpointCard {
  const trimmedTask = task.trim();
  if (!trimmedTask) {
    throw new Error("--task is required for checkpoint.");
  }

  const verificationCommands = preferredVerificationCommands(scan.commands);
  const changedCount = gitState.changedFiles.length;
  const riskyLabels = detectRiskyFileLabels(gitState.changedFiles);
  const areaCount = countChangedAreas(gitState.changedFiles);
  const hasBroadDiff = changedCount > 10 || areaCount > 4;
  const hasGrowingDiff = changedCount > 5 || areaCount > 3;

  if (!gitState.isGitRepo) {
    return buildCard(scan, gitState, {
      status: "check_again",
      why: "Checkpoint cannot inspect in-progress work because this path is not inside a git repo.",
      route: "Run checkpoint from a git-backed repo, or provide a run artifact in a later Lumo version.",
      scopeSignal: "No git state available.",
      riskSignal: "UNCONFIRMED: risk cannot be evaluated without changed files.",
      verificationCommands,
      userDecision: "Decide whether to continue without checkpoint evidence or rerun inside the repo.",
    });
  }

  if (changedCount === 0) {
    return buildCard(scan, gitState, {
      status: "check_again",
      why: "There are no current git changes to inspect yet.",
      route: "Continue only after the agent has produced a small first diff, or use preflight before implementation.",
      scopeSignal: "No changed files detected.",
      riskSignal: "No risky changed files detected.",
      verificationCommands,
      userDecision: "No steering decision is needed yet; rerun checkpoint after the first diff.",
    });
  }

  if (hasBroadDiff) {
    return buildCard(scan, gitState, {
      status: "pivot",
      why: "The current diff is broad enough that the route may no longer be a small reviewable slice.",
      route: "Stop broad implementation and split the work back into one smaller outcome before continuing.",
      scopeSignal: `${changedCount} files changed across ${areaCount} areas.`,
      riskSignal: formatRiskSignal(riskyLabels),
      verificationCommands,
      userDecision: "Choose whether to split the diff, narrow the task, or explicitly continue with a larger review surface.",
    });
  }

  if (riskyLabels.length > 0) {
    return buildCard(scan, gitState, {
      status: "pause",
      why: `The current diff touches risky files: ${riskyLabels.join(", ")}.`,
      route: "Pause implementation and confirm whether the risky seam is required for the original task.",
      scopeSignal: `${changedCount} files changed across ${areaCount} areas.`,
      riskSignal: formatRiskSignal(riskyLabels),
      verificationCommands,
      userDecision: "Approve the risky seam explicitly, or ask the agent to narrow the diff before continuing.",
    });
  }

  if (hasGrowingDiff) {
    return buildCard(scan, gitState, {
      status: "check_again",
      why: "The diff is growing beyond a tiny first slice.",
      route: "Inspect whether every changed file is required for the original task before continuing.",
      scopeSignal: `${changedCount} files changed across ${areaCount} areas.`,
      riskSignal: "No risky changed files detected.",
      verificationCommands,
      userDecision: "Let the agent justify the changed files or narrow the diff.",
    });
  }

  return buildCard(scan, gitState, {
    status: "go",
    why: "The current diff still looks small, local, and reviewable.",
    route: "Continue the slice, then run the narrowest useful verification command before claiming done.",
    scopeSignal: `${changedCount} files changed across ${areaCount} area${areaCount === 1 ? "" : "s"}.`,
    riskSignal: "No risky changed files detected.",
    verificationCommands,
    userDecision: "No user decision is needed right now.",
  });
}

export function renderCheckpointCard(card: CheckpointCard, input: { repoPath: string; task: string }): string {
  return [
    "# Lumo Checkpoint",
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
    "## Scope Signal",
    "",
    card.scopeSignal,
    "",
    "## Risk Signal",
    "",
    card.riskSignal,
    "",
    "## Changed Files",
    "",
    ...formatList(card.changedFiles),
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

export function mergeCodexCheckpointSuggestion(
  deterministicCard: CheckpointCard,
  suggestion: CodexCheckpointSuggestion,
): CheckpointCard {
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
    scopeSignal: suggestion.scopeSignal.trim() || deterministicCard.scopeSignal,
    riskSignal: suggestion.riskSignal.trim() || deterministicCard.riskSignal,
    stopIf: dedupe([...deterministicCard.stopIf, ...suggestion.stopIf]),
    userDecision: suggestion.userDecision.trim() || deterministicCard.userDecision,
    evidence: dedupe([...deterministicCard.evidence, "Codex checkpoint synthesis completed in read-only mode."]),
    notVerified: dedupe([
      ...deterministicCard.notVerified,
      ...suggestion.notVerified,
      "Codex synthesis is model judgment; deterministic safety gates remain authoritative.",
    ]),
  };
}

function buildCard(
  scan: RepoScan,
  gitState: GitCheckpointState,
  input: {
    status: CheckpointStatus;
    why: string;
    route: string;
    scopeSignal: string;
    riskSignal: string;
    verificationCommands: RepoCommand[];
    userDecision: string;
  },
): CheckpointCard {
  const checks =
    input.verificationCommands.length > 0
      ? input.verificationCommands.map((command) => `${command.name}: ${command.command}`)
      : ["UNCONFIRMED: no lint, typecheck, test, or build script was detected."];

  return {
    status: input.status,
    mode: "deterministic",
    why: input.why,
    route: input.route,
    scopeSignal: input.scopeSignal,
    riskSignal: input.riskSignal,
    changedFiles: gitState.changedFiles,
    checks,
    stopIf: [
      "The diff touches auth, billing, database, migration, provider I/O, env, deploy, or external side effects without explicit approval.",
      "The changed files no longer map to the original task.",
      "The review surface grows before the first slice is proven.",
      "The agent cannot explain what changed and what remains unverified.",
    ],
    userDecision: input.userDecision,
    evidence: [
      `Git repo: ${gitState.isGitRepo ? "yes" : "no"}`,
      `Changed files: ${gitState.changedFiles.length}`,
      `Git status lines: ${gitState.statusLines.length}`,
      `Diff stat lines: ${gitState.diffStat.length}`,
      `Readiness: ${scan.readiness}`,
    ],
    notVerified: [
      ...gitState.notVerified,
      "Checkpoint compares current changes to steering heuristics; it is not a final code review.",
    ],
  };
}

function detectRiskyFileLabels(files: string[]): string[] {
  return dedupe(
    RISKY_FILE_PATTERNS.filter((entry) => files.some((file) => entry.pattern.test(file))).map((entry) => entry.label),
  );
}

function formatRiskSignal(labels: string[]): string {
  return labels.length > 0 ? `Risky changed files detected: ${labels.join(", ")}.` : "No risky changed files detected.";
}

function countChangedAreas(files: string[]): number {
  return new Set(files.map(fileArea)).size;
}

function fileArea(file: string): string {
  const parts = file.split("/");
  if (parts[0] === "src" && parts[1]) return `src/${parts[1]}`;
  if (parts[0] === "app" && parts[1]) return `app/${parts[1]}`;
  if (parts[0] === "pages" && parts[1]) return `pages/${parts[1]}`;
  return parts[0] ?? file;
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

function stricterStatus(left: CheckpointStatus, right: CheckpointStatus): CheckpointStatus {
  return severity(right) > severity(left) ? right : left;
}

function severity(status: CheckpointStatus): number {
  if (status === "go") return 0;
  if (status === "check_again") return 1;
  if (status === "pause") return 2;
  return 3;
}

async function isInsideGitRepo(repoPath: string): Promise<boolean> {
  const result = await runGit(repoPath, ["rev-parse", "--is-inside-work-tree"]);
  return result.code === 0 && result.stdout.trim() === "true";
}

function runGit(repoPath: string, args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn("git", ["-C", repoPath, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      resolve({ code: 1, stdout: "", stderr: error.message });
    });
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

function parseStatusFile(line: string): string {
  const value = line.slice(3).trim();
  if (value.includes(" -> ")) return value.split(" -> ").at(-1)?.trim() ?? value;
  return value;
}

function lines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
}

function formatList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- None."];
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}
