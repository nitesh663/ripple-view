/**
 * override-fields.mjs — package-manager detection + override-field shaping
 * (split out of inject-override.js to respect the 200-line/file
 * limit and keep single responsibility: this file only knows how to
 * recognize a package manager and shape its override field; it has no
 * knowledge of lockfile pruning or file I/O orchestration).
 */

/**
 * @typedef {'npm' | 'pnpm' | 'yarn'} PackageManager
 */

/**
 * Detects the consumer's package manager by lockfile presence.
 * npm-shrinkwrap.json takes priority over package-lock.json because npm
 * itself prefers shrinkwrap when both exist.
 *
 * @param {string} cwd
 * @param {(path: string) => boolean} existsFn
 * @returns {PackageManager}
 */
export function detectPackageManager(cwd, existsFn) {
  if (existsFn(`${cwd}/npm-shrinkwrap.json`)) {
    return 'npm';
  }
  if (existsFn(`${cwd}/package-lock.json`)) {
    return 'npm';
  }
  if (existsFn(`${cwd}/pnpm-lock.yaml`)) {
    return 'pnpm';
  }
  if (existsFn(`${cwd}/yarn.lock`)) {
    return 'yarn';
  }
  throw new Error(
    `Could not detect a package manager in ${cwd} (no npm-shrinkwrap.json, package-lock.json, pnpm-lock.yaml, or yarn.lock found). Pass --pm explicitly.`,
  );
}

/**
 * Returns the lockfile filename to read/prune for the given package manager.
 *
 * @param {PackageManager} pm
 * @param {string} cwd
 * @param {(path: string) => boolean} existsFn
 * @returns {string} filename, relative to cwd
 */
export function getLockfileName(pm, cwd, existsFn) {
  if (pm === 'npm') {
    return existsFn(`${cwd}/npm-shrinkwrap.json`) ? 'npm-shrinkwrap.json' : 'package-lock.json';
  }
  if (pm === 'pnpm') {
    return 'pnpm-lock.yaml';
  }
  return 'yarn.lock';
}

/**
 * Builds the partial package.json fragment carrying the override for the
 * given package manager.
 *
 * @param {PackageManager} pm
 * @param {string} packageName
 * @param {string} versionSpec — opaque: semver, `file:...`, `npm:...`, etc.
 * @returns {Record<string, unknown>}
 */
export function buildOverrideField(pm, packageName, versionSpec) {
  if (pm === 'npm') {
    return { overrides: { [packageName]: versionSpec } };
  }
  if (pm === 'pnpm') {
    return { pnpm: { overrides: { [packageName]: versionSpec } } };
  }
  return { resolutions: { [packageName]: versionSpec } };
}

/**
 * Deep-merges the override field into an existing package.json object,
 * preserving any pre-existing overrides for OTHER packages.
 *
 * @param {Record<string, unknown>} packageJsonObj
 * @param {PackageManager} pm
 * @param {string} packageName
 * @param {string} versionSpec
 * @returns {Record<string, unknown>} a new package.json object
 */
export function mergeOverrideIntoPackageJson(packageJsonObj, pm, packageName, versionSpec) {
  const merged = { ...packageJsonObj };

  if (pm === 'npm') {
    const existing = /** @type {Record<string, unknown>} */ (merged['overrides'] ?? {});
    merged['overrides'] = { ...existing, [packageName]: versionSpec };
    return merged;
  }

  if (pm === 'pnpm') {
    const existingPnpm = /** @type {Record<string, unknown>} */ (merged['pnpm'] ?? {});
    const existingOverrides = /** @type {Record<string, unknown>} */ (
      existingPnpm['overrides'] ?? {}
    );
    merged['pnpm'] = {
      ...existingPnpm,
      overrides: { ...existingOverrides, [packageName]: versionSpec },
    };
    return merged;
  }

  const existingResolutions = /** @type {Record<string, unknown>} */ (merged['resolutions'] ?? {});
  merged['resolutions'] = { ...existingResolutions, [packageName]: versionSpec };
  return merged;
}
