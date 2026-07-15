import { describe, it, expect } from 'vitest';
import { resolveBaseTestVersion, compareVersions } from './VersionResolver.js';

//  (US-8.2) AC: "given an app on datagrid@18.1.0, then base tests
// @RippleViewTests/datagrid@18.1.0 are loaded" — and the floor-match correction:
// published base-test versions are deliberately SPARSE, so an exact miss
// must fall back to the greatest published version below the request, and
// a request below every published version is a real null finding (G10).

describe('compareVersions', () => {
  it('orders by major, then minor, then patch', () => {
    expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
    expect(compareVersions('1.2.0', '1.10.0')).toBeLessThan(0);
    expect(compareVersions('1.2.3', '1.2.4')).toBeLessThan(0);
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('ranks a release version above its own prerelease', () => {
    expect(compareVersions('18.3.3', '18.3.3-beta.1')).toBeGreaterThan(0);
    expect(compareVersions('18.3.3-beta.1', '18.3.3')).toBeLessThan(0);
  });

  it('compares two prereleases of the same core lexically', () => {
    expect(compareVersions('18.3.3-beta.1', '18.3.3-beta.2')).toBeLessThan(0);
  });
});

describe('resolveBaseTestVersion', () => {
  it('exact match — requesting a published version returns it', () => {
    const published = ['15.0.0', '17.0.0'];
    expect(resolveBaseTestVersion(published, '17.0.0')).toBe('17.0.0');
  });

  it('floor match — a sparse publish set picks the greatest version <= requested', () => {
    const published = ['15.0.0', '17.0.0'];
    expect(resolveBaseTestVersion(published, '15.2.0')).toBe('15.0.0');
    expect(resolveBaseTestVersion(published, '17.2.0')).toBe('17.0.0');
  });

  it('no qualifying version — every published version is above the request, returns null', () => {
    const published = ['15.0.0', '17.0.0'];
    expect(resolveBaseTestVersion(published, '14.9.9')).toBeNull();
  });

  it('empty published list — always null', () => {
    expect(resolveBaseTestVersion([], '1.0.0')).toBeNull();
  });

  it('does not depend on input ordering', () => {
    const published = ['17.0.0', '15.0.0', '17.1.0'];
    expect(resolveBaseTestVersion(published, '17.0.5')).toBe('17.0.0');
  });

  it('lockstep prerelease — a beta candidate floor-matches against published prereleases', () => {
    const published = ['18.3.0', '18.3.3-beta.1'];
    expect(resolveBaseTestVersion(published, '18.3.3-beta.1')).toBe('18.3.3-beta.1');
    expect(resolveBaseTestVersion(published, '18.3.3-beta.2')).toBe('18.3.3-beta.1');
  });
});
