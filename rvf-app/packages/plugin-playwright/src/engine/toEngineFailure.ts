import type { ActionType, EngineFailure } from '@rippleview/core';
import { StepAssertionError, StepExecutionError } from '@rippleview/core';

/**
 * Converts a caught step failure into the `EngineFailure` shape (
 * AC3: "the specific failing step surfaced in the result").
 *
 * G10: findings are data — never leak the caught `Error` instance itself
 * into the result; every field a caller needs is copied out here.
 *
 * Three cases, in order of specificity:
 *  - `StepAssertionError`: an assertion's actual value didn't match its
 *    expected value — `actual`/`expected` are populated alongside
 *    `stepText`/`action`/`message`.
 *  - `StepExecutionError` (any other kind): the step could not be performed
 *    at all — only `stepText`/`action`/`message`.
 *  - Anything else that escaped (shouldn't normally happen, since
 *    `PlaywrightStepExecutor` wraps everything in `StepExecutionError`, but
 *    defended against anyway): falls back to whatever `stepText`/`message`
 *    are available, with a best-effort `action`, rather than crashing the
 *    whole run.
 */
export function toEngineFailure(
  stepText: string,
  fallbackAction: ActionType,
  error: unknown,
): EngineFailure {
  if (error instanceof StepAssertionError) {
    return {
      stepText: error.stepText,
      action: error.action,
      message: error.message,
      actual: error.actual,
      expected: error.expected,
    };
  }

  if (error instanceof StepExecutionError) {
    return {
      stepText: error.stepText,
      action: error.action,
      message: error.message,
    };
  }

  return {
    stepText,
    action: fallbackAction,
    message: error instanceof Error ? error.message : String(error),
  };
}
