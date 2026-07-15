import { dirname, basename } from 'node:path';
import { findPackageJsonFiles, readScannedPackage } from './walk.js';
import { detectFramework } from './detectFramework.js';
import type { RegistryDocument, ScannedPackage } from './types.js';

export interface ScanOptions {
  /** One or more repo/workspace root directories to scan ("repos/lockfiles" — AC). */
  roots: string[];
  /**
   * Package names the registry tracks (e.g. `@enterprise/core-controls`).
   * Sourced from the workspace config's existing `packages` field — no new
   * config shape needed; "derived, not declared" applies to the scan
   * algorithm, not to which packages are in scope.
   */
  trackedPackages: string[];
}

/**
 * A library's generation/framework bucket is derived from its OWN declared
 * dependency on the framework (peerDependencies, where a real Angular/React
 * library legitimately declares it) — NOT from the library's own semver.
 * RippleView_DESIGN.md's own example proves this: `@enterprise/theme` sits in
 * the "17" bucket while its own `latest` is "5.1.0" — version and
 * generation are independent axes for a library. A library whose declared
 * peer dependency drifts from its own version (e.g. a deliberate
 * build/peer-dep-break regression claiming a newer major) is correctly
 * bucketed under the major it now CLAIMS to target — that drift is itself
 * a real, useful registry signal, not noise to suppress.
 */
function libraryFrameworkInfo(
  pkg: ScannedPackage,
): { framework: string; generation: string } | null {
  const detected = detectFramework(pkg.allDeclaredDeps);
  if (detected === null) {
    return null;
  }
  return { framework: detected.framework, generation: detected.version };
}

/**
 * A consumer's generation/framework is derived from its OWN runtime
 * dependency on the framework (e.g. `@angular/core` in `dependencies`) —
 * this answers "what framework version does this app actually run", which
 * is the design's own framing (RippleView_DESIGN.md): each framework version
 * is a distinct namespace.
 */
function consumerFrameworkInfo(
  pkg: ScannedPackage,
): { framework: string; generation: string } | null {
  const detected = detectFramework(pkg.dependencies);
  if (detected === null) {
    return null;
  }
  return { framework: detected.framework, generation: detected.version };
}

function ensurePackageEntry(
  registry: RegistryDocument,
  framework: string,
  generation: string,
  packageName: string,
): { latest: string; consumers: Record<string, string> } {
  registry[framework] ??= {};
  const frameworkMap = registry[framework];
  frameworkMap[generation] ??= {};
  const generationMap = frameworkMap[generation];
  generationMap[packageName] ??= { latest: '', consumers: {} };
  return generationMap[packageName];
}

/**
 * Scan every package.json under `roots`, classify each as a library (its
 * own `name` is in `trackedPackages`) and/or a consumer (it depends on a
 * tracked package), and assemble the framework -> version -> package ->
 * { latest, consumers } document from RippleView_DESIGN.md
 *
 * Never throws — malformed package.json files are skipped, not fatal
 * (G10: findings are data, a scan failure on one file shouldn't abort the
 * whole graph).
 */
export function scanRegistry(opts: ScanOptions): RegistryDocument {
  const tracked = new Set(opts.trackedPackages);
  const registry: RegistryDocument = {};

  const allPackages: ScannedPackage[] = [];
  for (const root of opts.roots) {
    for (const path of findPackageJsonFiles(root)) {
      const pkg = readScannedPackage(path);
      if (pkg !== null) {
        allPackages.push(pkg);
      }
    }
  }

  // Pass 1: libraries — seed `latest` from each tracked package's own source.
  for (const pkg of allPackages) {
    if (pkg.name === undefined || !tracked.has(pkg.name) || pkg.version === undefined) {
      continue;
    }
    const info = libraryFrameworkInfo(pkg);
    if (info === null) {
      continue;
    }
    const entry = ensurePackageEntry(registry, info.framework, info.generation, pkg.name);
    entry.latest = pkg.version;
  }

  // Pass 2: consumers — record every tracked-package dependency this app pins.
  for (const pkg of allPackages) {
    const consumerInfo = consumerFrameworkInfo(pkg);
    if (consumerInfo === null) {
      continue;
    }
    const consumerName = pkg.name ?? basename(dirname(pkg.path));
    for (const [depName, depRange] of Object.entries(pkg.dependencies)) {
      if (!tracked.has(depName)) {
        continue;
      }
      const entry = ensurePackageEntry(
        registry,
        consumerInfo.framework,
        consumerInfo.generation,
        depName,
      );
      entry.consumers[consumerName] = depRange;
    }
  }

  return registry;
}
