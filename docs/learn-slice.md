# Learn Slice

Status: PR 3 local v0.2 slice.

## Purpose

`learn` answers:

```txt
What small harness improvement follows from this friction?
```

It produces one deterministic proposal from a redacted friction packet. It is
proposal-only: it does not write docs, repo rules, memories, skills, GitHub,
Linear, CRM, production, or external systems.

## Commands

```bash
npm run lumo -- learn --input docs/cases/lumo-learn-dogfood.md
cat docs/cases/lumo-learn-dogfood.md | npm run lumo -- learn --stdin
npm run lumo -- learn --input - --format json
npm run lumo -- learn --input docs/cases/lumo-learn-dogfood.md --task "Learn from release proof friction"
npm run lumo -- learn --input docs/cases/lumo-learn-dogfood.md --path fixtures/nextjs-dashboard-action-risk
```

## Behavior

- `--input <file|->` or `--stdin` is required; missing input exits `2`.
- Empty input exits `1`.
- `--task` is optional.
- `--path <repo>` is optional and triggers only a static repo scan when provided.
- `--format markdown|json` defaults to markdown.
- Exactly one proposal is returned per run.
- Proposal text is derived from matched categories and section headings, not by
  copying packet lines verbatim.
- Sensitive-looking packets return `pause` and use redacted evidence such as
  `Sensitive content present; not echoed.`

## Proposal Types

| Type | Use When |
| --- | --- |
| `deterministic_check` | Repeated CI/check/setup/verification friction. |
| `repo_rule` | Repeated approval, safety, scope, or final-summary friction. |
| `workflow_note` | Repeated process/runbook/release/checkpoint friction. |
| `skill_prompt_update` | Repeated agent instruction or tool-use friction. |
| `do_nothing` | One-off, unclear, sensitive, broad, or not worth encoding. |

## Status Rules

- `go`: one small proposal is clear and proposal-only.
- `check_again`: packet lacks a repeated signal, target, or evidence section.
- `pause`: packet includes privacy/PII, secrets, production, external side
  effects, or global policy-change signals.
- `pivot`: packet asks for broad platform automation or automatic memory/rule
  rewrites.

## JSON Shape

```json
{ "inputPath": "... or null", "inputSource": "file", "task": null, "learn": { "proposal": { "type": "workflow_note" } } }
```

## Validation

Covered by unit tests in `src/learn.test.ts` and CLI tests in
`src/index-cli.test.ts`.
