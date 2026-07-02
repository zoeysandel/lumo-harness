# Lumo Private Tester Brief

Status: private tester brief. This is not a launch page and not a public claim.

## One Sentence

Lumo is a second set of eyes for Codex or Claude Code: it turns repo and thread
evidence into a small steering card so agent work starts smaller, stays aligned,
and is honest about what is not verified.

## Who This Is For

Use this first with builders who already use Codex or Claude Code for real
TypeScript or Next.js work and have felt one of these moments:

- the agent starts from a cold prompt and widens the task;
- the diff gets larger than expected;
- risky seams such as auth, data, provider calls, billing, CRM, deploys, or
  external side effects appear before the user has approved them;
- the final answer says "done" without making the proof boundary clear;
- a long agent thread needs a calm checkpoint before the next move.

## The Painful Moment

Lumo is for the moment where the coding agent is moving, but the user no longer
knows whether it is solving the right problem, touching the right files, or
claiming more proof than it has.

Lumo's answer should be simple:

```txt
go | check_again | pause | pivot
```

## What Lumo Is Not

- Not broad AI safety.
- Not a SaaS dashboard.
- Not a textbook of Next.js rules.
- Not a replacement for tests, review, or user approval.
- Not a guarantee that the agent wrote better code.
- Not an autonomous actor for production, CRM, deploys, provider calls, or
  external side effects.

## Current Dogfood Evidence

The current strongest evidence is practical and narrow:

| Case | What Lumo Helped With | Safe Claim |
| --- | --- | --- |
| TAB-3017 | A long investigation had drifted from the original framing. Lumo returned `pivot` and kept the incident proof separate from a real but different code risk. | Lumo can help catch a wrong next framing from a redacted thread packet. |
| TAB-3112 | A live investigation had enough technical evidence to code, but still missed the product decision. Lumo returned `check_again` until the rule was clear. | Lumo can help stop premature implementation when the missing piece is a product decision. |
| CRM-style stage update | The next step would have changed external state. Lumo's intended behavior is to pause before the mutation and require explicit approval. | Lumo should keep external side effects as approval-gated, not automatic. |

This is dogfood proof, not broad market proof. The next useful signal is one
private tester saying whether the flow is understandable and useful before a
real Codex or Claude Code task.

## What To Read First

Start here:

1. `docs/private-tester-2-minute-brief.md`
2. `docs/examples/redacted-steering-card.md`
3. `docs/tiny-demo-flow.md`
4. `docs/public-tester-quickstart.md`

Use the quickstart only after the idea is clear.

## Feedback We Want

Good feedback is specific:

```txt
Did the second-set-of-eyes idea make sense in under two minutes?
Did the steering card make the next decision obvious?
Would you want this before a real Codex or Claude Code feature task?
What felt confusing, too heavy, or overclaimed?
What would need to be true before you used it in your own repo?
```

## Safe Wording

Use:

```txt
Lumo is testing whether a small control layer can make agent work more bounded,
reviewable, and honest about what was not verified.
```

Avoid:

```txt
Lumo makes AI coding safe.
Lumo guarantees better code.
Lumo works for every repo.
Lumo replaces tests or human review.
```
