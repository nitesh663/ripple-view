/**
 * classify-isolation-failure.mjs — turns a failed `docker compose up` attempt
 * into an isolation-unit verdict class (T-5.3.3; the design spec
 * "Isolation Pipeline & Dockerization" failure/flake handling table).
 *
 * Split out of run-isolation-unit.mjs to respect the 200-line/file limit and
 * keep a single responsibility: this file only knows how to read a captured
 * stderr/error string and classify it as an infra timeout ('errored') versus
 * a real runner/product failure ('failed'). No I/O, no process spawning.
 */

/**
 * Patterns indicating the `app` service never reported healthy before the
 * compose health-check budget ran out — an INFRA problem, not a product
 * test failure (the design spec: "App never healthy (timeout)" row).
 * Matched case-insensitively against the captured stderr text.
 */
const UNHEALTHY_PATTERNS = [/unhealthy/i, /dependency failed to start/i, /health check/i];

/**
 * Classifies a failed isolation-unit attempt from its captured stderr text.
 *
 * @param {string} stderrText
 * @returns {'errored' | 'failed'}
 */
export function classifyFailure(stderrText) {
  const text = typeof stderrText === 'string' ? stderrText : '';
  const isUnhealthyTimeout = UNHEALTHY_PATTERNS.some((pattern) => pattern.test(text));
  return isUnhealthyTimeout ? 'errored' : 'failed';
}

/**
 * Extracts the most informative text from a thrown executor error. execFileSync
 * attaches stderr on a non-zero exit; fall back to the error message.
 * Duplicated from scripts/build-app-runtime.mjs's internal-only helper of the
 * same name — each script file stays self-contained per this repo's existing
 * convention (root scripts/ files do not import each other's private helpers).
 *
 * @param {unknown} err
 * @returns {string}
 */
export function captureErrorText(err) {
  if (err && typeof err === 'object') {
    const candidate = /** @type {{ stderr?: unknown, message?: unknown }} */ (err);
    if (typeof candidate.stderr === 'string' && candidate.stderr.trim()) {
      return candidate.stderr;
    }
    if (candidate.stderr instanceof Uint8Array) {
      return Buffer.from(candidate.stderr).toString('utf8');
    }
    if (typeof candidate.message === 'string') {
      return candidate.message;
    }
  }
  return String(err);
}
