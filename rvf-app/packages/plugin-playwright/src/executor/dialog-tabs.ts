import type { DialogPolicy, TabTracker } from '@rippleview/core';
import { NoNewTabOpenedError } from '@rippleview/core';

// ── Dialog/tab handlers ( catalog,  AC1/AC2) ─────────────────────
// Each operates on the supplied DialogPolicy/TabTracker (never the
// DOM/LocatorStrategy) — these arm a one-shot override or switch the
// active tab, they do not resolve or act on any element.

/**
 * Arms the next dialog to resolve as `accept`. MUST run BEFORE the action
 * that actually triggers the dialog — see DialogPolicy's module doc for why
 * "after" is structurally impossible (a native dialog blocks the page's
 * own JS, including whatever step triggered it, until resolved).
 */
export function acceptDialog(policy: DialogPolicy): Promise<void> {
  policy.armNext('accept');
  return Promise.resolve();
}

/**
 * Arms the next dialog to resolve as `dismiss`. Same "must run before the
 * triggering action" ordering requirement as acceptDialog above. Useful
 * mainly to be explicit in a scenario where DISMISS is already the silent
 * default — e.g. for readability, or to override an earlier `accept`
 * arming that has not fired yet.
 */
export function dismissDialog(policy: DialogPolicy): Promise<void> {
  policy.armNext('dismiss');
  return Promise.resolve();
}

/**
 * Switches the active tab to the most-recently-opened tracked tab/window.
 * Returns the new page-shaped ctx so PlaywrightStepExecutor can store it
 * as the active page for every subsequent execute() call.
 * @throws {NoNewTabOpenedError} if no new tab has been tracked yet.
 */
export function switchToNewTab(tracker: TabTracker): Promise<unknown> {
  const newCtx = tracker.switchToNewTab();
  if (newCtx === undefined) {
    return Promise.reject(new NoNewTabOpenedError());
  }
  return Promise.resolve(newCtx);
}
