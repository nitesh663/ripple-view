# Demo Fixture Suite — Architecture & Oracle Manifest

**Story:**  (US-17.1). **Epic:** — Demo Fixture Suite. **Design source of truth:** [Demo Fixture Suite — Architecture & Oracle Manifest]() (mirrors this file; the design doc is canonical if they ever drift).

This story defines the **contract** every other story in the Demo Fixture Suite epic builds to. It adds **no app/library code** — only the layout convention, the naming convention, and the machine-readable oracle (`fixtures.manifest.json`) that says, for every (app × library × candidate version) combination, what the framework is supposed to conclude.

See [`VERDACCIO.md`](VERDACCIO.md) for what the local registry these libraries publish to actually is, what's currently published, and how to reset it.

## Why this exists

RippleView's whole value is detecting shared-library regressions across many consumer apps. The original Sprint-0 scaffolds (`react-app/`, and `angular-app/` until it was retired once the real Angular fixtures landed) are deliberately minimal: no shared library, no version diversity, nothing to actually regress. `react-app/` remains in place, untouched, as the original "does it build and serve" reference — but it cannot prove the framework's *correctness*, only that it runs.

This epic replaces "it ran without crashing" with **"for every fixture, we know the correct verdict in advance, and the framework produces it."** That's the oracle.

## The enterprise reality being modeled

A real enterprise with 15+ UI apps does not migrate framework versions all at once:

- A shared component library is maintained as **parallel framework-generation support lines simultaneously** — an Angular 15 line *and* an Angular 17 line of the *same* library, because ng15 apps still need fixes while the ng17 line moves ahead.
- Consumer apps are scattered across generations: well-maintained and current, least-maintained stragglers, and **apps mid-migration that exist on two generations at once**.
- The framework must work for every client maturity level, not just the best-maintained one.

## Layout convention

**The mental model: a real org doesn't nest framework versions inside one shared folder — it checks out a different *branch*, and that branch's tree looks otherwise identical, just at a different version.** We have no git branches here (everything must be testable in one checkout / one CI run), so each generation becomes a **whole sibling directory**, suffixed by generation, with the *same internal structure repeated* — never a generation segment nested inside an otherwise-shared path:

```
rippleview-examples/
  react-app/                          # Sprint-0 reference — untouched by this epic
                                       # (angular-app/, the Angular equivalent, was retired
                                       # once the real Angular fixtures below landed)

  angular/
    libraries/
      lib-ng15/                       # a REAL `ng new` + `ng generate library` Angular CLI
        angular.json                  # workspace as of the "ng15 branch" — not a bare package
        projects/
          core-controls/              # Button, Input, MultiSelect, Form — ONE bundled package
          data-grid/                  # AG Grid 27 wrapper — its own package
          shared/                     # internal plumbing core-controls depends on (not
          playground/                 # registry-tracked — see Naming convention below)
                                       # a real `ng serve`-able demo dashboard, not published
      lib-ng17/                       # the WHOLE workspace as of the "ng17 branch" — same
        ...                           # internal shape, repeated, just a different sibling dir
    apps/
      ng-15/                           # a directory grouping this generation's apps — NOT a
        orders-app/                    # shared workspace. Each app below is its OWN
        billing-app/                   # fully independent `ng new` Angular CLI app: own
        admin-app/                     # angular.json, package.json, node_modules, .npmrc —
        brownfield-app/                # least-maintained, deliberately bad-citizen (see its own README.md) — pinned to core-controls
                                        # 15.0.0, one Layer-0 violation, never gated
      ng-17/                           # runnable/buildable on its own, exactly like a real
        orders-app/                    # standalone consumer app. Each `npm install`s the
        billing-app/                   # real, published @op/* packages from
        admin-app/                     # Verdaccio. orders-app exists on BOTH ng-15 and
                                        # ng-17 (the mid-migration twin)

  react/
    libraries/
      lib-r19/                         # ONE generation only (deliberate scope cut —
        core-controls/                 # see "Why React's scope is deliberately reduced" below).
          src/                         # ONE bundled package (Button/Input/MultiSelect/Form,
        playground/                    # mirroring Angular's core-controls bundling decision).
                                        # No data-grid, no shared-services package.
    apps/
      r-19/                            # a grouping directory, NOT a shared workspace —
        orders-app/                    # each app below is its OWN fully independent, standalone
        settings-app/                  # Vite React app: own package.json, vite.config.ts,
                                        # node_modules, .npmrc. Same "no shared workspace" rule
                                        # as the Angular consumer apps. Compositions
                                        # overlap-but-differ: orders-app uses Button (unique) +
                                        # MultiSelect (shared); settings-app uses Input (unique)
                                        # + MultiSelect (shared) — no mid-migration twin, since
                                        # there's only one React generation.

  fixtures.manifest.json              # the oracle (this story)
  fixtures/                           # the oracle's schema + validator (this story)
  docs/fixtures/ARCHITECTURE.md       # this file
```

### Why React's scope is deliberately reduced

Angular is this framework's primary target; React exists **only to demonstrate that RippleView's detection signals generalize across UI frameworks**, not as a second fully-built-out line. Per explicit direction,  delivers a single, light real fixture instead of the original AC's full react18+react19 × 3-package matrix:

- **One generation:** React 19 only (19.2.7, latest stable) — no react18 line.
- **One bundled package:** `@op/react-core-controls` (Button/Input/MultiSelect/Form), mirroring the Angular `core-controls` bundling decision — no `react-datagrid`, no shared-services package.
- **No 18→19 peer-dep break** — there's no react18 line to break against. The `build-peer-dep-break` signal already has real coverage from the Angular side (`core-controls-peer-dep-break-ng17`), so AC-3's per-signal coverage requirement is unaffected.

Two non-negotiable rules for Angular (enforced by `fixtures/schema.mjs`, not just documented), and they are **deliberately asymmetric between libraries and apps**:

1. **Libraries:** the generation suffix lives on the directory/package NAME itself (`lib-ng15`, `lib-ng17`) — never a separate nested path segment shared across generations. Two generations of the same library never share a directory; nothing is parameterized by generation at runtime.
2. **Apps:** the generation IS its own nested directory level (`apps/ng-15/orders-app`, `apps/ng-17/orders-app`), but unlike libraries, that directory is NOT a shared workspace — `ng-15`/`ng-17` are just grouping directories. Each app underneath is its own fully independent, standalone `ng new` Angular CLI app (own `angular.json`, `package.json`, `node_modules`, `.npmrc`), runnable and buildable entirely on its own, exactly like a real consumer app would be. (An earlier draft of this story tried sharing one multi-project workspace per generation, mirroring the libraries' `projects/` shape — that was wrong for apps specifically, since each app needs to be independently runnable, not bundled into a shared tooling workspace.)

**Learned the hard way during ** a *real* Angular CLI library workspace (`ng new` + `ng generate library`) is not a single package — it's a workspace containing multiple buildable `projects/<name>/`. The schema's `library.path` regex accepts an optional `projects/` segment for exactly this reason. React's `lib-r19/core-controls` doesn't use it — there's no React-CLI-style multi-project workspace; it's a real Vite-library-mode package (vite build for ESM+CJS + `tsc --emitDeclarationOnly` for types) plus a separate sibling `playground/` Vite app, the closest React equivalent to Angular's `ng-packagr` + `ng serve`-able playground.

The same logical app mid-migration (e.g. `orders-app`) appears as **two whole, independent standalone apps** — `apps/ng-15/orders-app/` and `apps/ng-17/orders-app/` — simulating two git branches checked out side by side. See `generations-behind` in the oracle below.

## Naming convention

- **Library package name (unchanged across generations):** published as a scoped `@op/<name>` — e.g. `@op/core-controls`, `@op/data-grid`. **Scoping is not optional** — published unscoped (`shared`, `data-grid`, `core-controls`) once and discovered Verdaccio's own `uplinks.npmjs` proxy (deliberately configured so a real consumer can resolve both candidate and ordinary packages through one registry) silently conflated them with real, unrelated public npm packages of the same name (`shared` is a real "objects over MongoDB" package; `data-grid` is a real virtual-dom grid library). The **same package name** is published independently from each generation's sibling directory (`lib-ng15/projects/data-grid` and `lib-ng17/projects/data-grid` both publish `@op/data-grid`, at different majors) — this is what lets the registry namespace consumers by framework generation automatically (per the design docs), with zero extra bookkeeping.
- **One package can bundle several components.** The original plan was one-component-per-package (`@op/ng-button`, `ng-multiselect`, `ng-datagrid`); the ng15 line as actually built bundles Button/Input/MultiSelect/Form into a single `@op/core-controls` (a deliberate, accepted architecture decision — a real enterprise team plausibly ships its whole "core controls" set as one package). `@op/data-grid` stays its own package. The oracle tracks libraries by their real published package name, whatever that turns out to be per generation/story — it does not assume one-component-per-package.
- **Not every dependency is registry-tracked.** `shared` (internal utilities `core-controls` depends on) is a real, versioned, published dependency — but it is not independently tracked by the registry/impact-selection oracle, the same way an app's dependency on `rxjs` isn't. Only the libraries a *consumer app* directly depends on and that the registry fans out against belong in `fixtures.manifest.json`.
- **Library directory/package generation suffix:** `-ng<major>` for Angular (`lib-ng15`, `lib-ng17`), `-r<major>` for React (`lib-r19` — only one generation exists, per the scope cut above) — a NAME suffix, per rule 1 above.
- **App generation directory:** `<genPrefix>-<major>` for Angular (`apps/ng-15`, `apps/ng-17`), `<genPrefix>-<major>` for React (`apps/r-19`) — a separate DIRECTORY LEVEL, per rule 2 above. Neither suffix is repeated in the fixture schema's logical `app.name`/`library.name` fields (which stay bare, e.g. `"orders-app"`; generation tracked separately in `app.generation`/the library version's major).
- **Version = generation (T-17.1.1's core rule):** the published **major** version tracks the framework generation exactly — the `lib-ng17` workspace's projects publish `17.x`, `lib-r19` publishes `19.x`, etc. (Apps don't publish anywhere — they're built and consumed in place, so this rule is library-only.)
- **Minor version = fixture intent**, within each generation: `x.0.0` baseline, `x.1.0` a compatible change (must `pass`), `x.2.0` a deliberate regression (must `fail`, with a specific finding class). Each variant is a **git tag on one evolving source tree**, not a parallel directory — `scripts/publish-fixture-variant.mjs` materializes each tag in an isolated worktree to build and publish it.
- **Consumer apps install the real published library**, not a local path mapping. Each `apps/<genPrefix>-<gen>/` workspace's `.npmrc` points `@op:registry` at the local Verdaccio instance (see [`VERDACCIO.md`](VERDACCIO.md)) — exactly how a real consumer would resolve these packages, which is what makes a real version-swap/build-break test possible against them.
- **App names** follow the design's own illustration where practical: `orders-app`, `billing-app`, `admin-app`, plus `settings-app` and `brownfield-app` for cases the illustration doesn't cover. Not every app exists on every generation — `billing-app`/`admin-app` are deliberately asymmetric per the AC each story actually needs (e.g.  builds `billing-app` and `admin-app` on BOTH `ng-15` and `ng-17`, going beyond the original AC's 4-app minimum, specifically so every app composition can be regression-tested on both generations). React's apps are deliberately MINIMAL by comparison — just `orders-app` and `settings-app` on the single `r-19` generation, per the same scope cut as the React library.

## The oracle: `fixtures.manifest.json`

Validated by `fixtures/schema.mjs` (zod). Every entry says, for one (app × candidate library version):

| Field | Meaning |
|---|---|
| `app.path` / `library.path` | repo-relative path on the layout convention above — schema-validated by regex AND cross-checked against `app.framework`/`app.generation`/`library.version`'s major, so a copy-paste mismatch fails validation, not just a visual review |
| `expectedVerdict` | `pass` \| `fail` \| `errored` — the gate's final decision |
| `expectedFindingClass` | `visual` \| `build` \| `semantic` \| `layer0` \| `none` — what kind of finding backs that verdict |
| `expectedConfidence` | `high` \| `medium` \| `low` \| `zero` \| `unknown` — `zero` is its own tier (not just "low"): design says a build failure against the candidate is confidence **exactly 0**, a deterministic guarantee, not a score. `unknown` is reserved for `neverGated` fixtures (: never gated ⇒ Unknown, not a number) — the schema rejects any other pairing. |
| `expectedDrift` | `none` \| `low` \| `high` — drift and pass/fail are independent signals (a straggler can `pass` today and still have high drift) |
| `signal` | which row of the coverage matrix below this fixture proves |
| `acceptedBug` | true for a waived intentional change — verdict becomes `pass` and confidence is **not** depressed, even though the underlying finding (e.g. `visual`) is still honestly recorded |
| `notes` | the oracle's reasoning — required, never empty |

Run `npm run validate:fixtures` to check the committed manifest against the schema and print a signal-coverage summary. Run `npm test` for the full schema test suite.

## Signal-coverage matrix (AC-3)

Every signal RippleView claims to detect has at least one fixture proving it:

| Signal | Fixture id | App (path) | Library candidate (path) | Built for real? |
|---|---|---|---|---|
| Compatible upgrade, no false positive | `ng17-orders-datagrid-compatible`, **`react19-orders-core-controls-compatible`** | `angular/apps/ng-17/orders-app`, `react/apps/r-19/orders-app` | `@op/data-grid` 17.1.0, `@op/react-core-controls` 19.1.0 | **both entries fully real** |
| Visual regression | `ng17-orders-datagrid-visual-regression`, **`data-grid-visual-regression`** | `angular/apps/ng-17/orders-app`, `angular/apps/ng-15/orders-app` | `@op/data-grid` `x.2.0` | **both entries fully real** |
| Build / peer-dep break (confidence = 0) | `core-controls-peer-dep-break-ng17` | `angular/apps/ng-17/orders-app` | `@op/core-controls` 17.2.0 | **fully real** |
| Semantic / BDD regression | `ng17-admin-multiselect-semantic-regression`, `react19-settings-multiselect-semantic-regression`, **`core-controls-multiselect-semantic-regression`** | `angular/apps/ng-17/admin-app`, `react/apps/r-19/settings-app`, `angular/apps/ng-15/orders-app` | `@op/core-controls` `x.2.0`, `@op/react-core-controls` 19.2.0 | **all three entries fully real** |
| Drift-only (behind but still passing) | `ng15-billing-core-controls-drift-only` | `angular/apps/ng-15/billing-app` (straggler) | `@op/core-controls` 15.0.0 | **fully real** |
| Generations-behind / mid-migration | `ng15-vs-ng17-orders-generations-behind` | `angular/apps/ng-15/orders-app` **and** `angular/apps/ng-17/orders-app` (same logical app) | `@op/data-grid`, per-generation sibling workspace | **fully real** |
| Layer-0 violation, brownfield, never gated | `ng15-brownfield-layer0-violation` | `angular/apps/ng-15/brownfield-app` | `@op/core-controls` 15.0.0 | **fully real** |
| Accepted bug, confidence not depressed | `ng17-billing-core-controls-accepted-bug` | `angular/apps/ng-17/billing-app` | `@op/core-controls` 17.2.0 | **fully real** |

As of /465, **the ng15 and ng17 Angular lines are fully real, end to end** — libraries, apps, and the registry path between them:

- **Libraries:** `@op/core-controls`, `@op/data-grid`, and the internal `@op/shared` dependency are built, version-tagged (15.0.0/15.1.0/15.2.0 and 17.0.0/17.1.0/17.2.0, git tags on one evolving tree per line), and published side by side to a real local Verdaccio instance — confirmed via `npm view ... versions` returning both major ranges under the SAME package name. `@op/shared` needed two DIFFERENT majors under the same name (`1.0.0`/`2.0.0`) since its peer requirement differs by generation; see the naming-collision note above.
- **Apps:** `orders-app`, `billing-app`, and `admin-app` exist on BOTH `angular/apps/ng-15/` and `angular/apps/ng-17/` — each app is its OWN fully independent, standalone `ng new` Angular CLI app (own `angular.json`, `package.json`, `node_modules`, `.npmrc`), not a project sharing a generation-level workspace. Each `npm install`s the real, published `@op/*` packages from Verdaccio via a scoped `.npmrc` (`@op:registry=http://localhost:4873`), exactly like a real consumer would. Compositions deliberately overlap-but-differ: `admin-app` (Button/Input/MultiSelect/Form/ErrorHandler, no DataGrid) is the simplest; `orders-app` (Button/MultiSelect/Form/DataGrid/Logger) is the mid-migration twin present on both generations; `billing-app` (Button/Input/MultiSelect/DataGrid/Logger/ErrorHandler — both cross-cutting concerns) is the most complex. All 6 apps build clean in both development AND production configuration (production budgets adjusted for the two DataGrid-heavy apps — a real, expected AG Grid footprint, not bloat) and were verified end-to-end in a real Chrome instance with zero console errors. ng-17's apps default to Angular 17's newer esbuild-based `application` builder (`ng new`'s own default for v17), while ng-15's use the legacy `browser` builder — a real, expected difference between generations, not an inconsistency.

All four 17.2.0/15.2.0 regressions were confirmed live in a real Chrome instance, not just asserted: MultiSelect emits the wrong value ("Open" instead of "open") and DataGrid has unexpected 16px wrapper padding, in both lines, with zero console errors. The ng17 line's `core-controls@17.2.0` additionally bumps its `@angular/core` peerDependency to `^18.0.0` (AC-4's required build/peer-dep break, not present in 's AC) — verified for real by packing the published tarball and installing it against a throwaway consumer pinned to `@angular/core 17.3.12`: npm's strict peer-dep resolution hard-fails with a real `ERESOLVE` error, not a warning.

`brownfield-app` is also real now: a deliberately neglected, standalone consumer app pinned to `core-controls@15.0.0` (the oldest published version on the ng15 line — real, high drift), carrying exactly one deliberate, clearly-commented Layer-0 violation (a hardcoded hex `border-color` instead of a semantic theme variable, G15), and never wired into any test/CI path at all (`neverGated: true`). Confirmed live in a real Chrome instance via `getComputedStyle`: the hardcoded color renders exactly as intended. Its own `README.md` explicitly marks it as an intentional bad-citizen fixture — never a reference for "how to build an app here."

**Two version-specific build breaks  hit that  didn't** (found only by actually building against the real ng17 toolchain, not by reading changelogs): Angular 17's new `@if`/`@for` control-flow syntax reserves a leading `@` in templates, so literal `@op/...` demo text in the lib-ng17 playground had to be escaped as `&#64;op/...`; and `ag-grid-community` 30's CSS moved from `dist/styles/` to `styles/` and dropped the separate base `ag-grid.css` file entirely (the theme CSS is now self-contained) — this affected both the lib-ng17 playground and the ng-17 consumer apps.

**Apps deliberately use a different layout convention than libraries**: apps nest the generation as its own directory level (`angular/apps/ng-17/orders-app`), not a name suffix on a sibling directory like libraries (`angular/libraries/lib-ng17/...`). See the Layout convention section above for why.

As of, **the React side is fully real too, end to end, on the deliberately reduced scope described above**: `@op/react-core-controls` is built, version-tagged (19.0.0/19.1.0/19.2.0, git tags on one evolving tree, same convention as the Angular lines), and published to the same local Verdaccio instance. `orders-app` and `settings-app` (`react/apps/r-19/`) are real, fully standalone, production-buildable Vite React apps — each its own `package.json`/`vite.config.ts`/`node_modules`/`.npmrc`, installing the library from Verdaccio, exactly like the Angular consumer apps' own convention (no shared workspace). Compositions overlap-but-differ: `orders-app` uses Button (unique) + MultiSelect (shared); `settings-app` uses Input (unique) + MultiSelect (shared). The 19.2.0 MultiSelect regression — the identical defect class as both Angular lines (`optionValue` silently switching from `"value"` to `"label"`) — and the 19.1.0 compatible upgrade were both confirmed live in a real Chrome instance, zero console errors, proving the same oracle signals generalize across frameworks.

As of, **every fixture app has a real, schema-validated `rippleview.config.yaml`** (confirmed via `loadAppConfig()` against the actual `AppConfigSchema`, not just visual inspection), and the repo root has a real `rippleview.workspace.yaml` declaring the tracked `@op/*` packages. Its `registry:` block (`trackedPackages`/`consumerRepos`/`libraryRepos`) is the documented, intended shape for the registry scanner's config — **not yet schema-validated**, since `rv scan`/`rv impact-select` don't exist yet (they're stubs in the `rv` framework repo, tracked as /). See [`REGISTRY_DEMO.md`](REGISTRY_DEMO.md) for the exact commands to run and the exact expected `registry.json` per-generation consumer mapping once those land — derived directly from the real, published package versions, ready to execute with zero guesswork.

## What's deferred (explicitly out of scope here)

- A third live Angular generation (ng19) — dropped per a later scoping decision; only two generations for Angular (15/17). React is a single generation by design (19 only — see above), not a deferred second line.
- The actual registry scan + impact-selection run — blocked on the registry scanner and impact-selection commands, both still stubs in the `rv` framework repo. See [`REGISTRY_DEMO.md`](REGISTRY_DEMO.md). Pending tasks referencing this story have been added to both backlog items so the scope isn't lost once they land.
- Each of the fixture-building stories must keep `fixtures.manifest.json` and reality in sync — if a path, name, or version in this manifest turns out to need adjusting once the real code exists (as happened for both Angular lines, and for the react19 library and apps — see the naming-collision note above), update the manifest in that story, not here.
