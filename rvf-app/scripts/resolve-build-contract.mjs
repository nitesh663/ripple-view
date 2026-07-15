/**
 * resolve-build-contract.mjs — resolves an arbitrary consumer's app-runtime
 * build contract into the normalized shape the parameterized
 * docker/app-runtime/Dockerfile expects (T-5.2.1/T-5.2.3).
 *
 * RippleView builds apps it does not control, so the contract must be discovered
 * from the consumer's own files: rippleview.config.yaml's optional `build` block,
 * with conservative fallbacks. File I/O is injected (readFileFn/existsFn) so
 * the exported function is pure and tests stay deterministic (G13) — there are
 * no direct node:fs calls in resolveBuildContract itself.
 */

import { parse as yamlParse } from 'yaml';

/**
 * @typedef {Object} BuildContract
 * @property {string} nodeVersion — concrete Docker tag fragment, e.g. "18"
 * @property {string} buildCmd — explicit build command, or '' to let the
 *   Dockerfile fall back to `<pm> run build`
 * @property {string} outputDir — built artifact directory
 * @property {'static' | 'node'} serveMode
 * @property {string} startCmd — node serve-mode start command, or ''
 * @property {number} port — node serve-mode listen port
 */

/**
 * @typedef {Object} ResolveOptions
 * @property {string} appDir — directory of the consumer app copy
 * @property {(path: string) => string} readFileFn — reads a file as utf8
 * @property {(path: string) => boolean} existsFn — tests file existence
 */

/**
 * A single concrete version (e.g. "18", "18.20.4", "v20.11.0") that can serve
 * as a Docker tag fragment. Ranges (^, ~, ||, >=, *, x) are intentionally NOT
 * matched: a range cannot be a single tag.
 */
const CONCRETE_VERSION = /^v?\d+(\.\d+){0,2}$/;

/**
 * Resolves the Node version with precedence:
 *   build.node → .nvmrc/.node-version → engines.node (concrete only) → '20'.
 *
 * engines.node is used ONLY when it is a single concrete version; a RANGE such
 * as "^18 || ^20" or ">=16" is ignored because it can't be a single Docker tag.
 * Consumers needing a specific Node (e.g. Angular 15 → 18) should declare
 * build.node explicitly.
 *
 * @param {Record<string, unknown> | undefined} buildBlock
 * @param {ResolveOptions} options
 * @returns {string}
 */
function resolveNodeVersion(buildBlock, { appDir, readFileFn, existsFn }) {
  if (buildBlock && typeof buildBlock['node'] === 'string') {
    return buildBlock['node'];
  }

  for (const name of ['.nvmrc', '.node-version']) {
    if (existsFn(`${appDir}/${name}`)) {
      const raw = readFileFn(`${appDir}/${name}`).trim();
      if (raw) {
        return raw.replace(/^v/, '');
      }
    }
  }

  if (existsFn(`${appDir}/package.json`)) {
    const pkg = JSON.parse(readFileFn(`${appDir}/package.json`));
    const engineNode = pkg?.engines?.node;
    if (typeof engineNode === 'string' && CONCRETE_VERSION.test(engineNode.trim())) {
      return engineNode.trim().replace(/^v/, '');
    }
  }

  return '20';
}

/**
 * Reads and parses the optional rippleview.config.yaml `build` block from appDir.
 *
 * @param {ResolveOptions} options
 * @returns {Record<string, unknown> | undefined}
 */
function readBuildBlock({ appDir, readFileFn, existsFn }) {
  const configPath = `${appDir}/rippleview.config.yaml`;
  if (!existsFn(configPath)) {
    return undefined;
  }
  const parsed = yamlParse(readFileFn(configPath));
  const build = parsed?.build;
  return build && typeof build === 'object' ? build : undefined;
}

/**
 * Resolves the full normalized build contract for a consumer app.
 *
 * @param {ResolveOptions} options
 * @returns {BuildContract}
 */
export function resolveBuildContract({ appDir, readFileFn, existsFn }) {
  const build = readBuildBlock({ appDir, readFileFn, existsFn });

  const nodeVersion = resolveNodeVersion(build, { appDir, readFileFn, existsFn });
  const buildCmd = typeof build?.['command'] === 'string' ? build['command'] : '';
  const outputDir = typeof build?.['outputDir'] === 'string' ? build['outputDir'] : 'dist';
  const serveMode = build?.['serve'] === 'node' ? 'node' : 'static';
  const startCmd = typeof build?.['start'] === 'string' ? build['start'] : '';
  const port = typeof build?.['port'] === 'number' ? build['port'] : 3000;

  return { nodeVersion, buildCmd, outputDir, serveMode, startCmd, port };
}
