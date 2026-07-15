# Component-Inherent Tests & Base-Test Versioning

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Component-Inherent Tests & Base-Test Versioning** within the RippleView framework. Part of the **RippleView** documentation set.

## 6. Component-Inherent Tests (write-and-forget)

The principle that makes maintenance collapse: **the test targets the component's semantic contract, not its DOM, and versions in lockstep with the specific `@op/<lib>` it tests** — including that library's generation-suffix channel (`-ng17`/`-ng15`/`-ag27`). Each `@op/*` library has its own independent semver line, so its base tests do too; there is **no single global "component version."**

These base tests are **net-new UI automation tests** authored in **RippleViewTests** — the real `@op/*` libraries today ship only unit tests (Karma/Jasmine). RippleView adds the automation layer here, not inside the libs.

- Each library component declares a **Component Test Contract** (`contract.yaml`): its ARIA roles, accessible names, interactive states, and required data shape.

- Base tests are written against that contract and tagged by component + type (`datagrid`, `smoke`, `a11y`, `visual`).

- App C on `@op/datagrid@15.2.0-ng15` runs that library version's base tests; an upgrade candidate ships `@op/datagrid@16.0.0-ng15` **and its matching tests together**. The author who changes the component updates that one library's base test, once, for all of its consumers — independently of every other `@op/*` library.

### Consumer import (in a consumer-app YAML)

```yaml
imports:
  - lib: datagrid
    use: [smoke, sort]          # 'all' | list of tags
    mountedAt: { route: /orders, region: main }   # where this component lives (BDD-02)
extend:
  - ./functional/orders-specific.yaml              # the app's own extra tests
```

The consumer supplies only **where** the component lives + **data/auth** — never *how* to test it. Adoption modes: `use: all` / `use: [tags]` / `extend`.

### Functional test artifacts

`*.feature` (human-readable Gherkin BDD spec) + linked `*.yaml` (step data, parameters, scoping). Visual tests are YAML-only.

```yaml
# sort.yaml — linked to sort.feature
feature: DataGrid sorting
tags: [datagrid, smoke, functional]
scenarios:
  - name: Sort by column
    given: grid with at least 2 rows
    when:  activate column header "Name"
    then:  grid rows ordered ascending by "Name"
```

### 6.1 Base-test versioning (the central invariant)

**Problem.** All tests live in one repo. If a consumer-app test *relative-imports* a library base test, it always resolves to the working tree (= latest). So the instant a base test changes, every app "sees" it regardless of which `@op/<lib>` version that app actually runs — the app's own pipeline then runs a *new* base test against its *old* library and fails, while the gate (running the *new* library) passes. That skew is unacceptable.

**The invariant.** Base tests are pinned **per library** to the exact `@op/<lib>` version they test (including its suffix channel); the app never relative-imports or hardcodes a version — the runner resolves it, one library at a time. *Which* version it resolves depends on the run's purpose, and there are **three contexts**:

```text
  CONTEXT 1 — App's own CI (consistency)
    @op/<lib> @ app's consumed version  +  base tests @ the SAME version
    e.g. @op/datagrid@18.1.0-ng17 + tests@18.1.0-ng17  → app stays green on a stable contract

  CONTEXT 2 — Backward-compatibility gate (a library was changed)   ★ THE KEY FLOW
    @op/<lib> @ candidate beta  +  base tests @ EACH consumer's CURRENT version of THAT lib
    e.g. @op/datagrid@18.3.3-beta17.1 + tests@18.1.0-ng17 (app1) and tests@18.2.5-ng17 (app2)
    → proves the NEW code still satisfies the OLD contract each consumer relies on
    → a failure = backward-compat break → dev decides:
         · bug          → fix the component
         · intentional  → consumer adapts code (e.g. contract change),
                          dev files an issue, annotates the baseline, reruns

  CONTEXT 3 — Upgrade adoption (an app chooses to bump)
    @op/<lib> @ new version  +  base tests @ the NEW version  +  app code adapted
    → validates the app against the new contract it is opting into
```

**Key point (the correction):** the merge-time gate runs **new library code against the OLD base tests (Context 2)** — *not* the new tests. New-code-with-new-tests would pass while silently breaking existing consumers; new-code-with-old-tests is exactly what proves backward compatibility. The candidate's own new base tests matter only when an app actually adopts the new version (Context 3). Each consumer is on its own current version of that one library, so the gate runs a **matrix**: the single candidate `@op/<lib>` × each consumer's distinct base-test version of it. Because every `@op/*` library is versioned independently, this matrix is scoped to the one library being changed — other libraries are untouched. Any version comparison or drift score must parse the suffix channel (`-ng17`/`-ng15`/`-ag27`/`-beta17.x`) **before** computing majors/minors/patches behind.

**Storage — one authored file per library, versioned by publish-snapshot (not per-version files).** Keep a *single* evolving base-test file per `@op/<lib>` in the working tree; do **not** hand-maintain `v18.1.0/`, `v18.3.3/` folders. Immutable versions are materialized at publish time:
- each `libraries/<component>/` is a publishable package `@RippleViewTests/<component>`; publishing **snapshots the current files** as an immutable version whose number **equals the `@op/<lib>` version it tests** (including the suffix channel);
- git tags back each publish as the source-of-record.

The runner fetches whatever pinned version a context needs (e.g. `@RippleViewTests/datagrid@18.1.0-ng17`) from the registry — so Context 2 can load a consumer's *old* tests even after the working tree has moved on. Authoring and consumption are thus separated: you author latest, but every run consumes a pinned version.

**Per-library lockstep prereleases.** An `@op/<lib>` beta `18.3.3-beta17.1` ships a matching base-test beta `@RippleViewTests/datagrid@18.3.3-beta17.1` (used in Context 3). That one library's PR and any contract/base-test change move together; other libraries are unaffected.

**Publishing trigger & ownership (decided).** When a library is changed and ready to publish, **the library author is responsible for updating the matching base test** and that library's release pipeline publishes the matching base-test package version from `RippleViewTests` in lockstep. Rule of thumb: **base-test package version === the `@op/<lib>` version it covers** (including suffix channel and prerelease). This is **per-library** lockstep — each base-test package tracks its own library's independent semver line, not one global version — making a contract change and its test change inseparable so they cannot drift.

**PoC vs. production** (resolution invariant unchanged):
- **PoC:** a local **Verdaccio** registry (no cloud infra) — or git-tag snapshots — with the runner fetching the resolved version into a temp dir. The registry endpoint is a config switch, not code.
- **Production:** the existing private **Sonatype Nexus** registry (`@op:registry`, repo `opnpmprivate`) — selected by the same config switch with no framework change.

**Consumer extension.** App-specific tests that `extend` base scenarios live in the app folder and version with the app (git). They reference base scenarios by tag/name; the base set itself is always version-resolved as above.

---
