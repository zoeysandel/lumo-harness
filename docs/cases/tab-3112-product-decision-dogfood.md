# TAB-3112 Product Decision Dogfood Run

Status: completed live dogfood run.

## Why This Case Matters

TAB-3112 is the second useful dogfood case for Lumo.

TAB-3017 proved Lumo can catch a `pivot` moment after a long investigation.
TAB-3112 proved something different:

```txt
Lumo can keep a live coding-agent investigation from turning into a premature
fix before the product rule is clear.
```

This case was not about finding the final implementation. It was about making
the hidden business decision visible.

## Case

The live Codex thread was investigating:

```txt
TAB-3112: campaign cannot be activated after a message-related fix.
```

The thread did not have reliable Linear context because the connector was
blocked by re-auth. Lumo therefore treated the Linear issue body, campaign id,
production flags, and production campaign data as unverified.

## Dogfood Flow

| Step | What Happened |
| --- | --- |
| 1 | Lumo `preflight` was run against the live Linkwise backend worktree. |
| 2 | Lumo returned `check_again` because the task touched campaign runtime safety and needed clearer proof before a fix. |
| 3 | A Lumo steering note was sent into the live Codex thread. |
| 4 | The thread produced a read-only checkpoint packet with likely failure path and remaining unknowns. |
| 5 | Lumo summarized the checkpoint as `check_again`, not ready for patch yet. |
| 6 | Zoey clarified the actual business rule for message-first campaigns. |
| 7 | The product decision was sent back into the thread. |
| 8 | The thread produced a small test-first implementation packet. |
| 9 | A heartbeat watched the thread and stopped once the packet was ready. |

## What Lumo Helped Surface

The technical symptom was:

```txt
campaign start can end with 0 planned actions and a vague initial-planning
failure.
```

The product question underneath was:

```txt
What should Linkwise do when the first executable campaign step is send_message,
but LinkedIn connection status is not confirmed?
```

That question mattered more than writing code immediately.

## Business Rule Chosen

Zoey accepted this rule:

```txt
send_message may only be planned for confirmed LinkedIn connections.
```

Expanded:

- do not trust Linkwise-local state alone when provider/LinkedIn truth is
  uncertain;
- fail closed per lead when connection truth is unknown, stale, or not accepted;
- plan messages only for send-ready leads;
- a campaign may proceed for send-ready leads;
- if zero leads are send-ready and the first executable step is `send_message`,
  block activation with a clear actionable reason instead of a vague planning
  failure.

User-facing target:

```txt
This campaign starts with LinkedIn messages, but connection status is not
confirmed for these leads. We can only plan messages for confirmed connections.
```

## Evidence From The Thread

The thread identified the likely activation path:

```txt
campaign start/resume
-> CampaignService
-> scheduler port
-> ScheduledActionService.plan_initial_actions_for_campaign
-> FlowProgressorService.schedule_next
```

The likely bug shape:

```txt
Scheduler/flow progressor can classify a lead as connection_gated_wait, but
campaign start mostly receives planned_actions = 0. That loses the difference
between "safe zero because leads are waiting/not send-ready" and "broken zero."
```

Read-only local verification reported by the thread:

```txt
31 targeted tests passed
3 additional targeted gate/start tests passed
```

## What Stayed Unverified

- Linear issue body and comments.
- Exact TAB-3112 campaign id or Linkwise URL.
- Whether the reported campaign was draft start or paused resume.
- The real production campaign flow config.
- Production env flags.
- Production campaign data.
- Runtime logs.
- Provider/LinkedIn truth for the affected leads.

## Implementation Packet

The thread concluded that the likely patch belongs primarily in:

```txt
campaign start/readiness
```

with scheduler planning classification as supporting data.

Smallest TDD slice:

1. Add a regression test for campaign start when initial planning returns zero
   because all message-first leads are `connection_gated_wait`.
2. Preserve the safety rule that unsafe `send_message` is not planned.
3. Replace the vague activation failure with a clear actionable reason when no
   leads are send-ready.
4. Keep production data, provider IO, migrations, and deploy config out of the
   slice.

Likely files named by the thread:

- `app/domains/campaign/services/campaign_service.py`
- `app/domains/campaign/ports/scheduler_port.py`
- `app/domains/scheduler/services/scheduled_action_service.py`
- possibly `app/domains/campaign/exceptions/campaign_errors.py`
- `tests/unit/domains/campaign/test_campaign_service_start.py`
- `tests/unit/domains/scheduler/services/test_plan_initial_actions.py`

Verification command named by the thread:

```bash
pytest tests/unit/domains/campaign/test_campaign_service_start.py tests/unit/domains/scheduler/services/test_plan_initial_actions.py tests/unit/domains/scheduler/services/test_flow_progressor_send_message_authority.py -q
```

## Lumo Product Learning

This case shows a different value than normal lint/test tooling.

Lumo did not say:

```txt
The fix is file X line Y.
```

Lumo helped say:

```txt
Stop. This is not just a scheduler bug. The product rule needs to be decided
before the implementation is safe.
```

The live value was:

- keep the Codex thread evidence-first;
- convert a technical symptom into a product decision;
- prevent premature implementation;
- use a heartbeat so Zoey did not need to keep polling;
- return with a small implementation packet only after the business rule was
  clear.

## What This Proves

- Lumo can help during a live investigation before the answer is known.
- `check_again` is valuable when a coding agent has enough technical evidence
  but is still missing a product rule.
- Heartbeats can make Lumo feel like a real cockpit layer instead of a manual
  checklist.
- The next useful handoff can be an implementation packet, not just a summary.

## What This Does Not Prove

- Lumo did not verify the actual TAB-3112 Linear issue body.
- Lumo did not identify the exact production campaign.
- Lumo did not prove the final root cause in production.
- Lumo did not implement or verify the patch.
- Lumo did not query provider/LinkedIn truth.

## Next Choice For Zoey

The next decision is whether to let the Linkwise agent implement the local
test-first slice.

Recommended next checkpoint:

```txt
Run the TDD slice in the TAB-3112 worktree, then use Lumo `review` before any PR,
Linear update, deploy, or production claim.
```

Do not widen into provider checks yet. First make campaign activation explain
the current safety boundary clearly.
