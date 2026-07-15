import { resolveBaseTestVersion } from './VersionResolver.js';

// checkLockstepPublish.ts — (US-8.3), T-8.3.1.
//
// Design has TWO distinct lockstep rules, not one:
//   - A STABLE release just needs SOME qualifying base-test version to
//     exist — sparse publishing is fine ('s own invariant: "the last
//     version didn't need a base-test update"). What's NOT fine is zero
//     base-test coverage at all (no published version qualifies even via
//     floor-match) — that really is a real gap, not a sparse-publish case.
//   - A PRERELEASE/beta ("Lockstep prereleases. A component beta
//     18.3.3-beta.1 ships a matching base-test beta
//     @RippleViewTests/datagrid@18.3.3-beta.1") requires an EXACT match — a
//     candidate's contract is genuinely unproven, so floor-matching back
//     to an older stable release's tests would silently skip validating
//     the very thing under test.
//
// This is the "release-pipeline hook (example)" T-8.3.1 asks for: a
// release script/CI step calls this with the version about to be
// published and the already-fetched published base-test versions, and
// blocks the release on `passed: false`.

export interface LockstepCheckResult {
  passed: boolean;
  /** The version this release's base tests will actually resolve to, or null if nothing qualifies. */
  resolvedBaseTestVersion: string | null;
  isPrerelease: boolean;
  /** Human-readable, release-checklist-ready explanation. */
  message: string;
}

/**
 * Checks whether `componentVersion` (the version about to be released) has
 * a qualifying base-test version among `publishedBaseTestVersions`. Pure,
 * no I/O (G13) — the caller fetches the published-version list (e.g. via
 * `createRegistryVersionsFetcher`) and passes it in. Never throws (G10) —
 * a failing check is real, valid data for the release pipeline to act on.
 */
export function checkLockstepPublish(
  componentVersion: string,
  publishedBaseTestVersions: readonly string[],
): LockstepCheckResult {
  const isPrerelease = componentVersion.includes('-');

  if (isPrerelease) {
    const exactMatch = publishedBaseTestVersions.includes(componentVersion);
    return {
      passed: exactMatch,
      resolvedBaseTestVersion: exactMatch ? componentVersion : null,
      isPrerelease: true,
      message: exactMatch
        ? `Lockstep prerelease OK: a matching base-test version "${componentVersion}" is published.`
        : `BLOCKED: "${componentVersion}" is a prerelease/beta — design requires an EXACT matching base-test ` +
          `version to be published in lockstep (floor-matching to an older stable release's tests would skip ` +
          `validating the very change this candidate introduces). Publish "@RippleViewTests/<lib>@${componentVersion}" ` +
          `before releasing this candidate.`,
    };
  }

  const resolved = resolveBaseTestVersion(publishedBaseTestVersions, componentVersion);
  return {
    passed: resolved !== null,
    resolvedBaseTestVersion: resolved,
    isPrerelease: false,
    message:
      resolved !== null
        ? `OK: base tests resolve to "${resolved}" (sparse publish is fine — only the decision to update or not ` +
          `needs to have been made, not a new version every release).`
        : `BLOCKED: no published base-test version qualifies for "${componentVersion}" — not even an older one ` +
          `via floor-match. Publish a base-test version at or before "${componentVersion}" before releasing.`,
  };
}
