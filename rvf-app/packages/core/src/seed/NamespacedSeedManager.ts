import type { SeedProvider, SeedResult, SeedContext } from './types.js';

/**
 * Orchestrates seeding and teardown across multiple SeedProviders.
 *
 * T-2.2.2: Each provider gets a namespace = "<runId>:<provider.name>" so
 * parallel test runs can never collide on shared backend state.
 *
 * Lifecycle:
 *   1. Call seedAll() before any browser context opens (AC-1).
 *   2. Scenario runs — providers' data is live.
 *   3. Call teardownAll() after the scenario finishes (AC-2).
 */
export class NamespacedSeedManager {
  private readonly results = new Map<string, SeedResult>();

  constructor(
    private readonly providers: readonly SeedProvider[],
    private readonly runId: string,
  ) {}

  /**
   * Seed all providers in registration order.
   * Each provider receives its own namespaced SeedContext.
   */
  async seedAll(env?: Record<string, string | undefined>): Promise<void> {
    for (const provider of this.providers) {
      const namespace = `${this.runId}:${provider.name}`;
      const ctx: SeedContext = {
        runId: this.runId,
        namespace,
        ...(env !== undefined ? { env } : {}),
      };
      const result = await provider.seed(ctx);
      this.results.set(provider.name, result);
    }
  }

  /**
   * Tear down all providers in reverse registration order, then clear results.
   * Reverse order ensures dependents are removed before their dependencies.
   */
  async teardownAll(): Promise<void> {
    const entries = [...this.results.entries()].reverse();
    for (const [name, result] of entries) {
      const provider = this.providers.find((p) => p.name === name);
      if (provider !== undefined) {
        await provider.teardown(result);
      }
    }
    this.results.clear();
  }

  /**
   * Return the SeedResult for a named provider, or undefined if not yet seeded
   * or already torn down.
   */
  getResult(providerName: string): SeedResult | undefined {
    return this.results.get(providerName);
  }

  /** Number of providers that have been seeded and not yet torn down. */
  get seededCount(): number {
    return this.results.size;
  }
}
