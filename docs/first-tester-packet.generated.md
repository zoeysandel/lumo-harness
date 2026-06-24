# Lumo First Tester Packet

Status: draft only. Nothing has been sent.
Approval: approved_as_is.

## Readiness

# Lumo Tester Readiness

Status: ready

| Check | Status | Detail |
| --- | --- | --- |
| Required tester files | PASS | 20 files present |
| Share-safe example text | PASS | No local paths, obvious secret markers, or private-name markers found |
| Proof card boundary | PASS | Hypothesis, proof, non-proof, and risk seam signal are visible |
| X draft safety | PASS | Draft-only approval gate and non-proof boundary are present |
| Quickstart reproduction path | PASS | Install, preview, eval, card, proof, and non-proof steps are documented |
| Private tester human gate | PASS | Send/edit/hold decision is explicit and nothing is marked sent |
| Tester invite wedge | PASS | Invite names the TypeScript/Next.js scope, local-user-mode caveat, and draft-only gate |
| Package scripts | PASS | 13 expected scripts present |
| Proof screenshot | PASS | 171526 bytes |
| Optional source run | PASS | Local source run exists and includes the eval quality gate plus instruction environment |

Next: Zoey can review the first tester packet and decide whether to send it.

## Decision Gate

| Decision | Meaning |
| --- | --- |
| `approve_as_is` | Send the DM manually to one private tester. |
| `edit_then_send` | Edit the message first, then send manually. |
| `hold` | Tighten proof/docs before asking anyone. |

## Exact DM Draft

```txt
Hey, ik ben iets kleins aan het testen: Lumo Harness.

Het idee is simpel: voordat je Codex/Claude Code aan een TypeScript/Next.js repo
laat werken, maakt Lumo de repo-afspraken expliciet, zodat de agent kleiner,
beter reviewbaar en eerlijker over "not verified" werkt.

Ik zoek geen algemene mening, maar 15 minuten concrete feedback:

1. Is het duidelijk wat de eval probeert te bewijzen?
2. Maakt de proof card het verschil tussen baseline en Lumo snel duidelijk?
3. Zou jij zo'n repo-level harness willen voordat je een TypeScript/Next.js
   feature laat bouwen?

Start hier:
docs/lumo-v0-test-brief.md

Daarna kun je de lokale quickstart draaien:
docs/public-tester-quickstart.md

Belangrijk: dit claimt nog niet dat Lumo betere code garandeert. De eval draait
ook in local-user-mode, dus een globale Codex AGENTS.md kan beide runs
beïnvloeden. Ik wil juist testen of de review surface en risk boundaries
merkbaar beter worden.
```

## Files To Point Tester At

Use `docs/private-tester-share-manifest.md` before sharing anything externally.

- `docs/first-tester-proof-brief.md`
- `docs/lumo-v0-test-brief.md`
- `docs/public-tester-quickstart.md`
- `docs/examples/dashboard-action-proof-card.html`
- `docs/examples/dashboard-action-manual-review.md`
- `docs/examples/screenshots/dashboard-action-proof-card.png`

## Feedback Template

```txt
Time spent:

Did the brief make sense in under 2 minutes?

Which command/eval did you run?

Did you use local-user-mode or a custom CODEX_HOME preflight?

Did the proof card make the baseline vs Lumo difference obvious?

What felt useful?

What felt confusing or too much?

Did the Lumo run feel more reviewable, bounded, or honest?

Score these signals 0-2 and add one short note:
- Smaller first slice:
- Better repo-pattern fit:
- Risky seams avoided or gated:
- Verification was clear:
- Final answer was honest about not-verified work:
- Would use this before a real Codex/Claude task:

Would you use something like this before a Codex/Claude feature task?

Was the TypeScript/Next.js first-use-case scope clear?

Was the local-user-mode / global AGENTS.md caveat clear enough?

If you tried the custom Codex-home preflight, did it clarify or block anything?

What would need to be true before you trust it in your own repo?
```

## After Feedback Routing

Use `docs/first-tester-decision-map.md` after feedback is recorded. Use `docs/first-tester-feedback-scenarios.md` only as synthetic examples of the four routes. This is for choosing the next Lumo checkpoint, not for making a public claim.

## Claim Boundary

Use:

```txt
Lumo is testing whether repo-level rails make coding-agent output more bounded,
reviewable, and honest about what was not verified.
```

Avoid:

- `Lumo makes AI coding safe.`
- `Lumo guarantees better code.`
- `Lumo works for every repo.`

## Next Step

Zoey manually sends the approved DM to one private tester, then records summarized feedback.
