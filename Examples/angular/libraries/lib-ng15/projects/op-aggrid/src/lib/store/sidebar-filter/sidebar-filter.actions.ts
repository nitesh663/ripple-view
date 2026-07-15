import { createAction, props } from '@ngrx/store';

import { SavedFilter } from './sidebar-filter.state';

/** Apply (set) the active filter values for a panel. */
export const applyFilter = createAction(
  '[Op Sidebar Filter] Apply Filter',
  props<{ filterBarPanelId: string; values: Record<string, unknown> }>(),
);

/** Clear the active filter values for a panel. */
export const clearAppliedFilter = createAction(
  '[Op Sidebar Filter] Clear Applied Filter',
  props<{ filterBarPanelId: string }>(),
);

/** Add or update a saved filter. */
export const upsertSavedFilter = createAction(
  '[Op Sidebar Filter] Upsert Saved Filter',
  props<{ filter: SavedFilter }>(),
);

/** Load a batch of saved filters (e.g. from a backend). */
export const loadSavedFilters = createAction(
  '[Op Sidebar Filter] Load Saved Filters',
  props<{ filters: SavedFilter[] }>(),
);

/** Remove a saved filter by id. */
export const removeSavedFilter = createAction(
  '[Op Sidebar Filter] Remove Saved Filter',
  props<{ id: string }>(),
);
