# Lumo Learn Dogfood

## Source

Seeded from the product learning section of
`docs/cases/linkwise-release-pr-status-dogfood.md`, with details kept redacted and
category-level only.

## Friction

- Release readiness mixed check status, bot findings, branch drift, deployment
  state, and runtime proof in one conversation.
- The next action was harder to choose because proof categories were not shown as
  separate lanes.

## Repeated Signal

- repeated

## Evidence

- Redacted case notes showed the same release-status ambiguity across multiple
  proof categories.
- The strongest reusable signal was category separation, not a project-specific
  raw log line.

## Desired Next Time

- Make the status card separate active bot findings from checks.
- Keep deployment state and runtime proof separate.
- Include branch-drift sync as its own release-status lane.

## Constraints

- Proposal only.
- Proposal only; do not perform any writes or tool-side changes.
- Do not copy raw case lines into a durable rule.

## Dogfood Command

```bash
npm run lumo -- learn --input docs/cases/lumo-learn-dogfood.md --task "Learn from repeated release-status friction"
```

## Expected Shape

- Status: `go`.
- Proposal: one `workflow_note` or `deterministic_check` proposal.
- Evidence: section headings and category signals only.
- Footer: read-only/no queried systems.
