import { chromium, type Page } from 'playwright';

// ── AccessibilityNode ────────────────────────────────────────────────────────
// A flattened view of Playwright's real ARIA snapshot
// (locator.ariaSnapshot() — the modern replacement for the removed
// page.accessibility.snapshot() API, confirmed against the installed
// playwright@1.61.0) — role + accessible name, the exact vocabulary
// contract.yaml anchors are authored in.
//
// G1/G11: this is the ONLY place in the framework that imports a browser
// engine; @rippleview/core never does (its LocatorStrategy/EngineExecutor SPI
// treats real engine execution as an opaque, injectable concern).

export interface AccessibilityNode {
  role: string;
  name: string;
}

export interface CaptureResult {
  /** Real, named ARIA roles (AC-1) — the only thing ever merged into contract.yaml (G2: A11y-tree only). */
  named: AccessibilityNode[];
  /**
   * data-testid values found on elements with no real accessible name —
   * BDD-03's fallback signal, surfaced here purely as a DIAGNOSTIC: per G2
   * ("zero-XPath... A11y-tree only — NEVER... data-testid hunting") a
   * data-testid is never written into a contract.yaml anchor. When `named`
   * comes back empty but this doesn't, it tells the operator exactly which
   * elements need a real ARIA role/name added — not nothing happened, and
   * not "fix it for me with a worse locator".
   */
  testIdOnly: string[];
  /**
   * Visible text of every <label> in scope that has NO `for`/`htmlFor` link
   * to a real form control and does not itself wrap one ('s
   * diagnostic signal). A real, common root cause of a "missing required
   * anchor" finding: the label text is genuinely rendered, but never
   * programmatically associated with the control it describes, so the
   * control has no accessible name at all. Always computed (not gated on
   * `named` being empty) — useful even when SOME anchors are found but a
   * SPECIFIC required one isn't.
   */
  orphanLabels: string[];
}

export class UnreachablePlaygroundError extends Error {
  readonly url: string;

  constructor(url: string, cause: unknown) {
    super(
      `Could not reach playground URL "${url}" — is the app actually running? ` +
        `Start it (e.g. "ng serve <project>" or "vite dev") and verify it serves at this URL, then retry. ` +
        `(${cause instanceof Error ? cause.message : String(cause)})`,
    );
    this.name = 'UnreachablePlaygroundError';
    this.url = url;
  }
}

/** The page loaded, but the configured `selectNav` button wasn't found on it. */
export class NavTargetNotFoundError extends Error {
  readonly url: string;
  readonly selectNav: string;

  constructor(url: string, selectNav: string, cause: unknown) {
    super(
      `Loaded "${url}" but found no button named "${selectNav}" to select that section — ` +
        `has the playground's nav label changed, or is selectNav misconfigured? ` +
        `(${cause instanceof Error ? cause.message : String(cause)})`,
    );
    this.name = 'NavTargetNotFoundError';
    this.url = url;
    this.selectNav = selectNav;
  }
}

/**
 * Navigate to `url` in a real headless Chromium page, optionally click an
 * in-page nav button named `selectNav` first (the real rippleview-examples
 * playgrounds are single-page demos that switch sections this way, not via
 * routes — confirmed by reading both the Angular ng17 and React r19
 * playground sources), then return every named role within the page's
 * `main` landmark in the real ARIA snapshot (AC-1) — deduplicated, since
 * the same role+name commonly repeats (e.g. multiple "option" rows) — plus
 * the data-testid fallback diagnostic (BDD-03) and the orphan-label
 * diagnostic. Scoping to `main` (falling back to the whole
 * `body` if no `main` landmark exists) excludes
 * page-level chrome like a shared nav bar that's present on every section
 * and isn't an anchor of the target component at all — confirmed for real
 * against both rippleview-examples playgrounds.
 *
 * Throws `UnreachablePlaygroundError` if the URL can't be reached at all,
 * or `NavTargetNotFoundError` if `selectNav` doesn't match any button
 * (AC-3) — those are real, technical failures. Finding NOTHING usable on a
 * page that DID load (no named roles, no data-testid either) is NOT
 * thrown as an error here — it's real, valid data the caller reports
 * clearly and moves on from (G7/G10: findings are data, not crashes).
 */
export async function captureAccessibilityTree(
  url: string,
  selectNav?: string,
): Promise<CaptureResult> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 10_000 });
    } catch (err) {
      throw new UnreachablePlaygroundError(url, err);
    }

    if (selectNav !== undefined) {
      try {
        await page.getByRole('button', { name: selectNav, exact: true }).click({ timeout: 5_000 });
      } catch (err) {
        throw new NavTargetNotFoundError(url, selectNav, err);
      }
      // The click triggers a client-side re-render (Angular/React state
      // change, no navigation) — confirmed for real against the ng17
      // playground: snapshotting immediately after click() captured the
      // PRE-click section, since click() only waits for the click action
      // itself, not for the app's change-detection cycle to finish. Waiting
      // for DOM mutations to go quiet (rather than a fixed sleep, G13) is
      // the standard signal for "the SPA finished re-rendering" when no
      // app-specific locator to wait on is known generically.
      await waitForDomQuiet(page);
    }

    // Scope to the `main` landmark when present — confirmed for real
    // against both rippleview-examples playgrounds: without this, every capture
    // also picks up the shared page-level nav buttons (Button/Input/Multi
    // Select/...), which exist on every section and aren't anchors of the
    // TARGET component at all. `main` is itself an ARIA landmark role, not
    // a CSS/XPath selector (G2 stays intact) — the same "within the X
    // region" scoping concept the framework's own LocatorStrategy SPI
    // already uses (BDD-02), just applied generically here rather than
    // hardcoded to this one app's structure.
    const mainLandmark = page.getByRole('main');
    const hasMain = (await mainLandmark.count()) > 0;
    const scope = hasMain ? mainLandmark : page.locator('body');
    const scopeSelector = hasMain ? 'main' : 'body';
    const yamlSnapshot = await scope.ariaSnapshot();
    const named = dedupe(parseAriaSnapshot(yamlSnapshot));
    const testIdOnly = named.length === 0 ? await findUnnamedTestIds(page) : [];
    const orphanLabels = await findOrphanLabels(page, scopeSelector);
    return { named, testIdOnly, orphanLabels };
  } finally {
    await browser.close();
  }
}

/**
 * BDD-03's fallback signal, used here only as a diagnostic (see CaptureResult).
 * Real accessible-name computation is the browser's own algorithm (what
 * ariaSnapshot already used for `named`) — this approximates "has no real
 * name" with aria-label/text-content, good enough to tell an operator
 * which data-testid'd elements still need a real ARIA name, not to author
 * a locator from.
 */
async function findUnnamedTestIds(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid]'))
      .filter((el) => {
        const ariaLabel = el.getAttribute('aria-label')?.trim();
        const text = el.textContent?.trim();
        return !ariaLabel && !text;
      })
      .map((el) => el.getAttribute('data-testid'))
      .filter((id): id is string => id !== null),
  );
}

/**
 * 's diagnostic signal: a real, generic (not app-specific) check for
 * the single most common cause of a missing accessible name — a <label>
 * that's visibly rendered but never linked to its control. A label counts
 * as "linked" if its `for` attribute resolves to a real element's `id`, OR
 * it wraps a real form control directly (the native implicit-association
 * pattern, e.g. `<label>Name <input></label>`).
 */
async function findOrphanLabels(page: Page, scopeSelector: 'main' | 'body'): Promise<string[]> {
  return page.evaluate((selector) => {
    const root = document.querySelector(selector) ?? document.body;
    return Array.from(root.querySelectorAll('label'))
      .filter((label) => {
        const forId = label.getAttribute('for');
        const linkedByFor = forId !== null && document.getElementById(forId) !== null;
        const wrapsControl = label.querySelector('input, select, textarea, button') !== null;
        return !linkedByFor && !wrapsControl;
      })
      .map((label) => label.textContent?.trim() ?? '')
      .filter((text) => text.length > 0);
  }, scopeSelector);
}

// ── DOM-quiescence wait ──────────────────────────────────────────────────────
// Resolves once `document.body` has gone `quietMs` without a mutation AFTER
// the FIRST mutation arrives, or `maxWaitMs` elapses regardless (a
// safeguard both against a page that never truly settles, e.g. a live
// clock re-rendering every second, AND against a click whose resulting
// re-render hasn't started yet by the time this runs — confirmed as a real
// bug against the real ng17 playground: starting the quiet-timer
// immediately, before any mutation had occurred, resolved too early and
// captured the PRE-click section. Only arming the quiet-timer once a
// mutation has actually been observed fixes that.

async function waitForDomQuiet(page: Page, quietMs = 150, maxWaitMs = 3_000): Promise<void> {
  await page.evaluate(
    ({ quietMs, maxWaitMs }) =>
      new Promise<void>((resolve) => {
        let quietTimer: ReturnType<typeof setTimeout> | undefined;
        const finish = (): void => {
          clearTimeout(quietTimer);
          clearTimeout(maxTimer);
          observer.disconnect();
          resolve();
        };
        const maxTimer = setTimeout(finish, maxWaitMs);
        const onMutation = (): void => {
          clearTimeout(quietTimer);
          quietTimer = setTimeout(finish, quietMs);
        };
        const observer = new MutationObserver(onMutation);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      }),
    { quietMs, maxWaitMs },
  );
}

// ── ARIA-snapshot YAML parsing ───────────────────────────────────────────────
// Playwright's ariaSnapshot() output is YAML-shaped but not generic YAML —
// each role+name is encoded as a single string key like `combobox "Choose":`,
// and non-role attribute lines (e.g. `- /url: /about`) are interleaved at
// the same indentation as real role lines. A real generic YAML parser would
// still need this same role/name split afterward, so a direct line parser
// is simpler and avoids a second dependency.
//
// A real format variant found against the live React r19 playground (not
// in any docs example): `- button "Save":  Save` — a NAMED node that ALSO
// has its own separate text-content "value" trailing the colon (PrimeReact
// wraps the button label in its own span, which Playwright reports as
// distinct content from the computed accessible name). The original regex
// anchored end-of-line right after the optional colon, silently dropping
// every line shaped this way. Allowing arbitrary trailing content after
// the colon (`.*$`) fixes it — the role+name themselves are still the only
// thing extracted.

const ROLE_LINE = /^-\s+([a-zA-Z][\w-]*)(?:\s+"((?:[^"\\]|\\.)*)")?:?.*$/;

function parseAriaSnapshot(yamlSnapshot: string): AccessibilityNode[] {
  const nodes: AccessibilityNode[] = [];
  for (const rawLine of yamlSnapshot.split('\n')) {
    const trimmed = rawLine.trim();
    const match = ROLE_LINE.exec(trimmed);
    if (match === null) {
      continue;
    }
    const [, role, name] = match;
    if (role !== undefined && name !== undefined && name !== '') {
      nodes.push({ role, name: name.replaceAll('\\"', '"') });
    }
  }
  return nodes;
}

function dedupe(nodes: readonly AccessibilityNode[]): AccessibilityNode[] {
  const seen = new Set<string>();
  const result: AccessibilityNode[] = [];
  for (const node of nodes) {
    const key = `${node.role} ${node.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(node);
    }
  }
  return result;
}
