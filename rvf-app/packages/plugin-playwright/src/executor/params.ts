import type { StepMatch } from '@rippleview/core';

// Shared typed-param accessors for the action/assertion handler files —
// StepMatch.params is `Record<string, string | number>` (core stays
// agnostic of which concrete shape each ActionType actually carries), so
// every handler narrows the field it expects through one of these.

export function str(params: StepMatch['params'], key: string): string {
  return String(params[key] ?? '');
}

export function num(params: StepMatch['params'], key: string): number {
  return Number(params[key] ?? 0);
}
