/**
 * run-isolation-unit.mjs — orchestrates one disposable docker-compose
 * "isolation unit" run (T-5.3.2 + T-5.3.3; the design spec "Isolation
 * Pipeline & Dockerization"-3.5).
 *
 * The executor is injected so no real docker process is spawned in tests
 * (G13). This script is self-contained: it does NOT import @rippleview/core — the
 * Finding shape is duck-typed and documented to mirror core's interface
 * (see scripts/build-app-runtime.mjs for the same convention).
 *
 * AC-1/AC-2: the up/down compose invocation lives in scripts/compose-exec.mjs.
 * AC-3: an app that never becomes healthy is classified 'errored' (infra),
 *       not 'failed' (product) — see scripts/classify-isolation-failure.mjs.
 * Result collection (reading summary.json/allure-results, shaping findings)
 * lives in scripts/collect-isolation-results.mjs.
 *
 * All three are split out to respect the 200-line/file limit; this file owns
 * only the retry/flake orchestration itself.
 */

import { classifyFailure, captureErrorText } from './classify-isolation-failure.mjs';
import { upThenAlwaysDown } from './compose-exec.mjs';
import {
  collectResults,
  erroredFinding,
  findingsFromRunnerSummary,
} from './collect-isolation-results.mjs';

/**
 * @typedef {import('./collect-isolation-results.mjs').Finding} Finding
 * @typedef {(command: string, args: string[]) => unknown} Executor
 */

/**
 * @typedef {Object} RunIsolationUnitOptions
 * @property {string} composeFilePath
 * @property {string} projectName
 * @property {Executor} executor
 * @property {string} resultsDir
 * @property {number} [maxRetries] — additional attempts beyond the first; default 1
 * @property {() => string} idGen
 * @property {(path: string) => string} readFileFn
 * @property {(path: string) => boolean} existsFn
 */

/**
 * @typedef {Object} IsolationUnitResult
 * @property {'passed' | 'failed' | 'errored'} status
 * @property {number} exitCode
 * @property {number} durationMs
 * @property {boolean} flaky
 * @property {Finding[]} findings
 */

/**
 * Builds the 'passed' result after a successful attempt, folding in whatever
 * the runner itself collected and the flake flag (G17: a retry-cleared
 * product failure is marked flaky, never silently reported as clean green).
 *
 * @param {{ resultsDir: string, readFileFn: (p: string) => string, existsFn: (p: string) => boolean, idGen: () => string, startMs: number, flaky: boolean }} options
 * @returns {IsolationUnitResult}
 */
function buildPassedResult({ resultsDir, readFileFn, existsFn, idGen, startMs, flaky }) {
  const { runnerSummary, hasAllureResults } = collectResults({ resultsDir, readFileFn, existsFn });
  const findings = findingsFromRunnerSummary({
    runnerSummary,
    fallbackMessage: hasAllureResults
      ? 'Runner exited successfully; no summary.json findings array was present.'
      : 'Runner exited successfully; no summary.json or allure-results were found.',
    idGen,
  });
  return { status: 'passed', exitCode: 0, durationMs: Date.now() - startMs, flaky, findings };
}

/**
 * Builds the final non-passing result once retries are exhausted, classifying
 * the last failure as infra ('errored', AC-3) or product ('failed').
 *
 * @param {{ lastStderrText: string, idGen: () => string, startMs: number }} options
 * @returns {IsolationUnitResult}
 */
function buildExhaustedResult({ lastStderrText, idGen, startMs }) {
  const durationMs = Date.now() - startMs;
  if (classifyFailure(lastStderrText) === 'errored') {
    return {
      status: 'errored',
      exitCode: 1,
      durationMs,
      flaky: false,
      findings: [erroredFinding({ idGen })],
    };
  }
  return {
    status: 'failed',
    exitCode: 1,
    durationMs,
    flaky: false,
    findings: [
      {
        id: idGen(),
        component: 'isolation-unit',
        confidence: 0,
        severity: 'high',
        message: lastStderrText || 'The runner container exited non-zero.',
      },
    ],
  };
}

/**
 * Runs one isolation unit end to end: up (gated on service_healthy) → block
 * on the runner's exit → always tear down → classify + retry on failure.
 * Never throws — this is an orchestration boundary (G10).
 *
 * @param {RunIsolationUnitOptions} options
 * @returns {IsolationUnitResult}
 */
export function runIsolationUnit(options) {
  const { composeFilePath, projectName, executor, resultsDir, idGen, readFileFn, existsFn } =
    options;
  const maxRetries = options.maxRetries ?? 1;
  const startMs = Date.now();

  let attemptsLeft = maxRetries + 1;
  let lastStderrText = '';
  let everSawErrored = false;
  let everSawFailed = false;

  while (attemptsLeft > 0) {
    attemptsLeft -= 1;
    const attempt = upThenAlwaysDown({ executor, projectName, composeFilePath, captureErrorText });

    if (attempt.ok) {
      // A retry succeeding after an infra ('errored') attempt is NOT flaky —
      // only a product/runner ('failed') attempt that later passes is.
      const flaky = everSawErrored ? false : everSawFailed;
      return buildPassedResult({ resultsDir, readFileFn, existsFn, idGen, startMs, flaky });
    }

    lastStderrText = attempt.stderrText;
    if (classifyFailure(lastStderrText) === 'errored') {
      everSawErrored = true;
    } else {
      everSawFailed = true;
    }
  }

  return buildExhaustedResult({ lastStderrText, idGen, startMs });
}

export { classifyFailure };
