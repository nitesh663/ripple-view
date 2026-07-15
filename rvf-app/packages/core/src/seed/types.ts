/**
 * Context passed to every SeedProvider.seed() call.
 * Namespace isolates data between parallel runs (T-2.2.2).
 */
export interface SeedContext {
  /** Unique identifier for this run — injected by the caller (e.g. a UUID). */
  runId: string;
  /**
   * Composite namespace: "<runId>:<provider.name>".
   * Providers should prefix any created resource names/IDs with this value
   * so that parallel runs never collide.
   */
  namespace: string;
  /** Environment variables forwarded from RunContext (e.g. API base URLs). */
  env?: Record<string, string | undefined>;
}

/**
 * The result of a seed operation — held by NamespacedSeedManager until teardown.
 * `createdIds` are the resource identifiers that teardown must delete.
 */
export interface SeedResult {
  namespace: string;
  /** IDs / keys of resources created during seed, to be purged by teardown. */
  createdIds: string[];
  /** Arbitrary extra data the provider wants to expose to the scenario. */
  metadata?: Record<string, unknown>;
}

/**
 * SeedProvider SPI.
 *
 * G1:  No browser/Playwright types — ctx is purely API-level.
 * G11: Implement in a plugin (@rippleview/plugin-*); never fork core.
 * G18: Implementations must never log credentials present in env.
 */
export interface SeedProvider {
  readonly name: string;
  /** Establish backend state and return the IDs of all created resources. */
  seed(ctx: SeedContext): Promise<SeedResult>;
  /** Purge all resources identified in result.createdIds. */
  teardown(result: SeedResult): Promise<void>;
}
