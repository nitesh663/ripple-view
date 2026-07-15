# Engineering Standards — Overview & Golden Rules

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Engineering Standards — Overview & Golden Rules** within the RippleView framework. Part of the **RippleView** documentation set.

> 

**Read this first.** This page is the RippleView engineering *constitution*: the non-negotiable invariants every contributor — human or AI agent — must obey. If any code, test, or design conflicts with a rule here, the rule wins. Each rule links to the page that explains *why*.

## How to use this page (AI agents included)

- Treat the **Golden Rules** below as hard constraints. Never violate one to make a task "work".

- When implementing any task, first match it to a rule. If unsure which rule applies, default to the most restrictive interpretation.

- For dense, ready-to-load context optimised for low token cost, use the **AI Implementation Context Pack** (Part VIII) — it restates these rules in machine-friendly form with file paths and signatures.

## The Golden Rules

**``**
**

****``
**

******``
**

****
**

****
**

****``````
**

**``**````
**

****
**

******````
**

****
**

****
**

****
**

****
**

****
**

****``````
**

****
**

****
**

**``**
**

****``````
**

****
**

| # | Rule | Why / Source |
| --- | --- | --- |
| G1 | @rippleview/core is stateless and UI-agnostic. It imports nothing app-, framework-, or vendor-specific. All app specifics (auth, seed, baseUrl, theme) enter via config + hooks. | Engine must run against any app. See The Agnostic Engine & Configuration. |
| G2 | Zero-XPath. Locators are A11y-tree only (role + accessible name + path). No CSS selectors, no XPath, no data-testid hunting in framework or test code. | Locators survive refactors; protects the a11y contract. See Semantic BDD Engine. |
| G3 | Base-test version is always derived from the specific `@op/<lib>` version under test — never relative-imported, never hardcoded by an app. @RippleViewTests/<lib> tracks that one library's independent semver (including its generation-suffix channel, e.g. -ng17/-ng15/-ag27), published in per-library lockstep. There is no single global "component version"; each `@op/*` library has its own version line and its base-test package follows it. | The central invariant. See Component-Inherent Tests & Base-Test Versioning. |
| G4 | AI assists developers only. AI never runs inside the gate / CI. The gate is deterministic. | Reproducible gating. See AI Assist (Developer-Side). |
| G5 | Persistence is MongoDB-document-shaped JSON. PoC writes JSON files shaped exactly like the future Mongo collections; prod swaps the store, not the shape. | PoC→Prod is a config swap, not a rewrite. See Result Documents & Consolidated Data Model. |
| G6 | Config is one workspace file + one file per app — never an array. rippleview.workspace.yaml + apps/<app>/rippleview.config.yaml. department is a dashboard label only. | See The Agnostic Engine & Configuration. |
| G7 | The rv CLI is the only contract with CI. Jenkins/GitHub Actions/etc. just call rv gate. Never put CI-vendor logic in the engine. Outputs are CI-neutral (exit code + JUnit + Allure + summary.json). | CI-agnostic. See Implementation: Tech Stack, Profiles & CI. |
| G8 | All heavy work runs in Linux containers. Host tooling is the Node CLI only — no bash-isms, no OS-specific paths. Must work on Mac/Windows/Linux. | OS neutrality. See Isolation Pipeline & Dockerization. |
| G9 | The candidate library is tested in a production build served by nginx — never a dev server. Isolation unit = app + rv-runner containers. | Fidelity to real deploys. See Isolation Pipeline & Dockerization. |
| G10 | A build/peer-dep break is a finding (confidence 0), not a crash. Catch it and report it as a backward-compatibility result. | Gate must never silently pass. See Compatibility Gate & Beta Flow. |
| G11 | Plugins are TypeScript interfaces loaded by dynamic import. New UI/framework support = a plugin, never a fork of core. | Extensibility. See Plugin SPI & Adapter Authoring. |
| G12 | The visual verdict is multi-signal (geometry → computed-style → pixel), aligned by semantic anchor — never raw HTML diff. | See Visual Validation Engine (Module 1). |
| G13 | Determinism is mandatory before any visual/functional assertion: freeze time, animations, fonts, network. A non-deterministic test is a bug, not a flake to retry blindly. | See Testing, Determinism & Quality Gates. |
| G14 | Coverage = semantic surface (routes / A11y nodes / states), never lines of code. | See Brownfield Onboarding & Semantic Coverage Model. |
| G15 | Layer-0 bans apply to the framework's own code too: no hardcoded design tokens, no ::ng-deep / !important / ViewEncapsulation.None, no global selectors, no encapsulation piercing. | Practice what the gate enforces. See Static Code & Style Standards Gate (Layer 0). |
| G16 | Public APIs are explicit and guarded by api-extractor. A breaking change to a published surface requires a major version bump. | See Git, Versioning & CI Conventions. |
| G17 | Confidence is an honest blend, never a guaranteed "good to publish". Don't round a score up to make a gate green. | See Brownfield Onboarding & Semantic Coverage Model. |
| G18 | Secrets come from a vault → env → .npmrc; never commit secrets, never log them, redact PII in screenshots/network. | See Enterprise Hardening & Extensibility. |
| G19 | Three repos, not a monorepo-of-everything: rv (framework + dashboard, npm workspace packages), RippleViewTests (QA-owned UI automation — net-new Gherkin .feature files + YAML step definitions run by rv, plus the @RippleViewTests/<lib> base-test packages), rippleview-examples (demo only — mirror `@op/*` libs + consumer apps with their OWN separate Jenkins, never a framework dependency). | See Repository & Module Layout. |
| G20 | Every change ships green through RippleView's own gate (lint + types + unit + the relevant RippleView checks) before merge. The framework eats its own dog food. | See Git, Versioning & CI Conventions. |

## Decision order when rules seem to conflict

1. **Correctness of the gate verdict** (never a false green) beats everything.

2. **Determinism & reproducibility** beats convenience.

3. **Agnosticism / no app-coupling in core** beats local ergonomics.

4. **PoC↔Prod shape parity** beats short-term simplicity.

If a task cannot be done without breaking a rule, stop and raise it — the rule is probably catching a real design problem.
