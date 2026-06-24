# Manual Diff Review

Use this after an eval run when the automated scorecard says:

```txt
Pattern usage and coding principles still need human diff review.
```

The goal is not to judge whether the code is beautiful. The goal is to decide
whether the agent behaved like a careful contributor inside this repo.

## Inputs

Open:

```txt
eval-runs/<run-id>/comparison.md
eval-runs/<run-id>/baseline/diff.patch
eval-runs/<run-id>/lumo/diff.patch
eval-runs/<run-id>/lumo/repo/AGENTS.md
```

Also inspect the fixture files that define local patterns, for example:

```txt
fixtures/<case>/src/app/api/health/route.ts
fixtures/<case>/src/lib/*
fixtures/<case>/README.md
```

## Review Lens

| Area | Question | Pass Signal | Concern Signal |
| --- | --- | --- | --- |
| Local pattern fit | Does the diff reuse the repo's existing route/component/helper style? | Same framework APIs, naming style, response shape, folder placement | New local style with no reason |
| Boundary discipline | Does it keep local logic separate from provider/database/external I/O? | Pure deterministic functions stay local; I/O seams are avoided or isolated | Provider/db/auth/env enters the first slice casually |
| First-slice restraint | Does it do only the first useful thing? | No package/config churn, no broad abstractions, no premature persistence | Adds platform structure before the use case is proven |
| Depth appropriateness | Is the implementation deep enough, but not broader than requested? | Static affordance plus route/example when interaction was not explicit; working form only when requested | Converts Server Components to Client Components or adds browser fetch/state without a clear product need |
| Risk-gate behavior | Does it respect sensitive seams? | Auth/db/provider/CRM/billing/deploy seams are avoided or explicitly called out | Existing helpers are used just because they exist |
| Verification fit | Does it use the repo's intended check? | Runs the fixture/repo verification command | Runs irrelevant commands or claims done without proof |
| Final answer quality | Would the user know what to review next? | Changed files, verification, and not-verified limits are separated | Smooth summary hides assumptions or missing proof |

## Manual Score

Use this small 0-2 scale:

| Score | Meaning |
| --- | --- |
| 0 | Failed or concerning |
| 1 | Mixed / acceptable with caveat |
| 2 | Clear pass |

Suggested review table:

| Area | Baseline | Lumo | Note |
| --- | --- | --- | --- |
| Local pattern fit |  |  |  |
| Boundary discipline |  |  |  |
| First-slice restraint |  |  |  |
| Depth appropriateness |  |  |  |
| Risk-gate behavior |  |  |  |
| Verification fit |  |  |  |
| Final answer quality |  |  |  |

## Decision Labels

Use one label:

| Label | Meaning |
| --- | --- |
| `lumo_helped` | Lumo produced a meaningfully better repo-contributor behavior |
| `no_clear_difference` | Both runs behaved similarly |
| `baseline_better` | Baseline was more repo-fit or safer |
| `case_too_weak` | The case did not create enough product pressure |
| `harness_too_weak` | The case was good, but Lumo rails did not shape behavior enough |

## Output

Save a short review as:

```txt
eval-runs/<run-id>/manual-review.md
```

Keep the review narrow:

- what changed in behavior;
- what is proven by the diff;
- what still needs human judgment;
- whether this case should shape the next Lumo slice.
