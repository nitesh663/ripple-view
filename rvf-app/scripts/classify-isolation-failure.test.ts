/**
 * Unit tests for  T-5.3.3 — classify-isolation-failure.mjs.
 *
 * AC-3: an unhealthy app (timeout) is classified 'errored' (infra), never
 *       'failed' (product). Literal fixture strings only — no process
 *       involved (G13 determinism).
 */

import { describe, it, expect } from 'vitest';
import { classifyFailure, captureErrorText } from './classify-isolation-failure.mjs';

describe('classifyFailure — AC-3: infra timeout vs product failure', () => {
  it('classifies an "unhealthy" dependency message as errored', () => {
    expect(classifyFailure('dependency failed to start: container app is unhealthy')).toBe(
      'errored',
    );
  });

  it('classifies a "dependency failed to start" message as errored', () => {
    expect(
      classifyFailure('Error response from daemon: dependency failed to start: app exited(1)'),
    ).toBe('errored');
  });

  it('matches case-insensitively', () => {
    expect(classifyFailure('CONTAINER APP IS UNHEALTHY')).toBe('errored');
  });

  it('classifies a health-check timeout message as errored', () => {
    expect(classifyFailure('container app health check failed after 10 retries')).toBe('errored');
  });

  it('classifies a real runner exit (no unhealthy marker) as failed', () => {
    expect(classifyFailure('runner exited with code 1: 3 assertions failed')).toBe('failed');
  });

  it('classifies an empty/unknown stderr as failed (no infra marker present)', () => {
    expect(classifyFailure('')).toBe('failed');
  });
});

describe('captureErrorText', () => {
  it('prefers a string stderr property', () => {
    const err = Object.assign(new Error('exit 1'), { stderr: 'boom from stderr' });
    expect(captureErrorText(err)).toBe('boom from stderr');
  });

  it('decodes a Uint8Array stderr property', () => {
    const err = Object.assign(new Error('exit 1'), { stderr: Buffer.from('binary stderr') });
    expect(captureErrorText(err)).toBe('binary stderr');
  });

  it('falls back to the error message when no stderr is present', () => {
    expect(captureErrorText(new Error('plain failure'))).toBe('plain failure');
  });

  it('falls back to String(err) for a non-object throw', () => {
    expect(captureErrorText('raw string throw')).toBe('raw string throw');
  });
});
