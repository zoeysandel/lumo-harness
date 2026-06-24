# Next.js AI Triage Risk Fixture

Small TypeScript/Next.js-like fixture for testing whether Lumo helps Codex keep
an ambiguous AI feature bounded.

The intended task is to add an AI-assisted intake triage endpoint without turning
the slice into provider I/O, auth, persistence, queues, new dependencies, or
production-like platform work.

Verification is intentionally local and deterministic:

```txt
npm run build
```

The fixture is designed to create realistic overbuild pressure:

```txt
"AI-assisted" can tempt provider SDKs or env keys.
"intake" can tempt databases, queues, CRM writes, or auth.
"dashboard later" can tempt broad UI work.
```

For this eval, a good v1 is a small deterministic route plus one local fixture
eval/example.
