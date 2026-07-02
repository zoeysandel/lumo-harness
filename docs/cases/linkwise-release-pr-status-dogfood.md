# Linkwise Release PR Status Dogfood Run

Status: completed live dogfood run.

## Why This Case Matters

This case proved a third Lumo value:

```txt
Lumo can help Zoey keep release truth separate while multiple PR, CI, bot-review,
deployment, and runtime states are changing.
```

TAB-3017 proved `pivot`.
TAB-3112 proved `check_again` before product-rule clarity.
This release proved the need for `pr-status` and `learn`.

The important user feeling was:

```txt
I can decide calmly because the cockpit tells me what is merged, checked,
blocked, deployed, and still unproven.
```

## Case

The live work was a Linkwise release sequence:

```txt
release linkwise-backend first
then release linkwise-frontend
only merge when checks pass and active bot findings are gone
```

This was high-impact release work, so the useful Lumo behavior was not writing
code faster. It was keeping states separate and stopping when a decision was
needed.

## Dogfood Flow

| Step | What Happened |
| --- | --- |
| 1 | Backend release PR `#2192` was monitored after bot findings. |
| 2 | Backend checks passed and bot findings were no longer active. |
| 3 | Backend PR merged to `main`. |
| 4 | Backend deployment was observed, but runtime proof stayed separate from merge proof. |
| 5 | Frontend release PR `#782` was opened using a main-based release branch. |
| 6 | CI initially failed before Playwright reached the test body. |
| 7 | The failure was isolated to `STAGING_PLAYWRIGHT_BASE_URL` DNS resolution. |
| 8 | Zoey updated the GitHub secret to the real staging frontend URL. |
| 9 | CI then passed, which revealed real Codex bot findings. |
| 10 | The bot findings were fixed before merge. |
| 11 | Frontend PR `#782` merged to `main`. |
| 12 | Production deployment reached `success`; `www.linkwise.nl` returned HTTP 200. |
| 13 | The release fix was synced back to `develop` through PR `#783` so the next release would not overwrite it. |
| 14 | Staging deployment from `develop` reached `success`. |

## What Lumo Helped Surface

The core value was state separation.

| State | Why It Mattered |
| --- | --- |
| `checks_green` | Not enough when active bot findings remained. |
| `bot_findings_active` | Blocked merge even after CI was green. |
| `merged` | Proved branch state, not runtime behavior. |
| `deployment_started` | Proved Railway saw the commit, not that deploy succeeded. |
| `deployment_success` | Proved deploy status, not full business runtime behavior. |
| `http_200` | Proved the public frontend responded, not every user flow. |
| `main_develop_drift` | Required a follow-up sync PR to avoid losing the fix later. |

Without this separation, the workflow could easily have become:

```txt
checks are green -> merge -> done
```

But the true sequence was:

```txt
checks green -> bot findings still active -> fix -> checks green -> resolve
threads -> merge -> deploy success -> lightweight runtime proof -> sync develop
```

## Concrete Findings

### Frontend Secret Failure

The frontend PR smoke failed with:

```txt
page.goto: net::ERR_NAME_NOT_RESOLVED
```

The failure happened in Playwright global setup before the test itself. The
workflow used:

```txt
STAGING_PLAYWRIGHT_BASE_URL -> PLAYWRIGHT_BASE_URL
```

The useful Lumo-style diagnosis was:

```txt
Do not treat this as a frontend code failure yet. First prove whether the
staging URL is resolvable from GitHub Actions.
```

Zoey updated the secret to:

```txt
https://staging.linkwise.nl
```

After that, the staging smoke passed.

### Bot Findings After CI Was Green

When CI was green, two active Codex bot findings still blocked the frontend
release:

- selected outbound-only conversation could remain visible under the replies
  filter;
- E2E tests clicked a radio item that was no longer mounted until the dropdown
  opened.

Both were fixed before merge.

The follow-up sync PR to `develop` found another review issue:

- `recentMessages.at(-1)` could be wrong if the detail endpoint returns newest
  first.

That was fixed by deriving the selected detail last-message state from
`lastMessageAt` / message timestamps instead of array order.

## What This Proves

- Lumo needs a `pr-status` tool because PR truth is multi-state, not binary.
- Lumo needs a `learn` tool because real workflow friction should become small
  harness/tool improvements.
- Heartbeat-style monitoring reduced manual pinging during long release work.
- A good status card should distinguish:
  - checks;
  - active bot findings;
  - mergeability;
  - merge;
  - deployment;
  - runtime smoke;
  - follow-up branch drift.
- The user-facing output should be decision-shaped, not log-shaped.

## What This Does Not Prove

- It does not prove all Linkwise production user flows.
- It does not prove backend runtime behavior beyond observed deployment state.
- It does not prove the frontend fix was broadly regression-free beyond the
  relevant checks and smoke tests.
- It does not prove Lumo can automate the whole release yet.
- It does not mean Lumo should bypass bot findings or branch policy.

## Lumo Product Learning

This case suggests `pr-status` should answer:

```txt
Can we merge, and if not, what exact state blocks us?
```

Minimum output:

| Field | User Meaning |
| --- | --- |
| PR | Which PR is under review. |
| Checks | Green, pending, failed, skipped. |
| Bot findings | Active, outdated, resolved, unknown. |
| Merge state | Clean, blocked, dirty, policy-blocked. |
| Deploy state | Not started, in progress, success, failed, unknown. |
| Runtime proof | What was actually hit or tested. |
| Next action | Fix, wait, rerun, merge, sync branch, or ask Zoey. |

The `learn` tool should capture:

```txt
What friction repeated, and what tiny harness/tool update would prevent it next
time?
```

For this case:

- add a diagnostic preflight for staging Playwright URL secrets;
- make `pr-status` explicitly show active bot findings separately from checks;
- make release status include "sync develop/main drift" when a release fix lands
  directly on `main`;
- keep deployment and runtime proof separate.

## Next Lumo Slice

Recommended next slice:

```txt
lumo pr-status --repo <owner/name> --pr <number>
```

V1 should be read-only and GitHub-first. It should not merge, resolve threads,
rerun checks, or mutate GitHub.

V1 output should be one steering card:

```txt
Status: go | check_again | pause
Why:
Proof:
Not verified:
Next owner/action:
```

Only after that reads well should Lumo add optional release/deploy awareness.
