import { chromium, webkit, firefox, type BrowserType } from 'playwright';

/**
 * Maps a `BrowserMatrixEntry.browser` string ( AC2) to Playwright's
 * own launcher for that engine. Split out from PlaywrightEngineExecutor.ts
 * (SOLID + 200-line limit) — this is the one place that knows the three
 * real launchers exist; everything else just asks for one by name.
 */
const LAUNCHERS: Record<string, BrowserType> = {
  chromium,
  webkit,
  firefox,
};

/**
 * Thrown when `BrowserMatrixEntry.browser` names an engine Playwright does
 * not provide (e.g. a typo in `rippleview.config.yaml`'s `matrix`). A clear, typed
 * failure (G10: findings are data) rather than a generic TypeError from
 * indexing a missing map entry.
 */
export class UnknownBrowserEngineError extends Error {
  constructor(readonly browser: string) {
    super(
      `Unknown browser engine "${browser}" in the matrix — expected one of: ` +
        `${Object.keys(LAUNCHERS).join(', ')}.`,
    );
    this.name = 'UnknownBrowserEngineError';
  }
}

/** Resolve a Playwright `BrowserType` launcher by matrix `browser` name. */
export function resolveLauncher(browser: string): BrowserType {
  const launcher = LAUNCHERS[browser];
  if (launcher === undefined) {
    throw new UnknownBrowserEngineError(browser);
  }
  return launcher;
}
