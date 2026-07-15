import type { Page } from 'playwright';
import type { TabTracker } from '@rippleview/core';
import { NoNewTabOpenedError } from '@rippleview/core';

/**
 * Real TabTracker implementation ( AC2).
 *
 * G1/G11: the only framework-specific (Playwright) implementation of the
 * core TabTracker SPI — @rippleview/core itself stays agnostic (it only declares
 * the interface and ships DefaultTabTracker's no-op). `ctx` arrives as
 * `unknown` per the SPI; this class narrows it to Playwright's `Page`
 * immediately and never leaks that type back out.
 *
 * Listens on `page.context().on('page', ...)`: Playwright's
 * BrowserContext fires this event whenever a new tab/window opens within
 * that context — e.g. clicking a `target="_blank"` link, or
 * `window.open()` — which is the real-browser signal for "a new tab just
 * opened", as distinct from this context's OWN page navigating
 * in-place (which never fires 'page' at all).
 */
export class PlaywrightTabTracker implements TabTracker {
  readonly name = 'playwright';

  private readonly trackedPages: Page[] = [];

  start(ctx: unknown): void {
    const page = ctx as Page;
    page.context().on('page', (newPage) => {
      this.trackedPages.push(newPage);
    });
  }

  switchToNewTab(): unknown {
    const latest = this.trackedPages[this.trackedPages.length - 1];
    if (latest === undefined) {
      throw new NoNewTabOpenedError();
    }
    return latest;
  }
}
