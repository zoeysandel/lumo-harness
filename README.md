# Lumo Harness

Create a living repo harness for AI coding agents.

Direction: Lumo is becoming a plug-and-play second set of eyes between a user and
an AI coding agent. The current repo-init flow is the first concrete slice; the
broader product is a routing, checkpoint, review, and learning layer. See
[docs/product-direction.md](docs/product-direction.md). For the first dogfood
walkthrough, see [docs/control-layer-walkthrough.md](docs/control-layer-walkthrough.md).
For the frozen v0.2 scope, see [docs/v0.2-scope.md](docs/v0.2-scope.md); for the seal note, see [docs/lumo-v0.2-seal.md](docs/lumo-v0.2-seal.md).
For the first thread-checkpoint design target, see
[docs/thread-checkpoint-v1.md](docs/thread-checkpoint-v1.md).
MCP is intentionally later: Lumo should first prove the local tools that MCP
would expose, especially checkpointing, PR-status clarity, harness mapping, and
learning from repeated friction.
For the smallest private tester path, start with
[docs/private-tester-2-minute-brief.md](docs/private-tester-2-minute-brief.md),
then inspect the redacted
[example steering card](docs/examples/redacted-steering-card.md) and
[tiny demo flow](docs/tiny-demo-flow.md).

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

v0.2 local control-layer flow:

```txt
route -> harness-map/preflight -> checkpoint -> review -> learn
```

`route` is the v0.2 front door. It is local/read-only, deterministic, and
stays silent for tiny answer-only work:

```bash
npm run lumo -- route --task "Explain how this helper works" --no-scan
npm run lumo -- route --path /path/to/repo --task "Debug the failing settings test"
npm run lumo -- route --path /path/to/repo --task "Review this PR before merge" --format json
```

`harness-map` maps the existing cockpit rails. It is local/read-only, not MCP,
TUI, or SaaS:

```bash
npm run lumo -- harness-map --path /path/to/repo
npm run lumo -- harness-map --path /path/to/repo --format json
npm run lumo -- harness-map --path /path/to/repo --codex-home /tmp/fake-codex --agents-home /tmp/fake-agents
```

`learn` turns a redacted friction packet into exactly one proposed harness
improvement. It is proposal-only and never writes repo docs, global rules,
memories, skills, GitHub, Linear, CRM, production, or external systems:

```bash
npm run lumo -- learn --input docs/cases/lumo-learn-dogfood.md
cat docs/cases/lumo-learn-dogfood.md | npm run lumo -- learn --stdin
npm run lumo -- learn --input docs/cases/lumo-learn-dogfood.md --format json
```

Agent-facing first step:

```bash
npm run lumo -- preflight --path /path/to/repo --task "Add the next small feature"
```

Use this when Codex, Claude Code, Cursor, or another coding agent needs a
read-only decision card before implementation. It does not write files or call a
model by default. Add `--with-codex` when you want local Codex to interpret the
task on top of the deterministic scan:

```bash
npm run lumo -- preflight --path /path/to/repo --task "Add the next small feature" --with-codex
```

For agent/MCP callers:

```bash
npm run lumo -- preflight --path /path/to/repo --task "Add the next small feature" --format json
```

Dynamic steering while work is in progress:

```bash
npm run lumo -- checkpoint --path /path/to/repo --task "Add the next small feature"
```

Use this after the agent has produced a first diff or when a long run feels
unclear. Lumo reads git status/diff signals and returns `go`, `check_again`,
`pause`, or `pivot`.

Add optional local Codex interpretation:

```bash
npm run lumo -- checkpoint --path /path/to/repo --task "Add the next small feature" --with-codex
```

Completion review before claiming done:

```bash
npm run lumo -- review --path /path/to/repo --task "Add the next small feature"
```

Use this when the coding agent thinks the work is complete. Lumo reads the
current diff and returns whether to claim done, run one more check, pause for
user review, or pivot.

Add optional local Codex interpretation:

```bash
npm run lumo -- review --path /path/to/repo --task "Add the next small feature" --with-codex
```

Thread-level checkpoint for long-running agent work:

```bash
npm run lumo -- thread-checkpoint --input docs/cases/tab-3017-thread-checkpoint.md
```

Use this when a Codex/Claude/Cursor thread has produced evidence and you need to
check whether the next move still follows from that evidence. V1 reads a
redacted packet only; it does not read Codex threads, Linear, production, git, or
provider logs by itself.

Agents can create that packet first. Use
[docs/prompts/thread-checkpoint-packet.md](docs/prompts/thread-checkpoint-packet.md)
as the copy-paste prompt inside Codex or Claude Code.

Pipe a packet directly into Lumo:

```bash
pbpaste | npm run lumo -- thread-checkpoint --stdin
```

Equivalent stdin form:

```bash
cat /tmp/lumo-thread-packet.md | npm run lumo -- thread-checkpoint --input -
```

PR/release status clarity:

```bash
npm run lumo -- pr-status --repo tabmedianl/linkwise-backend --pr 2192
```

Use this when a PR or release thread feels ambiguous. Lumo reads GitHub metadata
through the local `gh` CLI and separates checks, active review threads, bot
findings, merge state, and the not-verified boundary. It is read-only: it does
not resolve threads, rerun checks, comment, push, merge, deploy, or inspect
runtime proof.

For agent/MCP callers:

```bash
npm run lumo -- pr-status --repo tabmedianl/linkwise-backend --pr 2192 --format json
```

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

Generate a read-only preflight decision card:

```bash
npm run lumo -- preflight --path /path/to/repo --task "Add billing email editing"
```

The output tells the coding agent whether to continue, check one thing first,
pause for a user decision, or narrow the route.

Add optional local Codex interpretation:

```bash
npm run lumo -- preflight --path /path/to/repo --task "Add billing email editing" --with-codex
```

Generate a read-only checkpoint steering card from current git changes:

```bash
npm run lumo -- checkpoint --path /path/to/repo --task "Add billing email editing"
```

The output tells the coding agent whether the current diff still looks small and
on course, needs one more check, should pause for user steering, or should pivot.

Add optional local Codex interpretation:

```bash
npm run lumo -- checkpoint --path /path/to/repo --task "Add billing email editing" --with-codex
```

Generate a read-only review card before claiming done:

```bash
npm run lumo -- review --path /path/to/repo --task "Add billing email editing"
```

The output tells the coding agent whether it is reasonable to present the work
as done, or whether one more check, user decision, or route change is needed.

Generate a read-only thread checkpoint card from a redacted packet:

```bash
npm run lumo -- thread-checkpoint --input docs/cases/tab-3017-thread-checkpoint.md
```

Or ask the coding agent to create a packet with
[docs/prompts/thread-checkpoint-packet.md](docs/prompts/thread-checkpoint-packet.md),
then pipe it:

```bash
pbpaste | npm run lumo -- thread-checkpoint --stdin
```

Machine-readable output:

```bash
npm run lumo -- thread-checkpoint --input docs/cases/tab-3017-thread-checkpoint.md --format json
pbpaste | npm run lumo -- thread-checkpoint --stdin --format json
```

Generate a read-only PR status card from GitHub metadata:

```bash
npm run lumo -- pr-status --repo tabmedianl/linkwise-backend --pr 2192
npm run lumo -- pr-status --repo tabmedianl/linkwise-backend --pr 2192 --format json
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
For the smallest private tester brief, use
[docs/private-tester-2-minute-brief.md](docs/private-tester-2-minute-brief.md).
For a redacted steering-card example, use
[docs/examples/redacted-steering-card.md](docs/examples/redacted-steering-card.md).
For the tiny control-layer demo flow, use [docs/tiny-demo-flow.md](docs/tiny-demo-flow.md).
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
- [docs/control-layer-walkthrough.md](docs/control-layer-walkthrough.md)
- [docs/private-tester-2-minute-brief.md](docs/private-tester-2-minute-brief.md)
- [docs/examples/redacted-steering-card.md](docs/examples/redacted-steering-card.md)
- [docs/tiny-demo-flow.md](docs/tiny-demo-flow.md)
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
