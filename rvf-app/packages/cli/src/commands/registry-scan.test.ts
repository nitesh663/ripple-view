import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { registryScanCommand } from './registry-scan.js';

// Real temp dirs, no mocks (G13) — mirrors the bundle.test.ts convention.

let root: string;
let workspaceFile: string;

function writePackageJson(dir: string, contents: Record<string, unknown>): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify(contents));
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'rv-cli-registry-scan-'));

  workspaceFile = join(root, 'rippleview.workspace.yaml');
  writeFileSync(
    workspaceFile,
    'version: "1"\nname: fixture-workspace\npackages:\n  - "@enterprise/widget"\n',
  );

  writePackageJson(join(root, 'libraries/lib-ng15/widget'), {
    name: '@enterprise/widget',
    version: '15.0.0',
    peerDependencies: { '@angular/core': '^15.2.0' },
  });
  writePackageJson(join(root, 'apps/ng-15/orders-app'), {
    name: 'orders-app',
    dependencies: { '@angular/core': '^15.2.0', '@enterprise/widget': '15.0.0' },
  });
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('AC-1: registryScanCommand produces registry.json from a real workspace', () => {
  it('exits 0 and writes a registry.json matching the scan, defaulting roots to the workspace directory', async () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'rv-cli-registry-out-'));
    const result = await registryScanCommand({ workspace: workspaceFile, output: outputDir });

    expect(result.exitCode).toBe(0);
    expect(result.registry?.angular?.['15']?.['@enterprise/widget']).toEqual({
      latest: '15.0.0',
      consumers: { 'orders-app': '15.0.0' },
    });

    const written = JSON.parse(readFileSync(join(outputDir, 'registry.json'), 'utf8'));
    expect(written).toEqual(result.registry);

    rmSync(outputDir, { recursive: true, force: true });
  });

  it('mode "nightly" additionally writes a timestamped snapshot alongside registry.json', async () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'rv-cli-registry-out-'));
    const result = await registryScanCommand({
      workspace: workspaceFile,
      output: outputDir,
      mode: 'nightly',
    });
    expect(result.exitCode).toBe(0);

    const files = readdirSync(outputDir);
    const snapshot = files.find((f) => /^registry\..*\.json$/.test(f) && f !== 'registry.json');
    expect(snapshot).toBeDefined();
    expect(existsSync(join(outputDir, 'registry.json'))).toBe(true);

    rmSync(outputDir, { recursive: true, force: true });
  });

  it('returns exitCode 1 (never throws) when the workspace file does not exist', async () => {
    const result = await registryScanCommand({ workspace: join(root, 'does-not-exist.yaml') });
    expect(result.exitCode).toBe(1);
    expect(result.registry).toBeUndefined();
  });
});
