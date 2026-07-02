import path from "node:path";
import type { PreflightStatus } from "./preflight.js";
import type { RepoScan } from "./schemas.js";

export type LearnProposalType =
  | "repo_rule"
  | "workflow_note"
  | "deterministic_check"
  | "skill_prompt_update"
  | "do_nothing";

export type LearnProposal = {
  type: LearnProposalType;
  title: string;
  target: string;
  changeSummary: string;
};

export type LearnCard = {
  status: PreflightStatus;
  mode: "deterministic";
  proposal: LearnProposal;
  why: string;
  allowedActions: string[];
  blockedActions: string[];
  evidence: string[];
  notVerified: string[];
  userDecision: string;
};

type LearnInput = {
  content: string;
  task?: string;
  scan?: RepoScan;
  inputPath?: string;
};

type SignalFlags = {
  repeated: boolean;
  oneOff: boolean;
  hasEvidenceSection: boolean;
  hasTargetSignal: boolean;
  sensitive: boolean;
  pivot: boolean;
  deterministicCheck: boolean;
  repoRule: boolean;
  workflowNote: boolean;
  skillPrompt: boolean;
};

const SENSITIVE_PATTERN = /\b(pii|privacy|private data|personal data|secret|token|api[_ -]?key|password|credential|email address|phone number|profile url|linkedin url|crm|production|prod|deploy|database|migration|billing|stripe|external system|github mutation|linear update|send email|upload|enroll)\b/i;
const PIVOT_PATTERN = /\b(build mcp|mcp server|build saas|automatic memory|auto[- ]?write|automatic rule rewrite|auto[- ]?rewrite|rewrite global rules|write to memory|update global rules|platform automation)\b/i;
const REPEATED_PATTERN = /\b(repeated|keeps happening|again|recurring|next time|prevent it next time|repeat)\b/i;
const ONE_OFF_PATTERN = /\b(one[-_ ]off|once|single occurrence|not repeated|unclear|unknown)\b/i;
const CHECK_PATTERN = /\b(ci|check|test|typecheck|lint|build|setup|preflight|verify|verification|playwright|url|env|secret|command)\b/i;
const REPO_RULE_PATTERN = /\b(approval|safety|scope|summary|final response|gate|pause|review surface|production gate|privacy gate)\b/i;
const WORKFLOW_PATTERN = /\b(runbook|workflow|process|handoff|release|pr status|deploy proof|runtime proof|sync develop|sync main|checkpoint)\b/i;
const SKILL_PATTERN = /\b(skill|prompt|instruction|tool use|agent instruction|operating contract|agents\.md|agent rule)\b/i;

export function createLearnCard(input: LearnInput): LearnCard {
  const content = input.content.trim();
  if (!content) {
    throw new Error("Learn input must be a non-empty packet.");
  }

  const flags = readSignals(content, input.task);
  const status = chooseStatus(flags);
  const proposalType = status === "pause" || status === "pivot" ? "do_nothing" : chooseProposalType(flags);
  const proposal = proposalFor(proposalType, flags, input.scan);
  const headings = extractHeadings(content);

  return {
    status,
    mode: "deterministic",
    proposal,
    why: whyFor(status, proposalType, flags),
    allowedActions: [
      "Use this card as a proposal for human review.",
      "Copy the idea into a normal code/docs task only after explicit approval.",
      "Run static repo scan context only when --path is provided.",
    ],
    blockedActions: [
      "Do not write repo docs, AGENTS.md, global rules, memories, or skills.",
      "Do not create GitHub, Linear, CRM, production, provider, email, or external-system changes.",
      "Do not echo raw sensitive packet content.",
    ],
    evidence: evidenceFor({ content, headings, flags, input }),
    notVerified: notVerifiedFor(input, flags),
    userDecision: userDecisionFor(status),
  };
}

export function renderLearnCard(
  card: LearnCard,
  input: { inputPath?: string; inputSource: "file" | "stdin"; task?: string },
): string {
  return [
    "# Lumo Learn",
    "",
    input.inputPath ? `Input: ${input.inputPath}` : `Input: ${input.inputSource}`,
    input.task ? `Task: ${input.task}` : "Task: not provided",
    "",
    `## Status: ${card.status}`,
    "",
    `Mode: ${card.mode}`,
    "",
    "## Proposal",
    "",
    `- Type: ${card.proposal.type}`,
    `- Title: ${card.proposal.title}`,
    `- Target: ${card.proposal.target}`,
    `- Change: ${card.proposal.changeSummary}`,
    "",
    "## Why",
    "",
    card.why,
    "",
    "## Allowed Actions",
    "",
    ...formatList(card.allowedActions),
    "",
    "## Blocked Actions",
    "",
    ...formatList(card.blockedActions),
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

function readSignals(content: string, task?: string): SignalFlags {
  const combined = `${content}\n${task ?? ""}`;
  return {
    repeated: REPEATED_PATTERN.test(combined) || /##\s*Repeated Signal[\s\S]*\brepeated\b/i.test(content),
    oneOff: ONE_OFF_PATTERN.test(combined) || /##\s*Repeated Signal[\s\S]*\b(one_off|unknown)\b/i.test(content),
    hasEvidenceSection: /^##\s*Evidence\b/im.test(content),
    hasTargetSignal: /^##\s*(Desired Next Time|Constraints|Target)\b/im.test(content) || /\b(target|next time|prevent)\b/i.test(combined),
    sensitive: SENSITIVE_PATTERN.test(combined),
    pivot: PIVOT_PATTERN.test(combined),
    deterministicCheck: CHECK_PATTERN.test(combined),
    repoRule: REPO_RULE_PATTERN.test(combined),
    workflowNote: WORKFLOW_PATTERN.test(combined),
    skillPrompt: SKILL_PATTERN.test(combined),
  };
}

function chooseStatus(flags: SignalFlags): PreflightStatus {
  if (flags.pivot) return "pivot";
  if (flags.sensitive) return "pause";
  if (!flags.repeated || !flags.hasEvidenceSection || !flags.hasTargetSignal) return "check_again";
  return "go";
}

function chooseProposalType(flags: SignalFlags): LearnProposalType {
  if (!flags.repeated || flags.oneOff) return "do_nothing";
  if (flags.deterministicCheck) return "deterministic_check";
  if (flags.repoRule) return "repo_rule";
  if (flags.workflowNote) return "workflow_note";
  if (flags.skillPrompt) return "skill_prompt_update";
  return "do_nothing";
}

function proposalFor(type: LearnProposalType, flags: SignalFlags, scan?: RepoScan): LearnProposal {
  const repoTarget = scan?.harness.agentRuleFiles[0] ?? "repo AGENTS.md or equivalent repo rule";
  const workflowTarget = scan?.harness.workflowFiles[0] ?? "repo workflow/runbook note";

  if (type === "deterministic_check") {
    return {
      type,
      title: "Add one deterministic preflight check for repeated verification friction",
      target: "nearest local verification script or Lumo preflight note",
      changeSummary: "Propose a small static check that detects the repeated CI/setup/verification condition before agent work starts.",
    };
  }
  if (type === "repo_rule") {
    return {
      type,
      title: "Clarify one repo-level safety or approval rule",
      target: repoTarget,
      changeSummary: "Propose one scoped rule for approval, safety, scope control, or final-summary proof so the agent pauses at the right boundary next time.",
    };
  }
  if (type === "workflow_note") {
    return {
      type,
      title: "Add one workflow note for repeated process friction",
      target: workflowTarget,
      changeSummary: "Propose a short runbook note that separates the repeated process states and names the next proof step.",
    };
  }
  if (type === "skill_prompt_update") {
    return {
      type,
      title: "Adjust one skill or prompt instruction after repeated agent friction",
      target: "relevant skill prompt or agent instruction, after human review",
      changeSummary: "Propose a narrow instruction update for repeated tool-use or agent-behavior friction without auto-writing the skill.",
    };
  }
  return {
    type: "do_nothing",
    title: flags.sensitive ? "Do not encode this packet until sensitive details are redacted" : "Do not encode this friction yet",
    target: "none",
    changeSummary: flags.sensitive
      ? "Pause with redacted evidence; ask for a sanitized packet before proposing a durable harness change."
      : "Treat this as one-off, unclear, or insufficiently evidenced; no harness change is proposed.",
  };
}

function whyFor(status: PreflightStatus, type: LearnProposalType, flags: SignalFlags): string {
  if (status === "pivot") return "The packet asks for broad platform automation or automatic memory/rule rewriting, which is outside learn v0/light.";
  if (status === "pause") return "The packet contains sensitive or external-side-effect signals, so learn must not echo raw content or propose an automatic write.";
  if (status === "check_again") return "The packet is missing a clear repeated signal, evidence section, or target/desired-next-time signal.";
  return `The packet has repeated friction and matches the ${type} proposal category.`;
}

function evidenceFor(input: { content: string; headings: string[]; flags: SignalFlags; input: LearnInput }): string[] {
  const { content, headings, flags } = input;
  if (flags.sensitive) {
    return [
      "Sensitive content present; not echoed.",
      `Input chars: ${content.length}`,
      `Section headings: ${headings.join(" | ") || "none detected"}`,
      input.input.task?.trim() ? "Task: provided (not echoed because sensitive signal was present)" : "Task: not provided",
    ];
  }

  return [
    input.input.inputPath ? `Input packet: ${path.basename(input.input.inputPath)}` : "Input packet: stdin/inline",
    `Input chars: ${content.length}`,
    `Section headings: ${headings.join(" | ") || "none detected"}`,
    `Repeated signal: ${flags.repeated ? "present" : "missing"}`,
    `Evidence section: ${flags.hasEvidenceSection ? "present" : "missing"}`,
    `Task: ${input.input.task?.trim() || "not provided"}`,
    input.input.scan ? `Repo scanned: ${input.input.scan.repoPath}` : "Repo scan: not provided",
  ];
}

function notVerifiedFor(input: LearnInput, flags: SignalFlags): string[] {
  return [
    "Learn inspected only the supplied packet and optional static repo scan.",
    "No files were written and no GitHub, Linear, CRM, production, memory, skill, or global-rule state was inspected or mutated.",
    input.scan ? "Repo scan used static metadata only; no package scripts were executed." : "No repo scan was used unless --path was provided.",
    flags.sensitive ? "Raw sensitive-looking packet lines were intentionally not echoed." : "Proposal text is category-derived, not copied from packet lines.",
  ];
}

function userDecisionFor(status: PreflightStatus): string {
  if (status === "go") return "Decide whether to turn this proposal into a separate reviewed docs/check/rule task.";
  if (status === "check_again") return "Provide a clearer repeated signal, evidence section, and desired next-time target before encoding anything.";
  if (status === "pause") return "Redact the packet or explicitly approve a safe manual review path; learn will not write or echo sensitive content.";
  return "Narrow the request to one local proposal-only harness improvement inside v0.2 scope.";
}

function extractHeadings(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.match(/^#{1,3}\s+(.+)$/)?.[1]?.trim())
    .filter((heading): heading is string => Boolean(heading))
    .slice(0, 12);
}

function formatList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- None."];
}
