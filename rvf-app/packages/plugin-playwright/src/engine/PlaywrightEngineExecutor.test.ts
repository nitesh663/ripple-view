import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BddScenario } from '@rippleview/core';
import { playwrightEngineExecutor } from './PlaywrightEngineExecutor.js';
import { startStaticServer, type StaticServer } from './static-server.js';

/**
 * Real-browser, real-HTTP integration test for  AC1/AC2/AC3 — proves
 * `playwrightEngineExecutor` actually launches Chromium, drives a real DOM
 * via the real PlaywrightStepExecutor/LocatorStrategy/WaitStrategy, and
 * reports a real pass and a real fail. The CLI-level run.test.ts only
 * proves the aggregation logic with fully-faked executors (G13: no real
 * browser there); this file is the one place that proves the real engine
 * itself works end-to-end, mirroring the real-fixture bar every other
 * plugin-playwright SPI test in this repo already holds itself to.
 *
 * Serves a tiny real HTML fixture (a button that increments a counter
 * readout on click) over `startStaticServer` — the same helper AC3's
 * orders-app fixture proof used — rather than re-building the actual
 * orders-app, since the only thing under test here is the engine's own
 * lifecycle (browser/context per call, step walk, failure surfacing), not
 * the fixture app's own markup.
 */

const FIXTURE_HTML = `<!DOCTYPE html>
<html>
  <body>
    <button id="refresh">Refresh</button>
    <p id="readout">Refreshed 0 time(s)</p>
    <script>
      let count = 0;
      document.getElementById('refresh').addEventListener('click', () => {
        count += 1;
        document.getElementById('readout').textContent = 'Refreshed ' + count + ' time(s)';
      });
    </script>
  </body>
</html>`;

describe('playwrightEngineExecutor — real Chromium, real HTTP ( AC1/AC2/AC3)', () => {
  let dir: string;
  let server: StaticServer;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'rv-engine-executor-'));
    writeFileSync(join(dir, 'index.html'), FIXTURE_HTML, 'utf8');
    server = await startStaticServer(dir);
  });

  afterAll(async () => {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  function scenario(steps: string[]): BddScenario {
    return {
      name: 'fixture scenario',
      tags: [],
      steps: steps.map((text) => ({ keyword: 'When' as const, text })),
    };
  }

  // Each test below launches at least one real Chromium instance; under the
  // full suite's concurrent browser-launch load this can exceed vitest's
  // default 5000ms (not a fixed sleep, G13 — just headroom for real work).
  it('AC3: a real passing fixture produces verdict "pass"', async () => {
    const result = await playwrightEngineExecutor(
      { browser: 'chromium', viewport: { width: 1280, height: 720 } },
      scenario([
        'I am on route "/"',
        'I activate the button "Refresh"',
        'the text "Refreshed 1 time(s)" is shown',
      ]),
      { baseUrl: server.origin },
    );

    expect(result.browser).toBe('chromium');
    expect(result.verdict).toBe('pass');
    // Additive reporting fields (per-step status/timing + scenario name).
    expect(result.name).toBe('fixture scenario');
    expect(result.steps?.map((s) => s.status)).toEqual(['pass', 'pass', 'pass']);
    expect(typeof result.durationMs).toBe('number');
  }, 15000);

  it('AC3: a real deliberately failing fixture produces verdict "fail" naming the failing step', async () => {
    const result = await playwrightEngineExecutor(
      { browser: 'chromium', viewport: { width: 1280, height: 720 } },
      scenario(['I am on route "/"', 'the button "Refresh" is disabled']),
      { baseUrl: server.origin },
    );

    expect(result.browser).toBe('chromium');
    expect(result.verdict).toBe('fail');
    expect(result.failure?.stepText).toBe('the button "Refresh" is disabled');
    expect(result.failure?.action).toBe('assert-disabled');
    expect(result.failure?.actual).toBe(false);
    expect(result.failure?.expected).toBe(true);
  }, 15000);

  it('AC1: an unmatched step never silently passes — verdict is "fail" naming it', async () => {
    const result = await playwrightEngineExecutor(
      { browser: 'chromium', viewport: { width: 1280, height: 720 } },
      scenario(['I am on route "/"', 'this sentence matches no catalog pattern at all']),
      { baseUrl: server.origin },
    );

    expect(result.verdict).toBe('fail');
    expect(result.failure?.stepText).toBe('this sentence matches no catalog pattern at all');
  }, 15000);

  it('AC2: two scenario runs never share state — each gets a fresh browser context', async () => {
    const first = await playwrightEngineExecutor(
      { browser: 'chromium', viewport: { width: 1280, height: 720 } },
      scenario([
        'I am on route "/"',
        'I activate the button "Refresh"',
        'I activate the button "Refresh"',
        'the text "Refreshed 2 time(s)" is shown',
      ]),
      { baseUrl: server.origin },
    );

    const second = await playwrightEngineExecutor(
      { browser: 'chromium', viewport: { width: 1280, height: 720 } },
      scenario(['I am on route "/"', 'the text "Refreshed 0 time(s)" is shown']),
      { baseUrl: server.origin },
    );

    expect(first.verdict).toBe('pass');
    expect(second.verdict).toBe('pass');
  }, 15000);
});
