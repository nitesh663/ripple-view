import type { Page, Locator } from 'playwright';
import { ScopeUnreachableError } from '@rippleview/core';

// ── Region-scoping helpers for PlaywrightLocatorStrategy.withScope() ───────
// Split out of PlaywrightLocatorStrategy.ts (SOLID + 200-line file limit):
// this file owns ONLY the landmark-role-fallback walk used to resolve a
// named region, plus the  AC3 portal-mismatch detection layered on
// top of it. The strategy class itself stays focused on the LocatorStrategy
// SPI surface.

// `getByRole`'s real Playwright signature pins `role` to a literal ARIA-role
// union, not `string` — the SPI intentionally keeps `role: string` so core
// never imports Playwright's types (G1). The narrowing cast at each call
// site is the one, deliberate seam where that SPI-level looseness meets
// Playwright's stricter real API; it is a type-level cast only (never
// `any`), not a runtime behavior change.
export type AriaRole = Parameters<Page['getByRole']>[0];

// G2: landmark/grouping roles tried in this fixed order when resolving a
// named region for withScope(). This generalizes the `main`-then-`body`
// fallback heuristic already proven in captureAccessibilityTree.ts to the
// full set of ARIA roles real markup commonly exposes as a named "region"
// (native <section aria-labelledby> computes role="region", which is why
// it leads the list — confirmed against the real rippleview-examples billing-app
// fixture this story is grounded in).
export const REGION_ROLES: readonly AriaRole[] = [
  'region',
  'group',
  'form',
  'navigation',
  'banner',
  'contentinfo',
  'complementary',
  'main',
  'dialog',
  'tabpanel',
];

/** Either the real `Page` itself (no scope yet) or a narrowed `Locator`. */
export type ScopeRoot = Page | Locator;

/**
 * Tries each landmark role in REGION_ROLES order against `root`, taking the
 * first one with a non-empty match — mirrors the real "first landmark that
 * actually exists" heuristic already proven in captureAccessibilityTree.ts,
 * generalized from a single `main`/`body` pair to the full landmark/
 * grouping vocabulary a real region name can resolve through.
 *
 *  AC3: when the scoped walk above finds nothing, `root` may itself
 * already be narrowed by an earlier withScope() call in the chain. At the
 * FIRST level of a chain, `root` already IS `page` (no narrowing has
 * happened yet), so a scoped vs. page-level search there is identical and
 * would never produce a useful, non-redundant signal — this portal-mismatch
 * check is therefore only meaningful from the SECOND level of chaining
 * onward (i.e. `root !== page`), which is exactly the genuinely-nested
 * `withScope().withScope()` scenario AC3 describes. In that case, if the
 * SAME regionName search rooted at the unscoped page DOES find a match, the
 * region exists but is structurally unreachable from the current (narrower)
 * scope — almost always because it is rendered in a DOM portal outside the
 * trigger's subtree — so this throws ScopeUnreachableError instead of
 * silently returning an empty locator. If the page-level search ALSO finds
 * nothing, the region genuinely doesn't exist anywhere, and today's
 * existing behavior is preserved unchanged (empty fallback locator, no
 * throw).
 */
export async function resolveRegion(
  root: ScopeRoot,
  regionName: string,
  page: Page,
): Promise<Locator> {
  for (const role of REGION_ROLES) {
    const candidate = root.getByRole(role, { name: regionName });
    if ((await candidate.count()) > 0) {
      return candidate.first();
    }
  }

  if (root !== page && (await existsAnywhereOnPage(page, regionName))) {
    throw new ScopeUnreachableError(regionName);
  }

  // No real landmark/grouping role matched this name anywhere in scope,
  // and (if checked) it doesn't exist page-wide either — return an
  // always-empty locator rather than silently falling back to the unscoped
  // root, so a caller's subsequent resolve() correctly finds nothing
  // instead of accidentally searching too broadly (G10: a real resolution
  // failure is data the caller observes, not a fabricated match).
  return root.getByRole(REGION_ROLES[0] as AriaRole, { name: regionName });
}

/**
 * Same REGION_ROLES walk as resolveRegion(), but rooted unconditionally at
 * the page — used only to confirm whether a region name that the scoped
 * walk couldn't find exists ANYWHERE on the page at all (AC3).
 */
async function existsAnywhereOnPage(page: Page, regionName: string): Promise<boolean> {
  for (const role of REGION_ROLES) {
    const candidate = page.getByRole(role, { name: regionName });
    if ((await candidate.count()) > 0) {
      return true;
    }
  }

  return false;
}
