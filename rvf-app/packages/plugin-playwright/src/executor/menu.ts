import type { Page, Locator } from 'playwright';
import type { LocatorStrategy, StepMatch } from '@rippleview/core';
import { str } from './params.js';

// ── click-menu-item handler ( AC1) ───────────────────────────────────
// Deliberately a NEW family file, not added to interactions.ts: every
// handler in interactions.ts resolves through the SCOPED `locator.resolve()`
// (role+name lookups within whatever withScope() chain is active). This
// handler is genuinely different — a portaled menu/dialog is rendered
// outside the triggering element's DOM subtree, so it must resolve via
// `resolveUnscoped()` (the page-rooted, scope-bypassing SPI method), never
// `resolve()`. Mixing that into interactions.ts would blur a real behavioral
// distinction other readers rely on (G2: A11y-tree locators only, exact
// resolution method matters here as much as role+name).

export async function clickMenuItem(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const handle = (await locator.resolveUnscoped(
    'menuitem',
    str(match.params, 'name'),
    page,
  )) as Locator;
  await handle.click();
}
