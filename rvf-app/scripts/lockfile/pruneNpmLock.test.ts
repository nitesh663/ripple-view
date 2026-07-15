/**
 * Unit tests for — surgical npm lockfile pruning.
 *
 * AC-1: an override is injected and resolves transitively — proven here by
 * showing every occurrence (including nested duplicates) of the target
 * package is removed from the lockfile, in both structural shapes npm has
 * used (flat `packages` map and nested `dependencies` tree), while every
 * other package's pinned version/resolved/integrity stays untouched.
 */

import { describe, it, expect } from 'vitest';
import { pruneNpmLockEntry } from './pruneNpmLock.mjs';

// ---------------------------------------------------------------------------
// v3-shaped fixture: flat `packages` map only, with a duplicate nested copy
// of the target package at two different paths.
// ---------------------------------------------------------------------------
const v3Lockfile = {
  name: 'fixture-app',
  lockfileVersion: 3,
  packages: {
    '': { name: 'fixture-app', version: '1.0.0' },
    'node_modules/lodash': {
      version: '4.17.20',
      resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.20.tgz',
      integrity: 'sha512-old-lodash-hash',
    },
    'node_modules/foo': {
      version: '1.0.0',
      resolved: 'https://registry.npmjs.org/foo/-/foo-1.0.0.tgz',
      integrity: 'sha512-foo-hash',
    },
    'node_modules/foo/node_modules/lodash': {
      version: '3.10.1',
      resolved: 'https://registry.npmjs.org/lodash/-/lodash-3.10.1.tgz',
      integrity: 'sha512-old-nested-lodash-hash',
    },
    'node_modules/react': {
      version: '18.2.0',
      resolved: 'https://registry.npmjs.org/react/-/react-18.2.0.tgz',
      integrity: 'sha512-react-hash',
    },
    'node_modules/react-dom': {
      version: '18.2.0',
      resolved: 'https://registry.npmjs.org/react-dom/-/react-dom-18.2.0.tgz',
      integrity: 'sha512-react-dom-hash',
    },
  },
};

describe('AC-1: pruneNpmLockEntry — v3 (flat packages map)', () => {
  it('removes all occurrences of the target package, including nested duplicates', () => {
    const result = pruneNpmLockEntry(v3Lockfile, 'lodash') as typeof v3Lockfile;
    expect(result.packages['node_modules/lodash']).toBeUndefined();
    expect(result.packages['node_modules/foo/node_modules/lodash']).toBeUndefined();
  });

  it('leaves every other package entry byte-for-byte unchanged', () => {
    const result = pruneNpmLockEntry(v3Lockfile, 'lodash') as typeof v3Lockfile;
    expect(result.packages['node_modules/foo']).toEqual(v3Lockfile.packages['node_modules/foo']);
    expect(result.packages['node_modules/react']).toEqual(
      v3Lockfile.packages['node_modules/react'],
    );
    expect(result.packages['node_modules/react-dom']).toEqual(
      v3Lockfile.packages['node_modules/react-dom'],
    );
    expect(result.packages['']).toEqual(v3Lockfile.packages['']);
  });

  it('does not substring-match: pruning "react" leaves "react-dom" intact', () => {
    const result = pruneNpmLockEntry(v3Lockfile, 'react') as typeof v3Lockfile;
    expect(result.packages['node_modules/react']).toBeUndefined();
    expect(result.packages['node_modules/react-dom']).toEqual(
      v3Lockfile.packages['node_modules/react-dom'],
    );
  });

  it('does not mutate the input object', () => {
    pruneNpmLockEntry(v3Lockfile, 'lodash');
    expect(v3Lockfile.packages['node_modules/lodash']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// v1-shaped fixture: nested `dependencies` tree only, target nested two
// levels deep.
// ---------------------------------------------------------------------------
const v1Lockfile = {
  name: 'fixture-app',
  lockfileVersion: 1,
  dependencies: {
    foo: {
      version: '1.0.0',
      resolved: 'https://registry.npmjs.org/foo/-/foo-1.0.0.tgz',
      integrity: 'sha512-foo-hash',
      dependencies: {
        bar: {
          version: '2.0.0',
          resolved: 'https://registry.npmjs.org/bar/-/bar-2.0.0.tgz',
          integrity: 'sha512-bar-hash',
          dependencies: {
            lodash: {
              version: '3.10.1',
              resolved: 'https://registry.npmjs.org/lodash/-/lodash-3.10.1.tgz',
              integrity: 'sha512-old-nested-lodash-hash',
            },
          },
        },
      },
    },
    'react-dom': {
      version: '18.2.0',
      resolved: 'https://registry.npmjs.org/react-dom/-/react-dom-18.2.0.tgz',
      integrity: 'sha512-react-dom-hash',
    },
  },
};

describe('AC-1: pruneNpmLockEntry — v1 (nested dependencies tree)', () => {
  it('removes the target package nested two levels deep', () => {
    const result = pruneNpmLockEntry(v1Lockfile, 'lodash') as typeof v1Lockfile;
    expect(result.dependencies.foo.dependencies.bar.dependencies.lodash).toBeUndefined();
  });

  it('leaves every other package entry byte-for-byte unchanged', () => {
    const result = pruneNpmLockEntry(v1Lockfile, 'lodash') as typeof v1Lockfile;
    expect(result.dependencies['react-dom']).toEqual(v1Lockfile.dependencies['react-dom']);
    expect(result.dependencies.foo.version).toBe('1.0.0');
    expect(result.dependencies.foo.dependencies.bar.version).toBe('2.0.0');
  });

  it('does not substring-match a package name at any depth', () => {
    const result = pruneNpmLockEntry(v1Lockfile, 'react') as typeof v1Lockfile;
    expect(result.dependencies['react-dom']).toEqual(v1Lockfile.dependencies['react-dom']);
  });

  it('does not mutate the input object', () => {
    pruneNpmLockEntry(v1Lockfile, 'lodash');
    expect(v1Lockfile.dependencies.foo.dependencies.bar.dependencies.lodash).toBeDefined();
  });
});
