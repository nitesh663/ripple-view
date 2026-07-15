import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  closeSharedBrowser,
  dataUrl,
  executor,
  launchSharedBrowser,
  loadPage,
  locator,
  match,
} from './test-helpers.js';

// AC1: navigate / assert-mounted / press-key / scroll-page — the
// page-level action family (navigation.ts). Split from
// PlaywrightStepExecutor.actions.test.ts to keep each file under the
// repo's 200-line guideline. Real headless Chromium + data: URLs (G13).

beforeAll(async () => {
  await launchSharedBrowser();
});

afterAll(async () => {
  await closeSharedBrowser();
});

describe('PlaywrightStepExecutor — AC1: navigate / assert-mounted', () => {
  it('navigate calls page.goto(route) directly (no locator involved)', async () => {
    const page = await loadPage('<p>start</p>');
    const target = dataUrl('<h1>arrived</h1>');

    await executor.execute(
      'I am on route "target"',
      match('navigate', { route: target }),
      locator,
      page,
    );

    expect(await page.locator('h1').textContent()).toBe('arrived');
    await page.close();
  });

  it('assert-mounted passes when at least one matching role exists', async () => {
    const page = await loadPage('<button>Save</button>');

    await expect(
      executor.execute(
        'a button is mounted',
        match('assert-mounted', { component: 'button' }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('assert-mounted throws StepAssertionError with actual 0 / expected >=1 when none exist', async () => {
    const page = await loadPage('<p>no buttons here</p>');

    const error = await executor
      .execute(
        'a button is mounted',
        match('assert-mounted', { component: 'button' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepAssertionError', actual: 0, expected: '>=1' });
    await page.close();
  });
});

describe('PlaywrightStepExecutor — AC1: keyboard / page-level actions', () => {
  it('press-key acts on whatever currently has focus', async () => {
    const page = await loadPage('<input />');
    await page.locator('input').focus();

    await executor.execute('I press "A"', match('press-key', { key: 'A' }), locator, page);

    expect(await page.locator('input').inputValue()).toBe('A');
    await page.close();
  });

  it('scroll-page scrolls the page by the given pixels and direction', async () => {
    const page = await loadPage('<div style="height:3000px"></div>');

    await executor.execute(
      'I scroll down by 500 pixels',
      match('scroll-page', { direction: 'down', pixels: 500 }),
      locator,
      page,
    );

    // G13: wait on the stable scroll-position signal itself, never a
    // fixed sleep — the wheel event is processed asynchronously by the
    // browser process.
    await page.waitForFunction(() => window.scrollY > 0);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
    await page.close();
  });
});
