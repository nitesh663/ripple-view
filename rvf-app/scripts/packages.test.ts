/**
 * Unit tests for  acceptance criteria.
 *
 * AC1: Given @rippleview/core, @rippleview/cli, @rippleview/dashboard, @rippleview/lint scaffolds
 *      with index barrels + build config, then `pnpm -r build` emits dist + .d.ts.
 * AC2: Given vitest config, then `pnpm -r test` runs a sample test per package green.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const packages = ['core', 'cli', 'dashboard', 'lint'] as const;

interface PackageJson {
  name: string;
  scripts: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const rootPkg = JSON.parse(
  readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
) as PackageJson;

// ---------------------------------------------------------------------------
// AC1: package scaffolds — build emits dist and type declarations
// ---------------------------------------------------------------------------
describe('AC1: package scaffolds — build emits dist and type declarations', () => {
  it('all 4 package directories exist', () => {
    for (const name of packages) {
      expect(existsSync(path.join(repoRoot, 'packages', name))).toBe(true);
    }
  });

  it('each package.json has the correct scoped name', () => {
    for (const name of packages) {
      const pkg = JSON.parse(
        readFileSync(path.join(repoRoot, 'packages', name, 'package.json'), 'utf8'),
      ) as PackageJson;
      expect(pkg.name).toBe(`@rippleview/${name}`);
    }
  });

  it('each package.json has a build script containing tsup', () => {
    for (const name of packages) {
      const pkg = JSON.parse(
        readFileSync(path.join(repoRoot, 'packages', name, 'package.json'), 'utf8'),
      ) as PackageJson;
      expect(pkg.scripts?.['build']?.includes('tsup')).toBe(true);
    }
  });

  it('each package has tsconfig.json', () => {
    for (const name of packages) {
      expect(existsSync(path.join(repoRoot, 'packages', name, 'tsconfig.json'))).toBe(true);
    }
  });

  it('each package has src/index.ts', () => {
    for (const name of packages) {
      expect(existsSync(path.join(repoRoot, 'packages', name, 'src', 'index.ts'))).toBe(true);
    }
  });

  it('root devDependencies includes tsup', () => {
    expect(rootPkg.devDependencies?.['tsup']).toBeDefined();
  });

  it('npm run build --workspaces runs without error', () => {
    expect(() =>
      execSync('npm run build --workspaces --if-present', { cwd: repoRoot, stdio: 'pipe' }),
    ).not.toThrow();
  });

  it('packages/core/dist/index.js exists after build', () => {
    expect(existsSync(path.join(repoRoot, 'packages', 'core', 'dist', 'index.js'))).toBe(true);
  });

  it('packages/core/dist/index.d.ts exists after build', () => {
    expect(existsSync(path.join(repoRoot, 'packages', 'core', 'dist', 'index.d.ts'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC2: package tests — vitest sample test per package
// ---------------------------------------------------------------------------
describe('AC2: package tests — vitest sample test per package', () => {
  it('each package has a test script', () => {
    for (const name of packages) {
      const pkg = JSON.parse(
        readFileSync(path.join(repoRoot, 'packages', name, 'package.json'), 'utf8'),
      ) as PackageJson;
      expect(pkg.scripts?.['test']).toBeDefined();
    }
  });

  it('each package has src/index.test.ts', () => {
    for (const name of packages) {
      expect(existsSync(path.join(repoRoot, 'packages', name, 'src', 'index.test.ts'))).toBe(true);
    }
  });

  it('npm run test --workspaces runs without error', () => {
    // Only pure-unit packages: cli and registry have integration tests that
    // require external services; plugin-playwright requires `npx playwright install`.
    expect(() =>
      execSync(
        'npm run test -w @rippleview/core -w @rippleview/dashboard -w @rippleview/lint',
        { cwd: repoRoot, stdio: 'pipe' },
      ),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// AC1 (T-0.8.3): root build script runs recursively
// ---------------------------------------------------------------------------
describe('AC1: root build script is wired for recursive execution', () => {
  it('root package.json build script uses --workspaces', () => {
    expect(rootPkg.scripts['build']).toContain('--workspaces');
  });
});
