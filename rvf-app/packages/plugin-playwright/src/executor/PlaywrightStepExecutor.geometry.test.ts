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

// AC2/AC3: assert-no-overlap / assert-in-viewport / assert-attribute /
// assert-url — split from PlaywrightStepExecutor.assertions.test.ts to
// keep each file under the repo's 200-line guideline; shares the same
// real-Chromium harness and conventions (G13).

beforeAll(async () => {
  await launchSharedBrowser();
});

afterAll(async () => {
  await closeSharedBrowser();
});

describe('PlaywrightStepExecutor — AC2: assert-no-overlap / assert-in-viewport', () => {
  it('assert-no-overlap passes for two real, non-intersecting elements', async () => {
    const page = await loadPage(`
      <p style="position:absolute;top:0;left:0;width:50px;height:50px;">Card A</p>
      <p style="position:absolute;top:200px;left:200px;width:50px;height:50px;">Card B</p>
    `);

    await expect(
      executor.execute(
        '"Card A" does not overlap "Card B"',
        match('assert-no-overlap', { a: 'Card A', b: 'Card B' }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('assert-no-overlap throws StepAssertionError(actual: true, expected: false) when boxes intersect', async () => {
    const page = await loadPage(`
      <p style="position:absolute;top:0;left:0;width:100px;height:100px;">Card A</p>
      <p style="position:absolute;top:10px;left:10px;width:100px;height:100px;">Card B</p>
    `);

    const error = await executor
      .execute(
        '"Card A" does not overlap "Card B"',
        match('assert-no-overlap', { a: 'Card A', b: 'Card B' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepAssertionError', actual: true, expected: false });
    await page.close();
  });

  it('assert-in-viewport passes for an element inside the real viewport bounds', async () => {
    const page = await loadPage(
      '<p style="position:absolute;top:10px;left:10px;">Visible Card</p>',
    );

    await expect(
      executor.execute(
        'the "Visible Card" is within the viewport',
        match('assert-in-viewport', { name: 'Visible Card' }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('assert-in-viewport throws StepAssertionError when the element is positioned off-screen', async () => {
    const page = await loadPage(
      '<p style="position:absolute;top:9000px;left:9000px;">Offscreen Card</p>',
    );

    const error = await executor
      .execute(
        'the "Offscreen Card" is within the viewport',
        match('assert-in-viewport', { name: 'Offscreen Card' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(StepAssertionError);
    expect((error as StepAssertionError).actual).toBe(false);
    expect((error as StepAssertionError).expected).toBe(true);
    await page.close();
  });
});

describe('PlaywrightStepExecutor — AC2: assert-attribute / assert-url', () => {
  it('assert-attribute passes when the real attribute value matches', async () => {
    const page = await loadPage('<button aria-expanded="true">Details</button>');

    await expect(
      executor.execute(
        'the attribute "aria-expanded" of button "Details" equals "true"',
        match('assert-attribute', {
          attr: 'aria-expanded',
          role: 'button',
          name: 'Details',
          value: 'true',
        }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('assert-attribute throws StepAssertionError(actual, expected) on mismatch', async () => {
    const page = await loadPage('<button aria-expanded="false">Details</button>');

    const error = await executor
      .execute(
        'the attribute "aria-expanded" of button "Details" equals "true"',
        match('assert-attribute', {
          attr: 'aria-expanded',
          role: 'button',
          name: 'Details',
          value: 'true',
        }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepAssertionError', actual: 'false', expected: 'true' });
    await page.close();
  });

  it('assert-url passes when the real page URL matches the expected route', async () => {
    const page = await loadPage('<p>start</p>');
    const url = page.url();

    await expect(
      executor.execute('the URL is "x"', match('assert-url', { route: url }), locator, page),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('assert-url throws StepAssertionError(actual, expected) when the route does not match', async () => {
    const page = await loadPage('<p>start</p>');

    const error = await executor
      .execute(
        'the URL is "/somewhere-else"',
        match('assert-url', { route: '/somewhere-else' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepAssertionError', expected: '/somewhere-else' });
    await page.close();
  });
});
