import { describe, it, expect } from 'vitest';
import { DefaultNetworkCapture } from './DefaultNetworkCapture.js';
import type { NetworkCapture, NetworkExchange } from './types.js';

// AC1 () — NetworkCapture SPI: the skeleton-stage default and a
// deterministic fake proving the matcher-based query contract, no real
// network involved (G13).

describe('AC1: DefaultNetworkCapture (NetworkCapture SPI skeleton default)', () => {
  it('name is "default"', () => {
    const capture = new DefaultNetworkCapture();
    expect(capture.name).toBe('default');
  });

  it('start() does not throw (no-op in core)', () => {
    const capture = new DefaultNetworkCapture();
    expect(() => capture.start({})).not.toThrow();
  });

  it('findRequests() returns an empty array regardless of pattern (no-op in core)', () => {
    const capture = new DefaultNetworkCapture();
    expect(capture.findRequests('/api/anything')).toEqual([]);
    expect(capture.findRequests(/.*/)).toEqual([]);
  });
});

// AC1 — matcher-based query contract, proven against a deterministic fake
// rather than a generic event-replay API.
describe('AC1: matcher-based query contract (fake NetworkCapture)', () => {
  class FakeNetworkCapture implements NetworkCapture {
    readonly name = 'fake';

    constructor(private readonly exchanges: readonly NetworkExchange[]) {}

    start(): void {
      // intentional no-op: this fake is pre-seeded in the constructor
    }

    findRequests(urlPattern: string | RegExp): readonly NetworkExchange[] {
      return this.exchanges.filter((exchange) =>
        typeof urlPattern === 'string'
          ? exchange.url.includes(urlPattern)
          : urlPattern.test(exchange.url),
      );
    }
  }

  const exchanges: readonly NetworkExchange[] = [
    {
      url: 'http://localhost:1234/api/orders',
      method: 'POST',
      requestBody: '{"item":"widget"}',
      status: 201,
      responseBody: '{"id":1}',
    },
    {
      url: 'http://localhost:1234/api/users',
      method: 'GET',
      requestBody: null,
      status: 200,
      responseBody: '[]',
    },
  ];

  it('string pattern matches by substring containment', () => {
    const capture = new FakeNetworkCapture(exchanges);
    const matches = capture.findRequests('/api/orders');
    expect(matches).toHaveLength(1);
    expect(matches[0]?.method).toBe('POST');
  });

  it('RegExp pattern matches via .test(url)', () => {
    const capture = new FakeNetworkCapture(exchanges);
    const matches = capture.findRequests(/\/api\/users$/);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.status).toBe(200);
  });

  it('returns an empty array when nothing matches — a query, never a throw', () => {
    const capture = new FakeNetworkCapture(exchanges);
    expect(capture.findRequests('/api/missing')).toEqual([]);
  });
});
