import type { NetworkCapture, StepMatch } from '@rippleview/core';
import { StepAssertionError, NetworkExchangeNotFoundError } from '@rippleview/core';
import { num, str } from './params.js';

// ── Network assertion handlers ( catalog,  AC2) ──────────────────
// Each queries the supplied NetworkCapture (never the DOM/LocatorStrategy —
// these assert on what actually crossed the wire) and throws a typed error
// on mismatch: NetworkExchangeNotFoundError when the urlPattern matched
// nothing at all, StepAssertionError when a match was found but its
// status/body did not meet the expectation (AC2).

// `stepText` is part of the NetworkHandler dispatch signature (mirrored
// across all three handlers in this file for a uniform dispatch table)
// but unused here: NetworkExchangeNotFoundError deliberately does not
// carry stepText, mirroring WaitTimeoutError/ScopeUnreachableError, which
// also identify a failure by its own typed field (urlPattern) rather than
// the raw step text.
export function assertApiCalled(match: StepMatch, capture: NetworkCapture): Promise<void> {
  const urlPattern = str(match.params, 'urlPattern');
  const matches = capture.findRequests(urlPattern);
  if (matches.length === 0) {
    return Promise.reject(new NetworkExchangeNotFoundError(urlPattern));
  }
  return Promise.resolve();
}

export async function assertApiStatus(
  match: StepMatch,
  capture: NetworkCapture,
  stepText: string,
): Promise<void> {
  const urlPattern = str(match.params, 'urlPattern');
  const expected = num(match.params, 'status');
  const matches = capture.findRequests(urlPattern);
  if (matches.length === 0) {
    throw new NetworkExchangeNotFoundError(urlPattern);
  }

  const actual = matches[matches.length - 1]?.status ?? null;
  if (actual !== expected) {
    throw new StepAssertionError(stepText, 'assert-api-status', actual, expected);
  }
}

export async function assertApiBodyContains(
  match: StepMatch,
  capture: NetworkCapture,
  stepText: string,
): Promise<void> {
  const urlPattern = str(match.params, 'urlPattern');
  const expected = str(match.params, 'value');
  const matches = capture.findRequests(urlPattern);
  if (matches.length === 0) {
    throw new NetworkExchangeNotFoundError(urlPattern);
  }

  const actual = matches[matches.length - 1]?.requestBody ?? null;
  if (actual === null || !actual.includes(expected)) {
    throw new StepAssertionError(stepText, 'assert-api-body-contains', actual, expected);
  }
}
