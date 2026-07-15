import type { AuthHookFn, AuthProvider, AuthState } from './types.js';

/**
 * Default AuthProvider.
 *
 * - Delegates authentication to the app-provided `hookFn` (G1: app specifics stay outside core).
 * - Stamps `capturedAt` and `expiresAt` on the returned state.
 * - `restore` is intentionally a no-op: real cookie/localStorage injection is
 *   performed by the framework plugin (e.g. @rippleview/plugin-playwright) which has
 *   access to the concrete context type.
 * - `isValid` uses a TTL check; injectable `now` keeps tests deterministic (G13).
 */
export class StorageStateAuthProvider implements AuthProvider {
  readonly name = 'storage-state';

  constructor(
    private readonly hookFn: AuthHookFn,
    /** Session TTL in ms. Default: 30 minutes. */
    private readonly ttlMs: number = 30 * 60 * 1000,
    /** Injectable clock for deterministic tests (G13). */
    private readonly now: () => number = Date.now,
  ) {}

  async authenticate(ctx: unknown): Promise<AuthState> {
    const raw = await this.hookFn(ctx);
    const capturedAt = this.now();
    return {
      ...raw,
      capturedAt,
      expiresAt: capturedAt + this.ttlMs,
    };
  }

  // no-op: real cookie/localStorage injection lives in the framework plugin (G11)
  async restore(): Promise<void> {
    // intentional no-op
  }

  isValid(state: AuthState): boolean {
    if (state.expiresAt === undefined) return true;
    return this.now() < state.expiresAt;
  }
}
