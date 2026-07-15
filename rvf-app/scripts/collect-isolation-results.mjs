/**
 * collect-isolation-results.mjs — reads the runner's own collected artifacts
 * (summary.json + allure-results) after an isolation-unit run, and shapes the
 * Finding[] returned to the caller (T-5.3.2; split out of
 * run-isolation-unit.mjs to respect the 200-line/file limit).
 *
 * All I/O is injected (readFileFn/existsFn) so this stays pure and
 * deterministic (G13). Absence of either artifact is tolerated — PoC apps
 * may not write Allure output yet — and never crashes (G10).
 */

/**
 * Mirrors @rippleview/core's Finding interface (packages/core/src/store/types.ts).
 * Re-declared here rather than imported because root scripts stay decoupled
 * from the workspace packages (G19).
 *
 * @typedef {Object} Finding
 * @property {string} id
 * @property {string} component
 * @property {number} confidence
 * @property {'critical' | 'high' | 'medium' | 'low' | 'info'} severity
 * @property {string} message
 */

/**
 * Reads the runner's own summary.json + Allure-results presence, tolerating
 * either being absent.
 *
 * @param {{ resultsDir: string, readFileFn: (p: string) => string, existsFn: (p: string) => boolean }} options
 * @returns {{ runnerSummary: unknown, hasAllureResults: boolean }}
 */
export function collectResults({ resultsDir, readFileFn, existsFn }) {
  const summaryPath = `${resultsDir}/summary.json`;
  const allureDir = `${resultsDir}/allure-results`;

  let runnerSummary;
  if (existsFn(summaryPath)) {
    try {
      runnerSummary = JSON.parse(readFileFn(summaryPath));
    } catch {
      runnerSummary = undefined;
    }
  }

  return { runnerSummary, hasAllureResults: existsFn(allureDir) };
}

/**
 * Builds the finding for an 'errored' (infra) verdict (AC-3).
 *
 * @param {{ idGen: () => string }} options
 * @returns {Finding}
 */
export function erroredFinding({ idGen }) {
  return {
    id: idGen(),
    component: 'isolation-unit-health',
    confidence: 0,
    severity: 'critical',
    message:
      'The app service never reported healthy within the compose health-check budget; ' +
      'this is an infra error, not a product test failure.',
  };
}

/**
 * Derives the findings for a 'failed' or 'passed' verdict from whatever the
 * runner itself collected. A genuinely present `findings` array is trusted
 * AS-IS, including when it's empty — an empty array from a real summary.json
 * is a clean pass, not missing data, and must not be papered over with a
 * fabricated finding. The fallback finding only fires when the runner
 * produced no usable summary at all (missing file or unparseable JSON).
 *
 * @param {{ runnerSummary: unknown, fallbackMessage: string, idGen: () => string }} options
 * @returns {Finding[]}
 */
export function findingsFromRunnerSummary({ runnerSummary, fallbackMessage, idGen }) {
  const candidate = /** @type {{ findings?: unknown }} */ (runnerSummary);
  if (candidate && Array.isArray(candidate.findings)) {
    return /** @type {Finding[]} */ (candidate.findings);
  }
  return [
    {
      id: idGen(),
      component: 'isolation-unit',
      confidence: 0,
      severity: 'medium',
      message: fallbackMessage,
    },
  ];
}
