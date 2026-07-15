# Agile Roadmap — Epics, Stories & Sprints

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Agile Roadmap — Epics, Stories & Sprints** within the RippleView framework. Part of the **RippleView** documentation set.

## 5. Practical implementation plan

Build **inside-out**: prove the agnostic engine on one example app, then layer knowledge, orchestration, and intelligence. Each phase ends with a demonstrable, independently valuable capability.

### Phase 0 — Foundations & Proof of Concept *(prove the risky core)*

- Scaffold the `rv` workspace (`core`, `registry`, `cli`, `dashboard` packages) + `rippleview-examples` (one Angular app + one shared lib) + `RippleViewTests`.

- Build E1, E7, E6, E8, E14, E13 minimally; run **one YAML functional test via A11y locators in Docker** against the example app.

- **Exit criteria / outcome:** a zero-XPath test passes; refactor the example component's DOM and watch the test *still pass* (the core thesis, proven).

### Phase 1 — Visual engine MVP *(the zero-test safety net)*

Built **proven-first** (see [RippleView_VISUAL_CRAWLER.md](RippleView_VISUAL_CRAWLER.md) §13 VC-0→VC-3): pipeline + Capturer + pixel differ + baseline on Script/Storybook providers (VC-0), then semantic anchoring + geometry + computed-style differs (VC-1), then RouteCrawlerProvider default-state capture (VC-2), then role-based state probes (VC-3).
- Build E9/E9b/E10/E12 incrementally; E11 (viewport baseline) minimally.
- **Outcome:** point the engine at the example app with **no tests** → Golden Baseline captured; introduce a CSS/layout regression → caught with a value-level finding. The proven base (VC-0/1 on Storybook/Script) ships even if autonomous crawl (VC-2/3) lags — nothing is scrapped.

### Phase 2 — Knowledge & read-only dashboard

- Build K1 scanner + K2 model; populate `registry.json` from example repos.

- Build I1 dashboard **fleet view** (versions, drift score) + I2 Allure run report.

- **Outcome:** "which app runs which version, how far behind" is visible.

### Phase 3 — Compatibility gate *(the headline capability)*

- Build O2 (impact selection + beta override + **backward-compat matrix**), O5 CLI, O4 issue/threshold, O1 static gate (Layer 0 first-pass: token + `::ng-deep` rules).

- Add a 2nd example consumer to exercise the matrix.

- **Outcome:** change the shared lib → gate runs new code against each consumer's current tests → red/green verdict with bug-vs-intentional flow. **This is the demo that sells the platform.**

### Phase 4 — Component-inherent tests & versioning

- Build E4 (version resolver) + base-test packaging (Verdaccio as the PoC registry; config-swappable to Nexus for prod); `use/extend/import` model.

- **Outcome:** library ships base tests; consumer imports; correct version resolved per context (§6.1).

### Phase 5 — Coverage & brownfield onboarding

- Build O3 coverage engine (semantic surface, visual + functional %) + new-code ratchet.

- **Outcome:** dashboard shows coverage %, gate enforces minimums on *touched* surface only.

### Phase 6 — Intelligence & enterprise hardening

- AI Author/Triage agents (I3/I4); WCAG (axe) + Web Vitals; matrix (theme/locale); X1 Plugin SPI; X2 redaction/secrets; X3 RBAC/audit; O6 notifications; X4 `rv init`; I2 metrics export.

- **Outcome:** production-grade, self-service, compliant platform.

### Phase 7 — Rollout

- Pilot on 1–2 real apps + the most-consumed library; Phase-0 baseline all remaining apps for instant safety nets; enable the ratchet org-wide; onboard teams via golden-path docs. The PoC does NOT touch any existing repo (aos-libraries or the real consumers): it mirrors a few `@op/*` libs + Angular consumer apps in `rippleview-examples` (using the examples' own separate Jenkins). Because the design is config-driven, adoption is just "replace the examples with the real `@op/*` libraries and consumer apps" — no framework code change, only config (registry endpoint, `registry.json` entries, per-app configs).

---

## Legend

- **US-x.y** = user story · **T-x.y.z** = task · **AC** = acceptance criteria (Given/When/Then) · **DoD** = definition of done.

- Source refs in brackets, e.g. *[design §6.1]*.

---

## Execution Order — follow top to bottom

> 

**How to use this list.** Start at Step 1 and work down. Each step is sequenced so its prerequisites are already done by the time you reach it — **you do not need to reason about dependencies**. Pick the step, open its issue (full requirement, scope, acceptance criteria, tasks and Definition of Done live there), implement it, get it reviewed, then move to the next step. No prior knowledge of the framework is required to follow this order.

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

******

****

****

****

****

****

****

****

| Step | Story | Phase | Points |
| --- | --- | --- | --- |
| 1 | US-0.1 Developer environment & prerequisites | Sprint 0 · Foundation | 2 |
| 2 | US-0.2 Create Git repositories & settings | Sprint 0 · Foundation | 3 |
| 3 | US-0.3 Initialize rv npm monorepo | Sprint 0 · Foundation | 3 |
| 4 | US-0.4 Base TypeScript, ESLint, Prettier & EditorConfig | Sprint 0 · Foundation | 3 |
| 5 | US-0.5 VSCode workspace settings | Sprint 0 · Foundation | 2 |
| 6 | US-0.6 Git hooks & commit conventions | Sprint 0 · Foundation | 3 |
| 7 | US-0.7 Versioning & release tooling | Sprint 0 · Foundation | 3 |
| 8 | US-0.8 Package skeletons & build pipeline | Sprint 0 · Foundation | 5 |
| 9 | US-0.9 RippleViewTests & rippleview-examples scaffolding | Sprint 0 · Foundation | 5 |
| 10 | US-0.10 Repository CI bootstrap | Sprint 0 · Foundation | 3 |
| 11 | US-16.1 Repository AI instructions (CLAUDE.md & Copilot) | Sprint 0 · AI Enablement | 3 |
| 12 | US-16.2 Claude Code subagents (implementer & reviewer) | Sprint 0 · AI Enablement | 5 |
| 13 | US-16.3 Claude Code skills / slash commands | Sprint 0 · AI Enablement | 5 |
| 14 | US-16.4 Human-in-the-loop review workflow & guardrails | Sprint 0 · AI Enablement | 3 |
| 15 | US-16.5 Prompt/context templates & traceability | Sprint 0 · AI Enablement | 3 |
| 16 | US-1.1 Config & Tenant Resolver | Sprint 1 | 3 |
| 17 | US-1.2 CLI entry point | Sprint 1 | 3 |
| 18 | US-1.3 Result store (Mongo-shaped, file-backed) | Sprint 1 | 5 |
| 19 | US-1.4 Plugin SPI skeleton | Sprint 1 | 5 |
| 20 | US-1.5 Runner Docker image | Sprint 1 | 3 |
| 21 | US-2.1 Global session hydration | Sprint 1 | 5 |
| 22 | US-2.2 API-first data seeding & teardown | Sprint 1 | 3 |
| 23 | US-3.1 YAML/Gherkin parser | Sprint 1 | 5 |
| 24 | US-3.2 Universal step library | Sprint 2 | 8 |
| 25 | US-3.3 Region scoping & cross-browser | Sprint 2 | 5 |
| 26 | US-5.1 Version-swap mechanism | Sprint 2 | 5 |
| 27 | US-5.2 App-runtime image (build + serve) | Sprint 2 | 5 |
| 28 | US-5.3 Consumer code acquisition (BundleStore & rv bundle) | Sprint 2 | 5 |
| 29 | US-5.4 Isolation unit (compose) + wait/collect/teardown | Sprint 2 | 8 |
| 30 | US-17.1 Fixture architecture, oracle manifest & design spec | Sprint 2 · Demo Fixtures | 3 |
| 31 | US-17.2 Angular component libraries — ng15 line | Sprint 2 · Demo Fixtures | 5 |
| 32 | US-17.3 Angular component libraries — ng17 line | Sprint 2 · Demo Fixtures | 5 |
| 33 | US-17.4 React component libraries — react18 & react19 lines (future extension only; not in the Angular v1 demo scope) | Backlog | 8 |
| 34 | US-17.5 Angular consumer apps across generations (ng15/ng17) | Sprint 2 · Demo Fixtures | 5 |
| 35 | US-17.6 React consumer apps across versions (future extension only; not in the Angular v1 demo scope) | Backlog | 5 |
| 36 | US-17.7 Brownfield & least-maintained fixtures | Sprint 2 · Demo Fixtures | 5 |
| 37 | US-17.8 Per-app onboarding + registry/impact-selection integration demo | Sprint 2 · Demo Fixtures | 5 |
| 38 | US-6.1 Registry scanner | Sprint 2 | 5 |
| 39 | US-6.2 Impact selection | Sprint 2 | 5 |
| 40 | US-17.1 Real LocatorStrategy (Playwright) | Sprint 3 | 8 |
| 41 | US-17.2 Real StepExecutor (full action/assertion catalog) | Sprint 3 | 8 |
| 42 | US-17.3 Real WaitStrategy (network-idle + visual settle) | Sprint 3 | 5 |
| 43 | US-17.4 Context-menu, overlay & portal support | Sprint 3 | 5 |
| 44 | US-17.5 API call validation (network capture) | Sprint 3 | 8 |
| 45 | US-17.6 Native dialog & multi-tab/window handling | Sprint 3 | 5 |
| 46 | US-17.7 Real EngineExecutor & wire rv run | Sprint 3 | 8 |
| 47 | US-7.1 Backward-compatibility gate (Context 2) | Sprint 3 | 8 |
| 48 | US-7.2 Two-speed gate & beta flow | Sprint 3 | 5 |
| 49 | US-8.1 Component Test Contract | Sprint 3 | 5 |
| 50 | US-8.4 Contract anchor generation from a running playground app | Sprint 3 | 5 |
| 51 | US-8.5 Real-time required-anchor check with detailed, actionable findings | Sprint 3 | 3 |
| 52 | US-8.2 Base-test packaging & version resolution | Sprint 3 | 8 |
| 53 | US-8.3 Lockstep publish trigger | Sprint 3 | 3 |
| 54 | US-4.1 Capture→diff→baseline pipeline on Script/Storybook (VC-0) | Sprint 3 | 8 |
| 55 | US-4.2 Semantic anchoring + geometry + style differs (VC-1) | Sprint 3 | 8 |
| 56 | US-12.1 Dashboard API + ingest | Sprint 3 | 5 |
| 57 | US-12.2 View 1 Fleet (version tracking) | Sprint 3 | 5 |
| 58 | US-12.4 Allure reporting | Sprint 3 | 3 |
| 59 | US-4.3 RouteCrawlerProvider default-state capture (VC-2) | Sprint 4 | 8 |
| 60 | US-4.4 Role-based state probes (VC-3) | Sprint 4 | 8 |
| 61 | US-10.1 Phase-0 production baseline | Sprint 4 | 3 |
| 62 | US-10.2 Coverage engine + ratchet | Sprint 4 | 5 |
| 63 | US-9.1 Issue fingerprinting & accepted-bug bypass | Sprint 4 | 5 |
| 64 | US-9.2 Threshold gate | Sprint 4 | 3 |
| 65 | US-11.1 Token & encapsulation rules | Sprint 4 | 5 |
| 66 | US-11.2 API-stability & a11y rules | Sprint 4 | 5 |
| 67 | US-12.3 Views 2–5 (Readiness, Builds, Issue-Tracker, Danger) | Sprint 4 | 8 |
| 68 | US-13.1 CI adapters & neutral outputs | Sprint 4 | 5 |
| 69 | US-14.1 Validation matrix (viewport × theme × locale) | Backlog | 5 |
| 70 | US-14.2 WCAG layer | Backlog | 3 |
| 71 | US-14.3 Web Vitals budgets | Backlog | 3 |
| 72 | US-14.4 Security & redaction | Backlog | 5 |
| 73 | US-14.5 Flakiness governance | Backlog | 3 |
| 74 | US-14.6 Governance / RBAC / audit | Backlog | 5 |
| 75 | US-14.7 Scaffolding (rv init) | Backlog | 3 |
| 76 | US-14.8 Self-observability | Backlog | 3 |
| 77 | US-14.9 MFE composition testing | Backlog | 5 |
| 78 | US-14.10 Production migration | Backlog | 5 |
| 79 | US-18.2 Requirement-driven test-authoring agent & skill (repurposed from US-15.1 Author Agent → EPIC-18) | Sprint 5 · MVP Closeout | 8 |
| 80 | US-15.2 Triage Agent | Backlog | 8 |
| 81 | US-7.3 Remote gate delegation (submit/wait/callback) | Backlog | 8 |
| 82 | US-18.1 Tag-driven test execution + base-test import/extend & selective-run config | Sprint 5 · MVP Closeout | 8 |
| 83 | US-18.3 Author demo base test suites + consumer app extensions | Sprint 5 · MVP Closeout | 8 |
| 84 | US-18.4 Library-side beta-publish gate pipeline (Jenkins) — fan out to all consumers | Sprint 5 · MVP Closeout | 8 |
| 85 | US-18.5 Consumer-app rv CI integration — nightly + on-upgrade gate | Sprint 5 · MVP Closeout | 5 |
| 86 | US-18.6 Demo registry population + impact-selection wiring | Sprint 5 · MVP Closeout | 5 |

## *Total: 76 stories across foundation, AI enablement, the 4-sprint MVP, the MVP-closeout epic (EPIC-18), and the product backlog.*

## Epic map

| Epic | Title | Plane | MVP? |
| --- | --- | --- | --- |
| EPIC-0 | Project Foundation, Repos & Developer Environment | 0 | ✅ |
| EPIC-1 | Core Infrastructure & Agnostic Engine | 1 | ✅ |
| EPIC-2 | Auth/Session Hydration & Data Seeding | 1 | ✅ |
| EPIC-3 | Module 2 — Semantic BDD Engine | 1 | ✅ |
| EPIC-4 | Module 1 — Visual Validation Engine | 1 | ✅ (VC-0→3) |
| EPIC-5 | Isolation Pipeline & Dockerization | 1/3 | ✅ |
| EPIC-6 | Knowledge — Registry & Impact Selection | 2 | ✅ |
| EPIC-7 | Orchestration — Compatibility Gate | 3 | ✅ |
| EPIC-8 | Component-Inherent Tests & Versioning | 1/3 | ✅ |
| EPIC-9 | Issue-Tracker/Waiver & Accepted-Bug Management | 3 | ✅ |
| EPIC-10 | Coverage & Brownfield Onboarding | 3 | ✅ |
| EPIC-11 | Static Standards Gate (Layer 0) | 0/3 | ✅ (core rules) |
| EPIC-12 | Observability — Dashboard & Reporting | 4 | ✅ |
| EPIC-13 | CI Integration (Jenkins + GitHub Actions) | 3 | ✅ |
| EPIC-14 | Enterprise Hardening & Extensibility | all | Backlog |
| EPIC-15 | AI Assist (dev-side) | 4 | Backlog |
| EPIC-16 | AI Engineering Enablement (Agents, Skills & Instructions) | all | ✅ |
| EPIC-17 | Real Browser Execution Engine | 1 | ✅ |
| EPIC-18 | MVP Closeout — Test Authoring, CI Integration & Registry Wiring | 1/2/3 | ✅ |

---

## EPIC-0 — Project Foundation, Repos & Developer Environment

**Goal:** Everything required to go from an empty machine to a buildable, runnable monorepo — prerequisites, repositories, workspace, tooling, editor settings, and CI — so a new contributor with zero context can clone and build. This epic must be completed before any feature epic. [standards: Repository & Module Layout, Code Style & TypeScript Standards, Git/Versioning/CI Conventions]
**Labels:** RippleView, foundation, setup, mvp

### US-0.1 — Developer environment & prerequisites

*As a new contributor I want a documented, scripted dev-environment setup so that I can prepare a fresh machine without prior knowledge.*
- **AC1** — Given an onboarding doc, when followed on a clean machine, then Node 20 LTS, npm, Docker, Git and VSCode are installed and verified.
- **AC2** — Given a preflight script, when run, then it checks all required tool versions and reports pass/fail.
- **Tasks:** T-0.1.1 docs/CONTRIBUTING.md + prerequisites table (Node 20 LTS, npm, Docker Desktop, Git, VSCode). T-0.1.2 .node-version/.nvmrc + npm version pin. T-0.1.3 scripts/preflight.mjs tool-version checker. DoD: clean machine reaches a green preflight.

### US-0.2 — Create Git repositories & settings

*As a platform team I want the three repositories created with standard settings so that code has a home with protected mainlines.*
- **AC1** — Given the topology, then rv, RippleViewTests, rippleview-examples exist with default branch main.
- **AC2** — Given each repo, then branch protection (PR required, checks must pass), README, LICENSE, .gitignore and CODEOWNERS are configured.
- **Tasks:** T-0.2.1 create rv, RippleViewTests, rippleview-examples repos. T-0.2.2 branch protection + required checks on main. T-0.2.3 README/LICENSE/.gitignore/CODEOWNERS per repo. DoD: repos clone; direct push to main blocked.

### US-0.3 — Initialize rv npm monorepo

*As a developer I want the rv repo initialized as an npm workspace so that all framework packages live together and install in one step.*
- **AC1** — Given the rv repo, then root package.json (with the `workspaces` field) + .npmrc + packages/ exist and the npm version is pinned.
- **AC2** — Given a fresh clone, when `npm install` runs, then it completes with no errors.
- **Tasks:** T-0.3.1 root package.json `workspaces` (packages/*). T-0.3.2 root package.json scripts (build/test/lint/typecheck/format). T-0.3.3 .npmrc + npm version pin. DoD: `npm install` green at root.

### US-0.4 — Base TypeScript, ESLint, Prettier & EditorConfig

*As a developer I want shared TS/lint/format config so that every package enforces the same standards automatically.*
- **AC1** — Given tsconfig.base.json, then the strict options from the Code Style standard are set (strict, noUncheckedIndexedAccess, ESM, etc.).
- **AC2** — Given eslint + prettier + .editorconfig, when `npm run lint` and `npm run typecheck` run, then they pass on a sample package and fail on a seeded violation (e.g. any).
- **Tasks:** T-0.4.1 tsconfig.base.json (per Code Style standard). T-0.4.2 eslint flat config (typescript-eslint strict + stylistic + import rules). T-0.4.3 prettier + .editorconfig. DoD: lint/typecheck green; banned pattern errors.

### US-0.5 — VSCode workspace settings

*As a developer I want committed VSCode settings so that the editor formats, lints and debugs consistently for everyone.*
- **AC1** — Given .vscode/settings.json, then format-on-save + ESLint + default Prettier formatter + workspace TS SDK are configured.
- **AC2** — Given .vscode/extensions.json, then recommended extensions (ESLint, Prettier, Playwright, EditorConfig, Vitest) are prompted on open; launch.json provides debug configs.
- **Tasks:** T-0.5.1 .vscode/settings.json (format-on-save, eslint, formatter, tsdk). T-0.5.2 .vscode/extensions.json (recommendations). T-0.5.3 .vscode/launch.json (CLI + vitest debug). DoD: open folder prompts extensions; save formats.

### US-0.6 — Git hooks & commit conventions

*As a team I want enforced commit conventions and pre-commit checks so that history and code quality stay consistent.*
- **AC1** — Given husky + commitlint, then a non-Conventional-Commit message is rejected.
- **AC2** — Given lint-staged on pre-commit, then staged files are linted/formatted before commit.
- **Tasks:** T-0.6.1 husky install + hooks. T-0.6.2 commitlint (Conventional Commits config). T-0.6.3 lint-staged. DoD: bad commit blocked; staged files auto-fixed.

### US-0.7 — Versioning & release tooling

*As a maintainer I want changesets + api-extractor configured so that versions and public-API changes are governed per the standards.*
- **AC1** — Given changesets, when `npm run changeset` runs, then a changeset is recorded and a version dry-run computes bumps/changelog.
- **AC2** — Given api-extractor baseline config, then a public-API report is generated for a package.
- **Tasks:** T-0.7.1 changesets init + config. T-0.7.2 api-extractor base config + report check script. T-0.7.3 release/versioning docs. DoD: changeset + version dry-run + api report all work.

### US-0.8 — Package skeletons & build pipeline

*As a developer I want buildable empty skeletons for the core packages so that feature work starts on a working build/test pipeline.*
- **AC1** — Given @rippleview/core, @rippleview/cli, @rippleview/dashboard, @rippleview/lint scaffolds with index barrels + build config, then `npm run build --workspaces` emits dist + .d.ts.
- **AC2** — Given vitest config, then `npm test --workspaces` runs a sample test per package green.
- **Tasks:** T-0.8.1 scaffold 4 packages (package.json, tsconfig, src/index.ts, build via tsup/tsc). T-0.8.2 vitest config + sample tests. T-0.8.3 wire root scripts to run recursively. DoD: build + test green across packages.

### US-0.9 — RippleViewTests & rippleview-examples scaffolding

*As a team I want the QA and example repos scaffolded so that there are real targets to validate against from day one.*
- **AC1** — Given RippleViewTests (the net-new UI automation layer: Gherkin `.feature` files + YAML step definitions run by `rv`), then libraries/ + apps/ + workspace/app config templates (rippleview.workspace.yaml, rippleview.config.yaml) exist.
- **AC2** — Given rippleview-examples (a few mirror libraries following the `@op/*` convention + a few mirror Angular apps, with its OWN separate Jenkins pipeline — never a dependency of the framework), then a minimal Angular mirror lib + a minimal Angular consumer app build and serve locally.
- **Tasks:** T-0.9.1 RippleViewTests structure + config templates. T-0.9.2 rippleview-examples Angular mirror lib (`@op/*`-style) build+serve. T-0.9.3 rippleview-examples Angular consumer app (build+serve) + the examples' own Jenkins pipeline. DoD: both example apps serve; config templates validate.

### US-0.10 — Repository CI bootstrap

*As a maintainer I want the rv repo's own CI so that every PR is gated on lint/typecheck/test/build from the start.*
- **AC1** — Given a PR to rv, then CI runs lint + typecheck + unit + build and reports status.
- **AC2** — Given a failing check, then the PR is blocked by branch protection (US-0.2).
- **Tasks:** T-0.10.1 CI workflow (lint/typecheck/test/build). T-0.10.2 dependency cache + Node 20 matrix. T-0.10.3 required-check wiring. DoD: PR shows green checks; red blocks merge.

---

## EPIC-1 — Core Infrastructure & Agnostic Engine

**Goal:** a stateless, UI-agnostic engine driven by config + data, with a CLI, a deterministic runner image, a pluggable result store, and the plugin SPI skeleton. *[design §5, §17.1; impl §1–2]*

### US-1.1 — Config & Tenant Resolver

*As a* platform engineer *I want* the engine to load a workspace + per-app YAML and stamp a tenant identity *so that* one engine serves many apps without code change.
- **AC1 — Given** a valid `rippleview.workspace.yaml` + `apps/<app>/rippleview.config.yaml`, **when** the engine loads, **then** a validated run context (tenant, target, paths) is produced. *[design §5.1]*
- **AC2 — Given** a missing/invalid field, **when** loading, **then** the run fails fast with a precise schema error.
- **AC3 — Given** no `department`, **when** loading, **then** it defaults to `default`.
- **Tasks:** T-1.1.1 `packages/core/src/config/schema.ts` — Zod schemas for both files (DoD: invalid configs rejected with path). T-1.1.2 `config/loader.ts` — merge workspace+app, env interpolation (DoD: `${ENV}` resolved). T-1.1.3 unit tests for valid/invalid.

### US-1.2 — CLI entry point

*As a* CI/dev user *I want* an `rv` CLI *so that* every environment invokes the engine identically. *[impl §5.4, §10]*
- **AC1 — Given** `rv run --config <path>`, **then** the engine executes and exits 0/non-0 by verdict.
- **AC2 — Given** `rv --help`, **then** commands `run|gate|crawl|scan|baseline|report|init` are listed.
- **Tasks:** T-1.2.1 `packages/cli` (oclif) command skeleton (DoD: commands stubbed, exit codes wired). T-1.2.2 `gate --local` brings up compose (DoD: see EPIC-5). T-1.2.3 JSON `summary.json` emitted on every run.

### US-1.3 — Result store (Mongo-shaped, file-backed)

*As a* dashboard *I want* results written as tenant-tagged JSON documents *so that* they can move to Mongo later unchanged. *[design §10; specs §6]*
- **AC1 — Given** a completed run, **then** `runs/`, `results/` documents exist under `results/<dept>/<target>/`.
- **AC2 — Given** two apps running concurrently, **then** their documents never collide (path isolation).
- **Tasks:** T-1.3.1 `core/src/store/ResultStore.ts` interface + `FileResultStore` (DoD: documents match specs §6 shapes). T-1.3.2 tenant stamping middleware. T-1.3.3 redaction hook placeholder *[design §17.5]*.

### US-1.4 — Plugin SPI skeleton

*As a* platform team *I want* stable extension points *so that* any UI/team extends without forking. *[design §17.1; impl §5.1]*
- **AC1 — Given** a plugin package declaring an interface impl, **when** referenced in config, **then** it is dynamically loaded.
- **AC2 — Given** an SPI version mismatch, **then** loading fails with a clear message.
- **Tasks:** T-1.4.1 `core/src/spi/` interfaces (`SceneProvider`, `Validator`, `LocatorStrategy`, `AuthProvider`, `SeedProvider`, `Reporter`, `RulePack`, `RegistryResolver`). T-1.4.2 plugin registry + dynamic `import()` loader + version check. T-1.4.3 built-ins registered through the SPI (DoD: a built-in loads via the same path).

### US-1.5 — Runner Docker image

*As a* CI *I want* a deterministic `rv-runner` image *so that* results are identical everywhere. *[impl §2.2]*
- **AC1 — Given** the image, **then** it is based on the pinned Playwright image with `@rippleview/cli` installed.
- **AC2 — Given** a config + volume, **when** `docker run rv-runner run ...`, **then** results are written to the mounted volume.
- **Tasks:** T-1.5.1 `Dockerfile` (Playwright base + CLI). T-1.5.2 CI build+publish of the image. DoD: `docker run` executes a sample test.

---

## EPIC-2 — Auth/Session Hydration & Data Seeding

**Goal:** log in once, inject session into all workers; seed/teardown data via API. *[design §5.1 hooks; SRS ORC-03/04/05]*

### US-2.1 — Global session hydration

*As a* test suite *I want* a single auth at startup serialized into worker contexts *so that* tests don't each log in.
- **AC1 — Given** an `auth` hook, **when** the suite starts, **then** cookies/JWT are captured once and injected into every browser context.
- **AC2 — Given** an expired session, **then** re-auth is triggered.
- **Tasks:** T-2.1.1 `core/src/auth/AuthProvider.ts` (SPI) + default storage-state injector. T-2.1.2 worker context wiring. DoD: 2 workers share one login.

### US-2.2 — API-first data seeding & teardown

*As a* scenario *I want* `Given` state established via API and purged after *so that* the UI isn't used for setup and envs stay clean.
- **AC1 — Given** a `seed` hook, **when** a scenario runs, **then** the backend state is established before the browser opens.
- **AC2 — Given** a finished scenario, **then** the `teardown` hook purges created data.
- **Tasks:** T-2.2.1 `SeedProvider`/`Teardown` SPI + lifecycle hooks. T-2.2.2 namespacing per run. DoD: data created and removed verified.

---

## EPIC-3 — Module 2: Semantic BDD Engine

**Goal:** zero-XPath functional execution from YAML/Gherkin. *[design §5.2; specs §4–5; SRS BDD-01..05]*

### US-3.1 — YAML/Gherkin parser

*As a* QA *I want* `.feature` + linked `.yaml` parsed into executable scenarios *so that* I author in BDD without code.
- **AC1 — Given** a `.feature` + `.yaml` per specs §4, **then** scenarios with tags/steps are produced.
- **AC2 — Given** a malformed file, **then** a precise parse error is raised.
- **Tasks:** T-3.1.1 `core/src/bdd/parser.ts` (Gherkin + YAML binding). T-3.1.2 tag model. DoD: sample sort.feature/yaml parsed.

### US-3.2 — Universal step library

*As a* QA *I want* a fixed step vocabulary mapped to A11y actions *so that* steps survive framework upgrades. *[specs §5]*
- **AC1 — Given** `I activate the {role} "{name}"`, **then** `getByRole(role,{name}).click()` runs.
- **AC2 — Given** ARIA missing, **then** it falls back to `data-testid` before failing (BDD-03).
- **AC3 — Given** pending XHR, **then** assertions auto-wait until idle (BDD-04).
- **Tasks:** T-3.2.1 `core/src/bdd/steps/*` implementing the specs §5 catalog. T-3.2.2 `LocatorStrategy` SPI + A11y default + testid fallback. T-3.2.3 network-aware wait. DoD: each catalog row has a passing test.

### US-3.3 — Region scoping & cross-browser

*As a* QA *I want* `within the "{region}"` scoping and a browser matrix *so that* ambiguous elements resolve and steps run on Chromium/WebKit/Firefox unchanged. *[SRS BDD-02/05]*
- **AC1 — Given** two "Login" buttons, **when** scoped to "Header", **then** the header one is used.
- **AC2 — Given** a scenario, **then** it runs unchanged across the configured browsers.
- **Tasks:** T-3.3.1 region-scoping locator chaining. T-3.3.2 browser-matrix runner config. DoD: same scenario green on 3 engines.

---

## EPIC-4 — Module 1: Visual Validation Engine (VC-0 → VC-4)

**Goal:** zero-test visual regression via the multi-signal ledger; proven-first, autonomy layered on. *[RippleView_VISUAL_CRAWLER.md]*

### US-4.1 — Capture→diff→baseline pipeline on Script/Storybook (VC-0)

*As a* team *I want* a deterministic capture + pixel diff + accept/deny baseline *so that* I have a Chromatic-equivalent base. *[crawler §3,§9,§10]*
- **AC1 — Given** a Scene, **when** captured in Docker, **then** a Snapshot (a11yTree, dom, nodes, screenshot) is produced deterministically.
- **AC2 — Given** a baseline + a pixel change above YIQ threshold, **then** a finding is raised; below, none.
- **AC3 — Given** a new baseline accept, **then** subsequent runs compare against it; branch-aware resolution (ORC-06).
- **Tasks:** T-4.1.1 `core/src/visual/SceneProvider.ts` (SPI) + `ScriptProvider`. T-4.1.2 `Capturer` (freeze animations+timers, settle gates, mask). T-4.1.3 `PixelDiffer` (pixelmatch, YIQ, AA-ignore). T-4.1.4 `BaselineStore` (file) + accept/deny + branch resolution. DoD: CSS change caught; refactor-with-same-render not flagged at pixel level.

### US-4.2 — Semantic anchoring + geometry + style differs (VC-1)

*As a* QA *I want* value-level findings *so that* I see *what* changed, not just a pixel blob. *[crawler §6,§7]*
- **AC1 — Given** baseline & current, **then** nodes align by semantic anchor (role+name+path), surviving class/tag refactors.
- **AC2 — Given** a padding change, **then** a style finding reports `8px→12px`.
- **AC3 — Given** overlapping siblings / new scrollbar / clipping, **then** a HIGH-severity geometry finding is raised.
- **Tasks:** T-4.2.1 `Aligner` (anchor matching). T-4.2.2 `GeometryDiffer` (bounds/overlap/overflow/alignment). T-4.2.3 `StyleDiffer` (normalized rgba/px, token mapping). T-4.2.4 verdict assembler (tag/class-only change ⇒ no regression). DoD: QA-check→assertion table (crawler §12) cases pass.

### US-4.3 — RouteCrawlerProvider default-state capture (VC-2)

*As a* team *I want* configured routes auto-discovered and captured *so that* I get zero-test page coverage. *[crawler §4; SRS AGENT-CRAWL]*
- **AC1 — Given** routes/regions config, **then** the crawler discovers components via the A11y tree and pierces Shadow DOM.
- **AC2 — Given** discovery, **then** a SHA-256 state graph prevents loops/duplicates.
- **AC3 — Given** a destructive control, **then** the deny policy prevents its activation.
- **Tasks:** T-4.3.1 `RouteCrawlerProvider` + discovery. T-4.3.2 state-graph hashing (sanitized). T-4.3.3 interaction allow/deny + mutation stubbing + reset-to-clean. DoD: example app crawled with no tests; no destructive action fired.

### US-4.4 — Role-based state probes (VC-3)

*As a* team *I want* generic role probes *so that* interactive display states (dropdown open/selected, grid rows/pagination) are captured without scripts. *[crawler §8]*
- **AC1 — Given** a `combobox`, **then** closed/open/selected/cleared states are captured.
- **AC2 — Given** a `grid`, **then** default/row-hover/sort/checkbox/pagination states are captured.
- **AC3 — Given** a custom component, **then** a Contract-declared probe is used or it falls back to pixel-only.
- **Tasks:** T-4.4.1 probe SPI + library (combobox, grid, textbox, button, tab, dialog, checkbox). T-4.4.2 Contract-driven probe selection. DoD: ≥80% reachable visual coverage on the example app.

---

## EPIC-5 — Isolation Pipeline & Dockerization

**Goal:** build an impacted consumer against a candidate library in isolation, run automation, wait for output, collect, tear down. *[impl §2–3]*

### US-5.1 — Version-swap mechanism

*As a* gate *I want* to force a consumer onto a candidate library version *so that* I can test it without altering the app repo. *[impl §3.2]*
- **AC1 — Given** a candidate version, **when** provisioning, **then** the candidate is injected into a throwaway copy via the npm `overrides` field in package.json and installed with `npm install --legacy-peer-deps`, resolving transitively.
- **AC2 — Given** a local PoC, **then** a `file:`/`npm pack` override works with no registry; the Verdaccio PoC registry works when versioning is tested, and production points at Nexus (`@op:registry`, repo `opnpmprivate`) via a single `.npmrc`/config switch with no code change.
- **Tasks:** T-5.1.1 `scripts/inject-override.js` (npm `overrides` + `--legacy-peer-deps`). T-5.1.2 Verdaccio PoC compose service + publish step (config-swappable to Nexus for prod). DoD: consumer installs the candidate (file + Verdaccio paths).

### US-5.2 — App-runtime image (build + serve)

*As a* gate *I want* the consumer built against the candidate and served as a production build *so that* automation runs against realistic, deterministic output. Docker isolation is the PoC mechanism (built only for the EXAMPLE apps); the production deployment reality the design converges to is AWS S3 static hosting (`aos-static-ui-repository` → nginx/CDN, base-href). *[impl §2.2]*
- **AC1 — Given** a consumer + override, **then** a multi-stage build produces a served artifact with a healthcheck.
- **AC2 — Given** a peer-dep/compile break, **then** the build fails and is recorded as a backward-compat finding (confidence 0).
- **Tasks:** T-5.2.1 `app-runtime.Dockerfile` (build→nginx/node) — PoC, built for the example apps only. T-5.2.2 healthcheck. T-5.2.3 build-fail capture → finding. DoD: example consumer served; induced compile error reported, not swallowed.

### US-5.3 — Consumer code acquisition (BundleStore & rv bundle)

*As a* gate *I want* consumer code delivered as a sanitized, content-addressed bundle the consumer PUSHES (never pulled from SCM) *so that* I can build/serve it in isolation without holding any SCM credentials. *[impl §3.2, §3.7]*
- **AC1 — Given** a checked-out consumer, when `rv bundle` runs in the consumer's own CI, **then** a content-addressed (sha256) archive of source + lockfile(s) + `rippleview.config.yaml` is produced (node_modules/.git/dist excluded; secrets scrubbed).
- **AC2 — Given** a BundleStore profile, **then** LocalZip (PoC; unzip into the throwaway workspace) and OCI-artifact (prod; push/pull by digest) are interchangeable by config — no consumer change.
- **AC3 — Given** push-on-merge, **then** the store indexes the latest bundle per app so fan-out (US-7.1) resolves each consumer without SCM access.
- **Tasks:** T-5.3.1 `rv bundle` (pack+scrub+digest). T-5.3.2 BundleStore SPI + LocalZipBundleStore. T-5.3.3 OciBundleStore (oras). T-5.3.4 latest-per-app index + push-on-merge. T-5.3.5 wire the isolation unit (US-5.4) to fetch via BundleStore. DoD: example consumer bundled → unzipped → built+served; RippleView holds zero SCM credentials.

### US-5.4 — Isolation unit (compose) + wait/collect/teardown

*As a* gate *I want* an app+runner unit that waits for readiness, runs, collects, and tears down *so that* each consumer is tested in a clean disposable env. *[impl §3.3,§3.4]*
- **AC1 — Given** the unit, **then** the runner starts only after `service_healthy` and the orchestrator blocks on `--exit-code-from runner`.
- **AC2 — Given** completion, **then** results+Allure are collected and `compose down -v` purges data.
- **AC3 — Given** an unhealthy app (timeout), **then** the unit is marked errored (infra), not a product fail.
- **Tasks:** T-5.3.1 compose template generator. T-5.3.2 CLI `gate --local` orchestration (cross-platform, Node). T-5.3.3 failure/flake handling table (impl §3.5). DoD: one consumer fully gated locally end-to-end.

---

## EPIC-6 — Knowledge: Registry & Impact Selection

**Goal:** derive the version graph and select impacted consumers. *[design §7; arch K1/K2]*

### US-6.1 — Registry scanner

*As a* platform *I want* the version graph derived from `package.json` *so that* truth isn't hand-maintained. *[design §7]*
- **AC1 — Given** repos/lockfiles, **when** `rv scan` runs, **then** `registry.json` (framework→`@op/*` library→consumers) is produced; non-npm / non-Angular repos (e.g. a Java/Spring backend) are skipped, not treated as consumers.
- **AC2 — Given** multiple Angular generations (the `-ng15`/`-ng17` suffix channels in use today), **then** each generation channel is a distinct namespace and version comparison parses the channel suffix first.
- **Tasks:** T-6.1.1 `packages/registry/src/scanner.ts` (skip repos with no `package.json` / no Angular dependency). T-6.1.2 generation-channel grouping (`-ng15`/`-ng17`/`-ag27`). T-6.1.3 on-demand + nightly modes. DoD: example repos produce a correct graph; a non-Angular repo is skipped.

### US-6.2 — Impact selection

*As a* gate *I want* the impacted consumers for a candidate *so that* only relevant apps run. *[design §9; impl §4 ③]*
- **AC1 — Given** a changed package, **then** only consumers importing it are selected.
- **AC2 — Given** each selected app, **then** its current library version + base-test version are resolved.
- **Tasks:** T-6.2.1 `registry/src/impact.ts` (dependency-graph query). T-6.2.2 per-consumer version resolution. DoD: candidate → correct impacted set + versions.

---

## EPIC-7 — Orchestration: Compatibility Gate

**Goal:** run a candidate against impacted consumers using backward-compat semantics; two-speed; beta flow. *[design §9, §6.1; impl §4]*

### US-7.1 — Backward-compatibility gate (Context 2)

*As a* library dev *I want* my candidate run against each consumer's CURRENT base tests *so that* backward compatibility is proven before publish. *[design §6.1 Context 2]*
- **AC1 — Given** a candidate + impacted apps, **then** each app runs `component@candidate` × `tests@app's-current-version`.
- **AC2 — Given** a passing matrix, **then** the verdict allows promotion; failing → blocked with per-app reasons.
- **AC3 — Given** a failure, **then** dev can classify bug vs intentional (→ EPIC-9).
- **Tasks:** T-7.1.1 `packages/registry`/orchestrator `gate.ts` fan-out. T-7.1.2 per-app test-version resolution wiring (EPIC-8). T-7.1.3 verdict aggregation + `summary.json`. DoD: candidate green/red across 2 example consumers.

### US-7.2 — Two-speed gate & beta flow

*As a* platform *I want* fast PR gates and full nightly/pre-publish gates *so that* feedback is quick but thorough. *[design §9]*
- **AC1 — Given** a PR, **then** only impacted apps + tagged tests run via the fast override channel.
- **AC2 — Given** nightly, **then** all apps + full matrix run.
- **AC3 — Given** an urgent consumer, **then** it can pin a beta and the dashboard flags it "ungated beta".
- **Tasks:** T-7.2.1 trigger modes (pr/nightly/promotion). T-7.2.2 beta publish + dist-tag promote-on-green. DoD: both speeds demonstrated.

### US-7.3 — Remote gate delegation (submit/wait/callback)

*As a* consumer pipeline *I want* to delegate a gate run to the RippleView service and block on the verdict *so that* I upgrade to the candidate, wait, and publish only on green — without running the engine myself. *[impl §3.8]* **(Product Backlog / post-MVP.)**
- **AC1 — Given** the orchestrator core, **then** it is callable in-process (PoC `gate --local`) AND exposed as `POST /v1/runs` + `GET /v1/runs/{id}` over the same core — no logic fork.
- **AC2 — Given** `rv gate --submit --wait`, **then** it long-polls to a 0/non-zero exit (the gate); `--callback <url>` POSTs the verdict for long fan-outs.
- **AC3 — Given** the API, **then** per-tenant token auth is enforced and results integrate with the Notifier status-check (US-13.1) + dashboard review UI.
- **Tasks:** T-7.3.1 in-process-callable core. T-7.3.2 run-submission API + async lifecycle. T-7.3.3 --wait/--callback CLI. T-7.3.4 per-tenant auth. DoD: a consumer pipeline submits a bundle to a local gate service, blocks, gates publish on the exit code — identical to `gate --local`.

---

## EPIC-8 — Component-Inherent Tests & Versioning

**Goal:** base tests ship with components, version with them, resolved per context. *[design §6, §6.1; specs §3]*

### US-8.1 — Component Test Contract

*As a* library dev *I want* a `contract.yaml` per component *so that* tests, coverage, and anchors have a declared surface. *[specs §3]*
- **AC1 — Given** a `contract.yaml` per specs §3, **then** anchors/states/api/data validate against the schema.
- **AC2 — Given** a missing required anchor in the component, **then** the a11y/structure check flags it.
- **Tasks:** T-8.1.1 contract schema + validator in `core`. T-8.1.2 example `datagrid/contract.yaml`. DoD: contract validated; used by coverage + anchors.

### US-8.2 — Base-test packaging & version resolution

*As a* runner *I want* to fetch the base-test version matching the specific `@op/<lib>` version (and suffix channel) under test *so that* there is no skew. *[design §6.1]*
- **AC1 — Given** an app on `@op/data-grid@18.1.0-ng17`, **then** the base tests versioned in lockstep to that exact `@op/<lib>` version + suffix channel (`@RippleViewTests/data-grid@18.1.0-ng17`) are loaded. Version resolution must parse the generation-suffix channel (`-ng17`/`-ng15`/`-ag27`) before matching.
- **AC2 — Given** a gate (Context 2), **then** the app's CURRENT base-test version (for that `@op/<lib>` + channel) is loaded against the candidate code.
- **AC3 — Given** Context 3 adoption, **then** the NEW base-test version (for that `@op/<lib>` + channel) is loaded.
- **Tasks:** T-8.2.1 `core/src/tests/VersionResolver.ts` (registry/gate → version). T-8.2.2 publish of base-test packages to the Verdaccio PoC registry (per-`@op/<lib>` lockstep; config-swappable to Nexus for prod). T-8.2.3 `use/extend/import` resolution in app config. DoD: all three contexts load the correct version.

### US-8.3 — Lockstep publish trigger

*As a* platform *I want* each library's releases to publish a matching base-test version *so that* they cannot drift. *[design §6.1 — ownership decided: component author updates the base test + publishes lockstep]*
- **AC1 — Given** an `@op/<lib>` release/beta, **then** a base-test package version matching that specific `@op/<lib>` version (including its suffix channel) is published by the library author's release pipeline — per-library lockstep, not one global component version.
- **AC2 — Given** an `@op/<lib>` change, **then** the library author has updated that library's base test as part of readying the publish.
- **Tasks:** T-8.3.1 release-pipeline hook (example). DoD: base-test version === the `@op/<lib>` version it covers (including suffix channel/prerelease); base-test update enforced in the release checklist.

### US-8.4 — Contract anchor generation from a running playground app

*As a* library/QA author *I want* a component's real anchors captured automatically from a running playground app *so that* `contract.yaml` authoring doesn't depend entirely on manually reading rendered source. *[follow-up]*
- **Note:** deliberately simplified — assumes the target playground/Storybook app is ALREADY running at a configured access point; this story does NOT build/serve the app itself. If the access point is unreachable, the script must exit with a clear, actionable error, never a silent no-op or fabricated anchors.
- **AC1 — Given** an access-points config naming a component and a URL/route where it's rendered in an already-running playground app, **then** the script captures the real accessibility-tree (role + accessible name) at that route and proposes anchors for it.
- **AC2 — Given** an existing `contract.yaml` for that component, **then** the script merges proposed anchors into it without destroying hand-authored fields (description/states/api/data/a11y).
- **AC3 — Given** the configured access point is not reachable, **then** the script exits non-zero with a clear message naming the unreachable URL and instructing the operator to start the app.
- **Tasks:** T-8.4.1 access-points config schema (component → playground URL/route). T-8.4.2 real accessibility-tree capture (Playwright accessibility snapshot) + the unreachable-app error path. T-8.4.3 anchor-merge into an existing (or new) `contract.yaml`, preserving hand-authored non-anchor fields. DoD: run against the real rippleview-examples playground apps (Angular ng15 + ng17) and confirm captured anchors match the real, already-authored contracts.

### US-8.5 — Real-time required-anchor check with detailed, actionable findings

*As a* library dev *I want* a real, run-now check that tells me exactly which required anchor is missing, on which component, and what's likely wrong, *so that* I can fix it myself rather than the framework silently working around it or a test author inventing a fictional locator. *[AC-2 + follow-up]*
- **Note:** deliberately scoped to anchor PRESENCE only, reusing the existing findMissingRequiredAnchors + captureAccessibilityTree (both already built) — does NOT build the full semantic-anchoring/geometry/style-diffing pipeline (that's Module 1 VC-1, much larger and separate).
- **AC1 — Given** a component's real access point and contract.yaml, **when** every required anchor is found in the real capture, **then** the check exits 0 with a clear pass summary.
- **AC2 — Given** a required anchor NOT found in the real capture, **then** the check exits non-zero with a finding naming the missing anchor id, its declared role+name pattern, the contract.yaml path, and a concrete hypothesis for the likely cause.
- **AC3 — Given** the finding, **then** the message tells the developer the concrete next step (fix accessibility, republish, re-run) — never silently passes, never fabricates a workaround locator.
- **Tasks:** T-8.5.1 `checkRequiredAnchors(contract, capturedNodes)` in `@rippleview/core/src/contract`. T-8.5.2 `rv contract check-anchors` CLI command, reusing the existing access-points.yaml + captureAccessibilityTree. T-8.5.3 DoD: run for real against the live ng17 playground and core-controls/rv-multi-select's real, currently-missing trigger anchor — not a synthetic fixture.

---

## EPIC-9 — Issue-Tracker/Waiver & Accepted-Bug Management

**Goal:** fingerprint failures, bypass via an issue within a bounded threshold. *[design §11]*

### US-9.1 — Issue fingerprinting & accepted-bug bypass

*As a* dev *I want* intentional failures bypassed via an issue-annotated signature *so that* tracked changes don't block, but new breakages do.
- **AC1 — Given** a failure matching an accepted signature, **then** it passes as `accepted`.
- **AC2 — Given** a NEW signature, **then** it fails and prompts a new issue.
- **Tasks:** T-9.1.1 `issueSignature` computation. T-9.1.2 `acceptedBugs/` store + annotation flow. DoD: same-issue bypassed, different-issue fails.

### US-9.2 — Threshold gate

*As a* platform *I want* a max accepted-bug threshold *so that* debt is bounded.
- **AC1 — Given** `count ≥ threshold−1`, **then** amber flag.
- **AC2 — Given** `count ≥ threshold`, **then** red + bypass disabled until burndown.
- **AC3 — Given** an issue resolved (fix shipped), **then** acceptance auto-expires and count drops.
- **Tasks:** T-9.2.1 threshold evaluation + flags. T-9.2.2 auto-expiry on version. DoD: threshold behavior verified.

---

## EPIC-10 — Coverage & Brownfield Onboarding

**Goal:** measure semantic-surface coverage; ratchet on touched code; instant production baseline. *[design §15]*

### US-10.1 — Phase-0 production baseline

*As a* team with 0 tests *I want* a one-run baseline of production *so that* I get an instant regression net.
- **AC1 — Given** a live app, **when** crawled, **then** current state is auto-blessed as the Golden Baseline.
- **Tasks:** T-10.1.1 characterization-mode capture. DoD: dormant app baselined with zero authoring.

### US-10.2 — Coverage engine + ratchet

*As a* lead *I want* visual+functional coverage % and a new-code gate *so that* touched code is covered and legacy isn't blocked.
- **AC1 — Given** discovered/contracted surface, **then** Visual % and Functional % are reported per component/route/app.
- **AC2 — Given** touched surface below `minFunctionalCoverage`, **then** the gate fails on the new code only.
- **Tasks:** T-10.2.1 coverage computation (surface denominators). T-10.2.2 diff→touched-surface mapping + ratchet. DoD: changing a component requires its coverage; legacy untouched passes.

---

## EPIC-11 — Static Standards Gate (Layer 0)

**Goal:** block token/encapsulation/API/a11y anti-patterns pre-build. *[design §16]*

### US-11.1 — Token & encapsulation rules

*As a* platform *I want* hardcoded tokens and `::ng-deep`/`!important` blocked *so that* theme regressions are prevented at source.
- **AC1 — Given** a hardcoded color/spacing, **then** the gate errors with the rule + location.
- **AC2 — Given** `::ng-deep`/`ViewEncapsulation.None`, **then** the gate errors.
- **Tasks:** T-11.1.1 Stylelint config + `declaration-strict-value`. T-11.1.2 PostCSS AST spacing/token rules. T-11.1.3 ban-rules pack. DoD: violations fail; clean code passes.

### US-11.2 — API-stability & a11y rules

*As a* platform *I want* public-API breaks and a11y gaps detected *so that* contracts and zero-XPath locators stay intact.
- **AC1 — Given** a removed `@Input`/export vs last published `.d.ts`, **then** a breaking-change error forces a semver major.
- **AC2 — Given** an interactive element missing role/label, **then** an a11y error.
- **Tasks:** T-11.2.1 api-extractor + ts-morph diff. T-11.2.2 `@angular-eslint`/`jsx-a11y` rule packs. DoD: API break + a11y gap both caught.

---

## EPIC-12 — Observability: Dashboard & Reporting

**Goal:** the five views + Allure. *[RippleView_DASHBOARD.md]*

### US-12.1 — Dashboard API + ingest

*As a* dashboard *I want* a read-only API over the documents *so that* views share the engine's computations.
- **AC1 — Given** `.rv/` files, **then** endpoints in dashboard §5 return data.
- **Tasks:** T-12.1.1 `packages/dashboard/api` (Fastify) + file ingest adapter. T-12.1.2 `builds/` + `scores/` writers wired into the gate. DoD: endpoints return live data.

### US-12.2 — View 1 Fleet (version tracking)

*As a* lead *I want* one place to see all apps × libraries and drift *so that* I know who's behind.
- **AC1 — Given** the registry, **then** the matrix shows consumed/latest versions + drift badges per generation channel (`-ng15`/`-ng17`), filterable; the drift score parses the suffix channel before computing majors/minors/patches behind.
- **Tasks:** T-12.2.1 `/fleet` endpoint. T-12.2.2 matrix UI (channel-aware drift). DoD: example fleet renders with badges.

### US-12.3 — Views 2–5 (Readiness, Builds, Issue-Tracker, Danger)

*As a* lead *I want* ship-readiness, build history, issue-tracker issues, and a danger list *so that* I can decide and act. *[dashboard §4]*
- **AC1 — Given** a candidate, **then** Readiness shows the explicit ship verdict + per-consumer reasons.
- **AC2 — Given** runs, **then** Build history + success-rate render.
- **AC3 — Given** accepted bugs, **then** the issue-tracker view lists them with threshold status.
- **AC4 — Given** scores, **then** the Danger panel ranks at-risk apps with specific reasons.
- **Tasks:** T-12.3.1 `/readiness` + ship rule. T-12.3.2 `/builds`. T-12.3.3 `/issues`. T-12.3.4 `/risk` + ranking. T-12.3.5 UIs + drill-down to Allure. DoD: all five views functional on PoC data.

### US-12.4 — Allure reporting

*As a* dev *I want* forensic drill-down to the failing step *so that* I can debug fast.
- **AC1 — Given** a failure, **then** an Allure trace (DOM/console/network) is captured (REP-02) and linked from the run report.
- **Tasks:** T-12.4.1 Allure reporter via SPI. T-12.4.2 trace capture on failure. DoD: `allure serve` shows step-level traces.

---

## EPIC-13 — CI Integration (Jenkins + GitHub Actions)

**Goal:** the CLI contract works identically on both. *[impl §10]*

### US-13.1 — CI adapters & neutral outputs

*As a* consumer team on any CI *I want* thin adapters calling `rv` *so that* the framework is CI-portable.
- **AC1 — Given** Jenkins, **then** a stage calls `rv gate` and archives JUnit/Allure/summary.
- **AC2 — Given** GitHub Actions, **then** the identical command runs and uploads artifacts.
- **AC3 — Given** a gate result, **then** an SCM status check + PR comment are posted via the Notifier.
- **Tasks:** T-13.1.1 `Jenkinsfile` + GH Actions workflow (examples). T-13.1.2 JUnit + `summary.json` emitters. T-13.1.3 `Notifier` SPI (GitHub Checks/Bitbucket/Slack/issue-tracker). DoD: same command green on both CIs.

---

## EPIC-14 — Enterprise Hardening & Extensibility *(Product Backlog)*

*[design §17]* Stories (AC summarized; full breakdown when scheduled):
- **US-14.1 Validation matrix** — viewport × theme × locale (RTL/text-expansion); baselines keyed per theme.
- **US-14.2 WCAG layer** — axe-core pass at configurable level, ratcheted.
- **US-14.3 Web Vitals budgets** — capture LCP/CLS/INP; fail on budget breach; CLS feeds layout signal.
- **US-14.4 Security & redaction** — PII masking in traces/baselines (Playwright `mask` + network scrub); vault secrets.
- **US-14.5 Flakiness governance** — retry policy, quarantine, flake-rate telemetry (<1%).
- **US-14.6 Governance/RBAC/audit** — roles + immutable approval/waiver log; SSO.
- **US-14.7 Scaffolding** — `rv init` templates + golden-path docs.
- **US-14.8 Self-observability** — Prometheus/Grafana metrics export.
- **US-14.9 MFE composition testing** — integration crawl of composed shells.
- **US-14.10 Production migration** — compose→k8s Jobs, files→Mongo, folder→S3, Verdaccio→private registry.

---

## EPIC-15 — AI Assist (dev-side) *(Product Backlog)*

*[design §13]*
- **US-15.1 Author Agent** — *repurposed & moved to EPIC-18 (US-18.2) for the MVP.* Original scope: reads an issue, drives the page via MCP, drafts YAML/feature tests + baselines for human blessing (reverse-engineering).
- **US-15.2 Triage Agent** — on a red gate, reads the Allure trace + layer diff, explains the failure, proposes a fix/issue.
- *Constraint:* never in the CI hot path; deterministic engine only in gates.

---

## EPIC-16 — AI Engineering Enablement (Agents, Skills & Instructions)

**Goal:** Equip AI coding tools (Claude Code, GitHub Copilot) to implement RippleView stories to standard, autonomously, with a human-in-the-loop review gate. Distinct from EPIC-15 (the framework's RUNTIME QA agents): EPIC-16 is the DEV-WORKFLOW AI that builds the framework itself. Should be completed right after the foundation so all later stories can be AI-assisted. [standards: AI Implementation Context Pack, Engineering Standards — Golden Rules]
**Labels:** RippleView, ai-enablement, setup, mvp

### US-16.1 — Repository AI instructions (CLAUDE.md & Copilot)

*As an AI coding tool I want repository instruction files so that I follow RippleView standards automatically.*
- **AC1** — Given CLAUDE.md at repo root, then it encodes the Golden Rules, repo layout and code style and points to the AI Implementation Context Pack.
- **AC2** — Given .github/copilot-instructions.md, then GitHub Copilot applies the same standards.
- **Tasks:** T-16.1.1 CLAUDE.md grounded in the Part VIII engineering standards. T-16.1.2 .github/copilot-instructions.md. T-16.1.3 source-of-truth link to the standards + keep-in-sync note. DoD: an agent loading the files cites the Golden Rules; review confirms coverage.

### US-16.2 — Claude Code subagents (implementer & reviewer)

*As a developer I want predefined AI agents so that story implementation and review follow a standard, repeatable workflow.*
- **AC1** — Given .claude/agents/rv-implementer, when invoked on a story, then it produces standards-compliant code + tests scoped to the story's tasks.
- **AC2** — Given .claude/agents/rv-reviewer, when given a diff, then it checks against the Golden Rules + the story's AC and reports violations.
- **Tasks:** T-16.2.1 rv-implementer agent definition (tools, prompt, standards context). T-16.2.2 rv-reviewer agent definition. T-16.2.3 sample run on a pilot story. DoD: implementer output passes lint/types; reviewer flags a seeded violation.

### US-16.3 — Claude Code skills / slash commands

*As a developer I want slash-command skills so that implementing or checking a story is a single, guided command.*
- **AC1** — Given `/implement-story <ISSUE-KEY>`, then it reads the issue + linked design doc, plans, implements per standards, self-reviews, and opens a PR for human review.
- **AC2** — Given /standards-check, then it audits the current diff against the engineering standards.
- **Tasks:** T-16.3.1 /implement-story skill (issue+design-doc fetch → plan → implement → PR). T-16.3.2 /standards-check skill. T-16.3.3 usage docs. DoD: skill drives a pilot story to a PR; standards-check reports findings.

### US-16.4 — Human-in-the-loop review workflow & guardrails

*As a lead I want guardrails so that AI accelerates delivery without bypassing human judgement or the deterministic gate.*
- **AC1** — Given an AI-generated PR, then CI runs RippleView's own gate and a human must approve before merge; AI never self-merges.
- **AC2** — Given the gate, then no AI/LLM call runs inside it (consistent with Golden Rule G4).
- **Tasks:** T-16.4.1 PR template + human-review checklist (AC met, Golden Rules, tests, no Layer-0 violations). T-16.4.2 branch-protection rule: human approval + green checks required. T-16.4.3 policy doc: AI advisory only, never in the gate. DoD: an AI PR cannot merge without human approval + green checks.

### US-16.5 — Prompt/context templates & traceability

*As a contributor I want reusable prompt/context templates so that AI gets the right standards + story context every time and PRs stay traceable.*
- **AC1** — Given a per-story prompt template, then it injects the AI Implementation Context Pack + the story's AC + DoD.
- **AC2** — Given a generated PR, then it references the issue key + the design page and lists which standards applied.
- **Tasks:** T-16.5.1 prompt/context template (Context Pack + story fields). T-16.5.2 PR body template with issue/design backlinks. T-16.5.3 traceability check. DoD: a generated PR links the issue + design page and cites standards.

## EPIC-17 — Real Browser Execution Engine

**Goal:** replace the always-pass `rv run` stub and the no-op `LocatorStrategy` with a real, deterministic, cross-browser execution engine — real locator resolution, the full §5.3 action/assertion catalog actually executed against Playwright, real network-idle waiting, context-menu/portal support, API call validation, and native dialog/multi-tab handling — so rv produces a true pass/fail verdict per scenario, covering the common real-app testing actions (navigate, scroll, context menu, drag/drop, API call validation, etc.). This is the prerequisite for US-7.1's backward-compatibility gate to mean anything real. *[specs §5; SRS BDD-01..05]*

### US-17.1 — Real LocatorStrategy (Playwright)

*As a* QA author *I want* the LocatorStrategy SPI implemented for real against Playwright *so that* every catalogued step resolves a real DOM element instead of doing nothing.
- **AC1** — role+name resolves via ARIA role+accessible-name; falls back to `data-testid` when ARIA lookup fails (BDD-03).
- **AC2** — resolveByLabel/resolveByText/resolveByTestId each resolve a real element against a real running fixture.
- **AC3** — `withScope()` composes nested scopes (T-3.3.3), proven against a real fixture with two same-named elements disambiguated only by nested region.
- **AC4** — the ordinal `index` parameter resolves the correct nth occurrence in document order.
- **Tasks:** implement `PlaywrightLocatorStrategy` in `@rippleview/plugin-playwright` against the existing SPI (no contract changes, G11). DoD: a real RippleViewTests fixture exercising scoping + ordinal disambiguation resolves correctly against a running playground.

### US-17.2 — Real StepExecutor (full action/assertion catalog)

*As a* QA author *I want* every catalogued action and assertion to actually execute against Playwright *so that* a scenario produces a real, specific pass/fail outcome instead of always passing.
- depends on US-17.1
- **AC1** — each of the 20 action types maps to a real Playwright call.
- **AC2** — each of the 11 assertion types maps to a real check, throwing a typed error with actual vs. expected on failure.
- **AC3** — a failing step halts the scenario and surfaces the exact failing step + reason.
- **Tasks:** define a `StepExecutor` SPI in `@rippleview/core`; implement `PlaywrightStepExecutor`. DoD: every catalogued action/assertion has a real-fixture-backed test, end-to-end.

### US-17.3 — Real WaitStrategy (network-idle + visual settle)

*As a* QA author *I want* assertions to auto-wait for real network idle and UI transitions to settle *so that* scenarios are deterministic against real apps (BDD-04).
- depends on US-17.1/US-17.2
- **AC1** — waitForNetworkIdle resolves only once there is no pending XHR/fetch, proven against a fixture with a deliberately delayed API call.
- **AC2** — a configurable timeout produces a clearly distinguishable timeout error.
- **AC3** — a short, bounded settle wait after navigation-changing actions (toggle/expand/activate) avoids racing component-library open/close animations.
- **Tasks:** implement `PlaywrightWaitStrategy`, replacing `NoOpWaitStrategy` as the real engine's default. DoD: a delayed-API fixture and an animated-dropdown fixture both produce a non-flaky verdict across 10 repeated real runs.

### US-17.4 — Context-menu, overlay & portal support

*As a* QA author *I want* to right-click to open a context menu and click a menu item *so that* real apps' right-click menus, dropdown panels, and dialogs are testable even when the UI library renders them in a DOM portal attached to `<body>` rather than inside the triggering component.
- depends on US-17.1/US-17.2
- **AC1** — a new step `I click the menu item "{name}"` resolves against the currently-open, portaled menu regardless of where it's actually attached in the DOM.
- **AC2** — a real fixture (e.g. a PrimeNG context menu or AG Grid right-click row menu) opens via the existing right-click action and a menu-item click produces a real pass verdict.
- **AC3** — `withScope()` fails with a clear, actionable error (never a silent false-negative) when asked to scope into a portaled region it structurally can't see.
- **Tasks:** extend the §5.3 catalog with `click-menu-item`; extend the locator/executor to search the full page for the open menu/dialog. DoD: a real right-click → menu-item-click scenario passes against a real rippleview-examples fixture using a library confirmed to portal its menu.

### US-17.5 — API call validation (network capture)

*As a* QA author *I want* to assert that a real API call was made, with what method/status/body *so that* the most common real-app testing need — verifying an action actually persisted via the right request — has first-class step coverage.
- independent of US-17.1–17.4, buildable in parallel
- **AC1** — a new `NetworkCapture` SPI in `@rippleview/core` (ctx-agnostic, G1) records requests/responses during a scenario.
- **AC2** — new steps: `an API call is made to "{urlPattern}"`, `the API response status for "{urlPattern}" is {code}`, `the request body for "{urlPattern}" contains "{value}"`.
- **AC3** — `PlaywrightNetworkCapture` implements the SPI via `page.on('request')`/`page.on('response')`.
- **AC4** — a real fixture scenario triggers a real captured request/response and asserts on method/status/body against it.
- **Tasks:** SPI + types in core; catalog entries; Playwright implementation; per-scenario capture lifecycle wiring. DoD: a real fixture proves all three new assertion steps against a real captured exchange.

### US-17.6 — Native dialog & multi-tab/window handling

*As a* QA author *I want* native browser dialogs and new-tab navigation handled by default *so that* scenarios that trigger them don't hang or silently lose track of the active page.
- integrates with US-17.7's browser-context lifecycle, buildable in parallel
- **AC1** — a default auto-dismiss/accept policy for native dialogs applies unless a step overrides it (`I accept the dialog` / `I dismiss the dialog`).
- **AC2** — a step that triggers a new tab is tracked, and subsequent steps can target the new tab's context.
- **Tasks:** extend the catalog with the dialog/tab-switch steps; implement real handling in the plugin's page/context lifecycle. DoD: a real `window.confirm()` fixture and a real new-tab fixture both complete without hanging, with a correct verdict.

### US-17.7 — Real EngineExecutor & wire rv run

*As a* platform user *I want* `rv run` to actually execute parsed BDD scenarios against real browsers and report a real verdict *so that* the compatibility gate and every other consumer can trust the result instead of it always being "pass".
- depends on US-17.1–17.3 mandatory; integrates US-17.4–17.6 if ready, else fails clearly rather than silently passing
- **AC1** — the real `EngineExecutor` walks a parsed `BddScenario` step-by-step via `StepRegistry.match()` → LocatorStrategy + StepExecutor + WaitStrategy, producing a real `EngineResult` per `BrowserMatrixEntry`.
- **AC2** — the full configured browser matrix (Chromium/WebKit/Firefox) runs with an isolated browser context per scenario.
- **AC3** — a deliberately failing real fixture produces `verdict: 'fail'` with the specific failing step surfaced; a real passing fixture produces `verdict: 'pass'` — both proven against real RippleViewTests/rippleview-examples fixtures.
- **AC4** — `rv run` invokes the real engine end-to-end; the "Skeleton stage" stub comment and hardcoded pass are removed from `packages/cli/src/commands/run.ts`.
- **Tasks:** implement the real `EngineExecutor` in `@rippleview/plugin-playwright`; wire it into `run.ts`. DoD: `rv run` against a real app with a mix of passing and deliberately-failing fixtures reports the correct verdict across the full matrix.

---

## EPIC-18 — MVP Closeout: Test Authoring, CI Integration & Registry Wiring

**Goal:** close the three real, deadline-critical gaps that had no execution-order story but block the end-to-end MVP/PoC — (G1) requirement-driven test authoring (an agent/skill + the tag-driven import/extend/selective-run capability + the actual authored content), (G2) consumer/library-side CI integration (a library pipeline that gates a beta publish across all consumer apps; consumer apps that run rv nightly + on upgrade), and (G3) demo registry population so impact selection can discover consumers. Sits on top of the completed engine (EPIC-17), isolation pipeline (EPIC-5), registry/impact selection (EPIC-6) and base-test packaging (EPIC-8), and depends on the gate (EPIC-7) and CI adapter (EPIC-13). *[2026-06-24 MVP status/gap review]*

### US-18.1 — Tag-driven test execution + base-test import/extend & selective-run config

*As a* consumer-app author *I want* to import a library component's base test suite and choose which tagged scenarios run *so that* my app runs only the variants it cares about and adds its own.
- **AC1** — base suites are tagged per variant/effect/state (`@default`, `@variant:primary`, `@disabled`, `@a11y`); importing with a tag filter runs only the selected scenarios.
- **AC2** — a consumer can add app-specific scenarios that run alongside the selected base scenarios and report independently.
- **AC3** — base-test version resolves against the consumed library version (§6.1); rv run + gate honour the filters deterministically (G13); zero-XPath preserved (G2).
- **Tasks:** tag convention + binding-config import/extend in the BDD layer; wire tag filtering through rv run + gate. DoD: a button base suite with 6 tagged scenarios, imported by an app selecting only `@default` plus one app-specific scenario, runs exactly those two.

### US-18.2 — Requirement-driven test-authoring agent & skill

*As a* library/app developer *I want* an agent that reads an issue story or requirement and authors Cucumber tests *so that* base tests and consumer extensions are written to standard with human blessing. *(Repurposed from US-15.1 Author Agent.)*
- **AC1** — reads an issue story/requirement and derives Gherkin scenarios + step bindings to the Component Test Contract.
- **AC2** — library component: scaffolds/refreshes tagged base tests under `RippleViewTests/libraries/...`; consumer app: detects library-component usage, imports the base suite, scaffolds a tagged extension (US-18.1) + app-specific scenarios.
- **AC3** — tags every scenario; emits zero-XPath locators; deterministic; advisory only — human-blessed before merge (G4), never on the gate/CI path.
- **Tasks:** extend the test-author agent + author-tests skill with requirement/issue ingestion + import/extend awareness. DoD: from an issue the agent emits a review-passing feature+steps; from an app requirement using a library button it imports the base suite and scaffolds the extension.

### US-18.3 — Author demo base test suites + consumer app extensions

*As a* platform demo owner *I want* real authored tests for the demo libraries and apps *so that* the gate has something real to run (today RippleViewTests has 10 contracts but only 3 feature files and an empty `apps/` tree).
- uses US-18.1 + US-18.2
- **AC1** — tagged base suites for the demo components (`@op/core-controls` + `@op/data-grid` across the ng15/ng17 generation channels).
- **AC2** — extension suites for the demo consumer apps importing the base suites with selective tags + at least one app-specific scenario each.
- **AC3** — proven against the real built apps (real pass + real fail), not synthetic-only (G13).
- **Tasks:** author content via US-18.2; verify with rv run + gate. DoD: each demo component has a base suite and each demo consumer app an extension; the gate produces correct green/red verdicts.

### US-18.4 — Library-side beta-publish gate pipeline (Jenkins)

*As a* library owner *I want* my CI to publish a beta and run all consumer apps' tests through rv *so that* a version is published only when it doesn't break its consumers.
- depends on EPIC-7 (US-7.1/7.2) + EPIC-13 (US-13.1)
- **AC1** — on change/PR: publish a beta, then call rv to run every impacted consumer app's tests (via registry + impact selection / US-18.6).
- **AC2** — per-consumer verdicts aggregate into one allow/block-publish decision with a readable summary, read via the CI adapter's neutral output + exit code.
- **AC3** — benign change → all pass → publish allowed; breaking change → a consumer fails → publish blocked.
- **Tasks:** example Jenkinsfile in the demo library repo wiring beta publish + gate fan-out. DoD: both the benign and breaking paths demonstrated end-to-end.

### US-18.5 — Consumer-app rv CI integration (nightly + on-upgrade)

*As a* consumer-app owner *I want* rv in my own CI on a schedule and on version bumps *so that* I deploy only when my UI tests pass.
- depends on EPIC-13 (US-13.1)
- **AC1** — a nightly scheduled job runs the app's full rv suite and reports pass/fail.
- **AC2** — a dependency/library upgrade (PR or bump) triggers the suite and blocks deploy on a red verdict.
- **Tasks:** example consumer-app pipeline (nightly + on-upgrade) gating the deploy step on a green rv verdict. DoD: nightly and upgrade-triggered runs both demonstrated.

### US-18.6 — Demo registry population + impact-selection wiring

*As a* platform operator *I want* a populated registry for the demo fleet *so that* the library pipeline can discover which consumer apps to run.
- relates to EPIC-6; closes the deferred registry-scan demo
- **AC1** — registry-scan produces a committed `registry.json` listing the demo libraries + consumer apps with versions.
- **AC2** — impact selection for a given library returns the correct consumer set.
- **AC3** — US-18.4's library pipeline uses the discovered set to fan out the gate.
- **Tasks:** generate/commit `registry.json` for rippleview-examples; wire registry-scan (on-demand + nightly) into impact selection + the library pipeline. DoD: scan → discover consumers → gate fan-out demonstrated.

---

## Sprint roadmap (2-week sprints · local PoC MVP)

### Sprint 0 — Foundation & AI Enablement

- EPIC-0 (US-0.1→0.10): repos, monorepo, tooling, VSCode, hooks, versioning, package skeletons, example apps, CI.

- EPIC-16 (US-16.1→16.5): CLAUDE.md + Copilot instructions, Claude Code subagents & skills, human-in-the-loop guardrails.

- **Sprint goal:** a brand-new contributor (or AI agent) can clone, install, build, and test the empty monorepo, and AI tooling is configured to implement subsequent stories to standard with human review.

### Sprint 1 — Foundations & "zero-XPath proven"

- EPIC-1 (US-1.1→1.5), EPIC-2 (US-2.1, 2.2), EPIC-3 (US-3.1, US-3.2 start).

- **Sprint goal:** one YAML test runs in the runner image against an example app via A11y locators; refactor its DOM → test still passes.

### Sprint 2 — Isolation + Module 2 + Registry

- EPIC-3 (US-3.2 finish, US-3.3), EPIC-5 (US-5.1→5.4), EPIC-6 (US-6.1, 6.2).

- **Sprint goal:** build an example consumer against a candidate library in an isolated compose unit, run BDD, collect results; registry + impact selection working.

### Sprint 3 — Gate + Visual base + Versioning + Fleet view *(the headline demo)*

- EPIC-7 (US-7.1, 7.2), EPIC-8 (US-8.1, 8.2, 8.4, 8.5), EPIC-4 (US-4.1, 4.2), EPIC-12 (US-12.1, 12.2, 12.4).

- **Sprint goal:** change the shared lib → backward-compat gate runs new code vs each consumer's current tests → verdict → Fleet view + Allure. Base-test versioning correct across contexts.

### Sprint 4 — Crawler + Coverage + Static + Dashboard complete + CI

- EPIC-4 (US-4.3, 4.4), EPIC-10 (US-10.1, 10.2), EPIC-9 (US-9.1, 9.2), EPIC-11 (US-11.1, 11.2), EPIC-12 (US-12.3), EPIC-13 (US-13.1).

- **Sprint goal:** **MVP** — end-to-end local PoC: zero-test visual coverage ≥80% on the example app, coverage ratchet + ship decision, static Layer-0 gate, all five dashboard views, runnable on Jenkins *and* GitHub Actions.

### Sprint 5 — MVP Closeout: Test Authoring + Consumer/Library CI + Registry

- EPIC-18 (US-18.1→18.6): tag-driven import/extend + selective-run, requirement-driven authoring agent, authored demo base + app tests, library-side beta-publish gate pipeline, consumer-app nightly/on-upgrade CI, demo registry population.

- **Sprint goal:** a real end-to-end MVP — a library change publishes a beta and the library CI runs *all* impacted consumer apps' real tests through the gate to allow/block publish; consumer apps run rv nightly + on upgrade; visual auto-navigation (EPIC-4 VC-2) provides the zero-test safety net.

### Product Backlog (post-MVP)

EPIC-14 (all), EPIC-15 (US-15.2 Triage Agent — US-15.1 repurposed into EPIC-18), production migration (k8s/Mongo/S3/private registry), promote pixel layer from advisory to gating once flake data supports it; remote gate delegation API — submit/--wait/--callback (US-7.3).

---

## Definition of Done (global)

A story is done when: code + unit/integration tests merged; runs green in the `rv-runner` image locally; documents/artifacts conform to [RippleView_SPECS.md §6](RippleView_SPECS.md); behavior demoed on an `rippleview-examples` app; docs updated; no new Layer-0 violations introduced.
