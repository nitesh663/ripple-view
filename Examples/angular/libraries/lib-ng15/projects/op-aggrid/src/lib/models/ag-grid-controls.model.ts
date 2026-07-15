import { ColumnState } from '@ag-grid-community/core';

/**
 * Persisted per-grid control state: the column layout (order/width/visibility/sort)
 * and pagination settings, keyed by the grid `id`. Stored in the grid-controls NgRx
 * slice and restored on `gridReady`.
 */
export interface AgGridControls {
  /** Grid identifier (matches `occ-aggrid`'s `id` input). */
  id: string;
  /** AG Grid column state snapshot. */
  agGridControls: ColumnState[];
  /** Optional persisted pagination settings. */
  agGridPagination?: AgGridPagination;
}

/** Pagination snapshot persisted alongside column state. */
export interface AgGridPagination {
  pageSize?: number;
  currentPage?: number;
}
