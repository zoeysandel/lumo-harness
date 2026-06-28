# Lumo Checkpoint Slice

Status: accepted second control-layer slice.

## Why This Slice

Checkpoint is Lumo's dynamic steering moment during agent work.

It answers:

```txt
Given the original task and the current repo changes, should the coding agent
continue, check one thing first, pause for the user, or change route?
```

Unlike preflight, checkpoint looks at work already in progress.

## Command

```bash
lumo checkpoint --path <repo> --task "original task"
```

Machine-readable output:

```bash
lumo checkpoint --path <repo> --task "original task" --format json
```

Optional Codex interpretation:

```bash
lumo checkpoint --path <repo> --task "original task" --with-codex
```

The deterministic git-state card remains the safety floor. Codex may explain or
tighten the steering decision, but should not weaken hard safety signals or turn
a broad/risky diff into `go`.

## V1 Inputs

| Input | Why It Is Used |
| --- | --- |
| Original task | Keeps the checkpoint anchored to the intended outcome. |
| Repo scan | Reuses stack, commands, rails, and risk seams. |
| `git status --short` | Shows whether work is in progress. |
| `git diff --name-only` | Shows which files changed. |
| `git diff --stat` | Gives a quick review-surface signal. |

V1 does not inspect session files, Linear, PR history, or live Codex events. It
does not run tests or mutate the repo. `--with-codex` adds optional local model
interpretation on top of the deterministic git-state card.

## Statuses

| Status | Meaning |
| --- | --- |
| `go` | The current change still looks small and on course. |
| `check_again` | One proof/context check is needed before continuing. |
| `pause` | The user should steer before more implementation work. |
| `pivot` | The current route looks too broad or no longer aligned with a small slice. |

## Expected V1 Behavior

| Case | Expected Signal |
| --- | --- |
| No git repo or no changes | `check_again`: nothing reliable to inspect yet. |
| 1-3 normal files changed | `go`: continue and verify before done. |
| More than 5 files changed | `check_again`: review surface is growing. |
| Risky files changed | `pause`: user should approve the risky seam or narrow scope. |
| Very broad multi-area diff | `pivot`: route/scope likely needs to be reset. |

## Risky File Signals

Checkpoint v1 treats these as risky path signals:

- auth/session/security;
- billing/payment;
- database/migration/schema;
- provider/API/webhook/email/notification/CRM;
- env/secrets/deploy/config;
- destructive/delete/purge behavior.

These signals do not prove danger. They tell Lumo when a user steering moment is
probably warranted.

## Non-Goals

- No code edits.
- No test execution.
- No live agent control.
- No session-history parsing.
- No Linear or PR context.
- No model call required for the deterministic fallback.
- No custom ruleset engine yet.
- No final code review.

## Acceptance

Checkpoint v1 is useful if it can read the current repo changes and produce a
card that helps the user decide:

```txt
continue, check one thing first, pause, or pivot.
```
