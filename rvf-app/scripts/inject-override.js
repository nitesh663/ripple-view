/**
 * inject-override.js — version-swap mechanism ()
 *
 * Forces a consumer onto a candidate library version by injecting a
 * package-manager-specific override into a (throwaway-copy) package.json
 * and surgically pruning the matching lockfile entries, so the candidate
 * wins transitively without altering the original app repo or touching any
 * unrelated package's pinned version/integrity.
 *
 * All I/O is injected (readFileFn/writeFileFn/existsFn) so unit tests never
 * touch the real filesystem (G13 determinism). Mirrors scripts/preflight.mjs's
 * named-exports + guarded-entry-point convention.
 *
 * Package-manager detection/override-shaping lives in override-fields.mjs
 * (split out to respect the 200-line/file limit); lockfile pruning lives in
 * scripts/lockfile/*.mjs.
 *
 * Usage (direct):
 *   node scripts/inject-override.js --app <dir> --package <name> --version <spec> [--pm npm|pnpm|yarn]
 */

import {
  detectPackageManager,
  getLockfileName,
  mergeOverrideIntoPackageJson,
} from './override-fields.mjs';
import { pruneNpmLockEntry } from './lockfile/pruneNpmLock.mjs';
import { prunePnpmLockEntry } from './lockfile/prunePnpmLock.mjs';
import { pruneYarnLockEntry } from './lockfile/pruneYarnLock.mjs';

export {
  detectPackageManager,
  getLockfileName,
  buildOverrideField,
  mergeOverrideIntoPackageJson,
} from './override-fields.mjs';

/**
 * @typedef {import('./override-fields.mjs').PackageManager} PackageManager
 */

/**
 * @typedef {Object} InjectOverrideOptions
 * @property {string} appDir — throwaway copy of the consumer app
 * @property {string} packageName
 * @property {string} versionSpec
 * @property {PackageManager} [pm] — explicit override; otherwise auto-detected
 * @property {(path: string, encoding: 'utf8') => string} readFileFn
 * @property {(path: string, content: string, encoding: 'utf8') => void} writeFileFn
 * @property {(path: string) => boolean} existsFn
 * @property {(content: string) => unknown} [yamlParse] — injected for pnpm (G13)
 * @property {(value: unknown) => string} [yamlStringify] — injected for pnpm (G13)
 */

/**
 * Prunes and re-serializes the lockfile at `lockfilePath` in place, using
 * the format matching `pm`. Skips entirely if no lockfile exists.
 *
 * @param {PackageManager} pm
 * @param {string} lockfilePath
 * @param {string} packageName
 * @param {Pick<InjectOverrideOptions, 'readFileFn' | 'writeFileFn' | 'existsFn' | 'yamlParse' | 'yamlStringify'>} io
 * @returns {string | null} the lockfile path if pruned, else null
 */
function pruneLockfileInPlace(pm, lockfilePath, packageName, io) {
  if (!io.existsFn(lockfilePath)) {
    return null;
  }

  const rawLockfile = io.readFileFn(lockfilePath, 'utf8');

  if (pm === 'npm') {
    const pruned = pruneNpmLockEntry(JSON.parse(rawLockfile), packageName);
    io.writeFileFn(lockfilePath, `${JSON.stringify(pruned, null, 2)}\n`, 'utf8');
    return lockfilePath;
  }

  if (pm === 'pnpm') {
    if (!io.yamlParse || !io.yamlStringify) {
      throw new Error('yamlParse/yamlStringify must be supplied to prune a pnpm-lock.yaml file.');
    }
    const pruned = prunePnpmLockEntry(io.yamlParse(rawLockfile), packageName);
    io.writeFileFn(lockfilePath, io.yamlStringify(pruned), 'utf8');
    return lockfilePath;
  }

  const pruned = pruneYarnLockEntry(rawLockfile, packageName);
  io.writeFileFn(lockfilePath, pruned, 'utf8');
  return lockfilePath;
}

/**
 * Orchestrates the full version-swap: detect the package manager, merge the
 * override into package.json, and surgically prune the matching lockfile
 * entry if a lockfile exists.
 *
 * @param {InjectOverrideOptions} options
 * @returns {{ pm: PackageManager, packageJsonPath: string, lockfilePath: string | null }}
 */
export function injectOverride(options) {
  const { appDir, packageName, versionSpec, readFileFn, writeFileFn, existsFn } = options;
  const pm = options.pm ?? detectPackageManager(appDir, existsFn);

  const packageJsonPath = `${appDir}/package.json`;
  const packageJsonObj = JSON.parse(readFileFn(packageJsonPath, 'utf8'));
  const mergedPackageJson = mergeOverrideIntoPackageJson(
    packageJsonObj,
    pm,
    packageName,
    versionSpec,
  );
  writeFileFn(packageJsonPath, `${JSON.stringify(mergedPackageJson, null, 2)}\n`, 'utf8');

  const lockfileName = getLockfileName(pm, appDir, existsFn);
  const lockfilePath = `${appDir}/${lockfileName}`;
  const prunedPath = pruneLockfileInPlace(pm, lockfilePath, packageName, options);

  return { pm, packageJsonPath, lockfilePath: prunedPath };
}

/**
 * Minimal manual parser for `--app`, `--package`, `--version`, `--pm`.
 *
 * @param {string[]} argv — e.g. process.argv.slice(2)
 * @returns {{ app: string, package: string, version: string, pm?: PackageManager }}
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

  if (!flags['app'] || !flags['package'] || !flags['version']) {
    throw new Error(
      'Usage: inject-override.js --app <dir> --package <name> --version <spec> [--pm npm|pnpm|yarn]',
    );
  }

  return {
    app: flags['app'],
    package: flags['package'],
    version: flags['version'],
    pm: /** @type {PackageManager | undefined} */ (flags['pm']),
  };
}

// ---------------------------------------------------------------------------
// Entry point — only runs when this file is executed directly.
// Guard uses import.meta.url vs process.argv[1] for cross-platform ESM safety.
// ---------------------------------------------------------------------------
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';

const thisFile = fileURLToPath(import.meta.url);
const calledFile = process.argv[1];

if (thisFile === calledFile) {
  const { app, package: packageName, version, pm } = parseArgs(process.argv.slice(2));

  const result = injectOverride({
    appDir: app,
    packageName,
    versionSpec: version,
    pm,
    readFileFn: (path, encoding) => readFileSync(path, encoding),
    writeFileFn: (path, content, encoding) => writeFileSync(path, content, encoding),
    existsFn: (path) => existsSync(path),
    yamlParse,
    yamlStringify,
  });

  process.stdout.write(
    `Injected override for ${packageName}@${version} via ${result.pm} into ${result.packageJsonPath}` +
      (result.lockfilePath
        ? ` (pruned ${result.lockfilePath})\n`
        : ' (no lockfile found, skipped pruning)\n'),
  );
}
