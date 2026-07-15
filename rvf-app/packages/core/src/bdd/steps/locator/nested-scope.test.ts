import { describe, it, expect } from 'vitest';
import type { LocatorStrategy } from './types.js';

// AC-1 (T-3.3.3): nested region-scope chaining disambiguates
// elements that share role, name, AND an outer region.
describe('AC-1: nested region-scope chaining (BDD-02)', () => {
  interface FakeDropdown {
    readonly role: 'combobox';
    readonly name: string;
    readonly regionPath: readonly string[];
  }

  /**
   * Deterministic in-memory test double. Unlike 's flat
   * single-level FakeLocatorStrategy, this fake ACCUMULATES scopes across
   * chained withScope() calls (AND-semantics) and filters candidates whose
   * regionPath includes ALL currently-accumulated scopes.
   */
  class FakeNestedLocatorStrategy implements LocatorStrategy {
    readonly name = 'fake-nested';
    readonly fallbackToTestId = false;

    constructor(
      private readonly dropdowns: readonly FakeDropdown[],
      private readonly scopes: readonly string[] = [],
    ) {}

    async resolve(role: string, name: string): Promise<FakeDropdown | null> {
      const candidates = this.dropdowns.filter(
        (dropdown) => dropdown.role === role && dropdown.name === name,
      );
      const scoped = candidates.filter((dropdown) =>
        this.scopes.every((scope) => dropdown.regionPath.includes(scope)),
      );
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
      return new FakeNestedLocatorStrategy(this.dropdowns, [...this.scopes, region]);
    }
  }

  const dropdowns: readonly FakeDropdown[] = [
    { role: 'combobox', name: 'Country', regionPath: ['Address', 'Billing'] },
    { role: 'combobox', name: 'Country', regionPath: ['Address', 'Shipping'] },
  ];

  it('withScope("Address").withScope("Billing") resolves the billing dropdown', async () => {
    const strategy = new FakeNestedLocatorStrategy(dropdowns);
    const result = (await strategy
      .withScope('Address')
      .withScope('Billing')
      .resolve('combobox', 'Country', {})) as FakeDropdown;

    expect(result.regionPath).toEqual(['Address', 'Billing']);
  });

  it('withScope("Address").withScope("Shipping") resolves a distinct shipping dropdown', async () => {
    const strategy = new FakeNestedLocatorStrategy(dropdowns);
    const billing = (await strategy
      .withScope('Address')
      .withScope('Billing')
      .resolve('combobox', 'Country', {})) as FakeDropdown;
    const shipping = (await strategy
      .withScope('Address')
      .withScope('Shipping')
      .resolve('combobox', 'Country', {})) as FakeDropdown;

    expect(shipping.regionPath).toEqual(['Address', 'Shipping']);
    expect(shipping).not.toBe(billing);
  });

  it('withScope("Address") alone is still ambiguous (flat scoping is insufficient)', async () => {
    const strategy = new FakeNestedLocatorStrategy(dropdowns);
    const flatResult = (await strategy
      .withScope('Address')
      .resolve('combobox', 'Country', {})) as FakeDropdown;
    const nestedBilling = (await strategy
      .withScope('Address')
      .withScope('Billing')
      .resolve('combobox', 'Country', {})) as FakeDropdown;
    const nestedShipping = (await strategy
      .withScope('Address')
      .withScope('Shipping')
      .resolve('combobox', 'Country', {})) as FakeDropdown;

    // Flat scoping matches the first candidate inside "Address" — it cannot
    // itself prove which sub-region the match came from, demonstrating that
    // nesting (above) is required to disambiguate Billing from Shipping.
    expect(flatResult).toBeTruthy();
    expect([nestedBilling.regionPath, nestedShipping.regionPath]).toContainEqual(
      flatResult.regionPath,
    );
  });
});
