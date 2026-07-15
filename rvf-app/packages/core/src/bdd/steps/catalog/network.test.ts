import { describe, it, expect } from 'vitest';
import { StepRegistry } from '../registry.js';

const registry = new StepRegistry();

// AC2 (): catalog-level matching for the three network assertion
// steps, against the registry exactly as a scenario runner would use it.
describe(' Network patterns', () => {
  it('assert-api-called: an API call is made to "/api/orders"', () => {
    const m = registry.match('an API call is made to "/api/orders"');
    expect(m?.action).toBe('assert-api-called');
    expect(m?.params).toEqual({ urlPattern: '/api/orders' });
  });

  it('assert-api-status: the API response status for "/api/orders" is 201', () => {
    const m = registry.match('the API response status for "/api/orders" is 201');
    expect(m?.action).toBe('assert-api-status');
    expect(m?.params).toEqual({ urlPattern: '/api/orders', status: 201 });
  });

  it('assert-api-body-contains: the request body for "/api/orders" contains "widget"', () => {
    const m = registry.match('the request body for "/api/orders" contains "widget"');
    expect(m?.action).toBe('assert-api-body-contains');
    expect(m?.params).toEqual({ urlPattern: '/api/orders', value: 'widget' });
  });

  it('does not match an unrelated step', () => {
    expect(registry.match('an API call is made')).toBeNull();
  });
});
