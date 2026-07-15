# @op/aggrid

AG Grid 30 wrapper for the `@op` library suite. Provides:

- **`occ-aggrid`** — an Angular component wrapping `<ag-grid-angular>` (modular AG Grid 30).
- **Cell renderers** — `text-color`, `action`, `checkbox`, `occ-dropdown` (reuses `op-cc-dropdown`).
- **Cell editors** — `text-editor`, `numeric-editor`, `occ-dropdown-editor`.
- **Sidebar filter panel** — a custom AG Grid tool panel built from `op-core-controls` form
  controls and driven by `filterMeta`, plus columns and group-by panels.
- **NgRx state** — per-grid `ColumnState[]` persistence (`grid-controls`) and applied/saved
  filters (`sidebar-filter`).

## Modular AG Grid

This library uses the **modular** AG Grid 30 packages (`@ag-grid-community/*` +
`@ag-grid-enterprise/*`) and registers modules explicitly via `ModuleRegistry`. It does **not**
use the `ag-grid-community` all-in-one bundle.

## Usage

```ts
import { OpAgGridModule } from '@op/aggrid';

@NgModule({ imports: [OpAgGridModule, StoreModule.forRoot({})] })
export class AppModule {}
```

```html
<occ-aggrid
  [id]="'orders'"
  [columnDefs]="cols"
  [rowData]="rows"
  [sidebarDef]="sidebar"
></occ-aggrid>
```

Depends on `@op/core-controls`, `@op/i18n`, `@op/commonservices`.
