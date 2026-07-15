import type { Page, Locator } from 'playwright';
import type { LocatorStrategy, StepMatch } from '@rippleview/core';
import { str } from './params.js';

// ── Label/text-resolved action handlers ( catalog,  AC1) ────────
// type-into/select-option/clear-field resolve by label (form fields);
// drag-to resolves its source by role+name but its target by text (no
// role given for a drop target) — grouped here as the "not a simple
// role+name resolve" family, split from interactions.ts.

export async function typeInto(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const handle = (await locator.resolveByLabel(str(match.params, 'label'), page)) as Locator;
  await handle.fill(str(match.params, 'text'));
}

/**
 * Two-path design, deliberate (not a hack): native `<select>` elements use
 * Playwright's selectOption(); anything else is treated as an ARIA
 * combobox/listbox pattern — click to open, then resolve the option by
 * role+name and click it. Native selects don't expose an openable
 * combobox surface to click through, so tagName is the one reliable
 * discriminator between the two real, distinct interaction models.
 */
export async function selectOption(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const handle = (await locator.resolveByLabel(str(match.params, 'label'), page)) as Locator;
  const option = str(match.params, 'option');
  const tagName = await handle.evaluate((el) => el.tagName);

  if (tagName === 'SELECT') {
    await handle.selectOption({ label: option });
    return;
  }

  await handle.click();
  const optionHandle = (await locator.resolve('option', option, page)) as Locator;
  await optionHandle.click();
}

export async function clearField(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const handle = (await locator.resolveByLabel(str(match.params, 'label'), page)) as Locator;
  await handle.fill('');
}

export async function dragTo(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const source = (await locator.resolve(
    str(match.params, 'role'),
    str(match.params, 'name'),
    page,
  )) as Locator;
  const target = (await locator.resolveByText(str(match.params, 'target'), page)) as Locator;
  await source.dragTo(target);
}
