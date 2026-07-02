# Route Slice

Status: PR 2 local v0.2 slice.

## Purpose

`route` answers:

```txt
What mode is this request, and should Lumo do anything?
```

It produces a deterministic, read-only card that classifies a task into the
smallest useful operating mode and recommends the first Lumo tool, or stays
silent for tiny answer-only work.

## Commands

```bash
npm run lumo -- route --task "Explain how this helper works" --no-scan
npm run lumo -- route --path fixtures/nextjs-dashboard-action-risk --task "Debug the failing health check test"
npm run lumo -- route --path fixtures/nextjs-dashboard-action-risk --task "Review this PR before merge" --format json
npm run lumo -- route --task "Add a settings page" --no-scan --map /tmp/harness-map.json
```

## Behavior

- `--task` is required; missing or blank exits `2`.
- `--path <repo>` defaults to the current working directory unless `--no-scan` is
  set.
- `--no-scan` skips repo scanning and routes from the task only.
- `--map <file>` reads only minimal prior `harness-map --format json` context:
  status, gaps, overlaps, and not-verified notes.
- The classifier is deterministic and conservative; no LLM synthesis runs in
  v0.2.
- The command is read-only and does not write target repo files or query external
  systems.

## Modes

| Mode | First Lumo Move |
| --- | --- |
| `tiny_answer` | No tools; `surface: "silent"`. |
| `lightweight_patch` | Optional `preflight`, required `review`. |
| `standard_feature` | `preflight`; `harness-map` first when rails look unclear. |
| `bugfix_investigation` | `preflight`, then `checkpoint`, then `review`. |
| `long_agent_thread` | `thread-checkpoint`. |
| `pr_release` | `pr-status`. |
| `harness_improvement` | `harness-map`; optional `learn` after friction. |

## Status Rules

- `go`: the route is clear and no approval boundary is present.
- `check_again`: one context/tool pass is needed before implementation.
- `pause`: the task mentions production, auth, billing, database/migration,
  provider I/O, deploy, destructive action, external side effects, privacy, or
  PII.
- `pivot`: the task is too broad or outside v0.2, such as whole-app rewrites,
  MCP/SaaS buildout, or automatic global rule rewriting.

## JSON Shape

```json
{ "repoPath": "... or null", "task": "...", "route": { "mode": "tiny_answer" } }
```

## Validation

Covered by unit tests in `src/route.test.ts` and CLI tests in
`src/index-cli.test.ts`.
