import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PlaywrightWaitStrategy } from './PlaywrightWaitStrategy.js';
import { closeHarness, launchHarness, loadFixture } from './test-helpers.js';

// Proves the design rationale documented on PlaywrightWaitStrategy: the
// network phase must fully resolve BEFORE the settle phase starts,
// because a network response can itself trigger a fresh animation (e.g.
// a dropdown that only opens once its data has loaded). Real headless
// Chromium + a real loopback HTTP server + a real CSS transition (G13).

beforeAll(async () => {
  await launchHarness();
});

afterAll(async () => {
  await closeHarness();
});

// A dropdown that stays hidden until its data has loaded over the
// network, then opens with a real CSS transition once the response
// arrives — the animation genuinely does not exist until AFTER the
// network settles.
const RESPONSE_TRIGGERED_ANIMATION_HTML = `
  <style>
    #panel {
      opacity: 0;
      transition: opacity 200ms;
    }
    #panel.open {
      opacity: 1;
    }
  </style>
  <div id="panel">panel content</div>
  <script>
    fetch('/api/data').then(() => {
      document.getElementById('panel').classList.add('open');
    });
  </script>
`;

describe('PlaywrightWaitStrategy — sequencing: network settles fully before the settle phase checks for animations', () => {
  it('resolves only after the response-triggered animation has also fully settled', async () => {
    const strategy = new PlaywrightWaitStrategy();
    const page = await loadFixture(RESPONSE_TRIGGERED_ANIMATION_HTML);
    const delayMs = 250;

    await page.route('**/api/data', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.fulfill({ status: 200, body: 'ok', contentType: 'text/plain' });
    });

    await strategy.waitForNetworkIdle(page, 5000);

    // If the settle phase had run BEFORE the network phase (or in
    // parallel with it), it could have observed "zero animations" before
    // this animation even started — a false-early pass. Resolving only
    // after BOTH phases proves the sequential ordering is what this
    // implementation actually does.
    const runningCount = await page.evaluate(() => document.getAnimations().length);
    const opacity = await page.evaluate(
      () => getComputedStyle(document.getElementById('panel') as Element).opacity,
    );

    expect(runningCount).toBe(0);
    expect(opacity).toBe('1');
    await page.close();
  });
});
