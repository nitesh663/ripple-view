# Registry scan + impact selection demo

**Story status: partially delivered.** This story's own AC requires running the actual `rv scan` registry scanner and demoing impact selection against these fixtures. That command doesn't exist yet — `rv scan`, `rv crawl`, `rv baseline`, and `rv report` are all stubs in `rv/packages/cli/src/commands/stubs.ts` (each returns exit code 1, "not yet implemented"). The underlying work is tracked as **** (registry scanner) and **** (impact selection), both still in the backlog — pending tasks have been added to each so this story's remaining scope isn't lost (see their descriptions).

What's delivered now, real and schema-validated:

- Every fixture app has a real `rippleview.config.yaml`, parsed and validated against the actual `AppConfigSchema` (`rv/packages/core/src/config/schema.ts`) — confirmed via `loadAppConfig()`, not just visual inspection.
- `rippleview.workspace.yaml` at the repo root, with its `packages` field (the real, currently-schema-supported field) listing every tracked `@op/*` package.
- A documented, intended `registry:` block in that same file specifying `trackedPackages`/`consumerRepos`/`libraryRepos` — **not yet schema-validated** (the current `WorkspaceConfigSchema` doesn't have these fields; zod's non-strict parsing silently drops them today). This is the exact shape  needs to extend the schema to support.
- This document: the exact CLI commands to run and the exact expected `registry.json` output, derived directly from the real, currently-published package versions and the real `fixtures.manifest.json` oracle — ready to execute the moment  ship, with zero guesswork about what "correct" looks like.

## Commands to run once  ship

```bash
# From the rippleview-examples repo root:
rv scan --workspace rippleview.workspace.yaml --out registry.json

# Then, for any candidate version bump on one generation's line:
rv impact-select --registry registry.json --package "@op/core-controls" --version 17.2.0
```

## Expected `registry.json` per-generation consumer mapping

Derived from the real, published package versions (`npm view <pkg> versions --registry http://localhost:4873`) and each app's real `package.json` pin — this is what a correct scan must produce:

| Package | Generation | Consumers (real pin) |
|---|---|---|
| `@op/core-controls` | 15 (`angular/libraries/lib-ng15/projects/core-controls`) | `orders-app` (ng15, `15.0.0`), `billing-app` (ng15, `15.0.0`), `admin-app` (ng15, `15.0.0`), `brownfield-app` (ng15, `15.0.0`) |
| `@op/core-controls` | 17 (`angular/libraries/lib-ng17/projects/core-controls`) | `orders-app` (ng17, `17.0.0`), `billing-app` (ng17, `17.0.0`), `admin-app` (ng17, `17.0.0`) |
| `@op/data-grid` | 15 (`angular/libraries/lib-ng15/projects/data-grid`) | `orders-app` (ng15, `15.0.0`), `billing-app` (ng15, `15.0.0`) — **not** `admin-app` or `brownfield-app` (neither imports DataGrid) |
| `@op/data-grid` | 17 (`angular/libraries/lib-ng17/projects/data-grid`) | `orders-app` (ng17, `17.0.0`), `billing-app` (ng17, `17.0.0`) — **not** `admin-app` |
| `@op/react-core-controls` | 19 (`react/libraries/lib-r19/core-controls`) | `orders-app` (r19, `19.0.0`), `settings-app` (r19, `19.0.0`) |

`@op/shared` is intentionally excluded from `trackedPackages` (see `docs/fixtures/ARCHITECTURE.md`'s naming convention — it's internal plumbing, not independently oracle-tracked, the same way a dependency on `rxjs` isn't).

## Expected impact-selection behavior (AC-3)

A candidate change to `@op/core-controls@17.2.0` (the real, published regression+peer-dep-break variant from ) must select **exactly**: `orders-app` (ng17), `billing-app` (ng17), `admin-app` (ng17) — and **none** of:
- the ng15 apps (different generation, different package version line — `core-controls` 15.x is a completely separate namespace from 17.x even though it's the same package name)
- `react/apps/r-19/*` (different framework entirely)

A candidate change to `@op/data-grid@15.2.0` must select **exactly** `orders-app` (ng15) and `billing-app` (ng15) — proving a DataGrid-only change never selects `admin-app` or `brownfield-app`, which don't import it (AC-3's own example case).

This table is the literal acceptance check once `rv scan`/`rv impact-select` are real: run the command, diff its output against this table (and against `fixtures.manifest.json`, which already encodes the same per-app library list — see each fixture's `app`/`library` fields).
