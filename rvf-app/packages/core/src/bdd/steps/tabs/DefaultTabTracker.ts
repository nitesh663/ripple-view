import type { TabTracker } from './types.js';
import { NoNewTabOpenedError } from './errors.js';

/**
 * Default TabTracker provided by core.
 *
 * start() is a no-op and switchToNewTab() always throws
 * NoNewTabOpenedError — there is no real browser context here to track new
 * tabs on, so none can ever have opened. Real tab tracking lives in the
 * framework plugin (e.g. @rippleview/plugin-playwright's PlaywrightTabTracker),
 * mirroring DefaultNetworkCapture's and DefaultDialogPolicy's pattern
 * (G11).
 */
export class DefaultTabTracker implements TabTracker {
  readonly name = 'default';

  // no-op: real tab tracking lives in the framework plugin
  start(): void {
    // intentional no-op: real tab tracking lives in the framework plugin (G11)
  }

  // always throws: core has no tabs to ever have tracked
  switchToNewTab(): never {
    throw new NoNewTabOpenedError();
  }
}
