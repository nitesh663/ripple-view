import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PlaywrightDialogPolicy } from './PlaywrightDialogPolicy.js';
import { closeHarness, launchHarness, loadFixture } from './test-helpers.js';

// AC1 () — a REAL window.confirm() proves the default
// auto-dismiss policy and the one-shot accept/dismiss override, against a
// real headless Chromium instance (no synthetic Dialog object).
//
// Ordering constraint (see PlaywrightDialogPolicy's module doc for why):
// armNext() MUST be called BEFORE the action that triggers the dialog —
// `window.confirm()` blocks the page's own JS (including the very click
// that invoked it) until the dialog is resolved, so there is no "after
// the dialog already opened" moment a later step could react in.

beforeAll(async () => {
  await launchHarness();
});

afterAll(async () => {
  await closeHarness();
});

const CONFIRM_PAGE = `
  <button id="trigger">Delete</button>
  <p id="result">pending</p>
  <script>
    document.getElementById('trigger').addEventListener('click', () => {
      const accepted = window.confirm('Delete this record?');
      document.getElementById('result').textContent = accepted ? 'accepted' : 'dismissed';
    });
  </script>
`;

describe('AC1: PlaywrightDialogPolicy — default disposition is dismiss', () => {
  it('an un-armed confirm() resolves as dismissed (the safe default)', async () => {
    const page = await loadFixture(CONFIRM_PAGE);
    const policy = new PlaywrightDialogPolicy();
    policy.start(page);

    await page.click('#trigger');

    expect(await page.locator('#result').textContent()).toBe('dismissed');
    await page.close();
  });
});

describe('AC1: PlaywrightDialogPolicy — armNext("accept") overrides the next dialog only', () => {
  it('an armed accept resolves confirm() as accepted', async () => {
    const page = await loadFixture(CONFIRM_PAGE);
    const policy = new PlaywrightDialogPolicy();
    policy.start(page);

    // Arm BEFORE the action that triggers the dialog — see module doc.
    policy.armNext('accept');
    await page.click('#trigger');

    expect(await page.locator('#result').textContent()).toBe('accepted');
    await page.close();
  });

  it('the override is consumed after one dialog — the next confirm() reverts to dismiss', async () => {
    const page = await loadFixture(CONFIRM_PAGE);
    const policy = new PlaywrightDialogPolicy();
    policy.start(page);

    policy.armNext('accept');
    await page.click('#trigger');
    expect(await page.locator('#result').textContent()).toBe('accepted');

    // Second click, no re-arming — must revert to the silent default.
    await page.click('#trigger');
    expect(await page.locator('#result').textContent()).toBe('dismissed');
    await page.close();
  });
});

describe('AC1: PlaywrightDialogPolicy — armNext("dismiss") is explicit and still works', () => {
  it('an explicitly armed dismiss resolves confirm() as dismissed', async () => {
    const page = await loadFixture(CONFIRM_PAGE);
    const policy = new PlaywrightDialogPolicy();
    policy.start(page);

    policy.armNext('dismiss');
    await page.click('#trigger');

    expect(await page.locator('#result').textContent()).toBe('dismissed');
    await page.close();
  });
});
