# First Tester Feedback Log

Status: template. Do not add private names, handles, email addresses, or raw
message bodies.
Use [first-tester-review-packet.md](first-tester-review-packet.md) before any
tester is contacted.

Use this after one private tester reviews the brief or runs the quickstart. The
goal is to decide whether Lumo's proof loop is understandable and useful enough
to show to more builders.

Run this local checkpoint before and after recording summarized feedback:

```bash
npm run tester:feedback
npm run tester:next
```

`tester:next` is read-only. It prints the exact next fields to update, but it
does not mark anything as sent.

Use [first-tester-decision-map.md](first-tester-decision-map.md) to translate
recorded feedback into exactly one next Lumo checkpoint.

## Test Setup

| Field | Value |
| --- | --- |
| Tester label | `tester-001` |
| Date | `YYYY-MM-DD` |
| Tester profile | Codex / Claude Code user; TypeScript familiarity; repo type |
| MVP scope fit | TypeScript/Next.js app builder: yes / no / partial |
| Material sent | `docs/first-tester-invite-draft.md`, `docs/lumo-v0-test-brief.md`, `docs/first-tester-proof-brief.md`, `docs/public-tester-quickstart.md` |
| Eval run | `nextjs-ops-console-advanced-risk`, `nextjs-stateful-ai-risk`, or `nextjs-dashboard-action-risk` |
| Instruction mode | `local-user-mode` or `custom-CODEX_HOME` |
| Custom Codex-home preflight | yes / no / n/a |
| Time spent | minutes |
| Completed locally? | yes / no / partial |

## Manual Send Receipt

Do not add private names, handles, email addresses, phone numbers, or raw
message bodies.

| Field | Value |
| --- | --- |
| Manual send status | `not_sent` |
| Sent date | `YYYY-MM-DD` or `n/a` |
| Sender | Zoey |
| Recipient label | `tester-001` |
| Message version | `docs/first-tester-packet.generated.md` |
| Notes | redacted / paraphrased only |

Status transition:

```txt
pending_manual_send -> change Manual send status to `sent`
pending_feedback_after_send -> fill Feedback Capture and Evidence Notes
feedback_recorded_needs_decision -> choose one Decision
```

## Feedback Capture

| Question | Signal |
| --- | --- |
| Did the brief make sense in under 2 minutes? |  |
| Did the tester understand what was being compared? |  |
| Did the proof card make the difference obvious? |  |
| Did they notice the `not verified` / non-claim boundaries? |  |
| Was the TypeScript/Next.js first-use-case scope clear? |  |
| Was the local-user-mode / global `AGENTS.md` caveat clear? |  |
| Did they use the custom Codex-home preflight? |  |
| If they used preflight, did it clarify or block anything? |  |
| Did they feel Lumo made the output more reviewable, bounded, or honest? |  |
| Would they use this before a Codex/Claude feature task? |  |
| What confused them? |  |
| What would need to be true before trying it on their own repo? |  |

## Signal Scorecard

Use `0` when the signal was not visible, `1` when it was partially visible, and
`2` when it was clearly visible. Add one short note per row.

| Signal | Score | Note |
| --- | --- | --- |
| Smaller first slice | pending |  |
| Better repo-pattern fit | pending |  |
| Risky seams avoided or gated | pending |  |
| Verification was clear | pending |  |
| Final answer was honest about not-verified work | pending |  |
| Tester would use this before a real Codex/Claude task | pending |  |

## Evidence Notes

Keep notes short and redacted:

```txt
Observed:
- 

Tester said, paraphrased:
- 

Artifacts shared back:
- comparison.md: yes / no
- eval-card screenshot: yes / no
- terminal issue: yes / no
```

Do not paste raw private messages unless Zoey explicitly asks for that exact
artifact.

## Decision Gate

| Gate | Pass Criteria | Result |
| --- | --- | --- |
| Understandable | Tester can explain the baseline vs Lumo comparison without us restating it | pending |
| Runnable | Tester can run at least one eval or identify a clear setup blocker | pending |
| Proof clarity | Tester can tell what improved and what was not proven | pending |
| Product pull | Tester says they would want this before a real agent task, or names a concrete missing condition | pending |
| Scope honesty | Tester does not come away thinking Lumo guarantees safety or better code | pending |
| Wedge clarity | Tester understands this MVP is TypeScript/Next.js first, not every stack | pending |

## Decision

Choose one:

| Decision | Use When | Next Step |
| --- | --- | --- |
| `expand_to_3_testers` | The tester understood the proof and saw plausible value | Ask two more private testers before posting |
| `tighten_docs` | The value is plausible but the brief or quickstart confused them | Edit docs before another tester |
| `tighten_eval` | The tester understood it but the proof did not feel convincing | Improve fixture/rubric before sharing further |
| `pause_public_story` | Tester thought the claim was unclear or overclaimed | Rework positioning before any X draft |

Current default until feedback exists:

```txt
pending_manual_send
```

## Product Learning

After the first tester, update this section:

```txt
What we learned:
-

What changed in Lumo:
-

What remains unproven:
-

Next checkpoint:
-
```
