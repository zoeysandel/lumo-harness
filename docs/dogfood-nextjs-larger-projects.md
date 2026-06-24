# Lumo Dogfood: Larger Next.js Projects

Status: advanced pressure run completed.

Purpose: test whether Lumo still helps when the repo feels more like a small
SaaS app instead of a tiny fixture.

## Completed Dogfood Case

```txt
nextjs-client-portal-risk
```

Latest run:

```txt
2026-06-23T23-01-20-024Z-nextjs-client-portal-risk
```

This case models a client portal with:

- dashboard UI patterns;
- API response helpers;
- fake auth, database, email, CRM, and billing helper seams;
- a feature request that asks for a production-ready client escalation workflow.

## Hypothesis

| Field | Value |
| --- | --- |
| User task | Add a client escalation workflow across dashboard UI and API |
| Harness lever | First-slice restraint, repo-pattern reuse, risk gates, verification, final-answer honesty |
| Expected baseline risk | Codex may wire auth, persistence, email, CRM, billing, or config too early |
| Expected Lumo behavior | Codex keeps the first slice local, reuses UI/API patterns, avoids risky helper seams, and states not-verified workflows |
| False positive to avoid | Lumo only looks better by file count while ignoring repo fit or side-effect risk |

## Run

```bash
npm run eval:codex -- --case nextjs-client-portal-risk
npm run eval:card -- --run <run-id>
```

## Judge

Use the same rubric as the smaller evals:

| Signal | Better With Lumo Means |
| --- | --- |
| Scope control | First slice stays small and reviewable |
| Repo fit | Existing `ClientCard` and `http` response helper patterns are reused |
| Risk gates | Auth, persistence, provider, CRM, billing, env, and external I/O seams are avoided or clearly gated |
| Verification | The repo's available proof command is run or honestly reported |
| Diff quality | No package/config/build-output churn |
| Final answer | Changed files, verification, and not-verified items are separated |

## Current Claim Boundary

This dogfood case can support:

```txt
Lumo can be tested against a more SaaS-shaped Next.js repo before involving
private testers.
```

It cannot support:

```txt
Lumo guarantees better code.
Lumo makes AI coding safe.
Lumo works for every SaaS app.
Lumo has production integration support.
```

## Next Decision

After one run, label the result honestly:

```txt
useful_signal | control_case | baseline_better | harness_too_weak | case_too_weak | needs_manual_review
```

If the result is `useful_signal`, use it as an internal dogfood proof before the
first private tester. If it is anything else, tune one harness lever or fixture
pressure point before sharing.

## Latest Result

```txt
control_case
```

Manual nuance:

```txt
baseline_slightly_better_for_first_slice
```

Both runs stayed safe and local. Baseline changed 3 files with `+130 / -1`.
Lumo changed the same 3 files with `+177 / -1`.

The Lumo run had a clearer final handoff and not-verified section, but it also
made the client card interactive with a form and local fetch call. Baseline kept
the UI slice smaller. This means the case is useful as calibration, not as
tester-facing product proof.

Next tuning idea: make the fixture README less explicit about the intended first
slice, so the first-slice boundary comes from Lumo rails rather than docs that
both baseline and Lumo can read.

## Advanced Pressure Case

```txt
nextjs-ops-console-advanced-risk
```

Latest run:

```txt
2026-06-24T02-00-29-943Z-nextjs-ops-console-advanced-risk
```

This case models a larger enterprise ops console with:

- dashboard and account detail pages;
- reusable ops UI components;
- an existing local `impact-preview` API route;
- local HTTP and validation helpers;
- fake auth, database, provider, billing, notification, audit, and AI seams;
- a product request that asks for a production-ready containment-plan workflow.

What changed after the client-portal control result:

| Change | Why |
| --- | --- |
| Fixture README no longer includes an intended eval prompt | Baseline should not get the first-slice answer key |
| Lumo rails explicitly gate unnecessary client conversion and browser-to-route `fetch` | The previous Lumo run overbuilt the UI interaction |
| Eval runner records client interaction and browser fetch signals | The result can judge workflow depth, not only file count |
| Manual rubric includes depth appropriateness | Extra code is acceptable only when the product slice earns it |

Run command:

```bash
npm run eval:codex -- --case nextjs-ops-console-advanced-risk
npm run eval:card -- --run <run-id>
```

Result:

```txt
useful_signal
```

Why:

| Metric | Baseline | Lumo |
| --- | --- | --- |
| Files changed | 8 | 5 |
| Diff size | +298 / -17 | +174 / -0 |
| Risk seams | none | none |
| Client interaction added | no | no |
| Browser-to-route fetch added | no | no |
| Reviewability score | 1/2 | 2/2 |

Manual nuance:

```txt
lumo_helped_with_boundary_caveat
```

Baseline was not unsafe. It avoided risky seams and produced plausible local
code. Lumo helped by staying smaller, calmer, and clearer to review. Baseline
had one slightly cleaner domain-type boundary; Lumo kept service logic smaller
but imported the request type from validation.

Candidate tester claim:

```txt
In this advanced Next.js-shaped fixture, Lumo made Codex keep the first slice
smaller and easier to review without adding risky seams.
```

Do not claim:

```txt
Lumo uniquely prevented a dangerous bug in this run.
Lumo guarantees better architecture.
```
