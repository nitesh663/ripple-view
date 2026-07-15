/**
 * Unit tests for  acceptance criteria.
 *
 * AC1: Given changesets, when `pnpm changeset` runs, a changeset is recorded
 *      and a version dry-run computes bumps/changelog.
 * AC2: Given api-extractor baseline config, a public-API report is generated
 *      for a package.
 *
 * All tests are pure file reads + JSON.parse — no process spawning (G13 determinism).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// AC1: changesets — version bump and changelog tooling
// ---------------------------------------------------------------------------
describe('AC1: changesets — version bump and changelog tooling', () => {
  const changesetConfigPath = path.join(repoRoot, '.changeset', 'config.json');
  const pkgPath = path.join(repoRoot, 'package.json');

  it('.changeset/config.json exists', () => {
    expect(existsSync(changesetConfigPath)).toBe(true);
  });

  it('changeset config is valid JSON', () => {
    const raw = readFileSync(changesetConfigPath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('config has changelog field', () => {
    const config = JSON.parse(readFileSync(changesetConfigPath, 'utf8')) as Record<string, unknown>;
    expect(config['changelog']).toBeDefined();
  });

  it('config has access field', () => {
    const config = JSON.parse(readFileSync(changesetConfigPath, 'utf8')) as Record<string, unknown>;
    expect(config['access']).toBeDefined();
  });

  it('config baseBranch is "main"', () => {
    const config = JSON.parse(readFileSync(changesetConfigPath, 'utf8')) as Record<string, unknown>;
    expect(config['baseBranch']).toBe('main');
  });

  it('package.json has changeset script', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['changeset']).toBeDefined();
  });

  it('package.json has version script', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['version']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// AC2: api-extractor — public-API surface baseline config
// ---------------------------------------------------------------------------
describe('AC2: api-extractor — public-API surface baseline config', () => {
  const apiExtractorPath = path.join(repoRoot, 'api-extractor.base.json');
  const pkgPath = path.join(repoRoot, 'package.json');

  it('api-extractor.base.json exists', () => {
    expect(existsSync(apiExtractorPath)).toBe(true);
  });

  it('config is valid JSON', () => {
    const raw = readFileSync(apiExtractorPath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('config $schema contains "api-extractor"', () => {
    const config = JSON.parse(readFileSync(apiExtractorPath, 'utf8')) as Record<string, unknown>;
    expect(config['$schema']).toContain('api-extractor');
  });

  it('config has mainEntryPointFilePath', () => {
    const config = JSON.parse(readFileSync(apiExtractorPath, 'utf8')) as Record<string, unknown>;
    expect(config['mainEntryPointFilePath']).toBeDefined();
  });

  it('apiReport.enabled is true', () => {
    const config = JSON.parse(readFileSync(apiExtractorPath, 'utf8')) as {
      apiReport: { enabled: boolean };
    };
    expect(config.apiReport.enabled).toBe(true);
  });

  it('@microsoft/api-extractor is in devDependencies of package.json', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      devDependencies: Record<string, string>;
    };
    expect(pkg.devDependencies['@microsoft/api-extractor']).toBeDefined();
  });
});
