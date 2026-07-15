# Overview, Vision & Problem Statement

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Overview, Vision & Problem Statement** within the RippleView framework. Part of the **RippleView** documentation set.

## 1. Vision in one paragraph

RippleView is a **UI-agnostic, zero-XPath validation platform** that lets a shared component library and theme prove — automatically, before publishing — that a change does not regress any of the Angular apps that consume them. It combines a **semantic functional engine** (BDD over the Accessibility tree), an **autonomous visual engine** (4-layer metadata ledger), a **dependency registry**, a **backward-compatibility gate**, and an **intelligence layer** (dashboard, coverage, drift/confidence, dev-side AI). The framework knows nothing about Angular/React/pipelines; it is driven entirely by config + versioned YAML tests + the registry. Angular is the sole supported target for v1; React remains a pluggable future extension point only.

**Primary outcomes:** (1) catch cross-app regressions from library/theme upgrades *before* publish; (2) provide net-new UI automation coverage via semantic locators, with zero XPath maintenance; (3) make upgrade risk *visible and measurable* (drift score + coverage + confidence %); (4) onboard mature apps from zero UI tests with an instant safety net.

---

## 1. Problem Statement

An enterprise UI estate has ~17 shared `@op/*` library packages plus a shared theme, consumed by real Angular apps (e.g. unifiedplanner on ng15, aos-target on ng15, trafficking-frontend-new on ng17). Consumers upgrade on their own schedules, so a library must support multiple Angular generations (15 and 17 today, via `-ng15`/`-ng17` channels) at once. Consequences today:

- A fix or feature for App A silently regresses App B.

- **No pipeline validates all impacted consumers before a library/theme change ships.** This is the core pain RippleView solves.

- Lazy, deferred upgrades let bugs accumulate across skipped versions ("version bloat"); consumers pin `@op/*` exact/caret and upgrade manually, with no automated cross-consumer gate to lean on.

- The `@op/*` libs have only unit tests (Karma + Jasmine), plus some legacy Protractor e2e in apps — there is **no UI automation layer** that proves a shared-library or theme change is safe across its real consumers. RippleView adds that layer, and all of its UI automation tests are net-new.

**Goal:** a generic, UI-agnostic validation framework plus the orchestration, knowledge, and observability around it, so that the *library tests itself against its real consumers* before publishing, and the org can see at a glance which apps are safe to upgrade.

---

## 2. Design Principles

1. **The framework is a stateless, agnostic engine.** `@rippleview/core` imports nothing app-specific. It knows nothing about Angular/React/Vue, nothing about pipelines, nothing about specific libraries. It is *driven entirely by data*: config + YAML tests + registry + baselines.

2. **Zero-XPath.** All location is via the Accessibility (A11y) tree — `getByRole` / `getByLabel` / `getByText`, region-scoped. Surviving framework upgrades is the whole point.

3. **Write-and-forget via component-inherent tests.** A test belongs to the *component*, not the consumer. Base tests ship with each library component and version with it; consumers import them.

4. **Multi-tenant, never mixed.** One engine runs across many apps/departments simultaneously; results are isolated by path **and** tagged by tenant, so the dashboard can separate or aggregate at will.

5. **AI assists developers, never gates.** Jenkins runs only the deterministic engine. AI lives in the developer loop (authoring + triage).

6. **MVP storage mirrors MongoDB.** Persist result/registry/baseline data as JSON documents shaped like Mongo collections, so moving to a real DB later is a driver swap, not a rewrite.

---
