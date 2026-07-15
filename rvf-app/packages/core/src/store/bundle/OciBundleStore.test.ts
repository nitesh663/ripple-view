import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  OciBundleStore,
  buildOrasPushArgs,
  buildOrasPullArgs,
  buildOrasResolveArgs,
} from './OciBundleStore.js';
import type { BundleManifest } from './types.js';

let workDir: string;

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rv-oci-store-'));
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

const manifest: BundleManifest = {
  appName: 'demo-app',
  digest: 'digest-aaa',
  createdAt: '2026-01-01T00:00:00.000Z',
  sizeBytes: 42,
};

// AC-2: OCI profile pushes/pulls the same bundle by digest, never spawning a
// real process — the fake executor below never calls anything real.
describe('AC-2: pure oras argument builders', () => {
  it('buildOrasPushArgs targets registry/repository:tag with the archive + media type', () => {
    const args = buildOrasPushArgs({
      registry: 'registry.example.com',
      repository: 'rv-bundles',
      tag: 'digest-aaa',
      archivePath: '/tmp/digest-aaa.zip',
    });
    expect(args).toEqual([
      'push',
      'registry.example.com/rv-bundles:digest-aaa',
      '/tmp/digest-aaa.zip:application/vnd.rv.bundle.v1+zip',
    ]);
  });

  it('buildOrasPullArgs pulls by sha256 digest into destDir', () => {
    const args = buildOrasPullArgs({
      registry: 'registry.example.com',
      repository: 'rv-bundles',
      digest: 'digest-aaa',
      destDir: '/tmp/dest',
    });
    expect(args).toEqual([
      'pull',
      'registry.example.com/rv-bundles@sha256:digest-aaa',
      '-o',
      '/tmp/dest',
    ]);
  });

  it('buildOrasResolveArgs resolves the latest-<appName> tag', () => {
    const args = buildOrasResolveArgs({
      registry: 'registry.example.com',
      repository: 'rv-bundles',
      tag: 'latest-demo-app',
    });
    expect(args).toEqual(['resolve', 'registry.example.com/rv-bundles:latest-demo-app']);
  });
});

describe('AC-2: OciBundleStore wires the executor without spawning a real process', () => {
  it('putBundle pushes the digest tag and moves the latest-<appName> pointer', async () => {
    const executor = vi.fn().mockReturnValue('');
    const store = new OciBundleStore('registry.example.com', 'rv-bundles', executor, workDir);

    await store.putBundle('demo-app', Buffer.from('archive-bytes'), manifest);

    expect(executor).toHaveBeenCalledTimes(2);
    const [firstCmd, firstArgs] = executor.mock.calls[0] as [string, string[]];
    const [secondCmd, secondArgs] = executor.mock.calls[1] as [string, string[]];
    expect(firstCmd).toBe('oras');
    expect(secondCmd).toBe('oras');
    expect(firstArgs).toEqual(
      buildOrasPushArgs({
        registry: 'registry.example.com',
        repository: 'rv-bundles',
        tag: 'digest-aaa',
        archivePath: join(workDir, 'digest-aaa.zip'),
      }),
    );
    expect(secondArgs[1]).toBe('registry.example.com/rv-bundles:latest-demo-app');
  });

  it('fetchBundle pulls by digest and never calls a real process', async () => {
    const executor = vi.fn().mockReturnValue('');
    const store = new OciBundleStore('registry.example.com', 'rv-bundles', executor, workDir);

    await store.fetchBundle('digest-aaa', '/tmp/dest');

    expect(executor).toHaveBeenCalledWith(
      'oras',
      buildOrasPullArgs({
        registry: 'registry.example.com',
        repository: 'rv-bundles',
        digest: 'digest-aaa',
        destDir: '/tmp/dest',
      }),
    );
  });

  it('getLatestBundle reads back the manifest cached by the prior putBundle', async () => {
    const executor = vi.fn().mockReturnValue('');
    const store = new OciBundleStore('registry.example.com', 'rv-bundles', executor, workDir);
    await store.putBundle('demo-app', Buffer.from('archive-bytes'), manifest);

    const latest = await store.getLatestBundle('demo-app');
    expect(latest).toEqual(manifest);
  });

  it('getLatestBundle returns undefined for an app that was never pushed', async () => {
    const executor = vi.fn().mockReturnValue('');
    const store = new OciBundleStore('registry.example.com', 'rv-bundles', executor, workDir);
    const latest = await store.getLatestBundle('never-pushed-app');
    expect(latest).toBeUndefined();
  });

  it('surfaces a non-zero exit from the executor as a rejected promise, not a swallowed error', async () => {
    const executor = vi.fn().mockImplementation(() => {
      throw new Error('oras push exited with code 1');
    });
    const store = new OciBundleStore('registry.example.com', 'rv-bundles', executor, workDir);

    await expect(store.putBundle('demo-app', Buffer.from('bytes'), manifest)).rejects.toThrow(
      'oras push exited with code 1',
    );
  });
});
