# product-app (ng-15) — Implementation Guide

> **Angular 15 variant.** Mirrors `angular/apps/ng-17/product-app` on the Angular 15.2 toolchain (webpack `browser` builder, TypeScript 4.9) and the `0.0.1-ng15` `@op` library set. Serves on **port 4401**.

## Purpose

Standalone Angular 15 application for the **Product** domain. Displays a tabbed interface with two tabs — **Product** (default) and **Package** — where **both** tabs feature a fully-featured `@op/aggrid` grid (10 columns, 20 sample rows, a dropdown filter above the grid, and the AG Grid sidebar filter panel).

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
| Package | No       | `@op/aggrid` package grid (10 cols × 20 rows) with sidebar filtering |

## Product Tab — AG Grid Setup

- **Columns (10):** ID, Name, Category, SKU, Price, Stock, Status, Region, Last Updated, Actions
- **Rows (20):** sample product records
- **Dropdown above grid:** filters by `Status` (`Active`, `Inactive`, `Discontinued`)
- **Sidebar filter panel:** uses `GenericAggridConfgProvider.buildSideBar()`; includes Name, Category, Status fields

## Implementation Steps

1. **Install dependencies** (requires the local Verdaccio registry with `@op/*@0.0.1-ng15` published — see repo `docs/fixtures/VERDACCIO.md`)
   ```bash
   cd angular/apps/ng-15/product-app
   npm install --legacy-peer-deps
   ```

2. **Serve locally**
   ```bash
   npm start        # → http://localhost:4401
   ```

3. **Build production**
   ```bash
   npm run build
   ```

## Key Dependencies

| Package               | Version    | Role                            |
|-----------------------|------------|---------------------------------|
| `@op/aggrid`          | 0.0.1-ng15 | AG Grid wrapper + sidebar       |
| `@op/core-controls`   | 0.0.1-ng15 | Dropdown above grid             |
| `@ngrx/store`         | ^15.4.0    | Required by `@op/aggrid` (feature slices) |
| `@ngx-translate/core` | ^14.0.0    | `translate` pipe in grid templates |
| `@ag-grid-community/*`/`@ag-grid-enterprise/*` | ~30.2.1 | Modular AG Grid 30 |

## Notes

- `OpAgGridModule` (ng-15) registers two NgRx feature slices — the host `AppModule` must import `StoreModule.forRoot({})` first. Unlike ng-17, the ng-15 build uses **no `@ngrx/effects`**.
- The host `AppModule` must also import `TranslateModule.forRoot()` so `occ-aggrid`'s `translate` pipe resolves `TranslateService`.
- `occ-aggrid` needs a global `occ-aggrid { display: block; height: 100%; width: 100% }` rule (in `src/styles.scss`) plus an unbroken height/flex chain, or the grid renders with zero height.
- The grid `id` input enables column-state persistence via `AgGridStateService` (localStorage).
