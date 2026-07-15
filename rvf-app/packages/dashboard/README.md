# @rippleview/dashboard

Read-only web dashboard for the RippleView framework. Visualises library version drift, ship readiness, build history, and app health across your entire fleet of consumer apps.

---

## Quick start

### Prerequisites — build and link the CLI

The `rv` CLI must be built before running any command below. From the `ripple-view` repo root:

```cmd
npm install
npm run build
npm link --workspace=packages/cli
```

> **Windows (Command Prompt / PowerShell):** use `rv.cmd` instead of `rv`. PowerShell has a built-in alias `rv` for `Remove-Variable` that shadows the linked binary. `rv.cmd` bypasses it. All examples below use `rv.cmd`. On macOS/Linux use plain `rv`.

---

### Step 1 — Start the dashboard

Open a terminal and start the server. It will keep running until you press `Ctrl+C`.

```cmd
rv.cmd dashboard
# Dashboard running at http://localhost:9999
```

Open **http://localhost:9999** in a browser. You will see an empty Fleet view with onboarding instructions. Leave this terminal open.

---

### Step 2 — Register workspaces

In a **separate terminal**, point `rv.cmd registry register` at a `rippleview.workspace.yaml` file. The command scans the workspace and pushes its data to the running dashboard. The browser updates live.

```cmd
rv.cmd registry register --workspace C:\path\to\rippleview.workspace.yaml
# Registered 2 channel(s) to http://localhost:9999/api/register
```

---

## Before you register: understanding `rippleview.workspace.yaml`

Every workspace that participates in fleet tracking needs a `rippleview.workspace.yaml` file. This file tells the `rv` CLI:

- Which `@op/*` library package names to track
- A human-readable name for this workspace (shown in logs)

The scanner reads this file for its tracking list, then walks all `package.json` files under the workspace root in two passes:

| Pass          | What it looks for                                                   | What it records                                         |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| 1 — Libraries | A `package.json` whose `name` **is** one of the tracked packages    | Records that version as the **latest** for that library |
| 2 — Consumers | A `package.json` whose `dependencies` **contain** a tracked package | Records that app and the version it has pinned          |

Framework and generation are auto-detected from `@angular/core` or `react` peer/runtime dependencies — you do not declare them manually.

### Field reference

```yaml
version: '1'
# Required. Always "1" for now. Used for future schema migration.

name: my-workspace-name
# Required. A short identifier — used in CLI log output.
# Use kebab-case. Examples: "ng15-libraries", "orders-app-ng17", "shared-platform"

packages:
  - '@op/core-controls'
  - '@op/data-grid'
  - '@op/shared'
# Required. The list of @op/* library package names this workspace tracks.
# THIS IS THE KEY FIELD. Rules:
#   - Every library workspace and every consumer app that wants to appear
#     in the same Fleet view must use the same package names here.
#   - Only packages listed here are tracked. If an app depends on a package
#     that is NOT in this list, that dependency is invisible to the scanner.
#   - The names must exactly match the "name" field in each library's package.json.

settings:
  strict: false
# Optional. When true, the CLI rejects unknown config fields.
# Set to false (or omit) while iterating; set to true once the config is stable.
```

**Fields you do NOT need to configure for the dashboard:**

- `bundleStore` — used only by `rv bundle` (bundle storage). Ignore for dashboard use.
- The `registry:` block seen in some example files (trackedPackages, consumerRepos, libraryRepos) is **not yet schema-validated** and is not used by the current scanner. The `packages:` array above is what the scanner actually reads.

---

## Two onboarding scenarios

### Scenario 1 — Libraries and apps in the same repo (ng-15 pattern)

**When to use:** All of the following are in one repo or cloned to one machine:

- The library source (`@op/core-controls`, `@op/data-grid`, etc.)
- Playground apps (apps that ship with the library for development/demo)
- Consumer apps (apps that install and use the library)

**One workspace YAML at the repo root:**

```yaml
# rippleview.workspace.yaml — place at the repo root
version: '1'
name: ng15-workspace

packages:
  - '@op/core-controls'
  - '@op/data-grid'
  - '@op/shared'
# List every @op/* library that lives in or is consumed by this repo.
```

**One register command covers everything:**

```cmd
rv.cmd registry register --workspace C:\repos\ng15-repo\rippleview.workspace.yaml
```

The scanner walks from `C:\repos\ng15-repo\`, finds the library `package.json` files (latest versions) and all consumer app `package.json` files (pinned versions) in a single pass. The dashboard shows one Angular ng15 channel table with all libraries as columns and all apps as rows.

**ripple-view-examples example** (ng-15, ng-17, React 19 all in one repo):

```cmd
rv.cmd registry register --workspace C:\dev\code\ripple-view-examples\rippleview.workspace.yaml
# Registered 3 channel(s) — Angular ng15, Angular ng17, React 19 all at once
```

---

### Scenario 2 — Libraries and apps in separate repos (ng-17 pattern)

**When to use:** The library team owns one repo; each consumer app team owns their own repo. They are in different directories and may be maintained by different people.

This scenario has **two separate registrations**. They can happen in any order and at any time — the dashboard merges them live.

#### Registration A — Library team (libraries + playground apps)

The library repo contains the library source and any playground/demo apps that ship with it.

**Workspace YAML in the library repo root:**

```yaml
# rippleview.workspace.yaml — in the library repo root
version: '1'
name: ng17-libraries

packages:
  - '@op/core-controls'
  - '@op/data-grid'
# List every library published from this repo.
# Playground apps inside this same repo that depend on these packages
# will be detected automatically as consumers — no extra config needed.
```

**Register once (library team runs this):**

```cmd
rv.cmd registry register --workspace C:\repos\ng17-libs\rippleview.workspace.yaml
```

This posts to the dashboard: the `latest` version for each library, plus any playground app rows. The dashboard shows the Angular ng17 channel with correct latest versions. Consumer app columns show `—` until consumer apps register.

#### Registration B — Consumer app teams (each app registers itself)

Each consumer app team creates their own `rippleview.workspace.yaml` in their repo root. **The `packages:` list must be identical to the library workspace** — this is how the scanner knows which dependencies to track.

```yaml
# rippleview.workspace.yaml — in the consumer app repo root
version: '1'
name: orders-app-ng17
# Use the app name or team name — just needs to be unique and readable.

packages:
  - '@op/core-controls'
  - '@op/data-grid'
# MUST match the library workspace's packages list exactly.
# The scanner looks for these package names in this app's dependencies.
```

**Register (each consumer app team runs this):**

```cmd
rv.cmd registry register --workspace C:\repos\orders-app\rippleview.workspace.yaml
```

This posts the consumer data for that app. The dashboard merges it with the existing library data — the `orders-app` row appears in the Angular ng17 table with its drift badge. No server restart. No other apps are affected.

**Multiple apps register independently:**

```cmd
rem orders-app team
rv.cmd registry register --workspace C:\repos\orders-app\rippleview.workspace.yaml

rem billing-app team
rv.cmd registry register --workspace C:\repos\billing-app\rippleview.workspace.yaml

rem admin-app team
rv.cmd registry register --workspace C:\repos\admin-app\rippleview.workspace.yaml
```

Each call adds one more row to the Fleet view. Teams can register in any order and at any time.

> **Order does not matter.** The dashboard accumulates registrations additively.
> Library latest + consumer data are merged correctly regardless of which arrives first.

#### Scenario 2 with `--root` (alternative: one command, multiple directories)

If all repos are cloned on the same machine you can scan everything in one pass using `--root` flags instead of two registrations:

```cmd
rv.cmd registry register ^
  --workspace C:\repos\ng17-libs\rippleview.workspace.yaml ^
  --root C:\repos\ng17-libs ^
  --root C:\repos\orders-app ^
  --root C:\repos\billing-app ^
  --root C:\repos\admin-app
```

This has the same result as registering them separately, but in one command. Useful for local development or a nightly CI job that has access to all repos.

---

### Onboarding walkthrough — both scenarios together

```
Terminal 1:                           Terminal 2 (separate):
rv.cmd dashboard                      (dashboard empty)

                                      rem === Scenario 1: ng-15 (same repo) ===
                                      rv.cmd registry register --workspace ng15-repo\rippleview.workspace.yaml
                                      → Angular ng15 channel appears (libraries + all apps)

                                      rem === Scenario 2: ng-17 (separate repos) ===
                                      rem Step A: library team registers
                                      rv.cmd registry register --workspace ng17-libs\rippleview.workspace.yaml
                                      → Angular ng17 channel appears (libraries + playground apps, no consumer rows yet)

                                      rem Step B: each consumer app team registers
                                      rv.cmd registry register --workspace orders-app\rippleview.workspace.yaml
                                      → orders-app row added to ng17 table

                                      rv.cmd registry register --workspace billing-app\rippleview.workspace.yaml
                                      → billing-app row added to ng17 table
```

The browser updates live after each command. No restarts.

---

### Common mistakes

| Mistake                                                          | Symptom                                                    | Fix                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `packages:` list in consumer app doesn't match library workspace | App's dependencies are not tracked — app row never appears | Make both `packages:` lists identical                                |
| Library workspace not registered yet                             | App rows appear but `latest` column shows empty            | Register the library workspace first (or at any time — it merges in) |
| Wrong path in `--workspace`                                      | `Failed to load workspace config` error                    | Use an absolute path; check the file exists                          |
| Dashboard not running                                            | `Cannot reach dashboard` error                             | Start `rv.cmd dashboard` first in another terminal                   |
| Using `rv` instead of `rv.cmd` on Windows                        | PowerShell: variable not found error                       | Use `rv.cmd` in Command Prompt or PowerShell                         |

---

### `rv.cmd dashboard` options

| Flag              | Default  | Description                                                           |
| ----------------- | -------- | --------------------------------------------------------------------- |
| `--input <path>`  | _(none)_ | Seed the store from an existing `registry.json` on startup (optional) |
| `--port <number>` | `9999`   | Port the server listens on                                            |

### `rv.cmd registry register` options

| Flag                 | Default                    | Description                                                       |
| -------------------- | -------------------------- | ----------------------------------------------------------------- |
| `--workspace <path>` | _(required)_               | Path to `rippleview.workspace.yaml`                               |
| `--target <url>`     | `http://localhost:9999`    | Dashboard URL to register with                                    |
| `--root <dir>`       | workspace file's directory | Additional repo root to scan (repeatable; use for separate repos) |

---

## What you see

### Fleet view (View 1)

A matrix table with **one section per generation channel**. All channels from all registered workspaces appear in a single dashboard — no separate dashboards per framework or team.

```
Angular ng15
┌──────────────┬──────────────────────┬────────────────┐
│ App          │ @op/core-controls    │ @op/data-grid  │
├──────────────┼──────────────────────┼────────────────┤
│ orders-app   │ 🟢 current           │ 🟢 current     │
│ billing-app  │ 🟡 minor             │ 🟢 current     │
└──────────────┴──────────────────────┴────────────────┘

Angular ng17
┌──────────────┬──────────────────────┬────────────────┐
│ App          │ @op/core-controls    │ @op/data-grid  │
├──────────────┼──────────────────────┼────────────────┤
│ orders-app   │ 🟢 current           │ 🔴 major       │
│ admin-app    │ 🟡 minor             │ 🟢 current     │
└──────────────┴──────────────────────┴────────────────┘

React 19
┌──────────────┬──────────────────────────┐
│ App          │ @op/react-core-controls  │
├──────────────┼──────────────────────────┤
│ orders-app   │ 🟡 minor                 │
│ settings-app │ 🟢 current               │
└──────────────┴──────────────────────────┘
```

- **🟢 current** — app is on the latest published version
- **🟡 minor** — app is one or more minor/patch versions behind
- **🔴 major** — app is one or more major versions behind
- **—** — app does not consume this library

Use the **Channel** dropdown to filter to a single generation.

---

## Package contents

```
packages/dashboard/
├── src/
│   ├── types.ts                     Fleet API response types
│   ├── drift.ts                     Channel-aware semver drift computation
│   ├── registry/
│   │   └── RegistryStore.ts         Live in-memory store (EventEmitter)
│   ├── ingest/
│   │   └── FileRegistrySource.ts    Reads registry.json (file adapter)
│   └── api/
│       ├── server.ts                Fastify server (createServer / startServer)
│       └── routes/
│           ├── fleet.ts             GET /api/fleet
│           ├── register.ts          POST /api/register
│           └── events.ts            GET /api/events (SSE)
└── ui/
    ├── index.html                   SPA entry
    ├── main.tsx                     React root
    ├── App.tsx                      Root component — SSE + empty state
    └── Fleet/
        ├── FleetView.tsx            Matrix table
        └── DriftBadge.tsx           🟢🟡🔴 drift badge
```

---

## API

### `GET /api/fleet`

Returns the full fleet matrix, grouped by framework and generation channel.

**Response shape**

```ts
interface FleetResponse {
  channels: FleetChannel[];
}
interface FleetChannel {
  framework: string; // "angular"
  generation: string; // "17"
  label: string; // "Angular ng17"
  libraries: string[]; // sorted list of tracked @op/* libraries
  apps: FleetAppRow[];
}
interface FleetAppRow {
  appName: string;
  department: string;
  cells: FleetCell[]; // one per library, same order as FleetChannel.libraries
}
interface FleetCell {
  library: string;
  consumed: string | null; // null = app does not consume this library
  latest: string;
  drift: DriftInfo;
}
interface DriftInfo {
  badge: 'current' | 'minor' | 'major' | 'none';
  majorsBehind: number;
  minorsBehind: number;
  patchesBehind: number;
}
```

### `POST /api/register`

Accepts a `RegistryDocument` payload and merges it into the live store. Called by `rv.cmd registry register`. Consumers and latest versions from separate registrations are combined — no data from previous registrations is overwritten.

### `GET /api/events`

Server-Sent Events stream. Emits `{"type":"registry-updated"}` whenever a registration changes the store. The SPA subscribes to this and re-fetches `/api/fleet` on each event.

---

## Development

### Run the API and SPA separately (hot-reload)

```bash
# Terminal 1 — API (tsup watch)
npm run dev:api --workspace=packages/dashboard

# Terminal 2 — Vite dev server (proxies /api/* to localhost:9999)
npm run dev:ui --workspace=packages/dashboard
# → open http://localhost:5173
```

### Build

```bash
npm run build --workspace=packages/dashboard
# tsup (API → dist/) then vite build (SPA → dist/ui/)
```

### Test

```bash
npm test --workspace=packages/dashboard
```

---

## Architecture

```
rv.cmd registry register
        │
        │  POST /api/register  (RegistryDocument)
        ▼
  RegistryStore (in-memory, EventEmitter)
        │
        ├──► GET /api/fleet  ──► React SPA Fleet view
        │
        └──► GET /api/events (SSE) ──► browser re-fetches on change
```

The Fastify server owns the live registry store. The store starts empty; registrations accumulate. In a future nightly-job setup, `rv.cmd registry register` would be called on a schedule against each configured repo — the command and the store API stay exactly the same.

---

## Views roadmap

| View                         | Story   | Status             |
| ---------------------------- | ------- | ------------------ |
| 1 — Fleet (version tracking) | US-12.2 | ✅ Implemented     |
| 2 — Ship readiness           | US-12.3 | Planned (Sprint 4) |
| 3 — Build history            | US-12.3 | Planned (Sprint 4) |
| 4 — Issue-tracker issues     | US-12.3 | Planned (Sprint 4) |
| 5 — Confidence & danger      | US-12.3 | Planned (Sprint 4) |

See [knowledge/14-dashboard.md](../../rippleview-starter/rippleview-starter/knowledge/14-dashboard.md) for the full design.
