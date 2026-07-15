import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { createBundle } from './createBundle.js';
import type { WalkEntry, ZipWriter } from './createBundle.js';

// In-memory ZipWriter test double — records addFile calls, returns a fixed buffer.
function fakeZipWriter(fixedBuffer: Buffer): ZipWriter & { addFileCalls: [string, Buffer][] } {
  const addFileCalls: [string, Buffer][] = [];
  return {
    addFileCalls,
    addFile: (relPath, data) => {
      addFileCalls.push([relPath, data]);
    },
    toBuffer: () => fixedBuffer,
  };
}

const FIXED_ARCHIVE = Buffer.from('fake-archive-bytes');
const FIXED_NOW = () => '2026-01-01T00:00:00.000Z';

function entry(relPath: string, isDirectory = false): WalkEntry {
  return { relPath, absPath: `/app/${relPath}`, isDirectory };
}

// AC-1: content-addressed archive containing source + lockfile + rippleview.config.yaml,
// excluding node_modules/.git/dist and scrubbing env/secrets.
describe('AC-1: createBundle', () => {
  it('never passes excluded-directory entries to addFile', () => {
    const writer = fakeZipWriter(FIXED_ARCHIVE);
    const walk = vi
      .fn()
      .mockReturnValue([
        entry('node_modules', true),
        entry('node_modules/lodash/index.js'),
        entry('.git', true),
        entry('.git/HEAD'),
        entry('dist', true),
        entry('dist/main.js'),
        entry('src/index.ts'),
      ]);
    const readFile = vi.fn().mockReturnValue(Buffer.from('content'));

    createBundle({
      appName: 'demo-app',
      appDir: '/app',
      walk,
      readFile,
      zipFactory: () => writer,
      now: FIXED_NOW,
    });

    const addedPaths = writer.addFileCalls.map(([relPath]) => relPath);
    expect(addedPaths).not.toContain('node_modules/lodash/index.js');
    expect(addedPaths).not.toContain('.git/HEAD');
    expect(addedPaths).not.toContain('dist/main.js');
    expect(addedPaths).toContain('src/index.ts');
  });

  it('never passes secret files to addFile', () => {
    const writer = fakeZipWriter(FIXED_ARCHIVE);
    const walk = vi
      .fn()
      .mockReturnValue([
        entry('.env'),
        entry('.env.production'),
        entry('.npmrc'),
        entry('certs/server.pem'),
        entry('certs/private.key'),
        entry('rippleview.config.yaml'),
        entry('package-lock.json'),
      ]);
    const readFile = vi.fn().mockReturnValue(Buffer.from('content'));

    createBundle({
      appName: 'demo-app',
      appDir: '/app',
      walk,
      readFile,
      zipFactory: () => writer,
      now: FIXED_NOW,
    });

    const addedPaths = writer.addFileCalls.map(([relPath]) => relPath);
    expect(addedPaths).not.toContain('.env');
    expect(addedPaths).not.toContain('.env.production');
    expect(addedPaths).not.toContain('.npmrc');
    expect(addedPaths).not.toContain('certs/server.pem');
    expect(addedPaths).not.toContain('certs/private.key');
    // rippleview.config.yaml and lockfiles are not excluded — they pass through naturally.
    expect(addedPaths).toContain('rippleview.config.yaml');
    expect(addedPaths).toContain('package-lock.json');
  });

  it('skips directory entries themselves (only files are added)', () => {
    const writer = fakeZipWriter(FIXED_ARCHIVE);
    const walk = vi.fn().mockReturnValue([entry('src', true), entry('src/index.ts')]);
    const readFile = vi.fn().mockReturnValue(Buffer.from('content'));

    createBundle({
      appName: 'demo-app',
      appDir: '/app',
      walk,
      readFile,
      zipFactory: () => writer,
      now: FIXED_NOW,
    });

    expect(writer.addFileCalls).toEqual([['src/index.ts', Buffer.from('content')]]);
  });

  it('computes the manifest digest as the real sha256 of the archive buffer', () => {
    const writer = fakeZipWriter(FIXED_ARCHIVE);
    const walk = vi.fn().mockReturnValue([entry('src/index.ts')]);
    const readFile = vi.fn().mockReturnValue(Buffer.from('content'));

    const { manifest, archive } = createBundle({
      appName: 'demo-app',
      appDir: '/app',
      walk,
      readFile,
      zipFactory: () => writer,
      now: FIXED_NOW,
    });

    const expectedDigest = createHash('sha256').update(FIXED_ARCHIVE).digest('hex');
    expect(manifest.digest).toBe(expectedDigest);
    expect(archive).toBe(FIXED_ARCHIVE);
  });

  it('sets sizeBytes to the archive buffer length and stamps appName/createdAt', () => {
    const writer = fakeZipWriter(FIXED_ARCHIVE);
    const walk = vi.fn().mockReturnValue([]);
    const readFile = vi.fn();

    const { manifest } = createBundle({
      appName: 'demo-app',
      appDir: '/app',
      walk,
      readFile,
      zipFactory: () => writer,
      now: FIXED_NOW,
    });

    expect(manifest.sizeBytes).toBe(FIXED_ARCHIVE.length);
    expect(manifest.appName).toBe('demo-app');
    expect(manifest.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('defaults `now` to the real clock when not injected', () => {
    const writer = fakeZipWriter(FIXED_ARCHIVE);
    const before = Date.now();

    const { manifest } = createBundle({
      appName: 'demo-app',
      appDir: '/app',
      walk: () => [],
      readFile: vi.fn(),
      zipFactory: () => writer,
    });

    const parsed = Date.parse(manifest.createdAt);
    expect(parsed).toBeGreaterThanOrEqual(before);
  });
});
