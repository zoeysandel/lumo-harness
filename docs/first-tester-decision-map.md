# First Tester Decision Map

Purpose: convert the first private tester result into one next Lumo checkpoint.

Do not use tester feedback as a vague confidence boost. Use it to choose one
explicit product move.

For synthetic examples of each route, see
[first-tester-feedback-scenarios.md](first-tester-feedback-scenarios.md).

## Decisions

| Decision | Use When | Next Checkpoint |
| --- | --- | --- |
| `expand_to_3_testers` | Tester understood the proof and saw plausible value | Ask two more private testers to run or review the same TypeScript/Next.js proof |
| `tighten_docs` | Value is plausible, but the brief, quickstart, or proof card confused them | Tighten docs, rerun readiness gates, then ask another tester |
| `tighten_eval` | Tester understood the idea, but the proof did not feel convincing | Improve the same TypeScript/Next.js use case or build one larger fixture only if they named a specific missing signal |
| `pause_public_story` | Tester misunderstood the claim or thought Lumo overclaimed | Rework positioning and claim boundaries before any X post or public repo announcement |

## Rules

- Choose exactly one decision.
- Keep feedback paraphrased and redacted.
- Do not expand to another stack from the first tester.
- Do not build a larger eval unless the tester names a concrete missing signal.
- Do not post publicly while the decision is `tighten_docs`, `tighten_eval`, or
  `pause_public_story`.

## Scorecard Interpretation

Use the tester's 0-2 signal scorecard as evidence, not as an automatic verdict.

| Pattern | Likely Decision | Why |
| --- | --- | --- |
| Most scores are `2`, and product pull is `2` | `expand_to_3_testers` | The proof is understandable enough to test with two more people |
| Understanding is low, but product pull is not zero | `tighten_docs` | The idea may be useful, but the handoff is getting in the way |
| Reviewability, risk gates, or repo-pattern fit score `0` or `1` with a concrete missing signal | `tighten_eval` | The current case is not proving the Lumo behavior strongly enough |
| Tester thinks the claim implies safety, guaranteed better code, or every-stack support | `pause_public_story` | Positioning is creating the wrong expectation |

Do not average the scores into a fake confidence number. The useful question is:

```txt
Which specific Lumo promise failed to become visible?
```

## Local Commands

After recording summarized feedback:

```bash
npm run tester:feedback
npm run tester:next
```

`tester:feedback` validates the feedback log.

`tester:next` maps the recorded decision to the next checkpoint.
