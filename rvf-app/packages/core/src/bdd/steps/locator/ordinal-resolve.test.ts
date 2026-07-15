import { describe, it, expect } from 'vitest';
import type { LocatorStrategy } from './types.js';

// AC-2 (T-3.3.4): ordinal disambiguation for elements that share
// role, name, AND region with no further sub-region available to narrow by.
describe('AC-2: ordinal disambiguation (BDD-02)', () => {
  interface FakeDropdown {
    readonly role: 'combobox';
    readonly name: string;
    readonly region: string;
  }

  /**
   * Deterministic in-memory test double modeling two identical "Country"
   * dropdowns in the SAME region. resolve()'s 4th param (index, 1-based)
   * selects which matching candidate in array/document order to return;
   * omitting it defaults to the first.
   */
  class FakeOrdinalLocatorStrategy implements LocatorStrategy {
    readonly name = 'fake-ordinal';
    readonly fallbackToTestId = false;

    constructor(
      private readonly dropdowns: readonly FakeDropdown[],
      private readonly scope: string | null = null,
    ) {}

    async resolve(
      role: string,
      name: string,
      _ctx: unknown,
      index?: number,
    ): Promise<FakeDropdown | null> {
      const candidates = this.dropdowns.filter(
        (dropdown) => dropdown.role === role && dropdown.name === name,
      );
      const scoped =
        this.scope === null
          ? candidates
          : candidates.filter((dropdown) => dropdown.region === this.scope);
      const position = (index ?? 1) - 1;
      return scoped[position] ?? null;
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
      return new FakeOrdinalLocatorStrategy(this.dropdowns, region);
    }
  }

  const dropdowns: readonly FakeDropdown[] = [
    { role: 'combobox', name: 'Country', region: 'Shipping' },
    { role: 'combobox', name: 'Country', region: 'Shipping' },
  ];

  it('resolve(..., 2) returns the second dropdown in document order', async () => {
    const strategy = new FakeOrdinalLocatorStrategy(dropdowns).withScope('Shipping');
    const second = await strategy.resolve('combobox', 'Country', {}, 2);

    expect(second).toBe(dropdowns[1]);
  });

  it('resolve(..., 1) and omitted index both return the first dropdown', async () => {
    const strategy = new FakeOrdinalLocatorStrategy(dropdowns).withScope('Shipping');
    const explicitFirst = await strategy.resolve('combobox', 'Country', {}, 1);
    const defaultFirst = await strategy.resolve('combobox', 'Country', {});

    expect(explicitFirst).toBe(dropdowns[0]);
    expect(defaultFirst).toBe(dropdowns[0]);
  });

  it('the first and second resolved dropdowns are distinct objects', async () => {
    const strategy = new FakeOrdinalLocatorStrategy(dropdowns).withScope('Shipping');
    const first = await strategy.resolve('combobox', 'Country', {}, 1);
    const second = await strategy.resolve('combobox', 'Country', {}, 2);

    expect(first).not.toBe(second);
  });
});
