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

// AC1: the uniform resolve(role,name)+single-call action family
// (interactions.ts) — activate/toggle/expand/hover/focus/double-click/
// right-click/scroll-to. Real headless Chromium + data: URLs (G13),
// mirroring PlaywrightLocatorStrategy.test.ts's exact convention.

beforeAll(async () => {
  await launchSharedBrowser();
});

afterAll(async () => {
  await closeSharedBrowser();
});

describe('PlaywrightStepExecutor — AC1: simple resolve+act actions', () => {
  it('activate clicks the resolved button', async () => {
    const page = await loadPage('<button onclick="this.textContent=\'Saved\'">Save</button>');

    await executor.execute(
      'I activate the button "Save"',
      match('activate', { role: 'button', name: 'Save' }),
      locator,
      page,
    );

    expect(await page.locator('button').textContent()).toBe('Saved');
    await page.close();
  });

  it('toggle clicks the resolved element', async () => {
    const page = await loadPage('<button onclick="this.textContent=\'Toggled\'">Switch</button>');

    await executor.execute(
      'I toggle the button "Switch"',
      match('toggle', { role: 'button', name: 'Switch' }),
      locator,
      page,
    );

    expect(await page.locator('button').textContent()).toBe('Toggled');
    await page.close();
  });

  it('expand resolves by role=button + name and clicks it', async () => {
    const page = await loadPage(
      '<button aria-expanded="false" onclick="this.setAttribute(\'aria-expanded\',\'true\')">Details</button>',
    );

    await executor.execute(
      'I expand "Details"',
      match('expand', { name: 'Details' }),
      locator,
      page,
    );

    expect(await page.locator('button').getAttribute('aria-expanded')).toBe('true');
    await page.close();
  });

  it('hover resolves and hovers the element', async () => {
    const page = await loadPage('<button>Save</button>');

    await expect(
      executor.execute(
        'I hover the button "Save"',
        match('hover', { role: 'button', name: 'Save' }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();
    await page.close();
  });

  it('focus resolves and focuses the element', async () => {
    const page = await loadPage('<button>Save</button>');

    await executor.execute(
      'I focus the button "Save"',
      match('focus', { role: 'button', name: 'Save' }),
      locator,
      page,
    );

    const isFocused = await page.locator('button').evaluate((el) => el === document.activeElement);
    expect(isFocused).toBe(true);
    await page.close();
  });

  it('double-click resolves and double-clicks the element', async () => {
    const page = await loadPage('<button ondblclick="this.textContent=\'Double\'">Save</button>');

    await executor.execute(
      'I double-click the button "Save"',
      match('double-click', { role: 'button', name: 'Save' }),
      locator,
      page,
    );

    expect(await page.locator('button').textContent()).toBe('Double');
    await page.close();
  });

  it('right-click resolves and right-clicks the element', async () => {
    const page = await loadPage(
      '<button oncontextmenu="this.textContent=\'Right\';return false;">Save</button>',
    );

    await executor.execute(
      'I right-click the button "Save"',
      match('right-click', { role: 'button', name: 'Save' }),
      locator,
      page,
    );

    expect(await page.locator('button').textContent()).toBe('Right');
    await page.close();
  });

  it('scroll-to resolves and scrolls the element into view', async () => {
    const page = await loadPage('<div style="height:3000px"></div><button>Save</button>');

    await expect(
      executor.execute(
        'I scroll to the button "Save"',
        match('scroll-to', { role: 'button', name: 'Save' }),
        locator,
        page,
      ),
    ).resolves.toBeUndefined();

    const visible = await page.locator('button').isVisible();
    expect(visible).toBe(true);
    await page.close();
  });

  it('activate throws StepExecutionError carrying the step text + action when resolution fails', async () => {
    const page = await loadPage('<p>no buttons here</p>');

    const error = await executor
      .execute(
        'I activate the button "Missing"',
        match('activate', { role: 'button', name: 'Missing' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(StepExecutionError);
    expect((error as StepExecutionError).stepText).toBe('I activate the button "Missing"');
    expect((error as StepExecutionError).action).toBe('activate');
    await page.close();
  });
});
