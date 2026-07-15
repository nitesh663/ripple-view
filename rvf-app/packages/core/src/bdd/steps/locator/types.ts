/**
 * LocatorStrategy SPI (T-3.2.2).
 *
 * G1:  ctx is unknown — core never imports Playwright or any framework type.
 * G11: Implement in a plugin (@rippleview/plugin-playwright etc.); never fork core.
 * BDD-03: fallbackToTestId = true means the implementation MUST fall back
 *         to data-testid resolution when ARIA role+name lookup fails.
 */
export interface LocatorStrategy {
  readonly name: string;
  /**
   * Whether this strategy falls back to data-testid if ARIA lookup fails.
   * The DefaultLocatorStrategy sets this to true (BDD-03 policy).
   */
  readonly fallbackToTestId: boolean;
  /**
   * Resolve an element by ARIA role + accessible name.
   *
   * @param index Optional 1-based ordinal disambiguator (T-3.3.4). When
   *   role+name+scope still resolves multiple candidates (e.g. two identical
   *   elements in the same region with no further sub-region to narrow by),
   *   `index` selects which occurrence in document order to return — e.g.
   *   `2` means "the 2nd occurrence". Omitting it defaults to the first
   *   match. Real DOM/.nth()-style indexing lives in the framework plugin
   *   (G11); this is just the SPI contract.
   */
  resolve(role: string, name: string, ctx: unknown, index?: number): Promise<unknown>;
  /**
   * Resolve an element by ARIA role + accessible name, ALWAYS rooted at the
   * page itself, ignoring any active withScope() chain entirely (
   * AC1).
   *
   * Why this exists as a separate method rather than a `resolve()` option:
   * a portaled menu/dialog (e.g. a right-click context menu, or a modal
   * rendered via React/Angular portal APIs) is attached as a direct or
   * near-direct child of `<body>`, structurally OUTSIDE whatever DOM
   * subtree the element that triggered it lives in. Once any withScope()
   * narrowing is active, `resolve()`'s scoped lookup can never find such an
   * element — not because the lookup is wrong, but because the element is
   * genuinely not inside that scope's subtree. `resolveUnscoped()` is the
   * deliberate escape hatch: it deliberately bypasses scope narrowing so a
   * caller can still find content the page renders elsewhere by design.
   *
   * This is intentionally generic — not menu-item-specific — so any future
   * portal-aware action (dialogs, toasts, overlays) can reuse it.
   */
  resolveUnscoped(role: string, name: string, ctx: unknown, index?: number): Promise<unknown>;
  /** Resolve an element by its associated label text. */
  resolveByLabel(label: string, ctx: unknown): Promise<unknown>;
  /** Resolve an element by visible text content. */
  resolveByText(text: string, ctx: unknown): Promise<unknown>;
  /** Resolve an element by data-testid attribute (BDD-03 fallback). */
  resolveByTestId(testId: string, ctx: unknown): Promise<unknown>;
  /**
   * Region-scoping locator chaining (BDD-02).
   *
   * Returns a LocatorStrategy whose subsequent resolve*() calls are scoped
   * to the named region (e.g. `within the "Header" region`), so that an
   * otherwise-ambiguous role+name lookup resolves to the element inside
   * that region. Real DOM/A11y-tree scoping logic lives in the framework
   * plugin (G11); this is just the SPI contract.
   *
   * T-3.3.3: repeated/chained calls COMPOSE — each call narrows the
   * existing scope further (AND-semantics), it does not replace it. For
   * example `.withScope('Address').withScope('Billing')` resolves elements
   * that are inside "Billing" which is itself inside "Address", not merely
   * inside "Billing" anywhere on the page. This allows nested region
   * scoping to disambiguate elements that share role, name, AND an outer
   * region (e.g. two "Country" dropdowns inside one "Address" section).
   */
  withScope(region: string): LocatorStrategy;
}
