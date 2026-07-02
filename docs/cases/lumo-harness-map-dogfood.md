# Lumo Harness Map Dogfood

Date: 2026-07-02

## Command

```bash
npm run lumo -- harness-map --path fixtures/nextjs-dashboard-action-risk --format json
```

## Output Summary

The dogfood fixture maps as a useful but not fully sealed cockpit:

- repo scripts are detected, including the fixture verification command;
- repo docs are detected from `README.md`;
- global/user Codex and Agents homes are `not_checked` unless explicit fake home
  paths are supplied;
- the fixture contains auth, billing, provider, env, and API-route seams, so
  missing provider/data approval gates can move the card to `pause`;
- no writes are made to the fixture repo.

## Privacy Boundary Confirmed

`harness-map` may show names, paths, counts, and plugin manifest display names.
It must not render:

- global `AGENTS.md` bodies;
- skill bodies;
- memory/session transcripts;
- `.env` values;
- plugin implementation files;
- external system state.

## Not Verified

- No package script was executed by the command itself.
- No runtime, browser, provider, database, GitHub, Linear, or production state was
  inspected.
- Stale-signal buckets are intentionally empty in v1.
