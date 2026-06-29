# TAB-3017 Thread Checkpoint Case

Status: redacted internal dogfood case.

## Why This Case Matters

TAB-3017 is the first strong example of Lumo as a thread checkpoint instead of a
repo-init helper.

The coding agent did useful work, but the important product value was not code.
The value was steering:

```txt
do not turn a proven incident into the wrong fix route
```

This is the kind of moment where a user needs a decision card, not a giant
technical transcript.

## Thread Shape

| Moment | What Happened |
| --- | --- |
| Initial framing | The issue was framed as possible direct-send duplicate outbound. |
| Code investigation | Repo evidence proved a real direct-send pre-provider idempotency gap. |
| Production proof | Read-only production evidence proved two outbound rows with distinct provider ids. |
| Reframe | The specific incident did not support direct-send/chat-ui as the cause. |
| Decision | Reframe TAB-3017 and keep direct-send idempotency as a separate code-risk. |

## Original Framing

```txt
Direct-send can possibly cause duplicate outbound messages without
provider-boundary idempotency.
```

This was a reasonable starting hypothesis, but it mixed two different truths:

- a code-level risk in direct-send;
- an incident-level duplicate outbound event.

## Evidence Captured

Redacted production facts:

| Fact | Status |
| --- | --- |
| One conversation had two outbound `initial_message` rows | proven |
| Both outbound rows had provider id presence | proven |
| Provider ids were distinct | proven |
| Inbound reply happened later in the window | proven |
| Matching `act_as_message_sent` audit rows | `0` |
| One `send_message` scheduled action matched the second outbound | proven |
| A later scheduled send was cancelled after inbound reply | proven |
| First outbound origin | UNCONFIRMED |

Thread-safe timestamps:

```txt
Window: 2026-06-26T08:40:00Z -> 2026-06-26T11:05:00Z
Outbound #1: 2026-06-26T08:51:01.910Z
Outbound #2: 2026-06-26T09:13:50.126Z
Inbound reply: 2026-06-26T10:50:38.144Z
```

## Lumo Checkpoint

| Field | Decision |
| --- | --- |
| Status | `pivot` |
| Why | The original issue framing no longer matched the strongest evidence. |
| Evidence | Real duplicate provider-sent rows were proven, but not direct-send/chat-ui causality. |
| Risk | Fixing direct-send first could miss the incident path. |
| Recommendation | Reframe TAB-3017 around campaign/scheduler/provider-webhook origin proof. |
| User choice | Approve Linear reframe before any fix-slice. |

## What Was Proven

- The incident was not just a UI artifact.
- There were two outbound provider-sent rows.
- Direct-send has a real code-level pre-provider idempotency gap.
- The incident evidence did not support direct-send/chat-ui as the cause.

## What Stayed Unproven

- Whether direct-send was involved in this specific incident.
- Whether a user double-submit happened.
- Whether scheduler was definitively the root cause.
- Whether webhook ingestion itself caused duplicate-send behavior.
- Where outbound #1 originated.

## Resulting Reframe

Recommended issue title:

```txt
Duplicate campaign outbound: two provider-sent initial messages before inbound
reply, root cause unconfirmed
```

Recommended split:

| Issue | Purpose |
| --- | --- |
| TAB-3017 | Investigate duplicate campaign outbound incident and trace outbound #1 origin. |
| Follow-up | Harden direct-send with pre-provider idempotency / send-attempt claim. |

## What Lumo Helped Catch

Without a checkpoint, the agent/user path could have become:

```txt
two outbound messages -> direct-send gap exists -> fix direct-send
```

The better path is:

```txt
two outbound messages -> direct-send gap exists separately -> incident evidence
points elsewhere -> reframe before fixing
```

That is the core Lumo value:

```txt
keep evidence, claims, and next action aligned
```

## Next Safe Slice

Read-only only:

```txt
Trace origin of first provider-sent initial_message at 2026-06-26T08:51Z.
```

Allowed evidence shape:

- counts;
- timestamps;
- statuses;
- hashed ids;
- provider-id presence or distinctness;
- scheduled-action relation;
- redacted log/event presence.

Do not include:

- message bodies;
- contact data;
- profile URLs;
- raw provider payloads;
- secrets.

## Product Learning For Lumo

Thread Checkpoint v1 should be able to read or receive a thread summary and
produce:

- current framing;
- updated framing;
- proven facts;
- unproven claims;
- overclaim risks;
- recommended next slice;
- approval gates;
- follow-up harness lessons.

This case should be used as a design target before building a thread-checkpoint
command.
