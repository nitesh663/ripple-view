import type { Page, Locator } from 'playwright';
import type { LocatorStrategy, StepMatch } from '@rippleview/core';
import { str } from './params.js';

// ── resolve(role,name) + single-call action handlers ( AC1) ─────────
// The uniform "resolve one element by role+name through the supplied
// LocatorStrategy (G2), then issue exactly one real Playwright call"
// family — split out from navigation.ts/forms.ts which resolve
// differently (page-level / by label or text).

async function resolveRoleName(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<Locator> {
  return (await locator.resolve(
    str(match.params, 'role'),
    str(match.params, 'name'),
    page,
  )) as Locator;
}

export async function activate(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const handle = await resolveRoleName(match, locator, page);
  await handle.click();
}

export async function toggle(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const handle = await resolveRoleName(match, locator, page);
  await handle.click();
}

export async function expand(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const handle = (await locator.resolve('button', str(match.params, 'name'), page)) as Locator;
  await handle.click();
}

export async function hover(match: StepMatch, locator: LocatorStrategy, page: Page): Promise<void> {
  const handle = await resolveRoleName(match, locator, page);
  await handle.hover();
}

export async function focus(match: StepMatch, locator: LocatorStrategy, page: Page): Promise<void> {
  const handle = await resolveRoleName(match, locator, page);
  await handle.focus();
}

export async function doubleClick(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const handle = await resolveRoleName(match, locator, page);
  await handle.dblclick();
}

export async function rightClick(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const handle = await resolveRoleName(match, locator, page);
  await handle.click({ button: 'right' });
}

export async function scrollTo(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const handle = await resolveRoleName(match, locator, page);
  await handle.scrollIntoViewIfNeeded();
}

export async function check(match: StepMatch, locator: LocatorStrategy, page: Page): Promise<void> {
  const handle = (await locator.resolve('checkbox', str(match.params, 'name'), page)) as Locator;
  await handle.check();
}

export async function uncheck(
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
): Promise<void> {
  const handle = (await locator.resolve('checkbox', str(match.params, 'name'), page)) as Locator;
  await handle.uncheck();
}
