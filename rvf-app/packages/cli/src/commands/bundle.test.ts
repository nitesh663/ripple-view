import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { bundleCommand } from './bundle.js';

// Real temp dirs — mirrors the existing FileResultStore.test.ts / cli.test.ts
// convention for fixture apps; no network, no subprocess (G13).

let fixtureRoot: string;
let appDir: string;

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'rv-cli-bundle-'));
  appDir = join(fixtureRoot, 'fixture-app');
  mkdirSync(join(appDir, 'src'), { recursive: true });
  writeFileSync(join(appDir, 'package.json'), JSON.stringify({ name: 'fixture-app' }));
  writeFileSync(join(appDir, 'src', 'index.js'), "console.log('hi');\n");
  writeFileSync(join(appDir, 'rippleview.config.yaml'), 'department: default\n');
  writeFileSync(join(appDir, '.env'), 'SECRET=shh\n');
});

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

// AC-1/AC-2/AC-3: `rv bundle` packs the app and pushes it to the BundleStore,
// falling back to a local-zip store with no workspace file required.
describe('AC-1/AC-2/AC-3: bundleCommand success path', () => {
  it('exits 0 and returns a manifest when no workspace file is present', async () => {
    const result = await bundleCommand({ app: appDir });

    expect(result.exitCode).toBe(0);
    expect(result.manifest).toBeDefined();
    expect(result.manifest?.appName).toBe('fixture-app');
    expect(typeof result.manifest?.digest).toBe('string');
    expect(result.manifest?.sizeBytes).toBeGreaterThan(0);
  });

  it('uses the explicit --name when provided instead of the directory basename', async () => {
    const result = await bundleCommand({ app: appDir, name: 'custom-name' });
    expect(result.exitCode).toBe(0);
    expect(result.manifest?.appName).toBe('custom-name');
  });

  it('loads bundleStore config from an explicit --workspace path', async () => {
    const workspaceDir = mkdtempSync(join(tmpdir(), 'rv-cli-bundle-ws-'));
    const workspacePath = join(workspaceDir, 'rippleview.workspace.yaml');
    writeFileSync(
      workspacePath,
      [
        'version: "1"',
        'name: ws',
        'bundleStore:',
        '  profile: local-zip',
        `  localZip:`,
        `    storeDir: ${join(workspaceDir, 'bundles')}`,
        '',
      ].join('\n'),
      'utf8',
    );

    const result = await bundleCommand({ app: appDir, workspace: workspacePath });
    expect(result.exitCode).toBe(0);

    rmSync(workspaceDir, { recursive: true, force: true });
  });
});

// Failure path: never throws an uncaught exception, always a clean non-zero exit.
describe('bundleCommand failure path', () => {
  it('returns exitCode 1 for a nonexistent --app directory without throwing', async () => {
    await expect(bundleCommand({ app: '/nonexistent/app/dir' })).resolves.toEqual({ exitCode: 1 });
  });
});
