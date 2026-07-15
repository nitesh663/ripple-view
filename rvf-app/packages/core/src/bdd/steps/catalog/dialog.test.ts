import { describe, it, expect } from 'vitest';
import { StepRegistry } from '../registry.js';

const registry = new StepRegistry();

// AC1/AC2 (): catalog-level matching for the dialog override steps
// and the tab-switch step, against the registry exactly as a scenario
// runner would use it.
describe(' Dialog/tab patterns', () => {
  it('accept-dialog: I accept the dialog', () => {
    const m = registry.match('I accept the dialog');
    expect(m?.action).toBe('accept-dialog');
    expect(m?.params).toEqual({});
  });

  it('dismiss-dialog: I dismiss the dialog', () => {
    const m = registry.match('I dismiss the dialog');
    expect(m?.action).toBe('dismiss-dialog');
    expect(m?.params).toEqual({});
  });

  it('switch-to-new-tab: I switch to the new tab', () => {
    const m = registry.match('I switch to the new tab');
    expect(m?.action).toBe('switch-to-new-tab');
    expect(m?.params).toEqual({});
  });

  it('does not match an unrelated step', () => {
    expect(registry.match('I accept the cookie banner')).toBeNull();
  });
});
