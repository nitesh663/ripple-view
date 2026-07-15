// fetchPublishedVersions.ts — (US-8.2), T-8.2.2/T-8.2.3.
//
// The real, I/O-performing fetcher of a published `@RippleViewTests/<lib>`
// package's version list from an npm-compatible registry (MVP: local
// Verdaccio,). Kept separate from VersionResolver.ts (which stays pure,
// G13) and injectable everywhere it's used (mirrors gateDeps.ts's
// dependency-injection convention) — callers pass this in, never call it
// from inside a pure function.
//
// `@rippleview/core` stays agnostic (G1): this function knows nothing about any
// particular app, gate, or adoption flow — it is a generic "ask an
// npm-compatible registry for a package's published versions" primitive,
// the same kind of registry concern the registry/gate packages already
// perform elsewhere in this codebase.

/** `(packageName) => Promise<string[]>` — the published-version fetcher contract. */
export type PublishedVersionsFetcher = (packageName: string) => Promise<string[]>;

/**
 * Real fetcher: GETs `<registryUrl>/<packageName>` (npm registry metadata
 * endpoint, what Verdaccio and a real private registry both serve) and
 * returns `Object.keys(body.versions)`. Returns `[]` (not a throw) on a 404
 * — an unpublished package is a real, valid "zero published versions"
 * finding (G10), the caller's resolveBaseTestVersion already treats an
 * empty list as "no qualifying version" -> null.
 */
export function createRegistryVersionsFetcher(registryUrl: string): PublishedVersionsFetcher {
  return async (packageName: string): Promise<string[]> => {
    const encodedName = encodeURIComponent(packageName).replace('%40', '@');
    const url = `${registryUrl.replace(/\/$/, '')}/${encodedName}`;
    const response = await fetch(url);

    if (response.status === 404) {
      return [];
    }
    if (!response.ok) {
      throw new Error(
        `Registry lookup for "${packageName}" failed: ${response.status} ${response.statusText}`,
      );
    }

    const body = (await response.json()) as { versions?: Record<string, unknown> };
    return Object.keys(body.versions ?? {});
  };
}
