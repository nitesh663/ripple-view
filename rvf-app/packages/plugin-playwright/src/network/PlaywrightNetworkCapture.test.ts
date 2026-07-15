import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PlaywrightNetworkCapture } from './PlaywrightNetworkCapture.js';
import {
  closeHarness,
  launchHarness,
  loadFixture,
  registerApiRoute,
  waitForResponseCaptured,
} from './test-helpers.js';

// AC3 () — PlaywrightNetworkCapture implements the SPI via
// page.on('request')/page.on('requestfinished') against a REAL loopback
// HTTP server + real headless Chromium (G13), never a synthetic object.

beforeAll(async () => {
  await launchHarness();
});

afterAll(async () => {
  await closeHarness();
});

const FETCH_FIXTURE_HTML = `
  <button id="trigger">Create order</button>
  <p id="status">idle</p>
  <script>
    document.getElementById('trigger').addEventListener('click', () => {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: 'widget' }),
      }).then(() => {
        document.getElementById('status').textContent = 'done';
      });
    });
  </script>
`;

describe('AC3: PlaywrightNetworkCapture.start() records a REAL request before any other step runs', () => {
  it('captures method + request body for a real POST triggered by a UI click', async () => {
    registerApiRoute('/api/orders', 201, () => JSON.stringify({ id: 1 }));
    const page = await loadFixture(FETCH_FIXTURE_HTML);
    const capture = new PlaywrightNetworkCapture();

    capture.start(page);
    await page.click('#trigger');
    await page.waitForFunction(() => document.getElementById('status')?.textContent === 'done');

    const matches = capture.findRequests('/api/orders');
    expect(matches).toHaveLength(1);
    expect(matches[0]?.method).toBe('POST');
    expect(matches[0]?.requestBody).toContain('widget');
    await page.close();
  });

  it('records the real response status and body once it arrives', async () => {
    registerApiRoute('/api/orders', 201, () => JSON.stringify({ id: 42 }));
    const page = await loadFixture(FETCH_FIXTURE_HTML);
    const capture = new PlaywrightNetworkCapture();

    capture.start(page);
    await page.click('#trigger');
    await waitForResponseCaptured(capture, '/api/orders');

    const [exchange] = capture.findRequests('/api/orders');
    expect(exchange?.status).toBe(201);
    expect(exchange?.responseBody).toContain('42');
    await page.close();
  });

  it('RegExp patterns match too', async () => {
    registerApiRoute('/api/orders', 200, () => '{}');
    const page = await loadFixture(FETCH_FIXTURE_HTML);
    const capture = new PlaywrightNetworkCapture();

    capture.start(page);
    await page.click('#trigger');
    await waitForResponseCaptured(capture, '/api/orders');

    expect(capture.findRequests(/\/api\/orders$/)).toHaveLength(1);
    await page.close();
  });

  it('findRequests() returns an empty array when no matching call was ever made', async () => {
    const page = await loadFixture(FETCH_FIXTURE_HTML);
    const capture = new PlaywrightNetworkCapture();

    capture.start(page);
    // Deliberately never click the trigger.

    expect(capture.findRequests('/api/orders')).toEqual([]);
    await page.close();
  });
});
