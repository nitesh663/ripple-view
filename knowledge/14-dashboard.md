# Dashboard

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Dashboard** within the RippleView framework. Part of the **RippleView** documentation set.

## 12. Plane 4 — Dashboard

Standalone read-only reader (`@rippleview/dashboard`) over the result documents + registry. **Full implementation design: [RippleView_DASHBOARD.md](RippleView_DASHBOARD.md)** (data model, API, tech, wireframe). Five capabilities:

1. **Version tracking (Fleet)** — every app × library: consumed version, generation channel (`-ng17`/`-ng15`), latest-in-channel, drift score, "ungated beta" flags, accepted-bug count with amber/red threshold flags. Each `@op/*` library carries its own independent semver line, so versions are tracked per-library, not as one global component version.

2. **Ship readiness** — per candidate, an explicit Ship / Caution / Blocked verdict + per-consumer confidence and reasons (ship rule in [RippleView_DASHBOARD.md §4](RippleView_DASHBOARD.md)).

3. **Build failures & history** — build/test history with failure stage and success-rate trends (`builds/`).

4. **Issue-Tracker Issues** — accepted bugs per app with issue links and threshold status (`acceptedBugs/`).

5. **Confidence & danger** — confidence scores and a danger-ranked list of apps needing action, with the specific reason each (`scores/`).

Drill-down: Fleet → app detail → run report → Allure forensic trace.

---

## 1. What the dashboard must answer (the five capabilities)

1. **Version tracking** — one place to see every `@op/*` library and consumer app and the versions they use, segmented by Angular generation channel (`-ng15`/`-ng17`).

2. **Ship readiness** — is a candidate change safe to ship?

3. **Build failures & history** — track build/test failures over time.

4. **Issue-Tracker Issues** — issues opened for failing apps and their status.

5. **Confidence & danger** — confidence scores; which apps are in danger / near or at threshold.

The dashboard is a **read-only reader** (`@rippleview/dashboard`). It never runs tests; it ingests the documents the runner/scanner produce.

---

## 2. Tech stack & architecture

```text
   .rv/ JSON files (PoC)  ──┐
   MongoDB + S3 (prod)     ───┤→  [ Ingest adapter ]  (ResultStore / RegistrySource)
                              │
                              ▼
                    [ Dashboard API ]   Node + Fastify/NestJS, reuses @rippleview/core TS types
                    REST/JSON endpoints (§5)
                              │
                              ▼
                    [ Dashboard SPA ]   React + Vite (or Angular) — tables, badges, charts
                    (Allure links open the forensic report)
```

- **API:** thin Node service that reads documents via the same `ResultStore`/`RegistrySource` interfaces used in the engine — files in PoC, Mongo/S3 in prod (a config swap, not a rewrite).

- **SPA:** any framework; recommend React+Vite for speed (Angular to dogfood). Shares result/registry TypeScript types from `@rippleview/core` so schemas can't drift.

- **No business logic in the SPA** — all scoring/aggregation happens in the API (and is the same code the gate uses), so the dashboard and the gate always agree.

---

## 4. The five views — data → computation → UI

### View 1 · Version Tracking (Fleet) — *one-place view*

- **Source:** `registry/`.

- **Compute:** per (app × library) within its generation channel → parse the suffix channel (`-ng17`/`-ng15`) BEFORE computing majors/minors/patches behind, so drift is measured against the latest in the *same* channel; `generationsBehind` if a newer generation channel exists for that library. Each `@op/*` library is scored on its own independent semver line.

- **UI:** matrix table — rows = apps, columns = `@op/*` libraries, grouped by generation channel (`-ng15`/`-ng17`). Each cell: consumed version · latest-in-channel · channel-aware drift badge (🟢 current / 🟡 minor-behind / 🔴 major+ or generations behind). Filters: generation channel, department, app, library. Click cell → app-detail drill-down.

### View 2 · Ship Readiness — *can this change ship?*

- **Source:** latest `builds/` + `results/` for the candidate across all impacted apps; `acceptedBugs/`.

- **Ship decision rule (explicit):**
  `SHIP-ALLOWED  iff  for every impacted consumer:
      buildGate == pass
      AND no NEW (non-accepted) failures
      AND acceptedBugCount < threshold        (no consumer at red)
      AND confidence >= minConfidence          (configurable, default 95%)
  SHIP-WITH-CAUTION  iff  only accepted (issue-tracked) failures remain
  BLOCKED            otherwise  (list the blocking apps + reasons)`

- **UI:** per candidate `lib@version`, a readiness card: overall verdict (Ship / Caution / Blocked), aggregate confidence %, and a per-consumer row (pass / accepted / fail, confidence, reason). Blocking reasons listed explicitly.

### View 3 · Build Failures & History

- **Source:** `builds/`.

- **Compute:** success-rate over time; group by `failureStage`.

- **UI:** history table/timeline per app or per candidate — status, failureStage, duration, trigger, gitSha, links to log + Allure. A success-rate trend chart and a "recent failures" panel. Filters: target, status, date range.

### View 4 · Issue-Tracker Issues for Failing Apps

- **Source:** `acceptedBugs/` (+ `results/` with `acceptedBugRef`).

- **UI:** per app, a list of active accepted bugs — issue id (deep link), `issueSignature`, since-version, status, age — with the count shown against the threshold. "Recently filed" and "stale (open too long)" highlights.

### View 5 · Confidence & Danger — *who needs to act?*

- **Source:** `scores/` (+ live compute).

- **Compute danger rank:** `risk = w1·thresholdProximity + w2·(1−confidence) + w3·driftNormalized`; flag 🔴 if `acceptedBugCount ≥ threshold` (bypass disabled) or confidence below a floor, 🟡 if near threshold.

- **UI:** "Apps in danger" ranked panel — each row states the **specific reason**: e.g. *"orders-app (-ng17): 4/5 accepted bugs (1 from lockout) · confidence 62% · 2 majors behind in channel."* Confidence/drift sparklines for trend. This is the action list.

---

## 5. API surface (read-only)

``

``

``

``

``

``

``

| Endpoint | Powers | Returns |
| --- | --- | --- |
| GET /fleet?channel=&department= | View 1 | apps × libraries matrix (grouped by generation channel) + channel-aware drift badges |
| GET /readiness/:lib/:version | View 2 | verdict + per-consumer confidence + reasons |
| GET /builds?target=&status=&from=&to= | View 3 | build history + success-rate |
| GET /issues?target= | View 4 | accepted bugs + issue links + threshold status |
| GET /risk | View 5 | danger-ranked apps + reasons + trends |
| GET /apps/:name | drill-down | app detail: versions, latest runs, issues, scores |
| GET /runs/:runId | drill-down | run report (links to Allure trace) |

All endpoints are pure reads over the documents; computations are shared with the gate engine.

---

## 6. Landing layout (wireframe)

```text
┌───────────────────────────────────────────────────────────────────────┐
│ RippleView Dashboard            [channel ▾] [department ▾]        🟢12 🟡4 🔴2 │
├───────────────────────────┬───────────────────────────────────────────┤
│  APPS IN DANGER (View 5)   │  FLEET — version tracking (View 1)         │
│  🔴 orders-app  4/5 · 62%  │  -ng17   app\lib  data-grid core-controls  │
│  🟡 billing-app 3/5 · 88%  │          orders   🟡17.6     🔴17.0         │
│                            │  -ng15   app\lib  data-grid core-controls  │
│                            │          billing  🟢15.9     🟢15.1         │
├───────────────────────────┼───────────────────────────────────────────┤
│  SHIP READINESS (View 2)   │  RECENT BUILDS (View 3)                    │
│  @op/data-grid@17.3.3-beta17.1 │  orders  ✗ build-fail  2m ago [log][trace]│
│  ► BLOCKED: orders (build) │  billing ✓ success     5m ago              │
│            billing ✓ 98%   │  admin   ✓ accepted×1  9m ago  ISSUE-1234   │
└───────────────────────────┴───────────────────────────────────────────┘
       click any row → app detail → run report → Allure forensic trace
```

---

## 7. PoC ↔ Production profile (dashboard)

``

``

``

| Concern | Local PoC | Production |
| --- | --- | --- |
| Data source | .rv/ JSON files (file-scan) | MongoDB + S3 |
| Filters | generation channel / department / app / library | same |
| API | Node/Fastify reading files | same API, Mongo/S3 adapters |
| SPA | Vite dev server localhost | built + deployed |
| Auth | none | SSO/OIDC + RBAC (§17.7) |
| Trends | computed on read | scores/ time-series + metrics export |

The PoC dashboard is the same code; only the ingest adapter and auth change for production.

---

## 8. Build order (stories will map to these)

1. API skeleton + file-based ingest adapter + shared types.

2. `builds/` + `scores/` writers wired into the runner/gate.

3. View 1 (Fleet) — highest standalone value (works from registry alone).

4. View 3 (Builds) + View 4 (Issue-Tracker) — straight reads.

5. View 2 (Readiness) + the explicit ship rule.

6. View 5 (Danger) + trends.

7. Prod adapters (Mongo/S3) + SSO/RBAC.
