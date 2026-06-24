#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runCodexSynthesis } from "./codex-synthesis.js";
import { renderDoctorReport, runDoctor } from "./doctor.js";
import { renderHtmlReadinessReport } from "./html-report.js";
import { renderInitResult, runInit } from "./init.js";
import { generatePreviewPack } from "./preview.js";
import { renderReadinessReport } from "./reporter.js";
import { scanRepository } from "./scanner.js";

type Command = "doctor" | "scan" | "analyze" | "preview" | "init" | "agent" | "help";

async function main(): Promise<void> {
  const command = parseCommand(process.argv[2]);
  const repoPath = path.resolve(getFlagValue("--path") ?? process.cwd());
  const format = hasFlag("--html") ? "html" : (getFlagValue("--format") ?? "markdown");
  const outputPath = getFlagValue("--output");
  const dryRun = hasFlag("--dry-run");
  const withCodex = hasFlag("--with-codex");
  const write = hasFlag("--write");
  const codexTimeoutMs = parseOptionalIntegerFlag("--codex-timeout-ms");

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

function printHelp(): void {
  console.log(`Lumo Harness

Usage:
  lumo-harness doctor --path <repo> [--with-codex] [--codex-timeout-ms 30000]
  lumo-harness scan --path <repo> [--format markdown|json|html] [--output report.html] [--with-codex]
  lumo-harness analyze --path <repo> [--html] [--output report.html] [--with-codex] [--codex-timeout-ms 90000]
  lumo-harness preview --path <repo> [--format markdown|json]
  lumo-harness init --path <repo> [--dry-run|--write] [--format markdown|json]
  lumo-harness agent --path <repo> --dry-run
  lumo-harness agent --path <repo>

Notes:
  doctor, scan, analyze, preview, init, and agent --dry-run do not require OPENAI_API_KEY.
  analyze is an alias for scan with a report-oriented name.
  --with-codex adds optional local Codex CLI synthesis in read-only sandbox.
  --codex-timeout-ms controls the optional Codex synthesis timeout. Default: 90000.
  init previews proposed harness files by default. Use --write only after review.
  preview prints draft harness files but does not write them.
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
