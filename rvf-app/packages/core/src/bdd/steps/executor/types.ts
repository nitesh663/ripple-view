import type { StepMatch } from '../types.js';
import type { LocatorStrategy } from '../locator/types.js';
import type { NetworkCapture } from '../network/types.js';
import type { DialogPolicy } from '../dialog/types.js';
import type { TabTracker } from '../tabs/types.js';

/**
 * StepExecutor SPI (T-3.2.4 / ).
 *
 * G1:  ctx is unknown — core never imports Playwright or any framework type.
 * G11: Implement in a plugin (@rippleview/plugin-playwright etc.); never fork core.
 * G2:  Implementations MUST resolve elements exclusively through the
 *      supplied LocatorStrategy (A11y-tree only) — never CSS/XPath directly.
 */
export interface StepExecutor {
  /**
   * Execute one matched step against a real (or no-op) UI.
   *
   * @param stepText The original Gherkin step text the caller passed into
   *   `StepRegistry.match()` to obtain `match`. Carried through purely so a
   *   thrown error can report the exact failing step text (AC3) — this does
   *   NOT require any change to `StepMatch`/`StepPattern`/`StepRegistry`.
   * @param match The catalog match produced by `StepRegistry.match()`.
   * @param locator The resolved LocatorStrategy used to find elements named
   *   in `match.params` (role/name/label/text/testId).
   * @param ctx Framework execution context (e.g. a Playwright `Page`).
   *   Opaque to core; implementations narrow it themselves (G1).
   * @param networkCapture Optional NetworkCapture queried by the
   *   `assert-api-*` actions ( AC2). Optional — and added at the
   *   end — so every existing caller built before  keeps compiling
   *   unchanged; a caller that never wires NetworkCapture simply cannot
   *   reach the new network assertion steps yet.
   * @param dialogPolicy Optional DialogPolicy armed by the `accept-dialog`/
   *   `dismiss-dialog` actions ( AC1). Optional — and added after
   *   networkCapture — so every existing caller built before  keeps
   *   compiling unchanged; a caller that never wires DialogPolicy simply
   *   cannot reach the new dialog-override steps yet.
   * @param tabTracker Optional TabTracker switched to by the
   *   `switch-to-new-tab` action ( AC2). Optional, added last, for
   *   the same additive-compatibility reason as dialogPolicy above.
   * @throws {StepExecutionError} if the action could not be performed.
   * @throws {StepAssertionError} if an assertion's actual value does not
   *   match its expected value.
   */
  execute(
    stepText: string,
    match: StepMatch,
    locator: LocatorStrategy,
    ctx: unknown,
    networkCapture?: NetworkCapture,
    dialogPolicy?: DialogPolicy,
    tabTracker?: TabTracker,
  ): Promise<void>;
}
