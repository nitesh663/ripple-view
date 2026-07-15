# The Agnostic Engine & Configuration

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **The Agnostic Engine & Configuration** within the RippleView framework. Part of the **RippleView** documentation set.

## 5. Plane 1 — The Agnostic Engine (`@rippleview/core`)

The engine is a pure function of its inputs and writes tenant-tagged result documents. It imports nothing app-specific; everything tech-specific arrives via config + hooks.

```text
   INPUTS (data, not code)                     @rippleview/core
   ┌──────────────────────────┐      ┌────────────────────────────┐
   │ rippleview.config.yaml          │      │ YAML/feature parser         │
   │ *.yaml / *.feature tests  │ ───▶ │ → universal A11y step lib   │
   │ registry.json (path)      │      │ → Playwright execution      │
   │ baselines/                │      │ → 4-layer validation        │
   └──────────────────────────┘      │ → write result documents    │
                                      └────────────────────────────┘
                                                   │
                                                   ▼
                              results/<dept>/<target>/runs/<runId>.json
```

### 5.1 Config: one workspace config + one config per app

Config is split in two so global settings are not repeated and each app is self-describing. **There is one config per app** (co-located with its tests) — not a single config holding an array of apps.

**Workspace config (once, `RippleViewTests/rippleview.workspace.yaml`):**

```yaml
registryPath: ./registry/registry.json
resultsRoot: ./.rv/results
defaults: { browsers: [chromium], docker: true }
departments:                   # OPTIONAL — only a grouping label for dashboard separation;
  payments: { apps: [orders-app, billing-app] }   # omit entirely if unused
```

The npm registry the runner pulls `@op/*` libraries and base-test packages from is **config-driven, never hardcoded** — selected through a single `.npmrc`/config switch. The PoC default is a local **Verdaccio** registry; production points the same switch at the existing private **Sonatype Nexus** (`@op:registry`, repo `opnpmprivate`) — or any other registry — with **no framework code change**.

**Per-app config (`RippleViewTests/apps/<app>/rippleview.config.yaml`):**

```yaml
app:
  name: orders-app
  version: 3.4.0
  framework: { name: angular, version: "17" }   # Angular is the sole supported target for v1 (15 & 17); other frameworks are a future extension point
  department: payments          # OPTIONAL; omit → "default"
baseUrl: ${ORDERS_BASE_URL}     # injected at runtime, never hardcoded (NFR-SEC-01)
hooks:
  auth: ./hooks/auth.ts         # session hydration (ORC-05): returns cookies/JWT state
  seed: ./hooks/seed.ts         # API-first data seeding (ORC-03)
  teardown: ./hooks/teardown.ts
components:                      # which @op/* library components this app mounts + where
  - lib: datagrid               # in real adoption an @op/<lib>, e.g. @op/core-controls
    use: [smoke, sort]          # 'all' | list of tags
    mountedAt: { route: /orders, region: main }   # BDD-02 scoping
visualCrawler:
  enabled: true
  routes: ["/orders", "/orders/:id"]
  regions: ["main"]
```

- **`department`** is purely an optional grouping label for dashboard filtering/separation — not a functional input. Absent it, everything lands in a `default` department.

- The engine consumes `auth`/`seed`/`teardown` as opaque callbacks — the *only* coupling to a specific app, owned by the app.

- The base-test version for each `components[].lib` is **not** specified here; the runner resolves it per library from the exact `@op/<lib>` version that app consumes — including the generation-suffix channel (`-ng17`/`-ng15`/`-ag27`) — not from any single global "component version" (see §6.1).

This per-app `rippleview.config.yaml` is **additive**: it lives beside the Angular workspace's `angular.json` and never modifies it. In the PoC it describes the mirror example apps; in real adoption the same config simply points at the real `@op/*` libraries and consumer apps — the framework code is unchanged, only the config (registry endpoint, `registry.json` entries, per-app config) moves from example to real.
