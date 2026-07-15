import { describe, it, expect } from 'vitest';
import {
  captureAccessibilityTree,
  UnreachablePlaygroundError,
  NavTargetNotFoundError,
} from './captureAccessibilityTree.js';

// Real headless Chromium, real navigation — no mocks (G13: determinism via
// data: URLs, not real network flakiness). This is the framework's first
// real browser-engine test; it's deliberately slower than a pure unit test.

function dataUrl(html: string): string {
  return `data:text/html,${encodeURIComponent(html)}`;
}

describe('captureAccessibilityTree — AC-1: captures the real accessibility tree', () => {
  it('captures role + accessible name for a simple set of elements', async () => {
    const url = dataUrl('<button>Click me</button><input aria-label="Name" />');
    const { named, testIdOnly } = await captureAccessibilityTree(url);

    expect(named).toEqual(
      expect.arrayContaining([
        { role: 'button', name: 'Click me' },
        { role: 'textbox', name: 'Name' },
      ]),
    );
    expect(testIdOnly).toEqual([]);
  });

  it('captures nested roles (combobox/listbox/option), matching the real vocabulary core-controls/rv-multi-select/contract.yaml is authored in', async () => {
    const url = dataUrl(
      '<div role="combobox" aria-label="Choose">' +
        '<div role="listbox">' +
        '<div role="option">Alpha</div>' +
        '<div role="option">Beta</div>' +
        '</div></div>',
    );
    const { named } = await captureAccessibilityTree(url);

    // The listbox itself has no accessible name in this markup, so the
    // parser (which only keeps role+name pairs) correctly omits it —
    // matching the real anchor convention ('s contracts only declare
    // named anchors).
    expect(named).toEqual(
      expect.arrayContaining([
        { role: 'combobox', name: 'Choose' },
        { role: 'option', name: 'Alpha' },
        { role: 'option', name: 'Beta' },
      ]),
    );
  });

  it('deduplicates repeated role+name pairs', async () => {
    const url = dataUrl('<button>Save</button><button>Save</button>');
    const { named } = await captureAccessibilityTree(url);
    const saveButtons = named.filter((n) => n.role === 'button' && n.name === 'Save');
    expect(saveButtons).toHaveLength(1);
  });

  it('captures a named node that ALSO carries its own trailing value text — the real bug found against the live React r19 playground (PrimeReact\'s button renders `button "Save":  Save`, which the original line-anchored regex silently dropped)', async () => {
    const url = dataUrl('<input type="range" aria-label="Volume" min="0" max="10" value="5" />');
    const { named } = await captureAccessibilityTree(url);
    expect(named).toEqual(expect.arrayContaining([{ role: 'slider', name: 'Volume' }]));
  });

  it('AC-3: throws UnreachablePlaygroundError naming the URL when the app is not running, never a fabricated result', async () => {
    const unreachable = 'http://127.0.0.1:59999/definitely-not-running';
    await expect(captureAccessibilityTree(unreachable)).rejects.toThrow(UnreachablePlaygroundError);
    await expect(captureAccessibilityTree(unreachable)).rejects.toThrow(/127\.0\.0\.1:59999/);
  });
});

describe('captureAccessibilityTree — scopes to the main landmark, excluding shared page chrome', () => {
  it('excludes a nav button outside main, capturing only the target content inside it — the real bug found against the real ng17 playground', async () => {
    const url = dataUrl(
      '<nav><button>Button</button><button>Input</button></nav>' +
        '<main><div role="combobox" aria-label="Choose"></div></main>',
    );
    const { named } = await captureAccessibilityTree(url);

    expect(named).toEqual([{ role: 'combobox', name: 'Choose' }]);
    expect(named.some((n) => n.role === 'button')).toBe(false);
  });

  it('falls back to the whole body when no main landmark exists', async () => {
    const url = dataUrl('<button>Save</button>');
    const { named } = await captureAccessibilityTree(url);
    expect(named).toEqual([{ role: 'button', name: 'Save' }]);
  });
});

describe('captureAccessibilityTree — BDD-03 fallback diagnostic: data-testid is surfaced, never authored as an anchor (G2)', () => {
  it('reports unnamed data-testid elements when there is nothing real to capture — a real, valid finding, not a crash', async () => {
    const url = dataUrl(
      '<div data-testid="mystery-widget"></div><div data-testid="another-one"><span></span></div>',
    );
    const { named, testIdOnly } = await captureAccessibilityTree(url);

    expect(named).toEqual([]);
    expect(testIdOnly.sort()).toEqual(['another-one', 'mystery-widget']);
  });

  it('does NOT surface data-testid elements when real named anchors already exist — testid is a fallback, not always-on noise', async () => {
    const url = dataUrl('<button>Save</button><div data-testid="decorative-only"></div>');
    const { named, testIdOnly } = await captureAccessibilityTree(url);

    expect(named).toEqual(expect.arrayContaining([{ role: 'button', name: 'Save' }]));
    expect(testIdOnly).toEqual([]);
  });

  it('reports zero named anchors AND zero testIdOnly when literally nothing is found — the genuine "implement a11y or testid" case', async () => {
    const url = dataUrl('<div></div><span></span>');
    const { named, testIdOnly } = await captureAccessibilityTree(url);
    expect(named).toEqual([]);
    expect(testIdOnly).toEqual([]);
  });

  it("doesn't count a data-testid element that already has its own accessible text as 'unnamed'", async () => {
    const url = dataUrl('<div data-testid="labelled-widget" aria-label="I have a name"></div>');
    const { testIdOnly } = await captureAccessibilityTree(url);
    expect(testIdOnly).toEqual([]);
  });
});

describe('captureAccessibilityTree — diagnostic: orphan <label>s (rendered, but not linked to any control)', () => {
  it('reports a label with no "for" attribute and no wrapped control — the real rv-multi-select pattern (\'s finding)', async () => {
    const url = dataUrl('<label>Status</label><div role="combobox"></div>');
    const { orphanLabels } = await captureAccessibilityTree(url);
    expect(orphanLabels).toEqual(['Status']);
  });

  it('does NOT report a label correctly linked via "for"/id', async () => {
    const url = dataUrl('<label for="name-field">Name</label><input id="name-field" />');
    const { orphanLabels } = await captureAccessibilityTree(url);
    expect(orphanLabels).toEqual([]);
  });

  it('does NOT report a label that wraps its control directly (native implicit association)', async () => {
    const url = dataUrl('<label>Name <input /></label>');
    const { orphanLabels } = await captureAccessibilityTree(url);
    expect(orphanLabels).toEqual([]);
  });

  it('is always computed, even when other named anchors ARE found — useful for a specific missing anchor among present ones', async () => {
    const url = dataUrl('<button>Save</button><label>Status</label><div role="combobox"></div>');
    const { named, orphanLabels } = await captureAccessibilityTree(url);
    expect(named).toEqual(expect.arrayContaining([{ role: 'button', name: 'Save' }]));
    expect(orphanLabels).toEqual(['Status']);
  });
});

describe('captureAccessibilityTree — selectNav: the real rippleview-examples playgrounds switch sections via an in-page nav click, not routes', () => {
  // Mirrors the REAL playground pattern confirmed in both the Angular ng17
  // and React r19 sources: a single page, a nav <button> per section, a
  // click swaps which section is visible — no per-component URL exists.
  const singlePageDemoHtml = `
    <nav>
      <button type="button" onclick="document.getElementById('btn-section').hidden=true;document.getElementById('ms-section').hidden=false;">Multi Select</button>
    </nav>
    <section id="btn-section"><button>Save</button></section>
    <section id="ms-section" hidden>
      <div role="combobox" aria-label="Choose"><div role="listbox"><div role="option">Alpha</div></div></div>
    </section>
  `;

  it('clicks the named nav button before capturing, revealing the section it controls', async () => {
    const url = dataUrl(singlePageDemoHtml);
    const { named } = await captureAccessibilityTree(url, 'Multi Select');

    expect(named).toEqual(expect.arrayContaining([{ role: 'combobox', name: 'Choose' }]));
    // The button-section was hidden by the click; its content's gone too.
    expect(named.some((n) => n.role === 'button' && n.name === 'Save')).toBe(false);
  });

  it('without selectNav, captures whatever section is visible by default', async () => {
    const url = dataUrl(singlePageDemoHtml);
    const { named } = await captureAccessibilityTree(url);
    expect(named).toEqual(expect.arrayContaining([{ role: 'button', name: 'Save' }]));
  });

  it('AC-3: throws NavTargetNotFoundError naming the missing label, never a fabricated result', async () => {
    const url = dataUrl(singlePageDemoHtml);
    await expect(captureAccessibilityTree(url, 'Does Not Exist')).rejects.toThrow(
      NavTargetNotFoundError,
    );
    await expect(captureAccessibilityTree(url, 'Does Not Exist')).rejects.toThrow(/Does Not Exist/);
  }, 15_000);

  it('waits for an ASYNC re-render to finish before snapshotting — the real bug found against the real ng17 playground (Angular change detection runs after click() resolves, not during it)', async () => {
    // The click handler itself only schedules the DOM change after a
    // delay (simulating a framework's async change-detection cycle) —
    // snapshotting immediately after click() would miss it entirely,
    // exactly what happened for real against the live ng17 playground
    // before this wait was added.
    const asyncDemoHtml = `
        <nav>
          <button type="button" onclick="setTimeout(() => { document.getElementById('btn-section').hidden = true; document.getElementById('ms-section').hidden = false; }, 300)">Multi Select</button>
        </nav>
        <section id="btn-section"><button>Save</button></section>
        <section id="ms-section" hidden>
          <div role="combobox" aria-label="Choose"></div>
        </section>
      `;
    const url = dataUrl(asyncDemoHtml);
    const { named } = await captureAccessibilityTree(url, 'Multi Select');
    expect(named).toEqual(expect.arrayContaining([{ role: 'combobox', name: 'Choose' }]));
  }, 15_000);
});
