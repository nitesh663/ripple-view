import type { Page } from 'playwright';
import type { WaitStrategy } from '@rippleview/core';
import { WaitTimeoutError } from '@rippleview/core';

// ── PlaywrightWaitStrategy ( / US-17.3 real implementation) ─────────
// G1/G11: the only framework-specific (Playwright) implementation of the
// core WaitStrategy SPI — @rippleview/core itself stays agnostic (it only
// declares the interface in wait/types.ts and ships NoOpWaitStrategy's
// no-op). `ctx` arrives as `unknown` per the SPI; this class narrows it to
// Playwright's `Page` immediately and never leaks that type back out.

const DEFAULT_TIMEOUT_MS = 5000;

export class PlaywrightWaitStrategy implements WaitStrategy {
  /**
   * Waits for both real phases this story's AC cover before returning:
   *
   * 1. Network idle (AC1) — no pending XHR/fetch.
   * 2. Visual settle (AC3) — no CSS transition/animation currently running
   *    anywhere on the page, detected via the generic, framework-agnostic
   *    Web Animations API (`document.getAnimations()`) rather than any
   *    component-specific selector, so this works unchanged for
   *    PrimeNG/PrimeReact/AG Grid or anything else.
   *
   * These two phases run SEQUENTIALLY, never in parallel: a network
   * response can itself trigger a fresh animation (e.g. a dropdown that
   * opens once data has loaded). Checking "are any animations running"
   * before the network has settled would race that response and could
   * falsely report "settled" before the animation it triggers even starts
   * — so network-idle must fully resolve first, and only then is it safe
   * to check for in-flight animations.
   */
  async waitForNetworkIdle(ctx: unknown, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<void> {
    const page = ctx as Page;

    await this.waitForNetworkPhase(page, timeoutMs);
    await this.waitForSettlePhase(page, timeoutMs);
  }

  private async waitForNetworkPhase(page: Page, timeoutMs: number): Promise<void> {
    try {
      await page.waitForLoadState('networkidle', { timeout: timeoutMs });
    } catch (error) {
      throw new WaitTimeoutError('network', timeoutMs, error);
    }
  }

  private async waitForSettlePhase(page: Page, timeoutMs: number): Promise<void> {
    try {
      await page.waitForFunction(() => document.getAnimations().length === 0, undefined, {
        timeout: timeoutMs,
      });
    } catch (error) {
      throw new WaitTimeoutError('settle', timeoutMs, error);
    }
  }
}
