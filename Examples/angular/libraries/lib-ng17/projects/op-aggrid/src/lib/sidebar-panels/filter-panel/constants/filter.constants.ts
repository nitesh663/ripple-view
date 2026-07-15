/** Well-known tool-panel ids used by the side bar. */
export const OP_PANEL_IDS = {
  filters: 'opFilters',
  columns: 'opColumns',
  groupBy: 'opGroupBy',
} as const;

/** Default labels (translate keys) for the sidebar filter panel actions. */
export const FILTER_PANEL_LABELS = {
  apply: 'grid.filter.apply',
  clearAll: 'grid.filter.clearAll',
  save: 'grid.filter.save',
  savedFilters: 'grid.filter.savedFilters',
  title: 'grid.filter.title',
} as const;
