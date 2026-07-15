# Visual Validation Engine (Module 1)

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Visual Validation Engine (Module 1)** within the RippleView framework. Part of the **RippleView** documentation set.

### 5.3 Module 1 — Visual Validation Engine (the theme safety net)

For changes nobody wrote a targeted test for (especially **theme upgrades**), this engine validates look-and-feel against a baseline with **zero test authoring**. Its design mirrors how a manual QA inspects pages and is grounded in proven visual-testing practice (Chromatic/Storybook). **Full design: [RippleView_VISUAL_CRAWLER.md](RippleView_VISUAL_CRAWLER.md).** Essentials:

- **Spine principle:** *structure is the map, rendered signals are the verdict.* Align baseline↔current by the **semantic/A11y anchor** (`role + accessible name + path`); judge regressions by **geometry → computed-style → pixel**. A markup refactor that preserves rendering is not a regression (fixes HTML-diff false positives).

- **Pluggable SceneProvider** (the flexibility/anti-scrap decision): the capture→diff→review pipeline is the durable core; *how* a component reaches a state is pluggable — **Storybook** (already present in `aos-libraries` as Storybook 8, the recommended first provider for `@op/*` component libraries), **RouteCrawler** (configured routes + autonomous discovery + **role-based state probes**, the SHA-256 state graph per AGENT-CRAWL, Shadow DOM piercing — the recommended provider for consumer apps), or **Script** (seeded deep links). If autonomous crawling underperforms, Storybook/Script still ship a complete system.

- **Multi-signal differ** (beyond Chromatic's pixel-only): presence/structure + geometry (overlap/clip/overflow/misalignment) + computed-style (tokenized) + pixel (YIQ threshold, anti-alias ignore), early-exit (NFR-PERF-001). Findings carry **category, severity, and exact value deltas**.

- **Role-based probes** = generic, ARIA-role-derived "play functions" that cycle components through display states (dropdown open/selected, grid rows/pagination, input empty/filled) without per-component scripts.

- **Determinism is mandatory:** Docker, freeze animations + JS timers, seeded data, dynamic-zone masking, settle gates.

- **Interaction safety:** allow/deny policy blocks destructive actions (delete/submit/pay); mutations stubbed; reset-to-clean between probes.

- **Baseline workflow:** branch-aware (ORC-06), accept/deny review, copy-unchanged optimization (TurboSnap-style), Phase-0 production characterization.

---

## 1. Goal & philosophy — automate the manual QA's eye

Replicate exactly how a QA performs visual regression: log in, visit a known list of routes, drive each component into its **display states**, and compare look-and-feel against a trusted baseline — **with zero functional test authoring**. Target **≥ 80% visual coverage of the reachable surface**.

**Core principle (the design's spine):**

> 

**Structure is the *map*; the rendered signals are the *verdict*.** Align baseline↔current by semantics (the A11y/role tree); judge regressions by **geometry → computed-style → pixel**. A markup refactor that preserves the rendering is *not* a regression.

This resolves the central flaw of naive visual testing: HTML/class diffs are noisy (a `<span>`→`<button>` refactor looks identical), while a CSS value change is invisible to the DOM but breaks layout.

---

## 2. What we learned from Chromatic — adopt & extend

****

****
******

****

****

**``**

****
****

****

****

****

****

****

****

****

****

********

| Chromatic technique | What it proves | RippleView adopts | RippleView extends |
| --- | --- | --- | --- |
| Story-based isolation (stories = deterministic component states) | Isolated, repeatable capture targets are the key to stability | Pluggable SceneProvider; Storybook is one provider | Adds a RouteCrawlerProvider so apps without Storybook get zero-test coverage in the real app |
| Pixel snapshot in a consistent cloud env | Determinism comes from a fixed render environment | Docker capture, fixed fonts/DPR/viewport | — |
| Diff = YIQ color-distance + diffThreshold; anti-aliasing ignored by default | Color-space thresholding + AA-ignore tames false positives | Adopt exactly for the pixel layer | Pixel diff scoped per semantic-anchor box, not whole page → localized findings |
| Play functions, then snapshot the post-interaction state | "Drive an interaction → capture state" is proven | Same mechanism | Generalize the play function to be derived from ARIA role → generic probes, no per-component authoring |
| Accept/deny baseline review, branch-aware | Human-blessed baselines + git-branch resolution | Baseline manager + governance (§17.7) | Diff clustering for anti-fatigue |
| TurboSnap — git + bundler dep-graph impacted selection; copy unchanged baselines | Only snapshot what changed; reuse the rest | Impacted selection via registry + dep graph; copy-unchanged | Tied into the compatibility gate (§9) |
| Modes (theme × viewport) | Variants are first-class | The matrix (§17.2) | Adds locale/RTL |
| Determinism: mock data, fixed dates, freeze animations and JS timers | Flakiness is killed at the source | Mandatory determinism layer (§9 of this doc) | API seeding + dynamic-zone masking |

**The gap we close:** Chromatic is **pixel-only** — it flags "this region changed" but cannot *attribute* the change or report a value. RippleView's **multi-signal diffing** (presence + geometry + computed-style + pixel) yields findings with **category, severity, and exact value deltas**, and fewer false positives because a pixel change can be explained by a known style/geometry delta (or dismissed as a same-render refactor).

---

## 3. The pipeline (clean, staged, each stage independently replaceable)

```text
 SceneProvider ──▶ Scene[] ──▶ Capturer ──▶ Snapshot ──▶ Aligner ──▶ AlignedNode[]
 (pluggable)     (component+    (Docker,     (4 signals)  (semantic
                  state)        determinism)              anchors)
                                                              │
                                                              ▼
        Reporter ◀── Baseline Manager ◀── Multi-Signal Differ ── Finding[]
        (dashboard,   (accept/deny,        (presence·geometry·   (category,
         Allure)      branch-aware,         style·pixel)          severity, values)
                      copy-unchanged)
```

A **Scene** = a target (a component, or a whole page) in **one specific state**, captured deterministically. Everything downstream operates on Scenes, regardless of how they were produced.

---

## 4. SceneProvider — the abstraction that makes this flexible & non-scrappable

This is the most important architectural decision in the visual engine. The **capture → diff → review pipeline is the durable, proven core** (it is what Chromatic is). *How scenes are produced* is pluggable:

- **StorybookProvider** — if the target ships Storybook, reuse existing stories + play functions. Most isolated and deterministic. **For component libraries this is the recommended first provider**: `aos-libraries` already runs **Storybook 8** (plus its playground apps), so the `@op/*` libs get a proven, zero-risk visual entry point on day one — no new harness to build.

- **RouteCrawlerProvider** — configured routes + autonomous component discovery + **role-based state probes** (§8). Zero-test, runs in the real app. **This is the recommended entry point for consumer applications** (which have no Storybook). *(The novel, higher-risk provider.)*

- **ScriptProvider** — explicit YAML scene definitions for hard-to-reach states (deep links, seeded preconditions, error/empty states).

**Why this de-risks the whole module:** the only unproven part is RouteCrawler autonomy. If it underperforms, the **Storybook and Script providers still deliver a full, working visual-regression system on the identical pipeline** — capture, multi-signal diff, baseline, report are untouched. The investment is preserved; nothing is scrapped. Autonomy is an *enhancement layered on a proven base*, not a bet the whole module rests on.

---

## 5. Snapshot model (what we capture per Scene)

Captured in the deterministic environment, per Scene:

```json
{
  "sceneId": "orders/datagrid@selected",
  "a11yTree": { /* role tree — the alignment skeleton */ },
  "domSnapshot": { /* sanitized: auto-ids/timestamps/user-data stripped — presence signal */ },
  "nodes": [
    {
      "anchor": { "role": "button", "name": "Clear", "path": "grid>toolbar>button[2]" },
      "bounds": { "x": 312, "y": 88, "width": 16, "height": 16 },
      "styles": { "color": "rgba(...)", "backgroundColor": "...", "padding": "...", "fontSize": "..." },
      "overflow": { "scrollW": 16, "clientW": 16, "isClipped": false }
    }
  ],
  "screenshot": "scene.png",            // full + optional per-node crops
  "webVitals": { "CLS": 0.01, "LCP": 850 }   // optional (§17.4)
}
```

---

## 6. Semantic anchoring (alignment) — zero-XPath, for pixels

Each node gets a **semantic anchor**: `role + accessible name + semantic path`, with `data-testid` and visual-position as tie-breakers. Baseline↔current nodes are matched by anchor, so the comparison survives markup/class/tag refactors. **Unmatched anchors become Structure findings** (missing / extra / role-changed). This is the same zero-XPath philosophy applied to visual matching.

---

## 7. Multi-Signal Differ (the verdict)

Four differs run per aligned node; each emits `Finding { category, severity, anchor, baselineValue, currentValue, delta }`.

****
``
******

****
********``********
****

****
``
****

****
****

| Differ | Detects | Severity guidance |
| --- | --- | --- |
| 1 · Presence/Structure | node missing/extra by role; role changed; expected icon/img/SVG absent (by role/src) | missing interactive/icon = HIGH; tag/class change with identical role+style+geometry = IGNORED |
| 2 · Geometry | bounds delta > tolerance; overlap (sibling box intersection); overflow/clipping (scroll>client); misalignment (shared-edge drift); containment (child escaping parent) | overlap / clip / new scrollbar / containment break = HIGH |
| 3 · Computed-style | normalized rgba()/px diffs, mapped to a design token | color / spacing / font / radius drift = HIGH (theme) |
| 4 · Pixel | per-anchor-box screenshot diff; YIQ threshold + anti-alias ignore; data-masked | tunable backstop; catches gradients/glyphs/icons the others can't |

**Verdict assembly:** combine findings. A tag/class change with **no** style/geometry/pixel delta ⇒ **no regression** (the false-positive fix). Pixel runs scoped to a node and primarily as a backstop / for non-DOM visuals.

> 

**Chromatic vs. RippleView on the same bug:** Chromatic → a green-highlighted pixel region. RippleView → *"DataGrid 'Clear' button (role=button) overlaps the selection chip by 6px; `padding-right` 8px→2px; color token `--spacing-2` no longer applied."* Actionable, attributed, value-level.

---

## 8. Role-based state probes (generic "play functions")

**Grounding:** Storybook+Chromatic already snapshot the state *after* a hand-written play function. RippleView makes the play function **generic, derived from the element's ARIA role**, so no per-component scripting is needed. Probes are **plugins** (the SPI) — teams add/override for custom components via the Component Contract.

****

****

****
``

****

****

****

****

| Role | States the probe captures |
| --- | --- |
| combobox / listbox | closed → open (panel: overflow? overlap? within viewport?) → option hover → selected (chip + clear-icon alignment) → cleared → close |
| grid / treegrid | default → row hover → header sort-icon → checkbox column visible → selected row → pagination toolbar → side panel |
| textbox / searchbox / spinbutton | empty → focused → filled (seeded value) → invalid/error (if forceable via aria-invalid) |
| button | default → hover → focus → disabled |
| tab / tablist | each tab selected (panel rendered) |
| dialog / menu | open via trigger → capture → safe close |
| checkbox / radio / switch | unchecked → checked → disabled |

Each probe is **non-destructive** (deny policy), runs with **mutations stubbed**, and **resets to a clean state** between probes (re-navigate + re-seed rather than relying on Escape).

---

## 9. Determinism (mandatory — the make-or-break, per Chromatic)

Visual diffing is only as trustworthy as capture determinism. Required:

- **Fixed environment:** official Playwright Docker image — pinned fonts, device-pixel-ratio, viewport.

- **Freeze motion:** disable CSS animations/transitions/caret **and JS timers** (`setTimeout`/`setInterval`/`requestAnimationFrame`) at snapshot time. *(CSS-only freezing is insufficient — Chromatic explicitly freezes JS timers too.)*

- **Settle gates:** wait for network-idle, `document.fonts.ready`, images decoded, no pending XHR.

- **Deterministic data:** API-seeded fixtures, fixed clock/dates, masked dynamic zones (`data-rv-ignore`).

- **Pixel knobs:** YIQ color-distance threshold + anti-aliasing ignore (Chromatic-proven).

---

## 10. Baseline workflow (Chromatic-grounded)

- **Accept/deny review;** baseline = last accepted (governed by RBAC + audit, §17.7).

- **Branch-aware** (ORC-06): resolve baseline by active branch, fall back to `main`.

- **Copy-unchanged optimization** (TurboSnap-style): only re-capture scenes whose component/route changed (registry + dep graph); copy baselines for the rest → bounds cost and runtime.

- **Phase-0 characterization:** first run auto-blesses current production as the baseline (instant safety net).

- **Diff clustering:** one theme change ⇒ a single grouped approval across all affected scenes (anti-fatigue).

---

## 11. Coverage model (how ~80% is reached without tests)

```text
Visual Coverage(route) = scenes captured & compared
                         ───────────────────────────────────────────────
                         discovered components × their role's defined states
```

Configured routes + role-based probes mechanically cover the **default and interactive-display states** of every standard component on each page — the bulk of what a QA eyeballs. Two coverage numbers are reported per granularity (component/route/app): this **Visual %** and the separate **Functional %** (Module 2).

**The ~20% not free:**
- Data/precondition states (error / empty / loading / permission- or flag-gated) → **ScriptProvider** seeded deep-link entry points.
- Custom non-ARIA components → **Component Contract** hints (states + how to reach).
- Genuine multi-step flows → Module 2 (functional), not the crawler.

Reported honestly as **"reachable visual coverage"** — never conflated with total surface.

---

## 12. QA manual check → automated assertion (proof it mirrors the QA)

``

| QA's manual eye | Automated signal |
| --- | --- |
| grid width/height changed? | geometry bounds delta |
| scrollbar appeared? | scrollW/H > clientW/H (overflow) |
| selection chip overlaps clear icon? | sibling overlap (box intersection) |
| dropdown panel overlaps adjacent element? | overlap + containment |
| options panel shows fully? | within-viewport / not clipped |
| checkbox visible in row? | role present + non-zero bounds + not occluded |
| column sort icons present & aligned? | icon present + shared-edge alignment |
| alignment correct? | x/y edge alignment vs baseline |
| empty vs filled looks right? | capture both states; geometry+style diff |
| color/theme correct? | normalized computed-style diff |

---

## 13. Implementation phasing — the anti-scrap strategy

Build **proven-first, novel-later**; every phase ships independent value:

****
********

****
************

****
********

****
****
****

****

| Phase | Build | Delivers | If the next phase fails… |
| --- | --- | --- | --- |
| VC-0 | Pipeline + Capturer + pixel differ + baseline accept/deny, on Script/Storybook providers | A Chromatic-equivalent visual regression system | — |
| VC-1 | Semantic anchoring + geometry + computed-style differs | Actionable, value-level diffs (beyond Chromatic) | VC-0 still fully works |
| VC-2 | RouteCrawlerProvider — routes + component discovery + default-state capture | Zero-test page coverage in the real app | VC-0/1 + Storybook/Script still ship |
| VC-3 | Role-based state probes | Interactive-state coverage → ~80% | VC-2 default-state coverage still ships |
| VC-4 | Determinism hardening, copy-unchanged, matrix (theme/viewport/locale), Web Vitals | Scale + enterprise-grade | — |

The risky autonomy (VC-2/VC-3) sits **on top of** a proven base. Worst case, you ship a best-in-class Storybook/script-driven multi-signal visual tester. Best case, you also get zero-test autonomous coverage. Either way, no rework.

---

## 14. Config example (`visual` block, per-app)

```yaml
visual:
  providers:
    - type: routeCrawler          # or: storybook | script
      routes: ["/orders", "/orders/:id"]
      regions: ["main"]
      probes: [combobox, grid, textbox, button]   # role probes to apply
    - type: script
      scenes: ["./visual/error-states.yaml"]      # seeded deep links
  determinism:
    seed: ./hooks/seed.ts
    freezeTimers: true
    mask: ["[data-rv-ignore]", ".live-feed", "time"]
  matrix:
    viewports: [375, 768, 1440]
    themes: [light, dark]
    locales: [en, ar]            # ar → RTL
  thresholds:
    geometryPx: 2
    pixelYIQ: 0.04
    ignoreAntiAliasing: true
```

---

## 15. Open risks (carried, with mitigations)

- **Anchor stability** for poorly-labeled components → enforced by the static a11y gate (§16) + `data-testid` fallback.

- **Custom non-ARIA components** → Component Contract hints; default to pixel-only if unmappable.

- **Virtualized lists / canvas / charts** → scroll-normalize or sample; canvas/charts are pixel-only (component-type validators via SPI).

- **Probe reset reliability** → reset-to-clean (re-navigate + re-seed), never rely solely on Escape.

---

## Sources

- [The power of visual testing — Chromatic](https://www.chromatic.com/blog/visual-testing/)

- [Introduction to TurboSnap — Chromatic docs](https://www.chromatic.com/docs/turbosnap/)

- [Threshold (YIQ color distance, anti-aliasing) — Chromatic docs](https://www.chromatic.com/docs/threshold/)

- [Visual testing for components and pages — Chromatic](https://www.chromatic.com/features/visual-test)
