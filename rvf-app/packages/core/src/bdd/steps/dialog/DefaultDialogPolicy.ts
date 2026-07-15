import type { DialogPolicy } from './types.js';

/**
 * Default DialogPolicy provided by core.
 *
 * start() and armNext() are both no-ops — there is no real browser here to
 * listen for dialogs on, so there is nothing to arm an override against
 * either. Real dialog handling lives in the framework plugin (e.g.
 * @rippleview/plugin-playwright's PlaywrightDialogPolicy), mirroring
 * DefaultNetworkCapture's and NoOpWaitStrategy's pattern (G11).
 */
export class DefaultDialogPolicy implements DialogPolicy {
  readonly name = 'default';

  // no-op: real dialog listening lives in the framework plugin
  start(): void {
    // intentional no-op: real dialog handling lives in the framework plugin (G11)
  }

  // no-op: core has no dialog listener to arm an override against
  armNext(): void {
    // intentional no-op: real dialog handling lives in the framework plugin (G11)
  }
}
