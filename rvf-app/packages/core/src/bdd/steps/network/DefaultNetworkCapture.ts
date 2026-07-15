import type { NetworkCapture, NetworkExchange } from './types.js';

/**
 * Default NetworkCapture provided by core.
 *
 * start() is a no-op and findRequests() always returns an empty array —
 * real request/response recording lives in the framework plugin (e.g.
 * @rippleview/plugin-playwright's PlaywrightNetworkCapture), mirroring
 * DefaultLocatorStrategy's and NoOpWaitStrategy's pattern (G11).
 */
export class DefaultNetworkCapture implements NetworkCapture {
  readonly name = 'default';

  // no-op: real request/response recording lives in the framework plugin
  start(): void {
    // intentional no-op: real capture lives in the framework plugin (G11)
  }

  // no-op: core has no network layer to query
  findRequests(): readonly NetworkExchange[] {
    // intentional no-op: real capture lives in the framework plugin (G11)
    return [];
  }
}
