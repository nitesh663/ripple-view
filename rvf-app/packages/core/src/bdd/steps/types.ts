export type ActionType =
  | 'navigate'
  | 'scope-region'
  | 'assert-mounted'
  | 'seed-data'
  | 'activate'
  | 'type-into'
  | 'select-option'
  | 'toggle'
  | 'expand'
  | 'hover'
  | 'focus'
  | 'press-key'
  | 'double-click'
  | 'right-click'
  | 'click-menu-item'
  | 'scroll-to'
  | 'scroll-page'
  | 'clear-field'
  | 'drag-to'
  | 'check'
  | 'uncheck'
  | 'assert-visible'
  | 'assert-enabled'
  | 'assert-disabled'
  | 'assert-text'
  | 'assert-selection'
  | 'assert-count'
  | 'assert-no-overlap'
  | 'assert-in-viewport'
  | 'assert-attribute'
  | 'assert-url'
  | 'assert-api-called'
  | 'assert-api-status'
  | 'assert-api-body-contains'
  | 'accept-dialog'
  | 'dismiss-dialog'
  | 'switch-to-new-tab';

/** The result of matching a step text against the registry. */
export interface StepMatch {
  action: ActionType;
  params: Record<string, string | number>;
}

/**
 * A single entry in the step catalog: a pattern to match against step text
 * and a function to extract typed params from the regex groups.
 */
export interface StepPattern {
  pattern: RegExp;
  action: ActionType;
  extractParams(match: RegExpExecArray): Record<string, string | number>;
}
