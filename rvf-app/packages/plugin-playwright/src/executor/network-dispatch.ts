import type { ActionType, NetworkCapture, StepMatch } from '@rippleview/core';
import { StepExecutionError, NetworkExchangeNotFoundError } from '@rippleview/core';
import * as assertionsNetwork from './assertions-network.js';

/**
 * Network assertion dispatch ( AC2/AC3), split out of
 * PlaywrightStepExecutor.ts to keep that file under the 200-line limit.
 * These three actions query the caller-supplied NetworkCapture, never the
 * page/LocatorStrategy.
 */

type NetworkHandler = (
  match: StepMatch,
  capture: NetworkCapture,
  stepText: string,
) => Promise<void>;

const NETWORK_HANDLERS: Partial<Record<ActionType, NetworkHandler>> = {
  'assert-api-called': assertionsNetwork.assertApiCalled,
  'assert-api-status': assertionsNetwork.assertApiStatus,
  'assert-api-body-contains': assertionsNetwork.assertApiBodyContains,
};

/** Whether `action` is one of the network assertion actions this module handles. */
export function isNetworkAction(action: ActionType): boolean {
  return NETWORK_HANDLERS[action] !== undefined;
}

export async function runNetworkHandler(
  stepText: string,
  match: StepMatch,
  networkCapture: NetworkCapture | undefined,
): Promise<void> {
  const handler = NETWORK_HANDLERS[match.action];
  if (handler === undefined) {
    throw new StepExecutionError(
      stepText,
      match.action,
      new Error(`No network handler registered for action "${match.action}"`),
    );
  }

  if (networkCapture === undefined) {
    throw new StepExecutionError(
      stepText,
      match.action,
      new Error(
        `Action "${match.action}" requires a NetworkCapture, but none was supplied to execute()`,
      ),
    );
  }

  try {
    await handler(match, networkCapture, stepText);
  } catch (error) {
    // NetworkExchangeNotFoundError is a sibling typed error (like
    // WaitTimeoutError/ScopeUnreachableError) deliberately NOT wrapped in
    // StepExecutionError — it distinguishes "no matching call was ever
    // observed" from every other execution failure (AC2).
    if (error instanceof StepExecutionError || error instanceof NetworkExchangeNotFoundError) {
      throw error;
    }
    throw new StepExecutionError(stepText, match.action, error);
  }
}
