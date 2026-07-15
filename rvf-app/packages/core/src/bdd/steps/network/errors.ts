/**
 * Error hierarchy for NetworkCapture-backed assertion failures (
 * AC2).
 *
 * G1:  framework-agnostic data class — no Playwright (or any other
 *      framework) import here; this lives in core deliberately so a
 *      caller can catch/inspect it without depending on a specific
 *      plugin, mirroring WaitTimeoutError's and ScopeUnreachableError's
 *      split in packages/core/src/bdd/steps/wait/errors.ts and
 *      packages/core/src/bdd/steps/locator/errors.ts.
 * G10: findings are data — `urlPattern` is a typed, readable property so
 *      a caller can tell exactly which URL pattern never matched any
 *      captured exchange, never confusing this with a normal assertion
 *      failure (actual status/body mismatch on a call that DID happen).
 */

/**
 * Thrown when a network assertion step (`an API call is made to "..."`,
 * `the API response status for "..." is ...`, `the request body for
 * "..." contains "..."`) is evaluated against a `urlPattern` for which
 * NetworkCapture.findRequests() returns zero exchanges — i.e. no matching
 * request was observed at all, as distinct from a request that WAS
 * observed but whose status/body simply did not match what was expected
 * (that case stays a StepAssertionError, not this).
 */
export class NetworkExchangeNotFoundError extends Error {
  constructor(readonly urlPattern: string) {
    super(
      `No captured network request matched "${urlPattern}". This usually means either the ` +
        'action that should trigger the call never ran, NetworkCapture.start() was not called ' +
        'before the first step, or the URL pattern does not actually match the real request URL.',
    );
    this.name = 'NetworkExchangeNotFoundError';
  }
}
