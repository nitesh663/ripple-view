import { describe, it, expect } from 'vitest';
import { NoOpStepExecutor } from './NoOpStepExecutor.js';
import { StepExecutionError, StepAssertionError } from './errors.js';

// AC1/AC2/AC3 — StepExecutor SPI (): the skeleton-stage default and
// the error hierarchy that carries enough data to trace any failure back
// to its exact step text + action (and, for assertions, actual/expected).

describe('AC1: NoOpStepExecutor (StepExecutor SPI skeleton default)', () => {
  it('execute() resolves without error and performs no action (no-op in core)', async () => {
    const executor = new NoOpStepExecutor();

    await expect(
      executor.execute(
        'I activate the button "Save"',
        { action: 'activate', params: {} },
        {
          name: 'fake',
          fallbackToTestId: false,
          resolve: async () => null,
          resolveByLabel: async () => null,
          resolveByText: async () => null,
          resolveByTestId: async () => null,
          withScope: () => {
            throw new Error('not used in this test');
          },
        },
        {},
      ),
    ).resolves.toBeUndefined();
  });
});

describe('AC2/AC3: StepExecutionError carries stepText + action for any failure', () => {
  it('exposes stepText, action, and cause exactly as constructed', () => {
    const cause = new Error('Playwright timeout');
    const error = new StepExecutionError('I activate the button "Save"', 'activate', cause);

    expect(error.stepText).toBe('I activate the button "Save"');
    expect(error.action).toBe('activate');
    expect(error.cause).toBe(cause);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('StepExecutionError');
  });

  it('message includes the step text and action so a failure is traceable without inspecting fields', () => {
    const error = new StepExecutionError(
      'I activate the button "Save"',
      'activate',
      new Error('boom'),
    );

    expect(error.message).toContain('I activate the button "Save"');
    expect(error.message).toContain('activate');
  });
});

describe('AC2: StepAssertionError carries actual vs expected (typed, not generic)', () => {
  it('exposes stepText, action, actual, and expected exactly as constructed', () => {
    const error = new StepAssertionError(
      'the button "Save" is visible',
      'assert-visible',
      false,
      true,
    );

    expect(error.stepText).toBe('the button "Save" is visible');
    expect(error.action).toBe('assert-visible');
    expect(error.actual).toBe(false);
    expect(error.expected).toBe(true);
    expect(error.name).toBe('StepAssertionError');
  });

  it('is a StepExecutionError (assertion failure is a specific kind of step failure)', () => {
    const error = new StepAssertionError('the count equals 5', 'assert-count', 3, 5);

    expect(error).toBeInstanceOf(StepExecutionError);
  });

  it('accepts an explicit message overriding the default actual/expected summary', () => {
    const error = new StepAssertionError(
      'the selection equals "Blue"',
      'assert-selection',
      'Red',
      'Blue',
      'selected option text did not match',
    );

    expect(error.message).toContain('selected option text did not match');
  });
});
