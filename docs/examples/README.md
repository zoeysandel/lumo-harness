# Lumo Example Proof Artifacts

These examples are stable docs artifacts copied from a local eval run. They let
a tester inspect the proof shape before running Codex locally.

They are examples, not fresh runtime proof. To reproduce the result, run:

```bash
npm run eval:codex -- --case nextjs-dashboard-action-risk
npm run eval:card
```

## Included

| File | Purpose |
| --- | --- |
| `AGENTS.md.draft` | Example Codex repo contract generated from the dashboard fixture scan |
| `CLAUDE.md.draft` | Example Claude Code adapter aligned with the same repo contract |
| `workflows/bugfix.md` | Example small bugfix workflow preview |
| `workflows/feature.md` | Example small feature workflow preview |
| `workflows/review.md` | Example code review workflow preview |
| `dashboard-action-proof-card.html` | Shareable proof card from the strongest current product-validation run |
| `dashboard-action-manual-review.md` | Human review of pattern fit and coding-principle tradeoffs for the same run |
| `dashboard-action-x-draft.md` | Draft-only X post text generated from the same run |
| `screenshots/dashboard-action-proof-card.png` | Static screenshot of the example proof card |

The proof card includes the eval hypothesis up front: user task, harness lever,
expected baseline risk, accepted proof, and the false positive to avoid.
The manual review covers the two areas the automated scorecard leaves to human
judgment: local pattern fit and coding principles.

## Source Run

Harness draft source:

```bash
npx tsx src/index.ts preview --path fixtures/nextjs-dashboard-action-risk
```

Proof card source:

```txt
2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk
```

Headline signal:

| Metric | Baseline | Lumo |
| --- | --- | --- |
| Files changed | 3 | 3 |
| Diff size | +269 / -2 | +182 / -0 |
| Risk seams | auth, db/persistence | none |
| Risk gates | 0/2 | 2/2 |

## Claim Boundary

This example supports a narrow claim:

```txt
Lumo can help make the repo contract explicit before Codex builds, so the first
slice is more bounded, reviewable, and honest about what was not verified.
```

It does not prove Lumo always improves code, makes AI development safe, works
the same way in Claude Code, or behaves independently from a user's global Codex
setup.

## Hygiene Check

The stable examples are covered by:

```txt
src/proof-artifacts.test.ts
```

That test checks that the example files exist, avoid local paths or secret-like
markers, and keep the hypothesis plus proof / non-proof boundary visible.
