import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AG_GRID_CONTROLS_KEY } from '@op/commonservices';

import { GridControlsFeatureState } from './grid-controls.reducer';
import { gridControlsAdapter } from './grid-controls.state';

const selectFeature = createFeatureSelector<GridControlsFeatureState>(AG_GRID_CONTROLS_KEY);

const selectControlsState = createSelector(selectFeature, (s) => s.controls);

const { selectEntities, selectAll } = gridControlsAdapter.getSelectors();

/** All persisted grid-controls entries. */
export const selectAllGridControls = createSelector(selectControlsState, selectAll);

/** Map of grid-controls entries keyed by grid id. */
export const selectGridControlsEntities = createSelector(selectControlsState, selectEntities);

/** Column state for a specific grid id. */
export const selectColumnStateById = (id: string) =>
  createSelector(selectGridControlsEntities, (entities) => entities[id]?.agGridControls ?? []);

/** Pagination for a specific grid id. */
export const selectPaginationById = (id: string) =>
  createSelector(selectGridControlsEntities, (entities) => entities[id]?.agGridPagination);
