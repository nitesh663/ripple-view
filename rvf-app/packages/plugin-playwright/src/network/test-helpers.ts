import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { chromium, type Browser, type Page } from 'playwright';
import type { NetworkCapture } from '@rippleview/core';

// Shared real-Chromium + real-HTTP test harness for the
// PlaywrightNetworkCapture suite (). G13: determinism via a real
// server and real browser, no mocking of the network stack itself.
//
// Mirrors packages/plugin-playwright/src/wait/test-helpers.ts exactly,
// including its `data:` URL discovery from a page loaded from a
// `data:` origin never actually dispatches its fetch() calls onto
// Chromium's network layer, so page.on('request')/page.on('response')
// never observe them. AC4 specifically requires asserting against a REAL
// captured request/response, so this harness serves fixtures over a real
// loopback HTTP server instead.

let server: http.Server | undefined;
let serverOrigin = '';
let browser: Browser | undefined;

/** Starts a tiny HTTP server (serving both pages and JSON API routes) and a real Chromium instance. */
export async function launchHarness(): Promise<void> {
  server = http.createServer((req, res) => {
    void handleRequest(req, res);
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
  apiRoutes.clear();
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const path = (req.url ?? '/').split('?')[0] ?? '/';
  const apiRoute = apiRoutes.get(path);

  if (apiRoute !== undefined) {
    const body = await readBody(req);
    res.writeHead(apiRoute.status, { 'Content-Type': 'application/json' });
    res.end(apiRoute.body(body));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(pages.get(req.url ?? '/') ?? '<p>not found</p>');
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Path -> HTML body lookup the server serves on demand.
const pages = new Map<string, string>();

interface ApiRoute {
  readonly status: number;
  body(requestBody: string): string;
}

// Path -> JSON API route lookup, registered via `registerApiRoute` below.
const apiRoutes = new Map<string, ApiRoute>();

/** Registers `html` to be served at `path` and returns the page's full URL. */
function registerPage(path: string, html: string): string {
  pages.set(path, html);
  return `${serverOrigin}${path}`;
}

/**
 * Registers a JSON API route at `path` that echoes a response built from
 * the real request body it received — a genuine server round-trip, not a
 * synthetic object (AC4).
 */
export function registerApiRoute(
  path: string,
  status: number,
  body: (requestBody: string) => string,
): void {
  apiRoutes.set(path, { status, body });
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
 * Polls capture.findRequests() until a response has actually been
 * recorded for `urlPattern` (G13: wait on the real captured-state signal
 * itself, never a fixed sleep). A page's own `fetch().then()` callback
 * resolving does NOT prove PlaywrightNetworkCapture has finished
 * recording the response body yet — that is a separate async chain
 * driven by Playwright's `requestfinished` event — so callers must wait
 * on the capture's own data, not page state, before asserting on it.
 */
export async function waitForResponseCaptured(
  capture: NetworkCapture,
  urlPattern: string,
  timeoutMs = 5000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const [exchange] = capture.findRequests(urlPattern);
    if (exchange?.status !== null && exchange?.status !== undefined) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for a captured response matching "${urlPattern}"`);
}
