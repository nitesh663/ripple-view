/**
 * Browser-matrix runner SPI (T-3.3.2, BDD-05, /US-17.7).
 *
 * G1:  ctx is unknown — core never imports Playwright or any framework type.
 * G11: Real per-engine execution (actually launching Chromium/WebKit/Firefox,
 *      walking the scenario via StepRegistry -> LocatorStrategy/StepExecutor/
 *      WaitStrategy) lives in the framework plugin (e.g. @rippleview/plugin-playwright);
 *      core only orchestrates the matrix and aggregates results.
 */

import type { BddScenario } from '../bdd/types.js';
import type { ActionType } from '../bdd/steps/types.js';

/**
 * One entry in a browser matrix. Mirrors the shape already validated by
 * `AppConfigSchema.matrix` in `../config/schema.js`.
 */
export interface BrowserMatrixEntry {
  browser: string;
  viewport: {
    width: number;
    height: number;
  };
}

/**
 * The specific failing step surfaced on a 'fail' verdict (AC3).
 *
 * G10: findings are data — this mirrors the fields carried by
 * `StepExecutionError`/`StepAssertionError` (../bdd/steps/executor/errors.js)
 * but as a plain serializable object, never an `Error` instance, so it slots
 * directly into `EngineResult`/`SummaryRecord.findings` without leaking a
 * framework-specific exception type across the SPI boundary.
 */
export interface EngineFailure {
  stepText: string;
  action: ActionType;
  message: string;
  /** Present only when the failure was a StepAssertionError. */
  actual?: unknown;
  expected?: unknown;
}

/**
 * Per-step trace entry for detailed reporting. Plain serializable data
 * (G10) carried back on the EngineResult so the CLI can emit per-step
 * timing/status without the engine leaking a framework type. `status` is
 * 'skipped' for every step after the one that failed (the walk stops on
 * first failure).
 */
export interface StepResult {
  stepText: string;
  action: ActionType;
  status: 'pass' | 'fail' | 'skipped';
  durationMs: number;
}

/**
 * Outcome of running a scenario against a single matrix entry.
 *
 * AC3: on a 'fail' verdict, `failure` names the specific failing step —
 * never a bare boolean. Absent on a 'pass' verdict.
 *
 * `name`, `durationMs` and `steps` are optional, additive reporting fields
 * (a no-op for existing consumers — G16 non-breaking): they let the CLI
 * write a detailed results.json / console table. An executor that does not
 * populate them still produces a valid pass/fail EngineResult.
 */
export interface EngineResult {
  browser: string;
  verdict: 'pass' | 'fail';
  /** Present only when verdict is 'fail' (AC3). */
  failure?: EngineFailure;
  /** Scenario name (for reporting). */
  name?: string;
  /** Wall-clock duration of the whole scenario, in milliseconds. */
  durationMs?: number;
  /** Per-step status + timing, in execution order. */
  steps?: StepResult[];
}

/**
 * Executes one parsed BddScenario against a single matrix entry end-to-end
 * (AC1: StepRegistry.match() -> LocatorStrategy + StepExecutor + WaitStrategy)
 * and reports the real result. Implemented by the framework plugin (G11) —
 * core treats this as an opaque, injectable function for deterministic
 * testing (G13).
 */
export type EngineExecutor = (
  entry: BrowserMatrixEntry,
  scenario: BddScenario,
  ctx: unknown,
) => Promise<EngineResult>;
