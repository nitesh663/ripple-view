/**
 * DialogPolicy SPI ( / T-5.3.x).
 *
 * G1:  ctx is unknown — core never imports Playwright or any framework type.
 * G11: Implement in a plugin (@rippleview/plugin-playwright etc.); never fork core.
 * AC1: a default auto-dismiss/accept policy for native dialogs
 *      (alert/confirm/prompt) applies unless a step arms a one-shot
 *      override beforehand.
 *
 * Native dialogs are synchronous and blocking from the page's point of
 * view: `window.confirm()` does not return to the page's own JS until the
 * dialog is accepted or dismissed. This makes "react after the dialog
 * already opened" structurally impossible for a step-by-step runner — by
 * the time a later step could run, the action that triggered the dialog
 * (e.g. `await page.click(...)`) is itself still awaiting that dialog's
 * resolution. The only correct design is a listener registered up front
 * (via `start()`) that resolves every dialog as it happens, consulting a
 * one-shot override armed by an EARLIER step (`armNext()`) for the very
 * next dialog only. This is deliberately minimal — scoped to exactly what
 * `I accept the dialog` / `I dismiss the dialog` need — not a generic
 * dialog-queue or multi-dialog API.
 */

/** What a DialogPolicy should do with a native dialog event. */
export type DialogDisposition = 'accept' | 'dismiss';

export interface DialogPolicy {
  readonly name: string;
  /**
   * Starts listening for native dialogs against the given framework
   * context (e.g. a Playwright `Page`). MUST be called before the
   * scenario's first step so the very first dialog a step triggers is
   * already handled by this policy rather than left to the browser's own
   * (test-hanging) default.
   */
  start(ctx: unknown): void;
  /**
   * Arms a one-shot override: the very next dialog this policy observes
   * resolves with `disposition` instead of the silent default, then the
   * override is consumed and every dialog after that reverts to the
   * default again. Calling this is how `I accept the dialog` / `I dismiss
   * the dialog` steps work — they MUST run BEFORE the action that
   * actually triggers the dialog (see module doc above for why "after" is
   * not possible).
   */
  armNext(disposition: DialogDisposition): void;
}
