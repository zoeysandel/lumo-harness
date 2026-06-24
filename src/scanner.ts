import { constants } from "node:fs";
import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type {
  CommandCategory,
  HarnessSignals,
  MissingRail,
  Readiness,
  RepoCommand,
  RepoScan,
  RiskSignals,
  StackSignals,
} from "./schemas.js";

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type ContentSignals = {
  hasZodContent: boolean;
  hasOpenAIContent: boolean;
  hasEnvAccess: boolean;
};

const IGNORED_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".cache",
  ".lumo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "tmp",
  "temp",
]);

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

export async function scanRepository(input: { repoPath: string }): Promise<RepoScan> {
  const repoPath = path.resolve(input.repoPath);
  await assertReadableDirectory(repoPath);

  const files = await listRepoFiles(repoPath);
  const packageJson = await readPackageJson(repoPath);
  const dependencies = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };
  const contentSignals = await collectContentSignals(repoPath, files);

  const commands = collectCommands(packageJson);
  const stack = collectStackSignals(files, dependencies, contentSignals);
  const harness = collectHarnessSignals(files);
  const risks = collectRiskSignals(files, stack, contentSignals);
  const currentRails = collectCurrentRails(commands, harness, stack);
  const missingRails = collectMissingRails(commands, harness, stack, risks);
  const readiness = classifyReadiness(commands, harness, stack, risks);

  return {
    repoPath,
    scannedAt: new Date().toISOString(),
    fileCount: files.length,
    readiness,
    readinessReason: explainReadiness(readiness, harness, commands, risks),
    stack,
    commands,
    harness,
    risks,
    currentRails,
    missingRails,
    recommendedFirstHarness: recommendFirstHarness(missingRails, risks, stack),
    notVerified: [
      "No package scripts were executed.",
      "No runtime behavior, API calls, database rules, or UI flows were verified.",
      "Secrets and .env values were ignored.",
      "File matching is heuristic; absence of a signal is not proof that a rail does not exist.",
    ],
  };
}

async function assertReadableDirectory(repoPath: string): Promise<void> {
  await access(repoPath, constants.R_OK);
  const stats = await stat(repoPath);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${repoPath}`);
  }
}

async function listRepoFiles(root: string): Promise<string[]> {
  const result: string[] = [];

  async function walk(dir: string): Promise<void> {
    if (result.length >= 5000) return;
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".env")) continue;
      const fullPath = path.join(dir, entry.name);
      const relativePath = toPosix(path.relative(root, fullPath));

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        await walk(fullPath);
        continue;
      }

      if (entry.isFile()) {
        result.push(relativePath);
      }
    }
  }

  await walk(root);
  return result.sort();
}

async function readPackageJson(root: string): Promise<PackageJson | null> {
  try {
    const raw = await readFile(path.join(root, "package.json"), "utf8");
    return JSON.parse(raw) as PackageJson;
  } catch {
    return null;
  }
}

async function collectContentSignals(root: string, files: string[]): Promise<ContentSignals> {
  const scanFiles = files
    .filter((file) => TEXT_EXTENSIONS.has(path.extname(file)))
    .filter((file) => !file.startsWith("package-lock.json"))
    .slice(0, 400);

  let hasZodContent = false;
  let hasOpenAIContent = false;
  let hasEnvAccess = false;

  for (const file of scanFiles) {
    const fullPath = path.join(root, file);
    const stats = await stat(fullPath);
    if (stats.size > 200_000) continue;

    const content = await readFile(fullPath, "utf8");
    hasZodContent ||= /\bz\.object\b|\bzod\b/i.test(content);
    hasOpenAIContent ||= /@openai|from ["']openai["']|OpenAI\(/.test(content);
    hasEnvAccess ||= /process\.env|import\.meta\.env/.test(content);
  }

  return { hasZodContent, hasOpenAIContent, hasEnvAccess };
}

function collectCommands(packageJson: PackageJson | null): RepoCommand[] {
  return Object.entries(packageJson?.scripts ?? {})
    .map(([name, command]) => ({
      name,
      command,
      category: categorizeCommand(name, command),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function categorizeCommand(name: string, command: string): CommandCategory {
  const haystack = `${name} ${command}`.toLowerCase();
  if (/typecheck|tsc\b|typescript/.test(haystack)) return "typecheck";
  if (/lint|eslint|biome|prettier/.test(haystack)) return "lint";
  if (/test|vitest|jest|playwright|node --test/.test(haystack)) return "test";
  if (/fixture|mock|smoke/.test(haystack)) return "fixture";
  if (/\beval\b|evals|evaluation/.test(haystack)) return "eval";
  if (/build|next build|vite build/.test(haystack)) return "build";
  if (/dev|start/.test(haystack)) return "dev";
  return "other";
}

function collectStackSignals(
  files: string[],
  dependencies: Record<string, string>,
  contentSignals: ContentSignals,
): StackSignals {
  return {
    packageManager: detectPackageManager(files),
    hasPackageJson: files.includes("package.json"),
    hasTypeScript:
      "typescript" in dependencies ||
      files.includes("tsconfig.json") ||
      files.some((file) => /\.(ts|tsx)$/.test(file)),
    hasNext: "next" in dependencies || files.some((file) => /(^|\/)next\.config\./.test(file)),
    hasVite: "vite" in dependencies || files.some((file) => /(^|\/)vite\.config\./.test(file)),
    hasReact: "react" in dependencies || files.some((file) => /\.(tsx|jsx)$/.test(file)),
    hasZod: "zod" in dependencies || contentSignals.hasZodContent || files.some((file) => /schemas?\//i.test(file)),
    hasOpenAI:
      "openai" in dependencies ||
      "@openai/agents" in dependencies ||
      "@openai/sdk" in dependencies ||
      contentSignals.hasOpenAIContent,
    hasVercelAi: "ai" in dependencies || "@ai-sdk/openai" in dependencies || "@vercel/ai" in dependencies,
    hasSupabase: "@supabase/supabase-js" in dependencies || files.some((file) => file.startsWith("supabase/")),
  };
}

function detectPackageManager(files: string[]): string | null {
  if (files.includes("pnpm-lock.yaml")) return "pnpm";
  if (files.includes("yarn.lock")) return "yarn";
  if (files.includes("package-lock.json")) return "npm";
  if (files.includes("bun.lock") || files.includes("bun.lockb")) return "bun";
  return null;
}

function collectHarnessSignals(files: string[]): HarnessSignals {
  return {
    agentRuleFiles: files.filter((file) =>
      [
        "AGENTS.md",
        "CLAUDE.md",
        ".cursorrules",
        ".github/copilot-instructions.md",
      ].includes(file) ||
      file.startsWith(".cursor/rules/") ||
      file.startsWith(".claude/"),
    ),
    workflowFiles: files.filter((file) =>
      /(^|\/)(workflows?|runbooks?|playbooks?)\//i.test(file) ||
      /(^|\/)(bugfix|feature|review|release|debug)\.md$/i.test(file),
    ),
    docsFiles: files
      .filter((file) => /^docs\/.*\.md$/i.test(file) || /^[A-Z0-9_-]+\.md$/i.test(file))
      .slice(0, 40),
    promptFiles: files.filter((file) => /(^|\/)prompts?\//i.test(file) || /prompt/i.test(path.basename(file))),
    schemaFiles: files.filter((file) => /schemas?\//i.test(file) || /schema/i.test(path.basename(file))),
    fixtureFiles: files.filter((file) => /(^|\/)(fixtures?|mocks?|examples?)\//i.test(file) || /fixture|mock/i.test(path.basename(file))),
    evalFiles: files.filter((file) => /(^|\/)(evals?|evaluations?|testcases?)\//i.test(file) || /\beval\b/i.test(path.basename(file))),
    providerFiles: files.filter((file) => /(^|\/)(providers?|llm|ai)\//i.test(file) || /openai|provider|llm/i.test(path.basename(file))),
  };
}

function collectRiskSignals(files: string[], stack: StackSignals, contentSignals: ContentSignals): RiskSignals {
  return {
    hasExternalProviderCode: stack.hasOpenAI || stack.hasVercelAi || stack.hasSupabase,
    hasDatabaseOrMigrationCode: stack.hasSupabase || files.some((file) => /(^|\/)(migrations?|schema)\//i.test(file)),
    hasAuthCode:
      files.some((file) => /(^|\/)(auth|middleware)\//i.test(file) || /auth|session|login/i.test(path.basename(file))),
    hasEnvAccess: contentSignals.hasEnvAccess || files.includes(".env.example"),
    hasApiRoutes: files.some((file) => /(^|\/)(app|pages)\/api\//.test(file) || /(^|\/)api\//.test(file)),
  };
}

function collectCurrentRails(commands: RepoCommand[], harness: HarnessSignals, stack: StackSignals): string[] {
  const rails: string[] = [];

  if (harness.agentRuleFiles.length > 0) {
    rails.push(`Repo-level agent files: ${harness.agentRuleFiles.slice(0, 4).join(", ")}`);
  }

  const verificationCommands = commands.filter((command) =>
    ["lint", "typecheck", "test", "build"].includes(command.category),
  );
  if (verificationCommands.length > 0) {
    rails.push(`Verification scripts: ${verificationCommands.map((command) => command.name).join(", ")}`);
  }

  if (harness.docsFiles.some((file) => file === "README.md")) {
    rails.push("README.md exists as a repo entrypoint.");
  }

  if (harness.schemaFiles.length > 0 || stack.hasZod) {
    rails.push("Structured schema signals found.");
  }

  if (harness.fixtureFiles.length > 0 || harness.evalFiles.length > 0) {
    rails.push("Fixture/eval-like files found.");
  }

  if (harness.workflowFiles.length > 0) {
    rails.push(`Workflow docs found: ${harness.workflowFiles.slice(0, 4).join(", ")}`);
  }

  return rails.length > 0 ? rails : ["No explicit repo-level agent rails detected."];
}

function collectMissingRails(
  commands: RepoCommand[],
  harness: HarnessSignals,
  stack: StackSignals,
  risks: RiskSignals,
): MissingRail[] {
  const missing: MissingRail[] = [];

  if (!harness.agentRuleFiles.some((file) => file === "AGENTS.md")) {
    missing.push({
      title: "Add a root AGENTS.md",
      whyItMatters: "Codex needs a repo-local operating contract for scope, commands, review gates, and no-go zones.",
      suggestedFile: "AGENTS.md",
      priority: 1,
    });
  }

  if (!harness.agentRuleFiles.some((file) => file === "CLAUDE.md")) {
    missing.push({
      title: "Add a CLAUDE.md adapter",
      whyItMatters: "Claude Code users need the same repo truth without copying global personal rules into the project.",
      suggestedFile: "CLAUDE.md",
      priority: 2,
    });
  }

  if (harness.workflowFiles.length === 0) {
    missing.push({
      title: "Add workflow rails for common agent tasks",
      whyItMatters: "Bugfix, feature, and review flows should say which files to inspect, which commands prove work, and when to stop.",
      suggestedFile: "workflows/bugfix.md",
      priority: 2,
    });
  }

  if (risks.hasExternalProviderCode && !hasProviderGate(harness)) {
    missing.push({
      title: "Add provider and data approval gates",
      whyItMatters: "AI, API, Supabase, and env-touching changes need explicit human review before external side effects.",
      suggestedFile: "AGENTS.md",
      priority: 1,
    });
  }

  if (stack.hasOpenAI && harness.fixtureFiles.length === 0 && harness.evalFiles.length === 0) {
    missing.push({
      title: "Add one fixture or eval harness",
      whyItMatters: "AI behavior needs a repeatable example so agents can compare before and after without guessing.",
      suggestedFile: "fixtures/agent-readiness-example.json",
      priority: 3,
    });
  }

  if (!commands.some((command) => ["lint", "typecheck", "test", "build"].includes(command.category))) {
    missing.push({
      title: "Name the local verification commands",
      whyItMatters: "Coding agents need a deterministic way to prove a small change before claiming it is ready.",
      suggestedFile: "AGENTS.md",
      priority: 1,
    });
  }

  return dedupeRails(missing)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
}

function hasProviderGate(harness: HarnessSignals): boolean {
  const files = [...harness.agentRuleFiles, ...harness.workflowFiles, ...harness.docsFiles].join(" ").toLowerCase();
  return /approval|review|provider|external|supabase|env|secret|privacy/.test(files);
}

function dedupeRails(rails: MissingRail[]): MissingRail[] {
  const seen = new Set<string>();
  return rails.filter((rail) => {
    if (seen.has(rail.title)) return false;
    seen.add(rail.title);
    return true;
  });
}

function classifyReadiness(
  commands: RepoCommand[],
  harness: HarnessSignals,
  stack: StackSignals,
  risks: RiskSignals,
): Readiness {
  let score = 0;
  if (stack.hasPackageJson) score += 1;
  if (stack.hasTypeScript) score += 1;
  if (harness.agentRuleFiles.length > 0) score += 2;
  if (harness.workflowFiles.length > 0) score += 1;
  if (harness.docsFiles.some((file) => file === "README.md")) score += 1;
  if (commands.some((command) => command.category === "typecheck")) score += 1;
  if (commands.some((command) => command.category === "test")) score += 1;
  if (commands.some((command) => command.category === "lint")) score += 1;
  if (harness.schemaFiles.length > 0 || stack.hasZod) score += 1;
  if (harness.fixtureFiles.length > 0 || harness.evalFiles.length > 0) score += 1;
  if (risks.hasExternalProviderCode && harness.agentRuleFiles.length === 0) score -= 1;

  if (harness.agentRuleFiles.length === 0) {
    return score >= 3 ? "partial" : "not_ready";
  }

  if (score >= 9) return "strong_existing_harness";
  if (score >= 6) return "agent_ready_with_gaps";
  if (score >= 3) return "partial";
  return "not_ready";
}

function explainReadiness(
  readiness: Readiness,
  harness: HarnessSignals,
  commands: RepoCommand[],
  risks: RiskSignals,
): string {
  if (readiness === "strong_existing_harness") {
    return "The repo already has agent files, workflow/docs/check signals, and repeatable verification rails.";
  }
  if (readiness === "agent_ready_with_gaps") {
    return "The repo has enough rails for assisted coding, but still needs clearer workflow or risk boundaries.";
  }
  if (readiness === "partial") {
    const reason = harness.agentRuleFiles.length === 0 ? "no repo-level agent file" : "limited workflow coverage";
    return `The repo has useful project signals, but ${reason}.`;
  }
  const commandCount = commands.length;
  const riskNote = risks.hasExternalProviderCode ? " External provider code makes this riskier." : "";
  return `Few agent-readiness rails were detected. ${commandCount} package scripts were found.${riskNote}`.trim();
}

function recommendFirstHarness(missingRails: MissingRail[], risks: RiskSignals, stack: StackSignals): string {
  if (missingRails.length > 0) return missingRails[0].suggestedFile;
  if (risks.hasExternalProviderCode || stack.hasOpenAI) return "workflows/ai-change.md";
  return "workflows/feature.md";
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}
