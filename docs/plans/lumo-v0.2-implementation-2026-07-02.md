# Lumo v0.2 Implementation Plan

Terminal gate: **IMPLEMENTATION_PACKET_READY**

## Goal

Finish the frozen Lumo Harness v0.2 local control-layer toolset by adding three deterministic, read-only/local commands:

1. `harness-map` — inventory the agent/repo harness Codex is already relying on.
2. `route` — classify a user request into the smallest useful operating mode and recommend the first Lumo tool, or stay silent.
3. `learn` — turn redacted workflow friction into one small proposed harness improvement, without writing anything.

v0.2 stays intentionally small and dogfoodable. Codex should be able to use Lumo during normal work while Zoey sees only decision-worthy moments.

## Background

- `docs/v0.2-scope.md:24` freezes the v0.2 toolset; `docs/v0.2-scope.md:40` names `harness-map`, `route`, and light `learn` as the remaining tools.
- `docs/v0.2-scope.md:130` defines the seal criteria: each remaining command has markdown and JSON output, tests, one dogfood case, README flow docs, and passing checks.
- `docs/product-direction.md:36` defines the loop: `preflight -> agent work -> checkpoint -> agent work -> review -> learn -> better harness -> preflight`.
- Current implementation style is centralized CLI dispatch in `src/index.ts:20` and `src/index.ts:35`, with pure card builders and renderers such as `createPreflightCard` / `renderPreflightCard` in `src/preflight.ts:44` and `src/preflight.ts:118`.
- Shared repo evidence comes from `scanRepository()` in `src/scanner.ts:60` and `RepoScan` in `src/schemas.ts:80`.
- Status vocabulary is already `go | check_again | pause | pivot` in `src/preflight.ts:3`, reused by checkpoint/review/thread-checkpoint and narrowed by `pr-status` in `src/pr-status.ts:7`.

## Approach

Keep every new tool additive:

- one module per tool: `src/harness-map.ts`, `src/route.ts`, `src/learn.ts`;
- one pure `create*Card` per tool;
- one `render*Card` markdown renderer per tool;
- CLI wrapper branches in `src/index.ts`;
- unit tests for card logic and renderer shape;
- CLI tests in `src/index-cli.test.ts` for markdown, JSON, missing flags, stdin/file behavior where relevant, and no-write behavior;
- slice docs and one dogfood case per tool.

Do **not** introduce a command registry, MCP server, TUI, SaaS surface, automatic writes, deep memory/session mining, or global rule rewriting.

## Tool Contracts

### 1. `harness-map` v1

Purpose: answer `What does this agent already rely on?`

#### CLI

```bash
npm run lumo -- harness-map --path <repo>
npm run lumo -- harness-map --path <repo> --format json
npm run lumo -- harness-map --path <repo> --codex-home <dir> --agents-home <dir>
```

Inputs:

- `--path <repo>` optional; default `process.cwd()`.
- `--format markdown|json`; default markdown.
- `--codex-home <dir>` optional. If absent, use `CODEX_HOME` only when it points to a readable directory; otherwise mark global Codex layer `not_checked`.
- `--agents-home <dir>` optional. If absent, use `AGENTS_HOME` only when it points to a readable directory; otherwise mark agents layer `not_checked`.

Avoid expanding `~/.codex` / `~/.agents` implicitly in v1 unless the implementation already has a safe, testable home-dir helper. Fake-home flags are enough for the first dogfood. Global/home inspection must stay separate from `scanRepository()` so repo content scanning never runs over user home directories.

#### Card shape

Use `PreflightStatus` as `HarnessMapStatus`.

```ts
type HarnessMapSourceStatus = "found" | "missing" | "not_checked" | "limited";

type HarnessMapItem = {
  kind: "agent_rule" | "workflow" | "doc" | "command" | "skill" | "plugin" | "risk" | "gap";
  label: string;
  path?: string;
  detail: string;
};

type HarnessMapCard = {
  status: PreflightStatus;
  mode: "deterministic";
  summary: string;
  layers: {
    globalCodex: { status: HarnessMapSourceStatus; items: HarnessMapItem[] };
    globalAgents: { status: HarnessMapSourceStatus; items: HarnessMapItem[] };
    repoAgents: { status: HarnessMapSourceStatus; items: HarnessMapItem[] };
    repoDocs: { status: HarnessMapSourceStatus; items: HarnessMapItem[] };
    workflows: { status: HarnessMapSourceStatus; items: HarnessMapItem[] };
    commands: { status: HarnessMapSourceStatus; items: HarnessMapItem[] };
    skills: { status: HarnessMapSourceStatus; items: HarnessMapItem[] };
    plugins: { status: HarnessMapSourceStatus; items: HarnessMapItem[] };
  };
  overlaps: string[];
  gaps: string[];
  staleSignals: string[]; // v1 may leave empty unless freshness is trivial to compute safely.
  recommendation: string;
  userDecision: string;
  evidence: string[];
  privacyBoundary: string[];
  notVerified: string[];
};
```

Exports:

```ts
readHarnessMapState({ repoPath, codexHome, agentsHome }): Promise<HarnessMapState>
createHarnessMapCard(scan: RepoScan, state: HarnessMapState): HarnessMapCard
renderHarnessMapCard(card: HarnessMapCard, input: { repoPath: string }): string
```

JSON envelope:

```json
{ "repoPath": "...", "harnessMap": { } }
```

#### Scan sources

Use existing `RepoScan` first:

- package scripts and verification commands;
- repo agent files from `scan.harness.agentRuleFiles`;
- docs/workflows/prompts/schema/fixture/eval/provider files;
- `scan.currentRails`, `scan.missingRails`, `scan.risks`, `scan.notVerified`.

Add shallow metadata-only checks for optional global/local harness sources:

- `<codexHome>/AGENTS.md` existence only;
- `<agentsHome>/AGENTS.md` existence only;
- `<codexHome>/skills/*/SKILL.md` names only;
- `<agentsHome>/skills/*/SKILL.md` names only;
- `<codexHome>/plugins/*/plugin.json` manifest name only;
- repo `.codex-plugin/plugin.json` and `.codex/plugins/*/plugin.json` manifest name only.

Implementation rule for optional global/home sources: use a bounded, non-recursive directory listing at each named root; read only known manifest filenames (`plugin.json`) when needed for a display name; never read arbitrary markdown bodies or recursively walk user home. If a directory is unreadable, too large to inspect safely, or does not match the expected shape, mark that layer `limited` or `not_checked`.

#### Status rules

- `go`: repo has usable local rails and at least one verification command.
- `check_again`: map is useful, but one expected layer is missing or not checked, such as no repo agent rules or no verification command.
- `pause`: risky repo seams exist and missing rails include provider/data/approval gates.
- `pivot`: multiple overlapping rule sources exist with no clear repo source of truth, so the harness itself needs narrowing before automation.

#### Privacy boundaries

`harness-map` must not read or render:

- `.env*` values;
- memory or session transcripts;
- global `AGENTS.md` bodies;
- skill bodies;
- plugin implementation files;
- external system state.

It may render only names, paths, existence, counts, and manifest display names. Defer freshness/staleness buckets unless they are trivial and metadata-only; an empty `staleSignals` array is acceptable for v1.

Markdown sections:

```md
# Lumo Harness Map
## Status: ...
## Summary
## Global/User Layer
## Repo Agent Layer
## Repo Docs And Workflows
## Commands
## Skills And Plugins
## Overlaps
## Gaps
## Stale Signals
## Recommendation
## User Decision
## Evidence Used
## Privacy Boundary
## Not Verified
```

Footer: `Read-only: no files were written and no external systems were queried.`

#### Tests and docs

- Unit tests for status rules, privacy boundaries, layer summaries, overlap/gap detection, and renderer headings.
- CLI tests for markdown, JSON, optional fake `--codex-home` / `--agents-home`, and no target repo writes.
- Docs: `docs/harness-map-slice.md` and `docs/cases/lumo-harness-map-dogfood.md`.

### 2. `route` v1

Purpose: answer `What mode is this request, and should Lumo do anything?`

#### CLI

```bash
npm run lumo -- route --task "..."
npm run lumo -- route --path <repo> --task "..." --format json
npm run lumo -- route --task "..." --no-scan
npm run lumo -- route --task "..." --map <harness-map-json>
```

Inputs:

- `--task` required; missing or blank exits `2`.
- `--path <repo>` optional; default cwd unless `--no-scan` is set.
- `--no-scan` skips `scanRepository()` and allows task-only routing.
- `--map <file>` optional; consumes only a minimal subset of prior `harness-map --format json` as context if present. If that coupling feels heavy during implementation, keep the flag but return `check_again` with a `notVerified` note rather than expanding schema scope.

#### Card shape

```ts
type RouteMode =
  | "tiny_answer"
  | "lightweight_patch"
  | "standard_feature"
  | "bugfix_investigation"
  | "long_agent_thread"
  | "pr_release"
  | "harness_improvement";

type RouteSurface = "silent" | "compact_card" | "decision_card";

type RecommendedTool = {
  tool: "harness-map" | "preflight" | "checkpoint" | "review" | "thread-checkpoint" | "pr-status" | "learn";
  timing: "before_work" | "during_work" | "before_done" | "after_friction";
  required: boolean;
  commandHint: string;
};

type RouteCard = {
  status: PreflightStatus;
  mode: RouteMode;
  surface: RouteSurface;
  why: string;
  recommendedTools: RecommendedTool[];
  firstMove: string;
  inputsNeeded: string[];
  stopIf: string[];
  userDecision: string;
  evidence: string[];
  notVerified: string[];
};
```

Exports:

```ts
createRouteCard(input: { task: string; scan?: RepoScan; harnessMap?: MinimalHarnessMapContext }): RouteCard
type MinimalHarnessMapContext = {
  status?: PreflightStatus;
  gaps?: string[];
  overlaps?: string[];
  notVerified?: string[];
};

readHarnessMapContext(filePath: string): Promise<MinimalHarnessMapContext>
renderRouteCard(card: RouteCard, input: { repoPath?: string; task: string }): string
```

JSON envelope:

```json
{ "repoPath": "... or null", "task": "...", "route": { } }
```

#### Mode taxonomy and tool recommendations

Classification order should be deterministic and conservative:

1. `pr_release` — PR, merge, release, CI/checks, deploy, review thread, runtime proof. Recommend `pr-status`.
2. `long_agent_thread` — delegated/autonomous thread, heartbeat, continuation, blocker, handoff, or thread packet. Recommend `thread-checkpoint`.
3. `harness_improvement` — Lumo, harness, AGENTS, skill, workflow, operating contract, rules. Recommend `harness-map`; recommend `learn` only after a friction packet exists.
4. `bugfix_investigation` — bug, regression, failing test, root cause, debug, reproduce. Recommend `preflight`, then `checkpoint`, then `review`.
5. `lightweight_patch` — small local docs/copy/rename/test-only change with no risk terms. Recommend optional `preflight`, required `review` before done.
6. `tiny_answer` — explanation, rewrite, or safe local fact with no code-change, bug, PR, production, or risk terms. Recommend no tools.
7. `standard_feature` — default. Recommend `preflight`; recommend `harness-map` first only when scan/map suggests missing rails or unclear source of truth.

Tie-breaker: higher-risk workflow terms win over `tiny_answer`. For example, `explain this failing test` is `bugfix_investigation`, `review this PR` is `pr_release`, and `explain this production deploy failure` is `pr_release` or `bugfix_investigation` with `pause`, not `tiny_answer`. Reuse the existing preflight risk vocabulary where practical; duplication is acceptable only if kept local and tested.

#### Status and surface rules

- `go`: route is clear and no approval boundary is present.
- `check_again`: one context/tool pass is needed before implementation.
- `pause`: task mentions production, auth, billing, database/migration, provider I/O, deploy, destructive action, external side effects, or privacy/PII.
- `pivot`: task is too broad or outside v0.2, such as `rewrite the whole app`, `make everything production-ready`, `build MCP`, `build SaaS`, or automatic global rule rewriting.

`tiny_answer` must return:

```ts
surface: "silent"
recommendedTools: []
firstMove: "Answer directly; do not show a Lumo card unless the user asks."
```

The CLI still prints output when explicitly invoked; agent callers use `surface: "silent"` to avoid ceremony.

Markdown sections:

```md
# Lumo Route
## Status: ...
## Mode: ...
## Surface
## First Move
## Recommended Tools
## Inputs Needed
## Stop If
## User Decision
## Evidence Used
## Not Verified
```

Footer: `Read-only: no files were written and no external systems were queried.`

#### Tests and docs

- Unit tests cover all seven modes, status escalation, silence behavior, and recommended tools.
- CLI tests cover missing `--task`, JSON, `--no-scan`, `--map`, and no-write behavior.
- Docs: `docs/route-slice.md` and `docs/cases/lumo-route-dogfood.md`.

### 3. `learn` v0/light

Purpose: answer `What small harness improvement follows from this friction?`

#### CLI

```bash
npm run lumo -- learn --input <packet.md>
cat packet.md | npm run lumo -- learn --stdin
npm run lumo -- learn --input - --format json
npm run lumo -- learn --input <packet.md> --task "..."
npm run lumo -- learn --input <packet.md> --path <repo>
```

Inputs:

- `--input <file|->` or `--stdin` required; missing exits `2`.
- empty stdin/file exits `1`.
- `--task` optional.
- `--path <repo>` optional; scan only when explicitly provided.
- `--format markdown|json`; default markdown.

Preferred packet shape:

```md
# Lumo Learn Packet

## Friction
- ...

## Repeated Signal
- repeated | one_off | unknown

## Evidence
- Redacted facts only.

## Desired Next Time
- ...

## Constraints
- ...
```

Loose markdown/text is allowed, but heuristics must stay conservative.

#### Card shape

```ts
type LearnProposalType =
  | "repo_rule"
  | "workflow_note"
  | "deterministic_check"
  | "skill_prompt_update"
  | "do_nothing";

type LearnProposal = {
  type: LearnProposalType;
  title: string;
  target: string;
  changeSummary: string;
};

type LearnCard = {
  status: PreflightStatus;
  mode: "deterministic";
  proposal: LearnProposal;
  why: string;
  allowedActions: string[];
  blockedActions: string[];
  evidence: string[];
  notVerified: string[];
  userDecision: string;
};
```

Exports:

```ts
createLearnCard(input: { content: string; task?: string; scan?: RepoScan; inputPath?: string }): LearnCard
renderLearnCard(card: LearnCard, input: { inputPath?: string; inputSource: "file" | "stdin"; task?: string }): string
```

JSON envelope:

```json
{ "inputPath": "... or null", "inputSource": "file | stdin", "task": "... or null", "learn": { } }
```

#### Proposal rules

Exactly one proposal per run:

1. `deterministic_check` — repeated CI/check/setup friction.
2. `repo_rule` — repeated approval, safety, scope, or final-summary friction.
3. `workflow_note` — repeated process/runbook friction.
4. `skill_prompt_update` — repeated agent instruction/tool-use friction.
5. `do_nothing` — one-off, unclear, or not worth encoding.

Status rules:

- `go`: one small proposal is clear and proposal-only.
- `check_again`: packet lacks repeated signal, target, or evidence.
- `pause`: packet includes privacy/PII, secrets, production, external side effects, or global policy changes.
- `pivot`: packet asks for broad platform automation or automatic memory/rule rewrites.

`learn` must never write repo docs, global rules, memories, skills, GitHub, Linear, CRM, production, or external systems. It can only propose.

Markdown sections:

```md
# Lumo Learn
## Status: ...
## Proposal
## Why
## Allowed Actions
## Blocked Actions
## User Decision
## Evidence Used
## Not Verified
```

Footer: `Read-only: no files were written and no external systems were queried.`

#### Tests and docs

- Unit tests cover each proposal type, status escalation, one-proposal limit, redaction/privacy behavior, and renderer headings.
- CLI tests cover file input, stdin, `--input -`, missing input exit `2`, empty input exit `1`, JSON shape, optional scan, and no writes.
- Docs: `docs/learn-slice.md` and `docs/cases/lumo-learn-dogfood.md`.

## Integration Work

### `src/index.ts`

Add:

- command union entries: `"harness-map" | "route" | "learn"`;
- imports for new modules;
- `parseCommand()` accepted names;
- dispatch branches;
- help text examples;
- flag reads for `--codex-home`, `--agents-home`, `--no-scan`, `--map`.

Keep current flag helper style. Do not add a CLI parsing dependency.

### `README.md`

Add a compact v0.2 flow:

```txt
route -> harness-map/preflight -> checkpoint -> review -> learn
```

Add one markdown and one JSON example for each new command. Make the positioning explicit: local control layer, not MCP/SaaS.

### Docs and cases

Add:

- `docs/harness-map-slice.md`
- `docs/route-slice.md`
- `docs/learn-slice.md`
- `docs/cases/lumo-harness-map-dogfood.md`
- `docs/cases/lumo-route-dogfood.md`
- `docs/cases/lumo-learn-dogfood.md`

Then update:

- `docs/v0.2-scope.md` after each tool lands;
- `docs/mvp-gaps.md` in the seal PR, moving the tools from missing to local v0.2 with caveats.

## Ordering and PR-Sized Slices

### PR 1 — `harness-map`

Build first because `route` can optionally consume a map and because `learn` should propose improvements against a known harness surface.

Acceptance criteria:

- `harness-map --path fixtures/nextjs-dashboard-action-risk` prints markdown.
- `--format json` includes `{ repoPath, harnessMap.status }`.
- Uses `RepoScan` for repo rails, commands, docs/workflows, risks, gaps, and not-verified notes.
- Fake temp `--codex-home` / `--agents-home` tests prove global metadata is detected without rendering file bodies.
- Unit and CLI tests pass.
- No fixture or target repo writes.
- Dogfood case exists and records privacy/not-verified boundaries.

### PR 2 — `route`

Build second because it is the front door and should route to the now-existing `harness-map` when needed.

Acceptance criteria:

- All seven modes are covered by unit tests.
- Missing `--task` exits `2`.
- `tiny_answer` returns `surface: "silent"` and no recommended tools.
- PR/release requests recommend `pr-status`.
- harness improvement requests recommend `harness-map`.
- bugfix requests recommend `preflight` first.
- broad/risky/out-of-v0.2 tasks return `pivot` or `pause`.
- `--no-scan` works without requiring a readable repo.
- `--map` consumes a prior harness-map JSON file.
- Dogfood case exists.

### PR 3 — `learn` v0/light

Build third because it can use the prior dogfood cases and the new map/route shape to stay grounded.

Acceptance criteria:

- File input, stdin, and `--input -` work.
- Missing input exits `2`; empty input exits `1`.
- JSON includes `{ inputPath, inputSource, task, learn }`.
- Exactly one proposal per run.
- Sensitive-looking packets return `pause` and do not echo raw sensitive content.
- Sanitization rule: derive proposal text from matched categories and section headings, not by copying packet lines verbatim. If the only useful evidence is raw sensitive content, output `pause` with redacted evidence such as `Sensitive content present; not echoed.`
- No writes.
- Dogfood case exists, seeded from `docs/cases/linkwise-release-pr-status-dogfood.md:182` and/or the new v0.2 dogfood notes.

### PR 4 — v0.2 seal

Acceptance criteria:

- README explains the Codex-facing local control-layer flow in under two minutes.
- `docs/v0.2-scope.md` and `docs/mvp-gaps.md` reflect the implemented local v0.2 state and caveats.
- Each new command has markdown + JSON examples in docs.
- Each new command has one dogfood case.
- Run and record:
  - `npm test`
  - `npm run typecheck`
  - `npm run build`
  - `npm run public:check`
- Docs clearly say v0.2 is local/read-only control-layer tooling, not MCP, TUI, or SaaS.

The three new commands must not support `--output`, `--write`, or any flag that writes generated artifacts. If an existing shared helper can write output, do not route these commands through it in v0.2.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| `harness-map` over-reads private/global data | Metadata only for global sources; no skill bodies, memory/session logs, env files, or external queries. |
| `route` adds ceremony to tiny work | `tiny_answer.surface = "silent"`; no recommended tools. |
| `learn` becomes disguised auto-writing or leaks packet content | Proposal-only, one proposal max, explicit blocked actions, no write flags, no `exampleText`, and sanitize from categories/headings rather than raw packet lines. |
| Status vocabulary becomes inconsistent | Reuse `PreflightStatus`; define command-specific meanings in each module/doc. |
| Scope creep toward MCP/TUI/SaaS | Keep those explicitly parked through the seal PR. |
| Deterministic routing feels imperfect | Prefer conservative heuristics, explicit tie-breakers, and `notVerified` notes; do not add LLM synthesis in v0.2. |

## Parked Until After v0.2

- MCP server.
- TUI.
- SaaS.
- Auth/license gate.
- Multi-language expansion.
- Claude Code parity.
- Automatic global rule rewriting.
- Deep memory/session mining.
- Full macOS app.
- Auto-writing learn proposals.
- Browser/CRM/Linear/GitHub side effects beyond existing read-only `pr-status` metadata reads.

## Final Gate

This plan is sufficient for implementation. The next workflow should be `rp-build` for direct implementation in the four PR-sized slices above, or `rp-orchestrate` if Zoey wants separate execution threads per slice.
