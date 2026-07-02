import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { PreflightStatus } from "./preflight.js";

const execFileAsync = promisify(execFile);

export type PrStatus = Exclude<PreflightStatus, "pivot">;

export type GhStatusCheck = {
  __typename?: string;
  name?: string;
  context?: string;
  status?: string | null;
  conclusion?: string | null;
  state?: string | null;
};

export type GhReviewThread = {
  id?: string;
  isResolved?: boolean;
  isOutdated?: boolean;
  comments?: {
    nodes?: Array<{
      author?: { login?: string | null } | null;
      body?: string | null;
      path?: string | null;
      line?: number | null;
      url?: string | null;
    }>;
  };
};

export type GhPrView = {
  number?: number;
  title?: string;
  url?: string;
  state?: string;
  isDraft?: boolean;
  baseRefName?: string;
  headRefName?: string;
  headRefOid?: string;
  mergeable?: string | null;
  mergeStateStatus?: string | null;
  reviewDecision?: string | null;
  statusCheckRollup?: GhStatusCheck[];
};

export type PrStatusInput = {
  repo: string;
  pr: number;
  view: GhPrView;
  reviewThreads: GhReviewThread[];
};

export type PrStatusCard = {
  status: PrStatus;
  mode: "deterministic";
  repo: string;
  pr: number;
  url: string;
  title: string;
  state: string;
  branch: string;
  mergeState: string;
  reviewDecision: string;
  checks: {
    success: number;
    failed: number;
    pending: number;
    skipped: number;
    unknown: number;
    successNames: string[];
    failedNames: string[];
    pendingNames: string[];
  };
  reviewThreads: {
    active: number;
    activeBotFindings: number;
    outdatedUnresolved: number;
    resolved: number;
  };
  why: string;
  recommendation: string;
  userDecision: string;
  evidence: string[];
  notVerified: string[];
};

export async function readPrStatusFromGh(input: {
  repo: string;
  pr: number;
  ghBin?: string;
}): Promise<PrStatusInput> {
  const repo = normalizeRepo(input.repo);
  const [owner, name] = repo.split("/");
  const ghBin = input.ghBin ?? process.env.LUMO_GH_BIN ?? "gh";
  const view = await runGhJson<GhPrView>(
    ghBin,
    [
      "pr",
      "view",
      String(input.pr),
      "-R",
      repo,
      "--json",
      [
        "number",
        "title",
        "url",
        "state",
        "isDraft",
        "baseRefName",
        "headRefName",
        "headRefOid",
        "mergeable",
        "mergeStateStatus",
        "reviewDecision",
        "statusCheckRollup",
      ].join(","),
    ],
  );
  const graph = await runGhJson<GhReviewThreadGraph>(
    ghBin,
    [
      "api",
      "graphql",
      "-F",
      `owner=${owner}`,
      "-F",
      `name=${name}`,
      "-F",
      `number=${input.pr}`,
      "-f",
      `query=${reviewThreadsQuery}`,
    ],
  );

  return {
    repo,
    pr: input.pr,
    view,
    reviewThreads: graph.data?.repository?.pullRequest?.reviewThreads?.nodes ?? [],
  };
}

export function createPrStatusCard(input: PrStatusInput): PrStatusCard {
  const checks = summarizeChecks(input.view.statusCheckRollup ?? []);
  const reviewThreads = summarizeReviewThreads(input.reviewThreads);
  const state = normalizeValue(input.view.state, "UNKNOWN");
  const mergeState = normalizeValue(input.view.mergeStateStatus, "UNKNOWN");
  const reviewDecision = normalizeValue(input.view.reviewDecision, "UNKNOWN");
  const branch = `${input.view.headRefName ?? "unknown"} -> ${input.view.baseRefName ?? "unknown"}`;
  const evidence = [
    `GitHub PR: ${input.view.url ?? `https://github.com/${input.repo}/pull/${input.pr}`}`,
    `State: ${state}${input.view.isDraft ? " draft" : ""}`,
    `Branch: ${branch}`,
    `Merge state: ${mergeState}`,
    `Review decision: ${reviewDecision}`,
    `Checks: ${checks.success} success, ${checks.failed} failed, ${checks.pending} pending, ${checks.skipped} skipped, ${checks.unknown} unknown`,
    `Review threads: ${reviewThreads.active} active, ${reviewThreads.activeBotFindings} active bot findings, ${reviewThreads.outdatedUnresolved} outdated unresolved`,
  ];
  const notVerified = [
    "Lumo used GitHub metadata only; it did not read CI logs.",
    "Lumo did not inspect the diff, local worktree, deployment, production, provider state, or runtime behavior.",
    "Lumo did not resolve review threads, rerun checks, merge, comment, push, or mutate GitHub.",
  ];

  const decision = chooseStatus({ state, isDraft: Boolean(input.view.isDraft), mergeState, checks, reviewThreads });

  return {
    status: decision.status,
    mode: "deterministic",
    repo: input.repo,
    pr: input.pr,
    url: input.view.url ?? `https://github.com/${input.repo}/pull/${input.pr}`,
    title: input.view.title ?? "Untitled PR",
    state,
    branch,
    mergeState,
    reviewDecision,
    checks,
    reviewThreads,
    why: decision.why,
    recommendation: decision.recommendation,
    userDecision: decision.userDecision,
    evidence,
    notVerified,
  };
}

export function renderPrStatusCard(card: PrStatusCard): string {
  return [
    "# Lumo PR Status",
    "",
    `Repo: ${card.repo}`,
    `PR: #${card.pr} - ${card.title}`,
    `URL: ${card.url}`,
    "",
    `## Status: ${card.status}`,
    "",
    `Mode: ${card.mode}`,
    "",
    card.why,
    "",
    "## Checks",
    "",
    `- Success: ${card.checks.success}${card.checks.successNames.length > 0 ? ` (${card.checks.successNames.join(", ")})` : ""}`,
    `- Failed: ${card.checks.failed}${card.checks.failedNames.length > 0 ? ` (${card.checks.failedNames.join(", ")})` : ""}`,
    `- Pending: ${card.checks.pending}${card.checks.pendingNames.length > 0 ? ` (${card.checks.pendingNames.join(", ")})` : ""}`,
    `- Skipped: ${card.checks.skipped}`,
    `- Unknown: ${card.checks.unknown}`,
    "",
    "## Review Threads",
    "",
    `- Active: ${card.reviewThreads.active}`,
    `- Active bot findings: ${card.reviewThreads.activeBotFindings}`,
    `- Outdated unresolved: ${card.reviewThreads.outdatedUnresolved}`,
    `- Resolved: ${card.reviewThreads.resolved}`,
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
    "Read-only: no GitHub mutation was performed.",
    "",
  ].join("\n");
}

function chooseStatus(input: {
  state: string;
  isDraft: boolean;
  mergeState: string;
  checks: PrStatusCard["checks"];
  reviewThreads: PrStatusCard["reviewThreads"];
}): Pick<PrStatusCard, "status" | "why" | "recommendation" | "userDecision"> {
  if (input.state === "MERGED") {
    return {
      status: "check_again",
      why: "The PR is already merged, so merge readiness is no longer the active question.",
      recommendation: "Move to the next proof layer: deployment status, runtime smoke check, or issue-specific production verification.",
      userDecision: "Decide whether release/runtime proof is needed before calling the work solved for users.",
    };
  }

  if (input.state !== "OPEN") {
    return {
      status: "pause",
      why: `The PR is ${input.state}, so it is not an active merge candidate.`,
      recommendation: "Do not continue a merge/release flow from this PR status.",
      userDecision: "Choose a different PR or reopen/create the correct release PR first.",
    };
  }

  if (input.isDraft) {
    return {
      status: "pause",
      why: "The PR is still a draft.",
      recommendation: "Mark the PR ready only after the review surface and proof are ready.",
      userDecision: "Decide whether the PR should become ready for review.",
    };
  }

  if (input.reviewThreads.activeBotFindings > 0) {
    return {
      status: "pause",
      why: `${input.reviewThreads.activeBotFindings} active bot finding(s) still need attention.`,
      recommendation: "Fix or explicitly resolve active bot findings before merge/release.",
      userDecision: "Do not merge yet; ask the agent to handle the active finding or explain why it is safe to resolve.",
    };
  }

  if (input.reviewThreads.active > 0) {
    return {
      status: "pause",
      why: `${input.reviewThreads.active} active unresolved review thread(s) remain.`,
      recommendation: "Resolve or answer active review threads before treating the PR as clear.",
      userDecision: "Decide whether each active thread is fixed, intentionally accepted, or still blocking.",
    };
  }

  if (input.checks.failed > 0) {
    return {
      status: "pause",
      why: `${input.checks.failed} check(s) failed.`,
      recommendation: "Inspect the failing CI logs and fix inside the PR scope before merge/release.",
      userDecision: "Do not merge yet; let the agent diagnose the failing check.",
    };
  }

  if (input.checks.pending > 0) {
    return {
      status: "check_again",
      why: `${input.checks.pending} check(s) are still pending.`,
      recommendation: "Wait for checks to settle, then rerun pr-status.",
      userDecision: "No product decision needed yet; check again when CI finishes.",
    };
  }

  if (input.mergeState === "DIRTY") {
    return {
      status: "pause",
      why: "GitHub reports merge conflicts.",
      recommendation: "Resolve conflicts while keeping the final tree aligned with the intended base/head.",
      userDecision: "Approve a conflict-resolution slice before merge/release continues.",
    };
  }

  if (["UNKNOWN", "BEHIND", "UNSTABLE"].includes(input.mergeState)) {
    return {
      status: "check_again",
      why: `GitHub merge state is ${input.mergeState}, so readiness is not proven yet.`,
      recommendation: "Refresh branch/check status or wait for GitHub to produce a clearer merge state.",
      userDecision: "No merge decision yet; check again after GitHub state updates.",
    };
  }

  if (input.mergeState === "BLOCKED") {
    return {
      status: "pause",
      why: "Checks and review threads look clear, but GitHub still reports the PR as policy-blocked.",
      recommendation: "Inspect branch protection, required reviewer, or admin-merge policy before merging.",
      userDecision: "Decide whether to wait for policy, request review, or explicitly approve a policy-safe admin route.",
    };
  }

  return {
    status: "go",
    why: "The PR metadata looks clear: open, non-draft, no active review threads, no failing/pending checks, and merge state is ready.",
    recommendation: "It is reasonable to continue the approved PR/release action, with runtime/deploy proof still separate.",
    userDecision: "No extra decision is needed unless the next step has external side effects or requires policy override.",
  };
}

function summarizeChecks(checks: GhStatusCheck[]): PrStatusCard["checks"] {
  const summary: PrStatusCard["checks"] = {
    success: 0,
    failed: 0,
    pending: 0,
    skipped: 0,
    unknown: 0,
    successNames: [],
    failedNames: [],
    pendingNames: [],
  };

  for (const check of checks) {
    const name = check.name ?? check.context ?? "unnamed check";
    const conclusion = normalizeValue(check.conclusion, "");
    const status = normalizeValue(check.status, "");
    const state = normalizeValue(check.state, "");

    if (["SUCCESS", "NEUTRAL"].includes(conclusion) || state === "SUCCESS") {
      summary.success += 1;
      summary.successNames.push(name);
      continue;
    }
    if (conclusion === "SKIPPED") {
      summary.skipped += 1;
      continue;
    }
    if (["FAILURE", "TIMED_OUT", "ACTION_REQUIRED", "CANCELLED"].includes(conclusion) || ["FAILURE", "ERROR"].includes(state)) {
      summary.failed += 1;
      summary.failedNames.push(name);
      continue;
    }
    if (
      ["QUEUED", "IN_PROGRESS", "REQUESTED", "WAITING", "PENDING"].includes(status) ||
      ["PENDING", "EXPECTED"].includes(state) ||
      (status && status !== "COMPLETED" && !conclusion)
    ) {
      summary.pending += 1;
      summary.pendingNames.push(name);
      continue;
    }

    summary.unknown += 1;
  }

  return summary;
}

function summarizeReviewThreads(threads: GhReviewThread[]): PrStatusCard["reviewThreads"] {
  const summary: PrStatusCard["reviewThreads"] = {
    active: 0,
    activeBotFindings: 0,
    outdatedUnresolved: 0,
    resolved: 0,
  };

  for (const thread of threads) {
    if (thread.isResolved) {
      summary.resolved += 1;
      continue;
    }
    if (thread.isOutdated) {
      summary.outdatedUnresolved += 1;
      continue;
    }

    summary.active += 1;
    if (isBotThread(thread)) {
      summary.activeBotFindings += 1;
    }
  }

  return summary;
}

function isBotThread(thread: GhReviewThread): boolean {
  return (thread.comments?.nodes ?? []).some((comment) => /bot|codex|copilot|codeql|dependabot/i.test(comment.author?.login ?? ""));
}

function normalizeRepo(repo: string): string {
  const trimmed = repo.trim().replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "");
  if (!/^[^/\s]+\/[^/\s]+$/.test(trimmed)) {
    throw new Error("--repo must look like owner/name.");
  }
  return trimmed;
}

function normalizeValue(value: string | null | undefined, fallback: string): string {
  return (value ?? fallback).trim().toUpperCase() || fallback;
}

async function runGhJson<T>(ghBin: string, args: string[]): Promise<T> {
  try {
    const { stdout } = await execFileAsync(ghBin, args, { maxBuffer: 20 * 1024 * 1024 });
    return JSON.parse(stdout) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`GitHub CLI read failed: ${message}`);
  }
}

function formatList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- none"];
}

type GhReviewThreadGraph = {
  data?: {
    repository?: {
      pullRequest?: {
        reviewThreads?: {
          nodes?: GhReviewThread[];
        };
      } | null;
    } | null;
  };
};

const reviewThreadsQuery = `
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          comments(first: 10) {
            nodes {
              author { login }
              body
              path
              line
              url
            }
          }
        }
      }
    }
  }
}
`;
