// scrub.ts — pure, no-I/O exclusion/secret-matching rules for  bundling.
// G18: secrets must never be committed or logged; the safest scrub is to
// never include the file's bytes in the archive at all.

import { basename, sep } from 'node:path';

/** Directory names excluded by exact path-segment match (not substring). */
export const DEFAULT_EXCLUDE_DIRS = ['node_modules', '.git', 'dist'];

/**
 * Basename patterns treated as secret-bearing and excluded from the archive.
 * Glob-ish: a leading '*' matches any prefix; otherwise it's an exact
 * basename or an exact-prefix-with-dot match (e.g. '.env.*').
 */
export const DEFAULT_SECRET_FILE_PATTERNS = ['.env', '.env.*', '.npmrc', '*.pem', '*.key'];

/**
 * True if any path segment of `relPath` exactly matches a name in
 * DEFAULT_EXCLUDE_DIRS. Uses exact segment equality so `node_modules_backup`
 * is NOT excluded — only a literal `node_modules` segment is.
 */
export function shouldExcludePath(relPath: string): boolean {
  const segments = relPath.split(/[\\/]/).filter((s) => s.length > 0);
  return segments.some((segment) => DEFAULT_EXCLUDE_DIRS.includes(segment));
}

/**
 * True if the basename of `relPath` matches one of DEFAULT_SECRET_FILE_PATTERNS.
 */
export function shouldScrubFile(relPath: string): boolean {
  const name = basename(relPath.split(sep).join('/'));
  return DEFAULT_SECRET_FILE_PATTERNS.some((pattern) => matchesPattern(name, pattern));
}

function matchesPattern(name: string, pattern: string): boolean {
  if (pattern === name) {
    return true;
  }
  if (pattern.startsWith('*')) {
    return name.endsWith(pattern.slice(1));
  }
  if (pattern.endsWith('*')) {
    return name.startsWith(pattern.slice(0, -1));
  }
  return false;
}
