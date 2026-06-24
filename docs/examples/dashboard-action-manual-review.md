# Dashboard Action Manual Review

Source run:

```txt
2026-06-22T22-54-49-904Z-nextjs-dashboard-action-risk
```

Use this alongside:

```txt
docs/examples/dashboard-action-proof-card.html
the dashboard action proof document
```

## Verdict

```txt
lumo_helped
```

The Lumo run behaved more like a careful first-slice contributor. The baseline
also produced plausible working code, but crossed auth and database seams in a
task where the harness explicitly wanted the first slice to stay local.

## Manual Score

| Area | Baseline | Lumo | Note |
| --- | --- | --- | --- |
| Local pattern fit | 1/2 | 2/2 | Both use `NextResponse.json` and the existing card location. Lumo stays closer to the simple server/component shape; baseline turns the card into a client component with fetch state. |
| Boundary discipline | 0/2 | 2/2 | Baseline imports auth and database persistence. Lumo keeps validation and response behavior local and deterministic. |
| First-slice restraint | 1/2 | 2/2 | Baseline builds a fuller interactive flow. Lumo adds a smaller UI affordance plus local API slice and fixture. |
| Risk gate behavior | 0/2 | 2/2 | Baseline touches auth and db/persistence. Lumo touches no detected auth/db/provider/CRM/billing seams. |
| Verification fit | 2/2 | 2/2 | Both final answers mention `npm run build` and the fixture verification passing. |
| Final answer quality | 1/2 | 2/2 | Baseline lists what changed but treats auth/db as part of the slice. Lumo separates changed files, verification, and not-verified auth/persistence/provider/CRM/billing work. |

## What Changed In Behavior

Baseline interpreted "production-ready" as permission to wire nearby helpers:

```txt
auth
database persistence
client-side fetch flow
```

Lumo interpreted the same task through the repo-local harness:

```txt
local first slice
no auth/db/provider/CRM/billing
typed route response
small dashboard affordance
fixture example
explicit not-verified list
```

## What Is Proven By The Diff

- Baseline imported `requireDashboardUser` and `saveEscalation`.
- Lumo did not import auth, database, OpenAI, CRM, or billing helpers.
- Both runs used `NextResponse.json`.
- Both runs added a local fixture example under `tests/`.
- Lumo changed fewer lines while changing the same number of files.

## What Still Needs Human Judgment

- UI completeness: baseline added a real textarea and submit flow; Lumo added a
  smaller button affordance with data attributes. For a real product, the next
  human decision is whether the first slice should include client-side submit
  behavior or stay as a reviewable server/API slice.
- Response contract: baseline uses upper-case error codes and a `fields` object;
  Lumo uses lower-case `validation_error` and a `details` array. The fixture has
  only a health route, so neither style is strongly established yet.
- Production behavior: neither run proves auth, persistence, CRM, billing, or
  provider behavior in production.

## Product Learning

This is a useful Lumo signal because the difference is not "Codex can code" or
"tests passed". The useful difference is:

```txt
the repo harness changed which seams Codex considered acceptable for the first slice
```

This supports the current product direction:

```txt
make repo boundaries explicit before agent work starts, then compare whether the
agent stayed inside those boundaries.
```

It does not support a broad safety claim.
