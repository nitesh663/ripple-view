import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ScannedPackage } from './types.js';

// ── Directory exclusions ─────────────────────────────────────────────────────
// Never descend into dependency/build output — only source-of-truth
// package.json files matter for the registry (AC: "repos/lockfiles", a
// static scan of what's checked in / installed, not build artifacts).

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'out-tsc',
  '.angular',
  '.git',
  '.next',
  'coverage',
]);

/**
 * Recursively find every `package.json` under `root`, skipping dependency
 * and build-output directories. Returns absolute paths.
 */
export function findPackageJsonFiles(root: string): string[] {
  const found: string[] = [];

  function walk(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      let stats;
      try {
        stats = statSync(fullPath);
      } catch {
        continue;
      }
      if (stats.isDirectory()) {
        if (SKIP_DIRS.has(entry)) {
          continue;
        }
        walk(fullPath);
      } else if (entry === 'package.json') {
        found.push(fullPath);
      }
    }
  }

  walk(root);
  return found;
}

/** Parse one package.json file into a ScannedPackage. Returns null on parse failure. */
export function readScannedPackage(path: string): ScannedPackage | null {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }
  const obj = parsed as Record<string, unknown>;

  const asStringRecord = (value: unknown): Record<string, string> => {
    if (typeof value !== 'object' || value === null) {
      return {};
    }
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (typeof val === 'string') {
        result[key] = val;
      }
    }
    return result;
  };

  const dependencies = asStringRecord(obj['dependencies']);
  const devDependencies = asStringRecord(obj['devDependencies']);
  const peerDependencies = asStringRecord(obj['peerDependencies']);

  return {
    path,
    name: typeof obj['name'] === 'string' ? obj['name'] : undefined,
    version: typeof obj['version'] === 'string' ? obj['version'] : undefined,
    dependencies,
    allDeclaredDeps: { ...peerDependencies, ...devDependencies, ...dependencies },
  };
}
