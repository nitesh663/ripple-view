import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { registryImpactSelectCommand } from './registry-impact-select.js';

// Real temp dirs, no mocks (G13) — mirrors the bundle.test.ts convention.

let root: string;
let registryFile: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'rv-cli-impact-select-'));
  registryFile = join(root, 'registry.json');
  writeFileSync(
    registryFile,
    JSON.stringify({
      angular: {
        '15': {
          '@enterprise/widget': {
            latest: '15.2.0',
            consumers: { 'orders-app': '15.0.0', 'billing-app': '15.0.0' },
          },
        },
      },
    }),
  );
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('AC-1/AC-2: registryImpactSelectCommand selects consumers + writes impact.json', () => {
  it('exits 0, returns the selected consumers with version + base-test version, and writes impact.json', async () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'rv-cli-impact-out-'));
    const result = await registryImpactSelectCommand({
      registry: registryFile,
      framework: 'angular',
      generation: '15',
      package: '@enterprise/widget',
      output: outputDir,
    });

    expect(result.exitCode).toBe(0);
    expect(result.selected).toEqual([
      { appName: 'billing-app', libraryVersion: '15.0.0', baseTestVersion: '15.0.0' },
      { appName: 'orders-app', libraryVersion: '15.0.0', baseTestVersion: '15.0.0' },
    ]);

    const written = JSON.parse(readFileSync(join(outputDir, 'impact.json'), 'utf8'));
    expect(written).toEqual(result.selected);

    rmSync(outputDir, { recursive: true, force: true });
  });

  it('returns an empty selection (exit 0, not an error) for a package/bucket with no consumers', async () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'rv-cli-impact-out-'));
    const result = await registryImpactSelectCommand({
      registry: registryFile,
      framework: 'angular',
      generation: '18',
      package: '@enterprise/widget',
      output: outputDir,
    });

    expect(result.exitCode).toBe(0);
    expect(result.selected).toEqual([]);

    rmSync(outputDir, { recursive: true, force: true });
  });

  it('returns exitCode 1 (never throws) when the registry.json file does not exist', async () => {
    const result = await registryImpactSelectCommand({
      registry: join(root, 'does-not-exist.json'),
      framework: 'angular',
      generation: '15',
      package: '@enterprise/widget',
    });
    expect(result.exitCode).toBe(1);
    expect(result.selected).toBeUndefined();
  });
});
