import { describe, it, expect } from 'vitest';
import { VERSION } from './index.js';

describe('@rippleview/core', () => {
  it('exports VERSION as a string', () => {
    expect(typeof VERSION).toBe('string');
  });
});
