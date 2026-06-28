import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import type { RepoScan } from "./schemas.js";
import type { CodexPreflightSuggestion, PreflightCard } from "./preflight.js";
import { mergeCodexPreflightSuggestion } from "./preflight.js";

export type CodexPreflightResult = {
  status: "success" | "failed";
  card: PreflightCard;
  command: string;
  message: string;
};

const preflightStatusSchema = z.enum(["go", "check_again", "pause", "pivot"]);

const codexPreflightSuggestionSchema = z.object({
  status: preflightStatusSchema,
  why: z.string().min(1),
  route: z.string().min(1),
  contextNeeded: z.array(z.string()).default([]),
  stopIf: z.array(z.string()).default([]),
  userDecision: z.string().min(1),
  notVerified: z.array(z.string()).default([]),
});

export async function runCodexPreflightSynthesis(
  scan: RepoScan,
  task: string,
  deterministicCard: PreflightCard,
  options: { timeoutMs?: number } = {},
): Promise<CodexPreflightResult> {
  const codexBin = process.env.LUMO_CODEX_BIN ?? "codex";
  const timeoutMs = options.timeoutMs ?? 90_000;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "lumo-codex-preflight-"));
  const finalPath = path.join(tempDir, "final.json");
  const command = "codex exec --sandbox read-only --ephemeral --ignore-user-config --ignore-rules";

  try {
    const result = await runProcessWithInput(
      codexBin,
      [
        "exec",
        "--cd",
        scan.repoPath,
        "--sandbox",
        "read-only",
        "--skip-git-repo-check",
        "--ephemeral",
        "--ignore-user-config",
        "--ignore-rules",
        "--output-last-message",
        finalPath,
        "-",
      ],
      buildCodexPreflightPrompt(scan, task, deterministicCard),
      scan.repoPath,
      timeoutMs,
    );

    if (result.timedOut) {
      throw new Error(`Codex preflight synthesis timed out after ${timeoutMs}ms.`);
    }

    if (result.code !== 0) {
      throw new Error(
        [
          `Codex exited with code ${result.code}.`,
          result.stderr ? `stderr: ${trimForError(result.stderr)}` : null,
          result.stdout ? `stdout: ${trimForError(result.stdout)}` : null,
        ]
          .filter(Boolean)
          .join(" "),
      );
    }

    const rawContent = await readFile(finalPath, "utf8").catch(() => null);
    if (!rawContent) {
      throw new Error("Codex completed but did not write the output-last-message file.");
    }

    const suggestion = parseCodexSuggestion(rawContent);
    return {
      status: "success",
      card: mergeCodexPreflightSuggestion(deterministicCard, suggestion),
      command,
      message: "Codex interpreted the task in read-only mode and Lumo applied the deterministic safety floor.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "failed",
      card: {
        ...deterministicCard,
        notVerified: [
          ...deterministicCard.notVerified,
          "Codex preflight synthesis failed; this card is deterministic-only.",
          `Codex failure: ${message}`,
        ],
      },
      command,
      message,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export function buildCodexPreflightPrompt(scan: RepoScan, task: string, deterministicCard: PreflightCard): string {
  return [
    "You are Lumo's optional Codex preflight synthesis layer for an AI coding-agent task.",
    "",
    "Goal:",
    "Interpret the user's task against the deterministic repo scan and improve the decision card before any coding starts.",
    "",
    "Hard rules:",
    "- Read only. Do not edit, create, delete, move, format, install, start servers, or run write-like commands.",
    "- Do not include absolute local paths, secrets, env values, raw private data, or contact data.",
    "- Do not invent commands or files as proof.",
    "- You may be more cautious than the deterministic card.",
    "- You must not weaken obvious safety gates around auth, billing, database, migrations, providers, env, deploy, deletion, or external side effects.",
    "- If evidence is missing, say UNCONFIRMED in notVerified.",
    "",
    "Return JSON only. No markdown, no code fence.",
    "",
    "JSON schema:",
    JSON.stringify(
      {
        status: "go | check_again | pause | pivot",
        why: "plain-language reason",
        route: "recommended first route for the coding agent",
        contextNeeded: ["short context item"],
        stopIf: ["short stop condition"],
        userDecision: "smallest decision needed from the user",
        notVerified: ["short not-verified item"],
      },
      null,
      2,
    ),
    "",
    "User task:",
    task,
    "",
    "Deterministic card:",
    JSON.stringify(deterministicCard, null, 2),
    "",
    "Deterministic repo scan:",
    JSON.stringify(redactScan(scan), null, 2),
  ].join("\n");
}

function parseCodexSuggestion(rawContent: string): CodexPreflightSuggestion {
  const trimmed = rawContent.trim();
  const jsonText = extractJsonObject(trimmed);
  const parsed = JSON.parse(jsonText) as unknown;
  return codexPreflightSuggestionSchema.parse(parsed);
}

function extractJsonObject(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return content.slice(start, end + 1);
  return content;
}

function redactScan(scan: RepoScan): Omit<RepoScan, "repoPath"> & { repoName: string } {
  const { repoPath: _repoPath, ...safeScan } = scan;
  return {
    ...safeScan,
    repoName: path.basename(scan.repoPath),
  };
}

function runProcessWithInput(
  command: string,
  args: string[],
  input: string,
  cwd: string,
  timeoutMs: number,
): Promise<{ code: number | null; stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });

    child.stdin.end(input);
  });
}

function trimForError(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 800);
}
