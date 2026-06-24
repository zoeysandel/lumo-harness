import { z } from "zod";

export const readinessSchema = z.enum([
  "not_ready",
  "partial",
  "agent_ready_with_gaps",
  "strong_existing_harness",
]);

export type Readiness = z.infer<typeof readinessSchema>;

export const commandCategorySchema = z.enum([
  "dev",
  "build",
  "lint",
  "typecheck",
  "test",
  "fixture",
  "eval",
  "other",
]);

export type CommandCategory = z.infer<typeof commandCategorySchema>;

export const repoCommandSchema = z.object({
  name: z.string(),
  command: z.string(),
  category: commandCategorySchema,
});

export type RepoCommand = z.infer<typeof repoCommandSchema>;

export const stackSignalsSchema = z.object({
  packageManager: z.string().nullable(),
  hasPackageJson: z.boolean(),
  hasTypeScript: z.boolean(),
  hasNext: z.boolean(),
  hasVite: z.boolean(),
  hasReact: z.boolean(),
  hasZod: z.boolean(),
  hasOpenAI: z.boolean(),
  hasVercelAi: z.boolean(),
  hasSupabase: z.boolean(),
});

export type StackSignals = z.infer<typeof stackSignalsSchema>;

export const harnessSignalsSchema = z.object({
  agentRuleFiles: z.array(z.string()),
  workflowFiles: z.array(z.string()),
  docsFiles: z.array(z.string()),
  promptFiles: z.array(z.string()),
  schemaFiles: z.array(z.string()),
  fixtureFiles: z.array(z.string()),
  evalFiles: z.array(z.string()),
  providerFiles: z.array(z.string()),
});

export type HarnessSignals = z.infer<typeof harnessSignalsSchema>;

export const riskSignalsSchema = z.object({
  hasExternalProviderCode: z.boolean(),
  hasDatabaseOrMigrationCode: z.boolean(),
  hasAuthCode: z.boolean(),
  hasEnvAccess: z.boolean(),
  hasApiRoutes: z.boolean(),
});

export type RiskSignals = z.infer<typeof riskSignalsSchema>;

export const missingRailSchema = z.object({
  title: z.string(),
  whyItMatters: z.string(),
  suggestedFile: z.string(),
  priority: z.number().int().min(1).max(3),
});

export type MissingRail = z.infer<typeof missingRailSchema>;

export const repoScanSchema = z.object({
  repoPath: z.string(),
  scannedAt: z.string(),
  fileCount: z.number().int().nonnegative(),
  readiness: readinessSchema,
  readinessReason: z.string(),
  stack: stackSignalsSchema,
  commands: z.array(repoCommandSchema),
  harness: harnessSignalsSchema,
  risks: riskSignalsSchema,
  currentRails: z.array(z.string()),
  missingRails: z.array(missingRailSchema).max(3),
  recommendedFirstHarness: z.string(),
  notVerified: z.array(z.string()),
});

export type RepoScan = z.infer<typeof repoScanSchema>;

export const previewFileSchema = z.object({
  path: z.string(),
  purpose: z.string(),
  content: z.string(),
});

export type PreviewFile = z.infer<typeof previewFileSchema>;

export const previewPackSchema = z.object({
  repoPath: z.string(),
  generatedAt: z.string(),
  mode: z.literal("preview_only"),
  files: z.array(previewFileSchema),
});

export type PreviewPack = z.infer<typeof previewPackSchema>;
