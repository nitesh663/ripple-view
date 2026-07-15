import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WaitTimeoutError } from '@rippleview/core';
import { PlaywrightWaitStrategy } from './PlaywrightWaitStrategy.js';
import { closeHarness, launchHarness, loadFixture } from './test-helpers.js';

// AC2 (settle phase) / AC3 — split from the network/DoD suites to keep
// each file under the repo's 200-line guideline. Real headless Chromium +
// a real CSS transition (G13) — `document.getAnimations()` is the
// generic, framework-agnostic Web Animations API this story uses instead
// of any component-specific selector, so the same fixture style proves
// what would also work for a real PrimeNG/PrimeReact/AG Grid dropdown.

beforeAll(async () => {
  await launchHarness();
});

afterAll(async () => {
  await closeHarness();
});

// Mimics a PrimeNG-style panel/dropdown open transition: clicking the
// trigger adds a class whose `transition: opacity 300ms, transform 300ms`
// genuinely animates over real wall-clock time, not a synthetic timer.
const TRANSITION_FIXTURE_HTML = `
  <style>
    #panel {
      opacity: 0;
      transform: translateY(-8px);
      transition: opacity 300ms, transform 300ms;
    }
    #panel.open {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
  <button id="trigger">Open</button>
  <div id="panel">panel content</div>
  <script>
    document.getElementById('trigger').addEventListener('click', () => {
      document.getElementById('panel').classList.add('open');
    });
  </script>
`;

describe('PlaywrightWaitStrategy — AC3: waitForNetworkIdle waits for a REAL CSS transition to settle', () => {
  it('the transition is genuinely still running immediately after the click (proves the wait matters)', async () => {
    const page = await loadFixture(TRANSITION_FIXTURE_HTML);

    await page.click('#trigger');
    const runningCount = await page.evaluate(() => document.getAnimations().length);

    expect(runningCount).toBeGreaterThan(0);
    await page.close();
  });

  it('resolves only once the transition has fully settled at its final state', async () => {
    const strategy = new PlaywrightWaitStrategy();
    const page = await loadFixture(TRANSITION_FIXTURE_HTML);

    await page.click('#trigger');
    await strategy.waitForNetworkIdle(page, 5000);

    const runningCount = await page.evaluate(() => document.getAnimations().length);
    const opacity = await page.evaluate(
      () => getComputedStyle(document.getElementById('panel') as Element).opacity,
    );

    expect(runningCount).toBe(0);
    expect(opacity).toBe('1');
    await page.close();
  });
});

describe('PlaywrightWaitStrategy — AC2: settle phase produces WaitTimeoutError, not a generic failure', () => {
  const INFINITE_ANIMATION_HTML = `
    <style>
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      #spinner { width: 20px; height: 20px; background: blue; animation: spin 1s linear infinite; }
    </style>
    <div id="spinner"></div>
  `;

  it('throws WaitTimeoutError with phase "settle" when an animation never finishes', async () => {
    const strategy = new PlaywrightWaitStrategy();
    const page = await loadFixture(INFINITE_ANIMATION_HTML);

    // This fixture serves a static page with no fetches, so the network
    // phase itself always resolves well within 1000ms — comfortably below
    // this timeoutMs — meaning the timeout below isolates the SETTLE
    // phase specifically: the infinite CSS animation, never the network
    // phase, is what is actually exercised by this timeoutMs.
    const error = await strategy.waitForNetworkIdle(page, 1000).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WaitTimeoutError);
    expect(error).toMatchObject({ name: 'WaitTimeoutError', phase: 'settle', timeoutMs: 1000 });
    await page.close();
  });
});
