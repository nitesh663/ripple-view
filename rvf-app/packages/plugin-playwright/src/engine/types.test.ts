import { describe, expect, it } from 'vitest';
import { chromium, webkit, firefox } from 'playwright';
import { resolveLauncher, UnknownBrowserEngineError } from './types.js';

//  AC2: the matrix's `browser` string must resolve to a real
// Playwright launcher for each of the three configured engines.
describe('resolveLauncher', () => {
  it('resolves "chromium" to the real chromium launcher', () => {
    expect(resolveLauncher('chromium')).toBe(chromium);
  });

  it('resolves "webkit" to the real webkit launcher', () => {
    expect(resolveLauncher('webkit')).toBe(webkit);
  });

  it('resolves "firefox" to the real firefox launcher', () => {
    expect(resolveLauncher('firefox')).toBe(firefox);
  });

  it('throws UnknownBrowserEngineError naming the bad value for an unrecognized engine', () => {
    expect(() => resolveLauncher('edge')).toThrow(UnknownBrowserEngineError);
    try {
      resolveLauncher('edge');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(UnknownBrowserEngineError);
      expect((error as UnknownBrowserEngineError).browser).toBe('edge');
      expect((error as Error).message).toContain('edge');
    }
  });
});
