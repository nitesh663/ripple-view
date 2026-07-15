import { describe, it, expect } from 'vitest';
import { runMatrix } from './MatrixRunner.js';
import type { BrowserMatrixEntry, EngineExecutor, EngineFailure, EngineResult } from './types.js';
import type { BddScenario } from '../bdd/types.js';

const VIEWPORT = { width: 1280, height: 720 };

const THREE_ENGINE_MATRIX: BrowserMatrixEntry[] = [
  { browser: 'chromium', viewport: VIEWPORT },
  { browser: 'webkit', viewport: VIEWPORT },
  { browser: 'firefox', viewport: VIEWPORT },
];

const SCENARIO: BddScenario = { name: 'Sample scenario', tags: [], steps: [] };

// AC-2: a scenario runs unchanged across the configured browsers (BDD-05)
describe('AC-2: runMatrix (BDD-05)', () => {
  it('runs the same scenario across chromium, webkit, and firefox, all pass, in order', async () => {
    const alwaysPass: EngineExecutor = async (entry) => ({
      browser: entry.browser,
      verdict: 'pass',
    });

    const results = await runMatrix(THREE_ENGINE_MATRIX, alwaysPass, SCENARIO, {});

    expect(results).toEqual<EngineResult[]>([
      { browser: 'chromium', verdict: 'pass' },
      { browser: 'webkit', verdict: 'pass' },
      { browser: 'firefox', verdict: 'pass' },
    ]);
  });

  it('faithfully surfaces a per-engine fail without swallowing or overwriting other results', async () => {
    const failOnlyWebkit: EngineExecutor = async (entry) => ({
      browser: entry.browser,
      verdict: entry.browser === 'webkit' ? 'fail' : 'pass',
    });

    const results = await runMatrix(THREE_ENGINE_MATRIX, failOnlyWebkit, SCENARIO, {});

    expect(results).toEqual<EngineResult[]>([
      { browser: 'chromium', verdict: 'pass' },
      { browser: 'webkit', verdict: 'fail' },
      { browser: 'firefox', verdict: 'pass' },
    ]);
  });

  // AC-3: the specific failing step survives the runMatrix orchestration loop
  it('passes through the EngineFailure detail on a fail verdict unchanged', async () => {
    const failure: EngineFailure = {
      stepText: 'the button "Refresh" is disabled',
      action: 'assert-disabled',
      message: 'expected true but got false',
      actual: false,
      expected: true,
    };
    const failingExecutor: EngineExecutor = async (entry) => ({
      browser: entry.browser,
      verdict: 'fail',
      failure,
    });

    const results = await runMatrix(
      [{ browser: 'chromium', viewport: VIEWPORT }],
      failingExecutor,
      SCENARIO,
      {},
    );

    expect(results[0]?.failure).toEqual(failure);
  });

  it('calls the executor sequentially with scenario and ctx forwarded unchanged', async () => {
    const ctx = { tenant: 'acme' };
    const seenCtx: unknown[] = [];
    const seenScenarios: BddScenario[] = [];
    const recordingExecutor: EngineExecutor = async (entry, scenario, receivedCtx) => {
      seenCtx.push(receivedCtx);
      seenScenarios.push(scenario);
      return { browser: entry.browser, verdict: 'pass' };
    };

    await runMatrix(THREE_ENGINE_MATRIX, recordingExecutor, SCENARIO, ctx);

    expect(seenCtx).toEqual([ctx, ctx, ctx]);
    expect(seenScenarios).toEqual([SCENARIO, SCENARIO, SCENARIO]);
  });

  it('returns an empty array for an empty matrix', async () => {
    const neverCalled: EngineExecutor = async () => {
      throw new Error('should not be invoked');
    };

    const results = await runMatrix([], neverCalled, SCENARIO, {});

    expect(results).toEqual([]);
  });
});
