import { Agent, run } from "@openai/agents";
import { LUMO_HARNESS_AGENT_PROMPT } from "./prompts.js";
import {
  previewHarnessPackTool,
  renderReadinessReportTool,
  scanTypescriptRepoTool,
} from "./tools.js";

export const lumoHarnessAgent = new Agent({
  name: "Lumo Harness Agent",
  instructions: LUMO_HARNESS_AGENT_PROMPT,
  tools: [scanTypescriptRepoTool, renderReadinessReportTool, previewHarnessPackTool],
});

export async function runLumoHarnessAgent(repoPath: string): Promise<string> {
  const result = await run(
    lumoHarnessAgent,
    [
      "Scan this repo for coding-agent readiness.",
      `Repo path: ${repoPath}`,
      "Return a compact recommendation and do not claim any files were written.",
    ].join("\n"),
  );

  return String(result.finalOutput ?? "");
}
