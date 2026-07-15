import type { DriftInfo } from './types.js';

// Strip generation-channel prerelease suffixes (-ng17, -ng15, -ag27, etc.)
// before comparing semver. The channel is already encoded in the registry
// bucket (framework/generation) so the suffix is redundant for drift math.
function stripChannelSuffix(version: string): string {
  return version.replace(/-(?:ng|ag)\d+.*$/, '');
}

function parseSemver(version: string): [number, number, number] | null {
  const clean = stripChannelSuffix(version);
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(clean);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Compute how far `consumed` lags behind `latest` within the same
 * generation channel (G-channel suffix is stripped before comparison).
 *
 * Returns badge 'none' when either version is unparseable (e.g. "*").
 */
export function computeDrift(consumed: string, latest: string): DriftInfo {
  const c = parseSemver(consumed);
  const l = parseSemver(latest);

  if (!c || !l) {
    return { badge: 'none', majorsBehind: 0, minorsBehind: 0, patchesBehind: 0 };
  }

  const majorsBehind = l[0] - c[0];
  if (majorsBehind > 0) {
    return { badge: 'major', majorsBehind, minorsBehind: 0, patchesBehind: 0 };
  }

  const minorsBehind = l[1] - c[1];
  if (minorsBehind > 0) {
    return { badge: 'minor', majorsBehind: 0, minorsBehind, patchesBehind: 0 };
  }

  const patchesBehind = l[2] - c[2];
  if (patchesBehind > 0) {
    return { badge: 'minor', majorsBehind: 0, minorsBehind: 0, patchesBehind };
  }

  return { badge: 'current', majorsBehind: 0, minorsBehind: 0, patchesBehind: 0 };
}
