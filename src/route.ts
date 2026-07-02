import { readFile } from "node:fs/promises";
import type { PreflightStatus } from "./preflight.js";
import type { RepoScan } from "./schemas.js";

export type RouteMode =
  | "tiny_answer"
  | "lightweight_patch"
  | "standard_feature"
  | "bugfix_investigation"
  | "long_agent_thread"
  | "pr_release"
  | "harness_improvement";

export type RouteSurface = "silent" | "compact_card" | "decision_card";

export type RecommendedTool = {
  tool: "harness-map" | "preflight" | "checkpoint" | "review" | "thread-checkpoint" | "pr-status" | "learn";
  timing: "before_work" | "during_work" | "before_done" | "after_friction";
  required: boolean;
  commandHint: string;
};

export type MinimalHarnessMapContext = {
  status?: PreflightStatus;
  gaps?: string[];
  overlaps?: string[];
  notVerified?: string[];
};

export type RouteCard = {
  status: PreflightStatus;
  mode: RouteMode;
  surface: RouteSurface;
  why: string;
  recommendedTools: RecommendedTool[];
  firstMove: string;
  inputsNeeded: string[];
  stopIf: string[];
  userDecision: string;
  evidence: string[];
  notVerified: string[];
};

type RouteInput = {
  task: string;
  scan?: RepoScan;
  harnessMap?: MinimalHarnessMapContext;
};

const PIVOT_PATTERN = /\b(rewrite the whole app|rewrite everything|rebuild everything|make everything production-ready|make it production ready|fix everything|whole app|entire app|build mcp|mcp server|build saas|automatic global rule rewriting|auto[- ]?rewrite global rules)\b/i;
const PR_RELEASE_PATTERN = /\b(pr|pull request|merge|release|ci|status checks?|check runs?|deploy|deployment|review thread|runtime proof|mergeability)\b/i;
const LONG_THREAD_PATTERN = /\b(delegated|autonomous|heartbeat|continuation|continue thread|blocker|handoff|thread packet|long[- ]running|agent thread)\b/i;
const HARNESS_PATTERN = /\b(lumo|harness|agents\.md|agent rules?|skill|workflow|operating contract|rules?|learn packet)\b/i;
const BUGFIX_PATTERN = /\b(bug|regression|failing test|fails?|failure|root cause|debug|reproduce|incident|broken|fix failing)\b/i;
const LIGHTWEIGHT_PATTERN = /\b(small|tiny|quick|copy|docs?|rename|typo|test-only|fixture-only|readme|comment)\b/i;
const TINY_PATTERN = /\b(explain|rewrite|summari[sz]e|what is|how does|safe local fact|answer|describe)\b/i;
const CODE_CHANGE_PATTERN = /\b(add|implement|change|update|fix|refactor|delete|remove|create|build|modify|patch)\b/i;
const RISK_PATTERN = /\b(production|prod|auth|login|session|permission|role|billing|stripe|payment|database|db|migration|schema|provider|api call|webhook|email|crm|external|privacy|pii|secret|token|key|deploy|delete|remove|purge|drop|wipe|destroy|send|upload|enroll)\b/i;

export function createRouteCard(input: RouteInput): RouteCard {
  const task = input.task.trim();
  if (!task) {
    throw new Error("--task is required for route.");
  }

  const mode = chooseMode(task);
  const status = chooseStatus(task, mode, input);
  const surface = chooseSurface(mode, status);
  const recommendedTools = toolsFor(mode, task, input);

  if (mode === "tiny_answer") {
    return {
      status,
      mode,
      surface: "silent",
      why: "The request looks like an answer-only task without code-change, PR, production, or risk terms.",
      recommendedTools: [],
      firstMove: "Answer directly; do not show a Lumo card unless the user asks.",
      inputsNeeded: [],
      stopIf: defaultStopIf(task),
      userDecision: "No user decision is needed; answer directly.",
      evidence: evidenceFor(task, input),
      notVerified: notVerifiedFor(input),
    };
  }

  return {
    status,
    mode,
    surface,
    why: whyFor(mode, status, input),
    recommendedTools,
    firstMove: firstMoveFor(mode, status, recommendedTools),
    inputsNeeded: inputsFor(mode, input),
    stopIf: defaultStopIf(task),
    userDecision: userDecisionFor(status),
    evidence: evidenceFor(task, input),
    notVerified: notVerifiedFor(input),
  };
}

export async function readHarnessMapContext(filePath: string): Promise<MinimalHarnessMapContext> {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as {
    harnessMap?: {
      status?: unknown;
      gaps?: unknown;
      overlaps?: unknown;
      notVerified?: unknown;
    };
  };
  const harnessMap = parsed.harnessMap ?? {};
  return {
    status: isStatus(harnessMap.status) ? harnessMap.status : undefined,
    gaps: stringArray(harnessMap.gaps),
    overlaps: stringArray(harnessMap.overlaps),
    notVerified: stringArray(harnessMap.notVerified),
  };
}

export function renderRouteCard(card: RouteCard, input: { repoPath?: string; task: string }): string {
  return [
    "# Lumo Route",
    "",
    input.repoPath ? `Repo: ${input.repoPath}` : "Repo: not scanned",
    `Task: ${input.task}`,
    "",
    `## Status: ${card.status}`,
    "",
    `## Mode: ${card.mode}`,
    "",
    card.why,
    "",
    "## Surface",
    "",
    card.surface,
    "",
    "## First Move",
    "",
    card.firstMove,
    "",
    "## Recommended Tools",
    "",
    ...formatTools(card.recommendedTools),
    "",
    "## Inputs Needed",
    "",
    ...formatList(card.inputsNeeded),
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
    "Read-only: no files were written and no external systems were queried.",
    "",
  ].join("\n");
}

function chooseMode(task: string): RouteMode {
  if (PR_RELEASE_PATTERN.test(task)) return "pr_release";
  if (LONG_THREAD_PATTERN.test(task)) return "long_agent_thread";
  if (HARNESS_PATTERN.test(task)) return "harness_improvement";
  if (BUGFIX_PATTERN.test(task)) return "bugfix_investigation";
  if (LIGHTWEIGHT_PATTERN.test(task) && CODE_CHANGE_PATTERN.test(task) && !RISK_PATTERN.test(task)) return "lightweight_patch";
  if (TINY_PATTERN.test(task) && !CODE_CHANGE_PATTERN.test(task) && !RISK_PATTERN.test(task)) return "tiny_answer";
  return "standard_feature";
}

function chooseStatus(task: string, mode: RouteMode, input: RouteInput): PreflightStatus {
  if (PIVOT_PATTERN.test(task)) return "pivot";
  if (RISK_PATTERN.test(task)) return "pause";
  if (mode === "tiny_answer") return "go";
  if (mode === "standard_feature" && needsHarnessMapFirst(input)) return "check_again";
  if (["bugfix_investigation", "long_agent_thread", "pr_release", "harness_improvement"].includes(mode)) return "check_again";
  return "go";
}

function chooseSurface(mode: RouteMode, status: PreflightStatus): RouteSurface {
  if (mode === "tiny_answer") return "silent";
  if (status === "pause" || status === "pivot") return "decision_card";
  return "compact_card";
}

function toolsFor(mode: RouteMode, task: string, input: RouteInput): RecommendedTool[] {
  const taskHint = quote(task);
  if (mode === "pr_release") {
    return [{ tool: "pr-status", timing: "before_done", required: true, commandHint: "npm run lumo -- pr-status --repo <owner/name> --pr <number>" }];
  }
  if (mode === "long_agent_thread") {
    return [{ tool: "thread-checkpoint", timing: "during_work", required: true, commandHint: "npm run lumo -- thread-checkpoint --input <packet.md>" }];
  }
  if (mode === "harness_improvement") {
    const tools: RecommendedTool[] = [
      { tool: "harness-map", timing: "before_work", required: true, commandHint: "npm run lumo -- harness-map --path <repo>" },
    ];
    if (/\b(friction|learn packet|repeated|next time)\b/i.test(task)) {
      tools.push({ tool: "learn", timing: "after_friction", required: false, commandHint: "npm run lumo -- learn --input <packet.md>" });
    }
    return tools;
  }
  if (mode === "bugfix_investigation") {
    return [
      { tool: "preflight", timing: "before_work", required: true, commandHint: `npm run lumo -- preflight --path <repo> --task ${taskHint}` },
      { tool: "checkpoint", timing: "during_work", required: true, commandHint: `npm run lumo -- checkpoint --path <repo> --task ${taskHint}` },
      { tool: "review", timing: "before_done", required: true, commandHint: `npm run lumo -- review --path <repo> --task ${taskHint}` },
    ];
  }
  if (mode === "lightweight_patch") {
    return [
      { tool: "preflight", timing: "before_work", required: false, commandHint: `npm run lumo -- preflight --path <repo> --task ${taskHint}` },
      { tool: "review", timing: "before_done", required: true, commandHint: `npm run lumo -- review --path <repo> --task ${taskHint}` },
    ];
  }
  const tools: RecommendedTool[] = [];
  if (needsHarnessMapFirst(input)) {
    tools.push({ tool: "harness-map", timing: "before_work", required: true, commandHint: "npm run lumo -- harness-map --path <repo>" });
  }
  tools.push({ tool: "preflight", timing: "before_work", required: true, commandHint: `npm run lumo -- preflight --path <repo> --task ${taskHint}` });
  return tools;
}

function needsHarnessMapFirst(input: RouteInput): boolean {
  if (input.harnessMap?.status && input.harnessMap.status !== "go") return true;
  if ((input.harnessMap?.gaps?.length ?? 0) > 0 || (input.harnessMap?.overlaps?.length ?? 0) > 0) return true;
  if (!input.scan) return false;
  return input.scan.harness.agentRuleFiles.length === 0 || input.scan.commands.length === 0;
}

function whyFor(mode: RouteMode, status: PreflightStatus, input: RouteInput): string {
  if (status === "pivot") return "The request is too broad or outside the local v0.2 control-layer scope.";
  if (status === "pause") return "The request crosses a production, privacy, provider, data, deploy, destructive, or external-side-effect boundary.";
  if (mode === "standard_feature" && needsHarnessMapFirst(input)) return "This looks like normal feature work, but the harness/map context suggests missing or unclear rails.";
  return `The request matched the ${mode} route taxonomy and has a clear next Lumo move.`;
}

function firstMoveFor(mode: RouteMode, status: PreflightStatus, tools: RecommendedTool[]): string {
  if (status === "pivot") return "Narrow the request to one local, reviewable slice before implementation.";
  if (status === "pause") return "Pause for explicit approval or narrow to read-only discovery before implementation.";
  const required = tools.find((tool) => tool.required) ?? tools[0];
  if (required) return `Run ${required.tool} first: ${required.commandHint}`;
  if (mode === "lightweight_patch") return "Proceed with the small local patch, then run review before claiming done.";
  return "Start with read-only context, then make the smallest useful slice.";
}

function inputsFor(mode: RouteMode, input: RouteInput): string[] {
  const common = input.scan ? [] : ["Repo scan was skipped or unavailable; inspect target files before implementation."];
  if (mode === "pr_release") return ["GitHub repo owner/name and PR number.", ...common];
  if (mode === "long_agent_thread") return ["Redacted thread checkpoint packet.", ...common];
  if (mode === "harness_improvement") return ["Repo path and current harness/rule sources.", ...common];
  if (mode === "bugfix_investigation") return ["Reproduction steps, failing test/log, and target area.", ...common];
  if (mode === "lightweight_patch") return ["Target file or docs area.", ...common];
  if (mode === "standard_feature") return ["User-visible outcome, target area, and nearest verification command.", ...common];
  return common;
}

function userDecisionFor(status: PreflightStatus): string {
  if (status === "go") return "No user decision is needed before the next local/read-only or small implementation step.";
  if (status === "check_again") return "Let Lumo/Codex run the recommended context tool before implementation.";
  if (status === "pause") return "Approve the risky boundary explicitly, or narrow the task to safe read-only discovery.";
  return "Choose a smaller v0.2-compatible slice before any implementation.";
}

function defaultStopIf(task: string): string[] {
  return [
    "The next step would write to production, external systems, CRM/email, GitHub, Linear, billing, or provider APIs.",
    "The task expands beyond one reviewable slice.",
    "Auth, privacy/PII, billing, database/migration, deploy, or destructive behavior appears without explicit approval.",
    PIVOT_PATTERN.test(task) ? "The request remains broad after one narrowing attempt." : "The route no longer matches the user's requested outcome.",
  ];
}

function evidenceFor(task: string, input: RouteInput): string[] {
  return [
    `Task chars: ${task.trim().length}`,
    `Route taxonomy: deterministic v1 ordered matcher`,
    input.scan ? `Repo scanned: ${input.scan.repoPath}` : "Repo scan: skipped/not provided",
    input.harnessMap ? `Harness map context: ${input.harnessMap.status ?? "status not provided"}` : "Harness map context: not provided",
  ];
}

function notVerifiedFor(input: RouteInput): string[] {
  return [
    input.scan ? "Repo scan used static metadata only; no package scripts were executed." : "No repo scan was used for this route.",
    "No LLM synthesis, runtime, browser, database, provider, PR, production, or external system state was inspected.",
    ...(input.harnessMap?.notVerified ?? []),
  ];
}

function isStatus(value: unknown): value is PreflightStatus {
  return value === "go" || value === "check_again" || value === "pause" || value === "pivot";
}

function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
}

function formatTools(tools: RecommendedTool[]): string[] {
  return tools.length > 0
    ? tools.map((tool) => `- ${tool.required ? "Required" : "Optional"} ${tool.tool} (${tool.timing}): ${tool.commandHint}`)
    : ["- None."];
}

function formatList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- None."];
}

function quote(value: string): string {
  return JSON.stringify(value);
}
