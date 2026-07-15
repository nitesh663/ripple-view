# AGENTS.md — RippleView (Enterprise Semantic Validation Framework)

> **This is the single source of truth for AI coding in this repository — Claude Code.** The tool-specific entry file (`CLAUDE.md`) is a thin pointer to this file. Read this first, every session.
>
> The binding standards live **in this file** (the Golden Rules in §2 and the conventions in §4) — self-contained, nothing external to fetch. Work is tracked in **Jira**; each story carries its acceptance criteria and links any design doc it needs.

## 1. What you are building

RippleView is a **UI-agnostic semantic validation framework** that detects shared-library and theme-upgrade regressions across many consumer apps _before they ship_. It is a TypeScript monorepo of `@rippleview/*` packages plus QA-owned base tests and demo apps. You do not need prior context — this file plus the Jira issue you are implementing are enough.

## 2. The Golden Rules (hard constraints — never violate)

These are condensed from the [Engineering Standards — Golden Rules](). If any task seems to require breaking one, **stop and flag it** — the rule is catching a real problem.

```
G1  @rippleview/core is stateless + UI-agnostic; it imports nothing app/framework/vendor-specific.
G2  Locators are A11y-tree only (role + accessible name + path). No XPath, CSS, or data-testid hunting.
G3  A base-test version ALWAYS equals the component version under test; published lockstep; never hardcoded by an app.
G4  AI assists developers only. AI/LLM calls NEVER run inside the gate/CI. (This applies to you: you are advisory.)
G5  Persistence is MongoDB-document-shaped JSON. PoC writes files shaped exactly like the future Mongo collections.
G6  Config = one workspace file + one per app (never an array). `department` is a dashboard label only.
G7  The `rv` CLI is the only contract with CI. Outputs are CI-neutral (exit code + JUnit + Allure + summary.json).
G8  All heavy work runs in Linux containers; host tooling is the Node CLI only. Must work on Mac/Windows/Linux.
G9  The candidate library is tested in a PRODUCTION build served by nginx — never a dev server.
G10 A build/peer-dep break is a finding (confidence 0), not a crash. Catch and report it.
G11 New UI/framework support is a plugin (TS interface + dynamic import), never a fork of core.
G12 The visual verdict is multi-signal (geometry → computed-style → pixel) aligned by semantic anchor — not raw HTML diff.
G13 Determinism is mandatory before any assertion: freeze time, animation, fonts, network. A flaky test is a bug.
G14 Coverage = semantic surface (routes / A11y nodes / states), never lines of code.
G15 Layer-0 bans apply to the framework's own code too: no hardcoded tokens, ::ng-deep, !important, ViewEncapsulation.None.
G16 Public APIs are explicit and guarded by api-extractor. A breaking change to a published surface = a major version bump.
G17 Confidence is an honest blend, never a guaranteed "good to publish". Never round a score up to force a green gate.
G18 Secrets come from vault → env → .npmrc; never commit or log them; redact PII in screenshots/network.
G19 Three repos, not a mono-of-everything: rv (framework+dashboard), RippleViewTests (QA-owned), rippleview-examples (demos).
G20 Every change ships green through RippleView's own gate (lint + types + unit + relevant checks) before merge.
```

## 3. Standards you must follow

The binding standards are **self-contained in this file**: the **Golden Rules (G1–G20)** in §2 and the **baseline conventions** in §4. There is nothing external to fetch.

- **Code style / TypeScript, repo layout, plugin SPI, testing, versioning** → follow §4 and match the surrounding code. The package boundaries are described inline where they matter (e.g. `@rippleview/core` stays agnostic per G1).
- **Story-specific design** → read whatever the Jira issue links in its _Reference_ section.

If a standard you need isn't covered here, ask a human rather than guessing.

## 4. Baseline conventions (quick reference)

- **TypeScript 5.x, `strict`**, ESM, **Node 20 LTS**, **npm** workspaces. **Vitest** for unit, **Playwright Test** for browser/visual.
- **Named exports only** in library packages; no default exports. **No `any`**, no `@ts-ignore` (use `@ts-expect-error` + reason).
- Packages: `@rippleview/core | cli | dashboard | lint`, plugins `@rippleview/plugin-<name>`, base tests `@RippleViewTests/<component>`.
- **Conventional Commits** (`feat(core): …`). Branches `feat/<scope>-<short>`. Squash-merge.
- Errors: one `RippleViewError` hierarchy with stable `code`. **Findings are data, not exceptions** (G10).

## 5. How to implement a story (the workflow)

Implement the story identified by its **Jira key**. Follow [`docs/ai/implementation-workflow.md`](docs/ai/implementation-workflow.md):

1. **Fetch the Jira issue** via the Jira MCP (`jira_getIssue`) — it has the requirement, scope, **acceptance criteria**, tasks, and Definition of Done. Read any design doc the issue links.
2. **Plan** against the tasks + AC. Confirm which Golden Rules apply.
3. **Implement** in the correct package/path (see Repository & Module Layout), matching surrounding code.
4. **Test** — every AC needs a test; respect determinism (G13).
5. **Self-review** with the reviewer role ([`docs/ai/agents/reviewer.md`](docs/ai/agents/reviewer.md)) against the Golden Rules + the story's AC.
6. **Open a PR** for **human review** using the PR template. You never self-merge (G4). CI runs RippleView's own gate (G20).

## 6. Roles & commands (Claude Code)

- **Roles:** [`docs/ai/agents/implementer.md`](docs/ai/agents/implementer.md) and [`docs/ai/agents/reviewer.md`](docs/ai/agents/reviewer.md) define what each role does; wired as the `rv-implementer` / `rv-reviewer` subagents.
- **Commands:** [`docs/ai/skills/implement-story.md`](docs/ai/skills/implement-story.md) and [`docs/ai/skills/standards-check.md`](docs/ai/skills/standards-check.md) define the repeatable workflows; wired as `/implement-story` and `/standards-check`.
- **Architecture & wiring** is in [`docs/ai/README.md`](docs/ai/README.md). All point back here.

## 7. Definition of Done (global)

Code + unit/integration tests merged; runs green in the `rv-runner` image locally; documents/artifacts conform to the Specs; behavior demoed on an `rippleview-examples` app; design docs updated; **no new Layer-0 violations**; human-approved PR with a green gate.
