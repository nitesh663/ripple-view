# rv-common-app — Implementation Guide

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

1. **Install dependencies**
   ```bash
   cd angular/apps/ng-17/rv-common-app
   npm install
   ```

2. **Serve locally**
   ```bash
   npm start        # → http://localhost:4300
   ```

3. **Build production**
   ```bash
   npm run build
   ```

## Dependencies

| Package               | Version  | Role                     |
|-----------------------|----------|--------------------------|
| `@angular/router`     | ^17.3.0  | Lazy-loaded routing      |
| `@op/core-controls`   | 0.0.1-ng17 | Shared UI controls     |
| `primeicons`          | ^7.0.0   | Nav icons                |
| `primeng`             | ^17.x    | Optional PrimeNG widgets |

## Module Federation (Future)

To evolve to true micro-frontends, add `@angular-architects/module-federation`:
1. `ng add @angular-architects/module-federation --project rv-common-app --type host`
2. Configure `webpack.config.js` with remotes pointing to product-app and target-app dev ports.
3. Replace the local feature modules with dynamic remote imports.

## Sidebar Navigation

- `Product` is **selected by default** (route `/product` is the default redirect).
- `routerLinkActive="sidebar__link--active"` highlights the active link automatically.
- `[routerLinkActiveOptions]="{ exact: true }"` is **not** set so child routes also highlight the parent.
