import type { Page, Locator } from 'playwright';
import type { LocatorStrategy, StepMatch } from '@rippleview/core';
import { StepAssertionError } from '@rippleview/core';
import type { AriaRole } from './types.js';
import { num, str } from './params.js';

// ── Page-level / multi-element assertion handlers ( AC2) ────────────
// assert-selection/count/no-overlap/in-viewport/url either query the page
// generically (no single named element to resolve) or compare two
// resolved elements against each other — split from
// assertions-element.ts's "one element, one state" family.

export async function assertSelection(
  match: StepMatch,
  _locator: LocatorStrategy,
  page: Page,
  stepText: string,
): Promise<void> {
  // G2: ARIA-state-aware role query, NOT a CSS attribute selector — the
  // accessibility tree is the only source of truth for "selected".
  const expected = str(match.params, 'value');
  const selected = page.getByRole('option', { selected: true });
  const actual = (await selected.textContent()) ?? '';
  if (actual !== expected) {
    throw new StepAssertionError(stepText, 'assert-selection', actual, expected);
  }
}

export async function assertCount(
  match: StepMatch,
  _locator: LocatorStrategy,
  page: Page,
  stepText: string,
): Promise<void> {
  const role = str(match.params, 'role') as AriaRole;
  const expected = num(match.params, 'count');
  const actual = await page.getByRole(role).count();
  if (actual !== expected) {
    throw new StepAssertionError(stepText, 'assert-count', actual, expected);
  }
}

export async function assertNoOverlap(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
  stepText: string,
): Promise<void> {
  const a = (await locator.resolveByText(str(match.params, 'a'), page)) as Locator;
  const b = (await locator.resolveByText(str(match.params, 'b'), page)) as Locator;
  const boxA = await a.boundingBox();
  const boxB = await b.boundingBox();

  const overlaps =
    boxA !== null &&
    boxB !== null &&
    boxA.x < boxB.x + boxB.width &&
    boxA.x + boxA.width > boxB.x &&
    boxA.y < boxB.y + boxB.height &&
    boxA.y + boxA.height > boxB.y;

  if (overlaps) {
    throw new StepAssertionError(stepText, 'assert-no-overlap', true, false);
  }
}

export async function assertInViewport(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
  stepText: string,
): Promise<void> {
  const handle = (await locator.resolveByText(str(match.params, 'name'), page)) as Locator;
  const box = await handle.boundingBox();
  const viewport = page.viewportSize();

  const inViewport =
    box !== null &&
    viewport !== null &&
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height;

  if (!inViewport) {
    throw new StepAssertionError(stepText, 'assert-in-viewport', inViewport, true);
  }
}

export async function assertUrl(
  match: StepMatch,
  _locator: LocatorStrategy,
  page: Page,
  stepText: string,
): Promise<void> {
  const expected = str(match.params, 'route');
  const actual = page.url();
  if (actual !== expected && !actual.endsWith(expected)) {
    throw new StepAssertionError(stepText, 'assert-url', actual, expected);
  }
}
