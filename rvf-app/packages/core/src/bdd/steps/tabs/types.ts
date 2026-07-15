/**
 * TabTracker SPI ( / T-5.3.x).
 *
 * G1:  ctx is unknown — core never imports Playwright or any framework type.
 * G11: Implement in a plugin (@rippleview/plugin-playwright etc.); never fork core.
 * AC2: a step that triggers a new tab/window is tracked, and a later step
 *      can switch the active context to that new tab.
 *
 * Deliberately minimal — scoped to exactly what `I switch to the new tab`
 * needs (the single most-recently-opened tab), not a generic
 * window-manager API with naming/indexing/closing of arbitrary tabs.
 */
export interface TabTracker {
  readonly name: string;
  /**
   * Starts listening for new tabs/windows opened from the given framework
   * context (e.g. a Playwright `Page`, via its `BrowserContext`). MUST be
   * called before the scenario's first step so the very first new tab a
   * step triggers (e.g. clicking a `target="_blank"` link) is already
   * tracked.
   */
  start(ctx: unknown): void;
  /**
   * Returns the most-recently-opened tracked tab/window's own framework
   * context (e.g. a Playwright `Page`), to be used as `ctx` for every step
   * after this one.
   * @throws {NoNewTabOpenedError} if no new tab has been tracked yet.
   */
  switchToNewTab(): unknown;
}
