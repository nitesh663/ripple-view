import { describe, it, expect } from 'vitest';
import { StepRegistry } from '../registry.js';

const registry = new StepRegistry();

// AC-2 (T-3.3.4): catalog-level ordinal disambiguation matching.
describe('AC-2: ordinal-qualified assert-visible pattern', () => {
  it('the 2nd dropdown "Country" is visible -> assert-visible with index', () => {
    const m = registry.match('the 2nd dropdown "Country" is visible');
    expect(m?.action).toBe('assert-visible');
    expect(m?.params).toEqual({ role: 'dropdown', name: 'Country', index: 2 });
  });

  it('the 1st dropdown "Country" is visible -> index 1 (suffix-agnostic)', () => {
    const m = registry.match('the 1st dropdown "Country" is visible');
    expect(m?.params).toEqual({ role: 'dropdown', name: 'Country', index: 1 });
  });

  it('the 3rd dropdown "Country" is visible -> index 3 (suffix-agnostic)', () => {
    const m = registry.match('the 3rd dropdown "Country" is visible');
    expect(m?.params).toEqual({ role: 'dropdown', name: 'Country', index: 3 });
  });

  it('non-ordinal phrasing still matches the original bare pattern, no index key', () => {
    const m = registry.match('the dropdown "Country" is visible');
    expect(m?.action).toBe('assert-visible');
    expect(m?.params).toEqual({ role: 'dropdown', name: 'Country' });
    expect(m?.params['index']).toBeUndefined();
  });
});
