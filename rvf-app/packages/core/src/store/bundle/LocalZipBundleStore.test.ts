import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import AdmZip from 'adm-zip';
import { LocalZipBundleStore } from './LocalZipBundleStore.js';
import type { ZipExtractor } from './LocalZipBundleStore.js';
import type { BundleManifest } from './types.js';

// This test class legitimately uses real temp dirs and the real adm-zip
// package, matching the existing FileResultStore.test.ts convention — a
// fast, pure-local operation, not a network/process call (G13).

const realZip: ZipExtractor = {
  extractAll: (archive, destDir) => {
    new AdmZip(archive).extractAllTo(destDir, true);
  },
};

function makeManifest(appName: string, digest: string): BundleManifest {
  return { appName, digest, createdAt: '2026-01-01T00:00:00.000Z', sizeBytes: 0 };
}

function buildZip(files: Record<string, string>): Buffer {
  const zip = new AdmZip();
  for (const [relPath, content] of Object.entries(files)) {
    zip.addFile(relPath, Buffer.from(content, 'utf8'));
  }
  return zip.toBuffer();
}

let storeRoot: string;
let fetchRoot: string;

beforeAll(() => {
  storeRoot = mkdtempSync(join(tmpdir(), 'rv-bundle-store-'));
  fetchRoot = mkdtempSync(join(tmpdir(), 'rv-bundle-fetch-'));
});

afterAll(() => {
  rmSync(storeRoot, { recursive: true, force: true });
  rmSync(fetchRoot, { recursive: true, force: true });
});

// AC-2: local-zip profile stores the bundle locally and unzips it into a
// throwaway workspace on fetch.
describe('AC-2: put -> fetch round trip', () => {
  it('writes the zip + manifest and extracts identical content on fetch', async () => {
    const store = new LocalZipBundleStore(storeRoot, realZip);
    const archive = buildZip({
      'package.json': '{"name":"demo"}',
      'src/index.js': 'console.log(1);',
    });
    const manifest = makeManifest('demo-app', 'digest-aaa');
    manifest.sizeBytes = archive.length;

    await store.putBundle('demo-app', archive, manifest);

    expect(existsSync(join(storeRoot, 'demo-app', 'digest-aaa.zip'))).toBe(true);
    expect(existsSync(join(storeRoot, 'demo-app', 'digest-aaa.manifest.json'))).toBe(true);

    const destDir = join(fetchRoot, 'round-trip');
    await store.fetchBundle('digest-aaa', destDir);

    expect(readFileSync(join(destDir, 'package.json'), 'utf8')).toBe('{"name":"demo"}');
    expect(readFileSync(join(destDir, 'src/index.js'), 'utf8')).toBe('console.log(1);');
  });

  it('rejects when fetching an unknown digest', async () => {
    const store = new LocalZipBundleStore(storeRoot, realZip);
    await expect(store.fetchBundle('does-not-exist', join(fetchRoot, 'missing'))).rejects.toThrow();
  });
});

// AC-3: the store indexes the latest bundle per app.
describe('AC-3: getLatestBundle reflects the most recent push', () => {
  it('returns undefined before any bundle has been pushed', async () => {
    const store = new LocalZipBundleStore(storeRoot, realZip);
    const result = await store.getLatestBundle('never-pushed-app');
    expect(result).toBeUndefined();
  });

  it('reflects the second putBundle call after two pushes', async () => {
    const store = new LocalZipBundleStore(storeRoot, realZip);
    const archive1 = buildZip({ 'v1.txt': 'one' });
    const manifest1 = makeManifest('multi-push-app', 'digest-v1');
    manifest1.sizeBytes = archive1.length;
    await store.putBundle('multi-push-app', archive1, manifest1);

    const archive2 = buildZip({ 'v2.txt': 'two' });
    const manifest2 = makeManifest('multi-push-app', 'digest-v2');
    manifest2.sizeBytes = archive2.length;
    await store.putBundle('multi-push-app', archive2, manifest2);

    const latest = await store.getLatestBundle('multi-push-app');
    expect(latest?.digest).toBe('digest-v2');
  });
});

// findZipByDigest fallback path — store directory absent entirely.
describe('fetchBundle when the store directory does not exist yet', () => {
  it('rejects cleanly rather than throwing an fs ENOENT', async () => {
    const emptyRoot = join(storeRoot, 'never-created');
    const store = new LocalZipBundleStore(emptyRoot, realZip);
    await expect(store.fetchBundle('any-digest', join(fetchRoot, 'x'))).rejects.toThrow();
  });
});

// Defensive: a corrupted latest.json must not throw — undefined instead.
describe('getLatestBundle resilience', () => {
  it('returns undefined when latest.json is malformed', async () => {
    const appDir = join(storeRoot, 'corrupt-app');
    mkdirSync(appDir, { recursive: true });
    writeFileSync(join(appDir, 'latest.json'), 'not json', 'utf8');

    const store = new LocalZipBundleStore(storeRoot, realZip);
    const result = await store.getLatestBundle('corrupt-app');
    expect(result).toBeUndefined();
  });
});
