# Harness Map Slice

Status: PR 1 local v0.2 slice.

## Purpose

`harness-map` answers:

```txt
What does this agent already rely on?
```

It produces a deterministic, read-only card that maps repo rails, optional
explicit Codex/Agents home metadata, commands, skills, plugins, overlaps, gaps,
and privacy boundaries.

## Commands

```bash
npm run lumo -- harness-map --path fixtures/nextjs-dashboard-action-risk
npm run lumo -- harness-map --path fixtures/nextjs-dashboard-action-risk --format json
npm run lumo -- harness-map --path fixtures/nextjs-dashboard-action-risk --codex-home /tmp/fake-codex --agents-home /tmp/fake-agents
```

## Behavior

- Uses the existing `RepoScan` for repo docs, workflows, agent rules, scripts,
  risks, missing rails, and not-verified notes.
- Checks global/user layers only when `--codex-home`, `--agents-home`,
  `CODEX_HOME`, or `AGENTS_HOME` points to a readable directory.
- Reads only known metadata surfaces: `AGENTS.md` existence, skill directory
  names with `SKILL.md`, and `plugin.json` display/name fields.
- Never reads global `AGENTS.md` bodies, skill bodies, memory/session logs,
  `.env` values, arbitrary home files, or external systems.
- Does not write generated artifacts or target repo files.

## Status Rules

- `go`: repo has usable local rails, at least one verification command, and
  expected optional metadata layers were checked.
- `check_again`: map is useful but an expected layer or local rail is missing or
  not checked.
- `pause`: risky repo seams exist while provider/data/approval rails are
  missing.
- `pivot`: overlapping rule sources make the source of truth unclear enough to
  narrow the harness first.

## JSON Shape

```json
{ "repoPath": "...", "harnessMap": { "status": "check_again" } }
```

## Validation

Covered by unit tests in `src/harness-map.test.ts` and CLI tests in
`src/index-cli.test.ts`.
