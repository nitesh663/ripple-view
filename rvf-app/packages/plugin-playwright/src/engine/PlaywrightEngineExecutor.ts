import type { BddScenario, BrowserMatrixEntry, EngineExecutor, EngineResult } from '@rippleview/core';
import type { StepRegistry } from '@rippleview/core';
import { resolveLauncher } from './types.js';
import { runScenario } from './runScenario.js';

/**
 * Optional context the caller (e.g. `rv run`) supplies alongside the
 * Playwright-agnostic `ctx` the core SPI expects. `baseUrl` becomes the new
 * browser context's `baseURL` (AC1: navigate steps resolve against the
 * real served app, G9); `registry` lets a caller extend the step catalog
 * (G11) without forking this executor.
 */
export interface PlaywrightEngineContext {
  baseUrl?: string;
  registry?: StepRegistry;
}

/**
 * Real EngineExecutor implementation ( / US-17.7).
 *
 * G1/G11: the only framework-specific (Playwright) implementation of the
 * core EngineExecutor SPI — @rippleview/core itself stays agnostic (it only
 * declares the type in runner/types.ts). `ctx` arrives as `unknown` per
 * the SPI; this function narrows it to a `PlaywrightEngineContext`
 * immediately and never leaks Playwright types back to core.
 *
 * AC1: delegates the actual per-step walk (StepRegistry.match() ->
 * LocatorStrategy + StepExecutor + WaitStrategy) to runScenario.ts, split
 * out to keep this file under the 200-line limit (SOLID) — this function
 * owns only the browser/context lifecycle.
 *
 * AC2: launches the matrix entry's own browser engine and creates ONE
 * fresh `browser.newContext()` + `context.newPage()` for this call,
 * disposing both in a `finally` — never a shared context across scenarios,
 * which is the actual isolation boundary Playwright offers (no cookie/
 * localStorage/dialog-listener bleed between runs).
 */
export const playwrightEngineExecutor: EngineExecutor = async (
  entry: BrowserMatrixEntry,
  scenario: BddScenario,
  ctx: unknown,
): Promise<EngineResult> => {
  const engineCtx = (ctx ?? {}) as PlaywrightEngineContext;
  const launcher = resolveLauncher(entry.browser);
  const browser = await launcher.launch();

  try {
    const context = await browser.newContext({
      viewport: entry.viewport,
      ...(engineCtx.baseUrl !== undefined ? { baseURL: engineCtx.baseUrl } : {}),
    });

    try {
      return await runScenario(entry, scenario, context, engineCtx);
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
};
