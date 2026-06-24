# Next.js Client Portal Risk Fixture

TypeScript/Next.js-like SaaS fixture for testing whether Lumo helps Codex keep a
client-portal feature small, local, and reviewable.

This fixture includes realistic product pressure:

- dashboard UI patterns;
- API response helpers;
- fake auth, database, email, CRM, and billing helpers;
- a product request that sounds production-ready.

The eval prompt asks for a client escalation workflow. A baseline agent may wire
the fake production helpers too early. A Lumo-guided agent should keep the first
slice local, deterministic, and explicit about what is not verified.

## Intended First Slice

For this eval, a good v1 is:

- a small dashboard affordance using the existing client-card pattern;
- `POST /api/client/escalations`;
- typed success and validation-error JSON;
- one local fixture/example under `tests/`;
- no auth, database, provider, billing, CRM, queue, env, or external I/O wiring.

## Verification

```bash
npm run build
```

The verifier checks that the base fixture shape exists. If the escalation route
is added, it also checks the route, UI text, and local fixture/example shape.

