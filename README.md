# Lumo Harness

Create a living repo harness for AI coding agents.

Status: v0 local proof. Lumo Harness scans a local repo, previews agent rails,
and compares Codex behavior with and without a generated repo `AGENTS.md`. It
does not write to the target repo by default.

MVP wedge: master one use case first. Lumo starts with TypeScript/Next.js repos used by Codex or Claude Code, where the user wants smaller feature slices, clearer repo rules, safer risk gates, and better proof before broad expansion to other stacks.

## Why

Most builders already prompt Codex or Claude Code. Lumo Harness turns loose
prompting into a small, editable repo frame:

- what the agent may inspect;
- which commands prove a change;
- where AI/provider/data risks need review;
- which workflow drafts should exist first.

Short version:

```txt
Do not start Codex cold. Give your repo a living agent frame first.
```

## Install

```bash
npm install
npm run build
```

For local testing from this cloned repo, use:

```bash
npm run lumo -- <command>
```

Optional local bin setup:

```bash
npm link
lumo doctor --path /path/to/repo
```

## Use It From Your Own Repo

If you want Codex or Claude Code to set up Lumo for a repo, start with analysis
before writing any files. Copy this into your coding agent from the repo you want
to improve:

```txt
I want to make this repo easier and safer to work on with Codex/Claude Code using
Lumo Harness.

First, do a read-only analysis of this repository. Do not edit files yet.

Analyze:
- project type, framework, package manager, and available commands;
- existing repo instructions such as AGENTS.md, CLAUDE.md, README, docs, tests,
  lint, typecheck, and verification scripts;
- architecture patterns and boundaries the agent should follow;
- risky seams such as auth, database, billing, provider APIs, secrets,
  migrations, background jobs, email, notifications, and external side effects;
- where the repo currently has clear rails and where it is ambiguous.

Then propose the smallest useful Lumo harness setup for this repo:
- AGENTS.md changes or a first AGENTS.md draft;
- optional CLAUDE.md notes if Claude Code is used;
- 1-3 workflow docs, only if useful;
- the verification command the agent should run before claiming done;
- stop conditions where the agent should pause for human review;
- what you would not add yet.

Important:
- keep the setup small and editable;
- do not overwrite existing repo rules;
- do not add a large framework;
- ask before writing files;
- after the analysis, show me the proposed files and explain why each one exists.
```

The intended flow is:

```txt
analyze repo -> preview harness -> user approves -> write small repo-level rails
```

## MVP Tester Flow

For the first tester, keep it to four steps.

1. Check that Lumo can read the repo and find local Codex:

```bash
npm run lumo -- doctor --path /path/to/repo
```

If they want to prove local Codex login/readiness too:

```bash
npm run lumo -- doctor --path /path/to/repo --with-codex
```

2. Generate the Lumo Rubric report with local Codex synthesis:

```bash
npm run lumo -- analyze --path /path/to/repo --html --with-codex --output tmp/lumo-report.html
open tmp/lumo-report.html
```

3. Preview the proposed harness files:

```bash
npm run lumo -- init --path /path/to/repo --dry-run
```

4. Only if the proposal looks right, write the first harness files:

```bash
npm run lumo -- init --path /path/to/repo --write
```

`init --write` refuses to overwrite existing files. If the repo already has
`AGENTS.md`, `CLAUDE.md`, or workflow docs, review the dry-run output and apply
the useful parts manually.

## Use

Check local readiness:

```bash
npm run lumo -- doctor --path /path/to/repo
```

Deterministic scan, no API key:

```bash
npm run scan:grip
# or
npx tsx src/index.ts scan --path /path/to/repo
```

Generate a local HTML rubric report, no API key:

```bash
npx tsx src/index.ts analyze --path /path/to/repo --html --output lumo-analysis-report.html
```

Generate the same report with optional local Codex CLI synthesis:

```bash
npx tsx src/index.ts analyze --path /path/to/repo --html --with-codex --output lumo-analysis-report.html
```

This does not require an `OPENAI_API_KEY` in Lumo. It does require the local
`codex` CLI to be installed and signed in. Lumo runs Codex in read-only sandbox
mode and does not write files to the target repo. The optional Codex step has a
default timeout of 90 seconds:

```bash
npx tsx src/index.ts analyze --path /path/to/repo --html --with-codex --codex-timeout-ms 120000 --output lumo-analysis-report.html
```

Preview draft harness files, no writes and no API key:

```bash
npx tsx src/index.ts preview --path /path/to/repo
# or try the dashboard fixture
npm run preview:dashboard
```

Initialize proposed harness files. Preview only by default:

```bash
npm run lumo -- init --path /path/to/repo --dry-run
```

Write only after review:

```bash
npm run lumo -- init --path /path/to/repo --write
```

Check whether the current tester proof package is complete:

```bash
npm run tester:check
```

Render the first private tester packet for Zoey to review:

```bash
npm run tester:packet
```

This also writes:

```txt
docs/first-tester-packet.generated.md
```

The command fails if that generated packet does not match the current invite
draft or feedback template.

Check whether the first tester feedback checkpoint is still pending or ready for
a product decision:

```bash
npm run tester:feedback
```

Show the exact next local action for the tester checkpoint, without changing
any files:

```bash
npm run tester:next
```

Show the exact minimum share set and keep-local list before manually contacting
a tester:

```bash
npm run tester:share
```

Agentic dry run, no API key:

```bash
npx tsx src/index.ts agent --path /path/to/repo --dry-run
```

Live OpenAI Agents SDK run:

```bash
OPENAI_API_KEY=... npx tsx src/index.ts agent --path /path/to/repo
```

## Proof Loop

Lumo is validated with local comparison runs:

```txt
same fixture
same Codex prompt
baseline repo copy without Lumo
Lumo repo copy with generated AGENTS.md
compare diffs, final responses, and verification
```

The comparison runs in local-user mode. The script ignores Codex `config.toml`
and execpolicy `.rules` files, but current Codex CLI help does not document a
flag that explicitly disables a global `AGENTS.md`. Each comparison therefore
records the instruction environment and does not claim clean-room isolation.

Run the strongest current advanced eval:

```bash
npm run eval:codex -- --case nextjs-ops-console-advanced-risk
```

Other local eval cases:

```bash
npm run eval:codex -- --case ts-llm-workflow
npm run eval:codex -- --case nextjs-ai-triage-risk
npm run eval:codex -- --case nextjs-dashboard-action-risk
npm run eval:codex -- --case nextjs-client-portal-risk
npm run eval:codex -- --case nextjs-ops-console-advanced-risk
```

This writes a new local folder under `eval-runs/`, which is ignored by git.
Each baseline and Lumo Codex run also gets a dedicated workflow-papercut log:

```txt
/tmp/lumo-harness-workflow-papercuts-<run-id>-<side>.md
eval-runs/<run-id>/<side>/workflow-papercuts.md
```

The child agent is prompted to append brief redacted notes there when repo
instructions, commands, risk gates, verification, or the eval harness itself are
confusing. The per-side path is passed through `LUMO_WORKFLOW_PAPERCUT_LOG` so
the eval task prompt stays the same. Treat these logs as local tuning feedback
only, not public proof.

Turn a completed run into a proof card:

```bash
npm run eval:card -- --run <run-id>
```

Or render the latest run:

```bash
npm run eval:card
```

Refresh an existing comparison after a rubric or detector change, without
rerunning Codex:

```bash
npm run eval:codex -- --refresh-run <run-id>
npm run eval:card -- --run <run-id>
```

Example:

```bash
npm run eval:card -- --run 2026-06-22T20-01-53-866Z-nextjs-stateful-ai-risk
```

Outputs:

```txt
eval-runs/<run-id>/eval-card.html
eval-runs/<run-id>/x-draft.md
```

A stable example proof card is available at
[docs/examples/dashboard-action-proof-card.html](docs/examples/dashboard-action-proof-card.html).
The matching static screenshot is
[docs/examples/screenshots/dashboard-action-proof-card.png](docs/examples/screenshots/dashboard-action-proof-card.png).
Example generated harness drafts are available at
[docs/examples/AGENTS.md.draft](docs/examples/AGENTS.md.draft) and
[docs/examples/CLAUDE.md.draft](docs/examples/CLAUDE.md.draft).
Example workflow drafts are available under
[docs/examples/workflows](docs/examples/workflows).
Generated `eval-runs/` remain local and ignored by git.

## Lumo Rubric Report

The scanner can inspect a repo and render a minimal local HTML report against
the Lumo Rubric:

```bash
npx tsx src/index.ts analyze --path /path/to/repo --html --output lumo-analysis-report.html
```

For a more useful first-tester run, add local Codex synthesis:

```bash
npx tsx src/index.ts analyze --path /path/to/repo --html --with-codex --output lumo-analysis-report.html
```

That report is a diagnostic artifact. It should help a builder see where the
repo currently stands before any harness files are written.

Current rubric areas:

- repo contract;
- verification rail;
- workflow shape;
- risk gates;
- boundary discipline;
- proof habit.

The setup query belongs in this README, not in the report. The report should
stay focused on score, evidence, and smallest next improvement:

- stack and commands;
- existing agent rails;
- missing or ambiguous rails;
- risk seams;
- recommended first improvement;
- optional Codex interpretation;
- not-verified notes.

This should be a local artifact, not a SaaS dashboard. The goal is to give a
builder a clean, shareable report before any harness files are written.

The card must keep claims narrow:

- what this proves;
- what this does not prove;
- changed files without Lumo;
- changed files with Lumo;
- verification and not-verified notes.

For first-time testers, use [docs/public-tester-quickstart.md](docs/public-tester-quickstart.md).
For the current v0 soft-launch brief, use [docs/lumo-v0-test-brief.md](docs/lumo-v0-test-brief.md).
For the short tester-facing story, use [docs/first-tester-proof-brief.md](docs/first-tester-proof-brief.md).
For a draft invite message, use [docs/first-tester-invite-draft.md](docs/first-tester-invite-draft.md).
For Zoey's send/no-send gate, use [docs/first-tester-review-packet.md](docs/first-tester-review-packet.md).
For private tester feedback capture, use [docs/first-tester-feedback-log.md](docs/first-tester-feedback-log.md).
For turning first tester feedback into one next checkpoint, use
[docs/first-tester-decision-map.md](docs/first-tester-decision-map.md).
For synthetic examples of how tester feedback routes to the next checkpoint,
use [docs/first-tester-feedback-scenarios.md](docs/first-tester-feedback-scenarios.md).
For the exact files to share or keep local, use
[docs/private-tester-share-manifest.md](docs/private-tester-share-manifest.md).

Before asking a tester, run:

```bash
npm run check:local
```

This expands to the full local checkpoint set:

```bash
npm run tester:check
npm run tester:packet
npm run tester:feedback
npm run tester:next
npm run tester:share
npm run public:check
npm run goal:audit
```

For the checkpoint method and current best proof, see:

- [docs/mvp-use-case.md](docs/mvp-use-case.md)
- [docs/lumo-init-mvp-scope.md](docs/lumo-init-mvp-scope.md)
- [docs/lumo-v0-test-brief.md](docs/lumo-v0-test-brief.md)
- [docs/golden-use-case.md](docs/golden-use-case.md)
- [docs/nextjs-harness-quality-bar.md](docs/nextjs-harness-quality-bar.md)
- [docs/user-visible-outcomes.md](docs/user-visible-outcomes.md)
- [docs/harness-levers.md](docs/harness-levers.md)
- [docs/eval-case-design.md](docs/eval-case-design.md)
- [docs/eval-ladder.md](docs/eval-ladder.md)
- [docs/dogfood-nextjs-larger-projects.md](docs/dogfood-nextjs-larger-projects.md)
- [docs/checkpoint-loop.md](docs/checkpoint-loop.md)
- [docs/eval-rubric.md](docs/eval-rubric.md)
- [docs/manual-diff-review.md](docs/manual-diff-review.md)
- [docs/proof-matrix.md](docs/proof-matrix.md)
- [docs/demo-walkthrough.md](docs/demo-walkthrough.md)
- [docs/public-repo-checklist.md](docs/public-repo-checklist.md)
- [docs/goal-completion-audit.md](docs/goal-completion-audit.md)
- [docs/examples/README.md](docs/examples/README.md)
- [docs/first-tester-proof-brief.md](docs/first-tester-proof-brief.md)
- [docs/first-tester-invite-draft.md](docs/first-tester-invite-draft.md)
- [docs/first-tester-review-packet.md](docs/first-tester-review-packet.md)
- [docs/first-tester-feedback-log.md](docs/first-tester-feedback-log.md)
- [docs/first-tester-decision-map.md](docs/first-tester-decision-map.md)
- [docs/first-tester-feedback-scenarios.md](docs/first-tester-feedback-scenarios.md)
- [docs/private-tester-share-manifest.md](docs/private-tester-share-manifest.md)
- [docs/stateful-risk-seam-proof.md](docs/stateful-risk-seam-proof.md)
- [docs/dashboard-action-risk-proof.md](docs/dashboard-action-risk-proof.md)

## Current Scope

Slice 1 is TypeScript-first and read-only. It detects:

- package scripts and TypeScript/Next/Vite/React signals;
- existing `AGENTS.md`, `CLAUDE.md`, Cursor, and Copilot rails;
- docs, tests, fixtures, prompts, schemas, eval-like files;
- OpenAI, Vercel AI SDK, Supabase, auth, env, and API-route risk signals.

It returns at most three recommended first improvements.

## Not Yet

- No writes to the target repo.
- No install flow.
- No automatic PRs.
- No global `~/.codex` or `~/.agents` analysis.
- No runtime verification of test commands.

## MVP Notes

See [docs/mvp-gaps.md](docs/mvp-gaps.md) for the current public-repo readiness list.
