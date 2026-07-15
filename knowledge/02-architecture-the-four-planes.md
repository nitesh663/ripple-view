# Architecture & The Four Planes

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Architecture & The Four Planes** within the RippleView framework. Part of the **RippleView** documentation set.

## 3. The Four Planes

```text
┌─────────────────────────────────────────────────────────────┐
│  PLANE 4 — INTELLIGENCE   Dashboard · Drift Score · Upgrade   │
│                           Confidence · AI authoring & triage  │
├─────────────────────────────────────────────────────────────┤
│  PLANE 3 — ORCHESTRATION  Compatibility Gate · beta flow ·    │
│                impacted-app + tag selection · issue tracker    │
├─────────────────────────────────────────────────────────────┤
│  PLANE 2 — KNOWLEDGE      Registry (derived from package.json)│
│                           framework-version-first graph       │
├─────────────────────────────────────────────────────────────┤
│  PLANE 1 — EXECUTION      @rippleview/core: Semantic BDD (Module 2) │
│  (the SRS framework)      + Autonomous Visual Crawler (Mod 1) │
└─────────────────────────────────────────────────────────────┘
```

Plane 1 is the SRS framework. Planes 2–4 turn a good test engine into the solution to the upgrade problem.

---

## 2. Architecture at a glance

### 2.2 The four planes and data flow

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ PLANE 4 — INTELLIGENCE                                                       │
│  Dashboard (Fleet view · Run report · Code Health · Coverage)               │
│  AI Author Agent (issue→tests) · AI Triage Agent (red gate→fix) [dev-side] │
└───────────────▲───────────────────────────────────────────────▲────────────┘
                │ reads result/registry documents                │ assists devs
┌───────────────┴───────────────────────────────────────────────┴────────────┐
│ PLANE 3 — ORCHESTRATION                                                      │
│  Static Gate (L0) · Compatibility Gate (impact select · beta · BC matrix)   │
│  Coverage Engine (ratchet) · Issue-Tracker/Waiver Manager · Notifications/SCM │
└───────────────▲────────────────────────────────────────────────────────────┘
                │ "who is impacted / which versions"
┌───────────────┴────────────────────────────────────────────────────────────┐
│ PLANE 2 — KNOWLEDGE                                                          │
│  Registry (framework→library→consumers version graph)  ← Scanner(package.json)│
└───────────────▲────────────────────────────────────────────────────────────┘
                │ config + versioned tests + baselines
┌───────────────┴────────────────────────────────────────────────────────────┐
│ PLANE 1 — EXECUTION  ( @rippleview/core — agnostic engine, runs in Docker )        │
│  Config/Tenant · Auth Hydration · Test Loader+Version Resolver · A11y Locator│
│  Semantic BDD (Mod 2) · Visual Crawler+State Graph (Mod 1) · 4-Layer Pipeline│
│  Matrix Runner (browser×viewport×theme×locale) · Ledger Store · Result Writer│
│  ── cross-cutting: Plugin SPI · Security/Redaction · CLI ──                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Module catalog (role · inputs · outcome)

### Plane 1 — Execution (`@rippleview/core`)

****

````

****

``

****

``

****

``

****
````

****

****
``

****

****

****
****

****

****

****

****

****

``

****

| # | Module | Role | Inputs | Outcome |
| --- | --- | --- | --- | --- |
| E1 | Config & Tenant Resolver | Load workspace + per-app config; stamp tenant identity | rippleview.workspace.yaml, rippleview.config.yaml | Validated run context (tenant, target, paths) |
| E2 | Registry Client | Read the version graph; answer "what version does this app run" | registry.json | Component/theme versions for the target |
| E3 | Auth & Context Hydration | Single sign-on once; inject session into all workers | hooks.auth | Serialized cookies/JWT state (ORC-05) |
| E4 | Test Loader & Version Resolver | Resolve & fetch the correct base-test version per context — the `@RippleViewTests/<lib>` package versioned in lockstep to the specific `@op/<lib>` version (including suffix channel) it covers (§6.1) | registry/gate inputs, @RippleViewTests/* packages | Pinned test set (BC matrix: new code × old tests) |
| E5 | YAML/Gherkin Parser | Parse .feature + linked .yaml into executable scenarios | test files | Scenario AST + tags |
| E6 | Universal Step Library (Semantic BDD / Mod 2) | Map Gherkin verbs to A11y actions | scenario AST | Deterministic functional execution |
| E7 | A11y Locator Engine | Zero-XPath element resolution: role/label/text, region scoping, data-testid fallback | A11y tree (CDP) | Stable locators immune to DOM refactors |
| E8 | Network-Aware Interaction Controller | Auto-wait on pending XHR/fetch; no hardcoded sleeps | live page | Flake-resistant interactions (BDD-04) |
| E9 | SceneProvider (Mod 1 sources) | Produce deterministic Scenes (component+state): Storybook / RouteCrawler (discovery + role-based probes, SHA-256 state graph, Shadow DOM) / Script (seeded deep links) | routes/regions/probe config | Scenes to capture (pluggable, anti-scrap) |
| E9b | Capturer + Aligner | Snapshot the 4 signals in a deterministic env; align baseline↔current by semantic anchor (role+name+path) | Scenes | Aligned node snapshots (refactor-proof) |
| E10 | Multi-Signal Differ (Mod 1) | Presence/structure + geometry (overlap/clip/overflow/align) + computed-style (tokenized) + pixel (YIQ + AA-ignore), early-exit | aligned snapshots, baselines | Findings with category · severity · value deltas |
| E11 | Matrix Runner | Fan out across browser × viewport × theme × locale; shard | matrix config | Parallel, bounded execution |
| E12 | Ledger & Baseline Store | Persist/resolve baselines (JSON + image), branch-aware | baselines dir / S3 | Versioned Golden Baseline (ORC-06) |
| E13 | Result Document Writer | Emit Mongo-shaped, tenant-tagged result docs | run outputs | runs/ results/ acceptedBugs/ registry/ |
| E14 | Layout Stabilizer | Inject CSS to freeze animation/caret/transition before checks | page | Determinism (NFR-ENV-002) |

### Plane 2 — Knowledge

****
``

``

****

| # | Module | Role | Inputs | Outcome |
| --- | --- | --- | --- | --- |
| K1 | Registry Scanner | Derive the version graph from every package.json (on-demand + nightly); skip non-npm / non-Angular repos (e.g. Java/Spring backends) | repos / lockfiles | registry.json (framework→lib→consumers) |
| K2 | Registry Model/API | Query surface: impacted consumers, drift inputs, version-per-track | registry data | Answers for the gate & dashboard |

### Plane 3 — Orchestration

****

****
****

****

****

****

****

| # | Module | Role | Inputs | Outcome |
| --- | --- | --- | --- | --- |
| O1 | Static Standards Gate (Layer 0) | Lint tokens/encapsulation/API/a11y via Stylelint+PostCSS+ts-morph+api-extractor | source | Block anti-patterns pre-build; Code Health score |
| O2 | Compatibility Gate Orchestrator | Impact selection, beta publish/override, backward-compat matrix | registry, candidate, tests | Per-consumer verdict (bug vs intentional) |
| O3 | Coverage Engine | Measure semantic-surface coverage (visual + functional); new-code ratchet | crawler surface, results | Coverage %, gate on touched surface |
| O4 | Issue-Tracker/Waiver & Accepted-Bug Manager | Fingerprint issues, enforce bypass threshold, expire on fix | results, issue tracker | Bounded tech-debt budget (§11) |
| O5 | CLI Runner | Entry point Jenkins/devs invoke; tag routing, sharding | config, tags | Orchestrated runs |
| O6 | Notifications & SCM Integration | Status checks, PR comments, Slack/Teams/email | gate results | Actionable feedback in dev workflow |

### Plane 4 — Intelligence

****

****

****

****

| # | Module | Role | Inputs | Outcome |
| --- | --- | --- | --- | --- |
| I1 | Dashboard | Fleet view (versions, drift, confidence, flags) + Run report + Code Health + Coverage | result/registry docs | The org's upgrade cockpit |
| I2 | Reporting (Allure) & Metrics Export | Drill-down forensic reports + Prometheus/Grafana metrics | traces, results | "Navigate to failing step" + platform SLOs |
| I3 | AI Author Agent (dev-side) | Read the issue tracker / observe page via MCP → propose Gherkin tests & baselines | issue tracker, live app | Draft tests for human blessing (reverse-eng) |
| I4 | AI Triage Agent (dev-side) | Explain a red gate from trace+diff; propose fix | Allure trace | Faster root-cause; never in CI |

### Cross-cutting

****

****

****

**``**

| # | Module | Role | Outcome |
| --- | --- | --- | --- |
| X1 | Plugin SPI | Stable extension points (locators, validators, auth, reporters, rule packs) | Reuse across any UI without forking |
| X2 | Security & Redaction | PII masking in traces/baselines; vault-based secrets | Compliance-safe forensics |
| X3 | Governance / RBAC / Audit | Roles + immutable approval/waiver audit log | Enterprise control plane |
| X4 | Scaffolding (rv init) & Docs | One-command onboarding + golden-path templates | Self-service adoption across consumer app teams |

---

## 4. Technology stack (summary)

````

````

``

| Concern | Choice |
| --- | --- |
| Runtime / typing | Node.js 20+ / TypeScript |
| Browser automation | Playwright Core (CDP, Shadow DOM, multi-engine) |
| BDD | Cucumber.js (Gherkin) over YAML-defined steps |
| Visual diff | pixelmatch + sharp (SSIM) |
| A11y audit | axe-core |
| Static analysis | Stylelint, PostCSS, ESLint (@angular-eslint, jsx-a11y), ts-morph, api-extractor |
| Determinism | Official Playwright Docker image |
| Storage (MVP→prod) | JSON documents (Mongo-shaped) → MongoDB; baselines on S3/MinIO |
| Reporting | Allure + Prometheus/Grafana export |
| Registry source | derived from package.json (skips non-npm / non-Angular repos) |
| npm registry | Verdaccio (PoC default) → Sonatype Nexus (`@op:registry`, repo `opnpmprivate`) in prod — or any registry — via a single `.npmrc`/config switch, no code change |

---

## 4. Repository Topology

No monorepo. `UI Automation/` is only a local VS Code workspace folder. Three independent repos:

### Repo 1 — `rv` (framework + dashboard)

npm workspaces; packages published/deployed independently so consumer apps pull only the lightweight engine.

```text
rv/
  packages/
    core/        @rippleview/core      # agnostic engine (imported by target apps in CI)
    registry/    @rippleview/registry  # scanner, version graph, drift & confidence math
    cli/         @rippleview/cli        # runner invoked by Jenkins / locally
    dashboard/   @rippleview/dashboard  # standalone reader web app
  package.json
```

### Repo 2 — `RippleViewTests` (QA-owned)

This is the **net-new UI automation layer**. The real `@op/*` libraries ship only unit tests (Karma + Jasmine); RippleView's UI automation tests do not exist yet and live here — not inside the libs. QA adds **Gherkin `.feature` files + step definitions expressed in YAML** only — no framework code. These tests are parsed and executed by the **rv** framework (Cucumber-style). It is a **workspace**: each `libraries/<component>/` is a **publishable, versioned package** (`@RippleViewTests/<component>`) whose version tracks, in lockstep, the specific `@op/<component>` version it targets — including the suffix channel (e.g. `-ng17`/`-ng15`) — rather than any single global component version (see §6.1). Consumer-app tests never relative-import base tests; they declare `lib:` and the runner resolves the version (see §6.1).

```text
RippleViewTests/
  rippleview.workspace.yaml            # global: registryPath, resultsRoot, defaults, (optional) departments
  registry/registry.json         # version graph (output of @rippleview/registry scanner)
  libraries/
    datagrid/                    # publishable package @RippleViewTests/datagrid (version tracks the @op/datagrid version it covers, incl. suffix channel)
      package.json
      contract.yaml              # Component Test Contract (semantic anchors, states, data shape)
      functional/
        sort.feature             # Gherkin BDD spec
        sort.yaml                # linked test script (steps, data, scoping)
      visual/
        grid-density.yaml
  apps/
    orders-app/
      rippleview.config.yaml           # one config per app (see §5.1): app meta, mountedAt, hooks
      functional/
        checkout.feature
        checkout.yaml            # may `extend` base scenarios; base version is runner-resolved
      visual/
        orders-page.yaml
  baselines/                     # JSON + image ledger, keyed (target, version, branch)
```

### Repo 3 — `rippleview-examples` (demo only)

Demo only: a few **mirror libraries** (mimicking the real `@op/*` scope and convention) plus a few **mirror consumer apps**, used to prove the gate end-to-end. It has its **own separate Jenkins pipeline** and is never a dependency of the framework. Mirror libs and apps are **Angular** (Angular is the sole supported target for v1; React stays a future extension point and is not part of the demo).

This embodies the PoC golden principle: in the PoC we do **not** touch any existing code (neither `aos-libraries` nor the real consumers). We mirror them here and build the demo against these mirrors using the examples' own Jenkins. Because the design is config-driven, PoC → real adoption is just "replace the mirrors with the real `@op/*` libraries and consumer apps" — no framework code change, only config (registry endpoint, `registry.json` entries, per-app configs).

```text
rippleview-examples/
  angular/
    libraries/   { lib1, lib2, lib3 }   # mirror @op/* libs (same scope/convention)
    consumers/   { app1, app2 }         # mirror consumer apps
    theme/
```

---

## 6. Ownership model

``

``

****
****

****
****

| Concern | Owner |
| --- | --- |
| @rippleview/* framework + dashboard | Platform / UI Architecture team |
| RippleViewTests (feature files, base tests) | QA + library devs (base tests authored with the component) |
| Per-app config, auth/seed hooks | Each consumer app team |
| Updating the base test on a component change | Component author (decided) — updates the base test when the component changes and is ready to publish |
| Base-test publish trigger (lockstep with component release) | Component author's release pipeline publishes the matching version (must not drift — see §6.1) |
| Two-tier token management (primitive→semantic registry) | Library author (decided) — defines tokens; static gate (§16) enforces semantic-only consumption |
| Baseline approvals / waivers | Governed by RBAC (X3); component owners + QA leads |

---
