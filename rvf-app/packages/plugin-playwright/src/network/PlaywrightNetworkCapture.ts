import type { Page, Request, Response } from 'playwright';
import type { NetworkCapture, NetworkExchange } from '@rippleview/core';

/**
 * Real NetworkCapture implementation ( AC3).
 *
 * G1/G11: the only framework-specific (Playwright) implementation of the
 * core NetworkCapture SPI — @rippleview/core itself stays agnostic (it only
 * declares the interface in network/types.ts and ships
 * DefaultNetworkCapture's no-op). `ctx` arrives as `unknown` per the SPI;
 * this class narrows it to Playwright's `Page` immediately and never
 * leaks that type back out.
 *
 * Records via page.on('request')/page.on('requestfinished') rather than
 * page.route() — route() would require this class to intercept and
 * decide how to fulfill every request, which is not its job; listening
 * only observes what already happens on the wire, leaving real
 * navigation/fetch behavior completely untouched (no risk of stalling a
 * request this capture itself should never affect).
 *
 * `requestfinished` (not `response`) is the deterministic signal used to
 * read the body: `response` fires as soon as headers/status arrive, but
 * the body may still be streaming in over CDP at that point — reading it
 * then races the page's own `fetch().then()` callback (G13: determinism).
 * `requestfinished` only fires once the full response body has actually
 * been received, so `request.response()!.text()` is always safe there.
 */
export class PlaywrightNetworkCapture implements NetworkCapture {
  readonly name = 'playwright';

  private readonly exchangesByUrl = new Map<string, NetworkExchange>();

  start(ctx: unknown): void {
    const page = ctx as Page;
    page.on('request', (request) => {
      this.recordRequest(request);
    });
    page.on('requestfinished', (request) => {
      this.recordResponse(request).catch(() => {
        // The page/context can close while a response read is still
        // in-flight (e.g. a test calling page.close() right after its
        // assertions) — request.response() or response.text() can then
        // reject. The exchange simply stays unfinalized (status/body
        // null), which is already the correct, observable state; this
        // must not become an unhandled rejection (G13: a torn-down page
        // is not a capture bug).
      });
    });
  }

  findRequests(urlPattern: string | RegExp): readonly NetworkExchange[] {
    const all = [...this.exchangesByUrl.values()];
    return all.filter((exchange) =>
      typeof urlPattern === 'string'
        ? exchange.url.includes(urlPattern)
        : urlPattern.test(exchange.url),
    );
  }

  private recordRequest(request: Request): void {
    this.exchangesByUrl.set(request.url(), {
      url: request.url(),
      method: request.method(),
      requestBody: request.postData(),
      status: null,
      responseBody: null,
    });
  }

  private async recordResponse(request: Request): Promise<void> {
    const existing = this.exchangesByUrl.get(request.url());
    const response = await request.response();
    if (existing === undefined || response === null) {
      return;
    }

    const responseBody = await this.readResponseBody(response);
    this.exchangesByUrl.set(request.url(), {
      ...existing,
      status: response.status(),
      responseBody,
    });
  }

  private async readResponseBody(response: Response): Promise<string | null> {
    try {
      return await response.text();
    } catch {
      // A response body can be unreadable (e.g. a redirect or an aborted
      // request) — status is still useful, so this stays a soft null
      // rather than failing the whole capture (G10: findings are data).
      return null;
    }
  }
}
