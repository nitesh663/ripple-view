import { describe, it, expect } from 'vitest';
import { checkLockstepPublish } from './checkLockstepPublish.js';

describe('checkLockstepPublish — AC1: a stable release just needs SOME qualifying base-test version', () => {
  it('passes when an exact-matching version is published', () => {
    const result = checkLockstepPublish('17.0.0', ['15.0.0', '17.0.0']);
    expect(result).toEqual({
      passed: true,
      resolvedBaseTestVersion: '17.0.0',
      isPrerelease: false,
      message: expect.stringContaining('OK'),
    });
  });

  it('passes via floor-match — sparse publishing is fine for a stable release (the central invariant)', () => {
    const result = checkLockstepPublish('17.2.0', ['15.0.0', '17.0.0']);
    expect(result.passed).toBe(true);
    expect(result.resolvedBaseTestVersion).toBe('17.0.0');
    expect(result.message).toContain('sparse publish is fine');
  });

  it('blocks when NOTHING qualifies, not even via floor-match — zero base-test coverage is a real gap, not a sparse-publish case', () => {
    const result = checkLockstepPublish('14.0.0', ['15.0.0', '17.0.0']);
    expect(result.passed).toBe(false);
    expect(result.resolvedBaseTestVersion).toBeNull();
    expect(result.message).toContain('BLOCKED');
    expect(result.message).toContain('14.0.0');
  });

  it('blocks when the published list is empty', () => {
    const result = checkLockstepPublish('17.0.0', []);
    expect(result.passed).toBe(false);
  });
});

describe('checkLockstepPublish — AC2: a prerelease/beta requires an EXACT matching base-test version (lockstep prereleases)', () => {
  it('passes when the exact prerelease tag is published', () => {
    const result = checkLockstepPublish('18.3.3-beta.1', ['17.0.0', '18.3.3-beta.1']);
    expect(result).toEqual({
      passed: true,
      resolvedBaseTestVersion: '18.3.3-beta.1',
      isPrerelease: true,
      message: expect.stringContaining('Lockstep prerelease OK'),
    });
  });

  it('BLOCKS even when an older STABLE version would floor-match — floor-matching a prerelease would skip validating the very change under test', () => {
    const result = checkLockstepPublish('18.3.3-beta.1', ['17.0.0', '18.0.0']);
    expect(result.passed).toBe(false);
    expect(result.resolvedBaseTestVersion).toBeNull();
    expect(result.isPrerelease).toBe(true);
    expect(result.message).toContain('EXACT matching base-test');
    expect(result.message).toContain('18.3.3-beta.1');
  });

  it('BLOCKS when only a DIFFERENT prerelease tag is published (beta.1 vs beta.2 are not the same lockstep version)', () => {
    const result = checkLockstepPublish('18.3.3-beta.2', ['18.3.3-beta.1']);
    expect(result.passed).toBe(false);
  });
});
