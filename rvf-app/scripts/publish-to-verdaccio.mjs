/**
 * publish-to-verdaccio.mjs — publish a candidate package to the ephemeral
 * Verdaccio registry (T-5.1.2).
 *
 * Second channel of the version-swap mechanism (the design spec): instead
 * of a file:/pack override, the candidate is published to a throwaway
 * Verdaccio instance so a consumer can install it exactly like a real
 * registry release. Exports a named function with an injectable executor
 * (G13 determinism — no real child_process spawn in tests), mirroring
 * scripts/preflight.mjs's convention.
 *
 * Usage (direct):
 *   node scripts/publish-to-verdaccio.mjs --dir <packageDir> --registry <url>
 */

/**
 * @typedef {(cmd: string, options: { cwd: string }) => unknown} Executor
 */

/**
 * @typedef {Object} PublishOptions
 * @property {string} packageDir — directory containing the package.json to publish
 * @property {string} registryUrl — e.g. http://localhost:4873
 * @property {Executor} executor — sync function that runs the command with
 *   the given cwd; must throw (or otherwise propagate) on a non-zero exit
 */

/**
 * Publishes the package in `packageDir` to `registryUrl` via
 * `npm publish --registry <url>`. Propagates the executor's error rather
 * than swallowing it — a failed publish must fail the calling pipeline.
 *
 * @param {PublishOptions} options
 * @returns {unknown} whatever the executor returns (e.g. captured stdout)
 */
export function publishToVerdaccio({ packageDir, registryUrl, executor }) {
  const cmd = `npm publish --registry ${registryUrl}`;
  return executor(cmd, { cwd: packageDir });
}

/**
 * Minimal manual parser for `--dir` and `--registry`.
 *
 * @param {string[]} argv — e.g. process.argv.slice(2)
 * @returns {{ dir: string, registry: string }}
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

  if (!flags['dir'] || !flags['registry']) {
    throw new Error('Usage: publish-to-verdaccio.mjs --dir <packageDir> --registry <url>');
  }

  return { dir: flags['dir'], registry: flags['registry'] };
}

// ---------------------------------------------------------------------------
// Entry point — only runs when this file is executed directly.
// Guard uses import.meta.url vs process.argv[1] for cross-platform ESM safety.
// ---------------------------------------------------------------------------
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const thisFile = fileURLToPath(import.meta.url);
const calledFile = process.argv[1];

if (thisFile === calledFile) {
  const { dir, registry } = parseArgs(process.argv.slice(2));

  /** @type {Executor} */
  const realExecutor = (cmd, options) =>
    execSync(cmd, { ...options, encoding: 'utf8', stdio: 'inherit' });

  publishToVerdaccio({ packageDir: dir, registryUrl: registry, executor: realExecutor });
  process.stdout.write(`Published ${dir} to ${registry}\n`);
}
