import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import AdmZip from 'adm-zip';
import { createBundle } from './createBundle.js';
import { realWalk, realReadFile, realZipFactory } from './realZip.js';
import { LocalZipBundleStore } from './LocalZipBundleStore.js';

// Integration test proving the full AC-1 -> AC-2 contract end to end, entirely
// within @rippleview/core's own tests (AC-4 scope note): bundle -> store -> fetch ->
// unzip produces a faithful, secret-free, excluded-path-free copy of the
// original app. Real fs + the real adm-zip-backed ZipWriter/extractor are
// used here deliberately — a fast, pure-local operation (G13).

let fixtureDir: string;
let storeDir: string;
let destDir: string;

beforeAll(() => {
  fixtureDir = mkdtempSync(join(tmpdir(), 'rv-bundle-fixture-'));
  storeDir = mkdtempSync(join(tmpdir(), 'rv-bundle-roundtrip-store-'));
  destDir = mkdtempSync(join(tmpdir(), 'rv-bundle-roundtrip-dest-'));

  writeFileSync(join(fixtureDir, 'package.json'), JSON.stringify({ name: 'fixture-app' }, null, 2));
  mkdirSync(join(fixtureDir, 'src'), { recursive: true });
  writeFileSync(join(fixtureDir, 'src', 'index.js'), "console.log('hello');\n");
  writeFileSync(join(fixtureDir, 'rippleview.config.yaml'), 'department: default\n');
  writeFileSync(join(fixtureDir, '.env'), 'SECRET_TOKEN=super-secret\n');
  mkdirSync(join(fixtureDir, 'node_modules', 'left-pad'), { recursive: true });
  writeFileSync(join(fixtureDir, 'node_modules', 'left-pad', 'index.js'), 'module.exports = {};\n');
});

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
  rmSync(storeDir, { recursive: true, force: true });
  rmSync(destDir, { recursive: true, force: true });
});

describe('AC-1 -> AC-2: real bundle -> store -> fetch -> unzip fidelity', () => {
  it('produces a faithful, secret-free, excluded-path-free copy of the original app', async () => {
    const { manifest, archive } = createBundle({
      appName: 'fixture-app',
      appDir: fixtureDir,
      walk: realWalk,
      readFile: realReadFile,
      zipFactory: realZipFactory,
    });

    const store = new LocalZipBundleStore(storeDir, {
      extractAll: (buf, dir) => {
        new AdmZip(buf).extractAllTo(dir, true);
      },
    });

    await store.putBundle('fixture-app', archive, manifest);
    await store.fetchBundle(manifest.digest, destDir);

    // Present and byte-identical
    expect(readFileSync(join(destDir, 'package.json'))).toEqual(
      readFileSync(join(fixtureDir, 'package.json')),
    );
    expect(readFileSync(join(destDir, 'src', 'index.js'))).toEqual(
      readFileSync(join(fixtureDir, 'src', 'index.js')),
    );
    expect(readFileSync(join(destDir, 'rippleview.config.yaml'))).toEqual(
      readFileSync(join(fixtureDir, 'rippleview.config.yaml')),
    );

    // Secret-free and excluded-path-free
    expect(existsSync(join(destDir, '.env'))).toBe(false);
    expect(existsSync(join(destDir, 'node_modules'))).toBe(false);
  });

  it('round-trips through getLatestBundle so impact-selection can resolve the current bundle', async () => {
    const store = new LocalZipBundleStore(storeDir, {
      extractAll: (buf, dir) => {
        new AdmZip(buf).extractAllTo(dir, true);
      },
    });

    const latest = await store.getLatestBundle('fixture-app');
    expect(latest).toBeDefined();
    expect(latest?.appName).toBe('fixture-app');
  });
});
