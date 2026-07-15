# Static Code & Style Standards Gate (Layer 0)

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Static Code & Style Standards Gate (Layer 0)** within the RippleView framework. Part of the **RippleView** documentation set.

## 16. Static Code & Style Standards Gate (Layer 0 — Shift-Left)

Most theme/library regressions trace to a few authoring anti-patterns — chiefly **hardcoded design tokens** and **encapsulation-piercing overrides**. The runtime semantic/visual layers *detect* these after the fact; a static gate *prevents* them at PR time, at the lowest possible cost (no build, no browser). This is **Layer 0** in the gate sequence (before build → tests → visual), extending the early-exit philosophy of NFR-PERF.

Two reasons it is load-bearing, not cosmetic:
- A component hardcoding `#0066cc` instead of `--color-primary` silently ignores theme upgrades — the static gate blocks the hardcode; the visual crawler would only catch the resulting drift later.
- **The zero-XPath strategy depends on correct ARIA.** A `<div (click)>` instead of `<button>` breaks semantic locators, so the a11y rules below protect the framework's own foundation.

**Positioning.** Runs primarily on **library and theme** repos, secondarily on consumer override styles. Shipped as a pluggable, **per-framework rule pack** — `@rippleview/lint/angular` is the primary pack and the supported v1 target (the real `@op/*` libraries are Angular); `@rippleview/lint/react` is a future extension point — plus a custom AST analyzer for rules linters can't express, so the runtime engine stays agnostic. Results feed the dashboard as a **Code Health score** alongside coverage and drift.

### 16.1 Rule catalog

**Design tokens — values must be variables**
| Rule | Detection | Severity |
|---|---|---|
| Hardcoded color (hex/rgb/hsl/named) → semantic theme token | Stylelint `declaration-strict-value` + PostCSS AST | Error (allow `transparent`, `currentColor`, `inherit`) |
| Hardcoded spacing (padding/margin/gap/inset) magic number → spacing-scale token | PostCSS AST vs scale | Error (allow `0`, `auto`, `100%`, hairline `1px`) |
| Hardcoded font-size/weight/line-height/border-radius/box-shadow/z-index → token | PostCSS AST | Error/Warn |
| Hardcoded media-query breakpoint → breakpoint token | PostCSS media AST | Warn |
| Literal value equals an existing token → use the token reference | cross-check token registry | Warn |
| Component consumes a **primitive** token (`--blue-500`) instead of a **semantic** one (`--color-primary`) | token-tier registry lookup | Error (two-tier token governance) |

> 

**Ownership (decided):** the **library author owns two-tier token management** — defining the primitive→semantic token registry and ensuring components consume only semantic tokens. This is a design-system prerequisite the static gate enforces.

**Encapsulation & style bleeding**
| Rule | Detection | Severity |
|---|---|---|
| `::ng-deep` / `/deep/` / `>>>` banned (or must be `:host`-scoped + waived) | Stylelint custom + SCSS AST | Error |
| `ViewEncapsulation.None` without waiver | TS AST (decorator metadata) | Error |
| Global/element/tag selectors in component styles (`div{}`, `button{}`, `*`) | SCSS AST selector analysis | Error |
| `!important` (banned/limited) | Stylelint `declaration-no-important` | Error/Warn |
| Inline `style="..."` / `[style.x]` literal in templates | Angular template AST / JSX AST | Error |
| `:global` (CSS modules) / unscoped styled-component | React pack | Warn |
| z-index outside the layering scale | PostCSS AST | Error |
| Negative-margin layout hacks / `position:absolute` without containment | SCSS AST | Warn |

**Public API / contract stability (library)**
| Rule | Detection | Severity |
|---|---|---|
| Removed/renamed `@Input`/`@Output` or exported member vs last published `.d.ts` | api-extractor + ts-morph diff | Error → forces semver major + base-test update (§6.1) |
| *Note:* the `@op/*` libraries are Angular ng-packagr packages, so the `.d.ts` diff is computed against the published package output (`dist/<lib>`, e.g. `@op/core-controls`), not against raw source. | — | — |
| Host DOM change that drops an ARIA role used by base tests | template AST vs Component Contract | Error |

**Accessibility (protects zero-XPath locators)**
| Rule | Detection | Severity |
|---|---|---|
| Interactive element missing role / accessible name / label | `jsx-a11y` / `@angular-eslint` a11y / template AST | Error |
| Non-semantic clickable (`<div (click)>`) instead of `<button>` | template AST | Error |

### 16.2 Enforcement

- First CI stage on library/theme PRs (and on consumer override-style files).

- **New-code ratchet** (consistent with §15): block *new* violations; track *legacy* violations as debt with an amber/red burndown count on the dashboard (reuses the §11 threshold pattern).

- **Waivers** via inline annotations requiring an issue link, counted toward a threshold — same governance as §11.

- Rule packs and allowlists (spacing scale, token registry, z-index layers) are configured per design system; the engine ships sensible defaults.

---
