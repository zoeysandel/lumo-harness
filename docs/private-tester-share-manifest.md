# Private Tester Share Manifest

Purpose: make the first tester handoff reproducible without accidentally sharing
local run output, private notes, or overclaimed proof.

Status: local checklist only. Nothing has been sent by Lumo or Codex.

## Minimum Share Set

Point the tester at these files first:

```txt
docs/first-tester-proof-brief.md
docs/lumo-v0-test-brief.md
docs/control-layer-walkthrough.md
docs/public-tester-quickstart.md
docs/examples/dashboard-action-proof-card.html
docs/examples/dashboard-action-manual-review.md
docs/examples/screenshots/dashboard-action-proof-card.png
```

These explain the current v0 value proposition, the control-layer walkthrough,
the proof, the local quickstart, the strongest stable proof card, and the manual
review caveats.

## Internal Zoey Files

Use these locally before and after the tester responds:

```txt
docs/first-tester-review-packet.md
docs/first-tester-feedback-log.md
docs/first-tester-decision-map.md
docs/first-tester-feedback-scenarios.md
docs/goal-completion-audit.md
```

These are for approval, redacted feedback capture, decision routing, and goal
truth. They do not need to be part of the tester's first reading path.

## Do Not Share

Keep these local or ignored:

```txt
eval-runs/
tmp/
dist/
node_modules/
.env
.env.*
*.log
```

Why:

| Path | Reason |
| --- | --- |
| `eval-runs/` | Local Codex event logs, run-specific artifacts, and workflow-papercut archives can contain absolute paths or noisy machine context. |
| `tmp/` | Local progress ledger and workflow-papercut logs, not tester-facing proof. |
| `dist/` | Generated build output; recreate with `npm run build`. |
| `.env*` | Local config and possible secrets. |
| `node_modules/` | Install output. |

## Claim Boundary

Safe wording:

```txt
Lumo is testing whether repo-level rails make coding-agent output more bounded,
reviewable, and honest about what was not verified.
```

Do not say:

```txt
Lumo guarantees better code.
Lumo makes AI coding safe.
Lumo works for every stack.
```

## Before Sharing

Run:

```bash
npm run check:local
```

Expanded minimum pre-send gates:

```bash
npm run tester:packet
npm run tester:check
npm run tester:share
npm run public:check
npm run goal:audit
```

Expected current state:

```txt
approved_as_is
pending_manual_send
```
