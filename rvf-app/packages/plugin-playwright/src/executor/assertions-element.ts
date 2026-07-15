import type { Page, Locator } from 'playwright';
import type { LocatorStrategy, StepMatch } from '@rippleview/core';
import { StepAssertionError } from '@rippleview/core';
import { str } from './params.js';

// ── Single-element assertion handlers ( catalog,  AC2) ──────────
// Each resolves exactly one element through the supplied LocatorStrategy
// (G2) and checks one real Playwright state/attribute on it, throwing
// StepAssertionError carrying actual/expected on mismatch (AC2/AC3).

function optionalIndex(params: StepMatch['params']): number | undefined {
  const raw = params['index'];
  return raw === undefined ? undefined : Number(raw);
}

export async function assertVisible(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
  stepText: string,
): Promise<void> {
  const handle = (await locator.resolve(
    str(match.params, 'role'),
    str(match.params, 'name'),
    page,
    optionalIndex(match.params),
  )) as Locator;
  const visible = await handle.isVisible();
  if (!visible) {
    throw new StepAssertionError(stepText, 'assert-visible', visible, true);
  }
}

export async function assertEnabled(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
  stepText: string,
): Promise<void> {
  const handle = (await locator.resolve(
    str(match.params, 'role'),
    str(match.params, 'name'),
    page,
  )) as Locator;
  const disabled = await handle.isDisabled();
  if (disabled) {
    throw new StepAssertionError(stepText, 'assert-enabled', !disabled, true);
  }
}

export async function assertDisabled(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
  stepText: string,
): Promise<void> {
  const handle = (await locator.resolve(
    str(match.params, 'role'),
    str(match.params, 'name'),
    page,
  )) as Locator;
  const disabled = await handle.isDisabled();
  if (!disabled) {
    throw new StepAssertionError(stepText, 'assert-disabled', disabled, true);
  }
}

export async function assertText(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
  stepText: string,
): Promise<void> {
  const value = str(match.params, 'value');
  const handle = (await locator.resolveByText(value, page)) as Locator;
  const visible = await handle.isVisible();
  if (!visible) {
    throw new StepAssertionError(stepText, 'assert-text', visible, true);
  }
}

export async function assertAttribute(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
  stepText: string,
): Promise<void> {
  const handle = (await locator.resolve(
    str(match.params, 'role'),
    str(match.params, 'name'),
    page,
  )) as Locator;
  const expected = str(match.params, 'value');
  const actual = await handle.getAttribute(str(match.params, 'attr'));
  if (actual !== expected) {
    throw new StepAssertionError(stepText, 'assert-attribute', actual, expected);
  }
}
