import { describe, it, expect } from 'vitest';
import { DefaultLocatorStrategy } from './locator/DefaultLocatorStrategy.js';
import type { LocatorStrategy } from './locator/types.js';
import { NoOpWaitStrategy } from './wait/NoOpWaitStrategy.js';

// AC-2: BDD-03 — ARIA missing → testid fallback policy
describe('AC-2: DefaultLocatorStrategy (BDD-03)', () => {
  it('fallbackToTestId is true', () => {
    const strategy = new DefaultLocatorStrategy();
    expect(strategy.fallbackToTestId).toBe(true);
  });

  it('name is "default"', () => {
    const strategy = new DefaultLocatorStrategy();
    expect(strategy.name).toBe('default');
  });

  it('resolve() returns null (no-op in core)', async () => {
    const strategy = new DefaultLocatorStrategy();
    await expect(strategy.resolve()).resolves.toBeNull();
  });

  it('resolveUnscoped() returns null (no-op in core)', async () => {
    const strategy = new DefaultLocatorStrategy();
    await expect(strategy.resolveUnscoped()).resolves.toBeNull();
  });

  it('resolveByLabel() returns null', async () => {
    const strategy = new DefaultLocatorStrategy();
    await expect(strategy.resolveByLabel()).resolves.toBeNull();
  });

  it('resolveByText() returns null', async () => {
    const strategy = new DefaultLocatorStrategy();
    await expect(strategy.resolveByText()).resolves.toBeNull();
  });

  it('resolveByTestId() returns null', async () => {
    const strategy = new DefaultLocatorStrategy();
    await expect(strategy.resolveByTestId()).resolves.toBeNull();
  });

  it('withScope() returns the same instance (no-op in core)', () => {
    const strategy = new DefaultLocatorStrategy();
    expect(strategy.withScope('Header')).toBe(strategy);
  });
});

// AC-1: BDD-02 — region-scoping locator chaining disambiguates ambiguous elements
describe('AC-1: region-scoping locator chaining (BDD-02)', () => {
  interface FakeButton {
    readonly role: 'button';
    readonly name: string;
    readonly region: string;
  }

  /**
   * Deterministic in-memory test double. Models two "Login" buttons tagged
   * with regions "Header" and "Footer". Unscoped resolve() is ambiguous and
   * returns the first match; withScope(region) narrows resolve() to only
   * search within that region, proving disambiguation.
   */
  class FakeLocatorStrategy implements LocatorStrategy {
    readonly name = 'fake';
    readonly fallbackToTestId = false;

    constructor(
      private readonly buttons: readonly FakeButton[],
      private readonly scope: string | null = null,
    ) {}

    async resolve(role: string, name: string): Promise<FakeButton | null> {
      const candidates = this.buttons.filter(
        (button) => button.role === role && button.name === name,
      );
      const scoped =
        this.scope === null
          ? candidates
          : candidates.filter((button) => button.region === this.scope);
      return scoped[0] ?? null;
    }

    async resolveUnscoped(): Promise<unknown> {
      return null;
    }

    async resolveByLabel(): Promise<unknown> {
      return null;
    }

    async resolveByText(): Promise<unknown> {
      return null;
    }

    async resolveByTestId(): Promise<unknown> {
      return null;
    }

    withScope(region: string): LocatorStrategy {
      return new FakeLocatorStrategy(this.buttons, region);
    }
  }

  const buttons: readonly FakeButton[] = [
    { role: 'button', name: 'Login', region: 'Header' },
    { role: 'button', name: 'Login', region: 'Footer' },
  ];

  it('unscoped resolve() is ambiguous and returns the first match', async () => {
    const strategy = new FakeLocatorStrategy(buttons);
    const result = await strategy.resolve('button', 'Login', {});
    expect(result).toEqual({ role: 'button', name: 'Login', region: 'Header' });
  });

  it('withScope("Header").resolve() returns specifically the header button', async () => {
    const strategy = new FakeLocatorStrategy(buttons);
    const headerButton = (await strategy
      .withScope('Header')
      .resolve('button', 'Login', {})) as FakeButton;
    const footerButton = (await strategy
      .withScope('Footer')
      .resolve('button', 'Login', {})) as FakeButton;

    expect(headerButton.region).toBe('Header');
    expect(footerButton.region).toBe('Footer');
    expect(headerButton).not.toBe(footerButton);
  });
});

// AC-3: BDD-04 — pending XHR → auto-wait until idle
describe('AC-3: NoOpWaitStrategy (BDD-04)', () => {
  it('waitForNetworkIdle resolves without error', async () => {
    const strategy = new NoOpWaitStrategy();
    await expect(strategy.waitForNetworkIdle()).resolves.toBeUndefined();
  });

  it('waitForNetworkIdle resolves without error (no-op regardless of args)', async () => {
    const strategy = new NoOpWaitStrategy();
    await expect(strategy.waitForNetworkIdle()).resolves.toBeUndefined();
  });
});
