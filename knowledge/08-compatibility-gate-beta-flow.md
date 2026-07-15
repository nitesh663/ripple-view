# Compatibility Gate & Beta Flow

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Compatibility Gate & Beta Flow** within the RippleView framework. Part of the **RippleView** documentation set.

### 2.1 The validation gate sequence (cheapest → most expensive, early-exit)

```text
            ┌──────────────────────────────────────────────────────────────┐
  PR /      │  LAYER 0  Static Standards Gate                               │
  Library   │           tokens · ::ng-deep · API/contract · a11y lint       │  no build, no browser
  change    ├──────────────────────────────────────────────────────────────┤
            │  BUILD    Compile each impacted consumer against candidate     │  build-time breakage
            ├──────────────────────────────────────────────────────────────┤
            │  LAYER 1  Structural diff (DOM JSON)                           │
            │  LAYER 2  Computed-style diff (CSSOM → rgba)                   │  fast, deterministic
            │  LAYER 3  Geometry & overflow                                  │
            ├──────────────────────────────────────────────────────────────┤
            │  FUNCTIONAL  Semantic BDD (A11y locators, network-aware)       │  behavior
            │  + WCAG (axe) + Web Vitals budgets                            │
            ├──────────────────────────────────────────────────────────────┤
            │  LAYER 4  Pixel / SSIM (Dockerized)                            │  most expensive, last
            └──────────────────────────────────────────────────────────────┘
                         │  every stage writes tenant-tagged result documents
                         ▼
              Coverage · Drift · Confidence · Code Health  →  Dashboard
```

## 9. Plane 3 — Compatibility Gate + Beta Flow

```text
Library PR (changes @op/core-controls)
  │
  ├─ build + publish  @op/core-controls@14.3.0-beta17.1 → private registry
  │     (Verdaccio in PoC / Nexus in prod, via config; urgent consumers MAY pin
  │      the beta; dashboard flags "running ungated beta")
  ▼
[ Impact selector ]  registry → apps importing @op/core-controls → impacted set
  ▼  (isolated, disposable env per consumer)
  for each impacted app:                              # BACKWARD-COMPAT = new code vs OLD tests (Context 2)
    npm "overrides" → @op/core-controls 14.3.0-beta17.1   # NEW component code (package.json)
    npm install --legacy-peer-deps && npm run build       # if fail: confidence=0, report build break
    run @op/core-controls-tagged base tests AT THE APP'S CURRENT version (e.g. tests@14.2.15-ng17)
    run Module-1 visual crawler on pages using the component
  ▼
[ Verdict ]  green → promote beta→stable
             red   → dashboard report → dev decides bug vs intentional
                     · bug → fix component → beta17.2
                     · intentional → consumer adapts + issue annotation → rerun
```

> **Publish reality vs. the new value.** Publishing today is Jenkins on `master` running `npm publish ./dist/<lib> || true` per-lib to Nexus plus a changelog step — there is **no pre-publish gate** and no per-PR beta dist-tag. The compatibility gate above (build + run impacted consumers before a beta is promoted to stable) is the **net-new value** RippleView adds on top of that existing publish flow.

> 

Note: the candidate is one per-library `@op/<lib>` version (independent per-library semver, including its channel suffix); each consumer runs it against **its own** base-test version (a matrix), where the base-test package is versioned in lockstep to the specific `@op/<lib>` version it covers. The candidate's *new* base tests are exercised only when an app adopts the upgrade (Context 3, §6.1).

In the PoC, the gate runs against the **mirror example apps** in `rippleview-examples` (a few Angular libs + consumer apps mimicking the `@op/*` convention) — we do **not** touch `aos-libraries` or the real consumers. Because everything is config-driven (registry endpoint, `registry.json` entries, per-app configs), real adoption is "replace the examples with the real `@op/*` libraries and consumer apps" — no framework code change.

**Two-speed gate:**
- **PR-time:** npm `overrides` + `npm install --legacy-peer-deps` (fast), impacted apps only, `@op/<lib>`-tagged tests only.
- **Nightly / pre-publish promotion:** full published-beta install, full tag suite, full browser matrix.

**Beta escape hatch:** apps needing a change urgently can pin `beta.x` knowingly; the dashboard marks them "ungated beta" until the full gate passes and the version is promoted.

---

## 4. End-to-end quality-gate pipeline (Jenkins stages)

```text
 LIBRARY PR / merge ──▶ ① STATIC GATE (Layer 0)         fast lint; fail early
                        │
                        ▼
                       ② PUBLISH CANDIDATE              build lib → beta tag (Verdaccio in PoC /
                        │                                Nexus in prod, via .npmrc/config switch)
                        │                                + lockstep base-test package publish (§6.1)
                        ▼
                       ③ IMPACT SELECTION               registry → impacted apps + their current versions
                        │                                (dependency-graph, TurboSnap-style)
                        ▼
                  ┌─────④ FAN-OUT (parallel, per app)──────────────────────────┐
                  │   provision → build → serve → resolve tests → run → collect │  (§3.4 unit)
                  └────────────────────────────────────────────────────────────┘
                        │
                        ▼
                       ⑤ AGGREGATE                       per-app verdicts; bug-vs-intentional via
                        │                                 issue fingerprint + issue/threshold (§11)
                        ▼
                       ⑥ SCORE                           drift, upgrade-confidence %, coverage % (§8, §15)
                        │
                        ▼
                       ⑦ REPORT + GATE DECISION          Allure publish; dashboard/registry update;
                                                          SCM status check; Slack/PR comment;
                                                          green → allow promote beta→stable
                                                          red   → block + require issue annotation
```

The same machinery serves three triggers: **PR** (impacted apps, fast override channel), **nightly** (all apps, full matrix), **pre-publish promotion** (full matrix + browser matrix).

---
