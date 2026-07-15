import { chromium, type Browser, type Page } from 'playwright';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PlaywrightLocatorStrategy } from './PlaywrightLocatorStrategy.js';

// Real headless Chromium, real DOM via data: URLs — the same pattern proven
// in captureAccessibilityTree.test.ts (G13: determinism, no live server, no
// mocks). The nested-region and ordinal fixtures below intentionally mirror
// the EXACT markup added in rippleview-examples PR #10
// (https://github.com/ramalingesha/rippleview-examples/pull/10, advisory/NOT YET
// MERGED) to billing-app — proving this strategy against structures already
// shown to exist in a real shipped app, not invented for this test alone.

function dataUrl(html: string): string {
  return `data:text/html,${encodeURIComponent(html)}`;
}

let browser: Browser;
let page: Page;

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

describe('PlaywrightLocatorStrategy — AC1: role+name resolution with BDD-03 testid fallback', () => {
  it('resolves a real element by ARIA role + accessible name', async () => {
    page = await loadPage('<button>Save</button>');
    const strategy = new PlaywrightLocatorStrategy();

    const result = (await strategy.resolve('button', 'Save', page)) as ReturnType<
      Page['getByRole']
    >;

    expect(await result.textContent()).toBe('Save');
    await page.close();
  });

  it('falls back to data-testid when no ARIA role+name match exists (BDD-03)', async () => {
    // A real, common gap: an element with no accessible name at all, only
    // a data-testid — discoverable ONLY through the fallback, never the
    // primary role+name lookup it's attempted first.
    page = await loadPage('<div data-testid="mystery-widget">found me</div>');
    const strategy = new PlaywrightLocatorStrategy();
    expect(strategy.fallbackToTestId).toBe(true);

    const result = (await strategy.resolve('button', 'mystery-widget', page)) as ReturnType<
      Page['getByRole']
    >;

    expect(await result.textContent()).toBe('found me');
    await page.close();
  });
});

describe('PlaywrightLocatorStrategy — AC2: resolveByLabel / resolveByText / resolveByTestId', () => {
  it('resolveByLabel resolves a real labeled input', async () => {
    page = await loadPage(
      '<label for="name-field">Name</label><input id="name-field" value="Ada" />',
    );
    const strategy = new PlaywrightLocatorStrategy();

    const result = (await strategy.resolveByLabel('Name', page)) as ReturnType<Page['getByLabel']>;

    expect(await result.inputValue()).toBe('Ada');
    await page.close();
  });

  it('resolveByText resolves a real element by its visible text content', async () => {
    page = await loadPage('<p>Hello world</p>');
    const strategy = new PlaywrightLocatorStrategy();

    const result = (await strategy.resolveByText('Hello world', page)) as ReturnType<
      Page['getByText']
    >;

    expect(await result.textContent()).toBe('Hello world');
    await page.close();
  });

  it('resolveByTestId resolves a real element by its data-testid attribute', async () => {
    page = await loadPage('<div data-testid="widget">widget content</div>');
    const strategy = new PlaywrightLocatorStrategy();

    const result = (await strategy.resolveByTestId('widget', page)) as ReturnType<
      Page['getByTestId']
    >;

    expect(await result.textContent()).toBe('widget content');
    await page.close();
  });
});

// AC3: mirrors rippleview-examples billing-app's real markup exactly — a
// top-level region "Billing" (native <section aria-labelledby> computes
// implicit role="region" with the heading text as accessible name,
// confirmed against real Chromium) containing one "City" input, and a
// SEPARATE region also named "Billing" nested inside region "Customer
// Profile", containing a DIFFERENT "City" input. Only nesting — not role,
// not name — disambiguates the two.
const NESTED_BILLING_HTML = `
  <section aria-labelledby="billing-heading">
    <h2 id="billing-heading">Billing</h2>
    <label for="top-level-city">City</label>
    <input id="top-level-city" value="Top-level City" />
  </section>

  <section aria-labelledby="customer-profile-heading">
    <h2 id="customer-profile-heading">Customer Profile</h2>
    <section aria-labelledby="customer-profile-billing-heading">
      <h2 id="customer-profile-billing-heading">Billing</h2>
      <label for="nested-city">City</label>
      <input id="nested-city" value="Nested City" />
    </section>
  </section>
`;

describe('PlaywrightLocatorStrategy — AC3: withScope() composes nested scopes (T-3.3.3)', () => {
  it('withScope("Customer Profile").withScope("Billing") resolves the NESTED City input, not the top-level one', async () => {
    page = await loadPage(NESTED_BILLING_HTML);
    const strategy = new PlaywrightLocatorStrategy()
      .withScope('Customer Profile')
      .withScope('Billing');

    const result = (await strategy.resolveByLabel('City', page)) as ReturnType<Page['getByLabel']>;

    expect(await result.inputValue()).toBe('Nested City');
    await page.close();
  });

  it('withScope("Billing") alone (no nesting) resolves the TOP-LEVEL City input', async () => {
    page = await loadPage(NESTED_BILLING_HTML);
    const strategy = new PlaywrightLocatorStrategy().withScope('Billing');

    const result = (await strategy.resolveByLabel('City', page)) as ReturnType<Page['getByLabel']>;

    expect(await result.inputValue()).toBe('Top-level City');
    await page.close();
  });
});

// AC4: mirrors rippleview-examples billing-app's 3 identically-named "Remove"
// buttons in fixed document order — the ONLY thing that distinguishes them
// is position. A real id is read back via .evaluate() purely to PROVE which
// physical button resolved; it is never itself used as the locator (that
// would defeat the point of an ordinal test).
const ORDINAL_REMOVE_HTML = `
  <button id="remove-0">Remove</button>
  <button id="remove-1">Remove</button>
  <button id="remove-2">Remove</button>
`;

describe('PlaywrightLocatorStrategy — AC4: ordinal index resolves the Nth occurrence (T-3.3.4)', () => {
  it('resolve(..., 2) resolves specifically the 2nd "Remove" button in document order', async () => {
    page = await loadPage(ORDINAL_REMOVE_HTML);
    const strategy = new PlaywrightLocatorStrategy();

    const result = (await strategy.resolve('button', 'Remove', page, 2)) as ReturnType<
      Page['getByRole']
    >;
    const id = await result.evaluate((el) => el.id);

    expect(id).toBe('remove-1');
    await page.close();
  });

  it('omitting index resolves the 1st "Remove" button (the existing default behavior)', async () => {
    page = await loadPage(ORDINAL_REMOVE_HTML);
    const strategy = new PlaywrightLocatorStrategy();

    const result = (await strategy.resolve('button', 'Remove', page)) as ReturnType<
      Page['getByRole']
    >;
    const id = await result.evaluate((el) => el.id);

    expect(id).toBe('remove-0');
    await page.close();
  });

  it('resolve(..., 3) resolves the 3rd, distinct from the 1st and 2nd', async () => {
    page = await loadPage(ORDINAL_REMOVE_HTML);
    const strategy = new PlaywrightLocatorStrategy();

    const third = (await strategy.resolve('button', 'Remove', page, 3)) as ReturnType<
      Page['getByRole']
    >;
    const id = await third.evaluate((el) => el.id);

    expect(id).toBe('remove-2');
    await page.close();
  });
});
