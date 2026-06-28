# Lumo Review Slice

Status: accepted third control-layer slice.

## Why This Slice

Review is Lumo's acceptability moment after a coding agent thinks work is done.

It answers:

```txt
Given the original task and current diff, is it responsible to present this as
done, or is one more check, user decision, or route change needed?
```

Review is not a full senior code review. It is a decision card for whether the
agent can claim completion.

## Command

```bash
lumo review --path <repo> --task "original task"
```

Machine-readable output:

```bash
lumo review --path <repo> --task "original task" --format json
```

Optional Codex interpretation:

```bash
lumo review --path <repo> --task "original task" --with-codex
```

## V1 Inputs

| Input | Why It Is Used |
| --- | --- |
| Original task | Keeps review anchored to the intended outcome. |
| Repo scan | Reuses stack, commands, rails, and risk seams. |
| Git status/name/stat | Shows review surface and touched files. |
| Limited git diff text | Detects test files, TODO markers, `any`, and generated-output hints. |

V1 does not run tests, inspect Linear, inspect PRs, or prove runtime behavior.
`--with-codex` adds optional local model interpretation on top of deterministic
signals.

## Statuses

| Status | Meaning |
| --- | --- |
| `go` | It is reasonable to present this as done, with stated caveats. |
| `check_again` | One proof item is missing before claiming done. |
| `pause` | The user should accept risk/scope before completion is claimed. |
| `pivot` | The solution likely does not fit the original task or is too broad. |

## Expected V1 Behavior

| Case | Expected Signal |
| --- | --- |
| Small diff plus test file touched | `go` or `check_again` depending on verification evidence. |
| No changes | `check_again`: nothing to review. |
| Risky files changed | `pause`: user must accept risk/scope. |
| Very broad diff | `pivot`: review surface is too wide for a simple done claim. |
| No tests/verification evidence | `check_again`: run or document proof before done. |

## Non-Goals

- No code edits.
- No automatic test execution.
- No security audit.
- No PR review comments.
- No approval stamp.
- No guarantee that the code is correct.

## Acceptance

Review v1 is useful if it can help the user decide:

```txt
claim done, run one more check, pause for risk/scope review, or change route.
```
