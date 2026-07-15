// resolveImport.ts — (US-8.2), T-8.2.3.
//
// The literal "import resolution" the story's AC requires: given a parsed
// `imports:` entry (packages/core/src/bdd/types.ts's ImportEntry) and
// a requested version for the active context, determine WHICH published
// version of `@RippleViewTests/<lib>` should actually be loaded. Composes the
// pure VersionResolver with an injected published-versions fetcher — never
// does I/O itself, never decides what to do with a null floor-match (that
// is VersionResolutionError's job, raised here because resolveImport's
// contract promises a real version back to its caller, not a nullable one).

import type { ImportEntry } from '../bdd/types.js';
import { resolveBaseTestVersion } from './VersionResolver.js';
import { VersionResolutionError } from './VersionResolutionError.js';
import type { PublishedVersionsFetcher } from './fetchPublishedVersions.js';

/** The resolved `@RippleViewTests/<lib>` package name + the floor-matched version to load. */
export interface ResolvedImport {
  lib: string;
  /** The `@RippleViewTests/<lib>` published package name. */
  packageName: string;
  version: string;
}

export interface ResolveImportOptions {
  importEntry: ImportEntry;
  /**
   * The version to resolve against for the active context:
   * Context 1 — the app's own pinned component version;
   * Context 2 — a consumer's ImpactedConsumer.libraryVersion (current);
   * Context 3 — the candidate's new/adopted version.
   */
  requestedVersion: string;
  fetchPublishedVersions: PublishedVersionsFetcher;
}

/**
 * Resolves an `imports:` entry to a concrete `@RippleViewTests/<lib>` version.
 * Throws `VersionResolutionError` when no published version qualifies —
 * that decision belongs at this boundary (a caller that asked to import a
 * specific lib needs an actual version back), unlike the pure resolver
 * underneath, which returns `null` and never throws (G10).
 */
export async function resolveImport(options: ResolveImportOptions): Promise<ResolvedImport> {
  const { importEntry, requestedVersion, fetchPublishedVersions } = options;
  const packageName = `@RippleViewTests/${importEntry.lib}`;

  const publishedVersions = await fetchPublishedVersions(packageName);
  const resolved = resolveBaseTestVersion(publishedVersions, requestedVersion);

  if (resolved === null) {
    throw new VersionResolutionError({
      code: 'NO_QUALIFYING_BASE_TEST_VERSION',
      lib: importEntry.lib,
      requestedVersion,
    });
  }

  return { lib: importEntry.lib, packageName, version: resolved };
}
