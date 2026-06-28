# Lumo Preflight Slice

Status: approved first control-layer slice.

## Why This Slice

Preflight is the first moment where Lumo can act as a real layer between a user
and an AI coding agent.

It answers the question the user should not have to solve manually:

```txt
Given this task and this repo, what is the safest small route for the coding
agent to take first?
```

We start here because it is useful before any code is changed, easy to run from
Codex/Claude/Cursor, and small enough to validate without a TUI, SaaS, MCP
server, memory scan, Linear integration, or automatic file writes.

## Inputs

V1 uses only stable local inputs:

| Input | Why It Is Used |
| --- | --- |
| Task text | The user intent Lumo must route. |
| Repo scan | Stack, commands, existing rails, and risk seams. |
| Existing Lumo heuristics | Avoid duplicating scanner logic. |

V1 can run without model calls. Linear, session files, PR history, and memory are
later context layers.

`--with-codex` adds optional local Codex interpretation on top of the
deterministic scan. The deterministic card remains the safety floor: Codex may
make the route more cautious or clearer, but it should not weaken hard safety
signals around auth, billing, database, migrations, providers, env, deploy,
deletion, or external side effects.

## Command

```bash
lumo preflight --path <repo> --task "..."
```

Machine-readable output:

```bash
lumo preflight --path <repo> --task "..." --format json
```

Optional Codex interpretation:

```bash
lumo preflight --path <repo> --task "..." --with-codex
```

## Output

The output is a decision card, not a full analysis report.

| Field | Meaning |
| --- | --- |
| Status | `go`, `check_again`, `pause`, or `pivot`. |
| Why | Plain-language reason for the status. |
| Route | The recommended first route for the coding agent. |
| Context Needed | The next context the agent should read. |
| Checks | Verification commands or checks to run before claiming done. |
| Stop If | Conditions that require human review. |
| User Decision | The smallest decision needed from the user, if any. |

## Expected Small Result

For a normal TypeScript/Next.js feature task, Lumo should return:

```txt
Status: go or check_again
Route: make a small first slice, inspect local rules/files/tests first, then
verify with the narrowest available command.
```

For tasks that mention auth, billing, database, migrations, provider I/O, env,
deploy, deletion, or external side effects, Lumo should return:

```txt
Status: pause or check_again
Route: do read-only discovery first and ask for an explicit approval/decision
before implementation touches the risky seam.
```

## Test Plan

Use focused deterministic tests:

| Case | Expected Signal |
| --- | --- |
| Small UI/task on Next.js fixture | `go`, small-slice route, local commands listed. |
| Auth/billing/provider-like task | `pause` or `check_again`, risk stop conditions visible. |
| Missing task text | CLI exits with a clear error. |
| JSON format | Stable object that Codex/MCP can consume. |
| Optional Codex interpretation | Codex may enrich or tighten the card, but cannot lower the deterministic safety floor. |

## Non-Goals

- No repo writes.
- No model call required for the deterministic fallback.
- No Linear/PR/session/memory context yet.
- No TUI.
- No MCP server yet.
- No claim that the route is complete or correct.

## Acceptance

This slice is useful if a user can read the card in under 30 seconds and decide:

```txt
go ahead, check one thing first, pause for my decision, or change route.
```
