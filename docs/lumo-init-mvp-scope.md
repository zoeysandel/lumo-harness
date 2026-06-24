# Lumo Init MVP Scope

Status: product decision for the next build slice.

Lumo should be easy to understand:

```txt
Add clean AI-coding defaults to your TypeScript/Next.js repo.
```

The user should not need to understand harness engineering. They should feel:

```txt
I can use Codex or Claude Code without my Next.js repo becoming a mess.
```

## Target User

Vibe coders and small builders who use Codex or Claude Code to build Next.js
apps, but want cleaner code, smaller diffs, clearer tests, and fewer hidden
side effects.

## MVP Promise

```txt
lumo init gives a Next.js repo a small agent operating contract in under a minute.
```

Do not promise:

```txt
Lumo guarantees better code.
Lumo makes AI coding safe.
Lumo supports every integration.
Lumo replaces human review.
```

## Generated Files

MVP should generate three markdown files:

| File | Owns |
| --- | --- |
| `AGENTS.md` | Active coding-agent contract: Next.js defaults, small-slice workflow, quality bar, stop conditions, final-answer shape |
| `.lumo/commands.md` | Detected package manager and proof commands: lint, typecheck, test, build, plus missing checks |
| `.lumo/risks.md` | Risk gates and uncertainty: auth, db, env, provider I/O, billing, deploy, external actions, not-verified areas |

Do not generate `CLAUDE.md` by default in the MVP. Add it later with an explicit
agent adapter option such as `--agent claude` or `--agent both`.

If `AGENTS.md` already exists, do not overwrite it. Write
`.lumo/AGENTS.md.draft` and tell the user to review and merge manually.

## Terminal Checkpoints

The terminal should explain progress in plain language:

```txt
Lumo found a TypeScript/Next.js repo.

Detected:
- package manager: pnpm
- checks: pnpm lint, pnpm typecheck, pnpm build
- existing AGENTS.md: no
- risky seams: env, auth-like files, API routes

Generated:
- AGENTS.md
- .lumo/commands.md
- .lumo/risks.md

Next:
1. Review the diff:
   git diff -- AGENTS.md .lumo/commands.md .lumo/risks.md

2. Start Codex or Claude Code with:
   Read AGENTS.md, .lumo/commands.md, and .lumo/risks.md.
   Make the smallest useful first slice.
   Do not touch auth, db, env, provider, deploy, or billing unless explicitly required.
   Run the listed proof command before claiming done.
```

## Next.js Rule Set

The generated `AGENTS.md` should include:

- use installed/project Next.js docs when available;
- App Router route files stay thin;
- Server Components by default;
- push `'use client'` to the smallest interactive leaf;
- fetch on the server unless there is a clear client reason;
- make caching and freshness explicit;
- use Server Actions for app mutations and Route Handlers for public HTTP;
- validate inputs at boundaries;
- keep secrets and provider clients server-only;
- use typed contracts and avoid broad `any`;
- keep UI, validation, data access, provider I/O, and business logic separated;
- use dependency injection at risky I/O boundaries;
- follow repository/service patterns when they exist, and only add them when
  persistence or data complexity justifies it;
- apply SOLID and DRY pragmatically, without broad architecture ceremony;
- run the repo's narrowest useful verification command before claiming done.

## Integrations In MVP

Do not scaffold or claim support for integrations in v1:

```txt
Supabase
Prisma / Drizzle
Clerk / Auth.js
Stripe
tRPC
Tailwind / shadcn
Vercel AI SDK / OpenAI
Sentry
Playwright / Vitest setup
```

If these appear in a repo, Lumo may mention them as risk gates or existing
verification commands. It should not install, initialize, configure, or market
first-class support for them yet.

## Anti-Scope

Not in MVP:

- TUI;
- SaaS;
- model calls;
- auto-PRs;
- package installs;
- integration scaffolding;
- session-history scan;
- HTML dashboard;
- eval card as the main product surface;
- broad workflow folders;
- claims that the repo is safe.

## Validation

The next useful validation is dogfooding:

```txt
Run Lumo before a real TypeScript/Next.js feature task.
Then compare whether Codex or Claude Code produced a smaller, clearer,
better-tested, better-bounded diff.
```

