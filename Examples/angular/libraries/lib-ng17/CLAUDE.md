# CLAUDE.md

Persistent project context for an Angular 17 UI-library monorepo. Delivered in milestones:

- **Milestone 1:** `op-core-controls` (4 controls) + a live `ui-playground` demo app, plus
  the two minimal supporting libraries the controls depend on.
- **Milestone 2:** a Storybook host (`ui-playground-2`) documenting the controls.
- **Milestone 3:** `op-aggrid` — an AG Grid 30 wrapper (`occ-aggrid`) with renderers, cell
  editors, a **sidebar filter panel**, and NgRx-backed column/filter state. Add a grid
  viewer to `ui-playground` and grid stories to `ui-playground-2`.
- **Milestone 4:** `op-dynamic` — **only the `dynamic-aggrid` feature**, a metadata-driven
  grid that **wraps `op-aggrid`'s `occ-aggrid` internally**. Add it to the playground and
  Storybook too.

Build a milestone only when asked; do not start a milestone until the previous one is green.
Each milestone builds on the libraries from the earlier ones.

---

## What we are building

A single Angular CLI workspace that publishes reusable form-control libraries under the
`@op` npm scope, demoed by a playground app. The controls wrap PrimeNG primitives behind a
common `ControlValueAccessor` base so every control works with Angular reactive forms.

## Tech stack (pin exactly — do not upgrade)

- Angular **17** (NgModule-based, **NOT** standalone components), TypeScript ~5.3, RxJS 7
- **SCSS** for all styles
- **ng-packagr** for libraries (each builds to `dist/<name>`)
- **PrimeNG 17** + **PrimeIcons** + **Bootstrap 5** for UI primitives
- **@ngx-translate/core 14** for i18n — a `| translate` pipe must work in every template
- **Karma + Jasmine** (ChromeHeadless, code coverage) for unit tests
- ESLint + Prettier + Husky pre-commit

## Workspace layout

One workspace: single `angular.json`, root `package.json`, committed `package-lock.json`.
All libraries scoped `@op`. Create under `projects/`:

| Project            | Type        | Milestone                   | Role                                                                                       |
| ------------------ | ----------- | --------------------------- | ------------------------------------------------------------------------------------------ |
| `commonservices`   | library     | 1                           | Minimal: `SharedService` (`stateChange(bool)` Subject), shared tokens/models               |
| `op-i18n`          | library     | 1                           | Wraps @ngx-translate: `OpI18nModule` (exports `translate` pipe) + `OPi18nTranslateService` |
| `op-core-controls` | library     | 1                           | The 4 controls                                                                             |
| `ui-playground`    | application | 1 (extended each milestone) | Live demo: sidebar nav + a viewer page per feature                                         |
| `ui-playground-2`  | application | 2 (extended each milestone) | Storybook host + `*.stories.ts`                                                            |
| `op-aggrid`        | library     | 3                           | AG Grid 30 wrapper `occ-aggrid` + renderers + editors + sidebar filter panel + NgRx state  |
| `op-dynamic`       | library     | 4                           | `dynamic-aggrid` only — metadata-driven grid wrapping `occ-aggrid`                         |

**Build / dependency order (leftward deps):**
`commonservices → op-i18n → op-core-controls → op-aggrid → op-dynamic`
(apps `ui-playground` / `ui-playground-2` consume the built libs from `dist/`)

Keep `commonservices` and `op-i18n` intentionally minimal — only what the libraries need.

## Per-library packaging (apply to every library)

- `ng-package.json`:
  ```json
  {
    "dest": "../../dist/<name>",
    "lib": { "entryFile": "src/public-api.ts", "styleIncludePaths": ["./src/resources/styles"] }
  }
  ```
- `package.json`: `name` `@op/<short>`; Angular packages + sibling `@op/*` libs go in
  **`peerDependencies`** (never `dependencies`); only `tslib` in `dependencies`.
- `src/public-api.ts` — barrel re-exporting every public module / component / model.
- `tsconfig.lib.json`, `tsconfig.lib.prod.json`, `tsconfig.spec.json`, `karma.conf.js`, `README.md`.
- Root `tsconfig.json` `paths` map `@op/*` → `dist/*` so the app resolves built libs.

## Conventions (enforced by ESLint — match existing code)

- Control component selectors prefixed **`op-cc-`**; directives prefixed **`op`**.
- Interfaces **PascalCase, no `I` prefix**.
- One class per file; max ~1000 lines/file; **external `.html` + `.scss`** (inline only if ≤4 lines).
- Import order: Angular → third-party → relative.
- Every component/service ships a `.spec.ts`.

---

## op-core-controls — the control architecture (build exactly this)

Two-level abstract base lives in `src/lib/component/`:

### `base.control.value.accessor.ts`

`@Directive() abstract class BaseControlValueAccessor<T> implements ControlValueAccessor`:

- `@Input() control = new UntypedFormControl();`
- `@Input() set value(v: T)` / `get value()` — guard writes with lodash `isEqual`, then
  `control.setValue(v, { emitModelToViewChange: this._viewChange })`.
- `writeValue`, `registerOnChange`, `registerOnTouched`, `onChange`, `onTouched`.
- protected `viewChange` flag to optionally suppress model→view emit.

### `base-component.ts`

`@Directive() abstract class BaseComponent<T> extends BaseControlValueAccessor<T>
implements OnInit, AfterViewInit`. Also export from here / sibling files:

- `interface InputAttribute<T>` — attributeName, label, placeholder, disabled, options,
  value, state, validations, cssStyles{sizeClass, floatingClass}, …
- `interface ISelectItem { label?; value; styleClass?; icon?; disabled?; children?; }`
- `enum States` (hint, disabled, readonly, …) in `common-enum.ts`
- Common `@Input()`s: `label, placeholder, disabled (toggles control.disable/enable),
readonly, floating, floatingClass='op-float-md', sizeClass, customClass, isMandatory,
tooltip, appendTo='body', state, id (sets an automation-id attr on host)`.
- An `attribute` setter mapping an `InputAttribute<T>` onto the inputs above.
- `@Output('onClick'|'onChange'|'onBlur')` + `doClick / doChange / doBlur / onClearClick`.
- `defineMandatory()` (reads `validations` for a `required` rule) and `defineAutomationId()`
  (sets `automation-id` on the host element).

### Shared support (in op-core-controls)

- `op-cc-floating-label` component: label + mandatory `*` + tooltip wrapper around `<ng-content>`.
- `SharedDirectivesModule` exporting a `dropDownKeyboardSupport` directive (stub is fine).
- Re-use `SharedService` from commonservices and the `translate` pipe from op-i18n.

### The 4 controls — each is `*.component.ts` + `*.view.html` (or `.html`) + `.scss` + `.spec.ts` + `*.module.ts`

1. **`op-cc-dropdown`** — wraps PrimeNG `<p-dropdown>`. `extends BaseComponent<any>`.
   Inputs: `options: SelectItem[]` (optional alphabetical sort), `editable`, `showClear`,
   `isFilter`, `appendTo`, `itemTemplate`/`selectedItemTemplate: TemplateRef`, `isTypeAhead`,
   `selection` setter (delayed `writeValue` via `setTimeout(…,0)`). Template: floating-label
   wrapping `<p-dropdown [formControl]="control" optionLabel="label" optionValue="value"
[filter]="filter" (onChange)="doChange($event)" (onClick)="onClick($event)"
(onHide)="onDropdownHide($event)">` with item/selectedItem `ng-template`s using `| translate`,
   plus a custom clear icon shown when `hasValue()`. Module imports: CommonModule,
   Forms/ReactiveForms, OpCcFloatingLabelModule, primeng `DropdownModule`+`TooltipModule`,
   OpI18nModule, SharedDirectivesModule.

2. **`op-cc-input`** — wraps `<input pInputText>`. `extends BaseComponent<string>`.
   Inputs: `type`, `maxLength` + inherited control/label/mandatory/floating set.
   `(input)`→doChange, `(blur)`→doBlur. Floating-label wrapper.

3. **`op-cc-datepicker`** — wraps PrimeNG `<p-calendar>`. `extends BaseComponent<Date | Date[]>`.
   Inputs: `dateFormat`, `selectionMode` ('single'|'range'|'multiple'), `showTime`, `minDate`,
   `maxDate`, `showIcon=true`, `appendTo`. `[formControl]="control"`, `(onSelect)`/`(onBlur)`
   → doChange/doBlur. Floating-label + clear icon.

4. **`op-cc-multiselect-dropdown`** — wraps PrimeNG `<p-multiSelect>`. `extends BaseComponent<any[]>`.
   Inputs: `options`, `showToggleAll`, `showHeader`, `filter`, `maxSelectedLabels`,
   `display='comma'|'chip'`, custom item template. `(onChange)`→doChange, `(onPanelHide)`→doBlur.
   Floating-label wrapper.

Provide `op-core-controls.module.ts` aggregating + re-exporting all 4 control modules + the
floating-label + shared directives. List everything in `public-api.ts`.

**Specs per control** must cover: renders; value round-trips through the `FormControl`;
`onChange` emits; `disabled` and `isMandatory` are honored.

---

## ui-playground (demo app)

- Layout: header + categorized sidebar + footer.
- Routes: `/cores/dropdown`, `/cores/input`, `/cores/datepicker`, `/cores/multiselect`.
- Each viewer renders the control with **live, editable @Input controls** (toggle disabled,
  mandatory, floating, change options, etc.) and a **copyable code snippet**.
- `environments/environment(.prod).ts`, assets, global SCSS importing a PrimeNG theme +
  PrimeIcons + Bootstrap. `proxy.conf.json` if a backend stub is needed (optional this milestone).
- Imports the built libs from `dist/` (via the `@op/*` tsconfig paths).

---

## Commands

```bash
# build libs in dependency order (add op-aggrid/op-dynamic once those milestones land)
ng build commonservices && ng build op-i18n && ng build op-core-controls \
  && ng build op-aggrid && ng build op-dynamic

# serve the demo (after libs are built)
ng serve ui-playground --port 4200      # npm run start

# run Storybook (after libs are built)
npm run storybook

# unit tests (per lib, headless + coverage)
ng test op-core-controls --browsers=ChromeHeadless --watch=false --code-coverage
ng test op-aggrid       --browsers=ChromeHeadless --watch=false --code-coverage
ng test op-dynamic      --browsers=ChromeHeadless --watch=false --code-coverage

# lint / format
npm run lint
npm run prettify
```

Root `package.json` scripts to define: `build` (all libs in dependency order),
`build:prod` (`node --max_old_space_size=8192 …`, `-c production`), `start` (serve
playground), `storybook` / `storybook:build`, `test-all`, `lint`, `prettify`.

## Tooling & quality gates

- `.eslintrc.js` (@typescript-eslint + the prefix/naming/one-class rules), `.prettierrc.js`,
  `.editorconfig`; Husky pre-commit runs lint + prettier on staged files.
- Karma coverage configured per lib.

---

## Working agreement for the building agent

1. Print the full file tree, then scaffold the workspace + all 4 projects via
   `ng generate library` / `ng generate application`.
2. Implement in dependency order: `commonservices` → `op-i18n` → `op-core-controls`
   (**base classes first**, then floating-label + shared directives, then the 4 controls)
   → `ui-playground`.
3. After each library: `ng build <lib>` and `ng test <lib> --browsers=ChromeHeadless
--watch=false` — **report pass/fail before moving on**.
4. Keep a running checklist (done vs pending). Pick sensible defaults for anything
   ambiguous and note the choice; only ask when truly blocking.
5. No `// TODO` stubs in delivered code — everything compiles and runs.

---

## Milestone 2 — Storybook host (`ui-playground-2`)

**Only start this after Milestone 1 builds and tests green.** Add a Storybook application
that documents the `op-core-controls` controls. Do NOT add AG Grid or any new control library.

### Setup

- Add `ui-playground-2` as an Angular **application** project in the same workspace.
- Use **Storybook 8** with `@storybook/angular` (+ `@storybook/addon-essentials`,
  `addon-interactions`, `addon-a11y`, `addon-docs`).
- `.storybook/` folder containing:
  - `main.ts` — `StorybookConfig`: `framework: '@storybook/angular'`, `stories` globs
    pointing at `ui-playground-2/src/**/*.stories.ts`, addons list, and a `webpackFinal`
    that resolves the built libs from `dist/` (source-map-loader for `dist/op-*` and
    `node_modules/@op` in dev only).
  - `preview.ts` — global decorators/parameters: import `BrowserAnimationsModule`, the
    op-i18n translate setup, and global SCSS (PrimeNG theme + PrimeIcons + Bootstrap).
  - `manager.ts` + `theme.ts` — custom branded Storybook theme.
  - `shared-imports.ts` — a reusable array of NgModules (`OpCoreControlsModule`,
    translate, forms, animations) imported via `moduleMetadata` in stories.
- Add an `angular.json` target so `ng run ui-playground-2:storybook` and
  `ng run ui-playground-2:build-storybook` work.

### Stories — one `*.stories.ts` per control

Create stories for all four controls, each with `argTypes` covering every `@Input`
(so the Storybook Controls panel drives them live):

- `op-cc-dropdown.stories.ts` — options, showClear, editable, isMandatory, disabled, floating.
- `op-cc-input.stories.ts` — type, maxLength, placeholder, isMandatory, disabled, floating.
- `op-cc-datepicker.stories.ts` — selectionMode, dateFormat, showTime, showIcon, minDate/maxDate.
- `op-cc-multiselect-dropdown.stories.ts` — options, display (comma/chip), showToggleAll, filter.

Each story uses `moduleMetadata` (from `shared-imports.ts`) so the control renders with its
real module, the translate pipe, and reactive-forms wiring. Include at least a `Default` and
one variant (e.g. `Mandatory`, `Disabled`, or `Prefilled`) per control. Add a `Docs` page via
`autodocs` tag.

### Commands (add to root scripts)

```bash
npm run storybook            # ng run ui-playground-2:storybook
npm run storybook:build      # ng run ui-playground-2:build-storybook --output-dir=dist/storybook
```

### Milestone 2 working agreement

1. Confirm Milestone 1 libs are built (`dist/op-core-controls` exists).
2. Add the Storybook app + config, then the four `*.stories.ts`.
3. Run `npm run storybook` and confirm it compiles and all four controls render with working
   Controls panels. Report result.
4. No `// TODO` stubs; everything runs.

---

## Milestone 3 — `op-aggrid` (AG Grid wrapper + sidebar filter panel)

**Only start after Milestones 1–2 are green.** A library that wraps AG Grid 30 behind an
`occ-aggrid` component, with cell renderers, cell editors, a sidebar filter panel, and
NgRx-backed column + filter state. Depends on `op-core-controls`, `op-i18n`, `commonservices`.

### AG Grid packages (modular — register modules explicitly, do NOT use ag-grid-community all-in-one)

- `@ag-grid-community/angular`, `@ag-grid-community/core`,
  `@ag-grid-community/client-side-row-model`, `@ag-grid-community/infinite-row-model`,
  `@ag-grid-community/csv-export`, `@ag-grid-community/styles`
- Enterprise (for sidebar/tool panels & set filter): `@ag-grid-enterprise/core`,
  `@ag-grid-enterprise/menu`, `@ag-grid-enterprise/row-grouping`,
  `@ag-grid-enterprise/set-filter`, `@ag-grid-enterprise/side-bar`,
  `@ag-grid-enterprise/column-tool-panel`, `@ag-grid-enterprise/filter-tool-panel`,
  `@ag-grid-enterprise/range-selection`, `@ag-grid-enterprise/server-side-row-model`

### Library structure (`op-aggrid/src/lib/`)

- `OpAgGridModule.module.ts` — root module. Registers `StoreModule.forFeature(
AG_GRID_CONTROLS_KEY, gridControlsReducers)` and `StoreModule.forFeature(
SIDEBAR_FILTER_KEY, sidebarFilterReducers)` (keys come from `commonservices`). Declares +
  exports `occ-aggrid`, all renderers/editors, and the sidebar-filter components. Imports
  `OpCoreControlsModule`, `OpI18nModule`.
- `components/occ-aggrid/` — the `occ-aggrid` component (`.ts/.html/.scss/.spec.ts/.module.ts`):
  - Inputs: `id`, `treeData`, `columnDefs: OpColDef[]` (**required**), `sidebarDef: OpSideBarDef`,
    `frameworkComponents` (map of renderers/editors), `gridOptions: GridOptions`, `rowData`,
    `needQuickFilter`, `pagination`.
  - Outputs: `gridReady`, `rowSelected`, `selectionChanged`, `sortChanged`, `columnMoved`,
    `columnResized`, `cellValueChanged`, `cellClicked`, plus filter-panel events:
    `onFilterSelectionChange`, `onApplyFilter`, `dataNeeded`, `onClearAll`, `savedFilterData`.
  - On `gridReady`: restore saved `ColumnState[]` from the grid-controls store by `id`; on
    column move/resize/visible, dispatch to persist. Wraps `<ag-grid-angular>` in the template.
- `models/` — `OpColDef` (extends AG Grid `ColDef`), `OpSideBarDef` (extends `SideBarDef`),
  `AgGridControls` (`{ id; agGridControls: ColumnState[]; agGridPagination }`), `KVPair`,
  grid action/option models.
- `renderers/` — each implements `ICellRendererAngularComp`, registered as framework
  components. Build at least: `text-color` (colored text by value), `action` (row action
  buttons → emits via a grid service), `checkbox`, `occ-dropdown` (reuses `op-cc-dropdown`).
- `cell-editors/` — each implements `ICellEditorAngularComp`: `text-editor`,
  `numeric-editor`, `occ-dropdown-editor` (reuses `op-cc-dropdown`).
- `services/` — `AgGridStateService` (column-state save/restore), `SidePanelEventService`
  (tool-panel open/close events), `SidebarVisibilityService`.
- `store/` — `grid-controls` (@ngrx/entity adapter + actions + reducer + selectors for
  per-grid column state) and `store/sidebar-filter/` (actions/adapter/selectors for applied
  - saved filters).

### Sidebar filter panel (`op-aggrid/src/lib/sidebar-panels/`) — REQUIRED

- `generic-aggrid-confg.provider.ts` — a `GenericAggridConfgProvider` that builds an AG Grid
  `SideBarDef` (`OpSideBarDef`) wiring custom tool panels: a **filter panel**, a **columns
  panel**, and a **groupby panel**. The provider creates the panel components via
  `createComponent`/`EnvironmentInjector` and passes `filterMeta` etc. through tool-panel params.
- `filter-panel/components/`:
  - `filter-sidebar/occ-filter-sidebar.component.ts` (`selector: occ-filter-sidebar`) — the
    main filter side panel. Inputs: `filterMeta: KVPair[]`, `filterBarPanelId`,
    `filterModuleName`, `filterPanelName`, `systemDefinedFilters`, `enableStickyFilters`,
    `applySelectedFilter`. Outputs: `onSelectionChange`, `onApplyFilter`, `dataNeeded`,
    `onClearAll`, `savedFilterData`. Renders a form of `op-core-controls` (dropdown,
    multiselect, input, datepicker) driven by `filterMeta`, with Apply / Clear-All actions.
  - `occ-filter-sidebar-form/` — the dynamic form body for the filter fields.
  - `saved-filters-sidebar/`, `save-configuration-sidebar/`, `titlebar/`, `require-info/`.
  - `models/` (KVPair, save-filter, preselected-filter-values), `constants/`, `pipes/`, `services/`
    (`SavedFilterService`, `StickyFilterService`).
- `columns-panel/` and `groupby-panel/` — column show/hide/reorder panel and group-by panel
  (keep these lighter than the filter panel; the filter panel is the priority deliverable).

### Playground + Storybook for Milestone 3

- `ui-playground`: add a `/grid` viewer — sample JSON `rowData`, `OpColDef[]` demonstrating
  the renderers + editors, the sidebar filter panel open with a few `filterMeta` fields, and
  live toggles. Add it to the sidebar nav.
- `ui-playground-2`: add `occ-aggrid.stories.ts` with a Default story (renderers + editors)
  and a `WithSidebarFilter` story (sidebar filter panel applied), using `moduleMetadata` with
  `OpAgGridModule` + `StoreModule.forRoot({})`.

### Milestone 3 working agreement

1. Build the renderers/editors and `occ-aggrid` first; verify a basic grid renders.
2. Then add the NgRx stores + column-state persistence.
3. Then the sidebar filter panel + the generic config provider.
4. `ng build op-aggrid` + `ng test op-aggrid --browsers=ChromeHeadless --watch=false`; then
   verify the `/grid` viewer and the grid stories. Report pass/fail.

---

## Milestone 4 — `op-dynamic` (dynamic-aggrid only, wrapping op-aggrid)

**Only start after Milestone 3 is green.** A library exposing **only the `dynamic-aggrid`
feature** — a metadata-driven grid that **renders `op-aggrid`'s `<occ-aggrid>` internally**
as its wrapper. Do NOT port any other op-dynamic feature (no dynamic-form, dynamic-filter,
dynamic-grid). Depends on `op-aggrid` (and transitively the rest).

### Structure (`op-dynamic/src/lib/dynamic-aggrid/`)

- `op-dynamic-aggrid.module.ts` — imports `OpAgGridModule` (from `@op/aggrid`),
  `OpCoreControlsModule`, `OpI18nModule`. Declares + exports `dynamic-aggrid`.
- `components/dynamic-aggrid/dynamic-aggrid.component.ts` (`.html/.scss/.spec.ts`):
  - **Metadata-driven inputs**: `colsMeta: OpColDef[]` (column metadata → mapped to
    `columnDefs`), `rowsMeta: any[]` (row data), `rowModelType` ('clientSide' | 'infinite' |
    'serverSide'), `rowSelection`, `paginationPageSize`, `cacheBlockSize`,
    `enableServerSideSorting`, `enableServerSideFilter`, `defaultColDef`, `headerCheckboxSelection`,
    `id`, plus a `filterMeta`/`sidebarDef` passthrough for the sidebar filter panel.
  - Outputs: `gridReady`, `selectionChanged`, `cellValueChanged`, `fetchData` (for
    server-side/infinite data requests), filter passthrough events.
  - **Internally renders `<occ-aggrid>`** in its template, mapping the metadata into
    `occ-aggrid`'s `columnDefs` / `gridOptions` / `frameworkComponents` / `sidebarDef`. The
    dynamic layer's job is config-from-metadata; `occ-aggrid` does the actual grid wrapping.
  - Reuses op-aggrid renderers/editors (e.g. `NumericEditorComponent`) by referencing them
    in the framework-components map built from `colsMeta`.
- `dynamic-aggrid.service.ts` — builds `OpColDef[]` from `colsMeta`, resolves
  renderer/editor per column type, assembles `GridOptions`. + spec.
- `dynamic-aggrid.model.ts` — the column-metadata interfaces (field, headerName, type:
  'text'|'number'|'dropdown'|'checkbox'|'date', editable, renderer, editorParams, options…).
- A small `cell-editors/` / `cell-renderers/` only if a dynamic-specific one is needed
  (e.g. a `header-checkbox` renderer); otherwise reuse op-aggrid's.

### Playground + Storybook for Milestone 4

- `ui-playground`: add a `/dynamic-grid` viewer that feeds `colsMeta` + `rowsMeta` JSON and
  shows the grid built purely from metadata, including the sidebar filter panel. Add to nav.
- `ui-playground-2`: add `dynamic-aggrid.stories.ts` with a metadata-driven Default story and
  a `WithServerSide`/`WithSidebarFilter` variant, via `moduleMetadata` with
  `OpDynamicAggridModule` + `StoreModule.forRoot({})`.

### Milestone 4 working agreement

1. Confirm `dist/op-aggrid` exists.
2. Build the metadata model + service (colsMeta → columnDefs), then the `dynamic-aggrid`
   component rendering `<occ-aggrid>`.
3. `ng build op-dynamic` + `ng test op-dynamic --browsers=ChromeHeadless --watch=false`;
   then verify the `/dynamic-grid` viewer and the dynamic stories render from metadata. Report.

---

## Out of scope for ALL milestones (do NOT build)

- Any `op-dynamic` feature other than `dynamic-aggrid` (no dynamic-form, dynamic-filter,
  dynamic-grid, bulk-edit).
- Other libraries from the reference monorepo (op-filters, op-topbar, op-components, etc.).
- Compodoc docs, SonarQube, CI/CD pipeline, Docker.

These are intentionally excluded; leave the architecture extensible for them but do not
implement them.
