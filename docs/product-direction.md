# Lumo Product Direction

Status: direction lock before the next build slice.

## One Sentence

Lumo is a plug-and-play second set of eyes between a user and an AI coding
agent.

It helps the agent choose the right route, gather the right context, stay aligned
with the original intent, explain decisions clearly, and feed lessons back into
the user's harness.

## What Changed

Lumo started as a repo harness/init tool:

```txt
Scan my repo and generate small AI-coding rails.
```

That remains useful, but it is not the whole product.

The broader direction is:

```txt
Help Codex, Claude Code, Cursor, or another coding agent work with more context,
better steering, clearer proof, and less drift.
```

`init` becomes one entry point. The product center becomes routing, alignment,
review, and learning.

## Core Loop

```txt
preflight -> agent work -> checkpoint -> agent work -> review -> learn -> better harness -> preflight
```

| Step | What Lumo Does | User Experience |
| --- | --- | --- |
| Preflight | Understands task, repo, risks, relevant rules, and context needs | "This is the route I recommend." |
| Checkpoint | Checks whether the agent is still on course | "Continue, check one thing, pause, or pivot." |
| Review | Reviews outcome, proof, risks, and understandability | "Here is what happened and what is not proven." |
| Learn | Turns repeated friction into proposed harness improvements | "This should become a rule, skill, doc, or check." |

## Product Promise

Lumo should make AI coding feel calmer and more steerable.

The user should not need to understand harness engineering. The user should feel:

```txt
I can ask for software work without manually deciding every workflow detail.
Lumo helps the coding agent prepare, stay on course, prove the result, and learn.
```

## Primary User Outcomes

| User Question | Lumo Should Help Answer |
| --- | --- |
| Are we solving the right problem? | Compare work against the original intent and current roadmap. |
| Is this the right route? | Surface alternatives, risks, and context gaps before coding. |
| Is the code being changed responsibly? | Check repo patterns, risky seams, review surface, and verification. |
| Should I approve continuation? | Translate technical context into a simple decision card. |
| What did we learn? | Propose small harness updates from repeated friction. |

## Decision Card

When Lumo needs the user, it should not return a technical dump. It should return
a decision card.

| Field | Meaning |
| --- | --- |
| Status | `go`, `check_again`, `pause`, or `pivot`. |
| Why | One plain-language reason. |
| Evidence | The strongest proof behind the status. |
| Risk | The one thing that could make the decision wrong. |
| Recommendation | What Lumo would do next. |
| User choice | The smallest real decision needed from the user. |

Example:

```txt
Status: check_again
Why: The implementation is on course, but it touches a flow that recently caused
a regression.
Evidence: The diff is small and typecheck passed.
Risk: The end-to-end user flow has not been proven.
Recommendation: Add or run one focused flow check before approving.
User choice: Continue now, or run the extra check first.
```

## Context Sources

Lumo may use multiple context layers, but should summarize them simply.

| Source | Why It Matters |
| --- | --- |
| Global `AGENTS.md` | User-wide operating contract. |
| Repo `AGENTS.md` / scoped rules | Project-specific behavior and gates. |
| Skills and plugins | Reusable procedures and available capabilities. |
| Repo docs and commands | Local truth, checks, architecture, and workflows. |
| Linear issues | Product intent, prior decisions, related work, open constraints. |
| Commits and PRs | Recent changes, fragile areas, regressions, ownership history. |
| Session files and memories | Repeated friction, successful patterns, and lessons. |

## What Lumo Is Not

- Not a giant rulebook.
- Not another dashboard the user must constantly operate.
- Not a replacement for Codex, Claude Code, Cursor, tests, or human review.
- Not an automatic writer of global rules, memory, skills, or repo files.
- Not a guarantee that AI coding is safe or correct.
- Not a waterfall workflow engine.

## Agent-First Interface

Lumo should be usable by humans, but designed so coding agents can call it.

The normal path is:

```txt
User -> Codex/Claude/Cursor -> Lumo -> Codex/Claude/Cursor -> User
```

Early commands can stay small:

```txt
lumo preflight --repo . --task "..."
lumo checkpoint --repo . --run .lumo/runs/latest
lumo review --repo . --run .lumo/runs/latest
lumo learn --repo . --run .lumo/runs/latest
```

These commands should produce compact, agent-readable output plus a
human-readable decision card when a steering decision is needed.

## Relationship To Current MVP

The current TypeScript/Next.js `init` work is still valuable, but it is now
positioned as the first concrete slice of a broader control layer.

| Current Capability | New Role |
| --- | --- |
| `doctor` | Local readiness check before Lumo participates. |
| `analyze` | Harness/context map for a repo. |
| `init` | First repo-level rails for agents that start cold. |
| eval runner | Proof loop for whether Lumo changes agent behavior. |

The next product slice should not add more generated rules by default. It should
make one small Lumo routing/checkpoint behavior real enough to dogfood during a
Codex task.

## Directional Test

Before building more surface area, test this question:

```txt
Can Lumo help Codex decide how to approach a real task, when to ask Zoey for a
steering decision, and how to summarize proof without adding visible ceremony?
```

If yes, continue toward agent-invoked `preflight` and `checkpoint`.

If no, return to the smaller repo-init wedge and keep Lumo as a setup tool until
the control-layer value is clearer.
