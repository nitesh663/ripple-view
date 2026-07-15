import { describe, it, expect } from 'vitest';
import { NoNewTabOpenedError } from './errors.js';

// AC2 () — NoNewTabOpenedError is distinguishable from any other
// execution failure when `I switch to the new tab` finds nothing tracked.

describe('AC2: NoNewTabOpenedError', () => {
  it('is an Error with the expected name', () => {
    const error = new NoNewTabOpenedError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('NoNewTabOpenedError');
  });

  it('message explains the likely causes so the gap is traceable', () => {
    const error = new NoNewTabOpenedError();

    expect(error.message).toContain('No new tab/window has been tracked yet');
  });

  it('two instances produce the same, stable message (deterministic, no per-call data to vary)', () => {
    const first = new NoNewTabOpenedError();
    const second = new NoNewTabOpenedError();

    expect(first.message).toBe(second.message);
  });
});
