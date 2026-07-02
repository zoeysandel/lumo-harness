import { constants } from "node:fs";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { PreflightStatus } from "./preflight.js";
import type { RepoCommand, RepoScan } from "./schemas.js";

export type HarnessMapStatus = PreflightStatus;
export type HarnessMapSourceStatus = "found" | "missing" | "not_checked" | "limited";

export type HarnessMapItem = {
  kind: "agent_rule" | "workflow" | "doc" | "command" | "skill" | "plugin" | "risk" | "gap";
  label: string;
  path?: string;
  detail: string;
};

export type HarnessMapLayer = {
  status: HarnessMapSourceStatus;
  items: HarnessMapItem[];
};

export type HarnessMapState = {
  globalCodex: HarnessMapLayer;
  globalAgents: HarnessMapLayer;
  skills: HarnessMapLayer;
  plugins: HarnessMapLayer;
  notVerified: string[];
};

export type HarnessMapCard = {
  status: HarnessMapStatus;
  mode: "deterministic";
  summary: string;
  layers: {
    globalCodex: HarnessMapLayer;
    globalAgents: HarnessMapLayer;
    repoAgents: HarnessMapLayer;
    repoDocs: HarnessMapLayer;
    workflows: HarnessMapLayer;
    commands: HarnessMapLayer;
    skills: HarnessMapLayer;
    plugins: HarnessMapLayer;
  };
  overlaps: string[];
  gaps: string[];
  staleSignals: string[];
  recommendation: string;
  userDecision: string;
  evidence: string[];
  privacyBoundary: string[];
  notVerified: string[];
};

type ReadHarnessMapStateInput = {
  repoPath: string;
  codexHome?: string | null;
  agentsHome?: string | null;
};

const MAX_SHALLOW_ENTRIES = 200;

export async function readHarnessMapState(input: ReadHarnessMapStateInput): Promise<HarnessMapState> {
  const codexHome = await resolveOptionalHome(input.codexHome ?? process.env.CODEX_HOME ?? null);
  const agentsHome = await resolveOptionalHome(input.agentsHome ?? process.env.AGENTS_HOME ?? null);
  const codexLayer = codexHome ? await readHomeAgentLayer(codexHome, "Codex") : notCheckedLayer();
  const agentsLayer = agentsHome ? await readHomeAgentLayer(agentsHome, "Agents") : notCheckedLayer();
  const codexSkills = codexHome ? await readSkillsLayer(path.join(codexHome, "skills"), "CODEX_HOME") : notCheckedLayer();
  const agentsSkills = agentsHome ? await readSkillsLayer(path.join(agentsHome, "skills"), "AGENTS_HOME") : notCheckedLayer();
  const codexPlugins = codexHome ? await readPluginsLayer(path.join(codexHome, "plugins"), "CODEX_HOME") : notCheckedLayer();
  const repoPlugins = await readRepoPlugins(input.repoPath);

  return {
    globalCodex: codexLayer,
    globalAgents: agentsLayer,
    skills: mergeLayers([codexSkills, agentsSkills], "not_checked"),
    plugins: mergeLayers([codexPlugins, repoPlugins], repoPlugins.status),
    notVerified: [
      "Global/user layers were inspected only when --codex-home, --agents-home, CODEX_HOME, or AGENTS_HOME pointed at readable directories.",
      "Global AGENTS.md bodies, skill bodies, memory/session logs, .env values, and arbitrary home files were not read.",
    ],
  };
}

export function createHarnessMapCard(scan: RepoScan, state: HarnessMapState): HarnessMapCard {
  const repoAgents = layerFromFiles(scan.harness.agentRuleFiles, "agent_rule", "Repo agent rule file");
  const repoDocs = layerFromFiles(scan.harness.docsFiles, "doc", "Repo documentation file");
  const workflows = layerFromFiles(scan.harness.workflowFiles, "workflow", "Repo workflow/runbook file");
  const commands = layerFromCommands(scan.commands);
  const riskGaps = riskyMissingRails(scan);
  const overlaps = detectOverlaps(scan, state);
  const gaps = detectGaps(scan, state);
  const status = chooseStatus(scan, state, overlaps, riskGaps);

  return {
    status,
    mode: "deterministic",
    summary: summarize(status, scan),
    layers: {
      globalCodex: state.globalCodex,
      globalAgents: state.globalAgents,
      repoAgents,
      repoDocs,
      workflows,
      commands,
      skills: state.skills,
      plugins: state.plugins,
    },
    overlaps,
    gaps,
    staleSignals: [],
    recommendation: recommendationFor(status),
    userDecision: userDecisionFor(status),
    evidence: [
      `Repo: ${scan.repoPath}`,
      `Readiness: ${scan.readiness} (${scan.readinessReason})`,
      `Files scanned: ${scan.fileCount}`,
      `Package scripts: ${scan.commands.length}`,
      `Current rails: ${scan.currentRails.join(" | ")}`,
      `Missing rails: ${scan.missingRails.map((rail) => rail.title).join(" | ") || "none detected"}`,
    ],
    privacyBoundary: [
      "Repo scan ignores .env values and does not execute package scripts.",
      "Global AGENTS.md and skill bodies are existence/name metadata only; bodies are not rendered.",
      "Plugin implementation files are not read; only known plugin.json manifest names are inspected.",
      "Memory, session transcripts, external systems, runtime state, and arbitrary home files are not inspected.",
    ],
    notVerified: [
      ...scan.notVerified,
      ...state.notVerified,
      "Stale-signal detection is intentionally empty in v1 unless metadata is trivial and safe.",
    ],
  };
}

export function renderHarnessMapCard(card: HarnessMapCard, input: { repoPath: string }): string {
  return [
    "# Lumo Harness Map",
    "",
    `Repo: ${input.repoPath}`,
    "",
    `## Status: ${card.status}`,
    "",
    `Mode: ${card.mode}`,
    "",
    "## Summary",
    "",
    card.summary,
    "",
    "## Global/User Layer",
    "",
    ...formatLayer("Global Codex", card.layers.globalCodex),
    ...formatLayer("Global Agents", card.layers.globalAgents),
    "",
    "## Repo Agent Layer",
    "",
    ...formatLayer("Repo Agents", card.layers.repoAgents),
    "",
    "## Repo Docs And Workflows",
    "",
    ...formatLayer("Repo Docs", card.layers.repoDocs),
    ...formatLayer("Workflows", card.layers.workflows),
    "",
    "## Commands",
    "",
    ...formatLayer("Commands", card.layers.commands),
    "",
    "## Skills And Plugins",
    "",
    ...formatLayer("Skills", card.layers.skills),
    ...formatLayer("Plugins", card.layers.plugins),
    "",
    "## Overlaps",
    "",
    ...formatList(card.overlaps),
    "",
    "## Gaps",
    "",
    ...formatList(card.gaps),
    "",
    "## Stale Signals",
    "",
    ...formatList(card.staleSignals),
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
    "## Privacy Boundary",
    "",
    ...formatList(card.privacyBoundary),
    "",
    "## Not Verified",
    "",
    ...formatList(card.notVerified),
    "",
    "Read-only: no files were written and no external systems were queried.",
    "",
  ].join("\n");
}

async function resolveOptionalHome(homePath: string | null): Promise<string | null> {
  if (!homePath) return null;
  const resolved = path.resolve(homePath);
  try {
    await access(resolved, constants.R_OK);
    return resolved;
  } catch {
    return null;
  }
}

async function readHomeAgentLayer(homePath: string, label: string): Promise<HarnessMapLayer> {
  const agentsPath = path.join(homePath, "AGENTS.md");
  if (!(await isReadableFile(agentsPath))) return missingLayer();
  return {
    status: "found",
    items: [{ kind: "agent_rule", label: `${label} AGENTS.md`, path: agentsPath, detail: "Exists; body was not read." }],
  };
}

async function readSkillsLayer(skillsPath: string, sourceLabel: string): Promise<HarnessMapLayer> {
  const entries = await safeReadDir(skillsPath);
  if (entries === null) return missingLayer();
  if (entries.length > MAX_SHALLOW_ENTRIES) return limitedLayer("skill", sourceLabel, "Too many entries for bounded v1 inspection.");

  const items: HarnessMapItem[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(skillsPath, entry.name, "SKILL.md");
    if (await isReadableFile(skillPath)) {
      items.push({ kind: "skill", label: entry.name, path: skillPath, detail: `${sourceLabel} skill name detected; body was not read.` });
    }
  }
  return items.length > 0 ? { status: "found", items } : missingLayer();
}

async function readPluginsLayer(pluginsPath: string, sourceLabel: string): Promise<HarnessMapLayer> {
  const entries = await safeReadDir(pluginsPath);
  if (entries === null) return missingLayer();
  if (entries.length > MAX_SHALLOW_ENTRIES) return limitedLayer("plugin", sourceLabel, "Too many entries for bounded v1 inspection.");

  const items: HarnessMapItem[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(pluginsPath, entry.name, "plugin.json");
    const manifestName = await readPluginManifestName(manifestPath);
    if (manifestName) {
      items.push({ kind: "plugin", label: manifestName, path: manifestPath, detail: `${sourceLabel} plugin manifest name detected.` });
    }
  }
  return items.length > 0 ? { status: "found", items } : missingLayer();
}

async function readRepoPlugins(repoPath: string): Promise<HarnessMapLayer> {
  const items: HarnessMapItem[] = [];
  const rootManifest = path.join(repoPath, ".codex-plugin", "plugin.json");
  const rootName = await readPluginManifestName(rootManifest);
  if (rootName) items.push({ kind: "plugin", label: rootName, path: rootManifest, detail: "Repo plugin manifest name detected." });

  const repoPluginLayer = await readPluginsLayer(path.join(repoPath, ".codex", "plugins"), "repo .codex/plugins");
  return mergeLayers([items.length > 0 ? { status: "found", items } : missingLayer(), repoPluginLayer], "missing");
}

async function readPluginManifestName(manifestPath: string): Promise<string | null> {
  try {
    const raw = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as { name?: unknown; displayName?: unknown; title?: unknown };
    const name = parsed.displayName ?? parsed.name ?? parsed.title;
    return typeof name === "string" && name.trim().length > 0 ? name.trim() : path.basename(path.dirname(manifestPath));
  } catch {
    return null;
  }
}

async function safeReadDir(dirPath: string) {
  try {
    return await readdir(dirPath, { withFileTypes: true });
  } catch {
    return null;
  }
}

async function isReadableFile(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function layerFromFiles(files: string[], kind: HarnessMapItem["kind"], detail: string): HarnessMapLayer {
  return files.length > 0
    ? { status: "found", items: files.slice(0, 20).map((file) => ({ kind, label: path.basename(file), path: file, detail })) }
    : missingLayer();
}

function layerFromCommands(commands: RepoCommand[]): HarnessMapLayer {
  return commands.length > 0
    ? { status: "found", items: commands.map((command) => ({ kind: "command", label: command.name, detail: `${command.category}: ${command.command}` })) }
    : missingLayer();
}

function detectOverlaps(scan: RepoScan, state: HarnessMapState): string[] {
  const overlaps: string[] = [];
  const globalRules = [state.globalCodex, state.globalAgents].filter((layer) => layer.status === "found").length;
  if (globalRules > 0 && scan.harness.agentRuleFiles.length > 0) {
    overlaps.push("Global/user agent rules and repo agent rules both exist; prefer the nearest repo rule for project-specific behavior.");
  }
  if (scan.harness.agentRuleFiles.length > 1) {
    overlaps.push(`Multiple repo agent rule files exist: ${scan.harness.agentRuleFiles.join(", ")}.`);
  }
  if (state.skills.status === "found" && scan.harness.workflowFiles.length > 0) {
    overlaps.push("Global/user skills and repo workflow docs both shape agent behavior; keep repo-specific workflow truth explicit.");
  }
  return overlaps;
}

function detectGaps(scan: RepoScan, state: HarnessMapState): string[] {
  return [
    ...scan.missingRails.map((rail) => `${rail.title}: ${rail.whyItMatters}`),
    state.globalCodex.status === "not_checked" ? "Global Codex layer was not checked because no explicit readable home was provided." : null,
    state.globalAgents.status === "not_checked" ? "Global Agents layer was not checked because no explicit readable home was provided." : null,
    state.skills.status === "not_checked" ? "Skills layer was not checked because no explicit readable home was provided." : null,
  ].filter((item): item is string => Boolean(item));
}

function riskyMissingRails(scan: RepoScan): string[] {
  if (!(scan.risks.hasExternalProviderCode || scan.risks.hasDatabaseOrMigrationCode || scan.risks.hasAuthCode || scan.risks.hasEnvAccess)) return [];
  return scan.missingRails.filter((rail) => /provider|data|approval|verification/i.test(`${rail.title} ${rail.whyItMatters}`)).map((rail) => rail.title);
}

function chooseStatus(scan: RepoScan, state: HarnessMapState, overlaps: string[], riskGaps: string[]): HarnessMapStatus {
  const verificationCommands = scan.commands.filter((command) => ["lint", "typecheck", "test", "build"].includes(command.category));
  if (overlaps.length >= 2 && scan.harness.agentRuleFiles.length === 0) return "pivot";
  if (overlaps.length >= 3) return "pivot";
  if (riskGaps.length > 0) return "pause";
  if (scan.harness.agentRuleFiles.length === 0 || verificationCommands.length === 0) return "check_again";
  if ([state.globalCodex.status, state.globalAgents.status, state.skills.status].includes("not_checked")) return "check_again";
  return "go";
}

function summarize(status: HarnessMapStatus, scan: RepoScan): string {
  if (status === "go") return "The repo has usable local rails and verification commands; optional user-layer metadata was checked.";
  if (status === "pause") return "The map found risky repo seams plus missing provider/data/approval rails; pause before automation.";
  if (status === "pivot") return "Multiple rule sources make the source of truth unclear; narrow the harness before automation.";
  return `The map is useful, but one expected layer or verification rail is missing/not checked. Repo readiness: ${scan.readiness}.`;
}

function recommendationFor(status: HarnessMapStatus): string {
  if (status === "go") return "Use the repo rails and verification scripts as the first source of truth for the next coding slice.";
  if (status === "pause") return "Add or confirm the missing approval/risk gate before asking an agent to change risky seams.";
  if (status === "pivot") return "Choose one repo source of truth for agent behavior before adding automation or broader workflow rules.";
  return "Confirm the missing layer or add the smallest repo rail/verification command before relying on this harness.";
}

function userDecisionFor(status: HarnessMapStatus): string {
  if (status === "go") return "No user decision is needed before read-only routing or a small local coding slice.";
  if (status === "pause") return "Approve the risky seam explicitly, or narrow the work to a safe local slice first.";
  if (status === "pivot") return "Choose which rule source should be authoritative for this repo.";
  return "Decide whether to provide explicit fake/global homes, add repo agent rules, or continue with the noted gaps.";
}

function mergeLayers(layers: HarnessMapLayer[], emptyStatus: HarnessMapSourceStatus): HarnessMapLayer {
  const items = layers.flatMap((layer) => layer.items);
  if (items.length > 0) return { status: layers.some((layer) => layer.status === "limited") ? "limited" : "found", items };
  if (layers.some((layer) => layer.status === "not_checked")) return { status: "not_checked", items: [] };
  if (layers.some((layer) => layer.status === "limited")) return { status: "limited", items: [] };
  return { status: emptyStatus, items: [] };
}

function notCheckedLayer(): HarnessMapLayer {
  return { status: "not_checked", items: [] };
}

function missingLayer(): HarnessMapLayer {
  return { status: "missing", items: [] };
}

function limitedLayer(kind: HarnessMapItem["kind"], label: string, detail: string): HarnessMapLayer {
  return { status: "limited", items: [{ kind, label, detail }] };
}

function formatLayer(label: string, layer: HarnessMapLayer): string[] {
  return [`### ${label}: ${layer.status}`, "", ...formatItems(layer.items), ""];
}

function formatItems(items: HarnessMapItem[]): string[] {
  return items.length > 0
    ? items.map((item) => `- ${item.label}${item.path ? ` (${item.path})` : ""}: ${item.detail}`)
    : ["- None."];
}

function formatList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- None."];
}
