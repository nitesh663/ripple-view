import { describe, it, expect } from 'vitest';
import { checkLockstepCommand } from './check-lockstep.js';

// Injected fetcher (G13) — no real network. The real Verdaccio path is
// exercised separately, against the live registry, in the manual real-world
// verification for this story.

describe('checkLockstepCommand — AC1: a stable release passes via floor-match (sparse publish is fine)', () => {
  it('exits 0 and reports the resolved version', async () => {
    const result = await checkLockstepCommand({
      packageName: '@RippleViewTests/core-controls',
      version: '17.2.0',
      registry: 'http://localhost:4873',
      fetchPublishedVersions: async () => ['15.0.0', '17.0.0'],
    });

    expect(result.exitCode).toBe(0);
    expect(result.passed).toBe(true);
    expect(result.resolvedBaseTestVersion).toBe('17.0.0');
  });
});

describe('checkLockstepCommand — AC2: blocks a release with zero qualifying base-test coverage', () => {
  it('exits 1 when nothing qualifies, not even via floor-match', async () => {
    const result = await checkLockstepCommand({
      packageName: '@RippleViewTests/core-controls',
      version: '14.0.0',
      registry: 'http://localhost:4873',
      fetchPublishedVersions: async () => ['15.0.0', '17.0.0'],
    });

    expect(result.exitCode).toBe(1);
    expect(result.passed).toBe(false);
  });

  it('exits 1 when a prerelease has no EXACT matching base-test version, even if an older stable one would floor-match', async () => {
    const result = await checkLockstepCommand({
      packageName: '@RippleViewTests/core-controls',
      version: '18.3.3-beta.1',
      registry: 'http://localhost:4873',
      fetchPublishedVersions: async () => ['17.0.0', '18.0.0'],
    });

    expect(result.exitCode).toBe(1);
    expect(result.passed).toBe(false);
    expect(result.resolvedBaseTestVersion).toBeNull();
  });
});

describe('checkLockstepCommand — never throws (G10)', () => {
  it('exits 1 with a clear message when the registry fetch fails', async () => {
    const result = await checkLockstepCommand({
      packageName: '@RippleViewTests/core-controls',
      version: '17.0.0',
      registry: 'http://localhost:4873',
      fetchPublishedVersions: async () => {
        throw new Error('ECONNREFUSED');
      },
    });

    expect(result.exitCode).toBe(1);
    expect(result.passed).toBeUndefined();
  });
});
