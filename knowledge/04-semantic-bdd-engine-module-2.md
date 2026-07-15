# Semantic BDD Engine (Module 2)

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Semantic BDD Engine (Module 2)** within the RippleView framework. Part of the **RippleView** documentation set.

### 5.2 Module 2 — Semantic BDD (deterministic)

Universal step library maps Gherkin verbs to A11y locators (BDD-01), supports region scoping for ambiguity (BDD-02), `data-testid` fallback (BDD-03), network-aware waits (BDD-04), and the cross-browser matrix (BDD-05).

## 4. YAML test schema

Functional tests are a **Gherkin `.feature`** (human BDD spec) + a **linked `.yaml`** (executable binding: scoping, data, expected values), parsed and executed by the **rv** framework (Cucumber-style). Visual tests are YAML-only. These UI automation tests are **net-new** and live in **RippleViewTests** — the real `@op/*` libraries today ship only unit tests (Karma/Jasmine); RippleView adds the automation layer here rather than inside the libs, and does not migrate any pre-existing UI suite.

### 4.1 Functional `.feature` (standard Gherkin)

```gherkin
@datagrid @smoke @functional
Feature: DataGrid sorting
  Scenario: Sort by column
    Given a grid with at least 2 rows
    When I activate the column header "Name"
    Then the grid rows are ordered ascending by "Name"
```

### 4.2 Linked functional `.yaml` (binding) — schema

```yaml
feature: string                 # matches the .feature title
tags: [string]                  # @component, @smoke, @a11y, @functional ...
imports:                        # consumer importing library base tests (optional)
  - lib: string                 # e.g. datagrid
    use: "all" | [string]       # tags to include
    mountedAt: { route: string, region: string }   # BDD-02 scoping
extend: [string]                # paths to app-specific feature/yaml (optional)
scenarios:
  - name: string
    scope: { region: string }   # optional region scoping
    seed: object|ref            # data fixture or hook ref (ORC-03)
    steps:                      # bound steps using the universal vocabulary (§5)
      given: [string]
      when:  [string]
      then:  [string]
    examples: [object]          # optional data table
```

### 4.3 Visual `.yaml` — schema (per RippleView_VISUAL_CRAWLER §14)

```yaml
visual:
  providers:
    - type: "routeCrawler" | "storybook" | "script"
      routes: [string]          # routeCrawler
      regions: [string]
      probes: [string]          # role probes to apply
      scenes: [string]          # script: explicit scene files
  determinism:
    seed: ref
    freezeTimers: boolean
    mask: [string]              # selectors to redact/ignore
  matrix:
    viewports: [number]
    themes: [string]
    locales: [string]
  thresholds:
    geometryPx: number
    pixelYIQ: number
    ignoreAntiAliasing: boolean
```

---

## 5. Universal Step-Library catalog (Gherkin → A11y action)

The fixed vocabulary the parser implements and QA authors against. Steps are **zero-XPath** (resolve via the A11y tree) and **network-aware** (auto-wait on pending XHR/fetch; no sleeps). `{name}`/`{role}`/`{region}` are parameters.

### 5.1 Navigation & context

``

``

``

| Gherkin phrase | A11y mapping |
| --- | --- |
| I am on route "{route}" | navigate + hydrate session + stabilize |
| within the "{region}" region | scope subsequent locators to the region (BDD-02) |
| a {component} is mounted | assert component present by primary role |

### 5.2 Data

````
``

| Gherkin phrase | Mapping |
| --- | --- |
| a grid with at least {n} rows / seeded data {ref} | call seed hook (API-first, ORC-03) |

### 5.3 Actions (non-destructive by default; deny policy applies)

``
``

``
``

``

``

``

``
``

``
``

``

``
``

``
``

``
``

``
``

``
``

``
``

``
``

``
``

| Gherkin phrase | A11y mapping |
| --- | --- |
| I activate the {role} "{name}" | getByRole(role,{name}).click() |
| I type "{text}" into the field "{label}" | getByLabel(label).fill(text) |
| I select "{option}" from "{label}" | open combobox + select option by role |
| I toggle the {role} "{name}" | click checkbox/switch by role |
| I expand "{name}" | activate disclosure/accordion |
| I hover the {role} "{name}" | .hover() |
| I focus the {role} "{name}" | .focus() |
| I press "{key}" | keyboard press |
| I double-click the {role} "{name}" | .dblclick() |
| I right-click the {role} "{name}" | open context menu via .click({ button: 'right' }) |
| I scroll to the {role} "{name}" | .scrollIntoViewIfNeeded() |
| I scroll {direction} by {n} pixels | page.mouse.wheel(0, ±n) |
| I clear the field "{label}" | getByLabel(label).clear() |
| I drag the {role} "{name}" to "{target}" | .dragTo(target) via A11y locators |
| I check the checkbox "{name}" | getByRole('checkbox',{name}).check() |
| I uncheck the checkbox "{name}" | getByRole('checkbox',{name}).uncheck() |

### 5.4 Assertions

``
``

``
``

``
``

``

``

``

``

``

``

| Gherkin phrase | A11y mapping |
| --- | --- |
| the {role} "{name}" is visible | expect(getByRole).toBeVisible() |
| the {role} "{name}" is enabled/disabled | toBeEnabled()/toBeDisabled() |
| the text "{value}" is shown | getByText(value) visible |
| the selection equals "{value}" | read selected option/value |
| the {role} count equals {n} | role locator count |
| "{a}" does not overlap "{b}" | geometry overlap assertion (no box intersection) |
| the "{name}" is within the viewport | bounds within viewport (clipping check) |
| the attribute "{attr}" of {role} "{name}" equals "{value}" | attribute assertion |
| the URL is "{route}" | URL assertion |

### 5.5 Fallback & waits

``

| Behavior | Rule |
| --- | --- |
| ARIA missing | fall back to data-testid before failing (BDD-03) |
| Async work pending | auto-pause assertions until network idle (BDD-04) |

> 

Extending the vocabulary is done via the **Plugin SPI** (`LocatorStrategy`/custom steps), not by editing the core.

---
