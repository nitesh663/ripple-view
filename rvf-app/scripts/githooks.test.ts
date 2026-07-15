/**
 * Unit tests for  acceptance criteria.
 *
 * AC1: Given husky + commitlint, a commit message NOT in the format
 *      `<STORY-ID>: <type>(<scope>): <description>` is rejected.
 * AC2: Given lint-staged on pre-commit, staged files are linted/formatted
 *      before commit.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// AC1: commitlint — story-prefixed Conventional Commits
// ---------------------------------------------------------------------------
describe('AC1: commitlint — story-prefixed Conventional Commits', () => {
  it('.husky/commit-msg exists', () => {
    expect(existsSync(path.join(repoRoot, '.husky', 'commit-msg'))).toBe(true);
  });

  it('.husky/commit-msg is executable', () => {
    // Windows NTFS has no execute bits; skip the check on win32.
    if (process.platform === 'win32') return;
    expect(statSync(path.join(repoRoot, '.husky', 'commit-msg')).mode & 0o111).toBeTruthy();
  });

  it('commitlint.config.mjs exists', () => {
    expect(existsSync(path.join(repoRoot, 'commitlint.config.mjs'))).toBe(true);
  });

  it('commitlint config contains "story-id-required" rule', () => {
    const config = readFileSync(path.join(repoRoot, 'commitlint.config.mjs'), 'utf8');
    expect(config).toContain('story-id-required');
  });

  it('package.json has "prepare" script containing "husky"', () => {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['prepare']).toContain('husky');
  });

  it('valid story-prefixed message passes commitlint', () => {
    // Use input: instead of echo | to avoid Windows cmd.exe wrapping in literal quotes.
    expect(() =>
      execSync('npx commitlint', {
        cwd: repoRoot,
        input: 'PROJ-123: feat(foundation): add git hooks\n',
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });

  it('message without story prefix is rejected by commitlint', () => {
    expect(() =>
      execSync('npx commitlint', {
        cwd: repoRoot,
        input: 'feat: add feature\n',
        stdio: 'pipe',
      }),
    ).toThrow();
  });

  it('plain bad commit message is rejected by commitlint', () => {
    expect(() =>
      execSync('npx commitlint', {
        cwd: repoRoot,
        input: 'bad commit message\n',
        stdio: 'pipe',
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// AC2: lint-staged — pre-commit staged file linting
// ---------------------------------------------------------------------------
describe('AC2: lint-staged — pre-commit staged file linting', () => {
  it('.husky/pre-commit exists', () => {
    expect(existsSync(path.join(repoRoot, '.husky', 'pre-commit'))).toBe(true);
  });

  it('.husky/pre-commit is executable', () => {
    // Windows NTFS has no execute bits; skip the check on win32.
    if (process.platform === 'win32') return;
    expect(statSync(path.join(repoRoot, '.husky', 'pre-commit')).mode & 0o111).toBeTruthy();
  });

  it('package.json has "lint-staged" key', () => {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    expect(pkg['lint-staged']).toBeDefined();
  });

  it('lint-staged config covers TypeScript/JavaScript files', () => {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    const lintStaged = pkg['lint-staged'] as Record<string, unknown>;
    expect(Object.keys(lintStaged).some((k) => k.includes('ts'))).toBe(true);
  });

  it('lint-staged config covers JSON/Markdown/YAML files', () => {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    const lintStaged = pkg['lint-staged'] as Record<string, unknown>;
    expect(Object.keys(lintStaged).some((k) => k.includes('json') || k.includes('md'))).toBe(true);
  });
});
