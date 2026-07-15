import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StepExecutionError } from '@rippleview/core';
import { PlaywrightLocatorStrategy } from '../locator/PlaywrightLocatorStrategy.js';
import {
  closeSharedBrowser,
  executor,
  launchSharedBrowser,
  loadPage,
  locator,
  match,
} from './test-helpers.js';

//  AC1 — click-menu-item resolves a portaled menu item even though
// it is structurally outside the triggering button's DOM subtree. Real
// headless Chromium + a real <script> that does document.body.appendChild()
// on click (a genuine, JS-driven DOM mutation, not static markup) — G13:
// determinism, no mocking. Per the story brief, this hand-built fixture is
// deliberately library-free; a companion rippleview-examples PR (not part of this
// repo) separately proves the same mechanism against a real third-party
// context-menu library's actual rendered DOM.

beforeAll(async () => {
  await launchSharedBrowser();
});

afterAll(async () => {
  await closeSharedBrowser();
});

// The button's real onclick handler appends a role="menu" containing two
// role="menuitem" children directly as a child of document.body — genuinely
// outside the button's own subtree (it lives inside a <section>).
const PORTAL_MENU_HTML = `
  <section>
    <button id="trigger" oncontextmenu="
      var menu = document.createElement('div');
      menu.setAttribute('role', 'menu');
      menu.innerHTML =
        '<div role=\\'menuitem\\'>Delete</div><div role=\\'menuitem\\'>Rename</div>';
      document.body.appendChild(menu);
      return false;
    ">Row actions</button>
  </section>
`;

describe('PlaywrightStepExecutor — AC1: click-menu-item resolves a portaled menu item', () => {
  it('right-click opens the menu, then click-menu-item finds and clicks the named item outside the trigger subtree', async () => {
    const page = await loadPage(PORTAL_MENU_HTML);

    await executor.execute(
      'I right-click the button "Row actions"',
      match('right-click', { role: 'button', name: 'Row actions' }),
      locator,
      page,
    );
    await executor.execute(
      'I click the menu item "Delete"',
      match('click-menu-item', { name: 'Delete' }),
      locator,
      page,
    );

    // The menu item itself has no click handler in this fixture — proving
    // resolution + click succeeded is enough: a failed resolve() would have
    // thrown (verified by the negative-path test below), so reaching here
    // at all is the proof.
    const menuItemCount = await page.getByRole('menuitem', { name: 'Delete' }).count();
    expect(menuItemCount).toBe(1);
    await page.close();
  });

  it('still finds the menu item when an active, unrelated region scope does NOT contain it (proves resolveUnscoped bypasses scope)', async () => {
    // The trigger button lives INSIDE "Unrelated Region" (so the SCOPED
    // right-click action can resolve it), but its real click handler still
    // appends the menu to document.body — OUTSIDE that region — exactly
    // like a real portaled menu would behave regardless of where its
    // trigger sits. If click-menu-item used the SCOPED resolve() instead of
    // resolveUnscoped(), it would fail to find the menu item here.
    const page = await loadPage(`
      <section aria-labelledby="unrelated-heading">
        <h2 id="unrelated-heading">Unrelated Region</h2>
        ${PORTAL_MENU_HTML}
      </section>
    `);
    const scopedLocator = new PlaywrightLocatorStrategy().withScope('Unrelated Region');

    await executor.execute(
      'I right-click the button "Row actions"',
      match('right-click', { role: 'button', name: 'Row actions' }),
      scopedLocator,
      page,
    );
    await executor.execute(
      'I click the menu item "Rename"',
      match('click-menu-item', { name: 'Rename' }),
      scopedLocator,
      page,
    );

    const menuItemCount = await page.getByRole('menuitem', { name: 'Rename' }).count();
    expect(menuItemCount).toBe(1);
    await page.close();
  });

  it('clicking a menu item that was never rendered produces a clear StepExecutionError, never a silent pass', async () => {
    const page = await loadPage(PORTAL_MENU_HTML);

    await executor.execute(
      'I right-click the button "Row actions"',
      match('right-click', { role: 'button', name: 'Row actions' }),
      locator,
      page,
    );

    const error = await executor
      .execute(
        'I click the menu item "Archive"',
        match('click-menu-item', { name: 'Archive' }),
        locator,
        page,
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(StepExecutionError);
    expect((error as StepExecutionError).stepText).toBe('I click the menu item "Archive"');
    expect((error as StepExecutionError).action).toBe('click-menu-item');
    await page.close();
  });
});
