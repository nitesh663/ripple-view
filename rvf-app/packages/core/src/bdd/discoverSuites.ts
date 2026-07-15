import { readdir, readFile, stat } from 'node:fs/promises';
import { join, basename, extname, dirname } from 'node:path';
import type { BddStep, ImportEntry, ParsedScenario, ParsedSuite } from './types.js';
import { parseSuiteFiles } from './suite.js';
import { parseYamlBinding } from './yaml-parser.js';

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Discovers an app's scenario suites: its own co-located `.feature` files
 * plus any base-test suites declared in `imports.yaml` (US-18.1).
 *
 * **Local discovery** (Decision 3): flat, non-recursive glob of `*.feature`
 * files in `appConfigDir`, each paired with an optional same-basename `.yaml`.
 *
 * **Import resolution** (US-18.1 AC1/AC2): if `imports.yaml` exists in
 * `appConfigDir`, each `imports` entry resolves the named library suite,
 * applies tag filtering (AC1), remounts the scenarios at `mountedAt.route`
 * and scopes them to `mountedAt.region`. `extend` entries load additional
 * local feature files relative to `appConfigDir` (AC2).
 *
 * G13: all file lists are sorted alphabetically for a deterministic run order.
 * G10: a missing library directory or an unresolvable import is skipped (not a
 *      crash); `imports.yaml` parse errors are also silently skipped.
 * G1/G11: parsing is delegated to `parseSuiteFiles` / `parseYamlBinding` — this
 *          function only owns discovery and mounting logic.
 */
export async function discoverSuites(appConfigDir: string): Promise<ParsedSuite[]> {
  // ── 1. Local feature files ──────────────────────────────────────────────────
  const featureFiles = await listFeatureFiles(appConfigDir);
  const pairedYamlNames = new Set<string>();
  const localSuites: ParsedSuite[] = [];

  for (const featureFile of featureFiles) {
    const featurePath = join(appConfigDir, featureFile);
    const yamlName = `${basename(featureFile, '.feature')}.yaml`;
    const yamlPath = join(appConfigDir, yamlName);
    const hasYaml = await fileExists(yamlPath);
    if (hasYaml) pairedYamlNames.add(yamlName);
    const suite = await parseSuiteFiles(featurePath, hasYaml ? yamlPath : undefined);
    localSuites.push(suite);
  }

  // ── 2. imports.yaml (US-18.1) ──────────────────────────────────────────────
  const importsYamlPath = join(appConfigDir, 'imports.yaml');
  const importedSuites: ParsedSuite[] = [];

  if (await fileExists(importsYamlPath)) {
    const yamlSource = await readFile(importsYamlPath, 'utf8').catch(() => null);
    if (yamlSource !== null) {
      let binding;
      try {
        binding = parseYamlBinding(yamlSource, importsYamlPath);
      } catch {
        // Malformed imports.yaml is a warning, not a crash (G10).
        binding = undefined;
      }

      if (binding !== undefined) {
        // Process imports entries
        for (const entry of binding.imports ?? []) {
          const libDir = await resolveLibDir(entry.lib, appConfigDir);
          if (libDir === null) continue; // library not found — skip (G10)
          const libSuites = await discoverLocalSuites(libDir);
          for (const suite of libSuites) {
            importedSuites.push(mountSuite(suite, entry));
          }
        }

        // Process extend entries (AC2)
        for (const extRelPath of binding.extend ?? []) {
          const featurePath = join(appConfigDir, extRelPath);
          const yamlPath = featurePath.replace(/\.feature$/, '.yaml');
          const hasYaml = await fileExists(yamlPath);
          try {
            const suite = await parseSuiteFiles(featurePath, hasYaml ? yamlPath : undefined);
            importedSuites.push(suite);
          } catch {
            // Unreadable extend file — skip (G10)
          }
        }
      }
    }
  }

  // Imported suites first (base tests), local suites second (app-specific, AC2).
  return [...importedSuites, ...localSuites];
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Discover only the local `.feature` suites in `dir` without processing any
 * `imports.yaml`. Used for library suite discovery to avoid recursion.
 */
async function discoverLocalSuites(dir: string): Promise<ParsedSuite[]> {
  const featureFiles = await listFeatureFiles(dir);
  const suites: ParsedSuite[] = [];
  for (const featureFile of featureFiles) {
    const featurePath = join(dir, featureFile);
    const yamlPath = join(dir, `${basename(featureFile, '.feature')}.yaml`);
    const hasYaml = await fileExists(yamlPath);
    const suite = await parseSuiteFiles(featurePath, hasYaml ? yamlPath : undefined);
    suites.push(suite);
  }
  return suites;
}

/**
 * Apply `mountedAt` + tag filtering to a library suite (US-18.1 AC1/AC3).
 *
 * - Scenarios whose tags don't match `entry.use` are excluded (AC1).
 * - Navigate step routes are replaced with `mountedAt.route`.
 * - A `within the "<region>" region` scope step is prepended so every
 *   subsequent locator call is scoped to `mountedAt.region` (G2/BDD-02).
 */
function mountSuite(suite: ParsedSuite, entry: ImportEntry): ParsedSuite {
  const filtered: ParsedScenario[] = suite.scenarios
    .filter((ps) => scenarioMatchesTags(ps, entry.use))
    .map((ps) => {
      const hasNavigate = ps.scenario.steps.some((s) => /^I am on route "/.test(s.text));
      // Replace existing navigate steps, or inject one at the front if route-free (library base tests).
      const remounted = hasNavigate
        ? ps.scenario.steps.map((step) => remountNavigateStep(step, entry.mountedAt.route))
        : [
            { keyword: 'Given' as const, text: `I am on route "${entry.mountedAt.route}"` },
            ...ps.scenario.steps,
          ];

      const scopeStep: BddStep = {
        keyword: 'Given',
        text: `within the "${entry.mountedAt.region}" region`,
      };

      // Order: navigate → scope-region → scenario steps (scope after navigate so
      // the locator is scoped before any assertions run, but navigation itself is global).
      const navStep = remounted[0]?.text.startsWith('I am on route') ? remounted[0] : undefined;
      const rest = navStep ? remounted.slice(1) : remounted;
      const steps = [
        ...(navStep ? [navStep] : []),
        ...(entry.mountedAt.region ? [scopeStep] : []),
        ...rest,
      ];

      return { scenario: { ...ps.scenario, steps }, ...(ps.binding ? { binding: ps.binding } : {}) };
    });

  return { feature: suite.feature, scenarios: filtered };
}

/** AC1: a scenario passes the filter when `use` is "all" or any tag name matches. */
function scenarioMatchesTags(ps: ParsedScenario, use: ImportEntry['use']): boolean {
  if (use === 'all') return true;
  return ps.scenario.tags.some((t) => (use as string[]).includes(t.name));
}

/** Replace the route in `I am on route "…"` steps (G13 determinism: exact text transform). */
function remountNavigateStep(step: BddStep, route: string): BddStep {
  if (/^I am on route "/.test(step.text)) {
    return { ...step, text: `I am on route "${route}"` };
  }
  return step;
}

/**
 * Resolve a library's base-test directory by library name.
 *
 * Search order (G8 — must work on Mac/Windows/Linux):
 *  1. `node_modules/@RippleViewTests/<lib>` — walk up from appConfigDir
 *     (installed npm/workspace package).
 *  2. `<workspaceRoot>/libraries/<lib>` — walk up to find the nearest
 *     `rippleview.workspace.yaml`, then look in its sibling `libraries/` dir
 *     (matches the `ripple-view-tests` repo layout: packages: libraries/*).
 *
 * Returns null when the library is not found — callers skip silently (G10).
 */
async function resolveLibDir(lib: string, appConfigDir: string): Promise<string | null> {
  // 1. node_modules walk-up
  let dir = appConfigDir;
  while (true) {
    const candidate = join(dir, 'node_modules', '@RippleViewTests', lib);
    if (await fileExists(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // 2. workspace root walk-up — look for rippleview.workspace.yaml, then libraries/<lib>
  dir = appConfigDir;
  while (true) {
    const wsConfig = join(dir, 'rippleview.workspace.yaml');
    if (await fileExists(wsConfig)) {
      const libCandidate = join(dir, 'libraries', lib);
      if (await fileExists(libCandidate)) return libCandidate;
      break; // found workspace root but no matching library — stop walking
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

/** List `*.feature` filenames directly inside `dir`, sorted alphabetically. */
async function listFeatureFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.isFile() && extname(entry.name) === '.feature')
    .map((entry) => entry.name)
    .sort();
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
