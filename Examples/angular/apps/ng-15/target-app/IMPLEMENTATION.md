# target-app (ng-15) — Implementation Guide

> **Angular 15 variant.** Mirrors `angular/apps/ng-17/target-app` on the Angular 15.2 toolchain (webpack `browser` builder, TypeScript 4.9) and the `0.0.1-ng15` `@op` library set. Serves on **port 4402**.

## Purpose

Standalone Angular 15 application for the **Target** domain. Displays a `@op/dynamic` (`dynamic-aggrid`) grid with 10 columns and 20 sample rows. Clicking any row shows the selected row's details rendered using `@op/core-controls` components (input fields, dropdowns) in a detail panel.

## Architecture

```
target-app/
├── src/app/
│   ├── shared/
│   │   └── topbar/            ← Reusable topbar (same design as product-app)
│   ├── features/
│   │   └── target/            ← TargetComponent (grid + detail panel)
│   ├── app-routing.module.ts
│   ├── app.module.ts
│   └── app.component.*        ← Wraps topbar + router-outlet
└── src/assets/
    └── rippleview-logo.svg
```

## Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [RV Logo]                     Target                  Topbar   │
├────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────┐  ┌─────────────────────────┐ │
│ │  dynamic-aggrid               │  │  Row Detail Panel       │ │
│ │  10 columns × 20 rows         │  │  (core-controls)        │ │
│ │  (click row to select →)      │  │  Name: [input]          │ │
│ │                               │  │  Region: [dropdown]     │ │
│ │                               │  │  Status: [dropdown]     │ │
│ └───────────────────────────────┘  └─────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Grid Setup

- **Component:** `<dynamic-aggrid>` from `@op/dynamic`
- **Columns (10):** ID, Name, Region, Category, Budget, Actual, Variance, Status, Start Date, Actions
- **Rows (20):** sample target records
- **Row Selection:** `rowSelection="single"` — clicking a row fires `(selectionChanged)`

## Detail Panel

On row selection, the panel renders using `@op/core-controls`:

| Field    | Control              |
|----------|----------------------|
| ID       | `op-cc-input` (read-only) |
| Name     | `op-cc-input`        |
| Region   | `op-cc-dropdown`     |
| Category | `op-cc-dropdown`     |
| Status   | `op-cc-dropdown`     |
| Budget   | `op-cc-input` (number) |

## Implementation Steps

1. **Install dependencies** (requires the local Verdaccio registry with `@op/*@0.0.1-ng15` published — see repo `docs/fixtures/VERDACCIO.md`)
   ```bash
   cd angular/apps/ng-15/target-app
   npm install --legacy-peer-deps
   ```

2. **Serve locally**
   ```bash
   npm start        # → http://localhost:4402
   ```

3. **Build production**
   ```bash
   npm run build
   ```

## Key Dependencies

| Package               | Version    | Role                            |
|-----------------------|------------|---------------------------------|
| `@op/dynamic`         | 0.0.1-ng15 | Metadata-driven dynamic grid    |
| `@op/aggrid`          | 0.0.1-ng15 | Underlying grid (peer dep)      |
| `@op/core-controls`   | 0.0.1-ng15 | Detail panel controls           |
| `@ngrx/store`         | ^15.4.0    | Required by `@op/aggrid` (feature slices) |
| `@ngx-translate/core` | ^14.0.0    | `translate` pipe in grid templates |

## Notes

- `dynamic-aggrid` resolves column renderers/editors from `colsMeta[].type` — no manual `frameworkComponents` map needed.
- `OpDynamicAggridModule` pulls in `OpAgGridModule`, which registers NgRx feature slices — the host `AppModule` imports `StoreModule.forRoot({})` and `TranslateModule.forRoot()` (no `@ngrx/effects` in the ng-15 build).
- `dynamic-aggrid`'s ng-15 bundle already ships `:host { display:block; height:100%; width:100% }`, so only the surrounding flex/height chain needs setting up.
- The detail panel is shown/hidden via `*ngIf="selectedRow"`; `(selectionChanged)` emits an AG Grid `SelectionChangedEvent` — use `event.api.getSelectedRows()[0]`.
