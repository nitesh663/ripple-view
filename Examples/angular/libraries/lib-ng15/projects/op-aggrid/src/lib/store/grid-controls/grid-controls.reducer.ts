import { ActionReducerMap, createReducer, on } from '@ngrx/store';

import {
  clearGridControls,
  saveGridColumnState,
  saveGridPagination,
  upsertGridControls,
} from './grid-controls.actions';
import {
  GridControlsState,
  gridControlsAdapter,
  initialGridControlsState,
} from './grid-controls.state';

const reducer = createReducer(
  initialGridControlsState,
  on(saveGridColumnState, (state, { id, agGridControls }) => {
    const existing = state.entities[id];
    return gridControlsAdapter.upsertOne(
      { id, agGridControls, agGridPagination: existing?.agGridPagination },
      state,
    );
  }),
  on(saveGridPagination, (state, { id, agGridPagination }) => {
    const existing = state.entities[id];
    return gridControlsAdapter.upsertOne(
      { id, agGridControls: existing?.agGridControls ?? [], agGridPagination },
      state,
    );
  }),
  on(upsertGridControls, (state, { controls }) => gridControlsAdapter.upsertOne(controls, state)),
  on(clearGridControls, (state, { id }) => gridControlsAdapter.removeOne(id, state)),
);

export function gridControlsReducer(
  state: GridControlsState | undefined,
  action: import('@ngrx/store').Action,
): GridControlsState {
  return reducer(state, action);
}

/** Feature-level reducer map registered under `AG_GRID_CONTROLS_KEY`. */
export interface GridControlsFeatureState {
  controls: GridControlsState;
}

export const gridControlsReducers: ActionReducerMap<GridControlsFeatureState> = {
  controls: gridControlsReducer,
};
