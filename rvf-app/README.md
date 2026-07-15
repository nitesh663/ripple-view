# rv — Enterprise Semantic Validation Framework

The framework monorepo: the UI-agnostic engine, CLI, dashboard, and lint packages that detect shared-library and theme-upgrade regressions across consumer apps before they ship.

- **Packages** (npm workspace, created during Sprint 0): `@rippleview/core`, `@rippleview/cli`, `@rippleview/dashboard`, `@rippleview/lint`, plus `@rippleview/plugin-*`.
- **Design source of truth:** the [RippleView design docs]().
- **Work tracking:** the RippleView backlog, component **UI Platform**.

## Packages

| Package                                 | Description                                                         |
| --------------------------------------- | ------------------------------------------------------------------- |
| [`@rippleview/core`](packages/core/README.md) | UI-agnostic engine — config loader, Zod schemas, RunContext builder |
| [`@rippleview/cli`](packages/cli/README.md)   | CLI entry point (`rv` command) — the only CI contract             |
| `@rippleview/dashboard`                       | Result dashboard                                                    |
| `@rippleview/lint`                            | Lint rules for consumer apps                                        |

## Start here

0. **Not a developer, or want the big picture first?** Read [`docs/HOW-IT-WORKS.md`](docs/HOW-IT-WORKS.md) — a no-code explanation of local vs. repo-bundle testing and how a library decides if a new version is safe to publish.
   0a. **Writing test cases?** Read [`docs/WRITING-TEST-CASES.md`](docs/WRITING-TEST-CASES.md) — the full list of supported Gherkin steps (actions + assertions) and how to put together a scenario, no code required.
1. Read [`AGENTS.md`](AGENTS.md) — the rules and workflow for everyone, human or AI.
2. Open the [Agile Roadmap]() and follow the **Execution Order** top to bottom, starting at **Step 1 (US-0.1, )**. Each step is dependency-safe.
3. To implement a step with AI: in Claude Code run `/implement-story <STORY-KEY>`. AI is advisory — every change is human-reviewed (Golden Rule G4).

## Language conventions

All source code in this repository is **TypeScript 5.x strict**. There is one deliberate exception:

- **`scripts/preflight.mjs`** is plain JavaScript (ESM). It is a bootstrap utility that must run with bare `node` before `npm install` has been executed — making it TypeScript would require a runtime (`tsx`) that isn't yet installed. Everything else, including tests for this script, is TypeScript.

## AI enablement

This repo is wired for any AI coding tool. `AGENTS.md` is the single source of truth; `CLAUDE.md` is a thin adapter; roles and commands live in [`docs/ai/`](docs/ai/). See [`docs/ai/README.md`](docs/ai/README.md).

## Related repos

- **RippleViewTests** — QA-owned Component Test Contracts + YAML/Gherkin tests + base-test packages.
- **rippleview-examples** — demo Angular + React consumer apps to validate against.

These are **separate repositories** (not submodules); they interact via published npm packages, the registry, and the `rv` CLI.
