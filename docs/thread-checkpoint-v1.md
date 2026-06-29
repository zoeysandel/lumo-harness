# Thread Checkpoint v1

Status: minimal CLI slice implemented.

## Purpose

Thread Checkpoint helps a coding agent and user pause during or after a long
Codex/Claude/Cursor thread and answer:

```txt
Are we still solving the right problem, with the right evidence, in the right
next slice?
```

It is different from repo `checkpoint`.

| Command | Looks At | Best For |
| --- | --- | --- |
| `checkpoint` | Current repo git diff | In-progress implementation steering. |
| `thread checkpoint` | Thread summary, decisions, proof, blockers, claims | Long-running investigation or execution steering. |

## First Dogfood Case

Use [cases/tab-3017-thread-checkpoint.md](cases/tab-3017-thread-checkpoint.md)
as the first design target.

That case shows why thread checkpoint exists:

```txt
The code-risk was real, the incident was real, but the original causal framing
was wrong.
```

## Inputs

V1 starts simple. It does not have direct Codex app integration yet.

| Input | V1 Shape |
| --- | --- |
| Task or issue title | Text |
| Thread summary | Text or markdown packet |
| Evidence packet | Redacted facts, commands, links, outputs |
| Current intended next step | Text |
| Risk class | Optional text, inferred later |

Later, Lumo can read Codex threads directly through app/MCP tools.

## Command

```bash
npm run lumo -- thread-checkpoint --input <packet.md>
```

Machine-readable output:

```bash
npm run lumo -- thread-checkpoint --input <packet.md> --format json
```

## Output Card

Thread Checkpoint should return a decision card:

| Field | Meaning |
| --- | --- |
| Status | `go`, `check_again`, `pause`, or `pivot` |
| Current framing | What the thread appears to be solving |
| Evidence | What is actually proven |
| Not proven | Claims that must stay out of summaries/issues/fixes |
| Drift risk | Where the thread may be solving the wrong thing |
| Recommendation | The next safest slice |
| User decision | The smallest approval or steering choice needed |

## Status Guide

| Status | Use When |
| --- | --- |
| `go` | Evidence supports the current next step and risk is bounded. |
| `check_again` | One proof item is missing before continuing. |
| `pause` | User approval is required before mutation, production work, or external side effects. |
| `pivot` | The original framing no longer matches the strongest evidence. |

## Non-Goals For V1

- No automatic Linear updates.
- No production queries.
- No code edits.
- No provider calls.
- No raw transcript dump.
- No automatic memory or global rule updates.
- No guarantee that the thread reached the right conclusion.

## Acceptance Criteria

Thread Checkpoint v1 is useful if it can:

- separate proven facts from plausible hypotheses;
- flag when the issue framing should change;
- name the safest next slice;
- keep approval gates visible;
- produce a user-readable card in under one minute;
- avoid raw PII, secrets, provider payloads, and unnecessary technical noise.

## Example Output From TAB-3017

```txt
Status: pivot
Current framing: direct-send duplicate outbound.
Evidence: two outbound provider-sent rows are real; direct-send code-risk is
real; incident causality does not point to direct-send/chat-ui.
Not proven: direct-send caused this incident; user double-submit; scheduler as
definitive root cause.
Recommendation: reframe TAB-3017 and trace origin of outbound #1 before fixing.
User decision: approve Linear reframe; do not start fix yet.
```

## Product Note

This is where Lumo starts to feel less like generated rules and more like a
second set of eyes.

The feature is not "summarize my thread." The feature is:

```txt
tell me whether my current next move still follows from the evidence
```
