/**
 * Unit tests for  T-5.3.2 + T-5.3.3 — run-isolation-unit.mjs.
 *
 * AC-1: `up` is invoked with `--exit-code-from runner` (the service_healthy
 *       gate itself is proven in generate-compose.test.ts).
 * AC-2: `down -v` is ALWAYS invoked, including when `up` throws.
 * AC-3 + retry/flake semantics: an infra ('errored') retry that later
 *       succeeds is NOT flaky; a product ('failed') retry that later
 *       succeeds IS flaky; exhausted retries preserve the final status.
 *
 * The executor is a vi.fn() and idGen is deterministic, so no real docker
 * process is ever spawned (G13 determinism).
 */

import { describe, it, expect, vi } from 'vitest';
import { runIsolationUnit } from './run-isolation-unit.mjs';

const COMPOSE_FILE = '/tmp/rv-gate/docker-compose.yml';
const PROJECT_NAME = 'rv-gate-app';
const RESULTS_DIR = '/tmp/rv-gate/results';
const fixedId = () => 'fixed-id';

/** No artifacts present by default — collection must tolerate that (G10). */
const noArtifacts = { readFileFn: () => '', existsFn: () => false };

function unhealthyError() {
  const err = new Error('compose up failed') as Error & { stderr?: string };
  err.stderr = 'dependency failed to start: container app is unhealthy';
  return err;
}

function runnerFailedError() {
  const err = new Error('compose up failed') as Error & { stderr?: string };
  err.stderr = 'runner exited with code 1: 2 assertions failed';
  return err;
}

describe('runIsolationUnit — AC-1: blocks on the runner exit', () => {
  it('invokes up with --exit-code-from runner', () => {
    const executor = vi.fn().mockReturnValue('');
    runIsolationUnit({
      composeFilePath: COMPOSE_FILE,
      projectName: PROJECT_NAME,
      executor,
      resultsDir: RESULTS_DIR,
      idGen: fixedId,
      ...noArtifacts,
    });

    const upCall = executor.mock.calls.find((call) => call[1].includes('up'));
    expect(upCall?.[0]).toBe('docker');
    expect(upCall?.[1]).toEqual(
      expect.arrayContaining(['--exit-code-from', 'runner', '--abort-on-container-exit']),
    );
  });
});

describe('runIsolationUnit — AC-2: down -v always runs', () => {
  it('calls down -v after a clean success', () => {
    const executor = vi.fn().mockReturnValue('');
    runIsolationUnit({
      composeFilePath: COMPOSE_FILE,
      projectName: PROJECT_NAME,
      executor,
      resultsDir: RESULTS_DIR,
      idGen: fixedId,
      ...noArtifacts,
    });

    const downCall = executor.mock.calls.find((call) => call[1].includes('down'));
    expect(downCall?.[1]).toEqual(expect.arrayContaining(['down', '-v']));
  });

  it('still calls down -v when up throws on every attempt', () => {
    const executor = vi.fn().mockImplementation((_cmd: string, args: string[]) => {
      if (args.includes('up')) {
        throw unhealthyError();
      }
      return '';
    });

    const result = runIsolationUnit({
      composeFilePath: COMPOSE_FILE,
      projectName: PROJECT_NAME,
      executor,
      resultsDir: RESULTS_DIR,
      maxRetries: 0,
      idGen: fixedId,
      ...noArtifacts,
    });

    expect(result.status).toBe('errored');
    const downCalls = executor.mock.calls.filter((call) => call[1].includes('down'));
    expect(downCalls.length).toBeGreaterThanOrEqual(1);
    expect(downCalls[0]?.[1]).toEqual(expect.arrayContaining(['down', '-v']));
  });
});

describe('runIsolationUnit — AC-3 + infra retry semantics', () => {
  it('retries an unhealthy app timeout and returns errored + not flaky when retries are exhausted', () => {
    const executor = vi.fn().mockImplementation((_cmd: string, args: string[]) => {
      if (args.includes('up')) {
        throw unhealthyError();
      }
      return '';
    });

    const result = runIsolationUnit({
      composeFilePath: COMPOSE_FILE,
      projectName: PROJECT_NAME,
      executor,
      resultsDir: RESULTS_DIR,
      maxRetries: 1,
      idGen: fixedId,
      ...noArtifacts,
    });

    expect(result.status).toBe('errored');
    expect(result.flaky).toBe(false);
    expect(result.findings[0]?.component).toBe('isolation-unit-health');
    expect(result.findings[0]?.confidence).toBe(0);
    expect(result.findings[0]?.severity).toBe('critical');
    const upCalls = executor.mock.calls.filter((call) => call[1].includes('up'));
    expect(upCalls.length).toBe(2);
  });

  it('returns passed + flaky:false when an infra retry succeeds', () => {
    let upCallCount = 0;
    const executor = vi.fn().mockImplementation((_cmd: string, args: string[]) => {
      if (args.includes('up')) {
        upCallCount += 1;
        if (upCallCount === 1) {
          throw unhealthyError();
        }
      }
      return '';
    });

    const result = runIsolationUnit({
      composeFilePath: COMPOSE_FILE,
      projectName: PROJECT_NAME,
      executor,
      resultsDir: RESULTS_DIR,
      maxRetries: 1,
      idGen: fixedId,
      ...noArtifacts,
    });

    expect(result.status).toBe('passed');
    expect(result.flaky).toBe(false);
  });
});

describe('runIsolationUnit — product failure + flake retry semantics', () => {
  it('returns failed when every attempt fails for a real product reason', () => {
    const executor = vi.fn().mockImplementation((_cmd: string, args: string[]) => {
      if (args.includes('up')) {
        throw runnerFailedError();
      }
      return '';
    });

    const result = runIsolationUnit({
      composeFilePath: COMPOSE_FILE,
      projectName: PROJECT_NAME,
      executor,
      resultsDir: RESULTS_DIR,
      maxRetries: 1,
      idGen: fixedId,
      ...noArtifacts,
    });

    expect(result.status).toBe('failed');
    expect(result.flaky).toBe(false);
  });

  it('returns passed + flaky:true when a product-failure retry succeeds', () => {
    let upCallCount = 0;
    const executor = vi.fn().mockImplementation((_cmd: string, args: string[]) => {
      if (args.includes('up')) {
        upCallCount += 1;
        if (upCallCount === 1) {
          throw runnerFailedError();
        }
      }
      return '';
    });

    const result = runIsolationUnit({
      composeFilePath: COMPOSE_FILE,
      projectName: PROJECT_NAME,
      executor,
      resultsDir: RESULTS_DIR,
      maxRetries: 1,
      idGen: fixedId,
      ...noArtifacts,
    });

    expect(result.status).toBe('passed');
    expect(result.flaky).toBe(true);
  });
});

describe('runIsolationUnit — results collection', () => {
  it('reads the runner summary.json findings when present', () => {
    const executor = vi.fn().mockReturnValue('');
    const readFileFn = vi
      .fn()
      .mockReturnValue(
        JSON.stringify({
          findings: [{ id: 'a', component: 'x', confidence: 1, severity: 'low', message: 'ok' }],
        }),
      );
    const existsFn = vi.fn().mockReturnValue(true);

    const result = runIsolationUnit({
      composeFilePath: COMPOSE_FILE,
      projectName: PROJECT_NAME,
      executor,
      resultsDir: RESULTS_DIR,
      idGen: fixedId,
      readFileFn,
      existsFn,
    });

    expect(result.status).toBe('passed');
    expect(result.findings).toEqual([
      { id: 'a', component: 'x', confidence: 1, severity: 'low', message: 'ok' },
    ]);
  });

  it('trusts a real, empty findings array as a clean pass (no fabricated finding)', () => {
    const executor = vi.fn().mockReturnValue('');
    const readFileFn = vi.fn().mockReturnValue(JSON.stringify({ verdict: 'pass', findings: [] }));
    const existsFn = vi.fn().mockReturnValue(true);

    const result = runIsolationUnit({
      composeFilePath: COMPOSE_FILE,
      projectName: PROJECT_NAME,
      executor,
      resultsDir: RESULTS_DIR,
      idGen: fixedId,
      readFileFn,
      existsFn,
    });

    expect(result.status).toBe('passed');
    expect(result.findings).toEqual([]);
  });

  it('does not crash when summary.json/allure-results are both absent', () => {
    const executor = vi.fn().mockReturnValue('');
    const result = runIsolationUnit({
      composeFilePath: COMPOSE_FILE,
      projectName: PROJECT_NAME,
      executor,
      resultsDir: RESULTS_DIR,
      idGen: fixedId,
      ...noArtifacts,
    });

    expect(result.status).toBe('passed');
    expect(result.findings).toHaveLength(1);
  });
});
