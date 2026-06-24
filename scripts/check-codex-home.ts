import { checkCodexHome, renderCodexHomePreflight } from "../src/codex-home-preflight.js";

async function main(): Promise<void> {
  const codexHome = getFlagValue("--codex-home");
  const caseName = getFlagValue("--case") ?? "nextjs-dashboard-action-risk";
  const requireNoGlobalAgents = process.argv.includes("--require-no-global-agents");

  if (!codexHome) {
    throw new Error("Usage: npm run eval:codex-home -- --codex-home <path> [--case <case>] [--require-no-global-agents]");
  }

  const report = await checkCodexHome({
    codexHome,
    caseName,
    requireNoGlobalAgents,
  });

  console.log(renderCodexHomePreflight(report));

  if (!report.ready) {
    process.exitCode = 1;
  }
}

function getFlagValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
