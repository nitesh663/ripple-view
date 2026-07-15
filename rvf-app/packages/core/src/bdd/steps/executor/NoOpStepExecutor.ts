import type { StepExecutor } from './types.js';

/**
 * No-op StepExecutor ( skeleton).
 *
 * Resolves immediately without performing any action or assertion. Real
 * execution of the full action/assertion catalog against a live
 * browser lives in the framework plugin (e.g. @rippleview/plugin-playwright's
 * PlaywrightStepExecutor), mirroring NoOpWaitStrategy's pattern (G11).
 */
export class NoOpStepExecutor implements StepExecutor {
  // intentional no-op: real step execution lives in the framework plugin
  async execute(): Promise<void> {
    // no-op: real step execution lives in the framework plugin (G11)
  }
}
