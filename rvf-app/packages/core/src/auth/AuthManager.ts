import type { AuthProvider, AuthState } from './types.js';

/**
 * Orchestrates session hydration across workers.
 *
 * Pattern: authenticate once on first hydrate call, cache the state,
 * then restore it into every subsequent worker context without re-logging in.
 * If the cached state expires, re-authenticate transparently (AC-2).
 *
 * T-2.1.2 DoD: 2 workers share one login — proven by the test asserting
 * that `provider.authenticate` is called exactly once for N hydrate() calls
 * while the session is valid.
 */
export class AuthManager {
  private cachedState: AuthState | null = null;

  constructor(private readonly provider: AuthProvider) {}

  /**
   * Return a valid AuthState, authenticating (or re-authenticating) as needed.
   * `ctx` is the browser context used only if authentication is required.
   */
  async getOrRefresh(ctx: unknown): Promise<AuthState> {
    if (this.cachedState !== null && this.provider.isValid(this.cachedState)) {
      return this.cachedState;
    }
    this.cachedState = await this.provider.authenticate(ctx);
    return this.cachedState;
  }

  /**
   * Hydrate a worker context with the shared session state.
   * Authenticates on the first call; subsequent calls reuse the cache (T-2.1.2).
   */
  async hydrate(ctx: unknown): Promise<void> {
    const state = await this.getOrRefresh(ctx);
    await this.provider.restore(state, ctx);
  }

  /** Force a fresh authentication on the next hydrate() call. */
  invalidate(): void {
    this.cachedState = null;
  }

  /** Expose cached state for inspection (e.g. in tests or debugging). */
  get state(): AuthState | null {
    return this.cachedState;
  }
}
