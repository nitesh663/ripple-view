# product-app — Implementation Guide

## Purpose

Standalone Angular 17 application for the **Product** domain. Displays a tabbed interface with two tabs — **Product** (default) and **Package** — where the Product tab features a fully-featured `@op/aggrid` grid with 10 columns, 20 sample rows, a dropdown filter above the grid, and the AG Grid sidebar filter panel.

## Architecture

```
product-app/
├── src/app/
│   ├── shared/
│   │   └── topbar/            ← Reusable topbar component
│   ├── features/
│   │   ├── product/           ← ProductComponent (default tab — AG Grid)
│   │   └── package/           ← PackageComponent (placeholder tab)
│   ├── app-routing.module.ts
│   ├── app.module.ts
│   └── app.component.*        ← Tabs host
└── src/assets/
    └── rippleview-logo.svg
```

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [RV Logo]                    Product                   Topbar   │
├─────────────────────────────────────────────────────────────────┤
│  [Package]  [Product ✓]                                 Tabs    │
├─────────────────────────────────────────────────────────────────┤
│  Status ▼   [dropdown filter above grid]                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  AG Grid — 10 columns × 20 rows             [Sidebar ►]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Tabs

| Tab     | Default? | Content                             |
|---------|----------|-------------------------------------|
| Product | **Yes**  | `@op/aggrid` with sidebar filtering |
| Package | No       | Placeholder / package listing       |

## Product Tab — AG Grid Setup

- **Columns (10):** ID, Name, Category, SKU, Price, Stock, Status, Region, Last Updated, Actions
- **Rows (20):** sample product records
- **Dropdown above grid:** filters by `Status` (`Active`, `Inactive`, `Discontinued`)
- **Sidebar filter panel:** uses `GenericAggridConfgProvider.buildSideBar()`; includes Name, Category, Status fields

## Implementation Steps

1. **Install dependencies**
   ```bash
   cd angular/apps/ng-17/product-app
   npm install
   ```

2. **Serve locally**
   ```bash
   npm start        # → http://localhost:4301
   ```

3. **Build production**
   ```bash
   npm run build
   ```

## Key Dependencies

| Package             | Version    | Role                            |
|---------------------|------------|---------------------------------|
| `@op/aggrid`        | 0.0.1-ng17 | AG Grid wrapper + sidebar       |
| `@op/core-controls` | 0.0.1-ng17 | Dropdown above grid             |
| `@ngrx/store`       | ^17.x      | Required by `@op/aggrid`        |
| `@ngrx/effects`     | ^17.x      | Required by `@op/aggrid`        |
| `ag-grid-community` | ~30.x      | AG Grid community edition       |

## Notes

- `OpAgGridModule` registers two NgRx feature slices — the host `AppModule` must import `StoreModule.forRoot({})` and `EffectsModule.forRoot([])` first.
- The grid `id` input (`id="product-grid"`) enables column-state persistence via `AgGridStateService` (localStorage).
- The status dropdown above the grid filters by setting `quickFilter` on the grid API via `(selectionChanged)` event.
