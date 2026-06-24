# Public Tester Quickstart

Use this when someone wants to try Lumo Harness without knowing the backstory.
For the shorter "why should I care?" version, start with
[lumo-v0-test-brief.md](lumo-v0-test-brief.md), then
[first-tester-proof-brief.md](first-tester-proof-brief.md).
For a two-minute live explanation, use [demo-walkthrough.md](demo-walkthrough.md).
For the draft message Zoey can send to one tester, use
[first-tester-invite-draft.md](first-tester-invite-draft.md).

The first public test is not a product install flow yet. It is a local proof loop:

```txt
same fixture
same Codex prompt
baseline repo copy without Lumo
Lumo repo copy with generated AGENTS.md
compare the review surface
```

## What You Need

- Node.js 20 or newer.
- Git.
- Codex CLI installed and signed in.
- This repo cloned locally.

No OpenAI API key is needed for the deterministic scanner, preview command, or
proof-card renderer.

Optional sanity check:

```bash
codex --version
```

## 1. Install

```bash
npm install
npm run build
```

Expected result:

```txt
tsc -p tsconfig.json
```

## 2. Run The Current Strongest Eval

Optional readiness check before the longer Codex run:

```bash
npm run tester:check
npm run tester:packet
```

This confirms that the stable proof package, human review gate, example
artifacts, and draft tester packet are present before you spend time on a fresh
eval.

Optional: preview what Lumo would generate before running a Codex comparison.
This is deterministic, uses no API key, and writes nothing:

```bash
npm run preview:dashboard
```

Look for:

```txt
AGENTS.md.draft
CLAUDE.md.draft
workflows/bugfix.md
workflows/feature.md
workflows/review.md
```

```bash
npm run eval:codex -- --case nextjs-ops-console-advanced-risk
```

This can take several minutes because it runs Codex twice.

Note: this is a local-user-mode comparison. The runner ignores Codex
`config.toml` and `.rules` files, but it does not currently prove that global
`AGENTS.md` instructions are disabled. The generated `comparison.md` records
that instruction environment so the result is not overclaimed.

Optional stricter mode: if you already have a separate Codex home configured for
testing, you can run:

```bash
npm run eval:codex-home -- --codex-home /path/to/test-codex-home --case nextjs-ops-console-advanced-risk --require-no-global-agents
```

If the preflight is ready, it prints the eval command:

```bash
npm run eval:codex -- --case nextjs-ops-console-advanced-risk --codex-home /path/to/test-codex-home --require-no-global-agents
```

The runner will not copy auth files, secrets, or global config for you. The
preflight does not read token files or prove sign-in status. The strict flag
aborts if the supplied Codex home contains `AGENTS.md`.

This creates:

```txt
eval-runs/<run-id>/
  baseline/
    repo/
    final.md
    events.jsonl
    diff.patch
    diff.stat
    diff-files.txt
    stderr.log
  lumo/
    repo/
    final.md
    events.jsonl
    diff.patch
    diff.stat
    diff-files.txt
    stderr.log
  comparison.md
  progress.log
  run-metadata.json
```

`eval-runs/` is local output and is ignored by git.

During the run you should see progress like:

```txt
baseline started
baseline done
lumo started
lumo done
comparison written
next: npm run eval:card -- --run <run-id>
```

If Codex fails, the run should still write failure notes, stderr logs, and a comparison folder. That is still useful feedback for this MVP.

If you missed the printed `<run-id>`, use:

```bash
ls -td eval-runs/* | head -1
```

## 3. Read The Comparison

Open:

```txt
eval-runs/<run-id>/comparison.md
```

Look for:

- the eval hypothesis: user task, harness lever, expected baseline failure,
  accepted proof, and false positive to avoid;
- files changed without Lumo;
- files changed with Lumo;
- package or config churn;
- verification mentioned or run;
- whether uncertainty or "not verified" is stated.

For the full judging lens, use [eval-rubric.md](eval-rubric.md). The important
question is not just "did the code work?", but whether the agent stayed within
repo rules, reused local patterns, respected risk gates, verified honestly, and
kept the diff reviewable.

For choosing which proof to share or repeat, use [proof-matrix.md](proof-matrix.md).
It separates simple public proof from stronger product-validation proof and
control cases.

The current strongest advanced local run showed:

```txt
without Lumo: 8 files changed, +298 / -17, no risk seams
with Lumo:    5 files changed, +174 / -0, no risk seams
```

That is useful evidence, not a guarantee. In that run baseline was also safe,
so the signal is reviewability and first-slice restraint rather than unique
danger prevention.

## 4. Render The Proof Card

Use the exact command printed at the end of the eval:

```bash
npm run eval:card -- --run <run-id>
```

Or render the latest run:

```bash
npm run eval:card
```

This writes:

```txt
eval-runs/<run-id>/eval-card.html
eval-runs/<run-id>/x-draft.md
```

Open the card in your browser:

```bash
open eval-runs/<run-id>/eval-card.html
```

The card should be understandable in under two minutes.

If a rubric or detector changes after a run, refresh the existing comparison
without rerunning Codex:

```bash
npm run eval:codex -- --refresh-run <run-id>
npm run eval:card -- --run <run-id>
```

Optional screenshot QA, if the Playwright CLI is available:

```bash
mkdir -p eval-runs/<run-id>/screenshots
playwright screenshot --viewport-size=1440,1200 file://$(pwd)/eval-runs/<run-id>/eval-card.html eval-runs/<run-id>/screenshots/eval-card-desktop.png
playwright screenshot --viewport-size=390,1100 file://$(pwd)/eval-runs/<run-id>/eval-card.html eval-runs/<run-id>/screenshots/eval-card-mobile.png
playwright screenshot --full-page --viewport-size=390,1100 file://$(pwd)/eval-runs/<run-id>/eval-card.html eval-runs/<run-id>/screenshots/eval-card-mobile-full.png
```

Use screenshots as presentation evidence only after checking that text does not
overlap and the proof / non-proof sections are visible.

## Optional Second Cases

After the strongest eval, you can also run the older reviewability case:

```bash
npm run eval:codex -- --case ts-llm-workflow
npm run eval:card
```

You can also run a synthetic risk/scope probe:

```bash
npm run eval:codex -- --case nextjs-ai-triage-risk
npm run eval:card
```

This case checks whether a more product-shaped AI/API task creates overbuild
pressure. Early local runs were useful as controls: both baseline and Lumo stayed
small, so this case should not be used as a strong product claim yet.

The synthetic case does not include existing helper seams. It is useful as a
control, not as the first public product claim.

For a stronger but more nuanced UI + API case:

```bash
npm run eval:codex -- --case nextjs-dashboard-action-risk
npm run eval:card
```

This case is better for product validation than for a first quickstart screenshot:
baseline may look smaller by file count, while Lumo can still be better on risk
gates and review boundary.

For a fast risk-seam screenshot:

```bash
npm run eval:codex -- --case nextjs-stateful-ai-risk
npm run eval:card
```

That case is simpler than the advanced ops-console case, but easier to explain:
one prior run showed baseline touching a provider/AI seam while Lumo touched no
auth/db/provider/CRM seams.

## What This Proves

- Lumo can generate a repo-level `AGENTS.md` for an eval copy.
- The same Codex task can be run with and without that generated repo contract.
- The result can be compared through diffs, final messages, and a proof card.
- The loop is local and reproducible.

## What This Does Not Prove

- It does not prove Lumo always improves Codex output.
- It does not prove a repo is safe.
- It does not replace tests or human review.
- It does not evaluate Claude Code yet.
- It does not apply Lumo files to your real repo.

## Good Feedback

Useful tester feedback is concrete:

```txt
The quickstart was clear / unclear because...
The eval took about X minutes.
The proof card did / did not make the difference obvious.
The comparison felt useful / not useful because...
I would trust / not trust this before starting a new Codex task because...
```

## Safe Claim

Use this wording:

```txt
Lumo helps make agent work smaller, more reviewable, and easier to prove.
```

For the current stateful proof, an even narrower claim is:

```txt
Lumo can help keep a first agent slice away from tempting repo seams.
```

Avoid:

```txt
Lumo makes AI code safe.
Lumo guarantees better output.
Lumo replaces tests or review.
```
