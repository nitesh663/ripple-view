import { EntityState, createEntityAdapter } from '@ngrx/entity';

import { AgGridControls } from '../../models/ag-grid-controls.model';

/** Entity slice of per-grid column/pagination controls, keyed by grid id. */
export type GridControlsState = EntityState<AgGridControls>;

/** Adapter selecting the grid `id` as the entity key. */
export const gridControlsAdapter = createEntityAdapter<AgGridControls>({
  selectId: (entity) => entity.id,
});

export const initialGridControlsState: GridControlsState = gridControlsAdapter.getInitialState();
