/**
 * Generic key/value descriptor used throughout the grid and sidebar filter panel.
 * `key` is the machine field name; `value` the human label; the rest configure how
 * the value is edited in the filter form.
 */
export interface KVPair {
  /** Machine field name (matches a column field / filter param key). */
  key: string;
  /** Display label (resolved through the translate pipe). */
  value: string;
  /** Control type used to edit this field in the sidebar filter form. */
  type?: FilterControlType;
  /** Options for dropdown/multiselect control types. */
  options?: KVOption[];
  /** Currently selected value(s). */
  selected?: unknown;
  /** Placeholder text for the control. */
  placeholder?: string;
  /** Whether the field is mandatory in the filter form. */
  mandatory?: boolean;
  /** Whether the field is disabled. */
  disabled?: boolean;
  /** Free-form extra metadata. */
  meta?: Record<string, unknown>;
}

/** Option entry for dropdown/multiselect filter controls. */
export interface KVOption {
  label: string;
  value: unknown;
}

/** Supported control types rendered by the sidebar filter form. */
export type FilterControlType = 'dropdown' | 'multiselect' | 'input' | 'datepicker';
