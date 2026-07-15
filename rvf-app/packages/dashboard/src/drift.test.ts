import { describe, it, expect } from 'vitest';
import { computeDrift } from './drift.js';

describe('computeDrift', () => {
  it('returns current when versions are identical', () => {
    expect(computeDrift('17.2.0', '17.2.0')).toMatchObject({
      badge: 'current',
      majorsBehind: 0,
      minorsBehind: 0,
      patchesBehind: 0,
    });
  });

  it('returns minor for 1 minor behind', () => {
    expect(computeDrift('17.1.0', '17.2.0')).toMatchObject({ badge: 'minor', minorsBehind: 1 });
  });

  it('returns minor for 2 minors behind', () => {
    expect(computeDrift('17.1.0', '17.3.0')).toMatchObject({ badge: 'minor', minorsBehind: 2 });
  });

  it('returns minor for patch-only difference', () => {
    expect(computeDrift('17.2.0', '17.2.3')).toMatchObject({ badge: 'minor', patchesBehind: 3 });
  });

  it('returns major for 1 major behind', () => {
    expect(computeDrift('16.0.0', '17.0.0')).toMatchObject({ badge: 'major', majorsBehind: 1 });
  });

  it('returns major even when consumer minor is ahead within its major', () => {
    expect(computeDrift('16.5.0', '17.0.0')).toMatchObject({ badge: 'major', majorsBehind: 1 });
  });

  it('strips -ng17 channel suffix before comparing', () => {
    expect(computeDrift('17.2.0-ng17.1', '17.3.0-ng17.2')).toMatchObject({
      badge: 'minor',
      minorsBehind: 1,
    });
  });

  it('strips -ng15 channel suffix before comparing', () => {
    expect(computeDrift('15.0.0-ng15.0', '15.0.0-ng15.0')).toMatchObject({ badge: 'current' });
  });

  it('strips -ag27 channel suffix before comparing', () => {
    expect(computeDrift('15.1.0-ag27.0', '15.2.0-ag27.0')).toMatchObject({
      badge: 'minor',
      minorsBehind: 1,
    });
  });

  it('returns none for unparseable version strings', () => {
    expect(computeDrift('*', '17.2.0')).toMatchObject({ badge: 'none' });
  });

  it('returns none when both versions are unparseable', () => {
    expect(computeDrift('workspace:*', 'workspace:^')).toMatchObject({ badge: 'none' });
  });
});
