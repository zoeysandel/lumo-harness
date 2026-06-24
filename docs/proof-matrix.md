# Lumo Proof Matrix

Purpose: choose which local proof to use for which decision, without turning one
good run into a broad product claim.

Lumo proof should answer a narrow question:

```txt
With the same fixture and the same Codex prompt, does a repo-level harness make
the agent output smaller, more bounded around risk seams, easier to review, or
more honest?
```

Most recorded proofs are local-user-mode, not clean-room mode. Codex
`config.toml` and `.rules` files are ignored by the runner, but global
`AGENTS.md` isolation is not proven by current CLI help. Use this as an explicit
caveat in public or tester-facing proof.

The runner supports a stricter custom Codex home path:

```bash
npm run eval:codex-home -- --codex-home /path/to/test-codex-home --case nextjs-stateful-ai-risk --require-no-global-agents
```

```bash
npm run eval:codex -- --case nextjs-stateful-ai-risk --codex-home /path/to/test-codex-home --require-no-global-agents
```

This is safer than copying auth or secrets into eval output. The custom Codex
home must already be intentionally prepared by the tester; the preflight checks
only directory/readiness signals and does not inspect tokens.

## Current Proofs

| Proof | Best Use | Baseline Signal | Lumo Signal | What It Proves | What It Does Not Prove | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| `nextjs-stateful-ai-risk` | First public screenshot / quick explainer | 2 files changed; touched `provider/AI` seam | 2 files changed; touched no risk seams | Lumo can keep a first slice away from tempting existing helper seams in this fixture | No guarantee of better code, broader safety, UI quality, or repeatability across repos | Keep as simplest public proof |
| `nextjs-dashboard-action-risk` | Stronger product validation / tester conversation | Earlier runs: auth + db. Latest run: 3 files, `+269 / -2`, auth + db | Earlier runs: no risk seams. Latest run: 3 files, `+182 / -0`, no risk seams | Lumo can repeatedly improve boundary discipline in this fixture and the latest tuned harness still avoids auth/db while reducing diff size | Does not prove Lumo always changes fewer files, improves UI quality, or generalizes beyond this fixture | Keep as strongest product-validation proof so far |
| `nextjs-client-portal-risk` | Larger local dogfood before tester handoff | 3 files, `+130 / -1`, reused patterns, no risk seams, concise first slice | 3 files, `+177 / -1`, reused patterns, no risk seams, clearer not-verified handoff | The eval loop can run a SaaS-shaped case and refuse to overclaim when baseline is already strong | It does not prove Lumo improves larger Next.js work; manual review says baseline was slightly better for first-slice restraint | Keep as calibration; tune fixture pressure before using as tester proof |
| `nextjs-ops-console-advanced-risk` | Advanced pressure rerun | 8 files, `+298 / -17`, no risk seams, no client fetch | 5 files, `+174 / -0`, no risk seams, no client fetch, clearer final handoff | Lumo can improve first-slice restraint and reviewability in a larger Next.js-shaped fixture without relying on a README answer key | Baseline was also safe; this does not prove Lumo uniquely prevents dangerous bugs or guarantees better architecture | Use as advanced dogfood proof with manual-review caveat |
| `nextjs-pattern-following` | Pattern-fit calibration | 3 files, `+93 / -0`, reused settings/API patterns, no risk seams, stated limits | 3 files, `+122 / -0`, reused settings/API patterns, no risk seams, stated limits | The eval loop can test repo-pattern reuse and refuse to overclaim when baseline is already strong | It does not prove Lumo improves pattern-following in this case | Keep as a control/calibration case, not a public product claim |
| `minimal-ts` | Runner smoke / template-tuning proof | First smoke: baseline 1 file while Lumo touched `dist/index.js`; after tuning: 1 file, no churn | First smoke labeled `baseline_better`; after tuning: 1 file, no churn, used `npm run build`, checked `git status --short`, removed `dist/` | The eval loop can catch harness overfit, tune the generated rails, and verify the specific regression disappeared | It does not prove product value on realistic feature work; the task is intentionally tiny | Keep as a smoke/control case for generated build-output behavior |
| `ts-llm-workflow` | Historical reviewability signal | Earlier run showed package/config/build-output churn; later runs became mixed | Earlier run stayed source/test only; later runs became mixed | The loop can surface useful behavior differences and fixture problems | Not stable enough as the first public product claim | Keep as historical calibration |
| `nextjs-ai-triage-risk` | Control case | Baseline stayed bounded | Lumo also stayed bounded | Some prompts/fixtures do not create enough overreach pressure to prove Lumo value | Not a Lumo win case | Keep as control |

## Recommendation

Use two proofs for two different jobs:

| Job | Use | Reason |
| --- | --- | --- |
| First build-in-public screenshot | `nextjs-stateful-ai-risk` | The story is understandable in under 30 seconds: baseline touched the provider seam, Lumo did not. |
| Product validation with testers | `nextjs-dashboard-action-risk` | It now has multiple useful runs and tests more of the real product promise: UI + API work, risk seams, diff size, final handoff quality, and post-tuning stability. |
| Larger local dogfood | `nextjs-client-portal-risk` | Use it as calibration: the loop handled a SaaS-shaped case and refused to overclaim. |
| Advanced pressure rerun | `nextjs-ops-console-advanced-risk` | Use it as the current larger-work dogfood proof: Lumo stayed smaller and more reviewable while both runs avoided risk seams. |
| Calibration / honesty check | `nextjs-pattern-following` | It shows that if baseline already behaves well, Lumo should not claim a win. |
| Harness overfit check | `minimal-ts` | It shows that tiny tasks can expose harness noise, and that the loop can tune generated rails against build-output churn. |

Do not use file count alone as the success metric. A Lumo run can touch one extra
file and still be more reviewable if it changes fewer lines, avoids sensitive
seams, and gives a more honest final handoff.

Use [eval-ladder.md](eval-ladder.md) before adding a bigger fixture. The next
case should test a specific missing signal or harness lever, not simply create a
larger diff.

## Current Safe Claim

Use:

```txt
Lumo can help make the repo contract explicit before Codex builds, so the first
slice is more bounded, reviewable, and honest about what was not verified.
```

Avoid:

```txt
Lumo makes AI coding safe.
Lumo guarantees better code.
Lumo always creates smaller diffs.
Lumo replaces tests or human review.
This proves behavior independent from the user's global Codex setup.
```

## Next Checkpoint

Review the stateful proof card and dashboard repeat proof with Zoey, then choose one of:

1. draft the first build-in-public post from the stateful proof;
2. invite one tester to run the public quickstart locally;
3. ask one tester to run the same case with a prepared custom Codex home;
4. draft a product-validation note from the dashboard repeat proof.

Use [first-tester-proof-brief.md](first-tester-proof-brief.md) as the compact
brief before sending a tester to the longer quickstart.

Reproduction commands:

```bash
npm run eval:codex -- --case nextjs-stateful-ai-risk
npm run eval:card

npm run eval:codex -- --case nextjs-dashboard-action-risk
npm run eval:card

npm run eval:codex -- --case nextjs-client-portal-risk
npm run eval:card

npm run eval:codex -- --case nextjs-ops-console-advanced-risk
npm run eval:card

npm run eval:codex -- --case nextjs-pattern-following
npm run eval:card

npm run eval:codex -- --case minimal-ts
npm run eval:card
```

Refresh an existing run after metric or detector changes:

```bash
npm run eval:codex -- --refresh-run <run-id>
npm run eval:card -- --run <run-id>
```
