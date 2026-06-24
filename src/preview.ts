import type { PreviewPack, RepoScan } from "./schemas.js";

export function generatePreviewPack(scan: RepoScan): PreviewPack {
  return {
    repoPath: scan.repoPath,
    generatedAt: new Date().toISOString(),
    mode: "preview_only",
    files: [
      {
        path: "AGENTS.md.draft",
        purpose: "Codex repo contract preview",
        content: agentsDraft(scan),
      },
      {
        path: "CLAUDE.md.draft",
        purpose: "Claude Code repo adapter preview",
        content: claudeDraft(),
      },
      {
        path: "workflows/bugfix.md",
        purpose: "Small bugfix workflow preview",
        content: workflowDraft(
          "Bugfix",
          "Reproduce or locate the failing behavior, make the smallest fix, then run the narrowest proof command.",
          "Prefer one failing case or fixture before changing implementation.",
        ),
      },
      {
        path: "workflows/feature.md",
        purpose: "Small feature workflow preview",
        content: workflowDraft(
          "Feature",
          "Define the smallest user-visible slice, touch only the needed files, then verify the expected behavior.",
          "For TypeScript/Next.js work, prefer local state, local route logic, and existing component/API patterns before adding persistence, providers, or new dependencies.",
        ),
      },
      {
        path: "workflows/review.md",
        purpose: "Code review workflow preview",
        content: workflowDraft(
          "Review",
          "Find correctness, safety, privacy, and missing-test risks before summarizing style or cleanup.",
          "Review whether the diff stayed inside the intended slice and avoided risky seams.",
        ),
      },
    ],
  };
}

function agentsDraft(scan: RepoScan): string {
  const commands = scan.commands
    .filter((command) => ["lint", "typecheck", "test", "build"].includes(command.category))
    .map((command) => `- ${command.name}: \`${formatVerificationCommand(scan, command.name)}\``);

  return [
    "# AGENTS.md Draft",
    "",
    "Purpose: make this repo safe and easy to work on with coding agents.",
    "",
    "## Project Map",
    "",
    `- Stack: ${stackSummary(scan)}`,
    `- Package manager: ${scan.stack.packageManager ?? "UNCONFIRMED"}`,
    "",
    "## Default Workflow",
    "",
    "- Inspect the relevant files before editing.",
    "- Name the intended first slice before broad implementation.",
    "- Keep changes in the smallest reviewable slice.",
    "- Reuse existing route, component, validation, error, and test patterns.",
    "- Do not include generated build output such as `dist/`, `.next/`, `build/`, or coverage files in the review surface unless explicitly requested.",
    "- Run the narrowest useful verification command before claiming ready.",
    "- After verification, check the review surface with `git status --short` and keep generated output out of the final diff.",
    "- Mark anything unproven as `UNCONFIRMED`.",
    "",
    ...typescriptNextDefaults(scan),
    "## Final Response Contract",
    "",
    "- List changed files.",
    "- List verification commands run and their result.",
    "- List not-verified items separately.",
    "- Do not claim production readiness when provider, auth, persistence, or external workflows were not exercised.",
    "",
    "## Verification Commands",
    "",
    ...(commands.length > 0 ? commands : ["- UNCONFIRMED: add repo-specific commands here."]),
    "",
    "## Review Gates",
    "",
    "- Pause before secrets, auth, privacy, provider I/O, database changes, billing, deploys, or external side effects.",
    "- Do not read or persist `.env` values.",
    "- Do not write to production systems without explicit human approval.",
    "",
  ].join("\n");
}

function claudeDraft(): string {
  return [
    "# CLAUDE.md Draft",
    "",
    "Follow `AGENTS.md` as the source of truth for repo-local rules.",
    "",
    "Keep the same first-slice, verification, no-go seam, and final-response contract.",
    "",
    "Use the same review gates for secrets, provider I/O, database changes, external side effects, and production behavior.",
    "",
  ].join("\n");
}

function workflowDraft(title: string, goal: string, extraRule: string): string {
  return [
    `# ${title} Workflow`,
    "",
    `Goal: ${goal}`,
    "",
    `Default: ${extraRule}`,
    "",
    "## Steps",
    "",
    "1. Name the intended change and files likely touched.",
    "2. Inspect the direct caller, route, component, test, or fixture before editing.",
    "3. Make the smallest useful change in the repo's existing style.",
    "4. Run the narrowest useful verification without adding generated build output to the review surface.",
    "5. Check `git status --short` and remove generated output from the review surface unless explicitly requested.",
    "6. Report changed files, verification, and what remains unverified.",
    "",
    "## Stop Conditions",
    "",
    "- Scope expands beyond the requested slice.",
    "- Secrets, auth, privacy, provider I/O, migrations, deploys, or external side effects appear.",
    "- Verification fails twice without a new hypothesis.",
    "",
  ].join("\n");
}

function typescriptNextDefaults(scan: RepoScan): string[] {
  if (!scan.stack.hasTypeScript && !scan.stack.hasNext && !scan.stack.hasReact) {
    return [];
  }

  const lines = [
    "## TypeScript/Next.js Defaults",
    "",
    "- Prefer typed boundaries over broad `any` escape hatches.",
    "- Keep UI changes inside existing component and styling patterns.",
    "- Apply ICE for slice choice: prefer the smallest high-impact, high-confidence, low-effort step before broad rewrites.",
  ];

  if (scan.stack.hasNext) {
    lines.push(
      "- For routes and server actions, reuse existing response shapes and validation style.",
      "- Keep first-slice state local unless persistence is explicitly requested.",
      "- Do not convert a Server Component to a Client Component in the first slice unless the requested behavior requires browser state, event handlers, or browser APIs.",
      "- If UI interaction would add local state, submit state, loading/error UI, or browser-to-route `fetch`, call that out as a broader interaction slice unless the task explicitly asks for a working submit flow.",
      "- For ambiguous dashboard actions, start with the smallest visible affordance that matches existing UI patterns, then prove server/API behavior separately with a local fixture or example.",
      "",
      "## TypeScript/Next.js Quality Bar",
      "",
      "- Keep server, client, data-access, and provider responsibilities separated. Do not mix UI rendering, validation, persistence, and external calls in one file when a small boundary would keep the slice clearer.",
      "- Prefer small pure functions for business rules; keep React components focused on rendering and interaction.",
      "- Use dependency injection at risky boundaries: pass clients, adapters, or small interfaces into logic instead of instantiating database, provider, email, billing, or analytics clients inside pure code.",
      "- Follow an existing repository/service pattern when the repo has one. If persistence is newly required, put data access behind the repo's existing data layer or a small `repositories`/`services` seam; do not introduce a repository layer for a local-only first slice.",
      "- Apply SOLID pragmatically: single responsibility first, explicit dependencies second, abstractions only when they remove real duplication or isolate risky I/O.",
      "- Apply DRY after the second real duplication. Do not create a generic abstraction just to avoid two clear lines of code.",
      "- Prefer colocated tests or fixtures for the changed behavior. Add or update the narrowest test that proves the slice before broad snapshot or end-to-end work.",
      "- Treat `production-ready` as typed, validated, verified, and honest about unverified side effects; do not treat it as permission to build every workflow surface in v1.",
      "- Review success by behavior shape: fewer unrelated files, no unnecessary client conversion, clearer boundaries, explicit tests or fixtures, and no hidden provider/database side effects.",
    );
  }

  if (scan.stack.hasOpenAI) {
    lines.push(
      "- Treat AI/provider calls as gated: use deterministic local behavior or fixtures unless live provider I/O is explicitly requested.",
    );
  }

  lines.push("");
  return lines;
}

function formatVerificationCommand(scan: RepoScan, scriptName: string): string {
  if (!scan.stack.hasPackageJson) {
    return scriptName;
  }

  const packageManager = scan.stack.packageManager ?? "npm";

  if (packageManager === "pnpm") return `pnpm ${scriptName}`;
  if (packageManager === "yarn") return `yarn ${scriptName}`;
  if (packageManager === "bun") return `bun run ${scriptName}`;

  return `npm run ${scriptName}`;
}

function stackSummary(scan: RepoScan): string {
  const parts = [
    scan.stack.hasTypeScript ? "TypeScript" : null,
    scan.stack.hasNext ? "Next.js" : null,
    scan.stack.hasVite ? "Vite" : null,
    scan.stack.hasReact ? "React" : null,
    scan.stack.hasOpenAI ? "OpenAI" : null,
    scan.stack.hasSupabase ? "Supabase" : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "UNCONFIRMED";
}
