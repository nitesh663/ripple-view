# @op/dynamic

Metadata-driven grid for the `@op` library suite. Exposes **only** the
`dynamic-aggrid` feature — a component that builds its configuration from column
metadata and **renders `@op/aggrid`'s `<occ-aggrid>` internally** as its wrapper.

The dynamic layer's job is _config-from-metadata_: it maps `colsMeta` into
`occ-aggrid`'s `columnDefs` / `gridOptions` / `frameworkComponents` / `sidebarDef`
and reuses op-aggrid's renderers and editors. `occ-aggrid` does the actual grid
wrapping; this library does not re-implement it.

## Usage

```ts
import { OpDynamicAggridModule } from '@op/dynamic';

@NgModule({ imports: [OpDynamicAggridModule, StoreModule.forRoot({})] })
export class AppModule {}
```

```html
<dynamic-aggrid
  [id]="'orders'"
  [colsMeta]="cols"
  [rowsMeta]="rows"
  [filterMeta]="filterMeta"
  rowModelType="clientSide"
></dynamic-aggrid>
```

Depends on `@op/aggrid` (and transitively `@op/core-controls`, `@op/i18n`,
`@op/commonservices`).

> Scope: this library deliberately ships **only** `dynamic-aggrid` — no
> dynamic-form, dynamic-filter, dynamic-grid or bulk-edit.
