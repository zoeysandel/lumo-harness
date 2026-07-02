# First Tester Proof Brief

Use this when asking one builder to try Lumo Harness for the first time.
For a sendable-but-not-yet-sent message, use
[first-tester-invite-draft.md](first-tester-invite-draft.md).
For the shortest tester entrypoint, start with
[private-tester-2-minute-brief.md](private-tester-2-minute-brief.md).
For the current v0 entrypoint, start with
[lumo-v0-test-brief.md](lumo-v0-test-brief.md).

This is not a launch page. It is a short test brief for people who already use
Codex or Claude Code and want to see whether repo-level rails make agent work
easier to review.

For a shorter live explanation, use [demo-walkthrough.md](demo-walkthrough.md).
For a redacted steering-card example, use
[examples/redacted-steering-card.md](examples/redacted-steering-card.md).

## One-Sentence Pitch

Lumo creates a living repo harness for AI coding agents, so Codex and Claude can
work in your codebase with clearer rules, risks, commands, and review
expectations.

## What You Are Testing

First, test the control-layer shape:

```txt
preflight -> coding agent work -> checkpoint -> review
```

This shows whether Lumo can give Codex or Claude Code a clearer route before
coding and a clearer completion gate after a diff exists.

Then, optionally test the comparison proof loop:

The test compares two Codex runs:

```txt
same fixture
same prompt
baseline repo copy without Lumo
Lumo repo copy with generated AGENTS.md
compare the diff, risk seams, verification, and final handoff
```

Important caveat: this is a local-user-mode comparison. The runner ignores
Codex `config.toml` and `.rules` files, but it does not yet prove that a global
`AGENTS.md` is disabled. Read the result as: what changed when repo-local Lumo
rails were added on top of the local Codex environment?

The question is not:

```txt
Does the code compile?
```

The better question is:

```txt
Did the agent behave more like a careful repo contributor?
```

## What To Look For

| Signal | Why It Matters |
| --- | --- |
| Smaller review surface | Less code to understand before trusting the change. |
| Fewer risky seams | The first slice should avoid auth, database, provider, CRM, billing, env, or external I/O unless required. |
| Local patterns reused | The agent should fit the repo instead of inventing a new style. |
| Verification run | The final answer should name the command that was used. |
| Honest handoff | The final answer should say what was not verified or intentionally not wired. |

## Current Best Proofs

| Proof | Use For | Why |
| --- | --- | --- |
| `nextjs-ops-console-advanced-risk` | Current v0 dogfood proof | Lumo kept a larger Next.js-shaped task smaller and easier to review while both runs avoided risky seams. |
| `nextjs-stateful-ai-risk` | Quick screenshot explanation | Baseline touched the provider/AI seam; Lumo touched no risk seams. |
| `nextjs-dashboard-action-risk` | Product validation | Multiple useful runs show Lumo avoiding auth/db seams while keeping the result reviewable. |

Current advanced dogfood run:

```txt
eval-runs/2026-06-24T02-00-29-943Z-nextjs-ops-console-advanced-risk/comparison.md
```

Stable example card:

```txt
docs/examples/dashboard-action-proof-card.html
docs/examples/screenshots/dashboard-action-proof-card.png
docs/examples/dashboard-action-manual-review.md
```

Example harness drafts:

```txt
docs/examples/AGENTS.md.draft
docs/examples/CLAUDE.md.draft
docs/examples/workflows/bugfix.md
docs/examples/workflows/feature.md
docs/examples/workflows/review.md
```

Headline result:

| Metric | Baseline | Lumo |
| --- | --- | --- |
| Files changed | 8 | 5 |
| Diff size | +298 / -17 | +174 / -0 |
| Risk seams | none | none |
| Browser fetch | no | no |
| Reviewability | 1/2 | 2/2 |

Caveat:

```txt
Baseline was also safe. This proof shows improved reviewability and first-slice
restraint, not unique dangerous-bug prevention.
```

Proof card:

```txt
docs/examples/dashboard-action-proof-card.html
```

Screenshots:

```txt
docs/examples/screenshots/dashboard-action-proof-card.png
```

Local source runs under `eval-runs/` are intentionally not part of the minimum
tester share set. Use [private-tester-share-manifest.md](private-tester-share-manifest.md)
before sharing anything externally.

## Try It Locally

Use the quickstart:

```txt
docs/public-tester-quickstart.md
```

Recommended first commands:

```bash
npm run lumo -- doctor --path fixtures/nextjs-pattern-following
npm run lumo -- preflight --path fixtures/nextjs-pattern-following --task "Add a small settings panel change. Keep the first slice reviewable and use the repo's available verification command before claiming done."
```

Recommended proof-loop command:

```bash
npm run eval:codex -- --case nextjs-ops-console-advanced-risk
npm run eval:card
```

Recommended deeper product-validation command:

```bash
npm run eval:codex -- --case nextjs-dashboard-action-risk
npm run eval:card
```

Optional stricter instruction-environment preflight:

```bash
npm run eval:codex-home -- --codex-home /path/to/test-codex-home --case nextjs-dashboard-action-risk --require-no-global-agents
```

## Feedback We Want

Good feedback is concrete:

```txt
The proof card was clear / unclear because...
The comparison felt useful / not useful because...
The Lumo output felt more reviewable / not more reviewable because...
The "not verified" section made me trust it more / less because...
I would / would not use this before a Codex feature task because...
```

Summarize private feedback in
[first-tester-feedback-log.md](first-tester-feedback-log.md) so the next decision
is based on evidence rather than vibes.

## What This Does Not Claim

Lumo does not currently claim:

- safer AI coding in general;
- guaranteed better code;
- guaranteed smaller diffs;
- Claude Code parity;
- production safety;
- replacement for tests or human review.

Current safe claim:

```txt
Lumo can help make the repo contract explicit before Codex builds, so the first
slice is more bounded, reviewable, and honest about what was not verified.
```
