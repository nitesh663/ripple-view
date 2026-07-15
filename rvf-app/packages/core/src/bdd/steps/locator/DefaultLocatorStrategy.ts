import type { LocatorStrategy } from './types.js';

/**
 * Default LocatorStrategy provided by core.
 *
 * All resolve methods are no-ops returning null — real A11y resolution
 * and testid fallback live in the framework plugin (e.g. @rippleview/plugin-playwright).
 *
 * BDD-03: fallbackToTestId is set to true so implementing plugins know
 * they MUST attempt testid fallback before throwing.
 *
 * No-op methods follow the same pattern as StorageStateAuthProvider.restore():
 * declared with 0 parameters, intentional no-op comment in the body.
 */
export class DefaultLocatorStrategy implements LocatorStrategy {
  readonly name = 'default';
  readonly fallbackToTestId = true;

  // no-op: real A11y resolution lives in the framework plugin (G11)
  async resolve(): Promise<unknown> {
    // intentional no-op: real A11y resolution lives in the framework plugin
    return null;
  }

  // no-op: real page-rooted/portal-bypassing resolution lives in the
  // framework plugin (G11)
  async resolveUnscoped(): Promise<unknown> {
    // intentional no-op: real A11y resolution lives in the framework plugin
    return null;
  }

  // no-op: real label resolution lives in the framework plugin (G11)
  async resolveByLabel(): Promise<unknown> {
    // intentional no-op
    return null;
  }

  // no-op: real text resolution lives in the framework plugin (G11)
  async resolveByText(): Promise<unknown> {
    // intentional no-op
    return null;
  }

  // no-op: real testid resolution lives in the framework plugin (G11)
  async resolveByTestId(): Promise<unknown> {
    // intentional no-op
    return null;
  }

  // no-op: real region scoping (BDD-02) lives in the framework plugin (G11)
  withScope(): LocatorStrategy {
    // intentional no-op: core has no DOM/A11y tree to scope against
    return this;
  }
}
