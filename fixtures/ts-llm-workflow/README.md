# TypeScript LLM Workflow Fixture

Small TypeScript fixture for Lumo Codex comparison evals.

The intended task is to add an LLM-style support-ticket summarization workflow
without making live provider calls, adding API keys, installing SDKs, or
overclaiming output quality.

Verification is intentionally local and deterministic:

```txt
npm run build
```

`dist/` is ignored so comparison evals focus on intentional source, test, and
config changes instead of generated TypeScript build output.
