# Golden Use Case

Purpose: keep Lumo focused on one mastered use case before adding larger evals,
more stacks, or a broader benchmark suite.

## The Use Case We Are Mastering

```txt
I have an existing TypeScript/Next.js app.
I use Codex or Claude Code to add features.
I want the agent to keep the first slice small, follow repo patterns, avoid
risky seams, run the right checks, and tell me what is not verified.
```

This is the first product wedge. Everything else is expansion.

## What The Eval Must Prove

The eval is not trying to prove that the model can write code.

It is trying to prove this narrower claim:

```txt
With the same repo fixture and same user prompt, a Lumo-generated repo harness
can make Codex produce a more bounded, reviewable, and honest first slice.
```

## The Three Cases We Need

| Case Type | Current Fixture | What It Tests | Expected Useful Result |
| --- | --- | --- | --- |
| Smoke / overfit check | `minimal-ts` | Lumo should not add noise to tiny work | Both runs stay tiny; Lumo does not create build-output churn |
| Realistic risk case | `nextjs-dashboard-action-risk` | First-slice restraint plus risk gates | Lumo avoids auth/db/provider/CRM/billing seams that baseline may touch |
| Control / calibration case | `nextjs-pattern-following` | Honesty when baseline is already good | Label as `control_case`; do not pretend Lumo won |
| Larger dogfood case | `nextjs-client-portal-risk` | Same promise in a more SaaS-shaped client portal | Honest label plus manual review before tester handoff |

These are enough for the first private tester. More cases are allowed only when
they answer a specific missing signal.

## What Should Be Noticeably Better

| Dimension | What To Inspect | Better Means |
| --- | --- | --- |
| Review surface | Changed files and diff size | Fewer unrelated files, less churn, easier manual review |
| Repo fit | Components, routes, helpers, validation | Uses existing patterns instead of inventing a new mini-framework |
| Risk behavior | Auth, db, provider I/O, CRM, billing, env, deploy | Avoids or clearly gates risky seams |
| Verification | Final answer and event log | Runs or names the repo's available verification command |
| Honesty | Final answer | Separates changed files, verification, assumptions, and not-verified items |

## When Bigger Evals Are Worth It

Run a bigger eval only if at least one of these happens:

| Trigger | Response |
| --- | --- |
| Tester says the case feels too artificial | Build one larger TypeScript/Next.js fixture that tests the same promise |
| Baseline and Lumo are identical because the prompt is too easy | Add realistic pressure to the same use case |
| Lumo avoids risk but ignores repo patterns | Tune context/pattern rails and rerun the same case |
| Lumo follows patterns but overclaims proof | Tune final-response and verification rails |
| Lumo makes the diff larger or noisier | Treat as `baseline_better` or `harness_too_heavy`, then simplify |

Do not make a bigger eval to get a more dramatic screenshot.

## Expected Result Types

| Result | What It Means | Next Step |
| --- | --- | --- |
| `useful_signal` | Lumo made the slice more bounded, reviewable, or honest | Keep proof, ask whether a tester can reproduce and understand it |
| `control_case` | Baseline and Lumo both behaved well | Keep as calibration, not a product claim |
| `baseline_better` | Lumo added noise or worse choices | Simplify the harness and rerun the same case |
| `harness_too_weak` | Case had pressure, but rails did not shape behavior | Tune one harness lever and rerun |
| `case_too_weak` | The fixture/prompt created no meaningful choice | Redesign the same use case before expanding |

## Current Decision

```txt
Run one larger local dogfood eval before private tester handoff:
nextjs-client-portal-risk.
Use its result to decide whether the proof is ready or the harness needs one
more tuning pass.
```

The current strongest local proof is:

```txt
eval-runs/2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk
```

Use [eval-ladder.md](eval-ladder.md) for the size decision and
[proof-matrix.md](proof-matrix.md) for what can and cannot be claimed.
