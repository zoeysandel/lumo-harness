# Tiny Lumo Demo Flow

Status: private tester demo flow. Keep this local-first and read-only.

This is the smallest practical way to show Lumo as a second set of eyes for
Codex or Claude Code agent work.

```txt
preflight -> agent work -> thread-checkpoint -> review
```

## 1. Preflight

Before the coding agent starts, ask Lumo for the route:

```bash
npm run lumo -- preflight --path fixtures/nextjs-pattern-following --task "Add a small settings panel change. Keep the first slice reviewable and use the repo's available verification command before claiming done."
```

Look for:

- `go`, `check_again`, `pause`, or `pivot`;
- the first files or docs the agent should inspect;
- the likely verification command;
- stop conditions for risky seams or wider scope.

What this proves:

```txt
The agent does not need to start cold.
```

## 2. Agent Work

Let Codex, Claude Code, Cursor, or another coding agent implement only the
smallest approved slice.

Lumo does not own this step. It should make the agent's route clearer, not
replace the agent.

## 3. Thread Checkpoint

Use this when the thread gets long, evidence shifts, or the next action feels
risky.

First ask the coding agent to create a redacted packet with:

```txt
docs/prompts/thread-checkpoint-packet.md
```

Then pipe the packet into Lumo:

```bash
pbpaste | npm run lumo -- thread-checkpoint --stdin
```

Look for:

- whether the next move still follows from the evidence;
- what is proven;
- what is not verified;
- the smallest user decision or approval needed.

What this proves:

```txt
A long agent thread can become one steering card instead of a wall of context.
```

## 4. Review

Before the agent claims done, ask Lumo to inspect the current diff shape:

```bash
npm run lumo -- review --path <repo> --task "<original task>"
```

Look for:

- whether it is reasonable to claim done;
- whether one more check is needed;
- whether the work should pause for user review;
- whether the route should change.

What this proves:

```txt
Done should mean changed, checked, and honest about the remaining proof gap.
```

## Demo Boundary

This flow does not:

- run tests automatically;
- read private agent threads directly;
- read production, CRM, provider, Linear, or deploy state by itself;
- write files through `preflight`, `checkpoint`, `thread-checkpoint`, or
  `review`;
- approve external side effects.

## Best First Tester Question

Ask the tester:

```txt
Would this make you more willing to let Codex or Claude Code work on a real repo
task, because the next decision is smaller and clearer?
```
