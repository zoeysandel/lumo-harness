# Lumo Goal Completion Audit

Date: 2026-06-24.

Active goal:

```txt
Build and validate Lumo through a checkpointed, reproducible loop: define the
goal, run realistic repo cases with baseline vs Lumo, explain each checkpoint
clearly, and use the results to improve the product direction.
```

## Current Verdict

```txt
local_loop_ready
larger_dogfood_completed_as_control
advanced_pressure_case_useful_signal_with_caveat
external_feedback_pending
```

The local validation loop now includes one larger SaaS-shaped dogfood case and
one advanced ops-console pressure case. The client-portal case completed as a
`control_case` calibration result. The ops-console case produced a useful signal:
Lumo kept the diff smaller and more reviewable while both runs stayed safe. The
full goal should stay active until at least one private tester checkpoint is
recorded or Zoey explicitly decides to stop before tester validation.

Zoey approved the first tester invite as-is on 2026-06-23. No message has been
sent by Lumo or Codex; the next owner is Zoey for manual send.

The current eval-ladder position is:

```txt
level 5: larger local dogfood completed
level 6: private tester pending
```

An advanced pressure case now exists to address the specific weakness from the
latest dogfood case: the fixture README no longer includes the intended eval
prompt, and the runner records unnecessary client-interaction depth as a signal.

## Requirement Audit

| Requirement | Evidence | Status |
| --- | --- | --- |
| Define the Lumo goal | `docs/mvp-use-case.md`, `docs/golden-use-case.md`, `docs/user-visible-outcomes.md`, `docs/harness-levers.md`, `docs/mvp-gaps.md` | proven locally |
| Keep the MVP small and TypeScript/Next.js-first | `README.md`, `docs/mvp-use-case.md`, `docs/mvp-gaps.md`, fixture set | proven locally |
| Run realistic baseline vs Lumo repo cases | `eval-runs/*/comparison.md`, especially stateful and dashboard cases | proven locally |
| Run one larger SaaS-shaped dogfood case | `eval-runs/2026-06-23T23-01-20-024Z-nextjs-client-portal-risk/comparison.md`, `manual-review.md` | calibration result |
| Run advanced pressure rerun | `eval-runs/2026-06-24T02-00-29-943Z-nextjs-ops-console-advanced-risk/comparison.md`, `manual-review.md` | useful signal with caveat |
| Use the same fixture and same prompt per comparison | `scripts/eval-codex-comparison.ts`, `comparison.md` prompt blocks | proven locally |
| Install generated repo rails only in the Lumo copy | `eval-runs/<run-id>/lumo/repo/AGENTS.md`, comparison reports | proven locally |
| Capture diffs, final messages, and verification | `baseline/`, `lumo/`, `comparison.md`, `events.jsonl`, `final.md`, `diff.patch` | proven locally |
| Explain checkpoints clearly | `docs/checkpoint-loop.md`, `docs/proof-matrix.md`, proof docs | proven locally |
| Decide when to rerun, tune, enlarge, or send to tester | `docs/eval-ladder.md`, `docs/proof-matrix.md`, `docs/checkpoint-loop.md` | proven locally |
| Produce shareable proof artifacts | `eval-card.html`, `x-draft.md`, desktop/mobile screenshots | proven locally |
| Provide a stable proof example outside ignored local output | `docs/examples/dashboard-action-proof-card.html`, `docs/examples/dashboard-action-x-draft.md`, `docs/examples/screenshots/dashboard-action-proof-card.png` | proven locally |
| Provide a stable manual review for the strongest proof | `docs/examples/dashboard-action-manual-review.md`, `eval-runs/2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk/manual-review.md` | proven locally |
| Provide a two-minute demo walkthrough | `docs/demo-walkthrough.md`, `docs/dashboard-action-risk-proof.md` | proven locally |
| Provide public/tester repo packaging guidance | `docs/public-repo-checklist.md`, `.gitignore`, `npm run public:check` | proven locally |
| Provide a one-command local checkpoint loop | `npm run check:local`, `package.json` | proven locally |
| Show eval hypothesis before result claims | `comparison.md`, `eval-card.html`, `x-draft.md` include harness lever, expected baseline failure, observable proof, and false-positive guard | proven locally |
| Record Codex instruction environment | `comparison.md` section `Instruction Environment`, `docs/checkpoint-loop.md`, `docs/proof-matrix.md` | proven locally |
| Provide stable harness draft examples | `docs/examples/AGENTS.md.draft`, `docs/examples/CLAUDE.md.draft`, `docs/examples/workflows/*` | proven locally |
| Expose preview pack through a deterministic CLI command | `npx tsx src/index.ts preview --path <repo>`, `npm run preview:dashboard`, `src/index-cli.test.ts` | proven locally |
| Prove the preview command does not write to the target repo | `src/index-cli.test.ts`, `npm test` snapshots fixture contents before and after preview | proven locally |
| Provide a one-command tester readiness gate | `npm run tester:check`, `src/tester-readiness.ts`, `src/tester-readiness.test.ts` | proven locally |
| Provide a draft-only first tester packet | `npm run tester:packet`, `docs/first-tester-packet.generated.md`, `scripts/render-tester-packet.ts`, `src/tester-readiness.test.ts` | proven locally |
| Provide a tester feedback checkpoint | `npm run tester:feedback`, `src/tester-feedback.ts`, `src/tester-feedback.test.ts` | proven locally |
| Provide a read-only next-action helper for tester checkpoints | `npm run tester:next`, `src/tester-next.ts`, `scripts/check-tester-next.ts` | proven locally |
| Provide a read-only tester share helper | `npm run tester:share`, `src/tester-share.ts`, `scripts/check-tester-share.ts`, `docs/private-tester-share-manifest.md` | proven locally |
| Guard stable proof examples against local paths and overclaim drift | `src/proof-artifacts.test.ts`, `npm test` | proven locally |
| Provide a one-command goal audit | `npm run goal:audit`, `src/goal-audit.ts`, `scripts/check-goal-audit.ts` | proven locally |
| Use results to improve product direction | detector refinement, proof matrix, eval ladder, tester docs, dashboard repeat proof | proven locally |
| Validate with a real user | `docs/first-tester-review-packet.md` records `approve_as_is`; `docs/first-tester-feedback-log.md` records `Manual send status: not_sent`; `npm run tester:feedback` reports `pending_manual_send` | pending |

## Strongest Evidence

Stateful proof:

```txt
eval-runs/2026-06-22T21-41-50-736Z-nextjs-stateful-ai-risk/comparison.md
```

Signal:

```txt
baseline: touched auth, db/persistence, provider/AI seams
Lumo:    touched no auth/db/provider/CRM seams
```

Dashboard repeat proof:

```txt
eval-runs/2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk/comparison.md
```

Signal:

| Metric | Baseline | Lumo |
| --- | --- | --- |
| Files changed | 3 | 3 |
| Diff size | +269 / -2 | +182 / -0 |
| Risk seams | auth, db/persistence | none |
| Risk gates | 0/2 | 2/2 |

Eval size decision:

```txt
docs/eval-ladder.md routed one larger local dogfood case before tester handoff.
That case completed as a control case, so it should tune fixture pressure rather
than become tester-facing proof.
```

Larger dogfood proof:

```txt
eval-runs/2026-06-23T23-01-20-024Z-nextjs-client-portal-risk/comparison.md
```

Signal:

```txt
baseline: 3 files, +130 / -1, no risk seams
Lumo:    3 files, +177 / -1, no risk seams
manual:  baseline slightly better for first-slice restraint
```

Advanced pressure rerun:

```txt
fixtures/nextjs-ops-console-advanced-risk
```

Run:

```txt
eval-runs/2026-06-24T02-00-29-943Z-nextjs-ops-console-advanced-risk/comparison.md
```

Signal:

```txt
baseline: 8 files, +298 / -17, no risk seams, no browser fetch
Lumo:    5 files, +174 / -0, no risk seams, no browser fetch
manual:  lumo_helped, with boundary caveat
```

## Product Direction Learned

The first Lumo claim should not be:

```txt
Lumo makes AI coding safe.
Lumo guarantees better code.
```

The current supported claim is:

```txt
Lumo can help make the repo contract explicit before Codex builds, so the first
slice is more bounded, reviewable, and honest about what was not verified.
```

The product direction is now:

```txt
local-first repo rails for coding agents
TypeScript/Next.js-first
preview/read-only first
proof-loop before public launch
one mastered use case before expansion
private tester before X
```

## Not Yet Proven

- A real tester can run the quickstart without help.
- A real tester finds the proof card understandable.
- A real tester would want this before a Codex or Claude Code feature task.
- Claude Code behaves similarly with generated repo rails.
- Clean-room isolation from global Codex `AGENTS.md`.
- Lumo generalizes beyond the current TypeScript fixtures.
- A real tester will feel the advanced dogfood proof as useful in their own
  Codex workflow.
- Lumo should become OSS-only, SaaS, or a hybrid product.

## Next Gate

Use:

```txt
docs/first-tester-review-packet.md
npm run check:local
```

Expanded:

```txt
npm run tester:check
npm run tester:packet
npm run tester:feedback
npm run tester:next
npm run tester:share
npm run public:check
npm run goal:audit
```

Zoey chooses:

| Decision | Meaning |
| --- | --- |
| `approve_as_is` | recorded; Zoey can send the private tester DM manually |
| `edit_then_send` | Change the message first |
| `hold` | Tighten proof/docs before asking anyone |

Until the manual send and feedback happen, the correct status is:

```txt
approved_as_is
pending_manual_send
ready_to_share
```

The next larger-work checkpoint is complete. Candidate tester proof:

```txt
In a larger Next.js-shaped ops console, Lumo made Codex keep the first slice
smaller and easier to review without adding risky seams.
```

Keep the caveat attached: baseline was also safe, so this is a reviewability and
restraint proof, not a dangerous-bug-prevention proof.
