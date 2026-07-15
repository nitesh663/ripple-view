import type { Page } from 'playwright';
import type { LocatorStrategy, StepMatch } from '@rippleview/core';
import { StepAssertionError } from '@rippleview/core';
import type { AriaRole } from './types.js';
import { num, str } from './params.js';

// ── Page-level action handlers ( catalog,  AC1) ──────────────────
// These act directly on the Playwright `Page` (navigate, press-key,
// scroll-page) or on a generic role with no name filter (assert-mounted) —
// none of them resolve a single named element through the LocatorStrategy,
// which is what separates this family from interactions.ts/forms.ts.

export async function navigate(
  match: StepMatch,
  _locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  await page.goto(str(match.params, 'route'));
}

/**
 * "a button is mounted" — generic role-existence check (no name filter).
 * Conceptually an assertion (throws StepAssertionError on failure) even
 * though its ActionType lives in the non-assertion union, matching how
 * navigation.ts's catalog groups it alongside `navigate`/`scope-region`.
 */
export async function assertMounted(
  match: StepMatch,
  _locator: LocatorStrategy,
  page: Page,
  stepText: string,
): Promise<void> {
  const role = str(match.params, 'component') as AriaRole;
  const count = await page.getByRole(role).count();
  if (count === 0) {
    throw new StepAssertionError(stepText, 'assert-mounted', 0, '>=1');
  }
}

export async function pressKey(
  match: StepMatch,
  _locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  await page.keyboard.press(str(match.params, 'key'));
}

export async function scrollPage(
  match: StepMatch,
  _locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const direction = str(match.params, 'direction');
  const pixels = num(match.params, 'pixels');
  await page.mouse.wheel(0, direction === 'down' ? pixels : -pixels);
}
