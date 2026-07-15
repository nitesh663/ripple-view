import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  closeSharedBrowser,
  executor,
  launchSharedBrowser,
  loadPage,
  locator,
  match,
} from './test-helpers.js';

// AC2/AC3: assert-text / assert-selection / assert-count — split from
// PlaywrightStepExecutor.assertions.test.ts to keep each file under the
// repo's 200-line guideline. Real headless Chromium + data: URLs (G13).

beforeAll(async () => {
  await launchSharedBrowser();
});

afterAll(async () => {
  await closeSharedBrowser();
});

describe('PlaywrightStepExecutor — AC2: assert-text / assert-selection / assert-count', () => {
  it('assert-text passes when the visible text exists', async () => {
    const page = await loadPage('<p>Hello world</p>');

    await expect(
      executor.execute(
        'the text "Hello world" is shown',
        match('assert-text', { value: 'Hello world' }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('assert-text throws StepAssertionError when the text is hidden', async () => {
    const page = await loadPage('<p hidden>Hello world</p>');

    const error = await executor
      .execute(
        'the text "Hello world" is shown',
        match('assert-text', { value: 'Hello world' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepAssertionError', actual: false, expected: true });
    await page.close();
  });

  it('assert-selection compares the selected option text via an ARIA-state-aware role query', async () => {
    const page = await loadPage(`
      <ul role="listbox">
        <li role="option">Red</li>
        <li role="option" aria-selected="true">Blue</li>
      </ul>
    `);

    await expect(
      executor.execute(
        'the selection equals "Blue"',
        match('assert-selection', { value: 'Blue' }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('assert-selection throws StepAssertionError(actual, expected) on mismatch', async () => {
    const page = await loadPage(`
      <ul role="listbox">
        <li role="option" aria-selected="true">Red</li>
        <li role="option">Blue</li>
      </ul>
    `);

    const error = await executor
      .execute(
        'the selection equals "Blue"',
        match('assert-selection', { value: 'Blue' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepAssertionError', actual: 'Red', expected: 'Blue' });
    await page.close();
  });

  it('assert-count passes when the real role count matches exactly', async () => {
    const page = await loadPage('<button>A</button><button>B</button>');

    await expect(
      executor.execute(
        'the button count equals 2',
        match('assert-count', { role: 'button', count: 2 }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('assert-count throws StepAssertionError(actual, expected) on mismatch', async () => {
    const page = await loadPage('<button>A</button>');

    const error = await executor
      .execute(
        'the button count equals 2',
        match('assert-count', { role: 'button', count: 2 }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepAssertionError', actual: 1, expected: 2 });
    await page.close();
  });
});
