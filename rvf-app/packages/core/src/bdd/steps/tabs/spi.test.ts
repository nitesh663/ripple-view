import { describe, it, expect } from 'vitest';
import { DefaultTabTracker } from './DefaultTabTracker.js';
import { NoNewTabOpenedError } from './errors.js';
import type { TabTracker } from './types.js';

// AC2 () — TabTracker SPI: the skeleton-stage default and a
// deterministic fake proving the track/switch contract, no real browser
// involved (G13).

describe('AC2: DefaultTabTracker (TabTracker SPI skeleton default)', () => {
  it('name is "default"', () => {
    const tracker = new DefaultTabTracker();
    expect(tracker.name).toBe('default');
  });

  it('start() does not throw (no-op in core)', () => {
    const tracker = new DefaultTabTracker();
    expect(() => tracker.start({})).not.toThrow();
  });

  it('switchToNewTab() throws NoNewTabOpenedError (core never has a tracked tab)', () => {
    const tracker = new DefaultTabTracker();
    expect(() => tracker.switchToNewTab()).toThrow(NoNewTabOpenedError);
  });
});

// AC2 — track/switch contract, proven against a deterministic fake rather
// than a real browser context.
describe('AC2: track/switch contract (fake TabTracker)', () => {
  class FakeTabTracker implements TabTracker {
    readonly name = 'fake';
    private readonly tracked: unknown[] = [];

    start(): void {
      // intentional no-op: this fake is seeded via openTab() below
    }

    /** Simulates a new tab/window opening, exactly like a real context's 'page' event. */
    openTab(ctx: unknown): void {
      this.tracked.push(ctx);
    }

    switchToNewTab(): unknown {
      const latest = this.tracked[this.tracked.length - 1];
      if (latest === undefined) {
        throw new NoNewTabOpenedError();
      }
      return latest;
    }
  }

  it('throws NoNewTabOpenedError when nothing has opened yet', () => {
    const tracker = new FakeTabTracker();
    expect(() => tracker.switchToNewTab()).toThrow(NoNewTabOpenedError);
  });

  it('returns the most-recently-opened tab when exactly one has opened', () => {
    const tracker = new FakeTabTracker();
    const fakePage = { id: 'tab-1' };
    tracker.openTab(fakePage);
    expect(tracker.switchToNewTab()).toBe(fakePage);
  });

  it('returns the LATEST tab when more than one has opened, in order', () => {
    const tracker = new FakeTabTracker();
    tracker.openTab({ id: 'tab-1' });
    const latest = { id: 'tab-2' };
    tracker.openTab(latest);
    expect(tracker.switchToNewTab()).toBe(latest);
  });
});
