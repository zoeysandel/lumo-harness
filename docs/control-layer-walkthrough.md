# Lumo Control Layer Walkthrough

Status: dogfood walkthrough for Control Layer v0.

## What This Proves

This walkthrough shows how Lumo can sit between a user and a coding agent during
one normal software task.

It proves the product shape:

```txt
before coding -> steer work in progress -> review before done
```

It does not prove that Lumo can fully judge code quality, replace tests, or
guarantee that a coding agent made the best implementation choice.

## Example Task

Use a small, concrete task:

```txt
Add a small settings panel change. Keep the first slice reviewable and use the
repo's available verification command before claiming done.
```

For local dogfooding, run this against a fixture or a real repo:

```bash
npm run lumo -- preflight --path fixtures/nextjs-pattern-following --task "Add a small settings panel change. Keep the first slice reviewable and use the repo's available verification command before claiming done."
```

## Step 1: Preflight

Preflight is the "should the agent start, and how?" moment.

```bash
npm run lumo -- preflight --path <repo> --task "<task>"
```

Optional local Codex interpretation:

```bash
npm run lumo -- preflight --path <repo> --task "<task>" --with-codex
```

Expected output:

| Signal | Meaning |
| --- | --- |
| `go` | Start with a small first slice. |
| `check_again` | Read or prove one thing before coding. |
| `pause` | User decision needed before implementation. |
| `pivot` | The requested route is probably too broad or misframed. |

Good preflight output should tell the agent:

- which files or docs to inspect first;
- what route to take first;
- which verification command matters;
- when to stop and ask the user.

## Step 2: Agent Work

The coding agent then implements the smallest approved slice.

Lumo does not need to own the coding step. Codex, Claude Code, Cursor, or another
agent can do that work.

The important part is that the agent starts with a route, not a cold prompt.

## Step 3: Checkpoint

Checkpoint is the "are we still on course?" moment.

Run this after the agent has produced a first diff, or when a long task starts
to feel unclear:

```bash
npm run lumo -- checkpoint --path <repo> --task "<original task>"
```

Optional local Codex interpretation:

```bash
npm run lumo -- checkpoint --path <repo> --task "<original task>" --with-codex
```

Checkpoint reads git status and diff shape. It does not run tests or edit files.

Useful checkpoint outcomes:

| Status | User Meaning |
| --- | --- |
| `go` | Continue; the diff still looks small and aligned. |
| `check_again` | One proof/context check is needed before continuing. |
| `pause` | The diff touches a risky seam or needs user steering. |
| `pivot` | The current route is too broad for a calm review. |

## Step 4: Review

Review is the "can the agent responsibly claim done?" moment.

```bash
npm run lumo -- review --path <repo> --task "<original task>"
```

Optional local Codex interpretation:

```bash
npm run lumo -- review --path <repo> --task "<original task>" --with-codex
```

Review should not be treated as a full senior code review. It is a completion
gate. It checks whether the current diff and proof are good enough to present
the work as done.

Good review output should make this decision easy:

```txt
claim done, run one more check, pause for user review, or change route
```

## Minimal Dogfood Script

For one real task, use this pattern manually:

```bash
npm run lumo -- preflight --path <repo> --task "<task>"

# Let Codex/Claude/Cursor implement the smallest approved slice.

npm run lumo -- checkpoint --path <repo> --task "<task>"

# Run the repo verification command recommended by Lumo or the repo.

npm run lumo -- review --path <repo> --task "<task>"
```

## What To Look For

Lumo is useful when the coding agent's behavior becomes:

- smaller and easier to review;
- clearer about what is proven and not proven;
- more cautious around risky seams;
- better anchored to repo commands and local rules;
- easier for the user to steer without reading every technical detail.

## Current v0 Boundaries

Control Layer v0 is intentionally small:

- deterministic scan facts are the safety floor;
- `--with-codex` can clarify or tighten, but should not weaken stricter signals;
- no test command is run automatically;
- no files are written by `preflight`, `checkpoint`, or `review`;
- no session history, Linear, PR history, memory, or MCP context is used yet.

## Next Product Question

The next Lumo slice should answer:

```txt
Does this walkthrough make a real coding task calmer, smaller, and easier to
approve?
```

If yes, add the smallest next control surface. If no, improve the decision cards
before adding rulesets, a TUI, MCP, or more generated harness files.
