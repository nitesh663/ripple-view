import type { Page } from 'playwright';
import type {
  DialogPolicy,
  LocatorStrategy,
  NetworkCapture,
  StepExecutor,
  StepMatch,
  TabTracker,
} from '@rippleview/core';

/**
 * One step's outcome — `ok: true` on success, `ok: false` carrying the
 * caught error otherwise. A typed discriminated union instead of letting
 * `runScenario`'s loop deal with try/catch directly, split out so the loop
 * in PlaywrightEngineExecutor.ts stays flat and that file stays under the
 * 200-line limit (SOLID).
 */
export type StepOutcome = { ok: true } | { ok: false; error: unknown };

export interface RunStepArgs {
  stepText: string;
  match: StepMatch;
  locator: LocatorStrategy;
  page: Page;
  stepExecutor: StepExecutor;
  networkCapture: NetworkCapture;
  dialogPolicy: DialogPolicy;
  tabTracker: TabTracker;
}

/**
 * Executes one matched step through the real PlaywrightStepExecutor,
 * catching whatever it throws (StepExecutionError/StepAssertionError, or
 * anything else) into a StepOutcome rather than letting it propagate —
 * AC3 requires the specific failing step to be surfaced in the
 * EngineResult, not thrown out of the engine (G10: findings are data).
 */
export async function runStep(args: RunStepArgs): Promise<StepOutcome> {
  try {
    await args.stepExecutor.execute(
      args.stepText,
      args.match,
      args.locator,
      args.page,
      args.networkCapture,
      args.dialogPolicy,
      args.tabTracker,
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
