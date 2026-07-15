/**
 * schema.mjs — the FixturesManifest oracle schema.
 *
 * Every entry in fixtures.manifest.json is a documented, known-correct
 * expected outcome for one (app x library x candidate version) combination.
 * This is what turns the demo fixture suite into a real test of the
 * framework's CORRECTNESS, not just "it ran without crashing" — see
 * docs/fixtures/ARCHITECTURE.md.
 *
 * Plain JS + zod (no build step needed), matching rv's own root-scripts
 * convention (see rv/scripts/resolve-build-contract.mjs's use of zod/yaml
 * the same way).
 *
 * LAYOUT CONVENTION (enforced below, not just documented):
 *   <framework>/libraries/lib-<gen>/<component>/        e.g. angular/libraries/lib-ng17/data-grid
 * — each generation is a WHOLE SIBLING DIRECTORY (lib-ng15 vs lib-ng17),
 *     simulating "check out a different branch"; <gen> is "ng15"/"ng17" for
 *     angular, "r18"/"r19" for react.
 *   <framework>/apps/<genPrefix>-<gen>/<app>/           e.g. angular/apps/ng-17/orders-app
 * — apps nest the generation as its OWN directory level (deliberately asymmetric with the libraries convention above — each
 *     generation's apps are a real multi-project Angular CLI workspace, one
 *     workspace per generation, mirroring how lib-ng15/lib-ng17 are each one
 *     workspace with multiple `projects/`). <genPrefix> is "ng" for angular,
 *     "r" for react.
 * The schema's own `generation` field stays the bare major version ("17",
 * "18") since that's the registry's actual namespace key (per the design docs);
 * only the directory names carry the ng/r prefix.
 */

import { z } from 'zod';

// ── Signal tags (AC-3: at least one fixture per detectable signal) ─────────
// Explicit, so coverage can be asserted in a test rather than only documented
// in prose.
export const SIGNALS = [
  'visual-regression',
  'build-peer-dep-break',
  'semantic-regression',
  'drift-only',
  'generations-behind',
  'layer0',
  'accepted-bug-unknown-confidence',
];

const FRAMEWORK_GEN_PREFIX = { angular: 'ng', react: 'r' };
const FrameworkSchema = z.enum(['angular', 'react']);

/** e.g. ('angular', '17') -> 'ng17'; ('react', '18') -> 'r18'. */
function generationToken(framework, generation) {
  return `${FRAMEWORK_GEN_PREFIX[framework]}${generation}`;
}

/** e.g. ('angular', '17') -> 'ng-17'; ('react', '18') -> 'r-18'. Apps nest this as their own dir level. */
function appGenerationDir(framework, generation) {
  return `${FRAMEWORK_GEN_PREFIX[framework]}-${generation}`;
}

const AppRefSchema = z.object({
  /** Logical app name, WITHOUT a generation suffix, e.g. "orders-app". */
  name: z.string().regex(/^[a-z][a-z0-9-]*$/, 'app.name must be lowercase-kebab, no generation suffix'),
  framework: FrameworkSchema,
  /** Framework generation namespace, e.g. "15", "17", "18", "19" (major version only). */
  generation: z.string().regex(/^\d+$/, 'app.generation must be a bare major version, e.g. "17"'),
  /** Repo-relative path: <framework>/apps/<genPrefix>-<gen>/<name>/ — the generation is its own dir level. */
  path: z.string().regex(/^(angular|react)\/apps\/(ng|r)-\d+\/[a-z][a-z0-9-]*$/, 'app.path must match <framework>/apps/<genPrefix>-<gen>/<name>'),
});

const LibraryRefSchema = z.object({
  /** Published package name, e.g. "@op/data-grid" — SAME across generations. */
  name: z.string(),
  /** The CANDIDATE version under test for this fixture, e.g. "17.2.0" */
  version: z.string(),
  /**
   * Repo-relative path: <framework>/libraries/lib-<gen>/<component>/ — a
   * whole sibling directory per generation. The optional `projects/` segment
   * accommodates a real `ng generate library` Angular CLI workspace (
   * learned this the hard way: lib-ng15 is a full workspace, not a single
   * package, so its buildable projects nest one level deeper).
   */
  path: z.string().regex(/^(angular|react)\/libraries\/lib-(ng|r)\d+\/(projects\/)?[a-z][a-z0-9-]*$/, 'library.path must match <framework>/libraries/lib-<gen>/[projects/]<component>'),
});

export const FixtureEntrySchema = z
  .object({
    id: z.string(),
    app: AppRefSchema,
    library: LibraryRefSchema,
    expectedVerdict: z.enum(['pass', 'fail', 'errored']),
    expectedFindingClass: z.enum(['visual', 'build', 'semantic', 'layer0', 'none']),
    // 'zero' is distinct from 'low': design — "Build failure against the
    // candidate => confidence = 0" is a deterministic guarantee, not merely a
    // low score.
    expectedConfidence: z.enum(['high', 'medium', 'low', 'zero', 'unknown']),
    expectedDrift: z.enum(['none', 'low', 'high']),
    signal: z.enum(SIGNALS),
    /** Accepted intentional change — must not depress confidence (design). */
    acceptedBug: z.boolean().default(false),
    /** Never run through the gate — confidence MUST be 'unknown', forced below. */
    neverGated: z.boolean().default(false),
    /** The oracle's reasoning — why this verdict is correct. Required, not optional. */
    notes: z.string().min(1),
  })
  .superRefine((entry, ctx) => {
    if (entry.neverGated && entry.expectedConfidence !== 'unknown') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'neverGated fixtures must have expectedConfidence "unknown" (design: never gated => Unknown, not a number).',
        path: ['expectedConfidence'],
      });
    }

    // app.path must exactly equal <framework>/apps/<genPrefix>-<gen>/<name>
    // — catches copy-paste mistakes where framework/generation/name fields
    // disagree with the literal path.
    const expectedAppPath = `${entry.app.framework}/apps/${appGenerationDir(entry.app.framework, entry.app.generation)}/${entry.app.name}`;
    if (entry.app.path !== expectedAppPath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `app.path "${entry.app.path}" does not match framework/generation/name (expected "${expectedAppPath}").`,
        path: ['app', 'path'],
      });
    }

    // library.path must live under the SAME framework as the consuming app
    // (a library can't be angular/ while the consumer is react/) and its
    // lib-<gen> segment must be derivable from the candidate version's major.
    const libMajor = entry.library.version.split('.')[0];
    const libToken = generationToken(entry.app.framework, libMajor);
    const expectedLibPathPrefix = `${entry.app.framework}/libraries/lib-${libToken}/`;
    if (!entry.library.path.startsWith(expectedLibPathPrefix)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `library.path "${entry.library.path}" does not match candidate version "${entry.library.version}"'s major (expected to start with ${expectedLibPathPrefix}).`,
        path: ['library', 'path'],
      });
    }
  });

export const FixturesManifestSchema = z.object({
  version: z.literal('1'),
  fixtures: z.array(FixtureEntrySchema),
});
