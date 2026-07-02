#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { runCodexCheckpointSynthesis } from "./checkpoint-codex.js";
import { createCheckpointCard, readGitCheckpointState, renderCheckpointCard } from "./checkpoint.js";
import { runCodexSynthesis } from "./codex-synthesis.js";
import { renderDoctorReport, runDoctor } from "./doctor.js";
import { readHarnessMapState, createHarnessMapCard, renderHarnessMapCard } from "./harness-map.js";
import { renderHtmlReadinessReport } from "./html-report.js";
import { renderInitResult, runInit } from "./init.js";
import { createLearnCard, renderLearnCard } from "./learn.js";
import { runCodexPreflightSynthesis } from "./preflight-codex.js";
import { createPreflightCard, renderPreflightCard } from "./preflight.js";
import { createPrStatusCard, readPrStatusFromGh, renderPrStatusCard } from "./pr-status.js";
import { generatePreviewPack } from "./preview.js";
import { renderReadinessReport } from "./reporter.js";
import { runCodexReviewSynthesis } from "./review-codex.js";
import { createReviewCard, readGitReviewState, renderReviewCard } from "./review.js";
import { createRouteCard, readHarnessMapContext, renderRouteCard } from "./route.js";
import { scanRepository } from "./scanner.js";
import { createThreadCheckpointCard, renderThreadCheckpointCard } from "./thread-checkpoint.js";

type Command =
  | "doctor"
  | "scan"
  | "analyze"
  | "preview"
  | "init"
  | "preflight"
  | "checkpoint"
  | "review"
  | "thread-checkpoint"
  | "pr-status"
  | "harness-map"
  | "route"
  | "learn"
  | "agent"
  | "help";

async function main(): Promise<void> {
  const command = parseCommand(process.argv[2]);
  const repoPath = path.resolve(getFlagValue("--path") ?? process.cwd());
  const format = hasFlag("--html") ? "html" : (getFlagValue("--format") ?? "markdown");
  const outputPath = getFlagValue("--output");
  const dryRun = hasFlag("--dry-run");
  const withCodex = hasFlag("--with-codex");
  const write = hasFlag("--write");
  const task = getFlagValue("--task");
  const inputPath = getFlagValue("--input");
  const repo = getFlagValue("--repo");
  const pr = parseOptionalIntegerFlag("--pr");
  const codexTimeoutMs = parseOptionalIntegerFlag("--codex-timeout-ms");
  const codexHome = getFlagValue("--codex-home");
  const agentsHome = getFlagValue("--agents-home");
  const noScan = hasFlag("--no-scan");
  const mapPath = getFlagValue("--map");

  if (command === "help") {
    printHelp();
    return;
  }

  if (command === "scan" || command === "analyze") {
    const scan = await scanRepository({ repoPath });
    if (withCodex) {
      console.error("Running optional Codex synthesis in read-only sandbox...");
    }
    const codexSynthesis = withCodex ? await runCodexSynthesis(scan, { timeoutMs: codexTimeoutMs ?? undefined }) : undefined;
    if (format === "json") {
      console.log(JSON.stringify(codexSynthesis ? { scan, codexSynthesis } : scan, null, 2));
      return;
    }
    if (format === "html") {
      await emitOutput(renderHtmlReadinessReport(scan, codexSynthesis), outputPath);
      return;
    }
    console.log(renderReadinessReport(scan));
    if (codexSynthesis) {
      console.log("## Codex Synthesis");
      console.log("");
      console.log(codexSynthesis.content.trim());
      console.log("");
    }
    return;
  }

  if (command === "doctor") {
    const scan = await scanRepository({ repoPath });
    const report = await runDoctor(scan, {
      withCodex,
      timeoutMs: codexTimeoutMs ?? undefined,
    });
    console.log(renderDoctorReport(report));
    return;
  }

  if (command === "preview") {
    const scan = await scanRepository({ repoPath });
    const preview = generatePreviewPack(scan);

    if (format === "json") {
      console.log(JSON.stringify(preview, null, 2));
      return;
    }

    console.log(renderPreviewPack(preview));
    return;
  }

  if (command === "init") {
    const scan = await scanRepository({ repoPath });
    const preview = generatePreviewPack(scan);
    const result = await runInit(preview, { write });

    if (format === "json") {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(renderInitResult(result, preview));
    return;
  }

  if (command === "preflight") {
    if (!task || task.trim().length === 0) {
      console.error("--task is required for preflight.");
      process.exitCode = 2;
      return;
    }

    const scan = await scanRepository({ repoPath });
    const deterministicCard = createPreflightCard(scan, task);
    if (withCodex) {
      console.error("Running optional Codex preflight synthesis in read-only sandbox...");
    }
    const codexPreflight = withCodex
      ? await runCodexPreflightSynthesis(scan, task, deterministicCard, {
          timeoutMs: codexTimeoutMs ?? undefined,
        })
      : undefined;
    const card = codexPreflight?.card ?? deterministicCard;

    if (format === "json") {
      console.log(JSON.stringify({ repoPath: scan.repoPath, task, preflight: card, codexPreflight }, null, 2));
      return;
    }

    console.log(renderPreflightCard(card, { repoPath: scan.repoPath, task }));
    if (codexPreflight) {
      console.log("## Codex Preflight");
      console.log("");
      console.log(`${codexPreflight.status}: ${codexPreflight.message}`);
      console.log("");
    }
    return;
  }

  if (command === "checkpoint") {
    if (!task || task.trim().length === 0) {
      console.error("--task is required for checkpoint.");
      process.exitCode = 2;
      return;
    }

    const scan = await scanRepository({ repoPath });
    const gitState = await readGitCheckpointState(repoPath);
    const deterministicCard = createCheckpointCard(scan, task, gitState);
    if (withCodex) {
      console.error("Running optional Codex checkpoint synthesis in read-only sandbox...");
    }
    const codexCheckpoint = withCodex
      ? await runCodexCheckpointSynthesis(scan, task, gitState, deterministicCard, {
          timeoutMs: codexTimeoutMs ?? undefined,
        })
      : undefined;
    const card = codexCheckpoint?.card ?? deterministicCard;

    if (format === "json") {
      console.log(JSON.stringify({ repoPath: scan.repoPath, task, checkpoint: card, gitState, codexCheckpoint }, null, 2));
      return;
    }

    console.log(renderCheckpointCard(card, { repoPath: scan.repoPath, task }));
    if (codexCheckpoint) {
      console.log("## Codex Checkpoint");
      console.log("");
      console.log(`${codexCheckpoint.status}: ${codexCheckpoint.message}`);
      console.log("");
    }
    return;
  }

  if (command === "review") {
    if (!task || task.trim().length === 0) {
      console.error("--task is required for review.");
      process.exitCode = 2;
      return;
    }

    const scan = await scanRepository({ repoPath });
    const gitState = await readGitReviewState(repoPath);
    const deterministicCard = createReviewCard(scan, task, gitState);
    if (withCodex) {
      console.error("Running optional Codex review synthesis in read-only sandbox...");
    }
    const codexReview = withCodex
      ? await runCodexReviewSynthesis(scan, task, gitState, deterministicCard, {
          timeoutMs: codexTimeoutMs ?? undefined,
        })
      : undefined;
    const card = codexReview?.card ?? deterministicCard;

    if (format === "json") {
      console.log(JSON.stringify({ repoPath: scan.repoPath, task, review: card, gitState, codexReview }, null, 2));
      return;
    }

    console.log(renderReviewCard(card, { repoPath: scan.repoPath, task }));
    if (codexReview) {
      console.log("## Codex Review");
      console.log("");
      console.log(`${codexReview.status}: ${codexReview.message}`);
      console.log("");
    }
    return;
  }

  if (command === "thread-checkpoint") {
    const useStdin = hasFlag("--stdin") || inputPath === "-";

    if (!useStdin && (!inputPath || inputPath.trim().length === 0)) {
      console.error("--input or --stdin is required for thread-checkpoint.");
      process.exitCode = 2;
      return;
    }

    const resolvedInputPath = inputPath && inputPath !== "-" ? path.resolve(inputPath) : null;
    const inputLabel = useStdin ? "stdin" : resolvedInputPath ?? "inline content";
    const content = useStdin ? await readStdin() : await readFile(resolvedInputPath as string, "utf8");
    const card = createThreadCheckpointCard({ content, inputPath: inputLabel, task: task ?? undefined });

    if (format === "json") {
      console.log(JSON.stringify({ inputPath: resolvedInputPath, inputSource: useStdin ? "stdin" : "file", task, threadCheckpoint: card }, null, 2));
      return;
    }

    console.log(renderThreadCheckpointCard(card, { inputPath: inputLabel, task: task ?? undefined }));
    return;
  }

  if (command === "harness-map") {
    const scan = await scanRepository({ repoPath });
    const state = await readHarnessMapState({ repoPath: scan.repoPath, codexHome, agentsHome });
    const card = createHarnessMapCard(scan, state);

    if (format === "json") {
      console.log(JSON.stringify({ repoPath: scan.repoPath, harnessMap: card }, null, 2));
      return;
    }

    console.log(renderHarnessMapCard(card, { repoPath: scan.repoPath }));
    return;
  }

  if (command === "route") {
    if (!task || task.trim().length === 0) {
      console.error("--task is required for route.");
      process.exitCode = 2;
      return;
    }

    const scan = noScan ? undefined : await scanRepository({ repoPath });
    const harnessMap = mapPath ? await readHarnessMapContext(path.resolve(mapPath)) : undefined;
    const card = createRouteCard({ task, scan, harnessMap });
    const resolvedRepoPath = scan?.repoPath ?? (noScan ? null : repoPath);

    if (format === "json") {
      console.log(JSON.stringify({ repoPath: resolvedRepoPath, task, route: card }, null, 2));
      return;
    }

    console.log(renderRouteCard(card, { repoPath: resolvedRepoPath ?? undefined, task }));
    return;
  }

  if (command === "learn") {
    const useStdin = hasFlag("--stdin") || inputPath === "-";

    if (!useStdin && (!inputPath || inputPath.trim().length === 0)) {
      console.error("--input or --stdin is required for learn.");
      process.exitCode = 2;
      return;
    }

    const resolvedInputPath = inputPath && inputPath !== "-" ? path.resolve(inputPath) : null;
    const content = useStdin ? await readStdin() : await readFile(resolvedInputPath as string, "utf8");
    if (content.trim().length === 0) {
      console.error("Learn input must be a non-empty packet.");
      process.exitCode = 1;
      return;
    }

    const scan = hasFlag("--path") ? await scanRepository({ repoPath }) : undefined;
    const card = createLearnCard({ content, task: task ?? undefined, scan, inputPath: resolvedInputPath ?? undefined });

    if (format === "json") {
      console.log(JSON.stringify({ inputPath: resolvedInputPath, inputSource: useStdin ? "stdin" : "file", task: task ?? null, learn: card }, null, 2));
      return;
    }

    console.log(renderLearnCard(card, { inputPath: resolvedInputPath ?? undefined, inputSource: useStdin ? "stdin" : "file", task: task ?? undefined }));
    return;
  }

  if (command === "pr-status") {
    if (!repo || repo.trim().length === 0) {
      console.error("--repo is required for pr-status and must look like owner/name.");
      process.exitCode = 2;
      return;
    }
    if (!pr) {
      console.error("--pr is required for pr-status and must be a positive integer.");
      process.exitCode = 2;
      return;
    }

    const input = await readPrStatusFromGh({ repo, pr });
    const card = createPrStatusCard(input);

    if (format === "json") {
      console.log(JSON.stringify({ repo: input.repo, pr, prStatus: card }, null, 2));
      return;
    }

    console.log(renderPrStatusCard(card));
    return;
  }

  if (command === "agent") {
    if (dryRun) {
      const scan = await scanRepository({ repoPath });
      const preview = generatePreviewPack(scan);
      console.log(renderReadinessReport(scan));
      console.log("## Preview Files");
      console.log("");
      for (const file of preview.files) {
        console.log(`- ${file.path}: ${file.purpose}`);
      }
      console.log("");
      console.log("Dry run complete. No OpenAI API call was made and no files were written.");
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is required for a live Agents SDK run. Use --dry-run for deterministic local output.");
      process.exitCode = 2;
      return;
    }

    const { runLumoHarnessAgent } = await import("./agent/agent.js");
    console.log(await runLumoHarnessAgent(repoPath));
  }
}

function parseCommand(rawCommand: string | undefined): Command {
  if (!rawCommand || rawCommand === "help" || rawCommand === "--help" || rawCommand === "-h") {
    return "help";
  }

  if (
    rawCommand === "doctor" ||
    rawCommand === "scan" ||
    rawCommand === "analyze" ||
    rawCommand === "preview" ||
    rawCommand === "init" ||
    rawCommand === "preflight" ||
    rawCommand === "checkpoint" ||
    rawCommand === "review" ||
    rawCommand === "thread-checkpoint" ||
    rawCommand === "pr-status" ||
    rawCommand === "harness-map" ||
    rawCommand === "route" ||
    rawCommand === "learn" ||
    rawCommand === "agent"
  ) {
    return rawCommand;
  }

  throw new Error(`Unknown command: ${rawCommand}`);
}

function getFlagValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function parseOptionalIntegerFlag(name: string): number | null {
  const value = getFlagValue(name);
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

async function emitOutput(content: string, outputPath: string | null): Promise<void> {
  if (!outputPath) {
    console.log(content);
    return;
  }

  const resolvedPath = path.resolve(outputPath);
  await mkdir(path.dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, content, "utf8");
  console.log(`Wrote ${resolvedPath}`);
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let content = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk: string) => {
      content += chunk;
    });
    process.stdin.on("error", reject);
    process.stdin.on("end", () => {
      resolve(content);
    });
  });
}

function printHelp(): void {
  console.log(`Lumo Harness

Usage:
  lumo-harness doctor --path <repo> [--with-codex] [--codex-timeout-ms 30000]
  lumo-harness scan --path <repo> [--format markdown|json|html] [--output report.html] [--with-codex]
  lumo-harness analyze --path <repo> [--html] [--output report.html] [--with-codex] [--codex-timeout-ms 90000]
  lumo-harness preview --path <repo> [--format markdown|json]
  lumo-harness init --path <repo> [--dry-run|--write] [--format markdown|json]
  lumo-harness preflight --path <repo> --task "..." [--with-codex] [--format markdown|json]
  lumo-harness checkpoint --path <repo> --task "..." [--with-codex] [--format markdown|json]
  lumo-harness review --path <repo> --task "..." [--with-codex] [--format markdown|json]
  lumo-harness thread-checkpoint --input <packet.md|-> [--task "..."] [--format markdown|json]
  cat packet.md | lumo-harness thread-checkpoint --stdin [--task "..."] [--format markdown|json]
  lumo-harness pr-status --repo <owner/name> --pr <number> [--format markdown|json]
  lumo-harness harness-map --path <repo> [--codex-home <dir>] [--agents-home <dir>] [--format markdown|json]
  lumo-harness route --task "..." [--path <repo>] [--no-scan] [--map <harness-map-json>] [--format markdown|json]
  lumo-harness learn --input <packet.md|-> [--task "..."] [--path <repo>] [--format markdown|json]
  cat packet.md | lumo-harness learn --stdin [--task "..."] [--path <repo>] [--format markdown|json]
  lumo-harness agent --path <repo> --dry-run
  lumo-harness agent --path <repo>

Notes:
  doctor, scan, analyze, preview, init, and agent --dry-run do not require OPENAI_API_KEY.
  analyze is an alias for scan with a report-oriented name.
  --with-codex adds optional local Codex CLI synthesis in read-only sandbox.
  --codex-timeout-ms controls the optional Codex synthesis timeout. Default: 90000.
  init previews proposed harness files by default. Use --write only after review.
  preview prints draft harness files but does not write them.
  preflight prints a read-only decision card for the first coding-agent slice.
  checkpoint prints a read-only steering card for in-progress git changes.
  review prints a read-only completion card for deciding whether work can be claimed done.
  thread-checkpoint prints a read-only steering card for long-running agent-thread evidence packets.
  thread-checkpoint accepts --input <file>, --input -, or --stdin.
  pr-status reads GitHub PR metadata through gh and prints a merge/readiness steering card.
  harness-map prints a read-only metadata map of repo rails plus optional explicit Codex/Agents homes.
  route classifies a request into the smallest useful operating mode and recommended first Lumo tool.
  learn proposes exactly one small harness improvement from a redacted friction packet; it never writes changes.
  agent without --dry-run uses the OpenAI Agents SDK and requires OPENAI_API_KEY.
  Slice 1 writes only when init is called with --write and refuses to overwrite existing files.
`);
}

function renderPreviewPack(preview: ReturnType<typeof generatePreviewPack>): string {
  return [
    "# Lumo Harness Preview",
    "",
    `Repo: ${preview.repoPath}`,
    `Generated: ${preview.generatedAt}`,
    `Mode: ${preview.mode}`,
    "",
    "No files were written to the target repo.",
    "",
    ...preview.files.flatMap((file) => [
      `## ${file.path}`,
      "",
      `Purpose: ${file.purpose}`,
      "",
      fenced(file.content.trim()),
      "",
    ]),
  ].join("\n");
}

function fenced(content: string): string {
  return ["```md", content, "```"].join("\n");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
