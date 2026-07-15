/**
 * pruneYarnLock.mjs — surgical yarn.lock entry removal ()
 *
 * yarn.lock is a custom text block format, not JSON/YAML, so it cannot be
 * parsed/pruned/stringified the way the npm and pnpm lockfiles are. This
 * operates directly on the raw text: blocks are separated by a blank line,
 * and each block's header (the unindented line(s) before the first indented
 * line) lists one or more comma-separated descriptors such as
 * `"lodash@^4.0.0", "lodash@4.17.21":`.
 *
 * Version-tolerant via structural convention: this relies on the blank-line
 * block separator and the "unindented header, indented body" shape, which
 * has held across classic Yarn (v1) and Yarn Berry (v2+) lockfiles — not on
 * any declared lockfile version field. Yarn Berry adds a leading
 * `__metadata:` block, which is explicitly recognised and never matched as
 * a package descriptor.
 */

/**
 * Splits yarn.lock text into blocks, preserving the original blank-line
 * separation between them.
 *
 * @param {string} text
 * @returns {string[]} blocks, each still ending without a trailing blank line
 */
function splitIntoBlocks(text) {
  return text.split(/\n\n+/);
}

/**
 * Extracts the package name from a single descriptor like `name@range` or
 * `@scope/name@range`. The package name is everything before the LAST `@`
 * that separates name from range — for a scoped package the leading `@` is
 * part of the name, not a separator.
 *
 * @param {string} descriptor — e.g. `lodash@^4.0.0` or `@scope/name@^1.0.0`
 * @returns {string} the package name portion
 */
function extractPackageName(descriptor) {
  const trimmed = descriptor.trim().replace(/^"|"$/g, '');
  const lastAt = trimmed.lastIndexOf('@');

  if (lastAt <= 0) {
    // No separating "@" found (lastAt === 0 means it's only a scope marker
    // with no version range, which should not happen in a valid lockfile).
    return trimmed;
  }

  return trimmed.slice(0, lastAt);
}

/**
 * Returns the descriptor names declared in a block's header line(s) — the
 * unindented lines before the first indented (body) line, with the
 * trailing `:` stripped and split on top-level commas.
 *
 * @param {string} block
 * @returns {string[]} package names declared by this block's header
 */
function getBlockPackageNames(block) {
  const lines = block.split('\n');
  const headerLines = [];

  for (const line of lines) {
    if (line.length === 0) {
      continue;
    }
    const isIndented = line.startsWith(' ') || line.startsWith('\t');
    if (isIndented) {
      break;
    }
    headerLines.push(line);
  }

  const header = headerLines.join(' ').replace(/:$/, '');
  if (header.length === 0) {
    return [];
  }

  return header.split(',').map((descriptor) => extractPackageName(descriptor));
}

/**
 * @param {string} block
 * @returns {boolean} true if this is yarn Berry's `__metadata:` header block
 */
function isMetadataBlock(block) {
  return /^__metadata:/.test(block.trimStart());
}

/**
 * Returns yarn.lock text with every block describing `packageName` removed.
 * Every other block (including the Berry `__metadata:` header) is left
 * byte-for-byte unchanged, and blank-line separation is preserved.
 *
 * @param {string} lockfileText — raw yarn.lock file content
 * @param {string} packageName
 * @returns {string} the pruned yarn.lock text
 */
export function pruneYarnLockEntry(lockfileText, packageName) {
  const blocks = splitIntoBlocks(lockfileText);

  const kept = blocks.filter((block) => {
    if (isMetadataBlock(block)) {
      return true;
    }

    const names = getBlockPackageNames(block);
    const isMatch = names.includes(packageName);
    return !isMatch;
  });

  return kept.join('\n\n');
}
