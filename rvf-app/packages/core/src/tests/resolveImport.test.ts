import { describe, it, expect } from 'vitest';
import { resolveImport } from './resolveImport.js';
import { VersionResolutionError } from './VersionResolutionError.js';
import type { ImportEntry } from '../bdd/types.js';

//  (US-8.2), T-8.2.3 — the literal "import resolution" the story's
// AC requires: an `imports:` entry + a requested version resolves to a
// real `@RippleViewTests/<lib>` version, via an injected fetcher (G13 — no real
// network in this unit test).

const importEntry: ImportEntry = {
  lib: 'datagrid',
  use: 'all',
  mountedAt: { route: '/orders', region: 'main' },
};

describe('resolveImport', () => {
  it('resolves to the floor-matched published version', async () => {
    const fetchPublishedVersions = async (packageName: string): Promise<string[]> => {
      expect(packageName).toBe('@RippleViewTests/datagrid');
      return ['15.0.0', '17.0.0'];
    };

    const result = await resolveImport({
      importEntry,
      requestedVersion: '15.2.0',
      fetchPublishedVersions,
    });

    expect(result).toEqual({
      lib: 'datagrid',
      packageName: '@RippleViewTests/datagrid',
      version: '15.0.0',
    });
  });

  it('resolves an exact match', async () => {
    const fetchPublishedVersions = async (): Promise<string[]> => ['17.0.0'];

    const result = await resolveImport({
      importEntry,
      requestedVersion: '17.0.0',
      fetchPublishedVersions,
    });

    expect(result.version).toBe('17.0.0');
  });

  it('throws VersionResolutionError when no published version qualifies', async () => {
    const fetchPublishedVersions = async (): Promise<string[]> => ['17.0.0'];

    await expect(
      resolveImport({
        importEntry,
        requestedVersion: '15.0.0',
        fetchPublishedVersions,
      }),
    ).rejects.toThrow(VersionResolutionError);
  });

  it('throws VersionResolutionError when nothing is published at all', async () => {
    const fetchPublishedVersions = async (): Promise<string[]> => [];

    await expect(
      resolveImport({
        importEntry,
        requestedVersion: '1.0.0',
        fetchPublishedVersions,
      }),
    ).rejects.toThrow(VersionResolutionError);
  });
});
