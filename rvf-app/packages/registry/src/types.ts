import { z } from 'zod';

// ── RegistryDocument ─────────────────────────────────────────────────────────
// Shape from RippleView_DESIGN.md ("Plane 2 — The Registry"): derived (not
// declared) by scanning every package.json across library and consumer
// repos. Grouped framework-version-first — each framework version is a
// distinct namespace (a library's support branch per framework generation).

export const PackageEntrySchema = z.object({
  /** The library's own declared version — sourced from its package.json, not the registry (AC: "repos/lockfiles", an offline scan). */
  latest: z.string(),
  /** consumerAppName -> the version that consumer has pinned. */
  consumers: z.record(z.string(), z.string()),
});

export type PackageEntry = z.infer<typeof PackageEntrySchema>;

/** frameworkVersion ("15", "17", "19", ...) -> packageName -> entry. */
export const FrameworkVersionMapSchema = z.record(
  z.string(),
  z.record(z.string(), PackageEntrySchema),
);

export type FrameworkVersionMap = z.infer<typeof FrameworkVersionMapSchema>;

/** frameworkName ("angular", "react", ...) -> frameworkVersion -> ... */
export const RegistryDocumentSchema = z.record(z.string(), FrameworkVersionMapSchema);

export type RegistryDocument = z.infer<typeof RegistryDocumentSchema>;

// ── Framework detection ──────────────────────────────────────────────────────

export interface FrameworkInfo {
  /** e.g. "angular", "react". */
  framework: string;
  /** Bare major version, e.g. "17". */
  version: string;
}

// ── Scanned package.json facts ───────────────────────────────────────────────

export interface ScannedPackage {
  /** Absolute path to the package.json file that was read. */
  path: string;
  /** The package.json's own `name` field, if present. */
  name: string | undefined;
  /** The package.json's own `version` field, if present. */
  version: string | undefined;
  /** Merged dependencies + devDependencies + peerDependencies (name -> declared range). */
  allDeclaredDeps: Record<string, string>;
  /** dependencies only (what a consumer actually installs and runs against). */
  dependencies: Record<string, string>;
}
