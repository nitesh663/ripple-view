import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PlaywrightStepExecutor } from './PlaywrightStepExecutor.js';
import { PlaywrightLocatorStrategy } from '../locator/PlaywrightLocatorStrategy.js';
import { PlaywrightNetworkCapture } from '../network/PlaywrightNetworkCapture.js';
import {
  closeHarness,
  launchHarness,
  loadFixture,
  registerApiRoute,
  waitForResponseCaptured,
} from '../network/test-helpers.js';
import type { StepMatch } from '@rippleview/core';

// AC4 (DoD) — a real fixture proves all three new assertion steps
// (`an API call is made to "..."`, `the API response status for "..." is
// ...`, `the request body for "..." contains "..."`) against a REAL
// captured request/response: a UI button click triggers a real fetch()
// against a real loopback HTTP server (not a synthetic in-memory object,
// and not a `data:` URL page — see network/test-helpers.ts for why).

beforeAll(async () => {
  await launchHarness();
});

afterAll(async () => {
  await closeHarness();
});

const executor = new PlaywrightStepExecutor();
const locator = new PlaywrightLocatorStrategy();

function match(action: StepMatch['action'], params: StepMatch['params']): StepMatch {
  return { action, params };
}

const ORDER_FORM_HTML = `
  <button>Create order</button>
  <p id="status">idle</p>
  <script>
    document.querySelector('button').addEventListener('click', () => {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: 'widget', qty: 3 }),
      }).then(() => {
        document.getElementById('status').textContent = 'done';
      });
    });
  </script>
`;

describe('AC4: full scenario — UI action triggers a real API call, three network steps assert on it', () => {
  it('an API call is made / API response status / request body contains — all pass against the real exchange', async () => {
    registerApiRoute('/api/orders', 201, () => JSON.stringify({ id: 7 }));
    const page = await loadFixture(ORDER_FORM_HTML);
    const capture = new PlaywrightNetworkCapture();

    // Capture starts BEFORE the first step runs (AC1's "starts before the
    // first step" requirement) — proven here by starting it immediately
    // after navigation and before any step executes.
    capture.start(page);

    await executor.execute(
      'I activate the button "Create order"',
      match('activate', { role: 'button', name: 'Create order' }),
      locator,
      page,
    );
    await waitForResponseCaptured(capture, '/api/orders');

    await expect(
      executor.execute(
        'an API call is made to "/api/orders"',
        match('assert-api-called', { urlPattern: '/api/orders' }),
        locator,
        page,
        capture,
      ),
    ).resolves.toBeUndefined();

    await expect(
      executor.execute(
        'the API response status for "/api/orders" is 201',
        match('assert-api-status', { urlPattern: '/api/orders', status: 201 }),
        locator,
        page,
        capture,
      ),
    ).resolves.toBeUndefined();

    await expect(
      executor.execute(
        'the request body for "/api/orders" contains "widget"',
        match('assert-api-body-contains', { urlPattern: '/api/orders', value: 'widget' }),
        locator,
        page,
        capture,
      ),
    ).resolves.toBeUndefined();

    await page.close();
  });

  it('assert-api-status fails with StepAssertionError when the real status does not match', async () => {
    registerApiRoute('/api/orders', 500, () => JSON.stringify({ error: 'boom' }));
    const page = await loadFixture(ORDER_FORM_HTML);
    const capture = new PlaywrightNetworkCapture();
    capture.start(page);

    await executor.execute(
      'I activate the button "Create order"',
      match('activate', { role: 'button', name: 'Create order' }),
      locator,
      page,
    );
    await waitForResponseCaptured(capture, '/api/orders');

    const error = await executor
      .execute(
        'the API response status for "/api/orders" is 201',
        match('assert-api-status', { urlPattern: '/api/orders', status: 201 }),
        locator,
        page,
        capture,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepAssertionError', actual: 500, expected: 201 });
    await page.close();
  });

  it('assert-api-called throws NetworkExchangeNotFoundError when no UI action ever triggers the call', async () => {
    const page = await loadFixture(ORDER_FORM_HTML);
    const capture = new PlaywrightNetworkCapture();
    capture.start(page);
    // Deliberately never click the button.

    const error = await executor
      .execute(
        'an API call is made to "/api/orders"',
        match('assert-api-called', { urlPattern: '/api/orders' }),
        locator,
        page,
        capture,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      name: 'NetworkExchangeNotFoundError',
      urlPattern: '/api/orders',
    });
    await page.close();
  });

  it('a network action without a supplied NetworkCapture throws a clear StepExecutionError', async () => {
    const page = await loadFixture(ORDER_FORM_HTML);

    const error = await executor
      .execute(
        'an API call is made to "/api/orders"',
        match('assert-api-called', { urlPattern: '/api/orders' }),
        locator,
        page,
        // networkCapture intentionally omitted
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ name: 'StepExecutionError', action: 'assert-api-called' });
    await page.close();
  });
});
