import { createAction, props } from '@ngrx/store';
import { ColumnState } from '@ag-grid-community/core';

import { AgGridControls, AgGridPagination } from '../../models/ag-grid-controls.model';

/** Persist (upsert) the full column-state snapshot for a grid. */
export const saveGridColumnState = createAction(
  '[Op Grid Controls] Save Column State',
  props<{ id: string; agGridControls: ColumnState[] }>(),
);

/** Persist pagination settings for a grid. */
export const saveGridPagination = createAction(
  '[Op Grid Controls] Save Pagination',
  props<{ id: string; agGridPagination: AgGridPagination }>(),
);

/** Replace the whole controls entry for a grid. */
export const upsertGridControls = createAction(
  '[Op Grid Controls] Upsert Controls',
  props<{ controls: AgGridControls }>(),
);

/** Clear persisted controls for a grid. */
export const clearGridControls = createAction(
  '[Op Grid Controls] Clear Controls',
  props<{ id: string }>(),
);
