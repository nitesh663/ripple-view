import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SIDEBAR_FILTER_KEY } from '@op/commonservices';

import { SidebarFilterFeatureState } from './sidebar-filter.reducer';
import { appliedFilterAdapter, savedFilterAdapter } from './sidebar-filter.state';

const selectFeature = createFeatureSelector<SidebarFilterFeatureState>(SIDEBAR_FILTER_KEY);

const selectAppliedState = createSelector(selectFeature, (s) => s.applied);
const selectSavedState = createSelector(selectFeature, (s) => s.saved);

const applied = appliedFilterAdapter.getSelectors();
const saved = savedFilterAdapter.getSelectors();

/** All saved filters. */
export const selectAllSavedFilters = createSelector(selectSavedState, saved.selectAll);

/** Applied-filter entities keyed by panel id. */
export const selectAppliedFilterEntities = createSelector(selectAppliedState, applied.selectEntities);

/** Applied filter values for a specific panel. */
export const selectAppliedFilterByPanel = (panelId: string) =>
  createSelector(selectAppliedFilterEntities, (entities) => entities[panelId]?.values ?? {});

/** Saved filters scoped to a specific panel. */
export const selectSavedFiltersByPanel = (panelId: string) =>
  createSelector(selectAllSavedFilters, (filters) =>
    filters.filter((f) => f.filterBarPanelId === panelId),
  );
