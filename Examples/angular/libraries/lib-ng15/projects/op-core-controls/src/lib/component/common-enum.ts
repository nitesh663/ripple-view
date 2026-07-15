/**
 * Interaction/visual states a control can present.
 * Kept as a string enum so values are readable in templates and the playground.
 */
export enum States {
  Default = 'default',
  Hint = 'hint',
  Disabled = 'disabled',
  Readonly = 'readonly',
  Error = 'error',
  Success = 'success',
  Warning = 'warning',
}

/** Selection modes shared by date-like controls. */
export enum SelectionMode {
  Single = 'single',
  Range = 'range',
  Multiple = 'multiple',
}
