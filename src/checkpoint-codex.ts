import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import type { CheckpointCard, CodexCheckpointSuggestion, GitCheckpointState } from "./checkpoint.js";
import { mergeCodexCheckpointSuggestion } from "./checkpoint.js";
import type { RepoScan } from "./schemas.js";

export type CodexCheckpointResult = {
  status: "success" | "failed";
  card: CheckpointCard;
  command: string;
  message: string;
};

const checkpointStatusSchema = z.enum(["go", "check_again", "pause", "pivot"]);

const codexCheckpointSuggestionSchema = z.object({
  status: checkpointStatusSchema,
  why: z.string().min(1),
  route: z.string().min(1),
  scopeSignal: z.string().min(1),
  riskSignal: z.string().min(1),
  stopIf: z.array(z.string()).default([]),
  userDecision: z.string().min(1),
  notVerified: z.array(z.string()).default([]),
});

export async function runCodexCheckpointSynthesis(
  scan: RepoScan,
  task: string,
  gitState: GitCheckpointState,
  deterministicCard: CheckpointCard,
  options: { timeoutMs?: number } = {},
): Promise<CodexCheckpointResult> {
  const codexBin = process.env.LUMO_CODEX_BIN ?? "codex";
  const timeoutMs = options.timeoutMs ?? 90_000;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "lumo-codex-checkpoint-"));
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
      buildCodexCheckpointPrompt(scan, task, gitState, deterministicCard),
      scan.repoPath,
      timeoutMs,
    );

    if (result.timedOut) {
      throw new Error(`Codex checkpoint synthesis timed out after ${timeoutMs}ms.`);
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
      card: mergeCodexCheckpointSuggestion(deterministicCard, suggestion),
      command,
      message: "Codex interpreted the in-progress diff in read-only mode and Lumo applied the deterministic safety floor.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "failed",
      card: {
        ...deterministicCard,
        notVerified: [
          ...deterministicCard.notVerified,
          "Codex checkpoint synthesis failed; this card is deterministic-only.",
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

export function buildCodexCheckpointPrompt(
  scan: RepoScan,
  task: string,
  gitState: GitCheckpointState,
  deterministicCard: CheckpointCard,
): string {
  return [
    "You are Lumo's optional Codex checkpoint synthesis layer for in-progress AI coding-agent work.",
    "",
    "Goal:",
    "Interpret the current git change state against the original task and improve the steering card.",
    "",
    "Hard rules:",
    "- Read only. Do not edit, create, delete, move, format, install, start servers, or run write-like commands.",
    "- Do not include absolute local paths, secrets, env values, raw private data, or contact data.",
    "- Do not invent commands, tests, files, or runtime behavior as proof.",
    "- You may be more cautious than the deterministic card.",
    "- You must not weaken obvious safety gates around auth, billing, database, migrations, providers, env, deploy, deletion, or external side effects.",
    "- If the deterministic card says pivot because the diff is broad, do not lower it to go. You may explain whether splitting, explicit acceptance, or a smaller next checkpoint is better.",
    "- If evidence is missing, say UNCONFIRMED in notVerified.",
    "",
    "Return JSON only. No markdown, no code fence.",
    "",
    "JSON schema:",
    JSON.stringify(
      {
        status: "go | check_again | pause | pivot",
        why: "plain-language reason",
        route: "recommended next route for the coding agent",
        scopeSignal: "scope interpretation",
        riskSignal: "risk interpretation",
        stopIf: ["short stop condition"],
        userDecision: "smallest decision needed from the user",
        notVerified: ["short not-verified item"],
      },
      null,
      2,
    ),
    "",
    "Original user task:",
    task,
    "",
    "Deterministic checkpoint card:",
    JSON.stringify(deterministicCard, null, 2),
    "",
    "Git checkpoint state:",
    JSON.stringify(gitState, null, 2),
    "",
    "Deterministic repo scan:",
    JSON.stringify(redactScan(scan), null, 2),
  ].join("\n");
}

function parseCodexSuggestion(rawContent: string): CodexCheckpointSuggestion {
  const trimmed = rawContent.trim();
  const jsonText = extractJsonObject(trimmed);
  const parsed = JSON.parse(jsonText) as unknown;
  return codexCheckpointSuggestionSchema.parse(parsed);
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
