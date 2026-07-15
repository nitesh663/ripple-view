import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { BddScenario, EngineExecutor, EngineFailure, ParsedSuite } from '@rippleview/core';
import { runCommand } from './run.js';
import type { SummaryRecord } from '../summary.js';

//  AC4: runCommand discovers this app's own .feature suites and
// aggregates every EngineResult across every scenario x matrix entry into
// the final SummaryRecord.verdict + findings — proven here with fully-faked
// discoverSuites/executor injections (G13: no real browser, no real disk
// glob, fully deterministic).

const noopWriter: (record: SummaryRecord, outputDir: string) => void = () => undefined;
const noopMkdirp: (dir: string) => void = () => undefined;

let configPath: string;

beforeAll(() => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rv-cli-run-ac4-'));
  const appDir = join(tempDir, 'my-app');
  mkdirSync(appDir, { recursive: true });
  configPath = join(appDir, 'rippleview.config.yaml');
  writeFileSync(
    configPath,
    [
      'department: testing',
      'baseUrl: "http://localhost:4999"',
      'matrix:',
      '  - browser: chromium',
      '    viewport: { width: 1280, height: 720 }',
      '  - browser: webkit',
      '    viewport: { width: 1280, height: 720 }',
    ].join('\n'),
    'utf8',
  );
});

afterAll(() => {
  rmSync(configPath, { force: true });
});

const SCENARIO: BddScenario = { name: 'A scenario', tags: [], steps: [] };

function oneSuite(): ParsedSuite[] {
  return [
    {
      feature: { name: 'Feature', tags: [], scenarios: [SCENARIO] },
      scenarios: [{ scenario: SCENARIO }],
    },
  ];
}

describe(' AC4: runCommand aggregates EngineResults into one verdict', () => {
  it('exits 0 and verdict "pass" when every matrix entry passes', async () => {
    const alwaysPass: EngineExecutor = async (entry) => ({
      browser: entry.browser,
      verdict: 'pass',
    });

    const result = await runCommand({
      config: configPath,
      writeSummary: noopWriter,
      mkdirp: noopMkdirp,
      discoverSuites: async () => oneSuite(),
      executor: alwaysPass,
    });

    expect(result.exitCode).toBe(0);
    expect(result.summary.verdict).toBe('pass');
    expect(result.summary.findings).toEqual([]);
  });

  it('exits 1 and verdict "fail" when ANY matrix entry fails, collecting its EngineFailure', async () => {
    const failure: EngineFailure = {
      stepText: 'the button "Refresh" is disabled',
      action: 'assert-disabled',
      message: 'expected true but got false',
      actual: false,
      expected: true,
    };
    const failOnlyWebkit: EngineExecutor = async (entry) =>
      entry.browser === 'webkit'
        ? { browser: entry.browser, verdict: 'fail', failure }
        : { browser: entry.browser, verdict: 'pass' };

    const result = await runCommand({
      config: configPath,
      writeSummary: noopWriter,
      mkdirp: noopMkdirp,
      discoverSuites: async () => oneSuite(),
      executor: failOnlyWebkit,
    });

    expect(result.exitCode).toBe(1);
    expect(result.summary.verdict).toBe('fail');
    expect(result.summary.findings).toEqual([failure]);
  });

  it('passes the scenario and a PlaywrightEngineContext-shaped ctx (with baseUrl) to the executor', async () => {
    const seenCtx: unknown[] = [];
    const seenScenarios: BddScenario[] = [];
    const recordingExecutor: EngineExecutor = async (entry, scenario, ctx) => {
      seenCtx.push(ctx);
      seenScenarios.push(scenario);
      return { browser: entry.browser, verdict: 'pass' };
    };

    await runCommand({
      config: configPath,
      writeSummary: noopWriter,
      mkdirp: noopMkdirp,
      discoverSuites: async () => oneSuite(),
      executor: recordingExecutor,
    });

    expect(seenCtx).toEqual([
      { baseUrl: 'http://localhost:4999' },
      { baseUrl: 'http://localhost:4999' },
    ]);
    expect(seenScenarios).toEqual([SCENARIO, SCENARIO]);
  });

  it('exits 0 and verdict "pass" (vacuously) when discoverSuites finds nothing', async () => {
    const neverCalled: EngineExecutor = async () => {
      throw new Error('should not be invoked — there are no scenarios to run');
    };

    const result = await runCommand({
      config: configPath,
      writeSummary: noopWriter,
      mkdirp: noopMkdirp,
      discoverSuites: async () => [],
      executor: neverCalled,
    });

    expect(result.exitCode).toBe(0);
    expect(result.summary.verdict).toBe('pass');
    expect(result.summary.findings).toEqual([]);
  });

  it('exits 1 with a fail summary when discoverSuites itself throws', async () => {
    const result = await runCommand({
      config: configPath,
      writeSummary: noopWriter,
      mkdirp: noopMkdirp,
      discoverSuites: async () => {
        throw new Error('disk read failed');
      },
      executor: async (entry) => ({ browser: entry.browser, verdict: 'pass' }),
    });

    expect(result.exitCode).toBe(1);
    expect(result.summary.verdict).toBe('fail');
    expect(result.summary.findings).toEqual(['disk read failed']);
  });
});
