# Lumo Two-Minute Demo Walkthrough

Use this for a quick call, private tester intro, or build-in-public draft. It is
not a launch claim.

## The One-Liner

```txt
Lumo makes the repo contract explicit before Codex builds, then checks whether
the output became easier to review.
```

## The Setup

Show the comparison shape first:

| Without Lumo | With Lumo |
| --- | --- |
| Same fixture repo | Same fixture repo |
| Same Codex prompt | Same Codex prompt |
| No generated repo `AGENTS.md` | Generated repo `AGENTS.md` added to the eval copy |
| Compare diff, risk seams, verification, final answer | Compare diff, risk seams, verification, final answer |

Say:

```txt
This does not test whether Codex can code. It tests whether repo-level rails
change how Codex behaves inside the same repo task.
```

## The Proof To Show

Open:

```txt
docs/examples/dashboard-action-proof-card.html
```

Or show:

```txt
docs/examples/screenshots/dashboard-action-proof-card.png
```

For the human review layer, use:

```txt
docs/examples/dashboard-action-manual-review.md
```

Then point at the current product-validation signal:

| Metric | Baseline | Lumo |
| --- | --- | --- |
| Files changed | 3 | 3 |
| Diff size | +269 / -2 | +182 / -0 |
| Risk seams | auth, db/persistence | none |
| Risk gates | 0/2 | 2/2 |

Plain-language read:

```txt
The baseline built a plausible feature, but it crossed auth and database seams.
The Lumo-guided run kept the first slice local, smaller by line count, and
explicit about what was not verified.
```

## The Important Caveat

Say this out loud:

```txt
This is local-user-mode proof. It does not prove clean-room isolation from a
user's global Codex AGENTS.md, and it does not prove Lumo always improves code.
```

## What We Are Validating Now

Current status:

```txt
level 5: private tester
pending_manual_send
ready_to_share
```

The next question is not "can we make a bigger demo?" yet. The next question is:

```txt
Can one real Codex/Claude Code user reproduce this and explain why it is useful
without us restating the whole story?
```

## If Asked What Lumo Generates

Show:

```txt
docs/examples/AGENTS.md.draft
docs/examples/CLAUDE.md.draft
docs/examples/workflows/feature.md
docs/examples/workflows/review.md
docs/examples/workflows/bugfix.md
```

Explain:

```txt
These are repo-local rails: commands, risk gates, first-slice defaults,
verification expectations, and final-answer shape.
```

## What Not To Say

Do not say:

```txt
Lumo makes AI coding safe.
Lumo guarantees better code.
Lumo replaces tests or human review.
Lumo works for every stack already.
```

Use:

```txt
Lumo helps make agent work more bounded, reviewable, and honest about what was
not verified.
```

## Close

End with the actual ask:

```txt
Would you run something like this before asking Codex or Claude Code to build a
real feature in your TypeScript/Next.js repo?
```
