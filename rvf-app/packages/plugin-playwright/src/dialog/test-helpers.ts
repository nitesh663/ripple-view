import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { chromium, type Browser, type Page } from 'playwright';
import type { TabTracker } from '@rippleview/core';
import { NoNewTabOpenedError } from '@rippleview/core';

// Shared real-Chromium + real-HTTP test harness for the
// PlaywrightDialogPolicy/PlaywrightTabTracker/dialog-tabs suites ().
// G13: determinism via a real server and real browser, no synthetic
// dialog or page objects.
//
// Mirrors packages/plugin-playwright/src/network/test-helpers.ts: a
// `target="_blank"` link needs a real navigable URL to open in a new tab
// (a `data:` URL page cannot itself be the target of a same-origin-free
// new-tab navigation in the way these fixtures need), so this harness
// serves fixtures over a real loopback HTTP server too.

let server: http.Server | undefined;
let serverOrigin = '';
let browser: Browser | undefined;

/** Starts a tiny static HTML server and a real Chromium instance. */
export async function launchHarness(): Promise<void> {
  server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(pages.get(req.url ?? '/') ?? '<p>not found</p>');
  });
  await new Promise<void>((resolve) => server?.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  serverOrigin = `http://localhost:${port}`;

  browser = await chromium.launch();
}

export async function closeHarness(): Promise<void> {
  await browser?.close();
  browser = undefined;
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  server = undefined;
  pages.clear();
}

// Path -> HTML body lookup the server serves on demand.
const pages = new Map<string, string>();

/** Registers `html` to be served at `path` and returns the page's full URL. */
function registerPage(path: string, html: string): string {
  pages.set(path, html);
  return `${serverOrigin}${path}`;
}

/** Serves `html` at a fresh, unique path and navigates a new real page to it. */
export async function loadFixture(html: string): Promise<Page> {
  if (browser === undefined) {
    throw new Error('launchHarness() must be called in a beforeAll() first');
  }
  const path = `/fixture-${Math.random().toString(36).slice(2)}`;
  const url = registerPage(path, html);

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'load' });
  return page;
}

/**
 * Registers a second target page (e.g. the page a `target="_blank"` link
 * navigates to) at a fresh, unique path and returns its full URL — does
 * NOT navigate anything itself, since the new tab is opened by Chromium
 * in response to the real link click, not by this helper.
 */
export function registerTargetPage(html: string): string {
  const path = `/target-${Math.random().toString(36).slice(2)}`;
  return registerPage(path, html);
}

/**
 * Polls tracker.switchToNewTab() until a new tab has actually been
 * recorded (G13: wait on the real tracked-state signal itself, never a
 * fixed sleep). Chromium's `context.on('page', ...)` event — the signal
 * PlaywrightTabTracker listens on — fires asynchronously relative to the
 * `click()` call that opens the new tab resolving; a step immediately
 * following the triggering action cannot assume tracking has already
 * happened by the time it runs. Mirrors network/test-helpers.ts's
 * `waitForResponseCaptured` for the same underlying reason.
 */
export async function waitForNewTabTracked(tracker: TabTracker, timeoutMs = 5000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      tracker.switchToNewTab();
      return;
    } catch (error) {
      if (!(error instanceof NoNewTabOpenedError)) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out waiting for a new tab to be tracked');
}
