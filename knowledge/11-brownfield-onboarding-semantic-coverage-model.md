# Brownfield Onboarding & Semantic Coverage Model

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Brownfield Onboarding & Semantic Coverage Model** within the RippleView framework. Part of the **RippleView** documentation set.

## 15. Brownfield Onboarding & the Semantic Coverage Model

Greenfield apps adopt RippleView naturally. Mature, in-production, or dormant apps start at **zero UI automation tests** — today the `@op/*` libraries carry only unit tests (Karma/Jasmine), and all RippleView UI automation is net-new in `RippleViewTests`. They must be onboarded without a big-bang test-writing project. The strategy: a zero-effort safety net on day 1, a Sonar-style ratchet on changed code, and a prioritized backfill — all measured by a coverage model the crawler populates for free.

### 15.1 The reframe: coverage = *semantic surface*, not lines of code

RippleView's universe is the **semantic surface** (routes, interactive A11y nodes, component states, flows), and the Module 1 crawler **discovers that surface automatically with zero tests**. The discovered surface is the coverage **denominator** — so coverage is measurable without business documents.

Two independent coverage dimensions:
- **Visual Coverage** (Module 1, automatic): % of discovered surface captured in the baseline ledger. Cheap, broad, **needs no tests** — the zero-test safety net.
- **Functional Coverage** (Module 2, authored): % of discovered/contracted surface with behavioral assertions. Deep, business-meaningful, authored over time.

An app onboarded today can be ~80% *visually* covered instantly and 0% *functionally* covered. The dashboard shows both, separately.

### 15.2 Onboarding in three phases

**Phase 0 — Instant production baseline (day 1, zero authoring).**
Run the crawler against the live app and snapshot the current state as the **Golden Baseline** (characterization / approval testing: production is the accepted truth). Instant regression net — any future change that alters the structural/style/geometry/pixel surface is flagged. No business docs required; works for dormant apps (snapshot and freeze). In the PoC this is proven against the mirror apps in `rippleview-examples`; pointing it at the real `@op/*` consumer apps is a config change, not a framework change.

**Phase 1 — Ratchet on touched code ("Clean as You Code", à la SonarQube).**
Enforce mandatory functional tests only on **new or modified** semantic surface:
- Map the code diff → affected components/routes (registry + component↔route map; crawler confirms which states changed).
- **Quality Gate:** touched surface must meet `minFunctionalCoverage` (default 80%) **and** have a visual baseline; new code may not lower overall coverage.
- Untouched legacy is tracked, not blocked.

**Phase 2 — Prioritized backfill of existing code.**
Backlog ordered by blast radius and usage:
1. **Shared library components first** — base tests amortize across all consumers (highest leverage).
2. High-traffic routes (from analytics/RUM if available).
3. Recent-incident areas.
The crawler's *discovered-but-unasserted* surface is the backlog worklist.

### 15.3 Reverse-engineering tests when business docs are missing

1. **Crawler-derived flows** — the state graph's discovered transitions are candidate scenarios ("activate X → state Y appears").

2. **AI Author Agent** (dev-side, §13) — drives the route via MCP, observes A11y tree + interactions + network, and proposes Gherkin characterization scenarios for human blessing.

3. **Production telemetry / RUM** — real user paths prioritize what to reverse-engineer first.

4. **Characterization principle** — with no spec, the test asserts "behaves as production does today"; a later change that alters it triggers the same bug-vs-intentional verdict flow (§11).

### 15.4 Defining & measuring coverage ("what is 100%?")

Coverage = validated surface ÷ discovered-or-contracted surface, at four granularities:

****
****

****

****

****

| Granularity | Denominator | Numerator |
| --- | --- | --- |
| Component | interactive roles + states in its Contract | roles/states with a passing assertion or baseline |
| Route/Page | interactive A11y nodes + discovered sub-states (bounded by configured crawl depth/regions) | nodes/states covered by a test or baseline |
| App | all routes × their surfaces | covered surface across routes |
| Library | components × contracts, weighted by consumer adoption | components with base tests, weighted |

- **Reachable 100% requires a bounded denominator.** For a component the **Component Test Contract** bounds it: 100% functional = every role + declared state in the Contract has ≥1 behavioral assertion. For routes/apps the **crawler's bounded discovered surface** (capped depth) is the denominator, so "surface" is finite.

- Each granularity reports **two** numbers: Visual % and Functional %.

### 15.5 Confidence = an honest blend

Publishing confidence (§8) is enriched with coverage: high visual + low functional ⇒ "regression-safe but behavior-unverified." The gate never claims absolute "good to publish"; it reports *"X% of touched surface functionally validated, remainder covered by visual baseline, confidence = Y%."* **Coverage % is the explicit measure of the untested risk** — which is precisely the confidence signal the framework promises.

---
