import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { StepMatch } from '@rippleview/core';
import { NoNewTabOpenedError } from '@rippleview/core';
import { PlaywrightStepExecutor } from './PlaywrightStepExecutor.js';
import { PlaywrightLocatorStrategy } from '../locator/PlaywrightLocatorStrategy.js';
import { PlaywrightTabTracker } from '../tabs/PlaywrightTabTracker.js';
import {
  closeHarness,
  launchHarness,
  loadFixture,
  registerTargetPage,
  waitForNewTabTracked,
} from '../dialog/test-helpers.js';

// DoD (): a real fixture that opens a link in a new tab completes
// without hanging and produces a correct verdict — driven entirely
// through PlaywrightStepExecutor.execute(), exactly as a scenario runner
// would call it step by step (AC2).

beforeAll(async () => {
  await launchHarness();
});

afterAll(async () => {
  await closeHarness();
});

const locator = new PlaywrightLocatorStrategy();

function match(action: StepMatch['action'], params: StepMatch['params']): StepMatch {
  return { action, params };
}

describe('DoD: a real new-tab fixture completes without hanging, with a correct verdict', () => {
  it('clicking a target="_blank" link, then switching, lets a later step assert against the new tab', async () => {
    const executor = new PlaywrightStepExecutor();
    const tabTracker = new PlaywrightTabTracker();
    const targetUrl = registerTargetPage(
      '<h1>Landed on the new tab</h1><p id="marker">new-tab-content</p>',
    );
    const page = await loadFixture(`<a href="${targetUrl}" target="_blank">Open in new tab</a>`);
    tabTracker.start(page);

    // When I activate the link "Open in new tab"
    await executor.execute(
      'I activate the link "Open in new tab"',
      match('activate', { role: 'link', name: 'Open in new tab' }),
      locator,
      page,
      undefined,
      undefined,
      tabTracker,
    );

    // Chromium's new-tab event fires asynchronously relative to click()
    // resolving (G13: wait on the real tracked-state signal, not a fixed
    // sleep) — see waitForNewTabTracked's doc comment for why.
    await waitForNewTabTracked(tabTracker);

    // And I switch to the new tab
    await executor.execute(
      'I switch to the new tab',
      match('switch-to-new-tab', {}),
      locator,
      page,
      undefined,
      undefined,
      tabTracker,
    );

    // Then the text "new-tab-content" is shown — asserted against
    // whatever `ctx` is passed here (the now-stale original `page`), to
    // prove the EXECUTOR'S OWN activePage takes precedence, not the
    // caller-supplied ctx, once a switch has happened.
    await executor.execute(
      'the text "new-tab-content" is shown',
      match('assert-text', { value: 'new-tab-content' }),
      locator,
      page,
    );

    await page.close();
  });

  it('switching before any new tab has opened throws NoNewTabOpenedError, never hangs', async () => {
    const executor = new PlaywrightStepExecutor();
    const tabTracker = new PlaywrightTabTracker();
    const page = await loadFixture('<p>start</p>');
    tabTracker.start(page);

    const error = await executor
      .execute(
        'I switch to the new tab',
        match('switch-to-new-tab', {}),
        locator,
        page,
        undefined,
        undefined,
        tabTracker,
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(NoNewTabOpenedError);
    await page.close();
  });

  it('switch-to-new-tab without a supplied TabTracker throws a clear StepExecutionError', async () => {
    const executor = new PlaywrightStepExecutor();
    const page = await loadFixture('<p>start</p>');

    const error = await executor
      .execute(
        'I switch to the new tab',
        match('switch-to-new-tab', {}),
        locator,
        page,
        // tabTracker intentionally omitted
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepExecutionError', action: 'switch-to-new-tab' });
    await page.close();
  });
});
