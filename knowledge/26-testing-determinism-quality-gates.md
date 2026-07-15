# Testing, Determinism & Quality Gates

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Testing, Determinism & Quality Gates** within the RippleView framework. Part of the **RippleView** documentation set.

> 

How RippleView tests *itself*, and the determinism rules that make its verdicts trustworthy. RippleView eats its own dog food (Rule G20): the framework ships green through its own gate.

## Test layers for the framework

****

``

``

****
``
````

``
``

| Layer | Tool | Scope | Where |
| --- | --- | --- | --- |
| Unit | Vitest | Pure logic: scoring, config validation, anchoring, parsers, store shapes. Stateless core is highly unit-testable (G1). | packages/*/src/**/*.spec.ts |
| Component/integration | Vitest + fixtures | A module against a fake adapter (e.g. gate against an in-memory ResultStore). | packages/*/test/ |
| Browser/visual/e2e | Playwright Test | The capture→diff pipeline against rippleview-examples. | rippleview-examples driven by @rippleview/core |
| Self-gate | the rv CLI | The framework runs rv gate on the example apps as a release check. | CI |

## Coverage standard

- **Functional coverage = semantic surface, not lines** (Rule G14). For framework logic, unit-line coverage is still tracked with a floor of **80%** on touched code (Sonar-style ratchet) — new code may not lower the ratio.

- A module's **public API** must have tests for every exported function's success and primary failure path.

- 100% *functional* coverage of a component means **every role/state in its Component Contract has ≥1 assertion** — the Contract bounds the denominator. Never claim coverage beyond the Contract.

## Determinism rules (Rule G13 — mandatory before any assertion)

Freeze the world before you capture or assert:

``

``

****````

| Source of nondeterminism | Required control |
| --- | --- |
| Time / Date.now / timers | Freeze clock; stub timers. |
| Animations / transitions | Disable via injected CSS; wait for settled. |
| Fonts | Wait for document.fonts.ready; pin web fonts. |
| Network / data | API-first seeding + teardown; stub or record; no live third-party calls. |
| Async settle | Wait on stable A11y/role signals, never fixed sleep/waitForTimeout. |
| Viewport/theme/locale | Pin the matrix cell (viewport × theme × locale, incl. RTL) explicitly. |

A test that needs a retry to pass is **non-deterministic — that is a bug to fix**, not a flake to paper over.

## Flakiness governance

- Quarantine, don't ignore: a proven-flaky test moves to a tracked quarantine, never deleted, with a ticket. Quarantined tests don't gate but are visible on the dashboard.

- Retries are for *infrastructure* transients only, capped and logged — never to mask a real nondeterminism.

## Fixtures & test data

- Deterministic, committed fixtures; no reliance on ambient machine state, wall-clock, or network.

- Seed via the API-first seeding hooks; tear down what you create.

- Golden/baseline images are reviewed artifacts (accept/deny workflow) — never auto-blessed in CI.

## Test style

- Arrange–Act–Assert; one behaviour per test; descriptive names (`computes confidence 0 on build break`).

- Assert on **values and categories** (the multi-signal verdict's `category` + `severity` + value delta), not on opaque snapshots alone.

- No conditional logic in tests. No shared mutable state between tests.

- Test the **contract**, not the implementation detail — so refactors don't churn tests.
