#!/usr/bin/env node

import path from "node:path";
import { generatePreviewPack } from "./preview.js";
import { renderReadinessReport } from "./reporter.js";
import { scanRepository } from "./scanner.js";

type Command = "scan" | "preview" | "agent" | "help";

async function main(): Promise<void> {
  const command = parseCommand(process.argv[2]);
  const repoPath = path.resolve(getFlagValue("--path") ?? process.cwd());
  const format = getFlagValue("--format") ?? "markdown";
  const dryRun = hasFlag("--dry-run");

  if (command === "help") {
    printHelp();
    return;
  }

  if (command === "scan") {
    const scan = await scanRepository({ repoPath });
    if (format === "json") {
      console.log(JSON.stringify(scan, null, 2));
      return;
    }
    console.log(renderReadinessReport(scan));
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

  if (rawCommand === "scan" || rawCommand === "preview" || rawCommand === "agent") {
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

function printHelp(): void {
  console.log(`Lumo Harness

Usage:
  lumo-harness scan --path <repo> [--format markdown|json]
  lumo-harness preview --path <repo> [--format markdown|json]
  lumo-harness agent --path <repo> --dry-run
  lumo-harness agent --path <repo>

Notes:
  scan, preview, and agent --dry-run are deterministic and do not require OPENAI_API_KEY.
  preview prints draft harness files but does not write them.
  agent without --dry-run uses the OpenAI Agents SDK and requires OPENAI_API_KEY.
  Slice 1 never writes files to the target repo.
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
