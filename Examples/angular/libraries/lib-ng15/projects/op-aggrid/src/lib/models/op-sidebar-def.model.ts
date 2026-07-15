import { SideBarDef } from '@ag-grid-community/core';

/**
 * `@op` side-bar definition. Extends AG Grid's `SideBarDef` so callers can pass the
 * standard tool-panel config plus the extra context the `@op` panels read.
 */
export interface OpSideBarDef extends SideBarDef {
  /** Identifier of the owning filter bar panel (threaded to the filter sidebar). */
  filterBarPanelId?: string;
  /** Module name shown/used by the saved-filter service. */
  filterModuleName?: string;
}
