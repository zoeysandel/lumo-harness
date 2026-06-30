# TAB-3017 Thread Checkpoint Dogfood Run

Status: completed local dogfood run.

## What Dogfood Means Here

Dogfooding means using Lumo on our own real agent work before asking testers or
users to trust it.

This is not a polished demo. The goal is to answer:

```txt
Does Lumo help us steer a real Codex thread more calmly and honestly?
```

## Case

We used the existing TAB-3017 Codex thread because it had the right shape:

- long-running investigation;
- production/read-only evidence;
- a real pivot from the original issue framing;
- clear separation between code-risk and incident-proof;
- no need for new production mutation.

Related design-target doc:

- [tab-3017-thread-checkpoint.md](tab-3017-thread-checkpoint.md)

## Dogfood Flow

| Step | What Happened |
| --- | --- |
| 1 | Sent the Lumo packet prompt into the existing TAB-3017 Codex thread. |
| 2 | The thread returned a redacted `Lumo Thread Checkpoint Packet`. |
| 3 | Piped the packet into `npm run lumo -- thread-checkpoint --stdin`. |
| 4 | Lumo returned `Status: pivot`. |
| 5 | The first run exposed parser papercuts in Lumo itself. |
| 6 | Fixed the parser and reran the packet successfully. |

## Packet Prompt Used

Prompt source:

- [../prompts/thread-checkpoint-packet.md](../prompts/thread-checkpoint-packet.md)

The prompt asked the existing thread to return:

- current framing;
- original framing;
- proven facts;
- unproven claims;
- drift risk;
- recommendation;
- user decision;
- not verified.

## Lumo Output

Expected steering outcome:

```txt
Status: pivot
```

Why:

```txt
The direct-send code-risk was real, but the production incident evidence pointed
away from direct-send/chat-ui and toward campaign/scheduler or webhook/recovery
paths.
```

The useful user decision was:

```txt
Zoey needs to approve any Linear update, production mutation, provider call,
code fix, deploy, migration, or external side effect. No approval is needed for
another read-only redacted proof pass.
```

## Papercuts Found

The first dogfood run proved the flow worked, but also found two product bugs:

| Papercut | Impact | Fix |
| --- | --- | --- |
| Lumo preserved status/evidence but replaced the packet's `Recommendation` and `User Decision` with generic fallback text. | The steering card became less useful than the source packet. | Preserve prose from `## Recommendation` and `## User Decision` sections. |
| Lumo replaced packet-specific `Not Verified` bullets with only generic Lumo boundaries. | The card lost important unresolved evidence gaps. | Merge packet-specific `Not Verified` bullets with Lumo's own boundary warnings. |

Fix commit:

```txt
546ce7f Preserve thread checkpoint packet sections
```

## Final Shape After Fix

After the fix, Lumo preserved:

- `Status: pivot`;
- current framing;
- proven facts;
- unproven claims;
- packet-specific drift risk;
- packet-specific recommendation;
- packet-specific user decision;
- packet-specific not-verified bullets;
- Lumo's own boundary warning that it inspected only the supplied packet.

## Validation

Local validation after the dogfood fix:

```txt
npm run check:local -> pass
tests -> 93 pass
```

## What This Proves

- The agent-packet to Lumo-card flow is usable.
- Thread Checkpoint can surface a real `pivot` decision from a long thread.
- Dogfooding is valuable because it found a real Lumo implementation gap.
- The output can help Zoey decide whether to continue, check again, pause, or
  pivot without reading the whole thread.

## What This Does Not Prove

- Lumo did not independently read production, Linear, git, provider logs, or the
  original thread.
- Lumo did not prove the root cause of TAB-3017.
- Lumo did not update Linear or approve any fix.
- Lumo did not guarantee the agent packet was complete or correct.

## Next Choice For Zoey

The next decision is not a code decision yet.

Choose the next dogfood case:

| Option | Best When |
| --- | --- |
| Another known incident thread | We want a second regression-style proof case. |
| A live current Codex task | We want to test whether Lumo helps while work is still moving. |
| A tester-facing TypeScript/Next.js task | We want to see whether the value is understandable outside Zoey's own workflow. |

Recommendation:

```txt
Use one live current Codex task next.
```

Reason:

```txt
TAB-3017 proves Lumo can recognize a known pivot. A live task tests whether Lumo
helps before the right answer is already known.
```
