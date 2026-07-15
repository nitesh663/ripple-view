/**
 * Unit tests for  T-5.2.1/T-5.2.3 — resolve-build-contract.mjs.
 *
 * Proves the Node-version precedence chain (build.node → .nvmrc/.node-version
 * → concrete engines.node → '20'), the engines.node RANGE exclusion, and the
 * defaults for every other contract field. All file I/O is an in-memory fake,
 * so no real filesystem is touched (G13 determinism).
 */

import { describe, it, expect } from 'vitest';
import { stringify as yamlStringify } from 'yaml';
import { makeFakeFs } from './fixtures/fakeFs.js';
import { resolveBuildContract } from './resolve-build-contract.mjs';

const APP = '/tmp/app';

function resolve(files: Record<string, string>) {
  const { readFileFn, existsFn } = makeFakeFs(files);
  return resolveBuildContract({ appDir: APP, readFileFn, existsFn });
}

function config(build: Record<string, unknown>): string {
  return yamlStringify({ department: 'default', build });
}

describe('resolveBuildContract — nodeVersion precedence', () => {
  it('build.node wins over .nvmrc and engines.node', () => {
    const contract = resolve({
      [`${APP}/rippleview.config.yaml`]: config({ node: '18' }),
      [`${APP}/.nvmrc`]: '16',
      [`${APP}/package.json`]: JSON.stringify({ engines: { node: '14' } }),
    });
    expect(contract.nodeVersion).toBe('18');
  });

  it('falls back to .nvmrc (leading v stripped) when build.node is absent', () => {
    const contract = resolve({
      [`${APP}/.nvmrc`]: 'v18.20.4\n',
      [`${APP}/package.json`]: JSON.stringify({ engines: { node: '14' } }),
    });
    expect(contract.nodeVersion).toBe('18.20.4');
  });

  it('uses .node-version when .nvmrc is absent', () => {
    const contract = resolve({
      [`${APP}/.node-version`]: '20.11.0',
    });
    expect(contract.nodeVersion).toBe('20.11.0');
  });

  it('uses a concrete engines.node when build.node and node files are absent', () => {
    const contract = resolve({
      [`${APP}/package.json`]: JSON.stringify({ engines: { node: '18.20.4' } }),
    });
    expect(contract.nodeVersion).toBe('18.20.4');
  });

  it('uses a bare-major concrete engines.node', () => {
    const contract = resolve({
      [`${APP}/package.json`]: JSON.stringify({ engines: { node: '18' } }),
    });
    expect(contract.nodeVersion).toBe('18');
  });

  it('IGNORES an engines.node range and falls through to the default', () => {
    const contract = resolve({
      [`${APP}/package.json`]: JSON.stringify({ engines: { node: '^18 || ^20' } }),
    });
    expect(contract.nodeVersion).toBe('20');
  });

  it('IGNORES a >= engines.node range and falls through to the default', () => {
    const contract = resolve({
      [`${APP}/package.json`]: JSON.stringify({ engines: { node: '>=16' } }),
    });
    expect(contract.nodeVersion).toBe('20');
  });

  it('defaults to 20 when nothing declares a Node version', () => {
    const contract = resolve({
      [`${APP}/package.json`]: JSON.stringify({ name: 'app' }),
    });
    expect(contract.nodeVersion).toBe('20');
  });
});

describe('resolveBuildContract — other fields and defaults', () => {
  it('resolves every field from a full build block', () => {
    const contract = resolve({
      [`${APP}/rippleview.config.yaml`]: config({
        node: '18',
        command: 'ng build',
        outputDir: 'dist/app/browser',
        serve: 'node',
        start: 'node server.js',
        port: 4200,
      }),
    });
    expect(contract).toEqual({
      nodeVersion: '18',
      buildCmd: 'ng build',
      outputDir: 'dist/app/browser',
      serveMode: 'node',
      startCmd: 'node server.js',
      port: 4200,
    });
  });

  it('applies all defaults when rippleview.config.yaml is missing', () => {
    const contract = resolve({});
    expect(contract).toEqual({
      nodeVersion: '20',
      buildCmd: '',
      outputDir: 'dist',
      serveMode: 'static',
      startCmd: '',
      port: 3000,
    });
  });

  it('applies field defaults when the build block is empty', () => {
    const contract = resolve({
      [`${APP}/rippleview.config.yaml`]: config({}),
    });
    expect(contract.buildCmd).toBe('');
    expect(contract.outputDir).toBe('dist');
    expect(contract.serveMode).toBe('static');
    expect(contract.startCmd).toBe('');
    expect(contract.port).toBe(3000);
  });
});
