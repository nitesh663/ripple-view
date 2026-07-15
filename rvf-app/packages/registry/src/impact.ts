import type { RegistryDocument } from './types.js';

// ── ImpactedConsumer ─────────────────────────────────────────────────────────
// RippleView_DESIGN.md / RippleView_IMPLEMENTATION.md③: "registry -> impacted apps
// + their current versions". (base-test versioning, the central
// invariant) establishes "base-test package version === component version"
// as a hard rule (Context 2: "base tests @ EACH consumer's CURRENT
// version") — so a consumer's base-test version is always its own current
// library pin, never the candidate's.

export interface ImpactedConsumer {
  appName: string;
  /** The consumer's CURRENTLY pinned version of the candidate package. */
  libraryVersion: string;
  /** Always equal to `libraryVersion` — base-test version === component version (design). */
  baseTestVersion: string;
}

export interface ImpactSelectOptions {
  registry: RegistryDocument;
  /** e.g. "angular", "react" — the candidate's OWN framework. */
  framework: string;
  /**
   * The candidate's OWN framework-version bucket — derived the SAME way the
   * scanner derives a library's bucket (its declared peer dependency, not
   * its own semver — ). A candidate whose peer dependency has
   * drifted from its nominal generation (a build/peer-dep-break regression)
   * correctly yields zero consumers here: nothing in that drifted bucket
   * has adopted it yet, which IS the build-break/confidence-0 finding
   * (design: "build -> if fail: confidence=0, report build break"), not
   * a selection bug to work around.
   */
  generation: string;
  /** The candidate's own package name. */
  packageName: string;
}

/**
 * "Given a changed package, then only consumers importing it are selected"
 * (AC-1) — and per AC-2, each selection carries the consumer's current
 * library + base-test version (always equal,).
 *
 * Never throws — an unknown framework/generation/package simply yields an
 * empty selection (G10: findings are data, not a crash).
 */
export function selectImpactedConsumers(opts: ImpactSelectOptions): ImpactedConsumer[] {
  const entry = opts.registry[opts.framework]?.[opts.generation]?.[opts.packageName];
  if (entry === undefined) {
    return [];
  }
  return Object.entries(entry.consumers)
    .map(([appName, libraryVersion]) => ({
      appName,
      libraryVersion,
      baseTestVersion: libraryVersion,
    }))
    .sort((a, b) => a.appName.localeCompare(b.appName));
}
