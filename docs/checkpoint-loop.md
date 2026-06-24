# Lumo Checkpoint Loop

Lumo is built through small local proof loops, not broad product claims.

The current loop tests whether a repo-level harness helps Codex work in a
smaller, clearer, more reviewable slice.

## Loop Goal

```txt
same fixture
same Codex prompt
baseline repo copy without Lumo
Lumo repo copy with generated AGENTS.md
compare the result
turn the comparison into a proof card
```

## Checkpoints

| Checkpoint | Purpose | Evidence |
| --- | --- | --- |
| Case selected | Test a realistic builder task | fixture name and fixed prompt |
| Repo copies created | Keep baseline and Lumo starts identical | `eval-runs/<run-id>/baseline/repo`, `eval-runs/<run-id>/lumo/repo` |
| Harness installed | Only Lumo copy gets repo rails | `eval-runs/<run-id>/lumo/repo/AGENTS.md` |
| Instruction environment recorded | Make local Codex/global rule influence explicit | `run-metadata.json`, `comparison.md` section `Instruction Environment` |
| Baseline run | Capture Codex without Lumo | `baseline/final.md`, `baseline/diff.patch`, `baseline/events.jsonl` |
| Lumo run | Capture Codex with Lumo | `lumo/final.md`, `lumo/diff.patch`, `lumo/events.jsonl` |
| Workflow papercuts | Capture local friction that makes future harness runs harder | `baseline/workflow-papercuts.md`, `lumo/workflow-papercuts.md` |
| Comparison | Make the difference reviewable | `comparison.md` |
| Refresh comparison | Re-apply improved metrics without rerunning Codex | `npm run eval:codex -- --refresh-run <run-id>` |
| Proof card | Make the result shareable | `eval-card.html`, `x-draft.md` |
| Visual QA | Check that the proof is readable | desktop and mobile screenshots |
| Decision | Decide what to improve next | keep, refine, reject, or publish draft |

Use [eval-rubric.md](eval-rubric.md) to judge the comparison. File count alone
is not enough; Lumo should be evaluated on agent behavior, repo fit, risk gates,
verification, and honesty.

Use [eval-case-design.md](eval-case-design.md) before adding a new case. A good
case needs realistic pressure and tempting risky seams; otherwise Lumo cannot
meaningfully prove a behavior difference.

Use [eval-ladder.md](eval-ladder.md) when deciding whether to rerun, tune,
escalate to a bigger fixture, or send the proof to a private tester.

Use [proof-matrix.md](proof-matrix.md) after a run has a proof card. It separates
public-screenshot proof, product-validation proof, historical calibration, and
control cases so one good result does not become an overclaim.

## Workflow Papercuts

Each Codex eval side gets a dedicated tmp file while it runs:

```txt
/tmp/lumo-harness-workflow-papercuts-<run-id>-<side>.md
```

The runner archives that file into the local run folder as
`eval-runs/<run-id>/<side>/workflow-papercuts.md`.

The per-side path is passed through `LUMO_WORKFLOW_PAPERCUT_LOG`, so the eval
task prompt remains the same for baseline and Lumo.

Use these notes to improve prompts, docs, fixture design, commands, or review
gates. They are not product proof and should stay out of tester/public share
sets unless manually reviewed and summarized.

## Checkpoint Report Format

Every important checkpoint should answer:

| Question | Answer |
| --- | --- |
| What happened? | One short human-readable summary |
| Where is the artifact? | Path to the file, report, screenshot, or command output |
| What is proven? | Only observations supported by the artifact |
| What is not proven? | Explicit limits and non-claims |
| How do we reproduce it? | Exact command or local steps |
| What is the next checkpoint? | One small next move |

## Current Best Proof Case

```bash
npm run eval:codex -- --case nextjs-stateful-ai-risk
npm run eval:card
```

Why this case:

- it is a realistic Next.js API task;
- the fixture already contains auth, database, OpenAI, and CRM helper seams;
- the prompt creates reasonable pressure to use those seams;
- the Lumo copy gets rails that keep the first slice local and deterministic.

Current useful signal:

```txt
without Lumo: touched provider/AI seam
with Lumo:    touched no auth/db/provider/CRM seams
```

This is a scope-control signal, not a general safety guarantee.

## Instruction Caveat

These evals are local-user-mode comparisons. The runner passes
`--ignore-user-config` and `--ignore-rules`, but current `codex exec --help`
does not document a flag that explicitly disables global `AGENTS.md` loading.

That means:

- both baseline and Lumo runs may still share the user's global Codex behavior;
- the measured difference is the additional repo-local Lumo `AGENTS.md`;
- the proof must not claim clean-room isolation.

The runner records the effective Codex home in `run-metadata.json` and the
`Instruction Environment` section.

For a cleaner instruction test, prepare a separate Codex home yourself and run:

```bash
npm run eval:codex-home -- --codex-home /path/to/test-codex-home --case nextjs-stateful-ai-risk --require-no-global-agents
```

If the preflight is ready, run the printed command:

```bash
npm run eval:codex -- --case nextjs-stateful-ai-risk --codex-home /path/to/test-codex-home --require-no-global-agents
```

This intentionally does not copy auth files, secrets, or user configuration. The
provided Codex home must already be signed in if Codex requires auth. The
preflight does not inspect token files. The strict flag aborts before running
Codex if `<codex-home>/AGENTS.md` exists.

## Safe Claim

Use:

```txt
Lumo can help keep a first agent slice away from tempting repo seams.
```

Avoid:

```txt
Lumo makes AI coding safe.
Lumo guarantees better code.
Lumo replaces tests or human review.
```

## Next Decision

Before posting or inviting testers, review the latest proof card and decide:

1. publish this as the first build-in-public proof;
2. run one more comparable case;
3. tighten the harness language before public sharing.

Use [proof-matrix.md](proof-matrix.md) to choose which proof is fit for which
decision, and [eval-ladder.md](eval-ladder.md) to decide whether a bigger eval is
actually needed.
