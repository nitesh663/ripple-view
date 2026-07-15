import { EntityState, createEntityAdapter } from '@ngrx/entity';

/** A saved, named filter configuration for a given filter-bar panel. */
export interface SavedFilter {
  /** Unique id of the saved filter. */
  id: string;
  /** Owning filter-bar panel id. */
  filterBarPanelId: string;
  /** Display name. */
  name: string;
  /** Serialized filter values keyed by field. */
  values: Record<string, unknown>;
  /** Whether this is the user's default for the panel. */
  isDefault?: boolean;
  /** Whether the filter is system-defined (read-only). */
  systemDefined?: boolean;
}

/** Applied (active) filter values per filter-bar panel. */
export interface AppliedFilter {
  /** Owning filter-bar panel id (entity key). */
  filterBarPanelId: string;
  /** Currently applied values keyed by field. */
  values: Record<string, unknown>;
}

export type AppliedFilterState = EntityState<AppliedFilter>;
export type SavedFilterEntityState = EntityState<SavedFilter>;

export const appliedFilterAdapter = createEntityAdapter<AppliedFilter>({
  selectId: (f) => f.filterBarPanelId,
});

export const savedFilterAdapter = createEntityAdapter<SavedFilter>({
  selectId: (f) => f.id,
});

export const initialAppliedFilterState: AppliedFilterState = appliedFilterAdapter.getInitialState();
export const initialSavedFilterState: SavedFilterEntityState = savedFilterAdapter.getInitialState();
