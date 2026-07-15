import { describe, it, expect } from 'vitest';
import { NetworkExchangeNotFoundError } from './errors.js';

// AC1/AC2 () — NetworkExchangeNotFoundError carries enough data to
// identify exactly which urlPattern never matched any captured exchange,
// and is never confusable with a normal status/body assertion mismatch.

describe('AC1/AC2: NetworkExchangeNotFoundError carries urlPattern exactly as constructed', () => {
  it('exposes the urlPattern that did not match', () => {
    const error = new NetworkExchangeNotFoundError('/api/orders');

    expect(error.urlPattern).toBe('/api/orders');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('NetworkExchangeNotFoundError');
  });

  it('message includes the urlPattern so a failure is traceable without inspecting fields', () => {
    const error = new NetworkExchangeNotFoundError('/api/orders');

    expect(error.message).toContain('/api/orders');
  });

  it('two different url patterns produce distinguishable errors', () => {
    const first = new NetworkExchangeNotFoundError('/api/orders');
    const second = new NetworkExchangeNotFoundError('/api/users');

    expect(first.urlPattern).not.toBe(second.urlPattern);
    expect(first.message).not.toBe(second.message);
  });
});
