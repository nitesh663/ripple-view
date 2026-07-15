/**
 * WaitStrategy SPI (T-3.2.3 / BDD-04).
 *
 * G1:  ctx is unknown — no framework imports.
 * BDD-04: implementations must pause all assertions until network is idle
 *         (no pending XHR/fetch). The default NoOpWaitStrategy is for
 *         the skeleton stage; real network-idle wait lives in the plugin.
 */
export interface WaitStrategy {
  waitForNetworkIdle(ctx: unknown, timeoutMs?: number): Promise<void>;
}
