import type { StepPattern } from '../types.js';

// Dialog/tab patterns ( AC1/AC2) — arm a one-shot dialog
// override BEFORE the action that triggers the dialog (DialogPolicy's
// listener is registered up front and resolves dialogs as they happen —
// see packages/core/src/bdd/steps/dialog/types.ts for why "after" the
// triggering action is not possible), or switch the active context to a
// tab/window a previous action opened.

const acceptDialog: StepPattern = {
  pattern: /^I accept the dialog$/,
  action: 'accept-dialog',
  extractParams() {
    return {};
  },
};

const dismissDialog: StepPattern = {
  pattern: /^I dismiss the dialog$/,
  action: 'dismiss-dialog',
  extractParams() {
    return {};
  },
};

const switchToNewTab: StepPattern = {
  pattern: /^I switch to the new tab$/,
  action: 'switch-to-new-tab',
  extractParams() {
    return {};
  },
};

export const dialogPatterns: StepPattern[] = [acceptDialog, dismissDialog, switchToNewTab];
