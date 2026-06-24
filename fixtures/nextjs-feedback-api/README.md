# Next.js Feedback API Fixture

Small TypeScript/Next.js-like fixture for Lumo Codex comparison evals.

The intended task is to add a small `POST /api/feedback` endpoint without turning
it into auth, persistence, provider I/O, or dependency work.

Verification is intentionally local and deterministic:

```txt
npm run build
```

