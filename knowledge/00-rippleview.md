# RippleView

> **ℹ️ Info**
>
> **Source of Truth.** This space is the canonical reference for the **RippleView** — a UI-agnostic semantic validation framework that detects shared-library & theme-upgrade regressions across many consumer applications before they ship. Every design decision, schema, and standard for the framework is documented in the child pages below.

## What is RippleView?

## 1. Vision in one paragraph

RippleView is a **UI-agnostic, zero-XPath validation platform** that lets a shared component library and theme prove — automatically, before publishing — that a change does not regress any of the Angular apps that consume them. It combines a **semantic functional engine** (BDD over the Accessibility tree), an **autonomous visual engine** (4-layer metadata ledger), a **dependency registry**, a **backward-compatibility gate**, and an **intelligence layer** (dashboard, coverage, drift/confidence, dev-side AI). The framework knows nothing about Angular/React/pipelines; it is driven entirely by config + versioned YAML tests + the registry. Angular is the sole supported target for v1; React remains a pluggable future extension point only.

**Primary outcomes:** (1) catch cross-app regressions from library/theme upgrades *before* publish; (2) provide net-new UI automation coverage via semantic locators, with zero XPath maintenance; (3) make upgrade risk *visible and measurable* (drift score + coverage + confidence %); (4) onboard mature apps from zero UI tests with an instant safety net.

---

## 1. Problem Statement

An enterprise UI estate has ~17 shared `@op/*` library packages plus a shared theme, consumed by real Angular apps (e.g. unifiedplanner on ng15, aos-target on ng15, trafficking-frontend-new on ng17). Consumers upgrade on their own schedules, so a library must support multiple Angular generations (15 and 17 today, via `-ng15`/`-ng17` channels) at once. Consequences today:

- A fix or feature for App A silently regresses App B.

- **No pipeline validates all impacted consumers before a library/theme change ships.** This is the core pain.

- Lazy, deferred upgrades let bugs accumulate across skipped versions ("version bloat"), and consumers pin `@op/*` exact/caret and upgrade manually.

- The `@op/*` libs have only unit tests (Karma + Jasmine), plus some legacy Protractor e2e in apps — there is **no UI automation layer** that proves a shared-library or theme change is safe across its real consumers.

**Goal:** a generic, UI-agnostic validation framework plus the orchestration, knowledge, and observability around it, so that the *library tests itself against its real consumers* before publishing, and the org can see at a glance which apps are safe to upgrade. All RippleView UI automation tests are net-new.

---

## Documentation map

****

[](Overview, Vision & Problem Statement)

[](Architecture & The Four Planes)

****

[](The Agnostic Engine & Configuration)

[](Semantic BDD Engine (Module 2))

[](Visual Validation Engine (Module 1))

[](Component-Inherent Tests & Base-Test Versioning)

****

[](Knowledge Registry, Drift Score & Upgrade Confidence)

[](Compatibility Gate & Beta Flow)

[](Isolation Pipeline & Dockerization)

[](Issue-Tracker Bypass & Accepted-Bug Management)

****

[](Brownfield Onboarding & Semantic Coverage Model)

[](Static Code & Style Standards Gate (Layer 0))

[](Non-Functional Requirements & KPIs)

****

[](Dashboard)

[](Result Documents & Consolidated Data Model)

[](AI Assist (Developer-Side))

****

[](Implementation: Tech Stack, Profiles & CI)

[](Enterprise Hardening & Extensibility)

****

[](Specifications & Schemas (Reference))

[](RippleView Glossary)

[](Agile Roadmap — Epics, Stories & Sprints)

****

[](Engineering Standards — Overview & Golden Rules)

[](Code Style & TypeScript Standards)

[](Repository & Module Layout)

[](Plugin SPI & Adapter Authoring)

[](Testing, Determinism & Quality Gates)

[](Git, Versioning & CI Conventions)

[](AI Implementation Context Pack)

| # | Page | What you’ll find |
| --- | --- | --- |
| Part I. Foundations |  |  |
| 1 | Overview, Vision & Problem Statement | Why RippleView exists, the upgrade-regression problem it solves, and the guiding design principles. |
| 2 | Architecture & The Four Planes | The four planes & data flow, module catalog, repository topology, technology stack and ownership model. |
| Part II. Validation Engines |  |  |
| 3 | The Agnostic Engine & Configuration | The stateless, UI-agnostic @rippleview/core engine and the workspace + per-app configuration model. |
| 4 | Semantic BDD Engine (Module 2) | Deterministic YAML+Gherkin testing: the linked test schema and the universal A11y step-library catalog. |
| 5 | Visual Validation Engine (Module 1) | Module 1 deep design: capture→diff→review pipeline, semantic anchoring, multi-signal differ, role probes, determinism, phasing. |
| 6 | Component-Inherent Tests & Base-Test Versioning | Write-and-forget component-inherent tests and the central base-test versioning invariant. |
| Part III. Knowledge & Orchestration |  |  |
| 7 | Knowledge Registry, Drift Score & Upgrade Confidence | The framework-version-first registry, the Drift Score, and the Upgrade Confidence metric. |
| 8 | Compatibility Gate & Beta Flow | The validation-gate sequence, the compatibility gate, the two-speed beta flow, and the Jenkins gate stages. |
| 9 | Isolation Pipeline & Dockerization | Solving the 'black area': version-swap mechanics, multi-stage Docker, the per-app isolation unit, and artifact flow. |
| 10 | Issue-Tracker Bypass & Accepted-Bug Management | Threshold-based issue-tracker bypass with distinct-issue fingerprinting and accepted-bug governance. |
| Part IV. Quality Scope |  |  |
| 11 | Brownfield Onboarding & Semantic Coverage Model | Coverage as semantic surface, three-phase onboarding, reverse-engineering tests, and honest confidence. |
| 12 | Static Code & Style Standards Gate (Layer 0) | Shift-left Layer 0 gate: bans hardcoded tokens & encapsulation piercing, enforces API/a11y stability. |
| 13 | Non-Functional Requirements & KPIs | Non-functional requirements and the success metrics (KPIs). |
| Part V. Intelligence & Observability |  |  |
| 14 | Dashboard | Read-only dashboard: the five views, the API surface, the wireframe, and the PoC↔production profile. |
| 15 | Result Documents & Consolidated Data Model | MongoDB-shaped result documents, multi-tenant separation, and the consolidated collection model. |
| 16 | AI Assist (Developer-Side) | Developer-only AI: the Author and Triage agents — never in the CI gate. |
| Part VI. Engineering & Delivery |  |  |
| 17 | Implementation: Tech Stack, Profiles & CI | Concrete tech stack, cross-cutting module scope, Local-PoC vs Production profiles, CI-agnostic integration, OS neutrality, and top risks. |
| 18 | Enterprise Hardening & Extensibility | Plugin SPI, validation matrix, WCAG, Web Vitals, security, flakiness governance, RBAC/audit, integrations, and future items. |
| Part VII. Reference |  |  |
| 19 | Specifications & Schemas (Reference) | Canonical reference: document index, Component Test Contract schema, and the consolidated data model. |
| 20 | RippleView Glossary | Definitions of every key RippleView term. |
| 21 | Agile Roadmap — Epics, Stories & Sprints | The phased implementation plan, 15 epics with user stories & tasks, the 4-sprint MVP plan, product backlog, and global Definition of Done. |
| Part VIII. Engineering Standards & AI Implementation |  |  |
| 22 | Engineering Standards — Overview & Golden Rules | The engineering constitution: 20 non-negotiable invariants every contributor (human or AI) must obey, with conflict-resolution order. |
| 23 | Code Style & TypeScript Standards | Baseline toolchain, required tsconfig, naming conventions, banned patterns, error handling, and module boundaries. |
| 24 | Repository & Module Layout | The three repos (rv framework, RippleViewTests net-new UI automation, rippleview-examples demo), workspace package layout, folder map with file paths, import-direction rules, and a where-new-code-goes table. |
| 25 | Plugin SPI & Adapter Authoring | How to extend RippleView without forking core: SPI interfaces, authoring rules, versioning, and a PoC→Prod store-adapter worked example. |
| 26 | Testing, Determinism & Quality Gates | How the framework tests itself: test layers, coverage standard, the mandatory determinism controls, flakiness governance, and test style. |
| 27 | Git, Versioning & CI Conventions | Conventional Commits, branching/PR DoD, semver, the critical base-test lockstep versioning, and the CI-as-`rv` contract. |
| 28 | AI Implementation Context Pack | The dense, token-optimised master reference for AI coding agents: vocabulary, invariants, module/file map, CLI, data & config shapes, SPI signatures, and implementation recipes. |
