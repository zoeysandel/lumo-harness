# Public Repo Checklist

Status: local checklist only. Nothing has been published.

Use this before turning the local `lumo-harness` folder into a public GitHub
repository or before sending a repo snapshot to testers.

## Include

These files are intended to be part of the public/tester repo:

```txt
README.md
package.json
package-lock.json
tsconfig.json
.gitignore
src/
scripts/
fixtures/
docs/
```

Core scope docs:

```txt
docs/mvp-use-case.md
docs/lumo-init-mvp-scope.md
docs/lumo-v0-test-brief.md
docs/golden-use-case.md
docs/nextjs-harness-quality-bar.md
docs/dogfood-nextjs-larger-projects.md
docs/eval-ladder.md
docs/proof-matrix.md
docs/first-tester-decision-map.md
docs/first-tester-feedback-scenarios.md
docs/private-tester-share-manifest.md
```

Stable proof examples live in `docs/examples/`:

```txt
docs/examples/AGENTS.md.draft
docs/examples/CLAUDE.md.draft
docs/examples/workflows/
docs/examples/dashboard-action-proof-card.html
docs/examples/dashboard-action-manual-review.md
docs/examples/dashboard-action-x-draft.md
docs/examples/screenshots/dashboard-action-proof-card.png
```

These examples are safe to inspect, but they are not fresh runtime proof. Fresh
proof is created locally by running the eval commands.

## Keep Local Or Ignored

Do not publish these generated/local folders:

```txt
node_modules/
dist/
eval-runs/
tmp/
coverage/
.lumo/
.env
.env.*
*.log
```

Why:

| Path | Reason |
| --- | --- |
| `eval-runs/` | Local Codex outputs can contain absolute paths, event logs, run-specific artifacts, and workflow-papercut archives. |
| `dist/` | Generated build output; users can recreate it with `npm run build`. |
| `tmp/` | Local progress ledger and workflow-papercut logs only. |
| `.env*` | Secrets and local configuration. |
| `node_modules/` | Install output. |

## Before Sharing

Run:

```bash
npm run check:local
```

Expanded:

```bash
npm run build
npm test
npm run typecheck
npm run tester:check
npm run tester:packet
npm run tester:feedback
npm run tester:next
npm run tester:share
npm run public:check
npm run goal:audit
```

Expected current tester status:

```txt
approved_as_is
pending_manual_send
ready_to_share
```

This means the local package is ready for one private tester, but no tester has
been contacted by Lumo or Codex.

## Claim Boundary

Use:

```txt
Lumo helps make agent work smaller, more reviewable, and easier to prove.
```

More precise for the current proof:

```txt
Lumo can help make the first TypeScript/Next.js agent slice more bounded,
reviewable, and honest about what was not verified.
```

Avoid:

```txt
Lumo makes AI code safe.
Lumo guarantees better output.
Lumo replaces tests or human review.
Lumo works for every stack already.
```

## Before Public GitHub

Minimum checks:

| Check | Status Needed |
| --- | --- |
| No private tester data in docs | pass |
| No local absolute paths in stable examples | pass |
| No secrets or API keys | pass |
| Stable proof card included | pass |
| Manual review included | pass |
| `eval-runs/` ignored | pass |
| `public:check` passes | pass |
| Tester feedback status clear | `pending_manual_send` or later recorded state |

Do not publish a public launch claim until at least one private tester has
either reproduced the proof or named the exact blocker.
