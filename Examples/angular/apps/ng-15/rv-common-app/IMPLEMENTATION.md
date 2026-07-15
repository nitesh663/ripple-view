# rv-common-app (ng-15) — Implementation Guide

> **Angular 15 variant.** Mirrors `angular/apps/ng-17/rv-common-app` feature-for-feature, built on the Angular 15.2 toolchain (webpack `@angular-devkit/build-angular:browser` builder, TypeScript 4.9) and the `0.0.1-ng15` `@op` library set. Serves on **port 4400**.

## Purpose

Shell application that hosts all RippleView micro-apps under a unified layout. Provides the global topbar, left-sidebar navigation, and lazy-loaded routing to `product-app` and `target-app`.

## Architecture

```
rv-common-app/
├── src/app/
│   ├── layout/
│   │   ├── topbar/        ← RippleView logo + global header
│   │   └── sidebar/       ← Left nav: Product | Target
│   ├── features/
│   │   ├── product/       ← Lazy-loaded ProductModule (mirrors product-app)
│   │   └── target/        ← Lazy-loaded TargetModule  (mirrors target-app)
│   ├── app-routing.module.ts
│   ├── app.module.ts
│   └── app.component.*
└── src/assets/
    └── rippleview-logo.svg
```

## Routes

| Path       | Component / Module      | Default? |
|------------|-------------------------|----------|
| `/`        | Redirect → `/product`   | Yes      |
| `/product` | ProductModule (lazy)    |          |
| `/target`  | TargetModule (lazy)     |          |

## Layout

```
┌─────────────────────────────────────────────────────┐
│ [RV Logo]        RippleView Shell            Topbar  │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │                                           │
│ ▶ Product│          <router-outlet>                  │
│   Target │                                           │
└──────────┴──────────────────────────────────────────┘
```

## Implementation Steps

1. **Install dependencies** (requires the local Verdaccio registry with `@op/*@0.0.1-ng15` published — see repo `docs/fixtures/VERDACCIO.md`)
   ```bash
   cd angular/apps/ng-15/rv-common-app
   npm install --legacy-peer-deps
   ```

2. **Serve locally**
   ```bash
   npm start        # → http://localhost:4400
   ```

3. **Build production**
   ```bash
   npm run build
   ```

## Dependencies

| Package               | Version    | Role                     |
|-----------------------|------------|--------------------------|
| `@angular/router`     | ^15.2.0    | Lazy-loaded routing      |
| `@ngrx/store`         | ^15.4.0    | Root store for `@op/aggrid` feature slices |
| `@op/core-controls`   | 0.0.1-ng15 | Shared UI controls       |
| `@op/aggrid`          | 0.0.1-ng15 | `occ-aggrid` grid wrapper |
| `@op/dynamic`         | 0.0.1-ng15 | `dynamic-aggrid` metadata grid |
| `@ngx-translate/core` | ^14.0.0    | `translate` pipe used by grid templates |
| `primeicons`          | ^6.0.1     | Nav icons                |
| `primeng`             | ^15.4.1    | PrimeNG widgets (lara-light-blue theme) |

## ng-15 vs ng-17 differences

- **Builder**: Angular 15 uses the webpack `@angular-devkit/build-angular:browser` builder (not the ng-17 esbuild `application` builder). `angular.json` therefore uses `main`/`tsConfig`/`polyfills` + a `dev-server` with `browserTarget`.
- **Root store**: `@op/aggrid`'s ng-15 module registers NgRx feature slices but uses **no `@ngrx/effects`** — the AppModule imports `StoreModule.forRoot({})` only (the ng-17 build additionally pulled in `EffectsModule`).
- **`TranslateModule.forRoot()`** is required at the app root (same as ng-17) so `occ-aggrid`'s `translate` pipe resolves `TranslateService`.

## Module Federation (Future)

To evolve to true micro-frontends, add `@angular-architects/module-federation`:
1. `ng add @angular-architects/module-federation --project rv-common-app --type host`
2. Configure `webpack.config.js` with remotes pointing to product-app and target-app dev ports.
3. Replace the local feature modules with dynamic remote imports.

## Sidebar Navigation

- `Product` is **selected by default** (route `/product` is the default redirect).
- `routerLinkActive="sidebar__link--active"` highlights the active link automatically.
- `[routerLinkActiveOptions]="{ exact: true }"` is **not** set so child routes also highlight the parent.
