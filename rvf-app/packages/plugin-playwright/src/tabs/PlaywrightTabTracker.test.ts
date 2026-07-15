import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NoNewTabOpenedError } from '@rippleview/core';
import { PlaywrightTabTracker } from './PlaywrightTabTracker.js';
import {
  closeHarness,
  launchHarness,
  loadFixture,
  registerTargetPage,
} from '../dialog/test-helpers.js';

// AC2 () — a REAL target="_blank" link opening a REAL new tab
// proves tracking, against a real headless Chromium instance (no
// synthetic Page object).

beforeAll(async () => {
  await launchHarness();
});

afterAll(async () => {
  await closeHarness();
});

describe('AC2: PlaywrightTabTracker — throws before any tab has opened', () => {
  it('switchToNewTab() throws NoNewTabOpenedError when nothing has opened yet', async () => {
    const page = await loadFixture('<p>start</p>');
    const tracker = new PlaywrightTabTracker();
    tracker.start(page);

    expect(() => tracker.switchToNewTab()).toThrow(NoNewTabOpenedError);
    await page.close();
  });
});

describe('AC2: PlaywrightTabTracker — tracks a real target="_blank" new tab', () => {
  it('switchToNewTab() returns the new tab once a real link opens one', async () => {
    const targetUrl = registerTargetPage('<h1 id="heading">New tab landed</h1>');
    const page = await loadFixture(
      `<a id="open" href="${targetUrl}" target="_blank">Open in new tab</a>`,
    );
    const tracker = new PlaywrightTabTracker();
    tracker.start(page);

    const [newPage] = await Promise.all([page.context().waitForEvent('page'), page.click('#open')]);
    await newPage.waitForLoadState('load');

    const tracked = tracker.switchToNewTab();
    expect(tracked).toBe(newPage);
    expect(await (tracked as typeof newPage).locator('#heading').textContent()).toBe(
      'New tab landed',
    );

    await newPage.close();
    await page.close();
  });

  it('switchToNewTab() returns the LATEST tab when more than one has opened', async () => {
    const firstUrl = registerTargetPage('<h1>First tab</h1>');
    const secondUrl = registerTargetPage('<h1>Second tab</h1>');
    const page = await loadFixture(`
      <a id="open-1" href="${firstUrl}" target="_blank">Open first</a>
      <a id="open-2" href="${secondUrl}" target="_blank">Open second</a>
    `);
    const tracker = new PlaywrightTabTracker();
    tracker.start(page);

    const [firstTab] = await Promise.all([
      page.context().waitForEvent('page'),
      page.click('#open-1'),
    ]);
    await firstTab.waitForLoadState('load');

    const [secondTab] = await Promise.all([
      page.context().waitForEvent('page'),
      page.click('#open-2'),
    ]);
    await secondTab.waitForLoadState('load');

    expect(tracker.switchToNewTab()).toBe(secondTab);

    await firstTab.close();
    await secondTab.close();
    await page.close();
  });
});
