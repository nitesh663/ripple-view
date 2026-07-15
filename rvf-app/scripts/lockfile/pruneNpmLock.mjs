/**
 * pruneNpmLock.mjs — surgical npm lockfile entry removal ()
 *
 * After injecting a version override into package.json, the lockfile still
 * pins the OLD resolved URL + integrity hash for the overridden package.
 * Installing with `npm ci` (frozen mode) then fails or produces an
 * EINTEGRITY error. The fix is NOT to delete the whole lockfile (that would
 * let every other package drift) — only the target package's entries must
 * be removed so npm re-resolves just that one transitively.
 *
 * Version-tolerant via structural convention: npm lockfileVersion 1 uses a
 * nested `dependencies` tree; lockfileVersion 2/3 use a flat `packages` map
 * keyed by node_modules path (lockfileVersion 2 also keeps a `dependencies`
 * tree for backward compatibility, so both structures can co-exist and must
 * both be pruned to stay internally consistent). This file checks for the
 * PRESENCE of each structure rather than reading `lockfileVersion`, so it
 * keeps working if npm ships a new lockfileVersion that reuses one of these
 * two shapes. It cannot promise compatibility with a future lockfile format
 * that abandons both conventions — that would need a new prune function.
 */

/**
 * @typedef {Record<string, unknown>} JsonObject
 */

/**
 * Removes every `packages` map entry for `packageName`, at any nesting
 * depth, from a flat (lockfileVersion 2/3 style) packages map. Matches the
 * exact node_modules path segment only — never a substring — so pruning
 * "react" never touches "react-dom".
 *
 * @param {JsonObject} packages — the lockfile's `packages` map
 * @param {string} packageName
 * @returns {JsonObject} a new packages map with matching keys removed
 */
function prunePackagesMap(packages, packageName) {
  const suffix = `/node_modules/${packageName}`;
  const topLevel = `node_modules/${packageName}`;
  const pruned = {};

  for (const [key, value] of Object.entries(packages)) {
    const isMatch = key === topLevel || key.endsWith(suffix);
    if (!isMatch) {
      pruned[key] = value;
    }
  }

  return pruned;
}

/**
 * Recursively removes any key exactly equal to `packageName` from a nested
 * `dependencies` tree (lockfileVersion 1 style), at any depth, without
 * mutating the input.
 *
 * @param {JsonObject} dependencies
 * @param {string} packageName
 * @returns {JsonObject} a new dependencies tree with matching keys removed
 */
function pruneDependenciesTree(dependencies, packageName) {
  const pruned = {};

  for (const [key, value] of Object.entries(dependencies)) {
    if (key === packageName) {
      continue;
    }

    if (value !== null && typeof value === 'object') {
      const entry = { ...value };
      const nested = entry['dependencies'];
      if (nested !== null && typeof nested === 'object') {
        entry['dependencies'] = pruneDependenciesTree(
          /** @type {JsonObject} */ (nested),
          packageName,
        );
      }
      pruned[key] = entry;
    } else {
      pruned[key] = value;
    }
  }

  return pruned;
}

/**
 * Returns a new npm lockfile object with every entry for `packageName`
 * removed, covering both the flat `packages` map and the nested
 * `dependencies` tree if present. Every other package's entry is left
 * byte-for-byte unchanged.
 *
 * @param {JsonObject} lockfileObj — already JSON.parse'd lockfile content
 * @param {string} packageName
 * @returns {JsonObject} a new lockfile object (input is not mutated)
 */
export function pruneNpmLockEntry(lockfileObj, packageName) {
  const result = { ...lockfileObj };

  const packages = result['packages'];
  if (packages !== null && typeof packages === 'object') {
    result['packages'] = prunePackagesMap(/** @type {JsonObject} */ (packages), packageName);
  }

  const dependencies = result['dependencies'];
  if (dependencies !== null && typeof dependencies === 'object') {
    result['dependencies'] = pruneDependenciesTree(
      /** @type {JsonObject} */ (dependencies),
      packageName,
    );
  }

  return result;
}
