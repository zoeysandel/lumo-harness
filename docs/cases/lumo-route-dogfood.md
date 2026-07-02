# Lumo Route Dogfood

Date: 2026-07-02
Slice: Lumo v0.2 PR 2 — `route` v1

## Goal

Prove that `route` can act as the local front door for normal Codex work without
adding ceremony to tiny answer-only requests.

## Commands Run

```bash
npm run lumo -- route --no-scan --task "Explain how this helper works" --format json
npm run lumo -- route --path fixtures/nextjs-dashboard-action-risk --task "Debug the failing health check test"
npm run lumo -- route --path fixtures/nextjs-dashboard-action-risk --task "Review this PR and check CI before merge" --format json
```

## Observed Output Summary

- Tiny answer routes to `mode: "tiny_answer"`, `surface: "silent"`, and no
  recommended tools.
- Bugfix investigation routes to a compact card and recommends `preflight`, then
  `checkpoint`, then `review`.
- PR/release work routes to `pr_release` and recommends `pr-status`.

## Privacy And Side-Effect Boundary

- No LLM synthesis was used.
- No package scripts were executed by route itself.
- No files were written to the target fixture repo.
- No GitHub, browser, database, provider, production, or external system state
  was queried.

## Not Verified

- Deterministic heuristics are intentionally conservative and not a complete
  natural-language classifier.
- `--map` consumes only minimal harness-map context; it does not validate a full
  harness-map schema.
- Route does not prove implementation safety; it selects the next local control
  layer step.

## Decision

PR 2 is useful as the v0.2 front door when tests pass: Codex can call `route`
first, stay silent for tiny work, and use the recommended Lumo card only when it
changes the next decision.
