# RippleView Integration Guide

How to wire a project (libraries + consumer apps) into RippleView, publish to a local Verdaccio registry, and view the live dependency dashboard.

---

## The Mental Model

Three version numbers matter for every library:

```
┌──────────────────────────────────────────────────────────────┐
│  Library workspace      │  Published to      │  App           │
│  (what you're coding)   │  Verdaccio         │  consuming     │
│  core-controls 17.3.0   │  17.2.0 (last tag) │  17.1.0  ⚠️   │
└──────────────────────────────────────────────────────────────┘
        ↑                          ↑                   ↑
   package.json               npm publish           app's
   in your repo               to registry         package.json
```

The dashboard shows all three columns side by side. The drift between columns is the value — it tells you which apps are behind, by how much, and what would be affected by the next release.

---

## Prerequisites

| Requirement                      | Version                      |
| -------------------------------- | ---------------------------- |
| Docker Desktop                   | 4.x or later                 |
| Node.js                          | 20.x or later (see `.nvmrc`) |
| npm                              | 10.x or later                |
| Access to the `ripple-view` repo | clone + `npm ci`             |

---

## Phase 1 — Start Verdaccio in Docker

Verdaccio is a lightweight private npm registry. Your `@<scope>/*` packages publish here. Everything else (Angular, React, rxjs…) is proxied transparently to npmjs.

### 1.1 Start the container

The `docker/verdaccio/` directory in this repo has the config and compose file ready.

```bash
docker compose -f docker/verdaccio/docker-compose.yml up -d
```

This starts Verdaccio on **`http://localhost:4873`**.

### 1.2 Verify

Open `http://localhost:4873` in a browser. You should see the Verdaccio UI — empty at this point.

```bash
# Or from the terminal
curl -s http://localhost:4873 | grep -o "Verdaccio"
```

### 1.3 What Verdaccio does

- Packages you **publish** (your `@<scope>/*`) are stored locally in the container volume.
- Packages you **don't publish** (Angular, React, etc.) are proxied to npmjs transparently.
- The container persists packages across restarts via a Docker volume.

### 1.4 Stop / clean up

```bash
# Stop (keep data)
docker compose -f docker/verdaccio/docker-compose.yml stop

# Stop and delete all published packages
docker compose -f docker/verdaccio/docker-compose.yml down -v
```

---

## Phase 2 — Route Your npm Scope to Verdaccio

Tell npm: "for `@<scope>/*` packages, use localhost — everything else stays on npmjs."

### 2.1 Add `.npmrc` to your library workspace root

```ini
@<scope>:registry=http://localhost:4873
//localhost:4873/:_authToken="local"
```

Replace `<scope>` with your actual npm scope (e.g. `enterprise`, `myorg`).

### 2.2 Add the same `.npmrc` to each consumer app workspace root

Apps need to resolve `@<scope>/*` from the same place.

```ini
@<scope>:registry=http://localhost:4873
//localhost:4873/:_authToken="local"
```

> **Why a token?** Verdaccio requires one by default but accepts any non-empty string in local/dev mode. Set a real token when moving to a shared environment.

### 2.3 Verify the routing

```bash
npm ping --registry http://localhost:4873
# → Ping success: {}
```

---

## Phase 3 — Build and Publish Libraries to Verdaccio

Get your libraries' current versions into Verdaccio so apps can install them.

### 3.1 Build each library

Each library must be compiled (TypeScript → dist) before publishing.

```bash
# Example for a single library
cd angular/libraries/lib-ng17
npm run build
```

### 3.2 Publish to Verdaccio

```bash
# From the library's dist output (or the library root if package.json points to dist)
npm publish --registry http://localhost:4873
```

Repeat for every library you want tracked in the dashboard.

### 3.3 Verify in the UI

Refresh `http://localhost:4873` — your packages appear with their versions.

### 3.4 Publish all libraries at once (optional)

Use the helper script from this repo:

```bash
node scripts/publish-to-verdaccio.mjs
```

This discovers all packages matching your tracked scope and publishes them in dependency order.

---

## Phase 4 — Wire Consumer Apps to Verdaccio

With `.npmrc` in place, running `npm install` in an app pulls your `@<scope>/*` packages from Verdaccio automatically.

### 4.1 Ensure library deps are declared in app `package.json`

```json
{
  "dependencies": {
    "@enterprise/core-controls": "17.2.0",
    "@enterprise/data-grid": "17.2.0"
  }
}
```

> **Pin exact versions** (no `^` or `~`). The whole point of the dashboard is to track exactly what each app is consuming — ranges make that ambiguous.

### 4.2 Install

```bash
cd angular/apps/ng-17/admin-app
npm install
```

npm resolves `@enterprise/*` from Verdaccio and everything else from npmjs.

### 4.3 Confirm the source

```bash
npm ls @enterprise/core-controls
# → admin-app@0.0.0
# └── @enterprise/core-controls@17.2.0  ← from Verdaccio
```

---

## Phase 5 — Add RippleView Configuration

Two files. That's all that's needed for registry + dashboard.

### 5.1 `rippleview.workspace.yaml` — at your project root

This is the only required file. It tells `rv` which scopes are your libraries, where to find them, and where Verdaccio is.

```yaml
# rippleview.workspace.yaml

# npm scope(s) that belong to your org.
# The scanner identifies anything matching these as a "library".
trackedScopes:
  - '@enterprise' # adjust to your actual scope

# Glob patterns that locate library package.json files.
libraries:
  - 'angular/libraries/**/projects/*/package.json'
  - 'react/libraries/**/package.json'

# Glob patterns that locate app package.json files.
# Apps are packages that depend on trackedScopes but aren't in them.
apps:
  - 'angular/apps/**/package.json'
  - 'react/apps/**/package.json'

# Local Verdaccio — used to compare workspace version vs. published version.
registry:
  url: 'http://localhost:4873'
```

### 5.2 Add `rv` scripts to your root `package.json`

```json
{
  "scripts": {
    "rv:scan": "rv registry-scan --config rippleview.workspace.yaml --output registry.json",
    "rv:dashboard": "rv dashboard --input registry.json"
  }
}
```

### 5.3 `rippleview.config.yaml` — per app (add later, not needed for dashboard)

This file is only required when you want to run **visual or functional tests** against an app (it declares `baseUrl`, auth hook, seed hook, etc.).

```yaml
# apps/<app-name>/rippleview.config.yaml  — add when ready for testing
app: admin-app
department: payments # dashboard label only
baseUrl: 'http://admin-app:8080' # production build behind nginx (G9)
hooks:
  auth: './hooks/auth.ts'
  seed: './hooks/seed.ts'
  teardown: './hooks/teardown.ts'
```

Skip this for now. Come back to it when you're ready to run tests.

---

## Phase 6 — Generate the Registry and Open the Dashboard

### 6.1 Scan

```bash
npm run rv:scan
```

The scanner:

1. Finds all library `package.json` files matching your patterns
2. Reads each library's name and version from the file (workspace version)
3. Queries Verdaccio for the latest published version of each
4. Finds all app `package.json` files
5. For each app, records which `@enterprise/*` packages it declares and at what version
6. Writes `registry.json`

### 6.2 Open the dashboard

```bash
npm run rv:dashboard
# → Dashboard running at http://localhost:9999
```

### 6.3 What you see

**Library view**

```
Package                          Workspace  Published  admin-app    billing-app  react-orders
────────────────────────────────────────────────────────────────────────────────────────────
@enterprise/core-controls        17.3.0     17.2.0     17.2.0 ✓     17.1.0 ⚠️    —
@enterprise/data-grid            17.2.0     17.2.0     17.2.0 ✓     17.2.0 ✓     —
@enterprise/react-core-controls  19.3.0     19.2.0     —            —            19.0.0 ⚠️
```

**App view**

```
App           Library                          App consuming  Published  Gap
────────────────────────────────────────────────────────────────────────────────
admin-app     @enterprise/core-controls        17.2.0         17.2.0     up to date ✓
              @enterprise/data-grid            17.2.0         17.2.0     up to date ✓
billing-app   @enterprise/core-controls        17.1.0         17.2.0     1 minor ⚠️
react-orders  @enterprise/react-core-controls  19.0.0         19.2.0     2 patches ⚠️
```

---

## Phase 7 — Demo the Drift

This is the core value of the dashboard. Here's the sequence to demonstrate it:

### 7.1 Bump a library version

In `@enterprise/core-controls/package.json`, change `17.2.0` → `17.3.0`.

### 7.2 Build and publish

```bash
cd angular/libraries/lib-ng17
npm run build
npm publish --registry http://localhost:4873
```

Verdaccio now has `@enterprise/core-controls@17.3.0`.

### 7.3 Leave apps untouched

Apps still declare `@enterprise/core-controls: "17.2.0"` — don't change them.

### 7.4 Re-scan

```bash
npm run rv:scan
```

### 7.5 Refresh the dashboard

`admin-app` now shows **1 minor behind** (17.2.0 vs published 17.3.0). `billing-app` shows **2 minors behind** (17.1.0 vs 17.3.0).

### 7.6 Run impact analysis

```bash
rv registry-impact-select --library @enterprise/core-controls
```

Output: every app that depends on `core-controls`, what version they're on, and what they'd need to update to. Use this before a release to know the blast radius.

---

## Summary — What You Add to a Consumer Project

| File                               | Location            | Required for dashboard | Required for testing |
| ---------------------------------- | ------------------- | ---------------------- | -------------------- |
| `.npmrc`                           | workspace root      | ✓                      | ✓                    |
| `.npmrc`                           | each app root       | ✓                      | ✓                    |
| `rippleview.workspace.yaml`        | workspace root      | ✓                      | ✓                    |
| `rv:scan` + `rv:dashboard` scripts | root `package.json` | ✓                      | ✓                    |
| `rippleview.config.yaml`           | each app            | —                      | ✓                    |
| Auth / seed hooks                  | each app            | —                      | ✓                    |

**Three files and two scripts** to go from zero to a live dashboard. The testing layer (`rippleview.config.yaml`, hooks) is entirely additive — add it app by app when you're ready to run visual and functional tests.

---

## Troubleshooting

### `npm publish` fails with E401

Verdaccio requires authentication even in local mode. Make sure your `.npmrc` has the `_authToken` line.

```ini
//localhost:4873/:_authToken="local"
```

### Package not found after publish

Check the scope routing. Your `.npmrc` must have:

```ini
@<scope>:registry=http://localhost:4873
```

Without this line, `npm install @<scope>/pkg` goes to npmjs (and fails, since it's not there).

### Dashboard shows no libraries

Check that your `trackedScopes` in `rippleview.workspace.yaml` exactly matches the scope in your library `package.json` names. The scope is the part before the `/` in `@enterprise/core-controls`.

### Verdaccio container loses packages after restart

The `docker-compose.yml` mounts a named volume. If you ran `docker compose down -v`, the volume was deleted. Re-publish your libraries.

---

## See Also

- [HOW-IT-WORKS.md](HOW-IT-WORKS.md) — engine architecture and design decisions
- [CONTRIBUTING.md](CONTRIBUTING.md) — development workflow for this repo
- [RELEASING.md](RELEASING.md) — how library versions are bumped and published to Nexus (production)
- [CI.md](CI.md) — Jenkins pipeline stages
