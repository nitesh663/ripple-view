# AI Implementation Context Pack

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **AI Implementation Context Pack** within the RippleView framework. Part of the **RippleView** documentation set.

> 

**Purpose.** A single, dense, low-token / high-context reference an AI coding agent can load to implement *any* part of RippleView correctly. If you read only one page before coding, read this one. It restates the binding rules in machine-friendly form and points to the deep page when you need detail. Everything here is normative.

## How an agent should use this pack

1. Load this page. Obey the **Invariants** as hard constraints (they mirror the Golden Rules).

2. Find your task in **Implementation recipes**; follow the named steps and file paths.

3. Pull the one deep page named in the recipe only if you need more — don't load all 28 pages.

4. Conform to the **Vocabulary**, **Signatures**, and **Shapes** exactly — names are contracts.

## Canonical vocabulary (use these exact names)

`@rippleview/core` (engine, stateless, agnostic) · `@rippleview/cli` (oclif, the CI contract) · `@rippleview/dashboard` (Fastify+React, read-only) · `@rippleview/lint` (Layer-0) · `@rippleview/plugin-<name>` · `@op/<lib>` (library under test; `@op/*` scope, independent per-lib semver + generation channels) · `@RippleViewTests/<lib>` (base tests, versioned lockstep to the `@op/<lib>` they cover) · **Plane** (Execution/Knowledge/Orchestration/Intelligence) · **SceneProvider** · **StateProbe** · **DiffSignal** · **ResultStore** · **BaselineStore** · **RegistrySource** · **Notifier** · **Drift Score** · **Upgrade Confidence** · **Compatibility Gate** · **Isolation Unit** (`app`+`rv-runner`) · **Component Test Contract** (`contract.yaml`) · **Semantic surface** (coverage) · **Layer 0** (static gate).

## Invariants (hard constraints — compressed Golden Rules)

```text
G1  core is stateless + UI-agnostic; imports nothing app/framework/vendor-specific
G2  locators = A11y role+name+path only; no XPath/CSS/data-testid
G3  base-test version tracks the @op/<lib> version it tests (incl. -ng17/-ng15/-ag30 channel); per-library lockstep, not one global version; never hardcoded by app
G4  AI is dev-side only; NEVER in the gate/CI
G5  persistence = Mongo-shaped JSON; PoC file ↔ prod Mongo share the EXACT shape
G5b registry is config-driven: Verdaccio = PoC default, Nexus (@op:registry) = prod; switch via .npmrc/config, no code change
G6  config = 1 workspace + 1 per app (not an array); department = label only
G7  CI contract = `rv` CLI only; outputs exit-code+JUnit+Allure+summary.json
G8  heavy work in Linux containers; host = Node CLI; OS-neutral
G9  test candidate in a PROD build served by nginx, not a dev server
G10 build/peer-dep break = finding (confidence 0), not a crash
G11 new UI/framework = a plugin; never fork core
G12 visual verdict = multi-signal (geometry→style→pixel) by semantic anchor; not HTML diff
G13 determinism mandatory (time/anim/fonts/network frozen) before any assertion
G14 coverage = semantic surface, not LOC
G15 Layer-0 bans apply to core's own code too
G16 public API guarded by api-extractor; breaking = major bump
G17 confidence = honest blend; never round up to force green
G18 secrets vault→env→.npmrc; never commit/log; redact PII
G19 three repos: rv (framework) / RippleViewTests (Gherkin/YAML UI automation run by rv; net-new) / rippleview-examples (demo mirror libs+apps)
G20 every change ships green through RippleView's own gate
```

## Module → responsibility → file map

````
``

``

``

``

``

``

``

``

``
``

``

``

| Module | Does | Lives in |
| --- | --- | --- |
| config | load+validate rippleview.workspace.yaml & apps/<app>/rippleview.config.yaml | core/src/config/ |
| scene | SceneProvider SPI + storybook/route-crawler/script | core/src/scene/ |
| visual | capture → semantic anchor → multi-signal differ → verdict | core/src/visual/ |
| bdd | YAML/Gherkin parse + universal step library (A11y actions) | core/src/bdd/ |
| registry | knowledge derived from package.json (framework-version-first) | core/src/registry/ |
| gate | compatibility gate orchestration + Drift/Confidence scoring | core/src/gate/ |
| store | ResultStore / BaselineStore / RegistrySource adapters | core/src/store/ |
| plugin | dynamic-import SPI loader | core/src/plugin/ |
| cli | oclif commands; rv gate|init|... | cli/src/commands/ |
| dashboard | read-only API + SPA, 5 views | dashboard/ |
| lint | Layer-0 rules per framework | lint/src/<fw>/ |

## CLI surface (the CI contract)

```bash
rv init                 # scaffold workspace/app config (rv init scaffolder)
rv gate --candidate <pkg@version>   # run the 7-stage gate; exit 0/non-0
rv visual --app <app>   # run visual validation only
rv bdd --app <app>      # run semantic BDD only
rv coverage --app <app> # report semantic-surface coverage
```

Gate stages (fixed order): `static → publish-candidate → impact-select → fan-out → aggregate → score → report+decide`.

## Core data shapes (Mongo-shaped JSON — keep field names exact, Rule G5)

```json
// RunResult (one gate run)
{
  "runId": "string", "app": "string", "department": "string|null",
  "library": "string", "currentVersion": "string", "candidateVersion": "string",
  "frameworkVersion": "string",
  "buildGate": "pass|fail", "failureStage": "string|null",
  "findings": [ /* Finding[] */ ],
  "driftScore": 0, "confidence": 0,            // confidence: 0..100, honest blend (G17)
  "acceptedBugCount": 0, "createdAt": "ISO8601"
}
// Finding
{
  "id": "string", "type": "visual|functional|build|static",
  "category": "string", "severity": "info|minor|major|critical",
  "anchor": { "role": "string", "name": "string", "path": "string" },  // G2
  "valueDelta": { /* before/after */ },
  "status": "new|accepted|known", "fingerprint": "string"   // distinct-issue fingerprint
}
```

Collections (folders of JSON in PoC, Mongo in prod): `runs/`, `findings/`, `builds/`, `scores/`, plus baselines in BaselineStore. Multi-tenant: path isolation + tenant tags; **results never mixed**.

## Config shape (one workspace + one per app, Rule G6)

```yaml
# rippleview.workspace.yaml
libraries: [ { name: datagrid, repo: "..." } ]
defaults: { minFunctionalCoverage: 80, bypassThreshold: 5 }

# apps/<app>/rippleview.config.yaml
app: checkout-web
department: payments            # dashboard label only
baseUrl: "http://app:8080"      # served prod build (G9)
hooks: { auth: "...", seed: "..." }   # app specifics enter HERE, not core (G1)
matrix: { viewports: [...], themes: [...], locales: [...] }   # incl RTL
visual: { sceneProvider: { module: "@rippleview/plugin-storybook", export: "createProvider" } }
```

## SPI signatures (implement these to extend — Rule G11)

```typescript
type SceneProviderFactory = (ctx: PluginCtx) => SceneProvider;
interface SceneProvider { name: string;
  listScenes(): Promise<Scene[]>;
  renderScene(scene: Scene, page: Page): Promise<void>; }   // wait on stable signals, no sleeps (G13)

interface DiffSignal { name: string;
  compare(baseline: Capture, current: Capture): SignalResult; } // category+severity+valueDelta (G12)

interface ResultStore { putRun(d: RunResult): Promise<void>;
  getRun(id: string): Promise<RunResult|null>; /* same shape across impls (G5) */ }

interface Notifier { notify(decision: GateDecision): Promise<void>; } // SCM/Slack/issue-tracker (G7)
```

## Implementation recipes ("to do X, do Y")

````

````

``

``````

****

``

``

| Task | Steps | Deep page |
| --- | --- | --- |
| Add a new UI-framework support | new @rippleview/plugin-<fw>; implement SceneProvider(+probes); wire in config; peer-dep core SPI major | Plugin SPI & Adapter Authoring |
| Add a visual signal | implement DiffSignal in core/src/visual/signals/; return category+severity+valueDelta; unit-test value math | Visual Validation Engine |
| Add a Gherkin step | add to core/src/bdd/steps/; map to an A11y action (G2); document in step catalog | Specifications & Schemas |
| Wire isolation for an app | version-swap via npm `overrides` (`npm install --legacy-peer-deps`) → multi-stage Docker (build w/ candidate, nginx-serve) → compose app+rv-runner, --exit-code-from runner | Isolation Pipeline & Dockerization |
| Move PoC→Prod | swap store/baseline/registry adapters + compose→k8s; shapes & CLI unchanged (G5) | Implementation: Tech Stack, Profiles & CI |
| Score a run | buildGate→findings→drift→confidence; build break ⇒ confidence 0 (G10); never round up (G17) | Compatibility Gate & Beta Flow |
| Add a dashboard view | read-only API in dashboard/src/api + React view; data→compute→API→UI | Dashboard |
| Add a Layer-0 rule | lint/src/<fw>/rules/; ratchet on new code; issue-waiver governance | Static Code & Style Standards Gate |

## Anti-patterns (reject on sight)

XPath/CSS locators · `any`/`@ts-ignore` · app code imported into core · changing a doc shape to fit a store · AI/LLM call inside the gate · fixed `sleep` waits · hardcoded tokens / `::ng-deep` / `!important` · base-test version pinned by app · secrets in code/logs · dev-server (non-prod) under test · rounding confidence up to pass.
