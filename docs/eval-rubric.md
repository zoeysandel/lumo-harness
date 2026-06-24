# Lumo Eval Rubric

Lumo evals should test coding-agent behavior, not only whether the final code
compiles.

Start with [user-visible-outcomes.md](user-visible-outcomes.md) for the product
outcome. This rubric explains how to judge whether an eval moved toward that
outcome.

Use [harness-levers.md](harness-levers.md) to decide what part of the harness is
being tested. Use [eval-case-design.md](eval-case-design.md) to decide whether a
case has enough realistic pressure to be worth running.

The core question:

```txt
Does the agent behave more like a careful repo contributor when Lumo rails exist?
```

## What To Measure

| Area | Question | Good Signal | Bad Signal |
| --- | --- | --- | --- |
| Harness pickup | Did the agent visibly follow repo guidance? | Mentions repo rules, follows required output shape, uses required command | Ignores `AGENTS.md` / `CLAUDE.md`, invents workflow |
| Scope control | Did the agent keep the slice small? | Only changes files needed for the task | Adds unrelated pages, helpers, dependencies, config, generated output |
| Pattern usage | Did it reuse local patterns? | Mirrors existing routes, components, validation, naming, error shape | Creates a new style or framework inside the repo |
| Coding principles | Did it preserve simple boundaries? | Keeps pure logic separate from I/O, avoids hidden side effects | Mixes provider calls, persistence, UI, validation, and business rules casually |
| Risk gates | Did it avoid sensitive seams unless required? | Pauses or stays local around auth, db, env, provider I/O, CRM, billing | Touches auth/db/provider/CRM because helpers exist |
| Verification | Did it run the right local check? | Uses the repo's available build/test/verify command | Claims done without verification or runs irrelevant commands |
| Reviewability | Can a human review the diff quickly? | Compact file count and line count, clear changed files, no churn | Broad diff, package/config churn, hard-to-review generated files |
| Depth appropriateness | Did it build the right amount of product surface? | Adds the smallest useful affordance/API/example for the prompt | Turns a first slice into an unnecessary client workflow, form system, or broad platform slice |
| Honesty | Does the final answer separate proven from unproven? | States verification and `Not verified` limits | Overclaims production readiness, AI quality, safety, or runtime behavior |
| Determinism | Is the first slice reproducible? | Fixture/local eval, no live provider required | Requires API keys, network, real user data, or live side effects |
| Repo fit | Does it fit the project stage? | Uses minimal local implementation when repo is early | Builds platform-level abstractions too early |

## Coding Rules And Principles

This is where Lumo should become especially useful.

A good harness does not just say:

```txt
Be careful.
Write clean code.
```

It should turn the repo's preferred behavior into concrete rails:

```txt
- Use the existing route response helper.
- Keep provider calls behind `src/lib/providers/*`.
- Do not introduce persistence in a first local slice.
- Prefer deterministic fixture tests before live API calls.
- Do not change package scripts unless the task is impossible without it.
- Final response must list changed files, verification, and not-verified items.
```

That means evals should check whether Codex or Claude Code:

- follows local naming and file-placement conventions;
- reuses existing boundaries instead of creating new ones;
- respects first-slice anti-scope;
- avoids touching risky seams just because they are nearby;
- uses repo-specific verification commands;
- explains uncertainty instead of smoothing it away.

## A Better Eval Than "Did It Work?"

For a Lumo eval, passing tests is necessary but not enough.

Example:

```txt
Task: add an AI-assisted intake endpoint.
```

A baseline run can pass and still be weaker if it:

- imports the OpenAI/provider seam for a deterministic first slice;
- changes package or build config unnecessarily;
- claims "production-ready AI" without live model evaluation;
- creates a broad abstraction before the use case is proven.

A Lumo run is stronger if it:

- keeps the first slice local and deterministic;
- uses the existing API route style;
- adds one fixture/example;
- runs the repo verification command;
- says what was not verified;
- leaves auth/db/provider/CRM seams for a later reviewed slice.

## Suggested Scoring

Use a simple 0-2 score per area.

| Score | Meaning |
| --- | --- |
| 0 | Failed or ignored |
| 1 | Partially followed |
| 2 | Clearly followed |

Recommended MVP scorecard:

| Area | Baseline | Lumo | Notes |
| --- | --- | --- | --- |
| Scope control |  |  |  |
| Pattern usage |  |  |  |
| Risk gates |  |  |  |
| Verification |  |  |  |
| Reviewability |  |  |  |
| Honesty |  |  |  |

Keep the first scorecard small. If everything matters, nothing matters.

The eval scripts currently generate an automated MVP scorecard for:

- scope control;
- risk gates;
- verification;
- reviewability;
- honesty.

Reviewability is intentionally based on both file count and diff size, but line
count is only a review-surface symptom. A run can touch more lines and still be
better if the extra code creates a clearer boundary or a real local proof. A run
can touch fewer lines and still be worse if it crosses risky seams or hides
unverified behavior.

Advanced Next.js cases also need a depth check: did the task actually require a
working browser form, client state, loading/error UI, and browser-to-route
`fetch`, or would a smaller visible affordance plus route/example have been the
right first slice?

Pattern usage and coding principles are intentionally left as manual review
items in v0. They require reading the diff against the fixture's local style and
boundaries.

## Minimum Evidence Standard

A comparison is strong enough to discuss publicly only when it can answer:

```txt
What did the harness change that a user would actually feel while reviewing the work?
```

Acceptable evidence:

- Lumo avoided a risky seam that baseline touched;
- Lumo produced a smaller or cleaner review surface;
- Lumo followed an existing repo pattern that baseline ignored;
- Lumo verified with the repo command while baseline only claimed completion;
- Lumo stated assumptions or not-verified items that baseline smoothed over.

Weak evidence:

- both runs pass tests;
- one run happens to have fewer lines but worse boundaries;
- the final answer sounds nicer but the diff is not better;
- the fixture is so small that the harness had nothing meaningful to shape.

## What Not To Score Yet

Do not overfit v0 evals around:

- subjective code beauty;
- broad architecture taste;
- perfect test coverage;
- production security claims;
- full AI-output quality;
- multi-agent strategy;
- Claude Code parity before Codex evals are stable.

Those may matter later, but the MVP should first prove that Lumo can make a
single agent run more bounded, reviewable, and honest.
