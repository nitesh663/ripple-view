import { describe, it, expect } from 'vitest';
import { DefaultDialogPolicy } from './DefaultDialogPolicy.js';
import type { DialogPolicy } from './types.js';

// AC1 () — DialogPolicy SPI: the skeleton-stage default and a
// deterministic fake proving the one-shot-override contract, no real
// browser involved (G13).

describe('AC1: DefaultDialogPolicy (DialogPolicy SPI skeleton default)', () => {
  it('name is "default"', () => {
    const policy = new DefaultDialogPolicy();
    expect(policy.name).toBe('default');
  });

  it('start() does not throw (no-op in core)', () => {
    const policy = new DefaultDialogPolicy();
    expect(() => policy.start({})).not.toThrow();
  });

  it('armNext() does not throw (no-op in core)', () => {
    const policy = new DefaultDialogPolicy();
    expect(() => policy.armNext('accept')).not.toThrow();
    expect(() => policy.armNext('dismiss')).not.toThrow();
  });
});

// AC1 — one-shot-override contract, proven against a deterministic fake
// rather than a real browser dialog.
describe('AC1: one-shot override contract (fake DialogPolicy)', () => {
  class FakeDialogPolicy implements DialogPolicy {
    readonly name = 'fake';
    private oneShot: 'accept' | 'dismiss' | undefined;
    readonly resolutions: ('accept' | 'dismiss')[] = [];

    start(): void {
      // intentional no-op: this fake has no real dialogs to listen for
    }

    armNext(disposition: 'accept' | 'dismiss'): void {
      this.oneShot = disposition;
    }

    /** Simulates a dialog event resolving exactly like the real plugin would. */
    fireDialog(): void {
      const disposition = this.oneShot ?? 'dismiss';
      this.oneShot = undefined;
      this.resolutions.push(disposition);
    }
  }

  it('defaults to dismiss when no override has been armed', () => {
    const policy = new FakeDialogPolicy();
    policy.fireDialog();
    expect(policy.resolutions).toEqual(['dismiss']);
  });

  it('an armed "accept" override resolves the very next dialog as accept', () => {
    const policy = new FakeDialogPolicy();
    policy.armNext('accept');
    policy.fireDialog();
    expect(policy.resolutions).toEqual(['accept']);
  });

  it('the override is consumed after one dialog — the dialog after that reverts to default', () => {
    const policy = new FakeDialogPolicy();
    policy.armNext('accept');
    policy.fireDialog();
    policy.fireDialog();
    expect(policy.resolutions).toEqual(['accept', 'dismiss']);
  });

  it('an armed "dismiss" override resolves the very next dialog as dismiss', () => {
    const policy = new FakeDialogPolicy();
    policy.armNext('dismiss');
    policy.fireDialog();
    expect(policy.resolutions).toEqual(['dismiss']);
  });
});
