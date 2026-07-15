import type { WaitStrategy } from './types.js';

/**
 * No-op WaitStrategy (BDD-04 skeleton).
 *
 * Resolves immediately without waiting. Real network-idle detection
 * (waiting for pending XHR/fetch) lives in the framework plugin.
 * The plugin replaces this with an implementation that calls
 * page.waitForLoadState('networkidle') or equivalent.
 */
export class NoOpWaitStrategy implements WaitStrategy {
  // no-op: real network-idle wait lives in the framework plugin (G11)
  async waitForNetworkIdle(): Promise<void> {
    // intentional no-op: real network-idle wait lives in the framework plugin
  }
}
