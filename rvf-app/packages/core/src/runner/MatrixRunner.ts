import type { BddScenario } from '../bdd/types.js';
import type { BrowserMatrixEntry, EngineExecutor, EngineResult } from './types.js';

/**
 * Pure browser-matrix orchestrator (T-3.3.2, BDD-05,  AC1/AC2).
 *
 * Iterates `matrix` in order, awaiting `executor(entry, scenario, ctx)`
 * sequentially (no parallelism races — G13 determinism), and returns one
 * EngineResult per entry in the same order as the input. Zero
 * framework/Playwright imports (G1): real engine execution — including
 * isolating each scenario run in its own fresh browser context (AC2) — is
 * supplied by the caller via `executor`.
 */
export async function runMatrix(
  matrix: readonly BrowserMatrixEntry[],
  executor: EngineExecutor,
  scenario: BddScenario,
  ctx: unknown,
): Promise<EngineResult[]> {
  const results: EngineResult[] = [];
  for (const entry of matrix) {
    const result = await executor(entry, scenario, ctx);
    results.push(result);
  }
  return results;
}
