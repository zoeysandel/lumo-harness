# Next.js Harness Quality Bar

Purpose: define what Lumo should generate for TypeScript/Next.js repos before
Codex or Claude Code starts building.

Lumo should not promise perfect architecture. It should give the coding agent a
strong default operating contract so the first slice is smaller, cleaner, more
reviewable, and easier to verify.

## Use Modes

| Mode | User Situation | Lumo Should Do |
| --- | --- | --- |
| New clean Next.js repo | User has bootstrapped a fresh app and wants a good agent setup before coding | Generate sensible default repo rails for slices, boundaries, verification, risk gates, and final answers |
| Existing Next.js repo | User already has files, patterns, helpers, and maybe messy history | Detect and follow existing patterns first; add missing rails without forcing a new architecture |

For MVP testing, existing repos are more realistic. Testers should not need to
start a new app just to understand the value.

## Default Quality Rules

The generated harness should steer the agent toward:

| Area | Rule | User-Visible Result |
| --- | --- | --- |
| Slice choice | Use ICE: impact, confidence, ease | The agent starts with a useful small step instead of a platform rewrite |
| Responsibilities | Keep UI, validation, data access, provider I/O, and business logic separated | Fewer mixed files and easier review |
| SOLID | Apply single responsibility and explicit dependencies first | Smaller files, fewer hidden side effects |
| DRY | Remove real repeated logic, but avoid premature generic abstractions | Less duplicated code without abstract soup |
| Dependency injection | Pass clients/adapters/interfaces into logic at risky boundaries | Tests can use fakes; provider/db/email clients stay out of pure code |
| Repository pattern | Follow existing repository/service patterns; add a data-access seam only when persistence is actually required | Better data boundaries without forcing unnecessary layers |
| Verification | Run or name the narrowest local command | The user can see what was actually proven |

## Repository Pattern Rule

Do:

```txt
If the repo already has repositories/services, follow that pattern.
If new persistence is required, create the smallest data-access seam that fits
the repo.
If the first slice is local-only, do not add a repository layer yet.
```

Do not:

```txt
Add repositories to every feature by default.
Call database/provider clients directly from UI components.
Hide live I/O behind vague helper names without tests or fakes.
```

## What Should Improve In Practice

When the harness is useful, the diff should usually show:

- fewer unrelated files;
- clearer server/client/data/provider boundaries;
- smaller functions or components;
- explicit tests, fixtures, or verification commands;
- fewer direct provider/database/auth touches in a first slice;
- final answers that separate changed files, verification, and not-verified work.

## What This Does Not Guarantee

Lumo cannot guarantee that the model will always write better code. It can make
the desired repo behavior explicit, then help evaluate whether the agent
followed it.

