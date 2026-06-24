# Lumo Eval Ladder

Purpose: decide whether the next eval should be bigger, smaller, repeated, or
sent to a tester.

Lumo should master one use case before expanding:

```txt
TypeScript/Next.js repo
Codex or Claude Code user
realistic feature request
tempting risky seams
generated repo harness
baseline vs Lumo comparison
```

The goal is not to prove that Codex can code. The goal is to prove whether repo
rails make the agent behave more like a careful contributor.

## The Ladder

| Level | Question | Example | Move On When |
| --- | --- | --- | --- |
| 0. Runner smoke | Does the eval machinery work? | `minimal-ts` | Outputs are captured and fixture stays unchanged |
| 1. Harness overfit check | Does Lumo add noise on tiny tasks? | `minimal-ts` after template changes | Lumo does not add generated output or package churn |
| 2. Realistic bounded feature | Does Lumo change behavior under real pressure? | `nextjs-dashboard-action-risk` | Difference is visible in diff, seams, verification, or final answer |
| 3. Repeatability check | Does the same case stay useful after harness tuning? | rerun dashboard action after template changes | Signal survives, or the regression teaches a specific fix |
| 4. Control case | Does Lumo avoid fake wins when baseline is already good? | `nextjs-pattern-following` | Result can be labeled `control_case` without embarrassment |
| 5. Larger local dogfood | Does the same promise survive a more SaaS-shaped repo? | `nextjs-client-portal-risk` | One run produces an honest label and a manual review target |
| 5b. Advanced pressure rerun | Can Lumo steer a larger repo without an answer-key README? | `nextjs-ops-console-advanced-risk` | One run tests risk seams plus unnecessary client-interaction depth |
| 6. Private tester | Can someone else run and understand it? | public quickstart plus proof card | Tester can reproduce, explain value, and name confusion |
| 7. Second use case | Does the wedge generalize inside TypeScript/Next.js? | another feature/API/AI workflow repo | First use case is already reproducible and useful |

Do not jump to level 6 because level 2 feels emotionally unresolved. First ask
whether the current case is weak, the harness lever is weak, or the metric is
too vague.

## Current Checkpoint Decision

The current uncertainty is:

```txt
Does Lumo clearly feel better than normal Codex usage?
```

Do not answer that by making the fixture larger by default. Answer it by
checking whether the current TypeScript/Next.js use case shows a user-visible
difference.

| Question | Good Current Answer | If Not True |
| --- | --- | --- |
| What should improve? | Smaller, calmer, more reviewable first slice | Tighten the user-visible outcome before rerunning |
| Where should it show up? | Diff, risky seams, verification, final handoff | Tune one harness lever and rerun the same case |
| What result do we expect? | Lumo avoids or gates work a careful maintainer would not do in v1 | Treat as `harness_too_weak` or `case_too_weak` |
| When is a larger eval justified? | A tester or manual review names a specific missing signal | Do not expand yet |

Larger evals are useful when they reveal a missing behavior. They are not useful
when they only make the demo look more serious.

## When A Bigger Eval Is Worth It

Run a bigger eval only when at least one condition is true:

| Condition | Why |
| --- | --- |
| Current fixture has no real design choice | The harness cannot matter if there is nothing to steer |
| Baseline and Lumo both stay tiny for the wrong reason | The prompt did not create enough realistic pressure |
| We need to test a new harness lever | For example pattern reuse, stop behavior, or final-answer honesty |
| A tester says the proof feels too artificial | External confusion is a better reason than internal impatience |

Do not make a bigger eval just to get a more dramatic screenshot. Bigger diffs
can hide the exact behavior Lumo changed.

## Expected Result Types

An eval can be useful without being a Lumo win.

| Result | Meaning | Next Move |
| --- | --- | --- |
| `useful_signal` | Lumo made the run more bounded, reviewable, or honest | Keep the proof and ask whether it reproduces |
| `control_case` | Both runs were good | Keep as calibration; do not market as a win |
| `baseline_better` | Lumo added noise or worse choices | Fix the harness and rerun the same case |
| `harness_too_weak` | Case had pressure, but rails did not shape behavior | Tune one harness lever and rerun |
| `case_too_weak` | The task was too easy or artificial | Redesign the fixture or prompt before rerunning |
| `needs_manual_review` | Metrics cannot judge repo fit | Inspect the diff against local patterns |

## What The User Should Feel

The measurable difference should map to a user feeling:

| Eval Signal | User Feeling |
| --- | --- |
| Fewer risky seams touched | "The agent did not wander into scary parts of my app." |
| Less package/config/build churn | "I can review this without untangling noise." |
| Existing patterns reused | "It coded like this repo, not like a blank starter project." |
| Verification command used | "It proved the narrow slice before claiming done." |
| Not-verified items stated | "I know what is still assumption or follow-up." |

If the user-visible feeling is unclear, the eval is not ready to be a product
claim.

## Harness Elements To Tune

Tune one primary element per eval rerun.

| Element | Tune When | Proof To Look For |
| --- | --- | --- |
| Rules | Agent crosses no-go seams | Risky files disappear from the diff |
| Context | Agent misses local patterns | Existing route/component/error shape is reused |
| Default behavior | Agent overbuilds v1 | First slice stays local and reviewable |
| Communication | Final answer overclaims | Verification and not-verified items are separated |
| Verification | Agent claims done too early | Correct repo command appears in final/events |
| Stop conditions | Task implies secrets, deploy, data, or external side effects | Agent pauses or marks the work not verified |

This keeps Lumo from becoming "more prompting." The product value is that the
repo contract shapes the agent before, during, and after the coding run.

## Current Recommendation

Do not start with a broad benchmark suite yet.

The current best next step is:

```txt
Run one advanced pressure rerun before sending this larger-work story to a
private tester:
nextjs-ops-console-advanced-risk.
```

This is justified because the missing signal is now specific: the previous
larger case became a control result and showed that Lumo can overbuild UI
interaction. The next case removes the fixture README answer key and tests two
clear levers: risk-seam restraint and depth appropriateness. If the result is
weak, tune one harness lever before sharing.
