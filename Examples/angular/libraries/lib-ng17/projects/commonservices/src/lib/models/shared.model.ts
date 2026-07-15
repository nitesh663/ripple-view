/**
 * Shared models/types consumed across the @op libraries.
 * Kept intentionally minimal for Milestone 1.
 */

/** Validation rule descriptor used by controls to derive mandatory/format state. */
export interface ValidationRule {
  /** Rule name, e.g. 'required', 'minlength', 'pattern'. */
  name: string;
  /** Optional rule value (e.g. the pattern, the min length). */
  value?: unknown;
  /** Optional message key (resolved through translation). */
  message?: string;
}

/** Generic key/value style map applied to a control's host. */
export interface CssStyles {
  /** Bootstrap/utility size class, e.g. 'col-6'. */
  sizeClass?: string;
  /** Floating-label modifier class, e.g. 'op-float-md'. */
  floatingClass?: string;
  /** Any additional custom class. */
  customClass?: string;
}

/** Lightweight description of a control's current interaction state. */
export interface ControlStateChange {
  /** Whichever attribute/control changed. */
  attributeName?: string;
  /** New state flag value. */
  state?: boolean;
}
