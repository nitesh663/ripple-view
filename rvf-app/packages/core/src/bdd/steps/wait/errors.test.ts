import { describe, it, expect } from 'vitest';
import { WaitTimeoutError } from './errors.js';

// AC2 () — WaitTimeoutError carries enough data to distinguish a
// network-idle timeout from a visual-settle timeout, and is never
// confusable with a normal assertion failure.

describe('AC2: WaitTimeoutError carries phase + timeoutMs + cause exactly as constructed', () => {
  it('exposes phase "network", timeoutMs, and cause', () => {
    const cause = new Error('Playwright waitForLoadState timeout');
    const error = new WaitTimeoutError('network', 5000, cause);

    expect(error.phase).toBe('network');
    expect(error.timeoutMs).toBe(5000);
    expect(error.cause).toBe(cause);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('WaitTimeoutError');
  });

  it('exposes phase "settle", timeoutMs, and cause', () => {
    const cause = new Error('Playwright waitForFunction timeout');
    const error = new WaitTimeoutError('settle', 1500, cause);

    expect(error.phase).toBe('settle');
    expect(error.timeoutMs).toBe(1500);
    expect(error.cause).toBe(cause);
    expect(error.name).toBe('WaitTimeoutError');
  });

  it('message includes the phase and timeoutMs so a failure is traceable without inspecting fields', () => {
    const error = new WaitTimeoutError('network', 5000, new Error('boom'));

    expect(error.message).toContain('network');
    expect(error.message).toContain('5000');
  });

  it('"network" and "settle" phases produce distinguishable errors, never a generic message', () => {
    const networkError = new WaitTimeoutError('network', 1000, new Error('a'));
    const settleError = new WaitTimeoutError('settle', 1000, new Error('b'));

    expect(networkError.phase).not.toBe(settleError.phase);
    expect(networkError.message).not.toBe(settleError.message);
  });
});
