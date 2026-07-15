import { describe, it, expect } from 'vitest';
import { ScopeUnreachableError } from './errors.js';

// AC3 () — ScopeUnreachableError carries enough data to identify
// exactly which region in a withScope() chain could not be reached, and is
// never confusable with a normal "region doesn't exist anywhere" silent
// empty-locator case.

describe('AC3: ScopeUnreachableError carries region exactly as constructed', () => {
  it('exposes the region name that could not be reached', () => {
    const error = new ScopeUnreachableError('Confirm Dialog');

    expect(error.region).toBe('Confirm Dialog');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ScopeUnreachableError');
  });

  it('message includes the region name so a failure is traceable without inspecting fields', () => {
    const error = new ScopeUnreachableError('Confirm Dialog');

    expect(error.message).toContain('Confirm Dialog');
  });

  it('message explains the portal-mismatch hypothesis', () => {
    const error = new ScopeUnreachableError('Confirm Dialog');

    expect(error.message.toLowerCase()).toContain('portal');
    expect(error.message).toContain('resolveUnscoped');
  });

  it('two different region names produce distinguishable errors', () => {
    const first = new ScopeUnreachableError('Confirm Dialog');
    const second = new ScopeUnreachableError('Context Menu');

    expect(first.region).not.toBe(second.region);
    expect(first.message).not.toBe(second.message);
  });
});
