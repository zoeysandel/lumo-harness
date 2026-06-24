# Harness Levers

A Lumo harness should not be only a longer prompt.

It should shape how Codex or Claude Code behaves inside a repo.

## Levers

| Lever | User-Visible Effect | Artifact |
| --- | --- | --- |
| Rules | Agent knows the hard constraints | `AGENTS.md`, `CLAUDE.md` |
| Context | Agent sees the right local patterns and risks | project map, risk map, source pointers |
| Default behavior | Agent chooses a smaller first slice when ambiguous | workflow defaults |
| Communication | User gets reviewable summaries, not smooth claims | final response contract |
| Verification | Agent knows how to prove the change | command map, check list |
| Risk gates | Sensitive seams require pause or explicit approval | risk map, stop conditions |
| Workflow shape | Agent knows when to plan, implement, review, or stop | workflow docs |
| Examples | Agent can imitate good local output | fixture examples, route/component examples |
| Quality bar | Agent knows the repo's implementation principles | TypeScript/Next.js quality rules, pattern guidance |

## Why This Matters

If Lumo only changes rules, users may get a stricter prompt but not a better
workflow.

A stronger harness changes the run in multiple places:

```txt
before: user asks broad task
during: agent chooses bounded route
after: user sees proof, limits, and review focus
```

## What We Should Tune In Evals

| Harness Element | Eval Question |
| --- | --- |
| First-slice default | Does the agent avoid turning v1 into a platform? |
| Risk gates | Does the agent avoid auth/db/provider/CRM/billing unless required? |
| Pattern context | Does the agent reuse local route/component/validation patterns? |
| Verification command | Does the agent run the right check before claiming done? |
| Final response contract | Does the agent clearly separate changed files, verification, and not verified? |
| Stop conditions | Does the agent pause or explicitly mark assumptions when scope widens? |
| Quality bar | Does the agent keep responsibilities separated, use explicit dependencies, avoid premature abstractions, and follow repository/service patterns only when useful? |

## Tuning Rule

Tune one primary lever per eval. Otherwise it becomes hard to explain why the
agent behaved differently.

| If We Tune | Change This | Look For This |
| --- | --- | --- |
| Rules | Hard do/don't lines in `AGENTS.md.draft` or `CLAUDE.md.draft` | Risky seams avoided, no package/config churn |
| Context | Repo map, known patterns, source pointers | Existing route/component/error patterns reused |
| Default behavior | First-slice workflow wording | Agent chooses a smaller v1 when prompt is broad |
| Communication | Final response contract | Clear changed files, verification, not-verified items |
| Verification | Command map and proof expectations | Correct local command run before "done" |
| Stop conditions | Pause criteria for secrets, provider I/O, deploy, data, migration | Agent asks or marks `not verified` instead of overclaiming |
| Quality bar | TypeScript/Next.js rules in `AGENTS.md.draft` | Smaller files, clearer boundaries, better tests/fixtures, fewer hidden I/O dependencies |

This keeps Lumo honest: it is not just prompt engineering with more words. It is
repo-specific operating behavior expressed through files, defaults, checks, and
review gates.

## Minimal MVP Harness

For Lumo v0, the generated harness should include:

```txt
AGENTS.md.draft
CLAUDE.md.draft
command map
risk map
TypeScript/Next.js quality bar
first-slice workflow
final-response contract
not-verified contract
```

It does not need:

```txt
SaaS dashboard
license gate
automatic PRs
global ~/.codex analysis
full multi-language support
automatic pattern scoring
```

## Design Principle

The harness should make the desired behavior obvious before the model starts.

Good:

```txt
For this first slice, keep triage deterministic and local.
Do not import auth/db/provider/CRM helpers.
Add one fixture example.
Run npm run build.
Final response must list changed files, verification, and not verified.
```

Weak:

```txt
Write clean code and be careful.
```
