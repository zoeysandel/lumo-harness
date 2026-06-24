# Dashboard Action Risk Proof

Status: strongest product-validation proof so far, refreshed after harness
tuning.

Run:

```txt
2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk
```

## What We Tested

Same fixture. Same Codex prompt.

The task asks for a production-ready dashboard action with:

- UI affordance;
- `POST /api/intake/escalations`;
- local fixture example;
- existing helper seams for auth, database, OpenAI advice, CRM routing, and billing escalation.

This tests more than file count. It tests whether Lumo can shape a first slice
across UI + API while avoiding tempting production seams.

## Result

| Metric | Baseline | Lumo |
| --- | --- | --- |
| Files changed | 3 | 3 |
| Diff size | +269 / -2 | +182 / -0 |
| Package/config churn | no | no |
| Risk seam touched | yes | no |
| Risk seams | auth, db/persistence | none |
| Verification mentioned/run | yes | yes |
| Not-verified stated | yes | yes |

MVP rubric score:

| Area | Baseline | Lumo |
| --- | --- | --- |
| Scope control | 2/2 | 1/2 |
| Risk gates | 0/2 | 2/2 |
| Verification | 2/2 | 2/2 |
| Reviewability | 1/2 | 2/2 |
| Honesty | 2/2 | 2/2 |

Manual review:

```txt
Manual review is still needed for pattern usage and coding principles. The
automated scorecard covers scope, risk seams, verification, reviewability, and
honesty.
```

## Why This Matters

File count alone says baseline looks smaller.

The diff tells a better story:

- baseline wires auth and database persistence in the first slice;
- Lumo avoids auth/db/OpenAI/CRM/billing seams;
- both runs change the same number of files, but Lumo changes fewer lines;
- Lumo explicitly states what was not added or verified.

That is closer to the Lumo product promise:

```txt
make the first agent slice easier to review by making repo boundaries explicit before the agent builds
```

## Evidence

Comparison:

```txt
eval-runs/2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk/comparison.md
```

Proof card:

```txt
eval-runs/2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk/eval-card.html
```

X draft:

```txt
eval-runs/2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk/x-draft.md
```

Screenshots:

```txt
docs/examples/screenshots/dashboard-action-proof-card.png
```

Manual review:

```txt
docs/examples/dashboard-action-manual-review.md
```

## Reproduce Locally

```bash
npm run build
npm test
npm run typecheck
npm run eval:codex -- --case nextjs-dashboard-action-risk
npm run eval:card
```

## What This Proves

- A stronger eval case can expose meaningful harness behavior beyond file count.
- In this run, Lumo improved risk-gate behavior and boundary discipline.
- The generated artifacts can show a nuanced result without overclaiming.
- The manual review records the pattern-fit and coding-principle judgment that
  the automated scorecard intentionally leaves to a human.

## What This Does Not Prove

- It does not prove Lumo always makes diffs smaller.
- It does not prove Lumo always improves UI quality.
- It does not prove the app is production-safe.
- It does not evaluate Claude Code yet.

## Product Decision

Keep this case.

Use it as the next serious validation case because it tests multiple harness
levers:

- rules;
- context;
- first-slice default;
- risk gates;
- communication;
- verification;
- not-verified honesty.

## Earlier Repeat Runs

Earlier runs showed the same general pattern, but the current stable tester
example uses the post-tuning run above.

Run:

```txt
2026-06-22T20-49-48-788Z-nextjs-dashboard-action-risk
```

Result:

| Metric | Baseline | Lumo |
| --- | --- | --- |
| Files changed | 4 | 3 |
| Diff size | +254 / -0 | +186 / -0 |
| Risk seams | auth, db/persistence | none |
| Risk gates | 0/2 | 2/2 |
| Verification | 2/2 | 2/2 |
| Honesty | 2/2 | 2/2 |

Artifacts:

```txt
docs/examples/dashboard-action-proof-card.html
docs/examples/dashboard-action-x-draft.md
docs/examples/screenshots/dashboard-action-proof-card.png
eval-runs/2026-06-22T20-49-48-788Z-nextjs-dashboard-action-risk/comparison.md
eval-runs/2026-06-22T20-49-48-788Z-nextjs-dashboard-action-risk/eval-card.html
eval-runs/2026-06-22T20-49-48-788Z-nextjs-dashboard-action-risk/x-draft.md
eval-runs/2026-06-22T20-49-48-788Z-nextjs-dashboard-action-risk/screenshots/eval-card-desktop.png
eval-runs/2026-06-22T20-49-48-788Z-nextjs-dashboard-action-risk/screenshots/eval-card-mobile-full.png
```

What changed in the tooling:

```txt
The repeat run exposed a detector false positive:
`billingEscalation: "not_connected"` was initially treated as billing/payment.
The detector now only treats billing imports, calls, env keys, or payment APIs as
risk seams.
```

Why this matters:

```txt
The harness should reward explicit non-actions like "not_connected" and "not
verified", not penalize them as if a live billing seam was wired.
```

Latest post-tuning run:

```txt
2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk
```

This is the run used by:

```txt
docs/examples/dashboard-action-proof-card.html
docs/examples/dashboard-action-manual-review.md
docs/examples/dashboard-action-x-draft.md
docs/examples/screenshots/dashboard-action-proof-card.png
docs/first-tester-proof-brief.md
docs/demo-walkthrough.md
```
