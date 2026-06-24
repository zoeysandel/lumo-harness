# Lumo MVP Use Case

Lumo should master one use case before expanding.

## The Use Case

```txt
I have a TypeScript/Next.js app.
I work with Codex or Claude Code.
I want my coding agent to understand this repo, keep changes small,
follow local patterns, avoid risky seams, and prove what it changed.
Run: lumo init
```

## Target User

| Question | MVP Answer |
| --- | --- |
| Who | Vibe coder, indie builder, or small team using Codex or Claude Code |
| Repo | TypeScript first, especially Next.js apps |
| Moment | Starting a new repo, or improving an existing repo that is getting messy |
| Pain | The agent overbuilds, ignores patterns, touches risky helpers, or claims done too quickly |
| Desired feeling | More control, calmer review, fewer surprise changes |

## What Lumo Generates First

| Artifact | Purpose |
| --- | --- |
| `AGENTS.md.draft` | Repo-local Codex contract: purpose, commands, scope, no-go seams, final answer shape |
| `CLAUDE.md.draft` | Claude Code adapter that points at the same repo truth |
| `workflows/feature.md` | Small feature workflow: context, slice, verify, report |
| `workflows/review.md` | Review workflow for risky or larger diffs |
| `workflows/bugfix.md` | Narrow fix workflow with reproduction and verification |
| Eval prompt | A realistic baseline-vs-Lumo task for the repo |
| Proof card | A readable comparison of what changed with and without Lumo |

## What Should Be Noticeably Better

| User-visible difference | What to look for |
| --- | --- |
| Smaller first slice | Fewer unrelated files, no broad platform structure |
| Better repo fit | Reuses local component, route, validation, and command patterns |
| Safer risk behavior | Avoids auth, db, provider I/O, CRM, billing, env, deploy, and external side effects unless explicitly approved |
| Better verification | Runs or names the repo's available proof command |
| Better final answer | Lists changed files, verification, and what was not verified |
| Calmer default behavior | Chooses a bounded v1 instead of "production-ready" overreach |

## MVP Non-Goals

- Not a universal harness generator yet.
- Not Laravel, Symfony, Spring Boot, FastAPI, or mobile yet.
- Not a SaaS yet.
- Not automatic repo writes by default.
- Not a guarantee that AI coding is safe.
- Not a replacement for tests or human review.

## Expansion Rule

Only add a new stack or use case after the TypeScript/Next.js Codex comparison
loop is easy to understand, reproducible by one tester, and useful enough that
someone would run it before a real coding-agent task.
