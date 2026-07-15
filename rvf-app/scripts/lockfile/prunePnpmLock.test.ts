/**
 * Unit tests for — surgical pnpm lockfile pruning.
 *
 * AC-1: the override resolves transitively — proven by showing the target
 * package's entries are removed from both the bare-name importer maps and
 * the `name@version` registry maps, across two structurally different pnpm
 * lockfile shapes, while every other package's entry is left untouched.
 */

import { describe, it, expect } from 'vitest';
import { prunePnpmLockEntry } from './prunePnpmLock.mjs';

// ---------------------------------------------------------------------------
// Pre-v6-style fixture: no `importers:`, flat root-level dependencies +
// specifiers, `packages:` keyed like `/name/version`.
// ---------------------------------------------------------------------------
const preV6Lockfile = {
  lockfileVersion: 5.4,
  specifiers: {
    lodash: '^4.17.20',
    foo: '^1.0.0',
  },
  dependencies: {
    lodash: '4.17.20',
    foo: '1.0.0',
  },
  packages: {
    '/lodash/4.17.20': {
      resolution: { integrity: 'sha512-old-lodash-hash' },
      dev: false,
    },
    '/foo/1.0.0': {
      resolution: { integrity: 'sha512-foo-hash' },
      dev: false,
    },
  },
};

describe('AC-1: prunePnpmLockEntry — pre-v6 flat shape', () => {
  it('removes the bare-name dependency/specifier entries', () => {
    const result = prunePnpmLockEntry(preV6Lockfile, 'lodash');
    expect((result as typeof preV6Lockfile).dependencies['lodash']).toBeUndefined();
    expect((result as typeof preV6Lockfile).specifiers['lodash']).toBeUndefined();
  });

  it('removes the versioned packages: entry (leading-slash form)', () => {
    const result = prunePnpmLockEntry(preV6Lockfile, 'lodash');
    expect((result as typeof preV6Lockfile).packages['/lodash/4.17.20']).toBeUndefined();
  });

  it('leaves every other package entry deeply unchanged', () => {
    const result = prunePnpmLockEntry(preV6Lockfile, 'lodash') as typeof preV6Lockfile;
    expect(result.dependencies['foo']).toBe('1.0.0');
    expect(result.specifiers['foo']).toBe('^1.0.0');
    expect(result.packages['/foo/1.0.0']).toEqual(preV6Lockfile.packages['/foo/1.0.0']);
  });
});

// ---------------------------------------------------------------------------
// v9-style fixture: `importers:` keyed per-workspace by bare name, plus
// separate `packages:` and `snapshots:` maps keyed `name@version(peer)`.
// ---------------------------------------------------------------------------
const v9Lockfile = {
  lockfileVersion: '9.0',
  importers: {
    '.': {
      dependencies: {
        lodash: { specifier: '^4.17.20', version: '4.17.20' },
        'lodash-es': { specifier: '^4.17.20', version: '4.17.20' },
      },
      devDependencies: {
        'lodash.merge': { specifier: '^4.6.2', version: '4.6.2' },
      },
    },
  },
  packages: {
    'lodash@4.17.20': { resolution: { integrity: 'sha512-old-lodash-hash' } },
    'lodash-es@4.17.20': { resolution: { integrity: 'sha512-lodash-es-hash' } },
    'lodash.merge@4.6.2': { resolution: { integrity: 'sha512-lodash-merge-hash' } },
    'react@18.2.0': { resolution: { integrity: 'sha512-react-hash' } },
    'react-dom@18.2.0(react@18.2.0)': { resolution: { integrity: 'sha512-react-dom-hash' } },
  },
  snapshots: {
    'lodash@4.17.20': {},
    'lodash-es@4.17.20': {},
    'lodash.merge@4.6.2': {},
    'react-dom@18.2.0(react@18.2.0)': { dependencies: { react: '18.2.0' } },
  },
};

describe('AC-1: prunePnpmLockEntry — v9 importers/packages/snapshots shape', () => {
  it('removes the bare-name importer dependency entry', () => {
    const result = prunePnpmLockEntry(v9Lockfile, 'lodash') as typeof v9Lockfile;
    expect(result.importers['.'].dependencies['lodash']).toBeUndefined();
  });

  it('removes the versioned packages: and snapshots: entries', () => {
    const result = prunePnpmLockEntry(v9Lockfile, 'lodash') as typeof v9Lockfile;
    expect(result.packages['lodash@4.17.20']).toBeUndefined();
    expect(result.snapshots['lodash@4.17.20']).toBeUndefined();
  });

  it('does not false-positive on lodash-es or lodash.merge (no "lodash@" prefix match)', () => {
    const result = prunePnpmLockEntry(v9Lockfile, 'lodash') as typeof v9Lockfile;
    expect(result.importers['.'].dependencies['lodash-es']).toEqual(
      v9Lockfile.importers['.'].dependencies['lodash-es'],
    );
    expect(result.importers['.'].devDependencies['lodash.merge']).toEqual(
      v9Lockfile.importers['.'].devDependencies['lodash.merge'],
    );
    expect(result.packages['lodash-es@4.17.20']).toEqual(v9Lockfile.packages['lodash-es@4.17.20']);
    expect(result.packages['lodash.merge@4.6.2']).toEqual(
      v9Lockfile.packages['lodash.merge@4.6.2'],
    );
  });

  it('does not false-positive on react-dom when pruning react (peer-suffix key)', () => {
    const result = prunePnpmLockEntry(v9Lockfile, 'react') as typeof v9Lockfile;
    expect(result.packages['react@18.2.0']).toBeUndefined();
    expect(result.packages['react-dom@18.2.0(react@18.2.0)']).toEqual(
      v9Lockfile.packages['react-dom@18.2.0(react@18.2.0)'],
    );
    expect(result.snapshots['react-dom@18.2.0(react@18.2.0)']).toEqual(
      v9Lockfile.snapshots['react-dom@18.2.0(react@18.2.0)'],
    );
  });

  it("does not delete react-dom's own internal dependency-edge metadata for react", () => {
    // react-dom's snapshot entry records its own resolved dependency on
    // react (`dependencies: { react: '18.2.0' }`) — this is metadata about
    // react-dom's entry, not a top-level pin of react, and must survive.
    const result = prunePnpmLockEntry(v9Lockfile, 'react') as typeof v9Lockfile;
    expect(result.snapshots['react-dom@18.2.0(react@18.2.0)'].dependencies).toEqual({
      react: '18.2.0',
    });
  });

  it('does not mutate the input object', () => {
    prunePnpmLockEntry(v9Lockfile, 'lodash');
    expect(v9Lockfile.packages['lodash@4.17.20']).toBeDefined();
  });
});
