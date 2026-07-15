import type { FrameworkInfo } from './types.js';

// ── Framework markers ───────────────────────────────────────────────────────
// Checked in order; the first match wins. New frameworks are added here, not
// scattered through scanner.ts (G1: app/framework specifics stay in one place).

const FRAMEWORK_MARKERS: { framework: string; packageName: string }[] = [
  { framework: 'angular', packageName: '@angular/core' },
  { framework: 'react', packageName: 'react' },
];

/**
 * Extract the bare major version from a semver range string, e.g.
 * "^17.3.12" -> "17", "~0.14.4" -> "0", "17.0.0" -> "17".
 * Returns null if no leading integer can be parsed.
 */
export function majorVersionOf(range: string): string | null {
  const match = /\d+/.exec(range);
  return match ? match[0] : null;
}

/**
 * Detect a package.json's framework + major version from its OWN declared
 * dependencies (dependencies + devDependencies + peerDependencies).
 *
 * Deliberately does NOT consult peerDependencies alone for this — a
 * library's peerDependencies can be a deliberately broken fixture (e.g. a
 * build/peer-dep-break regression that claims a newer major than the library
 * actually targets). Framework detection instead looks at whichever
 * dependency map the caller passes in, letting the caller decide between
 * "this package's own declared version" (library) and "this package's own
 * framework dependency" (consumer) — see scanner.ts.
 */
export function detectFramework(declaredDeps: Record<string, string>): FrameworkInfo | null {
  for (const marker of FRAMEWORK_MARKERS) {
    const range = declaredDeps[marker.packageName];
    if (range === undefined) {
      continue;
    }
    const version = majorVersionOf(range);
    if (version === null) {
      continue;
    }
    return { framework: marker.framework, version };
  }
  return null;
}
