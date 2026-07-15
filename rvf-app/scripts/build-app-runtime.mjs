/**
 * build-app-runtime.mjs — builds the app-runtime image for a consumer app and
 * turns a build/compile break into a backward-compat Finding (T-5.2.3; the design spec Build stage: "Fail ⇒ confidence 0, finding
 * 'build/compat break', skip later stages").
 *
 * The executor is injected so no real docker process is spawned in tests (G13).
 * This script is self-contained: it does NOT import @rippleview/core — the Finding
 * shape is duck-typed and documented to mirror core's interface.
 */

import { resolveBuildContract } from './resolve-build-contract.mjs';
import { buildDockerArgs } from './build-app-runtime-args.mjs';

// Re-export so callers (and tests) keep a single import surface for the
// app-runtime build API even though the arg construction lives in a sibling.
export { buildDockerArgs };

/**
 * Mirrors @rippleview/core's Finding interface (packages/core/src/store/types.ts).
 * Re-declared here rather than imported because root scripts stay decoupled
 * from the workspace packages.
 *
 * @typedef {Object} Finding
 * @property {string} id
 * @property {string} component
 * @property {number} confidence — 0-1; G17: never rounded up to force a pass
 * @property {'critical' | 'high' | 'medium' | 'low' | 'info'} severity
 * @property {string} message
 */

/**
 * @typedef {import('./resolve-build-contract.mjs').BuildContract} BuildContract
 */

/**
 * Runs a command with an argument array (NOT a shell string) so args are not
 * shell-interpolated; must throw on non-zero exit.
 *
 * @typedef {(command: string, args: string[]) => unknown} Executor
 */

/**
 * @typedef {Object} BuildOptions
 * @property {BuildContract} contract
 * @property {string} imageTag
 * @property {string} dockerfilePath
 * @property {string} appDir
 * @property {string} [frameworkRoot] — absolute path to the rv repo root;
 *   threaded through to buildDockerArgs so the Dockerfile can pull its own
 *   files (e.g. nginx.conf) from a secondary build context, since `appDir`
 *   is a throwaway copy of the CONSUMER's app and never contains them
 * @property {Executor} executor
 * @property {() => string} idGen — id factory (UUID in production, fixed in tests)
 */

/**
 * Builds the Finding emitted when the app-runtime build fails. G10: a
 * build/compat break is recorded as data with confidence 0 (never rounded up,
 * G17) — it is NOT thrown away or swallowed.
 *
 * @param {{ message: string, idGen: () => string }} options
 * @returns {Finding}
 */
export function buildFailureFinding({ message, idGen }) {
  return {
    id: idGen(),
    component: 'app-runtime-build',
    confidence: 0,
    severity: 'critical',
    message,
  };
}

/**
 * @typedef {{ ok: true, imageTag: string } | { ok: false, finding: Finding }} BuildResult
 */

/**
 * Orchestrates the app-runtime build. On success returns { ok: true, imageTag }.
 * On a build/compile break the error is CAPTURED (never rethrown) and returned
 * as { ok: false, finding } so the gate records it instead of crashing (G10).
 *
 * @param {BuildOptions} options
 * @returns {BuildResult}
 */
export function buildAppRuntime({
  contract,
  imageTag,
  dockerfilePath,
  appDir,
  frameworkRoot,
  executor,
  idGen,
}) {
  const args = buildDockerArgs({ contract, imageTag, dockerfilePath, appDir, frameworkRoot });
  try {
    executor('docker', args);
    return { ok: true, imageTag };
  } catch (err) {
    const message = captureErrorText(err);
    return { ok: false, finding: buildFailureFinding({ message, idGen }) };
  }
}

/**
 * Extracts the most informative text from a thrown executor error. execFileSync
 * attaches stderr on a non-zero exit; fall back to the error message.
 *
 * @param {unknown} err
 * @returns {string}
 */
function captureErrorText(err) {
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

/**
 * Minimal manual parser for --app, --tag, --dockerfile.
 *
 * @param {string[]} argv
 * @returns {{ app: string, tag: string, dockerfile: string }}
 */
export function parseArgs(argv) {
  /** @type {Record<string, string>} */
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      flags[arg.slice(2)] = argv[i + 1];
      i += 1;
    }
  }

  if (!flags['app'] || !flags['tag']) {
    throw new Error('Usage: build-app-runtime.mjs --app <dir> --tag <image> [--dockerfile <path>]');
  }

  return {
    app: flags['app'],
    tag: flags['tag'],
    dockerfile: flags['dockerfile'] ?? 'docker/app-runtime/Dockerfile',
  };
}

// ---------------------------------------------------------------------------
// Entry point — only runs when this file is executed directly.
// ---------------------------------------------------------------------------
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const thisFile = fileURLToPath(import.meta.url);
const calledFile = process.argv[1];

if (thisFile === calledFile) {
  const { app, tag, dockerfile } = parseArgs(process.argv.slice(2));

  const contract = resolveBuildContract({
    appDir: app,
    readFileFn: (p) => readFileSync(p, 'utf8'),
    existsFn: (p) => existsSync(p),
  });

  /** @type {Executor} */
  const realExecutor = (command, args) =>
    execFileSync(command, args, { stdio: 'pipe', encoding: 'utf8' });

  const result = buildAppRuntime({
    contract,
    imageTag: tag,
    dockerfilePath: dockerfile,
    appDir: app,
    // CWD when this script is invoked directly is the rv repo root, the
    // same assumption the default `dockerfile` path above already makes.
    frameworkRoot: process.cwd(),
    executor: realExecutor,
    idGen: randomUUID,
  });

  if (result.ok) {
    process.stdout.write(`Built app-runtime image ${result.imageTag}\n`);
  } else {
    // The build break is reported as a finding, not swallowed (G10), then a
    // non-zero exit signals the CLI caller that the build stage failed.
    process.stdout.write(`${JSON.stringify(result.finding, null, 2)}\n`);
    process.exit(1);
  }
}
