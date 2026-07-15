import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverSuites } from './discoverSuites.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFeature(name: string, scenarios: { name: string; tags?: string[]; route?: string }[]) {
  const scenarioBodies = scenarios
    .map((s) => {
      const tags = s.tags ? s.tags.map((t) => `@${t}`).join(' ') + '\n  ' : '';
      const route = s.route ?? '/';
      return `  ${tags}Scenario: ${s.name}\n    Given I am on route "${route}"\n`;
    })
    .join('\n');
  return `Feature: ${name}\n\n${scenarioBodies}`;
}

//  Decision 3: discoverSuites globs *.feature co-located with an
// app's rippleview.config.yaml, non-recursive, sorted alphabetically, pairing
// each with an optional same-basename *.yaml binding.
describe('discoverSuites', () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'rv-discover-suites-'));

    writeFileSync(
      join(dir, 'b-scenario.feature'),
      'Feature: B\n\n  Scenario: B scenario\n    Given I am on route "/"\n',
    );
    writeFileSync(
      join(dir, 'a-scenario.feature'),
      'Feature: A\n\n  Scenario: A scenario\n    Given I am on route "/"\n',
    );
    writeFileSync(
      join(dir, 'a-scenario.yaml'),
      'bindings:\n  - scenario: A scenario\n    scope: main\n',
    );
    // A non-.feature file in the same directory must be ignored.
    writeFileSync(join(dir, 'rippleview.config.yaml'), 'baseUrl: "http://app:8080"\n');
    // A nested subdirectory's .feature file must NOT be discovered (non-recursive).
    const nested = join(dir, 'nested');
    mkdirSync(nested);
    writeFileSync(
      join(nested, 'c-scenario.feature'),
      'Feature: C\n\n  Scenario: C scenario\n    Given I am on route "/"\n',
    );
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('discovers every top-level .feature file, sorted alphabetically', async () => {
    const suites = await discoverSuites(dir);
    expect(suites.map((s) => s.feature.name)).toEqual(['A', 'B']);
  });

  it('pairs a .feature with its same-basename .yaml binding when present', async () => {
    const suites = await discoverSuites(dir);
    const suiteA = suites.find((s) => s.feature.name === 'A');
    expect(suiteA?.scenarios[0]?.binding?.scope).toBe('main');
  });

  it('leaves the binding undefined when no same-basename .yaml exists', async () => {
    const suites = await discoverSuites(dir);
    const suiteB = suites.find((s) => s.feature.name === 'B');
    expect(suiteB?.scenarios[0]?.binding).toBeUndefined();
  });

  it('never descends into subdirectories', async () => {
    const suites = await discoverSuites(dir);
    expect(suites.map((s) => s.feature.name)).not.toContain('C');
  });

  it('returns an empty array when the directory has no .feature files', async () => {
    const emptyDir = mkdtempSync(join(tmpdir(), 'rv-discover-suites-empty-'));
    try {
      const suites = await discoverSuites(emptyDir);
      expect(suites).toEqual([]);
    } finally {
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('returns an empty array when the directory does not exist', async () => {
    const suites = await discoverSuites(join(dir, 'does-not-exist'));
    expect(suites).toEqual([]);
  });
});

// ── US-18.1: imports.yaml base-test import + mount ────────────────────────────

describe('discoverSuites — imports.yaml (US-18.1)', () => {
  let root: string;
  let libDir: string;
  let appDir: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'rv-discover-imports-'));

    // Library suite (workspace layout: <root>/libraries/dropdown/)
    libDir = join(root, 'libraries', 'dropdown');
    mkdirSync(libDir, { recursive: true });
    writeFileSync(
      join(libDir, 'dropdown.feature'),
      makeFeature('op-cc-dropdown', [
        { name: 'Opens the panel', tags: ['smoke', 'open-close'], route: '/lib/dropdown' },
        { name: 'Selecting an option', tags: ['smoke', 'selection'], route: '/lib/dropdown' },
        { name: 'All options visible', tags: ['regression'], route: '/lib/dropdown' },
      ]),
    );
    // Workspace config at root (enables workspace-root library resolution)
    writeFileSync(join(root, 'rippleview.workspace.yaml'), 'version: "1"\nname: test-ws\n');

    // Consumer app
    appDir = join(root, 'apps', 'my-app');
    mkdirSync(appDir, { recursive: true });
    writeFileSync(join(appDir, 'rippleview.config.yaml'), 'baseUrl: "http://app:4200"\n');
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('AC1: imports with use:"all" includes every library scenario', async () => {
    writeFileSync(
      join(appDir, 'imports.yaml'),
      [
        'imports:',
        '  - lib: dropdown',
        '    use: all',
        '    mountedAt:',
        '      route: /cores/dropdown',
        '      region: main',
      ].join('\n'),
    );

    const suites = await discoverSuites(appDir);
    const imported = suites.find((s) => s.feature.name === 'op-cc-dropdown');
    expect(imported).toBeDefined();
    expect(imported!.scenarios).toHaveLength(3);
  });

  it('AC1: tag filter with use:["smoke"] excludes non-smoke scenarios', async () => {
    writeFileSync(
      join(appDir, 'imports.yaml'),
      [
        'imports:',
        '  - lib: dropdown',
        '    use: [smoke]',
        '    mountedAt:',
        '      route: /cores/dropdown',
        '      region: main',
      ].join('\n'),
    );

    const suites = await discoverSuites(appDir);
    const imported = suites.find((s) => s.feature.name === 'op-cc-dropdown');
    expect(imported!.scenarios).toHaveLength(2);
    expect(imported!.scenarios.map((s) => s.scenario.name)).not.toContain('All options visible');
  });

  it('AC1: navigate step is remounted to mountedAt.route', async () => {
    writeFileSync(
      join(appDir, 'imports.yaml'),
      [
        'imports:',
        '  - lib: dropdown',
        '    use: all',
        '    mountedAt:',
        '      route: /cores/dropdown',
        '      region: main',
      ].join('\n'),
    );

    const suites = await discoverSuites(appDir);
    const imported = suites.find((s) => s.feature.name === 'op-cc-dropdown');
    const navStep = imported!.scenarios[0]!.scenario.steps.find((s) =>
      s.text.startsWith('I am on route'),
    );
    expect(navStep!.text).toBe('I am on route "/cores/dropdown"');
  });

  it('AC1: scope-region step is injected after the navigate step', async () => {
    writeFileSync(
      join(appDir, 'imports.yaml'),
      [
        'imports:',
        '  - lib: dropdown',
        '    use: all',
        '    mountedAt:',
        '      route: /cores/dropdown',
        '      region: main',
      ].join('\n'),
    );

    const suites = await discoverSuites(appDir);
    const imported = suites.find((s) => s.feature.name === 'op-cc-dropdown');
    const steps = imported!.scenarios[0]!.scenario.steps;
    // Navigate step comes first so the page loads at the correct URL, then
    // the scope-region step restricts the locator before assertions run.
    expect(steps[0]!.text).toMatch(/^I am on route "/);
    expect(steps[1]!.text).toBe('within the "main" region');
  });

  it('AC2: local app-specific .feature files appear after imported suites', async () => {
    writeFileSync(
      join(appDir, 'imports.yaml'),
      ['imports:', '  - lib: dropdown', '    use: all', '    mountedAt:', '      route: /cores/dropdown', '      region: main'].join('\n'),
    );
    writeFileSync(
      join(appDir, 'app-specific.feature'),
      'Feature: App-specific\n\n  Scenario: My app scenario\n    Given I am on route "/app"\n',
    );

    const suites = await discoverSuites(appDir);
    const names = suites.map((s) => s.feature.name);
    expect(names.indexOf('op-cc-dropdown')).toBeLessThan(names.indexOf('App-specific'));
  });

  it('AC2: extend entries load additional local feature files', async () => {
    const extDir = join(appDir, 'ext');
    mkdirSync(extDir, { recursive: true });
    writeFileSync(
      join(extDir, 'extra.feature'),
      'Feature: Extra\n\n  Scenario: Extra scenario\n    Given I am on route "/extra"\n',
    );
    writeFileSync(
      join(appDir, 'imports.yaml'),
      ['imports: []', 'extend:', '  - ext/extra.feature'].join('\n'),
    );

    const suites = await discoverSuites(appDir);
    expect(suites.some((s) => s.feature.name === 'Extra')).toBe(true);
  });

  it('G10: missing library is silently skipped, not a crash', async () => {
    writeFileSync(
      join(appDir, 'imports.yaml'),
      ['imports:', '  - lib: nonexistent-lib', '    use: all', '    mountedAt:', '      route: /x', '      region: main'].join('\n'),
    );

    const suites = await discoverSuites(appDir);
    // Should not throw — returns local suites only
    expect(Array.isArray(suites)).toBe(true);
  });

  it('G10: malformed imports.yaml is silently skipped', async () => {
    writeFileSync(join(appDir, 'imports.yaml'), ':: not valid yaml ::');
    await expect(discoverSuites(appDir)).resolves.toBeDefined();
  });
});
