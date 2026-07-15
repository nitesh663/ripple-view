/**
 * Error hierarchy for LocatorStrategy region-scoping failures ( AC3).
 *
 * G1:  framework-agnostic data class — no Playwright (or any other
 *      framework) import here; this lives in core deliberately so a
 *      caller can catch/inspect it without depending on a specific
 *      plugin, mirroring WaitTimeoutError's split in
 *      packages/core/src/bdd/steps/wait/errors.ts.
 * G10: findings are data — `region` is a typed, readable property so a
 *      caller can tell exactly which region name in a withScope() chain
 *      could not be reached, never confusing this with a normal
 *      "region doesn't exist anywhere" empty-match case (which stays a
 *      silent empty locator, unchanged).
 */

/**
 * Thrown when withScope() is asked to narrow into a region that the
 * CURRENT scope structurally cannot see, while that same region DOES
 * exist elsewhere on the page (AC3) — the structural-portal-mismatch
 * case. This happens when a UI library renders a menu/dialog/overlay as
 * a portal attached near `<body>`, outside the DOM subtree of whatever
 * element triggered it: a nested `withScope()` chain that has already
 * narrowed into an outer region can never find that portaled region by
 * searching only within its own subtree, no matter how many landmark
 * roles are tried, because the element genuinely is not there.
 *
 * Distinguish this from a real "no such region anywhere" failure (which
 * intentionally keeps returning an empty locator, never throwing): this
 * error is raised ONLY when a page-level (unscoped) search for the same
 * region name DOES find a match — proving the region exists, just not
 * where the scope chain looked, which is the portal-mismatch hypothesis
 * this error name and message describe.
 */
export class ScopeUnreachableError extends Error {
  constructor(readonly region: string) {
    super(
      `withScope("${region}") could not be resolved from the current scope, but "${region}" ` +
        'exists elsewhere on the page. This usually means the region is rendered in a DOM ' +
        "portal (attached near <body>, outside the trigger's subtree) — use " +
        'resolveUnscoped() instead of nesting withScope() into it.',
    );
    this.name = 'ScopeUnreachableError';
  }
}
