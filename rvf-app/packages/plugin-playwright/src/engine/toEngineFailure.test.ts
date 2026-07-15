import { describe, expect, it } from 'vitest';
import { StepAssertionError, StepExecutionError } from '@rippleview/core';
import { toEngineFailure } from './toEngineFailure.js';

//  AC3: EngineResult.failure must name the specific failing step —
// proven here for each error shape the real PlaywrightStepExecutor can
// throw, plus the defensive non-Error fallback.
describe('toEngineFailure', () => {
  it('fills actual/expected from a StepAssertionError', () => {
    const error = new StepAssertionError(
      'the button "Refresh" is disabled',
      'assert-disabled',
      false,
      true,
    );

    const failure = toEngineFailure('the button "Refresh" is disabled', 'assert-disabled', error);

    expect(failure.stepText).toBe('the button "Refresh" is disabled');
    expect(failure.action).toBe('assert-disabled');
    expect(failure.actual).toBe(false);
    expect(failure.expected).toBe(true);
    expect(failure.message).toContain('expected true but got false');
  });

  it('fills only stepText/action/message from a plain StepExecutionError', () => {
    const error = new StepExecutionError(
      'I activate the button "Missing"',
      'activate',
      new Error('no element matched'),
    );

    const failure = toEngineFailure('I activate the button "Missing"', 'activate', error);

    expect(failure.stepText).toBe('I activate the button "Missing"');
    expect(failure.action).toBe('activate');
    expect(failure.message).toContain('no element matched');
    expect(failure.actual).toBeUndefined();
    expect(failure.expected).toBeUndefined();
  });

  it('falls back to the caller-supplied stepText/action and an Error message for anything else', () => {
    const failure = toEngineFailure('a totally unexpected step', 'navigate', new Error('boom'));

    expect(failure.stepText).toBe('a totally unexpected step');
    expect(failure.action).toBe('navigate');
    expect(failure.message).toBe('boom');
  });

  it('falls back to String(error) for a non-Error throw', () => {
    const failure = toEngineFailure('a step', 'navigate', 'not an Error instance');

    expect(failure.message).toBe('not an Error instance');
  });
});
