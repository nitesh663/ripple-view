# Demo Fixture Suite — Architecture & Oracle Manifest

> **ℹ️ Info**
>
> **Canonical reference for the Demo Fixture Suite within the RippleView framework. Part of the RippleView documentation set.**

> 

Defines the layout, naming, and machine-readable oracle (`fixtures.manifest.json`) that the rest of the Demo Fixture Suite builds to in **rippleview-examples**. Adds no app/library code itself.

## Why this exists

RippleView detects shared-library regressions across many consumer apps. The original Sprint-0 scaffolds (`angular-app/`) are deliberately minimal: no shared library, no version diversity, nothing to actually regress. They remain in place, untouched — this epic replaces "it ran without crashing" with **"for every fixture, we know the correct verdict in advance, and the framework produces it."**

These fixtures are a **demo mirror** of the real AOS estate: a few example libraries that mimic the real `@op/*` libraries and a few example consumer apps that mimic the real Angular consumers. The PoC golden rule is that we touch no existing code — adoption is simply replacing these example libs and apps with the real `@op/*` libraries and consumer apps, with no framework code change (only config: registry endpoint and registry entries). The demo is **Angular-only**; React (and other frameworks) is a future extension point, not part of this suite.

## The enterprise reality being modeled

A real enterprise with 15+ UI apps does not migrate framework versions all at once:

- A shared component library is maintained as **parallel framework-generation support lines simultaneously** — an Angular 15 line *and* an Angular 17 line of the *same* library, because ng15 apps still need fixes while the ng17 line moves ahead.

- Consumer apps are scattered across generations: well-maintained and current, least-maintained stragglers, and **apps mid-migration that exist on two generations at once**.

- The framework must work for every client maturity level, not only the best-maintained one.

## Layout convention

**The mental model: a real org doesn't nest framework versions inside one shared folder — it checks out a different *branch*, and that branch's tree looks otherwise identical, just at a different version.** We have no git branches here (everything must be testable in one checkout / one CI run), so each generation becomes a **whole sibling directory**, suffixed by generation, with the *same internal structure repeated* — never a generation segment nested inside an otherwise-shared path:

```text
rippleview-examples/
  angular-app/                        # Sprint-0 reference -- untouched by this epic

  angular/
    libraries/
      lib-ng15/                       # a REAL `ng new` + `ng generate library` Angular CLI
        angular.json                  # workspace as of the "ng15 branch" -- not a bare package
        projects/
          core-controls/              # Button, Input, MultiSelect, Form -- ONE bundled package
          data-grid/                  # AG Grid wrapper -- its own package
          shared/                     # internal plumbing core-controls depends on (not
          playground/                 # registry-tracked -- see Naming convention below)
                                       # a real `ng serve`-able demo dashboard, not published
      lib-ng17/                       # the WHOLE workspace as of the "ng17 branch" -- same
        ...                           # internal shape, repeated, just a different sibling dir
    apps/
      ng-15/                           # a directory grouping this generation's apps -- NOT a
        orders-app/                    # shared workspace. Each app below is its OWN fully
        billing-app/                   # independent `ng new` Angular CLI app: own
        admin-app/                     # angular.json, package.json, node_modules, .npmrc --
        brownfield-app/                # runnable/buildable on its own. brownfield-app is
      ng-17/                           # least-maintained, deliberately bad-citizen --
        orders-app/                    # see its own README.md. Each app `npm install`s the
        billing-app/                   # real, published @op/* packages from the PoC Verdaccio
        admin-app/                     # registry (--legacy-peer-deps). orders-app exists on
                                        # BOTH ng-15 and ng-17 (the mid-migration twin)

  # react/  -- FUTURE (D11): React is a pluggable extension point, not part of this
  #            Angular-only demo. A React mirror line (lib-r19, apps/r-19) is deferred;
  #            see "What's deferred" below.

  fixtures.manifest.json              # the oracle
  fixtures/                           # the oracle's schema + validator
```

Two non-negotiable rules (enforced by `fixtures/schema.mjs`, not just documented):

1. **Libraries:** the generation suffix lives on the directory/package NAME itself (`lib-ng15`, `lib-ng17`) — never a separate nested path segment shared across generations. Two generations of the same library never share a directory; nothing is parameterized by generation at runtime.

2. **Apps:** the generation IS its own nested directory level (`apps/ng-15/orders-app`, `apps/ng-17/orders-app`) — one real Angular CLI multi-project workspace per generation, containing one "application" project per app. This mirrors the *internal* shape of the library workspaces (`lib-ng15/projects/<name>`) rather than their sibling-directory convention — apps are consumers, not maintained component code, so sharing one workspace per generation is the more realistic shape.

**Angular is the sole supported target for this demo (D11):** Angular is this framework's v1 target, and this fixture suite is Angular-only. React (and other frameworks) remains a **pluggable extension point** — supported by design through the Plugin SPI, but not built out here. A future React mirror line (ONE generation, ONE bundled `@op/react-core-controls` package mirroring the Angular `core-controls` bundling decision) is deferred and would prove that RippleView's detection signals generalize across UI frameworks; it is not part of this suite. See "What's deferred" below.

**Learned the hard way:** a *real* Angular CLI library workspace (`ng new` + `ng generate library`) is not a single package — it is a workspace containing multiple buildable `projects/<name>/`. The schema's `library.path` regex accepts an optional `projects/` segment for exactly this reason.

The same logical app mid-migration (e.g. `orders-app`) appears as **two whole, independent app projects** — `apps/ng-15/orders-app/` and `apps/ng-17/orders-app/` — simulating two git branches checked out side by side.

## Naming convention

- **Library package name (unchanged across generations):** published under the real `@op/*` scope that the mirror convention copies — e.g. `@op/core-controls`, `@op/data-grid`. **Scoping is not optional** — publishing unscoped (`shared`, `data-grid`, `core-controls`) once revealed that Verdaccio's own `uplinks.npmjs` proxy (deliberately configured so a real consumer can resolve both candidate and ordinary packages through one registry) silently conflated them with real, unrelated public npm packages of the same name (`shared` is a real "objects over MongoDB" package; `data-grid` is a real virtual-dom grid library). The **same package name** is published independently from each generation's sibling directory (`lib-ng15/projects/data-grid` and `lib-ng17/projects/data-grid` both publish `@op/data-grid`, on different generation channels) — this is what lets the registry namespace consumers by framework generation automatically (see **Knowledge Registry, Drift Score & Upgrade Confidence** §7), with zero extra bookkeeping. These example packages mirror the real `@op/*` libraries (D10); adoption replaces them with the real ones, changing only config.

- **One package can bundle several components.** The original plan was one-component-per-package (`@op/ng-button`, `ng-multiselect`, `ng-datagrid`); the ng15 line as actually built bundles Button/Input/MultiSelect/Form into a single `@op/core-controls` (a deliberate, accepted architecture decision). `@op/data-grid` stays its own package. The oracle tracks libraries by their real published package name, whatever that turns out to be per generation/story.

- **Not every dependency is registry-tracked.** `shared` (internal utilities `core-controls` depends on) is a real, versioned, published dependency — but it is not independently tracked by the registry/impact-selection oracle, the same way an app's dependency on `rxjs` isn't. Only the libraries a *consumer app* directly depends on and that the registry fans out against belong in `fixtures.manifest.json`.

- **Library directory/package generation suffix:** `-ng<major>` for Angular (`lib-ng15`, `lib-ng17`) — a NAME suffix.

- **App generation directory:** `<genPrefix>-<major>` for Angular (`apps/ng-15`, `apps/ng-17`) — a separate DIRECTORY LEVEL. The suffix is not repeated in the fixture schema's logical `app.name`/`library.name` fields (which stay bare, e.g. `"orders-app"`; generation tracked separately).

- **Consumer apps install the real published library**, not a local path mapping. Each `apps/<genPrefix>-<gen>/` workspace's `.npmrc` points `@op:registry` at the PoC Verdaccio instance, and installs run with `--legacy-peer-deps` — exactly how a real `@op/*` consumer resolves these packages, except the registry endpoint is config-swappable (Verdaccio in the PoC, Nexus `opnpmprivate` in production — a `.npmrc` switch, no code change).

- **Version = generation channel:** the published version carries the framework generation as a **suffix channel**, not a bare major — the `lib-ng17` workspace's projects publish on the `-ng17` channel and `lib-ng15`'s on `-ng15` (e.g. `@op/core-controls 17.x-ng17` / `15.x-ng15`). Any version comparison or drift score parses the channel before computing how far behind a consumer is.

- **Minor version = fixture intent**, within each generation channel: `x.0.0` baseline, `x.1.0` a compatible change (must `pass`), `x.2.0` a deliberate regression (must `fail`, with a specific finding class). Each variant is a **git tag on one evolving source tree**, not a parallel directory — `scripts/publish-fixture-variant.mjs` materializes each tag in an isolated worktree to build and publish it.

- **App names** follow the design's own §7 illustration where practical: `orders-app`, `billing-app`, `admin-app`, plus `settings-app` and `brownfield-app` for cases the illustration doesn't cover. Not every app exists on every generation — `billing-app` and `admin-app` are built on BOTH `ng-15` and `ng-17`, going beyond the original AC's 4-app minimum, specifically so every app composition can be regression-tested on both generations. Compositions overlap-but-differ: `orders-app` uses Button (unique) + MultiSelect (shared); `settings-app` uses Input (unique) + MultiSelect (shared).

## The oracle: fixtures.manifest.json

Validated by `fixtures/schema.mjs` (zod). Every entry says, for one (app × candidate library version):

``````````
````````
````````````
``````````````****````
````````
``
````****
``

| Field | Meaning |
| --- | --- |
| app.path / library.path | repo-relative path on the layout convention above — schema-validated by regex AND cross-checked against app.framework/app.generation/library.version's major, so a copy-paste mismatch fails validation, not just a visual review |
| expectedVerdict | pass | fail | errored — the gate's final decision |
| expectedFindingClass | visual | build | semantic | layer0 | none |
| expectedConfidence | high | medium | low | zero | unknown — zero is its own tier (not just "low"): §8 says a build failure against the candidate is confidence exactly 0, a deterministic guarantee. unknown is reserved for neverGated fixtures (§8: never gated ⇒ Unknown, not a number) — the schema rejects any other pairing. |
| expectedDrift | none | low | high — drift and pass/fail are independent signals |
| signal | which row of the coverage matrix below this fixture proves |
| acceptedBug | true for an issue-waived intentional change — verdict becomes pass and confidence is not depressed, even though the underlying finding is still honestly recorded |
| notes | the oracle's reasoning — required, never empty |

Run `npm run validate:fixtures` in rippleview-examples to check the committed manifest against the schema and print a signal-coverage summary. Run `npm test` for the full schema test suite.

## Signal-coverage matrix (AC-3)

``**``**````````****
``**``**``````****
``````****
````**``**``````````****
``````****
````````****
``````****
``````****

| Signal | Fixture id | App (path) | Library candidate (path) | Built for real? |
| --- | --- | --- | --- | --- |
| Compatible upgrade, no false positive | ng17-orders-datagrid-compatible | angular/apps/ng-17/orders-app | @op/data-grid 17.1.0-ng17 | fully real |
| Visual regression | ng17-orders-datagrid-visual-regression, data-grid-visual-regression | angular/apps/ng-17/orders-app, angular/apps/ng-15/orders-app | @op/data-grid x.2.0 (per channel) | both entries fully real |
| Build / peer-dep break (confidence = 0) | core-controls-peer-dep-break-ng17 | angular/apps/ng-17/orders-app | @op/core-controls 17.2.0-ng17 | fully real |
| Semantic / BDD regression | ng17-admin-multiselect-semantic-regression, core-controls-multiselect-semantic-regression | angular/apps/ng-17/admin-app, angular/apps/ng-15/orders-app | @op/core-controls x.2.0 (per channel) | both entries fully real |
| Drift-only (behind but still passing) | ng15-billing-core-controls-drift-only | angular/apps/ng-15/billing-app (straggler) | @op/core-controls 15.0.0-ng15 | fully real |
| Generations-behind / mid-migration | ng15-vs-ng17-orders-generations-behind | angular/apps/ng-15/orders-app and angular/apps/ng-17/orders-app (same logical app) | @op/data-grid, per-channel sibling workspace | fully real |
| Layer-0, brownfield, never gated | ng15-brownfield-layer0-violation | angular/apps/ng-15/brownfield-app | @op/core-controls 15.0.0-ng15 | fully real |
| Issue-accepted bug, confidence not depressed | ng17-billing-core-controls-accepted-bug | angular/apps/ng-17/billing-app | @op/core-controls 17.2.0-ng17 | fully real |

**The ng15 and ng17 Angular lines are fully real, end to end** — libraries, apps, and the registry path between them:

- **Libraries:** `@op/core-controls`, `@op/data-grid`, and the internal `@op/shared` dependency are built, version-tagged, and published side by side to the PoC Verdaccio instance under the SAME package name on different generation channels (`-ng15`/`-ng17`). `@op/shared` needed two different versions (`1.0.0`/`2.0.0`) under one name since its peer requirement differs by generation.

- **Apps:** `orders-app`, `billing-app`, and `admin-app` exist on BOTH `angular/apps/ng-15/` and `angular/apps/ng-17/` — one real Angular CLI multi-project workspace per generation, each `npm install --legacy-peer-deps`-ing the real, published `@op/*` packages from Verdaccio via a scoped `.npmrc`. Compositions deliberately overlap-but-differ: `admin-app` (Button/Input/MultiSelect/Form/ErrorHandler, no DataGrid) is simplest; `orders-app` (Button/MultiSelect/Form/DataGrid/Logger) is the mid-migration twin present on both generations; `billing-app` (Button/Input/MultiSelect/DataGrid/Logger/ErrorHandler — both cross-cutting concerns) is the most complex. All 6 apps build clean in both development AND production configuration and were verified end-to-end in a real Chrome instance with zero console errors.

All four 17.2.0/15.2.0 regressions were confirmed live in a real Chrome instance, not just asserted: MultiSelect emits the wrong value ("Open" instead of "open") and DataGrid has unexpected 16px wrapper padding, in both lines, with zero console errors. The ng17 line's `core-controls@17.2.0` additionally bumps its `@angular/core` peerDependency to `^18.0.0` (AC-4's required build/peer-dep break) — verified for real by packing the published tarball and installing it against a throwaway consumer pinned to `@angular/core 17.3.12`: npm's strict peer-dep resolution hard-fails with a real `ERESOLVE` error.

`brownfield-app` is also real now: a deliberately neglected, standalone consumer app pinned to `core-controls@15.0.0` (the oldest published version on the ng15 line — real, high drift), carrying exactly one deliberate, clearly-commented Layer-0 violation (a hardcoded hex `border-color` instead of a semantic theme variable, G15), and never wired into any test/CI path at all (`neverGated: true`). Confirmed live in a real Chrome instance via `getComputedStyle`: the hardcoded color renders exactly as intended. Its own `README.md` explicitly marks it as an intentional bad-citizen fixture — never a reference for "how to build an app here."

**Two version-specific build breaks encountered on the ng17 line:** Angular 17's new `@if`/`@for` control-flow syntax reserves a leading "@" in templates; and `ag-grid-community` 30's CSS moved from `dist/styles/` to `styles/` and dropped the separate base `ag-grid.css` file entirely — this affected both the lib-ng17 playground and the ng-17 consumer apps.

**React side — FUTURE (D11):** the React mirror line is a deferred extension point, not part of this Angular-only demo. When built, it would mirror the reduced scope above: one `@op/react-core-controls` package, version-tagged on one evolving tree, published to the same Verdaccio instance, with standalone Vite React `orders-app`/`settings-app` consumers under `react/apps/r-19/` installing the library from Verdaccio exactly like the Angular consumer apps' convention. React proves the detection signals generalize across UI frameworks; it remains pluggable, not in v1 scope.

**Every fixture app has a real, schema-validated `rippleview.config.yaml`** (confirmed via `loadAppConfig()` against the actual `AppConfigSchema`, not just visual inspection), and the repo root has a real `rippleview.workspace.yaml` declaring the tracked `@op/*` packages. Its `registry:` block (`trackedPackages`/`consumerRepos`/`libraryRepos`) is the documented, intended shape for the registry scanner's config — **not yet schema-validated**, since `rv scan`/`rv impact-select` don't exist yet (stubs in the `rv` framework repo). The registry endpoint is config-driven (Verdaccio for the PoC, Nexus `opnpmprivate` in production via one `.npmrc`/config switch), so adoption swaps these example entries for the real `@op/*` libraries and consumer apps with no framework code change. See `rippleview-examples/docs/fixtures/REGISTRY_DEMO.md` for the exact commands to run and the exact expected `registry.json` per-generation consumer mapping once those land — derived directly from the real, published package versions, ready to execute with zero guesswork.

## What's deferred

- A third live Angular generation (ng19) — dropped per a scoping decision; only two generations for Angular (15/17).

- The entire React mirror line (lib-r19 + apps/r-19) — deferred (D11). Angular is the sole supported v1 target; React is a pluggable extension point demonstrated later, not a second built-out line here.

- The actual registry scan + impact-selection run (the core AC) — not yet implemented; the registry scanner and impact selection are both still stubs in the `rv` framework repo. Pending tasks track this scope so it isn't lost once they land.
