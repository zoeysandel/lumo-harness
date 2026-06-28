# First Tester Invite Draft

Status: draft only. Do not post or send without Zoey reviewing the exact text.
Use [first-tester-review-packet.md](first-tester-review-packet.md) for the
approval gate before sending.

Use this to invite one builder who already uses Codex or Claude Code. The goal is
not to get praise. The goal is to learn whether the control-layer flow is
understandable and whether the generated repo rails feel useful before a real
coding-agent task.

## Short DM

```txt
Hey, ik ben iets kleins aan het testen: Lumo Harness.

Het idee is simpel: Lumo zit als kleine stuurlaag tussen jou en Codex/Claude
Code. Eerst geeft het een preflight kaart, daarna kan het tijdens of na het werk
helpen checken of de agent nog klein, reviewbaar en eerlijk over "not verified"
werkt.

Ik zoek geen algemene mening, maar 15 minuten concrete feedback:

1. Is de preflight/checkpoint/review flow duidelijk?
2. Maakt de proof card het verschil tussen baseline en Lumo snel duidelijk?
3. Zou jij zo'n repo-level harness/stuurlaag willen voordat je een
   TypeScript/Next.js feature laat bouwen?

Start hier:
docs/lumo-v0-test-brief.md

Daarna kun je de lokale quickstart draaien:
docs/public-tester-quickstart.md

Belangrijk: dit claimt nog niet dat Lumo betere code garandeert. De optionele
eval draait ook in local-user-mode, dus een globale Codex AGENTS.md kan beide
runs beïnvloeden. Ik wil juist testen of de review surface en risk boundaries
merkbaar beter worden.
```

## Slightly More Context

```txt
Ik bouw Lumo Harness als een kleine local-first tool voor mensen die veel met
Codex/Claude Code aan TypeScript/Next.js apps bouwen.

Probleem dat ik wil testen:
veel mensen prompten hun agent per taak, maar de repo zelf vertelt nog niet
duidelijk hoe de agent zich moet gedragen.

Lumo probeert daarom een kleine control layer plus repo-level rails te maken:
- welke files/patronen moet de agent volgen;
- welke commands bewijzen een wijziging;
- welke risky seams moeten eerst menselijk bekeken worden;
- wat moet de agent expliciet als not verified markeren.

De eerste test is bewust klein: eerst een preflight kaart op een
TypeScript/Next.js fixture, daarna optioneel same fixture, same Codex prompt,
zonder Lumo vs met Lumo AGENTS.md.

Nuance:
deze eerste eval is local-user-mode, niet clean-room. De runner negeert
Codex config en rules, maar bewijst nog niet dat een globale AGENTS.md uitstaat.

Ik zoek feedback op de proof, niet op polish.
```

## Feedback Template

```txt
Time spent:

Did the brief make sense in under 2 minutes?

Which command/eval did you run?

Did the preflight/checkpoint/review idea make sense?

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

Record summarized feedback in:

```txt
docs/first-tester-feedback-log.md
```

Do not paste raw private messages unless Zoey explicitly asks for that exact
artifact.

## What To Attach

If asking for async feedback, attach or link:

- `docs/first-tester-proof-brief.md`;
- `docs/lumo-v0-test-brief.md`;
- `docs/public-tester-quickstart.md`;
- `docs/examples/dashboard-action-proof-card.html` if the tester will not run the eval first.
- `docs/examples/screenshots/dashboard-action-proof-card.png` if they prefer a static preview.

Current strongest local screenshot, if sharing from this machine:

```txt
docs/examples/screenshots/dashboard-action-proof-card.png
```

## Do Not Say Yet

Avoid:

```txt
Lumo makes AI coding safe.
Lumo guarantees better code.
Lumo fixes vibe coding.
Lumo works for every repo.
This is clean-room proof independent from global Codex setup.
```

Use:

```txt
Lumo is testing whether repo-level rails make coding-agent output more bounded,
reviewable, and honest about what was not verified.
```
