import { chromium, type Browser, type Page } from 'playwright';
import type { StepMatch } from '@rippleview/core';
import { PlaywrightLocatorStrategy } from '../locator/PlaywrightLocatorStrategy.js';
import { PlaywrightStepExecutor } from './PlaywrightStepExecutor.js';

// Shared real-Chromium test harness for the PlaywrightStepExecutor test
// suite (split across multiple *.test.ts files to respect the repo's
// 200-line-per-file guideline). NOT itself a test file — no `describe`/`it`
// here, so importing it never re-registers tests in the importing files.
// Mirrors PlaywrightLocatorStrategy.test.ts's exact data: URL convention
// (G13: determinism, no live server, no mocks).

export function dataUrl(html: string): string {
  return `data:text/html,${encodeURIComponent(html)}`;
}

let browser: Browser | undefined;

export async function launchSharedBrowser(): Promise<void> {
  browser = await chromium.launch();
}

export async function closeSharedBrowser(): Promise<void> {
  await browser?.close();
  browser = undefined;
}

export async function loadPage(html: string): Promise<Page> {
  if (browser === undefined) {
    throw new Error('launchSharedBrowser() must be called in a beforeAll() first');
  }
  const page = await browser.newPage();
  // AC3: a deterministic, short actionability timeout so a deliberately
  // unresolvable element fails fast with a typed error instead of the
  // test waiting out Playwright's 30s default (G13: no fixed sleeps).
  page.setDefaultTimeout(1000);
  await page.goto(dataUrl(html), { waitUntil: 'load' });
  return page;
}

export function match(action: StepMatch['action'], params: StepMatch['params']): StepMatch {
  return { action, params };
}

export const executor = new PlaywrightStepExecutor();
export const locator = new PlaywrightLocatorStrategy();
