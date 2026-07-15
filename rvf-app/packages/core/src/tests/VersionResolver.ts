// VersionResolver.ts — (US-8.2), T-8.2.1.
//
// Design (base-test versioning, the central invariant): base-test
// package versions are published SPARSELY — only when a component change
// actually requires a base-test update. Resolving "which base-test version
// applies to component version X" is therefore a FLOOR MATCH: the greatest
// published version <= the requested version, never an exact-only lookup.
//
// This same pure function serves all THREE contexts from — Context 1
// (app's own pinned version), Context 2 (a consumer's CURRENT version, via
// ImpactedConsumer.libraryVersion), Context 3 (the candidate's NEW version).
// The contexts differ only in which version string the caller passes in;
// this module has zero context-specific branching (G1: @rippleview/core stays
// agnostic of any particular app/gate/adoption flow).
//
// Pure, no I/O (G13 determinism) — the caller is responsible for fetching
// the published-version list (e.g. from a registry) and passing it in.
// Returns `null` rather than throwing when no published version qualifies:
// "no version published low enough" is a real, valid finding (G10 —
// findings are data), not a defect in this function. The CALLER decides
// what a null means at its own boundary (e.g. a hard error at the CLI/gate
// boundary) — never decided inside this pure function.

/**
 * Compares two semver-like version strings. Supports the `MAJOR.MINOR.PATCH`
 * form plus an optional `-prerelease` suffix (lockstep prereleases per
 *, e.g. `18.3.3-beta.1`). A release version always outranks any of its
 * own prereleases (`18.3.3` > `18.3.3-beta.1`), matching standard semver
 * precedence rules for this codebase's needs (no build-metadata handling —
 * not used anywhere in this repo's version strings).
 *
 * Returns negative if `a` < `b`, positive if `a` > `b`, 0 if equal.
 */
export function compareVersions(a: string, b: string): number {
  const [aCore, aPre] = splitPrerelease(a);
  const [bCore, bPre] = splitPrerelease(b);

  const aParts = parseCore(aCore);
  const bParts = parseCore(bCore);

  for (let i = 0; i < 3; i += 1) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }

  if (aPre === undefined && bPre === undefined) {
    return 0;
  }
  if (aPre === undefined) {
    return 1;
  }
  if (bPre === undefined) {
    return -1;
  }
  return aPre.localeCompare(bPre);
}

function splitPrerelease(version: string): [string, string | undefined] {
  const dashIdx = version.indexOf('-');
  if (dashIdx === -1) {
    return [version, undefined];
  }
  return [version.slice(0, dashIdx), version.slice(dashIdx + 1)];
}

function parseCore(core: string): [number, number, number] {
  const segments = core.split('.').map((seg) => Number.parseInt(seg, 10));
  return [segments[0] ?? 0, segments[1] ?? 0, segments[2] ?? 0];
}

/**
 * Floor-matches `requestedVersion` against `publishedVersions`: returns the
 * greatest published version that is <= requestedVersion, or `null` if no
 * published version qualifies (every published version is greater than the
 * requested one, or the list is empty).
 *
 * @param publishedVersions — already-fetched list of published base-test
 *   versions (caller's responsibility to fetch, e.g. from a registry).
 * @param requestedVersion — the component version the caller needs a
 *   matching base-test version for (Context 1: app's own pin; Context 2:
 *   ImpactedConsumer.libraryVersion; Context 3: the candidate's new version).
 */
export function resolveBaseTestVersion(
  publishedVersions: readonly string[],
  requestedVersion: string,
): string | null {
  let best: string | null = null;

  for (const published of publishedVersions) {
    if (compareVersions(published, requestedVersion) > 0) {
      continue;
    }
    if (best === null || compareVersions(published, best) > 0) {
      best = published;
    }
  }

  return best;
}
