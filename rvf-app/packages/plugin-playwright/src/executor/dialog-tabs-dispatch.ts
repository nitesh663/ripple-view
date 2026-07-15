import type { Page } from 'playwright';
import type { ActionType, DialogPolicy, StepMatch, TabTracker } from '@rippleview/core';
import { StepExecutionError, NoNewTabOpenedError } from '@rippleview/core';
import * as dialogTabs from './dialog-tabs.js';

/**
 * Dialog/tab dispatch ( AC1/AC2), split out of
 * PlaywrightStepExecutor.ts to keep that file under the 200-line limit and
 * to keep this concern (arming DialogPolicy, switching TabTracker's
 * active page) isolated from the page/LocatorStrategy-shaped HANDLERS
 * table and the NetworkCapture-shaped NETWORK_HANDLERS table.
 *
 * `switch-to-new-tab` is exposed as its own function (not folded into the
 * dialog table) because it is the one action that returns a NEW active
 * page for PlaywrightStepExecutor to store — a different return shape
 * than the dialog handlers, which only arm an override and resolve void.
 */

type DialogHandler = (policy: DialogPolicy) => Promise<void>;

const DIALOG_HANDLERS: Partial<Record<ActionType, DialogHandler>> = {
  'accept-dialog': dialogTabs.acceptDialog,
  'dismiss-dialog': dialogTabs.dismissDialog,
};

export const SWITCH_TO_NEW_TAB_ACTION: ActionType = 'switch-to-new-tab';

/** Whether `action` is one of the dialog-override actions this module handles. */
export function isDialogAction(action: ActionType): boolean {
  return DIALOG_HANDLERS[action] !== undefined;
}

export async function runDialogHandler(
  stepText: string,
  match: StepMatch,
  dialogPolicy: DialogPolicy | undefined,
): Promise<void> {
  const handler = DIALOG_HANDLERS[match.action];
  if (handler === undefined) {
    throw new StepExecutionError(
      stepText,
      match.action,
      new Error(`No dialog handler registered for action "${match.action}"`),
    );
  }

  if (dialogPolicy === undefined) {
    throw new StepExecutionError(
      stepText,
      match.action,
      new Error(
        `Action "${match.action}" requires a DialogPolicy, but none was supplied to execute()`,
      ),
    );
  }

  try {
    await handler(dialogPolicy);
  } catch (error) {
    throw new StepExecutionError(stepText, match.action, error);
  }
}

/**
 * Runs `switch-to-new-tab` and returns the new active Page.
 *
 * @throws {StepExecutionError} if no TabTracker was supplied.
 * @throws {NoNewTabOpenedError} if no new tab has been tracked yet — a
 *   sibling typed error (like NetworkExchangeNotFoundError) deliberately
 *   NOT wrapped in StepExecutionError, distinguishing "no new tab was
 *   ever tracked" from every other execution failure (AC2).
 */
export async function runSwitchToNewTab(
  stepText: string,
  match: StepMatch,
  tabTracker: TabTracker | undefined,
): Promise<Page> {
  if (tabTracker === undefined) {
    throw new StepExecutionError(
      stepText,
      match.action,
      new Error(
        `Action "${match.action}" requires a TabTracker, but none was supplied to execute()`,
      ),
    );
  }

  try {
    return (await dialogTabs.switchToNewTab(tabTracker)) as Page;
  } catch (error) {
    if (error instanceof StepExecutionError || error instanceof NoNewTabOpenedError) {
      throw error;
    }
    throw new StepExecutionError(stepText, match.action, error);
  }
}
