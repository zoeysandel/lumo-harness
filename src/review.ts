import { spawn } from "node:child_process";
import type { PreflightStatus } from "./preflight.js";
import type { RepoCommand, RepoScan } from "./schemas.js";

export type ReviewStatus = PreflightStatus;

export type GitReviewState = {
  isGitRepo: boolean;
  statusLines: string[];
  changedFiles: string[];
  diffStat: string[];
  diffTextSample: string;
  notVerified: string[];
};

export type ReviewCard = {
  status: ReviewStatus;
  mode: "deterministic" | "deterministic_plus_codex";
  why: string;
  completionSignal: string;
  proofSignal: string;
  riskSignal: string;
  changedFiles: string[];
  checks: string[];
  recommendation: string;
  userDecision: string;
  evidence: string[];
  notVerified: string[];
};

export type CodexReviewSuggestion = {
  status: ReviewStatus;
  why: string;
  completionSignal: string;
  proofSignal: string;
  riskSignal: string;
  recommendation: string;
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

const TEST_FILE_PATTERN = /(^|\/)(__tests__|tests?|specs?|fixtures?)\/|(\.|-)(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/i;
const GENERATED_OUTPUT_PATTERN = /(^|\/)(dist|build|coverage|\.next|out)\//i;

export async function readGitReviewState(repoPath: string): Promise<GitReviewState> {
  const isGitRepo = await isInsideGitRepo(repoPath);
  if (!isGitRepo) {
    return {
      isGitRepo: false,
      statusLines: [],
      changedFiles: [],
      diffStat: [],
      diffTextSample: "",
      notVerified: ["Git state was not available; review could not inspect current changes."],
    };
  }

  const [status, unstagedNames, stagedNames, unstagedStat, stagedStat, unstagedDiff, stagedDiff] = await Promise.all([
    runGit(repoPath, ["status", "--short"]),
    runGit(repoPath, ["diff", "--name-only"]),
    runGit(repoPath, ["diff", "--cached", "--name-only"]),
    runGit(repoPath, ["diff", "--stat"]),
    runGit(repoPath, ["diff", "--cached", "--stat"]),
    runGit(repoPath, ["diff", "--unified=0"]),
    runGit(repoPath, ["diff", "--cached", "--unified=0"]),
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
    diffTextSample: `${unstagedDiff.stdout}\n${stagedDiff.stdout}`.slice(0, 20_000),
    notVerified: [
      "Git review inspected file names, diff stat, and a limited diff sample only.",
      "No tests, builds, browser checks, provider calls, database calls, or runtime flows were executed.",
    ],
  };
}

export function createReviewCard(scan: RepoScan, task: string, gitState: GitReviewState): ReviewCard {
  const trimmedTask = task.trim();
  if (!trimmedTask) {
    throw new Error("--task is required for review.");
  }

  const verificationCommands = preferredVerificationCommands(scan.commands);
  const changedCount = gitState.changedFiles.length;
  const riskyLabels = detectRiskyFileLabels(gitState.changedFiles);
  const areaCount = countChangedAreas(gitState.changedFiles);
  const hasTests = gitState.changedFiles.some((file) => TEST_FILE_PATTERN.test(file));
  const hasGeneratedOutput = gitState.changedFiles.some((file) => GENERATED_OUTPUT_PATTERN.test(file));
  const hasAny = /^\+.*\bany\b/m.test(gitState.diffTextSample);
  const hasTodo = /^\+.*\b(TODO|FIXME|HACK)\b/i.test(gitState.diffTextSample);
  const hasBroadDiff = changedCount > 10 || areaCount > 4;
  const hasGrowingDiff = changedCount > 5 || areaCount > 3;

  if (!gitState.isGitRepo) {
    return buildCard(scan, gitState, {
      status: "check_again",
      why: "Review cannot inspect current work because this path is not inside a git repo.",
      completionSignal: "UNCONFIRMED: no git-backed diff was available.",
      proofSignal: "No verification evidence was inspected.",
      riskSignal: "UNCONFIRMED: risk cannot be evaluated without changed files.",
      verificationCommands,
      recommendation: "Run review from a git-backed repo or provide a review artifact in a later Lumo version.",
      userDecision: "Decide whether to continue without review evidence or rerun inside the repo.",
    });
  }

  if (changedCount === 0) {
    return buildCard(scan, gitState, {
      status: "check_again",
      why: "There are no current git changes to review.",
      completionSignal: "Nothing in the worktree proves the task was implemented.",
      proofSignal: "No verification evidence was inspected.",
      riskSignal: "No risky changed files detected.",
      verificationCommands,
      recommendation: "Do not claim done from Lumo review yet; rerun after there is a diff or final artifact.",
      userDecision: "No completion decision is available yet.",
    });
  }

  if (hasGeneratedOutput) {
    return buildCard(scan, gitState, {
      status: "check_again",
      why: "Generated or build output appears in the diff.",
      completionSignal: `${changedCount} files changed across ${areaCount} areas.`,
      proofSignal: formatProofSignal(hasTests, hasAny, hasTodo),
      riskSignal: formatRiskSignal(riskyLabels),
      verificationCommands,
      recommendation: "Remove generated output from the review surface unless it is explicitly intended.",
      userDecision: "Decide whether generated output belongs in this change.",
    });
  }

  if (hasBroadDiff) {
    return buildCard(scan, gitState, {
      status: "pivot",
      why: "The review surface is too broad for a simple done claim.",
      completionSignal: `${changedCount} files changed across ${areaCount} areas.`,
      proofSignal: formatProofSignal(hasTests, hasAny, hasTodo),
      riskSignal: formatRiskSignal(riskyLabels),
      verificationCommands,
      recommendation: "Split the change or explicitly accept a larger review surface before claiming done.",
      userDecision: "Choose whether to split the diff or accept this as a larger review packet.",
    });
  }

  if (riskyLabels.length > 0) {
    return buildCard(scan, gitState, {
      status: "pause",
      why: `The diff touches risky files: ${riskyLabels.join(", ")}.`,
      completionSignal: `${changedCount} files changed across ${areaCount} areas.`,
      proofSignal: formatProofSignal(hasTests, hasAny, hasTodo),
      riskSignal: formatRiskSignal(riskyLabels),
      verificationCommands,
      recommendation: "Do not claim done until the user accepts the risky seam and verification is clear.",
      userDecision: "Approve the risky seam or ask the agent to narrow the change.",
    });
  }

  if (!hasTests || hasAny || hasTodo || hasGrowingDiff) {
    return buildCard(scan, gitState, {
      status: "check_again",
      why: "The diff may be on track, but one proof or quality signal needs attention before claiming done.",
      completionSignal: `${changedCount} files changed across ${areaCount} areas.`,
      proofSignal: formatProofSignal(hasTests, hasAny, hasTodo),
      riskSignal: "No risky changed files detected.",
      verificationCommands,
      recommendation: "Run or document the narrowest verification command, and address any TODO/any signal if relevant.",
      userDecision: "Let the agent provide verification evidence before claiming done.",
    });
  }

  return buildCard(scan, gitState, {
    status: "go",
    why: "The diff looks small, local, and includes a test-like change.",
    completionSignal: `${changedCount} files changed across ${areaCount} area${areaCount === 1 ? "" : "s"}.`,
    proofSignal: formatProofSignal(hasTests, hasAny, hasTodo),
    riskSignal: "No risky changed files detected.",
    verificationCommands,
    recommendation: "It is reasonable to present this as done with the stated verification caveat.",
    userDecision: "No user decision is needed before a concise completion summary.",
  });
}

export function renderReviewCard(card: ReviewCard, input: { repoPath: string; task: string }): string {
  return [
    "# Lumo Review",
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
    "## Completion Signal",
    "",
    card.completionSignal,
    "",
    "## Proof Signal",
    "",
    card.proofSignal,
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
    "## Recommendation",
    "",
    card.recommendation,
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

export function mergeCodexReviewSuggestion(deterministicCard: ReviewCard, suggestion: CodexReviewSuggestion): ReviewCard {
  const status = stricterStatus(deterministicCard.status, suggestion.status);
  const codexStatusLowered = status !== suggestion.status;

  return {
    ...deterministicCard,
    status,
    mode: "deterministic_plus_codex",
    why: codexStatusLowered
      ? `${deterministicCard.why} Codex suggested a less cautious status, so Lumo kept the deterministic safety floor.`
      : suggestion.why.trim() || deterministicCard.why,
    completionSignal: suggestion.completionSignal.trim() || deterministicCard.completionSignal,
    proofSignal: suggestion.proofSignal.trim() || deterministicCard.proofSignal,
    riskSignal: suggestion.riskSignal.trim() || deterministicCard.riskSignal,
    recommendation: suggestion.recommendation.trim() || deterministicCard.recommendation,
    userDecision: suggestion.userDecision.trim() || deterministicCard.userDecision,
    evidence: dedupe([...deterministicCard.evidence, "Codex review synthesis completed in read-only mode."]),
    notVerified: dedupe([
      ...deterministicCard.notVerified,
      ...suggestion.notVerified,
      "Codex synthesis is model judgment; deterministic safety gates remain authoritative.",
    ]),
  };
}

function buildCard(
  scan: RepoScan,
  gitState: GitReviewState,
  input: {
    status: ReviewStatus;
    why: string;
    completionSignal: string;
    proofSignal: string;
    riskSignal: string;
    verificationCommands: RepoCommand[];
    recommendation: string;
    userDecision: string;
  },
): ReviewCard {
  const checks =
    input.verificationCommands.length > 0
      ? input.verificationCommands.map((command) => `${command.name}: ${command.command}`)
      : ["UNCONFIRMED: no lint, typecheck, test, or build script was detected."];

  return {
    status: input.status,
    mode: "deterministic",
    why: input.why,
    completionSignal: input.completionSignal,
    proofSignal: input.proofSignal,
    riskSignal: input.riskSignal,
    changedFiles: gitState.changedFiles,
    checks,
    recommendation: input.recommendation,
    userDecision: input.userDecision,
    evidence: [
      `Git repo: ${gitState.isGitRepo ? "yes" : "no"}`,
      `Changed files: ${gitState.changedFiles.length}`,
      `Git status lines: ${gitState.statusLines.length}`,
      `Diff stat lines: ${gitState.diffStat.length}`,
      `Diff sample chars: ${gitState.diffTextSample.length}`,
      `Readiness: ${scan.readiness}`,
    ],
    notVerified: [
      ...gitState.notVerified,
      "Review checks acceptability signals; it is not a full code review or approval stamp.",
    ],
  };
}

function formatProofSignal(hasTests: boolean, hasAny: boolean, hasTodo: boolean): string {
  const signals = [
    hasTests ? "test-like file changed" : "no test-like file detected",
    hasAny ? "new `any` signal detected" : "no new `any` signal detected in diff sample",
    hasTodo ? "new TODO/FIXME/HACK signal detected" : "no new TODO/FIXME/HACK signal detected in diff sample",
  ];
  return signals.join("; ");
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

function stricterStatus(left: ReviewStatus, right: ReviewStatus): ReviewStatus {
  return severity(right) > severity(left) ? right : left;
}

function severity(status: ReviewStatus): number {
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
