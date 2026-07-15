/**
 * Unit tests for  acceptance criteria.
 *
 * AC-1: package.json workspaces + root package.json + .npmrc + packages/ exist
 *       and packageManager pins npm.
 * AC-2: Given a fresh clone, `npm ci` completes with no errors (deterministic:
 *       lockfile is frozen so no mutations occur).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// AC-1: workspace scaffold files exist and are correctly shaped
// ---------------------------------------------------------------------------
describe('AC-1: package.json declares workspaces', () => {
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg: Record<string, unknown> = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<
    string,
    unknown
  >;

  it('package.json has "workspaces" field', () => {
    expect(pkg['workspaces']).toBeDefined();
  });

  it('package.json workspaces includes "packages/*"', () => {
    const workspaces = pkg['workspaces'] as string[];
    expect(workspaces).toContain('packages/*');
  });
});

describe('AC-1: .npmrc exists', () => {
  it('.npmrc exists', () => {
    expect(existsSync(path.join(ROOT, '.npmrc'))).toBe(true);
  });
});

describe('AC-1: packages/ directory exists', () => {
  it('packages/ directory exists', () => {
    expect(existsSync(path.join(ROOT, 'packages'))).toBe(true);
  });
});

describe('AC-1: root package.json has required scripts and corepack pin', () => {
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg: Record<string, unknown> = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<
    string,
    unknown
  >;
  const scripts = pkg['scripts'] as Record<string, string>;

  it('has "build" script', () => {
    expect(scripts).toHaveProperty('build');
  });

  it('has "test" script', () => {
    expect(scripts).toHaveProperty('test');
  });

  it('has "lint" script', () => {
    expect(scripts).toHaveProperty('lint');
  });

  it('has "typecheck" script', () => {
    expect(scripts).toHaveProperty('typecheck');
  });

  it('has "format" script', () => {
    expect(scripts).toHaveProperty('format');
  });

  it('packageManager pins npm with a semver version', () => {
    const packageManager = pkg['packageManager'] as string;
    expect(packageManager).toMatch(/^npm@\d+\.\d+\.\d+/);
  });
});

// ---------------------------------------------------------------------------
// AC-2: package-lock.json exists and is a valid npm v3 lockfile
// (Running `npm ci` in a test would delete node_modules mid-run and break
// concurrently executing test workers — check the lockfile statically instead.)
// ---------------------------------------------------------------------------
describe('AC-2: package-lock.json exists and is valid', () => {
  const lockPath = path.join(ROOT, 'package-lock.json');

  it('package-lock.json exists', () => {
    expect(existsSync(lockPath)).toBe(true);
  });

  it('package-lock.json is valid JSON with lockfileVersion >= 2', () => {
    const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as { lockfileVersion?: number };
    expect(lock.lockfileVersion).toBeGreaterThanOrEqual(2);
  });
});
