import { constants } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";

export type PreflightStatus = "pass" | "warn" | "fail";

export type PreflightCheck = {
  name: string;
  status: PreflightStatus;
  detail: string;
};

export type CodexHomePreflightInput = {
  codexHome: string;
  caseName: string;
  requireNoGlobalAgents: boolean;
};

export type CodexHomePreflightReport = {
  codexHome: string;
  caseName: string;
  ready: boolean;
  checks: PreflightCheck[];
  command: string;
};

export async function checkCodexHome(input: CodexHomePreflightInput): Promise<CodexHomePreflightReport> {
  const codexHome = path.resolve(input.codexHome);
  const checks: PreflightCheck[] = [];

  checks.push(await directoryCheck(codexHome));
  checks.push(await globalAgentsCheck(codexHome, input.requireNoGlobalAgents));
  checks.push(await configCheck(codexHome));
  checks.push(authBoundaryCheck());

  return {
    codexHome,
    caseName: input.caseName,
    ready: checks.every((check) => check.status !== "fail"),
    checks,
    command: renderEvalCommand(codexHome, input.caseName, input.requireNoGlobalAgents),
  };
}

export function renderCodexHomePreflight(report: CodexHomePreflightReport): string {
  return [
    "# Custom Codex Home Preflight",
    "",
    `Status: ${report.ready ? "ready" : "not_ready"}`,
    "",
    "| Check | Status | Detail |",
    "| --- | --- | --- |",
    ...report.checks.map((check) => `| ${check.name} | ${check.status.toUpperCase()} | ${escapeTable(check.detail)} |`),
    "",
    "## Eval Command",
    "",
    "```bash",
    report.command,
    "```",
    "",
    "## Boundary",
    "",
    "- This preflight does not copy auth files, secrets, config, or global rules.",
    "- It does not read token files or prove that Codex is signed in.",
    "- The first eval run may still fail if the supplied Codex home is not authenticated.",
    "",
  ].join("\n");
}

async function directoryCheck(codexHome: string): Promise<PreflightCheck> {
  try {
    const stats = await stat(codexHome);

    if (!stats.isDirectory()) {
      return {
        name: "Codex home directory",
        status: "fail",
        detail: "Path exists but is not a directory.",
      };
    }

    return {
      name: "Codex home directory",
      status: "pass",
      detail: "Directory exists.",
    };
  } catch {
    return {
      name: "Codex home directory",
      status: "fail",
      detail: "Directory does not exist or is not readable.",
    };
  }
}

async function globalAgentsCheck(codexHome: string, requireNoGlobalAgents: boolean): Promise<PreflightCheck> {
  const agentsPath = path.join(codexHome, "AGENTS.md");
  const exists = await fileExists(agentsPath);

  if (exists && requireNoGlobalAgents) {
    return {
      name: "Global AGENTS.md",
      status: "fail",
      detail: "`AGENTS.md` exists in the supplied Codex home; strict mode would abort.",
    };
  }

  if (exists) {
    return {
      name: "Global AGENTS.md",
      status: "warn",
      detail: "`AGENTS.md` exists; this is not a clean instruction environment.",
    };
  }

  return {
    name: "Global AGENTS.md",
    status: "pass",
    detail: "No global `AGENTS.md` found in the supplied Codex home.",
  };
}

async function configCheck(codexHome: string): Promise<PreflightCheck> {
  const configPath = path.join(codexHome, "config.toml");

  if (await fileExists(configPath)) {
    return {
      name: "Config file",
      status: "warn",
      detail: "`config.toml` exists, but eval runs pass `--ignore-user-config`.",
    };
  }

  return {
    name: "Config file",
    status: "pass",
    detail: "No `config.toml` found.",
  };
}

function authBoundaryCheck(): PreflightCheck {
  return {
    name: "Auth boundary",
    status: "warn",
    detail: "Auth is not inspected; no token or credential files are read.",
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function renderEvalCommand(codexHome: string, caseName: string, requireNoGlobalAgents: boolean): string {
  return [
    "npm run eval:codex --",
    `--case ${shellQuote(caseName)}`,
    `--codex-home ${shellQuote(codexHome)}`,
    requireNoGlobalAgents ? "--require-no-global-agents" : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
    return value;
  }

  return `'${value.replace(/'/g, "'\\''")}'`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
