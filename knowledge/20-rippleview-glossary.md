# RippleView Glossary

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **RippleView Glossary** within the RippleView framework. Part of the **RippleView** documentation set.

## 2. Glossary

****

****

****

****
``

****
****

****

****

****

****

****

****``

****

****

****

****
``

****

****

****
``

****

****

****

****

****

****

****
``

****

****

****

| Term | Meaning |
| --- | --- |
| RippleView | RippleView — the whole platform. |
| Plane | A horizontal layer: 1 Execution, 2 Knowledge, 3 Orchestration, 4 Intelligence. |
| Zero-XPath | Locating elements by the Accessibility tree (role/name/label), never CSS/XPath. |
| Semantic anchor | Stable element identity = role + accessible name + semantic path; the key used to align baseline↔current. |
| Scene | A target (component or page) in one specific state, captured deterministically. |
| SceneProvider | Pluggable source of Scenes: Storybook / RouteCrawler / Script. |
| Role-based probe | A generic, ARIA-role-derived "play function" that drives a component through its display states. |
| Module 1 / Visual Engine | Autonomous visual validation via the multi-signal ledger. |
| Module 2 / Semantic BDD | Functional validation via Gherkin over A11y locators. |
| Ledger / Baseline / Golden Baseline | Stored reference (JSON metadata + images) a Scene is compared against; the accepted truth. |
| Component Test Contract (contract.yaml) | A component's declared semantic anchors, states, public API, and data shape. The denominator for coverage. |
| Base test | A test that ships with a library component and versions with it; consumers import it. |
| Drift score | How far behind an app's consumed version is (within a framework track). Higher = worse. |
| Upgrade confidence % | Gate-derived measure of how safe a candidate is for a consumer. |
| Framework track / version namespace | A library's support line per framework generation (e.g. angular/17). |
| Compatibility gate | The CI process that runs a candidate library against impacted consumers. |
| Backward-compat (Context 2) | Running NEW component code against each consumer's OLD base tests. |
| issueSignature | SHA-256(target + testId + failureLayer + normalizedDiffSignature) — stable identity of a failure. |
| Accepted bug | A failure annotated with an issue id so it is bypassed until fixed; counts toward the threshold. |
| Threshold | Max active accepted bugs per target (default 5); amber near, red at (bypass disabled). |
| Coverage (visual / functional) | Validated semantic surface ÷ discovered-or-contracted surface. Two independent numbers. |
| Reachable surface | The portion of an app the crawler can reach by safe interaction. |
| Static gate / Layer 0 | Pre-build lint gate (tokens, encapsulation, API stability, a11y). |
| Matrix | Browser × viewport × theme × locale execution dimensions. |
| Tenant | {department, framework, frameworkVersion} stamped on every result for isolation. |
| Impact selection | Choosing which consumers to test based on the dependency graph. |
| Copy-unchanged | TurboSnap-style reuse of baselines for scenes a change didn't affect. |
| Determinism layer | Docker + freeze animations/timers + seeded data + masking — the prerequisite for stable diffing. |

---
