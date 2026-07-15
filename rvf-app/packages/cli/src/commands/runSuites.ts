import type {
  AppConfig,
  EngineExecutor,
  EngineFailure,
  ParsedSuite,
  StepResult,
} from '@rippleview/core';
import { runMatrix } from '@rippleview/core';

/**
 * One scenario's run against one matrix entry, with per-step timing/status —
 * the data the CLI emits as results.json / the console table.
 */
export interface ScenarioRunResult {
  feature: string;
  scenario: string;
  browser: string;
  verdict: 'pass' | 'fail';
  durationMs: number;
  steps: StepResult[];
}

/**
 * Aggregated outcome of running every discovered suite's every scenario
 * across the app's full browser matrix ( AC4).
 */
export interface SuiteRunOutcome {
  verdict: 'pass' | 'fail';
  findings: EngineFailure[];
  /** Per-scenario × matrix-entry detail, in execution order (for reporting). */
  results: ScenarioRunResult[];
}

/**
 * Runs every scenario in every discovered suite against `appConfig.matrix`
 * via `runMatrix`, then aggregates every `EngineResult` across every
 * scenario x matrix entry into one verdict + findings list (AC4):
 *  - `verdict` is `'fail'` if ANY result failed, `'pass'` only if ALL passed
 *    (vacuously `'pass'` when there is nothing to run at all — zero suites
 *    or zero matrix entries — since no result failed).
 *  - `findings` collects every `EngineFailure` from every failing result, in
 *    suite -> scenario -> matrix-entry order (G13: discoverSuites already
 *    sorts suites alphabetically; runMatrix already iterates the matrix
 *    sequentially in declared order — this function adds no extra
 *    parallelism or reordering of its own).
 *
 * G1/G11: this lives in @rippleview/cli, never in @rippleview/core — it only composes
 * the core `runMatrix` orchestrator with a caller-supplied, framework-real
 * `EngineExecutor` (the real Playwright one by default — see run.ts).
 */
export async function runAllSuites(
  suites: readonly ParsedSuite[],
  matrix: AppConfig['matrix'],
  executor: EngineExecutor,
  engineCtx: unknown,
): Promise<SuiteRunOutcome> {
  const findings: EngineFailure[] = [];
  const results: ScenarioRunResult[] = [];
  let verdict: 'pass' | 'fail' = 'pass';

  for (const suite of suites) {
    for (const parsedScenario of suite.scenarios) {
      const scenario = parsedScenario.scenario;
      const engineResults = await runMatrix(matrix, executor, scenario, engineCtx);

      for (const result of engineResults) {
        results.push({
          feature: suite.feature.name,
          scenario: result.name ?? scenario.name,
          browser: result.browser,
          verdict: result.verdict,
          durationMs: result.durationMs ?? 0,
          steps: result.steps ?? [],
        });

        if (result.verdict === 'fail') {
          verdict = 'fail';
          if (result.failure !== undefined) {
            findings.push(result.failure);
          }
        }
      }
    }
  }

  return { verdict, findings, results };
}
