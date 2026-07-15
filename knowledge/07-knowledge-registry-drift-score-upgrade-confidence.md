# Knowledge Registry, Drift Score & Upgrade Confidence

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Knowledge Registry, Drift Score & Upgrade Confidence** within the RippleView framework. Part of the **RippleView** documentation set.

## 7. Plane 2 — The Registry

Derived (not declared) by a scanner that reads every `package.json` across library and consumer repos, keyed on the `@op` scope, on-demand and via a nightly job. The scanner **skips non-npm / non-Angular repos** (e.g. a Java/Spring Gradle backend like `bookcreation`) — they have no `@op/*` dependencies to register. **Grouped framework-version-first**, where the framework version is read from the **generation-suffix channel** carried in each `@op/*` version string (`-ng17`, `-ng15`).

```json
{
  "angular": {
    "17": {
      "@op/core-controls": {
        "latest": "14.2.15-ng17",
        "consumers": { "trafficking-frontend-new": "14.2.15-ng17" }
      },
      "@op/theme": {
        "latest": "5.1.0-ng17",
        "consumers": { "trafficking-frontend-new": "4.2.0-ng17" }
      }
    },
    "15": {
      "@op/core-controls": {
        "latest": "14.2.15-ng15",
        "consumers": { "unifiedplanner": "14.2.15-ng15", "aos-target": "14.0.0-ng15" }
      }
    }
  },
  "react": { "...": {} }
}
```

Each **framework version is a distinct namespace** (mirrors a library's support branch per framework generation), and is identified by the generation-suffix channel on the version string — `-ng17` and `-ng15` are the channels live today (no `-ng21` yet). Drift is computed *within* a framework version; being on `angular/15` while `angular/17` exists is a separate "generations behind" signal. (`react` remains a future extension point only; Angular is the sole supported target.)

---

## 8. Drift Score & Upgrade Confidence

### Drift Score (per app × library; 0 = current, higher = worse), within a framework version

Each `@op/*` version string carries a **generation-suffix channel** (`-ng17`, `-ng15`, the ag-grid line `-ag27`/`-ag30`, or a prerelease such as `-beta17.x`). The scanner **parses and segments the channel off the semver core before any comparison** — `majorsBehind`/`minorsBehind`/`patchesBehind` are computed only against the semver core *within the same channel*. A channel mismatch (e.g. consumer on `-ng15`, latest on `-ng17`) is not counted as majors/minors behind; it surfaces as the separate `frameworkGenerationsBehind` signal below.

```text
core, channel  = parseVersion(version)        // split "-ng17"/"-ng15"/"-ag30"/"-beta17.x" from semver core
drift = 100·majorsBehind + 10·minorsBehind + 1·patchesBehind      // semver core, same channel only
        + ageFactor(days since the consumed version was released)
        + 500·frameworkGenerationsBehind       // channel mismatch (e.g. -ng15 vs -ng17)
```

### Upgrade Confidence % (requires an actual gate dry-run; not derivable from versions alone)

```text
confidence = (testsPassed + acceptedIssues) / totalImpactedTests
             × (1 − visualDriftSeverity)     // from the Module 1 crawler
             × buildGate                       // 0 if consumer won't compile against candidate, else 1
```

- Build failure against the candidate ⇒ confidence = 0 (the most common real upgrade failure — caught before a browser opens).

- Never gated ⇒ confidence = **Unknown**, not a number (forces a gate run to earn a %).

- Issue-accepted bugs count as "known & passing" so tracked intentional changes don't depress confidence.

---
