/**
 * Error hierarchy for WaitStrategy failures ( AC2).
 *
 * G1:  framework-agnostic data class — no Playwright (or any other
 *      framework) import here; this lives in core deliberately so a
 *      caller can catch/inspect it without depending on a specific
 *      plugin, mirroring StepExecutionError's split in
 *      packages/core/src/bdd/steps/executor/errors.ts.
 * G10: findings are data — `phase` and `timeoutMs` are typed, readable
 *      properties so a caller can tell "network never went idle" apart
 *      from "animations never finished settling" without parsing a
 *      message string, and never confuse either with a normal assertion
 *      failure (AC2).
 */

/** Which WaitStrategy phase produced the timeout (AC2). */
export type WaitPhase = 'network' | 'settle';

/**
 * Thrown when a WaitStrategy phase does not complete within its configured
 * timeout. `phase` distinguishes a network-idle timeout (a pending
 * XHR/fetch never resolved) from a visual-settle timeout (a CSS
 * transition/animation never finished) — both are real, distinguishable
 * timeout causes, never silently reported as a normal assertion failure
 * (AC2). Wraps whatever the underlying implementation actually threw in
 * `cause` so the root cause stays inspectable.
 */
export class WaitTimeoutError extends Error {
  constructor(
    readonly phase: WaitPhase,
    readonly timeoutMs: number,
    override readonly cause: unknown,
  ) {
    super(`Wait timed out after ${timeoutMs}ms during phase "${phase}" — ${String(cause)}`);
    this.name = 'WaitTimeoutError';
  }
}
