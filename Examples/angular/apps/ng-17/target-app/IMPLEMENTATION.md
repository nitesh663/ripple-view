# target-app — Implementation Guide

## Purpose

Standalone Angular 17 application for the **Target** domain. Displays a `@op/dynamic` (`dynamic-aggrid`) grid with 10 columns and 20 sample rows. Clicking any row shows the selected row's details rendered using `@op/core-controls` components (input fields, dropdowns) in a detail panel.

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

1. **Install dependencies**
   ```bash
   cd angular/apps/ng-17/target-app
   npm install
   ```

2. **Serve locally**
   ```bash
   npm start        # → http://localhost:4302
   ```

3. **Build production**
   ```bash
   npm run build
   ```

## Key Dependencies

| Package             | Version    | Role                            |
|---------------------|------------|---------------------------------|
| `@op/dynamic`       | 0.0.1-ng17 | Metadata-driven dynamic grid    |
| `@op/aggrid`        | 0.0.1-ng17 | Underlying grid (peer dep)      |
| `@op/core-controls` | 0.0.1-ng17 | Detail panel controls           |
| `@ngrx/store`       | ^17.x      | Required by `@op/aggrid`        |
| `@ngrx/effects`     | ^17.x      | Required by `@op/aggrid`        |

## Notes

- `dynamic-aggrid` resolves column renderers/editors from `colsMeta[].type` — no manual `frameworkComponents` map needed.
- The detail panel is shown/hidden via `*ngIf="selectedRow"`.
- `(selectionChanged)` emits an AG Grid `SelectionChangedEvent`; use `event.api.getSelectedRows()[0]` to extract the row.
