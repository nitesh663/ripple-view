import { chromium, type Browser, type Page } from 'playwright';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ScopeUnreachableError } from '@rippleview/core';
import { PlaywrightLocatorStrategy } from './PlaywrightLocatorStrategy.js';

// — resolveUnscoped() (AC1's reusable resolution primitive) and
// withScope()'s portal-mismatch detection (AC3). Real headless Chromium,
// real DOM via data: URLs (G13: determinism, no live server, no mocks),
// mirroring PlaywrightLocatorStrategy.test.ts's exact convention. Split into
// its own file to keep both test files under the 200-line limit.

function dataUrl(html: string): string {
  return `data:text/html,${encodeURIComponent(html)}`;
}

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser.close();
});

async function loadPage(html: string): Promise<Page> {
  const newPage = await browser.newPage();
  await newPage.goto(dataUrl(html), { waitUntil: 'load' });
  return newPage;
}

describe('PlaywrightLocatorStrategy — AC1: resolveUnscoped() ignores any active withScope() chain', () => {
  it('resolveUnscoped finds an element OUTSIDE the active scope that resolve() cannot see', async () => {
    const page = await loadPage(`
      <section aria-labelledby="billing-heading">
        <h2 id="billing-heading">Billing</h2>
        <p>nothing relevant here</p>
      </section>
      <div role="dialog" aria-label="Confirm Dialog">
        <button>Confirm</button>
      </div>
    `);
    const scoped = new PlaywrightLocatorStrategy().withScope('Billing');

    const result = (await scoped.resolveUnscoped('button', 'Confirm', page)) as ReturnType<
      Page['getByRole']
    >;

    expect(await result.textContent()).toBe('Confirm');
    await page.close();
  });

  it('falls back to data-testid when no ARIA role+name match exists, same as resolve() (BDD-03)', async () => {
    const page = await loadPage('<div data-testid="portal-widget">found me too</div>');
    const strategy = new PlaywrightLocatorStrategy();

    const result = (await strategy.resolveUnscoped('button', 'portal-widget', page)) as ReturnType<
      Page['getByRole']
    >;

    expect(await result.textContent()).toBe('found me too');
    await page.close();
  });
});

// AC3: a real, named, nested region ("Billing", inside "Customer Profile")
// plus a SEPARATE role="dialog" rendered as a DIRECT SIBLING of <body>'s
// children — NOT nested inside "Billing". This is a real DOM-structure
// fact (no JS portal simulation needed); the test is about tree shape, per
// the story brief.
const PORTAL_MISMATCH_HTML = `
  <section aria-labelledby="customer-profile-heading">
    <h2 id="customer-profile-heading">Customer Profile</h2>
    <section aria-labelledby="billing-heading">
      <h2 id="billing-heading">Billing</h2>
      <p>no dialog in here</p>
    </section>
  </section>
  <div role="dialog" aria-label="Confirm Dialog">
    <p>I am rendered outside Billing's subtree, like a real portal would be</p>
  </div>
`;

describe('PlaywrightLocatorStrategy — AC3: withScope() detects a structurally-unreachable (portaled) region', () => {
  it('withScope("Billing").withScope("Confirm Dialog") throws ScopeUnreachableError naming the unreachable region', async () => {
    const page = await loadPage(PORTAL_MISMATCH_HTML);
    const strategy = new PlaywrightLocatorStrategy()
      .withScope('Customer Profile')
      .withScope('Billing')
      .withScope('Confirm Dialog');

    const error = await strategy.resolveByText('outside', page).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ScopeUnreachableError);
    expect((error as ScopeUnreachableError).region).toBe('Confirm Dialog');
    await page.close();
  });

  it('a plain unscoped resolve() finds the SAME "Confirm Dialog" fine on the same fixture', async () => {
    const page = await loadPage(PORTAL_MISMATCH_HTML);
    const strategy = new PlaywrightLocatorStrategy();

    const result = (await strategy.resolve('dialog', 'Confirm Dialog', page)) as ReturnType<
      Page['getByRole']
    >;

    expect(await result.count()).toBe(1);
    await page.close();
  });

  it('a region name that does not exist anywhere still returns the old, unchanged silent-empty-locator behavior', async () => {
    const page = await loadPage(PORTAL_MISMATCH_HTML);
    const strategy = new PlaywrightLocatorStrategy()
      .withScope('Customer Profile')
      .withScope('Billing')
      .withScope('Totally Nonexistent Region');

    const result = (await strategy.resolveByLabel(
      'Totally Nonexistent Region',
      page,
    )) as ReturnType<Page['getByLabel']>;

    expect(await result.count()).toBe(0);
    await page.close();
  });

  it('the FIRST level of a chain never throws — only the second level onward can (no redundant signal)', async () => {
    const page = await loadPage(PORTAL_MISMATCH_HTML);
    const strategy = new PlaywrightLocatorStrategy().withScope('Confirm Dialog');

    const result = (await strategy.resolveByText('outside', page)) as ReturnType<Page['getByText']>;

    expect(await result.textContent()).toContain('outside Billing');
    await page.close();
  });
});
