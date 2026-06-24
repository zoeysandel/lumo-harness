# First Tester Feedback Scenarios

Status: synthetic examples only. These are not real tester results.

Purpose: make the post-feedback checkpoint easy to explain before real feedback
exists. Use this with [first-tester-decision-map.md](first-tester-decision-map.md)
after summarized tester feedback is recorded.

Do not use these examples as product proof. They only show how the scorecard
should route the next Lumo step.

## Scenario Map

| Scenario | Signal Pattern | Decision | Next Checkpoint |
| --- | --- | --- | --- |
| Clear value | Most scores are `2`; product pull is `2`; no overclaim confusion | `expand_to_3_testers` | Ask two more private testers to run or review the same TypeScript/Next.js proof |
| Useful but confusing | Product pull is `1` or `2`, but brief/proof/quickstart clarity is low | `tighten_docs` | Tighten the brief, quickstart, or proof card before another tester |
| Proof not convincing | Reviewability, risk gates, or repo-pattern fit score `0` or `1` with a concrete missing signal | `tighten_eval` | Improve the same TypeScript/Next.js case, or build one larger fixture only if the missing signal requires it |
| Wrong expectation | Tester thinks Lumo guarantees safety, better code, or every-stack support | `pause_public_story` | Rework positioning and claim boundaries before any public post |

## Example Notes

### Clear Value

```txt
Scores:
- Smaller first slice: 2
- Better repo-pattern fit: 2
- Risky seams avoided or gated: 2
- Verification was clear: 2
- Final answer was honest about not-verified work: 2
- Would use before a real Codex/Claude task: 2

Decision:
expand_to_3_testers

Why:
The tester understood the proof and saw enough product pull to test the same
use case with two more builders.
```

### Useful But Confusing

```txt
Scores:
- Smaller first slice: 2
- Better repo-pattern fit: 1
- Risky seams avoided or gated: 2
- Verification was clear: 1
- Final answer was honest about not-verified work: 2
- Would use before a real Codex/Claude task: 1

Decision:
tighten_docs

Why:
The value is plausible, but the handoff is not clear enough. Do not change the
eval yet; improve the explanation first.
```

### Proof Not Convincing

```txt
Scores:
- Smaller first slice: 1
- Better repo-pattern fit: 0
- Risky seams avoided or gated: 1
- Verification was clear: 2
- Final answer was honest about not-verified work: 2
- Would use before a real Codex/Claude task: 1

Decision:
tighten_eval

Why:
The tester understood the idea, but the current case did not make the core
Lumo behavior visible enough. Improve the same TypeScript/Next.js proof before
sharing further.
```

### Wrong Expectation

```txt
Scores:
- Smaller first slice: 2
- Better repo-pattern fit: 1
- Risky seams avoided or gated: 2
- Verification was clear: 2
- Final answer was honest about not-verified work: 0
- Would use before a real Codex/Claude task: 1

Decision:
pause_public_story

Why:
If the tester heard a broad safety or guaranteed-better-code claim, the next
problem is positioning, not another eval.
```

## Rule

Do not average the scores.

Ask:

```txt
Which specific Lumo promise failed to become visible?
```

