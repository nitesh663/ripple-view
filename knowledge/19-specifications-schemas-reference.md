# Specifications & Schemas (Reference)

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Specifications & Schemas (Reference)** within the RippleView framework. Part of the **RippleView** documentation set.

## 1. Document index & reading order

[](RippleView_DESIGN.md)

[](RippleView_ARCHITECTURE.md)

[](RippleView_VISUAL_CRAWLER.md)

[](RippleView_IMPLEMENTATION.md)

[](RippleView_DASHBOARD.md)

****

[](RippleView_AGILE_ROADMAP.md)

| # | Document | Purpose | Read when |
| --- | --- | --- | --- |
| 1 | RippleView_DESIGN.md | The what & why — problem, planes, all design decisions | Start here |
| 2 | RippleView_ARCHITECTURE.md | Diagrams, module catalog (E/K/O/I/X), phased plan, KPIs/risks | After design |
| 3 | RippleView_VISUAL_CRAWLER.md | Module 1 deep design (Chromatic-grounded, SceneProvider, probes) | For visual work |
| 4 | RippleView_IMPLEMENTATION.md | Tech stack, Docker, isolation pipeline, CI-agnostic, OS-neutral, PoC↔prod | To build/run |
| 5 | RippleView_DASHBOARD.md | Dashboard data model, the five views, API, tech | For dashboard work |
| 6 | RippleView_SPECS.md (this) | Schemas, step vocabulary, glossary | Reference while building |
| 7 | RippleView_AGILE_ROADMAP.md | Epics → stories → tasks → sprints | To plan & execute |

---

## 3. Component Test Contract schema (`contract.yaml`)

The contract is the single declaration a library component publishes so that: base tests can target it, coverage can be measured (it bounds the denominator), semantic anchors are known, and the static API-stability gate has a reference. **It versions with the specific `@op/<lib>` it describes** — each library has its own independent semver line, including the generation-suffix channel (`-ng17`/`-ng15`/`-ag27`), not one global component version (§6.1 of design).

### 3.1 Schema (fields)

```yaml
component:            # identity
  name: string                 # e.g. datagrid
  package: string              # e.g. @op/core-controls
  version: string              # independent per-library semver incl. channel, e.g. 14.2.15-ng17
  primaryRole: string          # primary ARIA role, e.g. grid
  description: string

anchors:              # named semantic sub-parts (the alignment + assertion targets)
  - id: string                 # e.g. sortButton
    role: string               # ARIA role, e.g. button
    name: string|regex         # accessible name or pattern, e.g. "Sort *"
    required: boolean          # must be present (presence check / a11y gate)
    description: string

states:               # enumerated visual/interactive states (coverage denominator)
  - id: string                 # e.g. open | empty | filled | selected | disabled | error
    description: string
    reach:                     # how a probe/runner reaches this state (optional)
      probe: string|null       # role-based probe id, or null if default
      preconditions: [string]  # e.g. ["seed:rows>=2"]

api:                  # public surface the stability gate watches (§16 design)
  inputs:  [{ name, type, required, description }]
  outputs: [{ name, payload, description }]
  slots:   [{ name, description }]

data:                 # seed data shape needed to render meaningful states
  shape: object                # JSON-schema-like description of required fixture
  example: object

probes: [string]      # role-based probes that apply (or custom probe refs)

a11y:                 # required accessibility guarantees (a11y gate input)
  requiredRoles: [string]
  requiredLabels: [string]
  wcagLevel: "A|AA|AAA"
```

### 3.2 Example (`libraries/datagrid/contract.yaml`)

```yaml
component:
  name: datagrid
  package: "@op/datagrid"
  version: "14.2.15-ng17"      # independent per-library semver, channel-suffixed
  primaryRole: grid
  description: Sortable, selectable data grid with pagination and side panel.
anchors:
  - { id: header,        role: columnheader, name: "*",        required: true,  description: column headers }
  - { id: sortButton,    role: button,       name: "Sort *",   required: false, description: per-column sort }
  - { id: rowCheckbox,   role: checkbox,     name: "Select *", required: false, description: row selector }
  - { id: pagination,    role: navigation,   name: "Pagination", required: true, description: pager toolbar }
  - { id: clearButton,   role: button,       name: "Clear",    required: false, description: clear selection }
states:
  - { id: default,  description: rendered with rows, reach: { probe: null, preconditions: ["seed:rows>=2"] } }
  - { id: empty,    description: no rows,            reach: { probe: null, preconditions: ["seed:rows=0"] } }
  - { id: selected, description: one row selected,   reach: { probe: grid, preconditions: ["seed:rows>=2"] } }
  - { id: sorted,   description: sorted ascending,   reach: { probe: grid, preconditions: ["seed:rows>=2"] } }
api:
  inputs:  [{ name: rows, type: "T[]", required: true, description: data }, { name: selectable, type: boolean, required: false, description: row selection }]
  outputs: [{ name: selectionChange, payload: "T[]", description: emitted on select }]
  slots:   [{ name: toolbar, description: custom toolbar content }]
data:
  shape: { rows: "array of { id, name, ... }" }
  example: { rows: [{ id: 1, name: "Alpha" }, { id: 2, name: "Beta" }] }
probes: [grid]
a11y:
  requiredRoles: [grid, columnheader, row]
  requiredLabels: ["Pagination"]
  wcagLevel: AA
```

---

## 6. Consolidated data model (all collections)

Mongo-shaped JSON documents (files in PoC → MongoDB in prod). Authoritative list:

``

``

``

````

``

``

``

``

``

| Collection | Source | Purpose |
| --- | --- | --- |
| registry/ | scanner (K1) | framework→library→consumer version graph for `@op/*` libraries; the scanner skips non-npm / non-Angular repos (e.g. Java/Spring backends) |
| runs/ | runner | per-execution summary, tenant-tagged |
| results/ | runner | per-test findings (category, severity, value deltas), issueSignature, acceptedBugRef |
| acceptedBugs/ | gate/issue-tracker | accepted-bug records (issue id, since, status) |
| builds/ | gate (dashboard §3) | build/test history, failureStage, durations |
| scores/ | dashboard API (dashboard §3) | drift/confidence time-series per (app × library) |
| baselines/ | visual engine | Golden Baseline ledger (JSON + images), version/branch-keyed |

Tenant identity (`{department, framework, frameworkVersion}`) + target + context are stamped on every document (design §10).

---

## 7. Cross-references

- Drift / confidence formulas: [RippleView_DESIGN.md §8](RippleView_DESIGN.md).

- Ship/no-ship rule: [RippleView_DASHBOARD.md §4](RippleView_DASHBOARD.md).

- Base-test versioning (Contexts 1/2/3): [RippleView_DESIGN.md §6.1](RippleView_DESIGN.md).

- Visual signal model & probes: [RippleView_VISUAL_CRAWLER.md](RippleView_VISUAL_CRAWLER.md).

- Isolation pipeline & CI: [RippleView_IMPLEMENTATION.md](RippleView_IMPLEMENTATION.md).
