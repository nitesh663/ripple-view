import { Action, ActionReducerMap, createReducer, on } from '@ngrx/store';

import {
  applyFilter,
  clearAppliedFilter,
  loadSavedFilters,
  removeSavedFilter,
  upsertSavedFilter,
} from './sidebar-filter.actions';
import {
  AppliedFilterState,
  SavedFilterEntityState,
  appliedFilterAdapter,
  initialAppliedFilterState,
  initialSavedFilterState,
  savedFilterAdapter,
} from './sidebar-filter.state';

const appliedReducer = createReducer(
  initialAppliedFilterState,
  on(applyFilter, (state, { filterBarPanelId, values }) =>
    appliedFilterAdapter.upsertOne({ filterBarPanelId, values }, state),
  ),
  on(clearAppliedFilter, (state, { filterBarPanelId }) =>
    appliedFilterAdapter.removeOne(filterBarPanelId, state),
  ),
);

const savedReducer = createReducer(
  initialSavedFilterState,
  on(upsertSavedFilter, (state, { filter }) => savedFilterAdapter.upsertOne(filter, state)),
  on(loadSavedFilters, (state, { filters }) => savedFilterAdapter.setAll(filters, state)),
  on(removeSavedFilter, (state, { id }) => savedFilterAdapter.removeOne(id, state)),
);

export function appliedFilterReducer(state: AppliedFilterState | undefined, action: Action): AppliedFilterState {
  return appliedReducer(state, action);
}

export function savedFilterReducer(state: SavedFilterEntityState | undefined, action: Action): SavedFilterEntityState {
  return savedReducer(state, action);
}

/** Feature state registered under `SIDEBAR_FILTER_KEY`. */
export interface SidebarFilterFeatureState {
  applied: AppliedFilterState;
  saved: SavedFilterEntityState;
}

export const sidebarFilterReducers: ActionReducerMap<SidebarFilterFeatureState> = {
  applied: appliedFilterReducer,
  saved: savedFilterReducer,
};
