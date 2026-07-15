import type { Page } from 'playwright';
import type {
  ActionType,
  DialogPolicy,
  LocatorStrategy,
  NetworkCapture,
  StepExecutor,
  StepMatch,
  TabTracker,
} from '@rippleview/core';
import { StepExecutionError } from '@rippleview/core';
import * as navigation from './navigation.js';
import * as interactions from './interactions.js';
import * as forms from './forms.js';
import * as menu from './menu.js';
import * as assertionsElement from './assertions-element.js';
import * as assertionsGlobal from './assertions-global.js';
import { isNetworkAction, runNetworkHandler } from './network-dispatch.js';
import {
  isDialogAction,
  runDialogHandler,
  runSwitchToNewTab,
  SWITCH_TO_NEW_TAB_ACTION,
} from './dialog-tabs-dispatch.js';

type Handler = (
  match: StepMatch,
  locator: LocatorStrategy,
  page: Page,
  stepText: string,
) => Promise<void>;

// ── Dispatch table ( AC1/AC2) ────────────────────────────────────────
// Every entry maps one ActionType to exactly one real Playwright call,
// routed through the family files above. `scope-region` and `seed-data`
// are deliberately absent — see PlaywrightStepExecutor's execute() for why
// hitting either still throws a clear, typed error instead of silently
// passing.
const HANDLERS: Partial<Record<ActionType, Handler>> = {
  navigate: navigation.navigate,
  'assert-mounted': navigation.assertMounted,
  'press-key': navigation.pressKey,
  'scroll-page': navigation.scrollPage,
  activate: interactions.activate,
  toggle: interactions.toggle,
  expand: interactions.expand,
  hover: interactions.hover,
  focus: interactions.focus,
  'double-click': interactions.doubleClick,
  'right-click': interactions.rightClick,
  'click-menu-item': menu.clickMenuItem,
  'scroll-to': interactions.scrollTo,
  check: interactions.check,
  uncheck: interactions.uncheck,
  'type-into': forms.typeInto,
  'select-option': forms.selectOption,
  'clear-field': forms.clearField,
  'drag-to': forms.dragTo,
  'assert-visible': assertionsElement.assertVisible,
  'assert-enabled': assertionsElement.assertEnabled,
  'assert-disabled': assertionsElement.assertDisabled,
  'assert-text': assertionsElement.assertText,
  'assert-attribute': assertionsElement.assertAttribute,
  'assert-selection': assertionsGlobal.assertSelection,
  'assert-count': assertionsGlobal.assertCount,
  'assert-no-overlap': assertionsGlobal.assertNoOverlap,
  'assert-in-viewport': assertionsGlobal.assertInViewport,
  'assert-url': assertionsGlobal.assertUrl,
};

/**
 * Real StepExecutor implementation ( / US-17.2).
 *
 * G1/G11: the only framework-specific (Playwright) implementation of the
 * core StepExecutor SPI — @rippleview/core itself stays agnostic (it only
 * declares the interface and ships NoOpStepExecutor's no-op). `ctx`
 * arrives as `unknown` per the SPI; this class narrows it to Playwright's
 * `Page` immediately and never leaks that type back out.
 *
 * `scope-region` and `seed-data` are explicitly NOT implemented here:
 *  - `scope-region` is a composition concern owned by the scenario runner
 *    via `LocatorStrategy.withScope()`, not a Playwright call this
 *    executor would make.
 *  - `seed-data` is owned by the existing SeedProvider/NamespacedSeedManager
 *    subsystem (packages/core/src/seed/types.ts), wired at the run/namespace
 *    level by the runner — a different lifecycle than a per-step action.
 * Hitting either throws a clear "unsupported action" StepExecutionError so
 * the gap is loud, never silently treated as a pass.
 *
 * `assert-api-*` () and `accept-dialog`/`dismiss-dialog`/
 * `switch-to-new-tab` () are each routed through their own
 * dispatch module (./network-dispatch.js, ./dialog-tabs-dispatch.js) —
 * split out to keep this file under the 200-line limit, and because none
 * of them resolve elements through the page/LocatorStrategy the way
 * HANDLERS above does. `switch-to-new-tab` mutates this executor's OWN
 * `activePage` field — see that field's doc comment below for the
 * precedence rule this implies for every later execute() call.
 */
export class PlaywrightStepExecutor implements StepExecutor {
  //  AC2: once `switch-to-new-tab` sets this, it — NOT whatever
  // `ctx` a later execute() call is given — becomes the page every
  // subsequent step executes against. Deliberate precedence choice: per
  // 's design this executor is instantiated once and reused across
  // a whole scenario's steps (there is no scenario runner yet to thread a
  // shared context through — see NetworkCapture's optional-parameter
  // precedent from ), so a caller looping execute() calls cannot
  // itself know a switch happened; re-passing the original `ctx` after a
  // switch must not silently run steps against a stale/background page.
  // Before any switch has happened, each call's own `ctx` is honored
  // normally (matching /478's existing behavior).
  private activePage: Page | undefined;

  async execute(
    stepText: string,
    match: StepMatch,
    locator: LocatorStrategy,
    ctx: unknown,
    networkCapture?: NetworkCapture,
    dialogPolicy?: DialogPolicy,
    tabTracker?: TabTracker,
  ): Promise<void> {
    const page = this.activePage ?? (ctx as Page);

    if (match.action === SWITCH_TO_NEW_TAB_ACTION) {
      this.activePage = await runSwitchToNewTab(stepText, match, tabTracker);
      return;
    }

    if (isDialogAction(match.action)) {
      await runDialogHandler(stepText, match, dialogPolicy);
      return;
    }

    if (isNetworkAction(match.action)) {
      await runNetworkHandler(stepText, match, networkCapture);
      return;
    }

    const handler = HANDLERS[match.action];

    if (handler === undefined) {
      throw new StepExecutionError(
        stepText,
        match.action,
        new Error(`Unsupported action for PlaywrightStepExecutor: "${match.action}"`),
      );
    }

    try {
      await handler(match, locator, page, stepText);
    } catch (error) {
      if (error instanceof StepExecutionError) {
        throw error;
      }
      throw new StepExecutionError(stepText, match.action, error);
    }
  }
}
