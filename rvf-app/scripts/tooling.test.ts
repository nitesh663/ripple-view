/**
 * Unit tests for  acceptance criteria.
 *
 * AC1: tsconfig.base.json exists with all required strict compiler options.
 * AC2: ESLint passes on a clean fixture and fails on an `any`-violation fixture;
 *      .prettierrc.json and .editorconfig exist.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// AC1: tsconfig.base.json has all required strict compiler options
// ---------------------------------------------------------------------------
describe('AC1: tsconfig.base.json strict compiler options', () => {
  const tsconfigPath = path.join(ROOT, 'tsconfig.base.json');

  it('tsconfig.base.json exists', () => {
    expect(existsSync(tsconfigPath)).toBe(true);
  });

  let compilerOptions: Record<string, unknown> = {};

  if (existsSync(tsconfigPath)) {
    const parsed = JSON.parse(readFileSync(tsconfigPath, 'utf8')) as {
      compilerOptions: Record<string, unknown>;
    };
    compilerOptions = parsed.compilerOptions;
  }

  it('strict === true', () => {
    expect(compilerOptions['strict']).toBe(true);
  });

  it('noUncheckedIndexedAccess === true', () => {
    expect(compilerOptions['noUncheckedIndexedAccess']).toBe(true);
  });

  it('exactOptionalPropertyTypes === true', () => {
    expect(compilerOptions['exactOptionalPropertyTypes']).toBe(true);
  });

  it('noImplicitOverride === true', () => {
    expect(compilerOptions['noImplicitOverride']).toBe(true);
  });

  it('noFallthroughCasesInSwitch === true', () => {
    expect(compilerOptions['noFallthroughCasesInSwitch']).toBe(true);
  });

  it('verbatimModuleSyntax === true', () => {
    expect(compilerOptions['verbatimModuleSyntax']).toBe(true);
  });

  it('isolatedModules === true', () => {
    expect(compilerOptions['isolatedModules']).toBe(true);
  });

  it('declaration === true', () => {
    expect(compilerOptions['declaration']).toBe(true);
  });

  it('sourceMap === true', () => {
    expect(compilerOptions['sourceMap']).toBe(true);
  });

  it("moduleResolution === 'Bundler'", () => {
    expect(compilerOptions['moduleResolution']).toBe('Bundler');
  });
});

// ---------------------------------------------------------------------------
// AC2: ESLint fails on any-violation.fixture.ts and passes on clean.fixture.ts
// ---------------------------------------------------------------------------
describe('AC2: ESLint correctly flags violations and passes clean code', () => {
  const eslintBin = path.join(ROOT, 'node_modules', 'eslint', 'bin', 'eslint.js');

  it('ESLint exits non-zero on any-violation.fixture.ts (banned `any`)', () => {
    // --no-ignore bypasses the eslint.config.mjs ignore pattern so we can
    // directly verify that the rule fires on the seeded violation.
    expect(() =>
      execSync(`node "${eslintBin}" --no-ignore scripts/fixtures/any-violation.fixture.ts`, {
        cwd: ROOT,
        stdio: 'pipe',
      }),
    ).toThrow();
  });

  it('ESLint exits zero on clean.fixture.ts (no violations)', () => {
    expect(() =>
      execSync(`node "${eslintBin}" scripts/fixtures/clean.fixture.ts`, {
        cwd: ROOT,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// AC2: Supporting file-existence assertions for Prettier and EditorConfig
// ---------------------------------------------------------------------------
describe('AC2: .prettierrc.json and .editorconfig exist', () => {
  it('.prettierrc.json exists', () => {
    expect(existsSync(path.join(ROOT, '.prettierrc.json'))).toBe(true);
  });

  it('.editorconfig exists', () => {
    expect(existsSync(path.join(ROOT, '.editorconfig'))).toBe(true);
  });
});
