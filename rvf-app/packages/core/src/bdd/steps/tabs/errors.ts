/**
 * Error hierarchy for TabTracker failures ( AC2).
 *
 * G1:  framework-agnostic data class — no Playwright (or any other
 *      framework) import here; this lives in core deliberately so a
 *      caller can catch/inspect it without depending on a specific
 *      plugin, mirroring NetworkExchangeNotFoundError's split in
 *      packages/core/src/bdd/steps/network/errors.ts.
 * G10: findings are data — this distinguishes "no new tab was ever
 *      opened" from every other execution failure, so a step like
 *      `I switch to the new tab` never silently passes against a stale
 *      or wrong page when the triggering action did not actually open one.
 */

/**
 * Thrown when `I switch to the new tab` runs but TabTracker.switchToNewTab()
 * has nothing tracked yet — i.e. no new tab/window was ever opened (or
 * TabTracker.start() was never called before the action that should have
 * opened one).
 */
export class NoNewTabOpenedError extends Error {
  constructor() {
    super(
      'No new tab/window has been tracked yet. This usually means either the action that ' +
        'should open a new tab never ran, it did not actually open one, or TabTracker.start() ' +
        'was not called before the first step.',
    );
    this.name = 'NoNewTabOpenedError';
  }
}
