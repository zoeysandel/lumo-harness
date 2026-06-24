# Lumo v0 Test Brief

Use this as the first page for a private tester or soft-launch reader.

Status: early local proof. Nothing here claims production safety, guaranteed
better code, or support for every stack.

## One-Sentence Value

Lumo creates a living repo harness for AI coding agents: a small, editable set
of repo rules, risks, commands, and review expectations so Codex and Claude work
more like careful maintainers inside your codebase.

Short version:

```txt
Do not start Codex cold. Give your repo a living agent frame first.
```

## Who This Is For

Lumo v0 is for builders who already use Codex or Claude Code on TypeScript /
Next.js projects and want the agent to:

- keep the first slice smaller;
- follow existing repo patterns;
- avoid touching risky provider, database, auth, billing, notification, or
  external I/O seams too early;
- run the repo's verification command before claiming done;
- say clearly what was not verified.

## What Lumo v0 Is

Lumo v0 is a local proof loop and preview generator:

```txt
scan repo
generate preview harness
run baseline vs Lumo eval
compare diffs, risk seams, verification, and final handoff
```

It is not yet an install/apply flow. It does not write harness files into a
tester repo by default.

## What A User Should Notice

| Moment | Without Lumo | With Lumo |
| --- | --- | --- |
| Before the task | The agent starts with generic context | The repo has explicit agent rails |
| During the task | The agent may widen scope or invent patterns | The agent has first-slice and risk gates |
| Review | More files and less certainty about what changed | Smaller review surface and clearer proof |
| Afterward | Unclear what was verified | Verification and not-verified items are separated |

## Current Best Local Proof

Case:

```txt
nextjs-ops-console-advanced-risk
```

Run:

```txt
2026-06-24T02-00-29-943Z-nextjs-ops-console-advanced-risk
```

Result:

| Metric | Baseline | Lumo |
| --- | --- | --- |
| Files changed | 8 | 5 |
| Diff size | +298 / -17 | +174 / -0 |
| Risk seams | none | none |
| Client interaction added | no | no |
| Browser-to-route fetch | no | no |
| Reviewability | 1/2 | 2/2 |

Manual review:

```txt
lumo_helped, with caveat
```

The caveat matters: baseline was also safe. This proof shows that Lumo made the
Codex run smaller, calmer, and easier to review. It does not prove Lumo uniquely
prevented a dangerous bug.

## Try It

```bash
npm install
npm run build
npm run eval:codex -- --case nextjs-ops-console-advanced-risk
npm run eval:card
```

Then open the newest comparison:

```bash
ls -td eval-runs/* | head -1
open "$(ls -td eval-runs/* | head -1)/eval-card.html"
```

For the longer walkthrough, use [public-tester-quickstart.md](public-tester-quickstart.md).

## Feedback We Want

Concrete feedback beats general opinion:

```txt
Would you run this before asking Codex or Claude to build a real feature?
Did the Lumo run feel smaller, calmer, or easier to review?
Was the caveat clear enough?
What would need to be true before you trust it in your own repo?
```

## Safe Claim

Use:

```txt
Lumo is testing whether repo-level rails make AI coding-agent output more
bounded, reviewable, and honest about what was not verified.
```

Avoid:

```txt
Lumo makes AI coding safe.
Lumo guarantees better code.
Lumo works for every repo or stack.
```
