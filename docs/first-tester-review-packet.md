# First Tester Review Packet

Status: approved as-is. Nothing has been sent.

Use this packet when Zoey reviews the first private tester invite. The goal is to
make the human gate small: approve the message, edit it, or hold.

## Decision Recorded

Decision recorded on 2026-06-23:

```txt
approve_as_is
```

Meaning: the message is clear and safe for Zoey to send manually to one private
tester. No message has been sent by Lumo or Codex.

Decision options:

| Decision | Meaning | Next Step |
| --- | --- | --- |
| `approve_as_is` | The message is clear and safe to send to one tester | Send the short DM manually |
| `edit_then_send` | The message is directionally right but needs wording changes | Edit `first-tester-invite-draft.md` first |
| `hold` | The proof or ask still feels unclear | Tighten proof/docs before asking anyone |

Current status:

```txt
approved_as_is
pending_manual_send
```

Before deciding, run:

```bash
npm run check:local
```

Expanded:

```bash
npm run tester:check
npm run tester:packet
npm run tester:feedback
npm run tester:next
npm run tester:share
```

Expected result:

```txt
Status: ready
Status: draft only. Nothing has been sent.
Status: pending_manual_send
```

`npm run tester:packet` also writes:

```txt
docs/first-tester-packet.generated.md
```

The command validates that the generated packet matches the current invite draft
and feedback template.

## Exact Message To Review

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

Source:

```txt
docs/first-tester-invite-draft.md
```

## What To Send With It

Minimum:

- `docs/control-layer-walkthrough.md`;
- `docs/first-tester-proof-brief.md`;
- `docs/lumo-v0-test-brief.md`;
- `docs/public-tester-quickstart.md`.

Optional if they will not run the eval immediately:

- `docs/examples/dashboard-action-proof-card.html`;
- `docs/examples/screenshots/dashboard-action-proof-card.png`;
- `docs/examples/dashboard-action-manual-review.md`.

Do not send:

- raw internal progress notes;
- local `eval-runs/` output;
- private tmp logs;
- unreviewed X drafts;
- claims that Lumo guarantees safety or better code.

## What We Need Back

Ask for summarized feedback using:

```txt
docs/first-tester-feedback-log.md
```

Minimum useful feedback:

| Need | Why |
| --- | --- |
| Did the brief make sense? | Tests positioning clarity |
| Did the preflight/checkpoint/review flow make sense? | Tests the new control-layer direction |
| Did they understand baseline vs Lumo? | Tests proof clarity |
| Could they run an eval, or where did it block? | Tests local reproducibility |
| Did they use local-user-mode or custom CODEX_HOME preflight? | Tests instruction-environment reproducibility |
| Did Lumo feel more reviewable, bounded, or honest? | Tests product pull |
| Was the TypeScript/Next.js first-use-case scope clear? | Tests MVP wedge clarity |
| Was the local-user-mode caveat clear? | Tests proof honesty |
| Did the custom Codex-home preflight clarify or block anything? | Tests stricter proof readiness |
| 0-2 signal scorecard for slice, repo fit, risk gates, verification, honesty, and product pull | Turns feedback into comparable evidence |
| What would make them try it on their own repo? | Tests next product slice |

## Approval Checklist

Before sending, Zoey should be comfortable that:

| Check | Status |
| --- | --- |
| Message is private and low pressure | pending |
| Message does not overclaim Lumo | pending |
| Message keeps the TypeScript/Next.js scope clear | pending |
| Message does not claim clean-room isolation | pending |
| Tester is a real Codex/Claude-style builder | pending |
| Links or files are accessible to the tester | pending |
| Feedback will be paraphrased, not stored as raw private messages | pending |

## After Feedback

Update:

```txt
docs/first-tester-feedback-log.md
```

Then choose:

| Result | Next Move |
| --- | --- |
| Clear value, clear proof | Expand to 3 private testers |
| Value plausible, docs confusing | Tighten brief/quickstart |
| Proof not convincing | Improve eval case/rubric |
| Claim misunderstood | Pause public story and rework positioning |

Use:

```txt
docs/first-tester-decision-map.md
docs/first-tester-feedback-scenarios.md
```

The scenarios are synthetic examples only. They help route feedback; they are
not product proof.

Do not post publicly until the first private feedback checkpoint has been
recorded.
