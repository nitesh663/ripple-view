import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PlaywrightWaitStrategy } from './PlaywrightWaitStrategy.js';
import { closeHarness, launchHarness, loadFixture } from './test-helpers.js';

// DoD (): "a real fixture with a delayed API call and a real
// fixture with an animated dropdown both produce a correct, non-flaky
// verdict across 10 repeated real runs." This file is the concrete proof:
// each fixture scenario runs 10 times in a real browser, asserting every
// single iteration passes (G13 — deterministic, fixed short delays, no
// reliance on uncontrolled wall-clock races beyond what is under test).

beforeAll(async () => {
  await launchHarness();
});

afterAll(async () => {
  await closeHarness();
});

const REPEAT_COUNT = 10;

const FETCH_FIXTURE_HTML = `
  <p id="status">pending</p>
  <script>
    fetch('/api/data').then(() => {
      document.getElementById('status').textContent = 'done';
    });
  </script>
`;

const TRANSITION_FIXTURE_HTML = `
  <style>
    #panel {
      opacity: 0;
      transition: opacity 200ms;
    }
    #panel.open {
      opacity: 1;
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

// 10 real, sequential browser-page iterations per scenario genuinely takes
// longer than vitest's 5000ms default test timeout — raised explicitly per
// test rather than globally, so this stays a deliberate, scoped exception
// instead of masking a real timeout elsewhere in the suite.
const REPEATED_RUN_TIMEOUT_MS = 60_000;

describe('PlaywrightWaitStrategy — DoD: non-flaky across 10 repeated real runs', () => {
  it(
    'the delayed-fetch (AC1) scenario passes on every one of 10 repeated real runs',
    async () => {
      const strategy = new PlaywrightWaitStrategy();
      const delayMs = 150;

      for (let i = 0; i < REPEAT_COUNT; i += 1) {
        const page = await loadFixture(FETCH_FIXTURE_HTML);
        await page.route('**/api/data', async (route) => {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          await route.fulfill({ status: 200, body: 'ok', contentType: 'text/plain' });
        });

        await strategy.waitForNetworkIdle(page, 5000);

        expect(await page.locator('#status').textContent()).toBe('done');
        await page.close();
      }
    },
    REPEATED_RUN_TIMEOUT_MS,
  );

  it(
    'the animated-dropdown (AC3) scenario passes on every one of 10 repeated real runs',
    async () => {
      const strategy = new PlaywrightWaitStrategy();

      for (let i = 0; i < REPEAT_COUNT; i += 1) {
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
      }
    },
    REPEATED_RUN_TIMEOUT_MS,
  );
});
