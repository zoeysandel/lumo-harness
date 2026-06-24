import { tool } from "@openai/agents";
import { z } from "zod";
import { generatePreviewPack } from "../preview.js";
import { renderReadinessReport } from "../reporter.js";
import { scanRepository } from "../scanner.js";

const repoPathParameter = z.object({
  repoPath: z.string().describe("Absolute or relative local path to the TypeScript repo to scan."),
});

export const scanTypescriptRepoTool = tool({
  name: "scan_typescript_repo",
  description: "Read-only deterministic scan of a local TypeScript repo for coding-agent readiness signals.",
  parameters: repoPathParameter,
  async execute({ repoPath }) {
    return scanRepository({ repoPath });
  },
});

export const renderReadinessReportTool = tool({
  name: "render_readiness_report",
  description: "Render a concise Markdown readiness report from a fresh deterministic repo scan.",
  parameters: repoPathParameter,
  async execute({ repoPath }) {
    const scan = await scanRepository({ repoPath });
    return renderReadinessReport(scan);
  },
});

export const previewHarnessPackTool = tool({
  name: "preview_harness_pack",
  description: "Generate preview-only harness draft files. This never writes to the target repo.",
  parameters: repoPathParameter,
  async execute({ repoPath }) {
    const scan = await scanRepository({ repoPath });
    return generatePreviewPack(scan);
  },
});
