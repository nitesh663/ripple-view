import type { Page, Locator } from 'playwright';
import type { LocatorStrategy } from '@rippleview/core';
import { type AriaRole, type ScopeRoot, resolveRegion } from './region.js';

// ── PlaywrightLocatorStrategy (T-3.2.2 real implementation) ─────────────────
// G1/G11: the only framework-specific (Playwright) implementation of the
// core LocatorStrategy SPI — @rippleview/core itself stays agnostic (it only
// declares the interface in types.ts and ships DefaultLocatorStrategy's
// no-ops). `ctx` arrives as `unknown` per the SPI; this class narrows it to
// Playwright's `Page` immediately and never leaks that type back out.
//
// Region-scoping internals (REGION_ROLES, the landmark-fallback walk, and
// the  AC3 portal-mismatch detection) live in region.ts (SOLID +
// 200-line file limit) — this class owns only the LocatorStrategy SPI
// surface itself.

export class PlaywrightLocatorStrategy implements LocatorStrategy {
  readonly name = 'playwright';
  // BDD-03: mirrors DefaultLocatorStrategy's contract — this is the
  // implementation that actually performs the testid fallback.
  readonly fallbackToTestId = true;

  // Immutable region-name chain (T-3.3.3, AND-composition). Empty on a
  // freshly constructed strategy (the whole page is the scope); withScope()
  // never mutates this in place — it returns a NEW instance so any
  // already-captured reference to an outer-scoped strategy keeps resolving
  // against its own, narrower scope.
  private readonly regionChain: readonly string[];

  constructor(regionChain: readonly string[] = []) {
    this.regionChain = regionChain;
  }

  withScope(region: string): LocatorStrategy {
    return new PlaywrightLocatorStrategy([...this.regionChain, region]);
  }

  async resolve(role: string, name: string, ctx: unknown, index?: number): Promise<unknown> {
    const scope = await this.resolveScope(ctx);
    const candidate = scope.getByRole(role as AriaRole, { name });

    // BDD-03: ARIA role+name is always tried first; testid is a fallback
    // for elements real markup hasn't been given an accessible name for
    // yet, never the primary lookup (G2).
    if ((await candidate.count()) === 0) {
      return this.resolveByTestId(name, ctx);
    }

    return this.applyIndex(candidate, index);
  }

  /**
   *  AC1: resolves by role + accessible name rooted ALWAYS at the
   * real page, bypassing resolveScope()/this.regionChain entirely — a
   * portaled menu/dialog rendered near <body> is structurally outside
   * whatever region(s) withScope() has narrowed into, so the scoped
   * resolve() above can never find it once any scope is active. Same
   * role+name+testid-fallback logic as resolve(), just unconditionally
   * rooted at the page (G2).
   */
  async resolveUnscoped(
    role: string,
    name: string,
    ctx: unknown,
    index?: number,
  ): Promise<unknown> {
    const page = ctx as Page;
    const candidate = page.getByRole(role as AriaRole, { name });

    if ((await candidate.count()) === 0) {
      return page.getByTestId(name).first();
    }

    return this.applyIndex(candidate, index);
  }

  async resolveByLabel(label: string, ctx: unknown): Promise<unknown> {
    const scope = await this.resolveScope(ctx);
    return scope.getByLabel(label).first();
  }

  async resolveByText(text: string, ctx: unknown): Promise<unknown> {
    const scope = await this.resolveScope(ctx);
    return scope.getByText(text).first();
  }

  async resolveByTestId(testId: string, ctx: unknown): Promise<unknown> {
    const scope = await this.resolveScope(ctx);
    return scope.getByTestId(testId).first();
  }

  /**
   * T-3.3.4: an explicit `index` selects the Nth occurrence (1-based, to
   * match the existing `assert-visible` ordinal step's wording, e.g. "the
   * 2nd button"); Playwright's own `.nth()` is 0-based, hence the `- 1`.
   * Omitting `index` defaults to the first match — the common case where
   * role+name+scope already resolves unambiguously.
   */
  private applyIndex(candidate: Locator, index: number | undefined): Locator {
    return index === undefined ? candidate.first() : candidate.nth(index - 1);
  }

  /**
   * Walks `regionChain` in document order, narrowing one level per name:
   * each step searches ONLY within the previous step's result (never back
   * out to the full page), which is what makes nested scopes compose with
   * AND-semantics (T-3.3.3) rather than each call independently searching
   * the whole page and risking the wrong same-named region. Delegates the
   * actual landmark-role walk + AC3 portal-mismatch check to region.ts.
   */
  private async resolveScope(ctx: unknown): Promise<ScopeRoot> {
    const page = ctx as Page;
    let root: ScopeRoot = page;

    for (const regionName of this.regionChain) {
      root = await resolveRegion(root, regionName, page);
    }

    return root;
  }
}
