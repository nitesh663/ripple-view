import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StepExecutionError } from '@rippleview/core';
import {
  closeSharedBrowser,
  executor,
  launchSharedBrowser,
  loadPage,
  locator,
  match,
} from './test-helpers.js';

// AC3: scope-region and seed-data are deliberately NOT implemented in
// PlaywrightStepExecutor (composition/run-level concerns owned elsewhere —
// see the PR description). Hitting either must be a loud, typed failure,
// never a silent pass.

beforeAll(async () => {
  await launchSharedBrowser();
});

afterAll(async () => {
  await closeSharedBrowser();
});

describe('PlaywrightStepExecutor — AC3: unsupported actions fail loudly, never silently pass', () => {
  it('scope-region throws StepExecutionError naming the unsupported action', async () => {
    const page = await loadPage('<p>start</p>');

    const error = await executor
      .execute(
        'within the "Header" region',
        match('scope-region', { region: 'Header' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(StepExecutionError);
    expect((error as StepExecutionError).stepText).toBe('within the "Header" region');
    expect((error as StepExecutionError).action).toBe('scope-region');
    await page.close();
  });

  it('seed-data throws StepExecutionError naming the unsupported action', async () => {
    const page = await loadPage('<p>start</p>');

    const error = await executor
      .execute(
        'seeded data users',
        match('seed-data', { kind: 'ref', ref: 'users' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(StepExecutionError);
    expect((error as StepExecutionError).stepText).toBe('seeded data users');
    expect((error as StepExecutionError).action).toBe('seed-data');
    await page.close();
  });
});
