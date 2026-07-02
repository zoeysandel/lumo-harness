# Lumo Harness MVP Gaps

Status: local loop ready; v0.2 toolset frozen; first private tester still
pending.

Frozen v0.2 scope: [v0.2-scope.md](v0.2-scope.md).

This file is the public-repo readiness checklist. It should stay stricter than
the pitch: if something is only locally proven, say so.

## Current MVP Shape

```txt
TypeScript/Next.js first
Codex comparison first
preview/read-only first
Next.js quality bar first
one mastered use case before expansion
private tester before public X launch
```

## What Is Already Proved Locally

- Lumo can scan TypeScript repos and produce preview-only agent rails.
- Lumo can run baseline-vs-Lumo Codex evals against local fixtures.
- Lumo can capture diffs, final messages, event logs, run metadata, and comparison reports.
- Lumo can render a proof card and draft X post from an existing eval run.
- The eval runner records the instruction environment, including the local-user-mode caveat around possible global `AGENTS.md` influence.
- Existing run comparisons can be refreshed after detector/rubric changes with `npm run eval:codex -- --refresh-run <run-id>`.
- `npm run preview:dashboard` shows the preview pack contents without an API key or target repo writes.
- `src/index-cli.test.ts` snapshots the dashboard fixture before and after `preview`, so the read-only claim is covered by a regression test.
- Generated preview drafts include TypeScript/Next.js defaults, first-slice behavior, risk gates, and a final-response contract.
- Generated preview drafts now include a TypeScript/Next.js quality bar for ICE slice choice, separated responsibilities, pragmatic SOLID/DRY, dependency injection at risky boundaries, conditional repository/service patterns, and narrow tests/fixtures.
- Stable preview-pack examples exist under `docs/examples/`:
  - `AGENTS.md.draft`;
  - `CLAUDE.md.draft`;
  - `workflows/bugfix.md`;
  - `workflows/feature.md`;
  - `workflows/review.md`.
- The strongest product-validation run is:

```txt
2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk
```

Headline:

| Metric | Baseline | Lumo |
| --- | --- | --- |
| Files changed | 3 | 3 |
| Diff size | +269 / -2 | +182 / -0 |
| Risk seams | auth, db/persistence | none |
| Risk gates | 0/2 | 2/2 |

- Stable proof artifacts for that run exist:
  - `docs/examples/dashboard-action-proof-card.html`;
  - `docs/examples/dashboard-action-manual-review.md`;
  - `docs/examples/dashboard-action-x-draft.md`;
  - `docs/examples/screenshots/dashboard-action-proof-card.png`.
- The manual review records the human judgment layer that the automated scorecard leaves open: baseline was plausible, but crossed auth/db; Lumo stayed local and explicit about not-verified work.
- `docs/demo-walkthrough.md` gives a two-minute explanation for a call, tester intro, or build-in-public draft without turning it into a launch claim.
- `docs/public-repo-checklist.md` records what should be included in a public/tester repo and what must stay local or ignored.
- `docs/eval-ladder.md` routed the larger-work story through one advanced pressure rerun before using it with testers: `nextjs-ops-console-advanced-risk`.
- `fixtures/nextjs-ops-console-advanced-risk` exists as a larger Next.js ops-console case with dashboard/detail pages, local API patterns, validation helpers, and fake auth/db/provider/billing/notification/audit/AI seams. Its eval run completed with `useful_signal`.
- The current advanced dogfood run is:

```txt
2026-06-24T02-00-29-943Z-nextjs-ops-console-advanced-risk
```

Headline:

| Metric | Baseline | Lumo |
| --- | --- | --- |
| Files changed | 8 | 5 |
| Diff size | +298 / -17 | +174 / -0 |
| Risk seams | none | none |
| Client interaction | no | no |
| Reviewability | 1/2 | 2/2 |

Manual review label:

```txt
lumo_helped
```

Claim boundary: Lumo improved reviewability and first-slice restraint here.
Baseline was also safe, so this is not a dangerous-bug-prevention proof.

## Tester Loop Status

Local tester gates:

```bash
npm run check:local
```

Expanded:

```bash
npm run tester:check
npm run tester:packet
npm run tester:feedback
npm run tester:next
npm run tester:share
npm run public:check
npm run goal:audit
```

Current status:

```txt
approved_as_is
pending_manual_send
ready_to_share
```

Already present:

- `docs/lumo-v0-test-brief.md`;
- `docs/first-tester-proof-brief.md`;
- `docs/public-tester-quickstart.md`;
- `docs/first-tester-invite-draft.md`;
- `docs/first-tester-review-packet.md`;
- `docs/first-tester-feedback-log.md`;
- `docs/private-tester-share-manifest.md`;
- `docs/first-tester-packet.generated.md`;
- `npm run tester:next`, a read-only helper that tells Zoey exactly what to update after manually sending the invite.
- `npm run tester:share`, a read-only pre-send gate that prints the exact minimum share set and keep-local list.
- `npm run public:check`, a read-only packaging gate for tester snapshots or a future public repo.
- `npm run goal:audit`, a read-only summary gate for local readiness versus external feedback.

Nothing has been sent by Lumo or Codex. The next external step belongs to Zoey.

## MVP Promise

```txt
Make the repo contract explicit before Codex or Claude Code builds.
```

Good first claim:

```txt
Lumo helps make agent work smaller, more reviewable, and easier to prove.
```

More precise current claim:

```txt
Lumo can help make the first TypeScript/Next.js agent slice more bounded,
reviewable, and honest about what was not verified.
```

Avoid:

```txt
Lumo makes AI code safe.
Lumo guarantees better output.
Lumo replaces tests or human review.
Lumo works for every stack already.
```

## Remaining Gaps Before Public Launch

| Gap | Status | Next Evidence |
| --- | --- | --- |
| First real tester | pending | Zoey manually sends the approved invite and records summarized feedback |
| Reproducibility by someone else | pending | Tester runs one eval or records setup blocker |
| Product pull | pending | Tester says whether they would use this before a real Codex/Claude feature task |
| Quality bar in larger repo usage | useful signal with caveat | `nextjs-client-portal-risk` ran as a control case; `nextjs-ops-console-advanced-risk` produced a smaller Lumo diff with no extra risk seams, but baseline was also safe |
| Public repo packaging | locally documented | Use `docs/public-repo-checklist.md`; do not publish yet |
| Claude Code parity | not in MVP | Later eval path after Codex loop is tester-proven |
| Clean-room Codex isolation | not proven | Optional custom `CODEX_HOME` preflight; no global `AGENTS.md` required |
| Applying harness files to real repos | not in MVP | Preview-only until tester feedback justifies apply mode |
| Public X post | hold | Wait for first private tester or explicit Zoey decision |

## Not In MVP

- TUI.
- SaaS.
- Auth/license gate.
- MCP server.
- Multi-language support.
- Claude Code eval parity.
- Applying generated harness files to real repos.
- Global `~/.codex` / `~/.agents` analysis.
- Clean-room isolation from global Codex `AGENTS.md`.
- Claims about safety, correctness, or production readiness.

## Next Best Slice

```txt
Send one private tester invite manually.
Record summarized feedback without raw private messages.
Use tester feedback to choose one:
expand_to_3_testers | tighten_docs | tighten_eval | pause_public_story
```

Use `nextjs-ops-console-advanced-risk` as the current larger-work dogfood proof
only with its manual-review caveat: smaller and calmer, not uniquely safer.

## Tools-First Before MCP

The next validation layer is not an MCP server. It is proving which Lumo tools
are useful enough that an MCP server would simply expose them cleanly.

Minimum useful tool set to dogfood first:

| Tool | Status | Next Proof |
| --- | --- | --- |
| `route` | missing | Choose the operating mode for a normal Codex request and reduce manual goal/loop/checkpoint setup |
| `preflight` | local v0 | Use before a real Codex/Claude task and record whether it changed the route |
| `checkpoint` | local v0 | Use during an active diff/thread and record whether it prevented drift or overclaim |
| `review` | local v0 | Use before done/PR and record whether it separated proof from assumptions |
| `thread-checkpoint` | dogfooded | Keep using on long delegated threads with heartbeat monitoring |
| `pr-status` | local v0 | Use [cases/linkwise-release-pr-status-dogfood.md](cases/linkwise-release-pr-status-dogfood.md) as the first contract target; dogfood against real PRs to see whether it keeps checks, findings, merge policy, deploy, and runtime truth separate |
| `harness-map` | missing | Inventory Zoey's real global/repo/skills/plugins/memory setup before turning it into automation |
| `learn` | manual note once | Start with after-action notes like the Linkwise release dogfood before auto-proposing harness updates |

MCP should wait until `route`, `harness-map`, and `learn` are built and the full
v0.2 control-layer path has been dogfooded enough to know its stable contracts.
