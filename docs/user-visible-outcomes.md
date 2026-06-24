# User-Visible Outcomes

Lumo should make a coding-agent run feel calmer, smaller, and easier to review.

The product is not trying to prove that an AI model is smarter. It is trying to
shape how Codex or Claude Code behaves inside a specific repo.

MVP focus: TypeScript/Next.js repos first. Other stacks come later only after
this first use case is reproducible and useful for real Codex/Claude Code users.

## Desired User Difference

Without Lumo, a user often experiences:

```txt
I prompted the agent.
It did something plausible.
Now I need to inspect a messy diff and guess what it assumed.
```

With Lumo, the user should experience:

```txt
The agent understood the repo boundary.
It made a small slice.
It reused existing patterns.
It avoided risky seams unless asked.
It verified with the right command.
It told me what is still unproven.
I can review this.
```

## Where The Difference Should Show Up

| Moment | User-visible difference |
| --- | --- |
| Before the run | The repo has clear agent rails: commands, boundaries, patterns, risk gates |
| During the run | The agent stays in the intended slice instead of wandering into adjacent systems |
| In the diff | Fewer unrelated files, less config/package churn, more reuse of local patterns |
| In risky areas | Auth, database, provider I/O, env, billing, CRM, deploys, and external side effects are avoided or explicitly gated |
| In tests/checks | The agent runs the repo's available verification command before claiming done |
| In the final answer | Changed files, verification, and not-verified items are separated |
| Over time | The repo becomes easier to keep agent-ready as it grows |

## What A Harness Should Encode

A useful harness should turn user intent and repo context into concrete rules:

```txt
what are we building?
what is the first slice?
what patterns should be reused?
what boundaries should not be crossed?
what commands prove the change?
what must be reviewed by a human?
what should the final response include?
```

For a TypeScript/Next.js repo, that might mean:

```txt
- Use existing API route response patterns.
- Keep first-slice state local unless persistence is explicitly requested.
- Do not add provider SDKs, env reads, or external calls in fixture evals.
- Do not change package scripts unless required.
- Add a local fixture or test when building an AI-shaped workflow.
- Final response must include changed files, verification, and not-verified items.
```

## The Real Value

Lumo should make users feel:

- less afraid of hidden AI overreach;
- more able to review a diff themselves;
- more confident that the agent used the repo's way of working;
- more aware of what is proven versus assumed;
- more able to keep developing as the repo grows.

The strongest MVP promise:

```txt
Lumo makes the repo contract explicit before Codex or Claude Code builds.
```

The strongest user-facing outcome:

```txt
The generated output is easier to review, easier to trust, and easier to continue from.
```

## What Lumo Should Not Promise

Do not promise:

```txt
Lumo guarantees better code.
Lumo makes AI coding safe.
Lumo replaces tests.
Lumo replaces human review.
Lumo prevents every bad agent decision.
```

The better promise is:

```txt
Lumo gives the agent a repo-specific operating contract, then helps you evaluate whether it followed that contract.
```
