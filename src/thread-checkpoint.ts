import type { PreflightStatus } from "./preflight.js";

export type ThreadCheckpointStatus = PreflightStatus;

export type ThreadCheckpointCard = {
  status: ThreadCheckpointStatus;
  mode: "deterministic";
  currentFraming: string;
  evidence: string[];
  notProven: string[];
  driftRisk: string;
  recommendation: string;
  userDecision: string;
  evidenceUsed: string[];
  notVerified: string[];
};

export function createThreadCheckpointCard(input: {
  content: string;
  inputPath?: string;
  task?: string;
}): ThreadCheckpointCard {
  const content = input.content.trim();
  if (!content) {
    throw new Error("Thread checkpoint input must be a non-empty packet.");
  }

  const lower = content.toLowerCase();
  const explicitStatus = extractExplicitStatus(content);
  const evidence = extractBulletsAfterHeading(content, "What Was Proven");
  const notProven = extractBulletsAfterHeading(content, "What Stayed Unproven");
  const packetNotVerified = extractBulletsAfterHeading(content, "Not Verified");
  const originalFraming = extractFencedBlockAfterHeading(content, "Original Framing");
  const currentFraming = extractCurrentFraming(content, originalFraming);
  const recommendation = extractRecommendation(content);
  const userDecision = extractUserDecision(content);
  const hasReframeSignal = /reframe|no longer matched|wrong fix route|points elsewhere|losgekoppeld|niet bewezen dat/i.test(lower);
  const hasUnconfirmedSignal = /unconfirmed|not proven|niet bewezen|unproven/i.test(lower);
  const hasApprovalSignal = /approval gate|approve|approval|akkoord|user choice/i.test(lower);
  const hasExternalRiskSignal = /production|provider|database|db|linear|mutation|deploy|migration|external|prod/i.test(lower);
  const status = chooseStatus({
    explicitStatus,
    hasReframeSignal,
    hasUnconfirmedSignal,
    hasApprovalSignal,
    hasExternalRiskSignal,
  });

  return {
    status,
    mode: "deterministic",
    currentFraming,
    evidence: evidence.length > 0 ? evidence : ["UNCONFIRMED: no explicit proven-facts section was found."],
    notProven: notProven.length > 0 ? notProven : fallbackNotProven(content),
    driftRisk: extractDriftRisk(content) ?? defaultDriftRisk(status),
    recommendation,
    userDecision,
    evidenceUsed: [
      input.inputPath ? `Input packet: ${input.inputPath}` : "Input packet: inline content",
      `Input chars: ${content.length}`,
      `Explicit status: ${explicitStatus ?? "none"}`,
      `Task: ${input.task?.trim() || "not provided"}`,
    ],
    notVerified: [
      ...packetNotVerified,
      "Thread checkpoint inspected the supplied packet only.",
      "It did not read the source Codex thread, Linear issue, git diff, database, provider logs, or runtime state.",
      "It is a steering card, not a root-cause proof or approval stamp.",
    ],
  };
}

export function renderThreadCheckpointCard(
  card: ThreadCheckpointCard,
  input: { inputPath?: string; task?: string },
): string {
  return [
    "# Lumo Thread Checkpoint",
    "",
    input.inputPath ? `Input: ${input.inputPath}` : "Input: inline content",
    input.task ? `Task: ${input.task}` : "Task: not provided",
    "",
    `## Status: ${card.status}`,
    "",
    `Mode: ${card.mode}`,
    "",
    "## Current Framing",
    "",
    card.currentFraming,
    "",
    "## Evidence",
    "",
    ...formatList(card.evidence),
    "",
    "## Not Proven",
    "",
    ...formatList(card.notProven),
    "",
    "## Drift Risk",
    "",
    card.driftRisk,
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
    ...formatList(card.evidenceUsed),
    "",
    "## Not Verified",
    "",
    ...formatList(card.notVerified),
    "",
    "Read-only: no files were written and no external systems were queried.",
    "",
  ].join("\n");
}

function chooseStatus(input: {
  explicitStatus: ThreadCheckpointStatus | null;
  hasReframeSignal: boolean;
  hasUnconfirmedSignal: boolean;
  hasApprovalSignal: boolean;
  hasExternalRiskSignal: boolean;
}): ThreadCheckpointStatus {
  if (input.explicitStatus === "pivot" || input.hasReframeSignal) return "pivot";
  if (input.explicitStatus === "pause" || (input.hasApprovalSignal && input.hasExternalRiskSignal)) return "pause";
  if (input.explicitStatus === "check_again" || input.hasUnconfirmedSignal) return "check_again";
  return input.explicitStatus ?? "go";
}

function extractExplicitStatus(content: string): ThreadCheckpointStatus | null {
  const patterns = [
    /Status:\s*`?(go|check_again|pause|pivot)`?/i,
    /\|\s*Status\s*\|\s*`?(go|check_again|pause|pivot)`?\s*\|/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) return match[1].toLowerCase() as ThreadCheckpointStatus;
  }

  return null;
}

function extractCurrentFraming(content: string, originalFraming: string | null): string {
  const currentFraming = extractLineValue(content, "Current framing");
  if (currentFraming) return currentFraming;
  if (originalFraming) return originalFraming.replace(/\s+/g, " ").trim();
  return "UNCONFIRMED: no explicit current/original framing was found.";
}

function extractRecommendation(content: string): string {
  const tableRecommendation = extractTableDecision(content, "Recommendation");
  if (tableRecommendation) return tableRecommendation;

  const nextSafeSlice = extractFencedBlockAfterHeading(content, "Next Safe Slice");
  if (nextSafeSlice) return nextSafeSlice.replace(/\s+/g, " ").trim();

  const sectionRecommendation = extractPlainSectionAfterHeading(content, "Recommendation");
  if (sectionRecommendation) return sectionRecommendation;

  const lineRecommendation = extractLineValue(content, "Recommendation");
  if (lineRecommendation) return lineRecommendation;

  return "Check one more evidence item before choosing the next implementation or issue-update slice.";
}

function extractUserDecision(content: string): string {
  const userChoice = extractTableDecision(content, "User choice");
  if (userChoice) return userChoice;

  const sectionDecision = extractPlainSectionAfterHeading(content, "User Decision");
  if (sectionDecision) return sectionDecision;

  const lineDecision = extractLineValue(content, "User decision");
  if (lineDecision) return lineDecision;

  if (/approval gate|approve|akkoord/i.test(content)) {
    return "Ask the user for explicit approval before mutation, external side effects, issue updates, or fix work.";
  }

  return "No explicit user decision was found; ask for the smallest steering choice before continuing.";
}

function extractDriftRisk(content: string): string | null {
  return extractTableDecision(content, "Risk") ?? extractPlainSectionAfterHeading(content, "Drift Risk");
}

function extractTableDecision(content: string, field: string): string | null {
  const pattern = new RegExp(`\\|\\s*${escapeRegExp(field)}\\s*\\|\\s*(.*?)\\s*\\|`, "i");
  const match = content.match(pattern);
  return match?.[1]?.replace(/`/g, "").trim() || null;
}

function extractLineValue(content: string, field: string): string | null {
  const pattern = new RegExp(`^${escapeRegExp(field)}:\\s*(.+)$`, "im");
  const match = content.match(pattern);
  return match?.[1]?.trim() || null;
}

function extractFencedBlockAfterHeading(content: string, heading: string): string | null {
  const match = content.match(new RegExp(`## ${escapeRegExp(heading)}\\n\\n\`\`\`(?:txt|markdown|md)?\\n([\\s\\S]*?)\\n\`\`\``, "i"));
  return match?.[1] ?? null;
}

function extractBulletsAfterHeading(content: string, heading: string): string[] {
  const section = extractSectionAfterHeading(content, heading);
  if (!section) return [];

  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

function extractSectionAfterHeading(content: string, heading: string): string | null {
  const match = content.match(new RegExp(`## ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=\\n## |\\n# |$)`, "i"));
  return match?.[1] ?? null;
}

function extractPlainSectionAfterHeading(content: string, heading: string): string | null {
  const section = extractSectionAfterHeading(content, heading);
  if (!section) return null;

  const normalized = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || null;
}

function fallbackNotProven(content: string): string[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /unconfirmed|not proven|niet bewezen|unproven/i.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);

  return lines.length > 0 ? lines.slice(0, 8) : ["UNCONFIRMED: no explicit not-proven section was found."];
}

function defaultDriftRisk(status: ThreadCheckpointStatus): string {
  if (status === "pivot") {
    return "The current next move may no longer follow from the strongest evidence.";
  }
  if (status === "pause") {
    return "The next step may require user approval because it could mutate state or touch external systems.";
  }
  if (status === "check_again") {
    return "One missing proof item could make the next step premature.";
  }
  return "No obvious thread-level drift risk was detected from the supplied packet.";
}

function formatList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- none"];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
