# Implementation Workflow

The repeatable loop Claude (or a human) follows to take one Jira story from "To Do" to a human-reviewable PR. Referenced by [`AGENTS.md`](../../AGENTS.md), the slash commands, and the agent roles.

## Inputs

- A **Jira issue key** (e.g. `PROJ-1234`). If none is given, ask which story to implement.

## Steps

### 1. Gather context (cheap first)

- **Fetch the Jira issue** through the Jira MCP (`jira_getIssue`): requirement, scope, **acceptance criteria (AC)**, tasks, Definition of Done, story points.
- Open any **design doc** the issue links in its _Reference_ section.
- Skim only the parts of the codebase the story touches (use _Repository & Module Layout_ in [`AGENTS.md`](../../AGENTS.md)); don't read the whole tree.

### 2. Plan

- List the concrete files you'll add/change; keep `@rippleview/core` agnostic (G1).
- Map each **task** and each **AC** to a change + a test.
- Note which **Golden Rules** apply. If the story can't be done without breaking one, **stop and raise it** — don't work around it.
- Keep scope to _this_ story's tasks; sibling concerns belong to sibling stories.

### 3. Implement

- Write code that reads like the surrounding code; match naming/idioms.
- Named exports only; no `any`/`@ts-ignore`; A11y-tree locators only; findings are data, not exceptions.
- Put app/framework specifics behind config/SPI, never in core.

### 4. Test (every AC)

- Unit (Vitest) for logic; Playwright Test for browser/visual.
- **Determinism (G13):** freeze time, animation, fonts, network; wait on stable role signals, never fixed sleeps.
- Each acceptance criterion must have at least one assertion that would fail if the AC were unmet.

### 5. Self-review

- Run the **reviewer role** ([`agents/reviewer.md`](agents/reviewer.md)) or `/standards-check` against the diff.
- Verify: all AC covered by tests; no Golden-Rule violation; no new Layer-0 violation; lint + types + unit green locally.

### 6. Open a PR (human-in-the-loop)

- Branch `feat/<scope>-<short>`; Conventional Commit title.
- Fill `.github/pull_request_template.md`: link the **Jira key** + any design doc, check the AC/DoD/Golden-Rule boxes, list which standards applied.
- **Do not merge.** A human reviews and approves; CI runs RippleView's own gate (G20). AI is advisory (G4).

## Output

A focused PR that: implements exactly the story's tasks, has a test per AC, passes lint/types/unit, links the Jira key, and awaits human approval.

## Done means

The global Definition of Done in [`AGENTS.md`](../../AGENTS.md) §7 is satisfied and the PR is human-approved with a green gate.
