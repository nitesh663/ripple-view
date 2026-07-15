/**
 * prunePnpmLock.mjs — surgical pnpm lockfile entry removal ()
 *
 * Same problem as pruneNpmLock.mjs: an override injected into package.json
 * (`pnpm.overrides`) does not by itself invalidate the pinned resolution in
 * pnpm-lock.yaml, so a `pnpm install --frozen-lockfile` can still fail or
 * resolve the old version. Only the target package's entries must be
 * removed; every other package's pin must survive untouched.
 *
 * Version-tolerant via structural convention, NOT a `lockfileVersion`
 * check: this is a fully generic recursive key-walker over the whole
 * parsed YAML structure. It relies on naming conventions that have held
 * across pnpm lockfile versions:
 *   - `importers.*.dependencies` / `devDependencies` / `optionalDependencies`
 *     maps (and the pre-v6 root-level `dependencies`/`specifiers` maps) key
 *     entries by the BARE package name.
 *   - `packages:` / `snapshots:` registry maps key entries by
 *     `<name>@<version>` (lockfileVersion >= 6) or `/<name>/<version>`
 *     (pre-v6), optionally with a trailing peer-dep suffix in parentheses.
 * If a future pnpm lockfile version abandons both conventions, this walker
 * will no longer find matches for that version — it cannot promise
 * compatibility with a format that does not exist yet.
 *
 * One deliberate refinement on top of a fully naive "delete every bare-name
 * key anywhere" walk: a `packages:`/`snapshots:` entry's OWN internal
 * `dependencies` map (e.g. `react-dom@18.2.0(...)`'s `dependencies: { react:
 * '18.2.0' }`) records what version of `react` THAT entry resolved against —
 * it is metadata describing another package's entry, not a pin of `react`
 * itself. Deleting it would silently corrupt react-dom's own lockfile
 * record, which violates the "every other package's entry stays untouched"
 * invariant this whole mechanism exists to protect. So bare-name pruning is
 * suspended once the walker has descended inside a versioned entry; it
 * resumes for any further nested versioned entries (which always carry
 * their own bare-name dependency maps) and for top-level/importer maps that
 * are never nested inside a versioned entry.
 */

/**
 * @param {string} key
 * @param {string} packageName
 * @returns {boolean} true if `key` is the bare-name form used by importer maps
 */
function isExactNameKey(key, packageName) {
  return key === packageName;
}

/**
 * @param {string} key
 * @param {string} packageName
 * @returns {boolean} true if `key` is the `name@version[...]` form (>=v6) or
 *   the `/name/version` form (pre-v6) used by the `packages:`/`snapshots:`
 *   registry maps
 */
function isVersionedKey(key, packageName) {
  const atPrefix = `${packageName}@`;
  const slashPrefix = `/${packageName}/`;
  return key.startsWith(atPrefix) || key.startsWith(`/${atPrefix}`) || key.startsWith(slashPrefix);
}

/**
 * Generic (package-name-independent) detector for whether a key has the
 * SHAPE of a `packages:`/`snapshots:` versioned entry — i.e. a bare or
 * scoped package name followed by `@<version>` (>=v6, optionally
 * peer-suffixed), or the pre-v6 `/<name>/<version>` form. Used to decide
 * whether the walker is about to descend INTO a versioned package record,
 * regardless of which specific package it is.
 *
 * @param {string} key
 * @returns {boolean}
 */
function looksLikeVersionedEntryKey(key) {
  // >=v6 form: optionally scoped name, then "@", then a version that starts
  // with a digit (so "@scope/name@1.0.0" matches but a bare scope alone or
  // a non-version suffix does not).
  const atVersionPattern = /^\/?@?[^@/]+(\/[^@/]+)?@\d/;
  // pre-v6 form: "/name/version" or "/@scope/name/version", version starts
  // with a digit.
  const slashVersionPattern = /^\/@?[^@/]+(\/[^@/]+)?\/\d/;
  return atVersionPattern.test(key) || slashVersionPattern.test(key);
}

/**
 * Recursively walks an arbitrary parsed-YAML value, deleting any object key
 * that matches `packageName` per the structural conventions above. Returns
 * a new value; the input is never mutated.
 *
 * @param {unknown} node
 * @param {string} packageName
 * @param {boolean} insideVersionedEntry — true once the walk has descended
 *   inside a `packages:`/`snapshots:`-style versioned entry; suspends
 *   bare-name (exact-key) pruning so a package's own internal dependency
 *   metadata is never mistaken for a top-level pin of that bare name
 * @returns {unknown}
 */
function walk(node, packageName, insideVersionedEntry) {
  if (Array.isArray(node)) {
    return node.map((item) => walk(item, packageName, insideVersionedEntry));
  }

  if (node !== null && typeof node === 'object') {
    /** @type {Record<string, unknown>} */
    const pruned = {};
    for (const [key, value] of Object.entries(node)) {
      const isVersioned = isVersionedKey(key, packageName);
      const isBareNameMatch = !insideVersionedEntry && isExactNameKey(key, packageName);

      if (isVersioned || isBareNameMatch) {
        continue;
      }

      const childInsideVersionedEntry = insideVersionedEntry || looksLikeVersionedEntryKey(key);
      pruned[key] = walk(value, packageName, childInsideVersionedEntry);
    }
    return pruned;
  }

  return node;
}

/**
 * Returns a new pnpm-lock object with every entry for `packageName` removed,
 * across `importers.*.dependencies`-style bare-name maps and
 * `packages:`/`snapshots:`-style `name@version` maps, at any nesting depth.
 * Every other package's entry is left deeply equal/untouched.
 *
 * @param {Record<string, unknown>} lockfileObj — already YAML-parsed pnpm-lock content
 * @param {string} packageName
 * @returns {Record<string, unknown>} a new lockfile object (input is not mutated)
 */
export function prunePnpmLockEntry(lockfileObj, packageName) {
  return /** @type {Record<string, unknown>} */ (walk(lockfileObj, packageName, false));
}
