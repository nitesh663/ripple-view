import type { ActionType } from '../types.js';

/**
 * Error hierarchy for StepExecutor failures ( AC2/AC3).
 *
 * G1:  framework-agnostic data classes — no Playwright (or any other
 *      framework) import here; these live in core deliberately so a
 *      caller can catch/inspect them without depending on a specific
 *      plugin.
 * G10: findings are data — every field needed to trace a failure back to
 *      its exact step text + action is a typed, readable property, not
 *      buried in a generic `Error.message` string.
 */

/**
 * Thrown when a StepExecutor cannot perform an action or assertion at all
 * (e.g. a Playwright timeout resolving an element, an unsupported
 * ActionType). Wraps whatever was actually thrown in `cause`, while always
 * attaching the failing step's text and action so the failure can be
 * traced to its root cause (AC3) regardless of what specifically went
 * wrong underneath.
 */
export class StepExecutionError extends Error {
  constructor(
    readonly stepText: string,
    readonly action: ActionType,
    override readonly cause: unknown,
  ) {
    super(`Step execution failed: "${stepText}" (action: ${action}) — ${String(cause)}`);
    this.name = 'StepExecutionError';
  }
}

/**
 * Thrown specifically when an assertion's actual value does not match its
 * expected value (AC2: "a typed error carrying actual vs expected").
 * Extends StepExecutionError — an assertion failure is a specific kind of
 * step failure, so callers that only care about "did the step fail" can
 * still catch StepExecutionError and get every field this class adds.
 */
export class StepAssertionError extends StepExecutionError {
  constructor(
    stepText: string,
    action: ActionType,
    readonly actual: unknown,
    readonly expected: unknown,
    message?: string,
  ) {
    super(stepText, action, message ?? `expected ${String(expected)} but got ${String(actual)}`);
    this.name = 'StepAssertionError';
  }
}
