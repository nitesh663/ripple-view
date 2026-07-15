/** Payload emitted when the user saves a filter configuration. */
export interface SaveFilterPayload {
  /** Display name entered by the user. */
  name: string;
  /** Owning filter-bar panel id. */
  filterBarPanelId: string;
  /** The filter field values being saved. */
  values: Record<string, unknown>;
  /** Mark this saved filter as the panel default. */
  isDefault?: boolean;
}

/** A preselected value to seed a filter field with on open. */
export interface PreselectedFilterValue {
  /** Field key matching a `KVPair.key`. */
  key: string;
  /** Value to preselect. */
  value: unknown;
}
