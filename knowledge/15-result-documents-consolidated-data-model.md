# Result Documents & Consolidated Data Model

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Result Documents & Consolidated Data Model** within the RippleView framework. Part of the **RippleView** documentation set.

## 10. Result Documents (MongoDB-shaped) & Multi-Tenant Separation

Every document carries a tenant identity. Separation is enforced by **path isolation** *and* **tag filtering**; aggregation stays possible when wanted.

```yaml
tenant:  { department: payments, framework: angular, frameworkVersion: "17" }
target:  { type: app, name: orders-app, version: "3.4.0" }
context: { runId, branch, trigger: "lib-gate|nightly|local", startedAt }
```

- **Path isolation:** `results/<dept>/<target>/runs/<runId>.json` — concurrent departments cannot collide.

- **Tag filtering:** the dashboard scans configured result roots and filters by any tenant field (department view vs. platform-wide view).

- The engine writes results **into the target app's results dir by default**; the dashboard is a separate reader that never runs tests.

### Collections (MVP = folders of JSON, shaped like Mongo documents)

```text
runs/          { _id, runId, tenant, target, summary{passed,failed,accepted,skipped} }
results/       { _id, runId, testId, component, type, tags[], status,
                 durationMs, failure{layer, message, diffRef, allureTraceRef},
                 issueSignature, acceptedBugRef }
acceptedBugs/  { _id, target, issueSignature, issueId, since, status }
registry/      { snapshot of the version graph at run time }
builds/        { _id, buildId, runId, target, candidate, trigger, branch, gitSha,
                 status, failureStage, durationMs, summary, logRef, allureRef }   // build/test history
scores/        { _id, target, lib, frameworkVersion, asOf, drift, confidence,
                 acceptedBugCount, threshold, flag }                              // drift/confidence time-series
```

Allure consumes `results/` for "navigate to failing step"; the dashboard consumes `runs/` + `acceptedBugs/` + `registry/` + `builds/` + `scores/`. *(`builds/` and `scores/` are defined in detail in [RippleView_DASHBOARD.md §3](RippleView_DASHBOARD.md).)*

---

## 3. Data model (existing + additions)

Existing collections (design §10): `runs/`, `results/`, `acceptedBugs/`, `registry/`.

**Additions required for the five views** (DELTA to design §10 — to be reflected there with permission):

```json
// builds/  — first-class build/run history (powers View 3 & trends)
{
  "_id", "buildId", "runId",
  "target": { "type":"app", "name":"orders-app", "version":"3.4.0" },
  "candidate": { "lib":"@op/data-grid", "version":"17.3.3-beta17.1" },  // null for nightly self-test
  "trigger": "lib-gate|nightly|local|pr",
  "branch", "gitSha",
  "status": "success | static-fail | build-fail | test-fail | error",
  "failureStage": "static|build|serve|test|null",
  "startedAt", "finishedAt", "durationMs",
  "summary": { "passed","failed","accepted","skipped" },
  "logRef", "allureRef"
}

// scores/  — time-series snapshot per (app × library) for trend lines (powers View 5 trends)
{
  "_id", "target", "lib", "frameworkVersion",
  "asOf",
  "drift": 0,                 // §8 formula
  "confidence": 0.0|null,     // §8 formula; null = never gated
  "acceptedBugCount": 0,
  "threshold": 5,
  "flag": "green|amber|red"
}
```

> 

Drift/confidence are **computed by the API** from `registry/` + the latest `builds/`+`results/`; `scores/` persists snapshots so the dashboard can show **trends**, not just current state.

---
