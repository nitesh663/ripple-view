/**
 * NetworkCapture SPI ( / T-3.2.5).
 *
 * G1:  ctx is unknown — core never imports Playwright or any framework type.
 * G11: Implement in a plugin (@rippleview/plugin-playwright etc.); never fork core.
 * AC1: records requests/responses during a scenario and exposes a
 *      matcher-based query rather than a generic event-replay API — this
 *      is deliberately minimal, scoped to exactly what the three
 *      network.ts catalog steps need (existence-by-URL, status-by-URL,
 *      request-body-contains-by-URL).
 */

/**
 * One captured HTTP exchange. `status` and `responseBody` are `null` until
 * the matching response actually arrives — a request that never resolves
 * still shows up in findRequests() (so "an API call is made" can pass
 * before the response lands), but the status/body assertion steps can
 * only succeed once the response half is recorded too.
 */
export interface NetworkExchange {
  readonly url: string;
  readonly method: string;
  readonly requestBody: string | null;
  readonly status: number | null;
  readonly responseBody: string | null;
}

export interface NetworkCapture {
  readonly name: string;
  /**
   * Starts recording requests/responses against the given framework
   * context (e.g. a Playwright `Page`). MUST be called before the
   * scenario's first step so the very first network call a step triggers
   * is observed — never after-the-fact for that first request.
   */
  start(ctx: unknown): void;
  /**
   * Returns every captured exchange whose URL matches `urlPattern`, in the
   * order they were observed. A string pattern matches via substring
   * containment (e.g. "/api/users" matches
   * "http://localhost:1234/api/users?page=2"); a RegExp matches via
   * `.test(url)`. Returns an empty array when nothing matches yet — this
   * is a query, never a throwing lookup (G10: findings are data).
   */
  findRequests(urlPattern: string | RegExp): readonly NetworkExchange[];
}
