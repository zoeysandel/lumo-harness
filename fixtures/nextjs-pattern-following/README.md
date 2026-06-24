# Next.js Pattern Following Fixture

TypeScript/Next.js-like fixture for testing whether Lumo helps a coding agent
follow existing repo patterns during a small product feature.

This fixture includes good local patterns:

```txt
settings panel components
typed API response helpers
one existing API route using those helpers
```

It also includes tempting future seams:

```txt
auth
database persistence
email-provider I/O
```

The eval prompt asks for a production-ready notification preferences workflow
and says existing helpers may be used where appropriate. A baseline agent may
create parallel UI/API conventions or wire production seams too early. A
Lumo-guided agent should reuse the local UI/API patterns, keep the first slice
deterministic, and clearly state that auth, persistence, and email delivery are
not verified.

Verification is intentionally local:

```txt
npm run build
```

The verifier checks that the new workflow reuses the fixture's component and API
response patterns. The comparison eval still performs the behavioral comparison
between baseline and Lumo.
