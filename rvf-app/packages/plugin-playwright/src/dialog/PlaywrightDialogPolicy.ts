import type { Page, Dialog } from 'playwright';
import type { DialogPolicy, DialogDisposition } from '@rippleview/core';

/**
 * Real DialogPolicy implementation ( AC1).
 *
 * G1/G11: the only framework-specific (Playwright) implementation of the
 * core DialogPolicy SPI — @rippleview/core itself stays agnostic (it only
 * declares the interface and ships DefaultDialogPolicy's no-op). `ctx`
 * arrives as `unknown` per the SPI; this class narrows it to Playwright's
 * `Page` immediately and never leaks that type back out.
 *
 * Playwright fires `page.on('dialog', ...)` synchronously the instant
 * `window.alert/confirm/prompt()` is called, and the page's own JS stays
 * blocked until `dialog.accept()`/`dialog.dismiss()` resolves it — there is
 * no way to "come back later" and decide. So start() registers ONE
 * listener up front that resolves every dialog as it happens, consulting
 * a one-shot override armed by an earlier `armNext()` call.
 *
 * Default disposition is DISMISS, not accept. Rationale: an un-armed
 * dialog is, by definition, one the scenario author did not explicitly
 * anticipate — silently ACCEPTING an unexpected `confirm("Delete this
 * record?")` could let a destructive action proceed with no human or step
 * ever having approved it. DISMISS is the fail-safe default: it can only
 * ever block/cancel an action, never silently approve one. A step author
 * who wants the dialog-triggered action to actually proceed must say so
 * explicitly via `I accept the dialog` BEFORE the triggering action.
 */
export class PlaywrightDialogPolicy implements DialogPolicy {
  readonly name = 'playwright';

  private oneShot: DialogDisposition | undefined;

  start(ctx: unknown): void {
    const page = ctx as Page;
    page.on('dialog', (dialog) => {
      this.resolveDialog(dialog).catch(() => {
        // A dialog can become unactionable if the page navigates/closes
        // out from under it between the event firing and accept/dismiss
        // being called — that race is not a policy bug (G13: a torn-down
        // page is not a dialog-handling failure), so this must never
        // become an unhandled rejection.
      });
    });
  }

  armNext(disposition: DialogDisposition): void {
    this.oneShot = disposition;
  }

  private async resolveDialog(dialog: Dialog): Promise<void> {
    const disposition = this.oneShot ?? 'dismiss';
    this.oneShot = undefined;

    if (disposition === 'accept') {
      await dialog.accept();
      return;
    }

    await dialog.dismiss();
  }
}
