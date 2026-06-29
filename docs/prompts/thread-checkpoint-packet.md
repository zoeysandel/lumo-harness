# Lumo Thread Checkpoint Packet Prompt

Use this prompt inside a Codex, Claude Code, Cursor, or other coding-agent
thread when the work has become long, unclear, or high-stakes enough that the
next move needs a steering checkpoint.

The output is meant to be piped into:

```bash
npm run lumo -- thread-checkpoint --stdin
```

## Prompt

````txt
Create a redacted Lumo Thread Checkpoint packet for the work in this thread.

Goal:
Help the user decide whether the current next move still follows from the
evidence.

Rules:
- Do not include secrets, raw PII, credentials, customer contact details, private
  message bodies, provider payloads, or unnecessary personal data.
- Separate proven facts from hypotheses.
- If a claim is plausible but not proven, put it under "What Stayed Unproven".
- Do not invent test results, runtime proof, issue state, PR state, or production
  evidence.
- If approval is needed before mutation, deploy, issue update, data change,
  provider call, or external side effect, make that explicit.
- Keep the packet concise enough for a user to understand in under two minutes.

Return exactly this Markdown shape:

# Lumo Thread Checkpoint Packet

Status: `go` | `check_again` | `pause` | `pivot`

Current framing: <one sentence describing what the thread currently appears to be solving>

## Original Framing

```txt
<the original ask or working theory, redacted if needed>
```

## What Was Proven

- <proven fact, with command/file/link summary if useful>
- <proven fact>

## What Stayed Unproven

- <claim that is still not proven>
- <missing proof, runtime evidence, or user decision>

## Drift Risk

<one short paragraph explaining where the thread may be drifting, over-claiming,
or solving the wrong problem>

## Recommendation

<the smallest safe next slice>

## User Decision

<the smallest decision or approval needed from the user, or "No user decision
needed yet">

## Not Verified

- <source not checked>
- <tool/system not queried>
- <risk that remains outside this thread>
````

## Local Use

Save the packet:

```bash
pbpaste > /tmp/lumo-thread-packet.md
npm run lumo -- thread-checkpoint --input /tmp/lumo-thread-packet.md
```

Or pipe it directly:

```bash
pbpaste | npm run lumo -- thread-checkpoint --stdin
```

Machine-readable:

```bash
pbpaste | npm run lumo -- thread-checkpoint --stdin --format json
```

## When To Use

- a long thread changed direction;
- the agent found evidence that contradicts the original framing;
- the next step would update an issue, PR, production system, CRM, provider, or
  other external state;
- the user needs a simple decision card instead of a long technical recap.

## What This Does Not Do

- It does not read the original thread by itself.
- It does not validate the packet against runtime state.
- It does not approve writes or side effects.
- It does not replace tests, code review, or production evidence.
