/**
 * compose-exec.mjs — shapes and runs the `docker compose up`/`down -v` argv
 * pair for one isolation-unit attempt (T-5.3.2; split out of
 * run-isolation-unit.mjs to respect the 200-line/file limit and keep a
 * single responsibility: this file only knows how to invoke compose, not how
 * to classify or retry a failure).
 *
 * The executor is injected so no real docker process is spawned in tests
 * (G13).
 */

/**
 * @typedef {(command: string, args: string[]) => unknown} Executor
 */

/**
 * Builds the `docker compose ... up` argv. AC-1: `--exit-code-from runner`
 * makes the orchestrator block until the runner container exits; the
 * service_healthy gating itself lives in the generated compose file (see
 * scripts/generate-compose.mjs).
 *
 * @param {{ projectName: string, composeFilePath: string }} options
 * @returns {string[]}
 */
export function buildUpArgs({ projectName, composeFilePath }) {
  return [
    'compose',
    '-p',
    projectName,
    '-f',
    composeFilePath,
    'up',
    '--abort-on-container-exit',
    '--exit-code-from',
    'runner',
  ];
}

/**
 * Builds the `docker compose ... down -v` argv (AC-2).
 *
 * @param {{ projectName: string, composeFilePath: string }} options
 * @returns {string[]}
 */
export function buildDownArgs({ projectName, composeFilePath }) {
  return ['compose', '-p', projectName, '-f', composeFilePath, 'down', '-v'];
}

/**
 * Runs `up` then ALWAYS `down -v`, regardless of `up`'s outcome (AC-2: results
 * must be collected and the stack purged even when `up` fails). Returns
 * whether `up` succeeded and, on failure, the captured stderr text.
 *
 * @param {{ executor: Executor, projectName: string, composeFilePath: string, captureErrorText: (err: unknown) => string }} options
 * @returns {{ ok: true } | { ok: false, stderrText: string }}
 */
export function upThenAlwaysDown({ executor, projectName, composeFilePath, captureErrorText }) {
  const upArgs = buildUpArgs({ projectName, composeFilePath });
  const downArgs = buildDownArgs({ projectName, composeFilePath });

  try {
    executor('docker', upArgs);
    executor('docker', downArgs);
    return { ok: true };
  } catch (err) {
    const stderrText = captureErrorText(err);
    try {
      executor('docker', downArgs);
    } catch {
      // Teardown itself failing must not mask the original up failure (G10):
      // the unit's verdict is still driven by the up-step error above.
    }
    return { ok: false, stderrText };
  }
}
