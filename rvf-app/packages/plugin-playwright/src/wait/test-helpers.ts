import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { chromium, type Browser, type Page, type Route } from 'playwright';

// Shared real-Chromium + real-HTTP test harness for the PlaywrightWaitStrategy
// suite (). G13: determinism via a real server and real browser, no
// mocking of the DOM or the network stack itself.
//
// Unlike PlaywrightLocatorStrategy/PlaywrightStepExecutor's tests, this
// suite cannot use `data:` URLs: a page loaded from a `data:` origin never
// actually dispatches its `fetch()` calls onto Chromium's network layer
// (confirmed empirically — `page.route()` never observes them), so
// `waitForLoadState('networkidle')` would have nothing real to wait on.
// AC1 specifically requires a REAL pending network request, so this harness
// serves fixtures over a real loopback HTTP server instead.

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

// Path -> HTML body lookup the server serves on demand (registered via
// `registerPage` below, read by the request handler above).
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

export type { Route };
