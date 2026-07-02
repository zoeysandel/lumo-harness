# Redacted Lumo Steering Card

Status: example artifact. Redacted and safe for private tester context.

This card is based on current dogfood evidence, but it intentionally removes raw
production data, contact details, message bodies, provider payloads, logs, and
private thread text.

## Example Card

| Field | Value |
| --- | --- |
| Status | `check_again` |
| Why | The agent has found a likely technical path, but the next implementation depends on a product rule that has not been decided yet. |
| Evidence | The investigation points to an activation/readiness path where a workflow can produce zero planned actions. The current evidence explains the symptom, but not the intended user-facing behavior. |
| Risk | If the agent patches now, it may encode the wrong business rule and make a risky runtime path look "fixed" without proof. |
| Recommendation | Pause implementation. Decide the product rule first, then ask the agent for the smallest test-first patch. |
| User choice | Choose the rule for the uncertain state, or explicitly approve a read-only proof pass to gather one missing fact. |

## What The Card Prevents

Without this checkpoint, the agent might keep momentum and turn a technical
symptom into a patch before the product decision is clear.

With the checkpoint, the next step becomes smaller:

```txt
decide rule -> write focused regression test -> implement narrow patch -> review proof
```

## What Stayed Not Verified

The card does not claim to know:

- the exact production root cause;
- live provider truth;
- private issue comments;
- production config;
- runtime logs;
- whether a final patch is correct.

Those facts require separate proof. Lumo's value here is the steering decision:
do not implement until the missing product rule is visible.

## Other Dogfood Shapes

The same card format can return different statuses:

| Status | Dogfood Shape |
| --- | --- |
| `pivot` | A thread's next move no longer follows from the strongest evidence. |
| `pause` | The next move would change production, CRM, provider state, deploy state, or another external system without explicit approval. |
| `go` | The slice is small, local, aligned, and has a clear verification path. |

## Safe Claim

This example shows that Lumo can make an agent steering decision easier to
inspect. It does not prove that Lumo guarantees correctness, safety, or better
code.
