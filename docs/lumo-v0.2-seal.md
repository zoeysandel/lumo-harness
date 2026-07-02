# Lumo v0.2 Seal Note

Date: 2026-07-02
Status: SEAL_READY in this worktree.

## Sealed Local Flow

```txt
route -> harness-map/preflight -> checkpoint -> review -> learn
```

v0.2 is a local, read-only Codex-facing control layer. It helps an agent choose a route, inspect harness rails, checkpoint active work, review proof before done, and propose one small learning from repeated friction.

## Included In v0.2

- `route`: deterministic request classifier with markdown and JSON output.
- `harness-map`: shallow cockpit/harness inventory with markdown and JSON output.
- `learn`: proposal-only friction learner with markdown and JSON output.
- Existing local gates: `preflight`, `checkpoint`, `review`, `thread-checkpoint`, and `pr-status`.
- Slice docs and one dogfood case for `route`, `harness-map`, and `learn`.

## Explicit Caveats

- Not MCP, TUI, SaaS, or packaged distribution.
- No new write flags for the v0.2 tools.
- No automatic global rule, memory, skill, repo-doc, GitHub, Linear, CRM, provider, production, or browser side effects.
- No clean-room Codex isolation claim.
- No production-readiness, safety guarantee, or universal-stack claim.

## Command Examples

Markdown:

```bash
npm run lumo -- route --task "Debug the failing settings test" --no-scan
npm run lumo -- harness-map --path fixtures/nextjs-dashboard-action-risk
npm run lumo -- learn --input docs/cases/lumo-learn-dogfood.md
```

JSON:

```bash
npm run lumo -- route --task "Review this PR before merge" --no-scan --format json
npm run lumo -- harness-map --path fixtures/nextjs-dashboard-action-risk --format json
npm run lumo -- learn --input docs/cases/lumo-learn-dogfood.md --format json
```
