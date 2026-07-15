import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StepAssertionError } from '@rippleview/core';
import {
  closeSharedBrowser,
  executor,
  launchSharedBrowser,
  loadPage,
  locator,
  match,
} from './test-helpers.js';

// AC2/AC3: assert-visible / assert-enabled / assert-disabled — the
// single-element boolean-state assertion family (assertions-element.ts).
// Every handler throws StepAssertionError carrying a real actual/expected
// pair on mismatch. Real headless Chromium + data: URLs (G13).

beforeAll(async () => {
  await launchSharedBrowser();
});

afterAll(async () => {
  await closeSharedBrowser();
});

describe('PlaywrightStepExecutor — AC2: assert-visible / assert-enabled / assert-disabled', () => {
  it('assert-visible passes for a real visible element', async () => {
    const page = await loadPage('<button>Save</button>');

    await expect(
      executor.execute(
        'the button "Save" is visible',
        match('assert-visible', { role: 'button', name: 'Save' }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('assert-visible throws StepAssertionError(actual: false, expected: true) for a hidden element', async () => {
    const page = await loadPage('<button hidden>Save</button>');

    const error = await executor
      .execute(
        'the button "Save" is visible',
        match('assert-visible', { role: 'button', name: 'Save' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(StepAssertionError);
    expect((error as StepAssertionError).actual).toBe(false);
    expect((error as StepAssertionError).expected).toBe(true);
    await page.close();
  });

  it('assert-visible(index) resolves the Nth occurrence (T-3.3.4 ordinal)', async () => {
    const page = await loadPage('<button>Remove</button><button hidden>Remove</button>');

    const error = await executor
      .execute(
        'the 2nd button "Remove" is visible',
        match('assert-visible', { role: 'button', name: 'Remove', index: 2 }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(StepAssertionError);
    await page.close();
  });

  it('assert-enabled passes for a real enabled element', async () => {
    const page = await loadPage('<button>Save</button>');

    await expect(
      executor.execute(
        'the button "Save" is enabled',
        match('assert-enabled', { role: 'button', name: 'Save' }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('assert-enabled throws StepAssertionError for a disabled element', async () => {
    const page = await loadPage('<button disabled>Save</button>');

    const error = await executor
      .execute(
        'the button "Save" is enabled',
        match('assert-enabled', { role: 'button', name: 'Save' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepAssertionError', actual: false, expected: true });
    await page.close();
  });

  it('assert-disabled passes for a real disabled element', async () => {
    const page = await loadPage('<button disabled>Save</button>');

    await expect(
      executor.execute(
        'the button "Save" is disabled',
        match('assert-disabled', { role: 'button', name: 'Save' }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('assert-disabled throws StepAssertionError for an enabled element', async () => {
    const page = await loadPage('<button>Save</button>');

    const error = await executor
      .execute(
        'the button "Save" is disabled',
        match('assert-disabled', { role: 'button', name: 'Save' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepAssertionError', actual: false, expected: true });
    await page.close();
  });
});
