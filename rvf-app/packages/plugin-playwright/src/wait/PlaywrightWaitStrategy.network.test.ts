import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WaitTimeoutError } from '@rippleview/core';
import { PlaywrightWaitStrategy } from './PlaywrightWaitStrategy.js';
import { closeHarness, launchHarness, loadFixture } from './test-helpers.js';

// AC1/AC2 (network phase) — split from the settle/DoD suites to keep each
// file under the repo's 200-line guideline. Real headless Chromium + a
// real loopback HTTP server (G13) — see test-helpers.ts for why `data:`
// URLs cannot exercise this phase.

beforeAll(async () => {
  await launchHarness();
});

afterAll(async () => {
  await closeHarness();
});

const FETCH_FIXTURE_HTML = `
  <p id="status">pending</p>
  <script>
    window.__fetchStarted = false;
    window.__fetchStarted = true;
    fetch('/api/data').then(() => {
      document.getElementById('status').textContent = 'done';
    });
  </script>
`;

describe('PlaywrightWaitStrategy — AC1: waitForNetworkIdle waits for a REAL delayed response', () => {
  it('resolves only after a deliberately delayed fetch response completes, not before', async () => {
    const strategy = new PlaywrightWaitStrategy();
    const page = await loadFixture(FETCH_FIXTURE_HTML);
    const delayMs = 400;

    await page.route('**/api/data', async (route) => {
      // A REAL pending network request: the response is genuinely delayed,
      // not a synthetic UI timer pretending to load (AC1).
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.fulfill({ status: 200, body: 'ok', contentType: 'text/plain' });
    });

    const start = Date.now();
    await strategy.waitForNetworkIdle(page, 5000);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(delayMs);
    // The response handler only flips this AFTER the real, delayed
    // response actually arrived — proving waitForNetworkIdle did not
    // resolve early.
    expect(await page.locator('#status').textContent()).toBe('done');
    await page.close();
  });
});

describe('PlaywrightWaitStrategy — AC2: network phase produces WaitTimeoutError, not a generic failure', () => {
  it('throws WaitTimeoutError with phase "network" when the request never resolves', async () => {
    const strategy = new PlaywrightWaitStrategy();
    const page = await loadFixture(FETCH_FIXTURE_HTML);

    // A genuinely never-resolving request: the route handler never calls
    // fulfill()/abort()/continue(), so the request stays pending forever —
    // network truly never goes idle (AC2).
    await page.route('**/api/data', () => {
      // intentionally never settled
    });

    const error = await strategy.waitForNetworkIdle(page, 300).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WaitTimeoutError);
    expect(error).toMatchObject({ name: 'WaitTimeoutError', phase: 'network', timeoutMs: 300 });
    await page.close();
  });

  it('the timeout is configurable — a longer timeoutMs still resolves once the real delay passes', async () => {
    const strategy = new PlaywrightWaitStrategy();
    const page = await loadFixture(FETCH_FIXTURE_HTML);
    const delayMs = 200;

    await page.route('**/api/data', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.fulfill({ status: 200, body: 'ok', contentType: 'text/plain' });
    });

    await expect(strategy.waitForNetworkIdle(page, 5000)).resolves.toBeUndefined();
    await page.close();
  });
});
