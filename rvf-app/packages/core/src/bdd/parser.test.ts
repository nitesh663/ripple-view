import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFeature, parseYamlBinding, parseSuite, parseSuiteFiles } from './parser.js';
import { ParseError } from './ParseError.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES = join(__dirname, '__fixtures__');

const SORT_FEATURE = readFileSync(join(FIXTURES, 'sort.feature'), 'utf8');
const SORT_YAML = readFileSync(join(FIXTURES, 'sort.yaml'), 'utf8');

// ── AC-1: Valid .feature + .yaml → scenarios produced ─────────────────────────

describe('AC-1: parseFeature — valid .feature', () => {
  it('parses feature name', () => {
    const f = parseFeature(SORT_FEATURE);
    expect(f.name).toBe('Grid sorting');
  });

  it('parses feature-level tags', () => {
    const f = parseFeature(SORT_FEATURE);
    expect(f.tags).toEqual([{ name: 'smoke' }]);
  });

  it('produces correct number of scenarios', () => {
    const f = parseFeature(SORT_FEATURE);
    expect(f.scenarios).toHaveLength(2);
  });

  it('parses scenario names', () => {
    const f = parseFeature(SORT_FEATURE);
    expect(f.scenarios[0]?.name).toBe('Sort by name ascending');
    expect(f.scenarios[1]?.name).toBe('Sort by date descending');
  });

  it('parses steps with correct keywords', () => {
    const f = parseFeature(SORT_FEATURE);
    const steps = f.scenarios[0]?.steps ?? [];
    expect(steps).toHaveLength(3);
    expect(steps[0]?.keyword).toBe('Given');
    expect(steps[1]?.keyword).toBe('When');
    expect(steps[2]?.keyword).toBe('Then');
  });

  it('parses step text correctly', () => {
    const f = parseFeature(SORT_FEATURE);
    expect(f.scenarios[0]?.steps[0]?.text).toBe('a grid with at least 3 rows');
    expect(f.scenarios[0]?.steps[1]?.text).toBe('I activate the button "Sort by Name"');
  });
});

describe('AC-1: parseYamlBinding — valid .yaml', () => {
  it('parses feature name from binding', () => {
    const b = parseYamlBinding(SORT_YAML);
    expect(b.feature).toBe('Grid sorting');
  });

  it('parses bindings array', () => {
    const b = parseYamlBinding(SORT_YAML);
    expect(b.bindings).toHaveLength(2);
  });

  it('parses binding scope', () => {
    const b = parseYamlBinding(SORT_YAML);
    expect(b.bindings?.[0]?.scope).toBe('main-grid');
  });

  it('parses binding data', () => {
    const b = parseYamlBinding(SORT_YAML);
    expect(b.bindings?.[0]?.data).toEqual({ seedRef: 'users' });
  });

  it('parses binding expected values', () => {
    const b = parseYamlBinding(SORT_YAML);
    expect(b.bindings?.[0]?.expected).toEqual({ firstRow: 'Alice' });
  });
});

//  (US-8.2), T-8.2.3 — `imports`/`extend`: a consumer
// importing a library's published base tests, plus app-specific extension
// paths. Parsed but version-resolution-agnostic here — resolution itself is
// VersionResolver/resolveImport's job (packages/core/src/tests/).
describe('AC-1: parseYamlBinding — imports/extend', () => {
  it('parses a full imports entry with use: "all"', () => {
    const yaml = [
      'feature: App feature',
      'imports:',
      '  - lib: datagrid',
      '    use: all',
      '    mountedAt: { route: "/orders", region: "main" }',
    ].join('\n');
    const b = parseYamlBinding(yaml);
    expect(b.imports).toEqual([
      { lib: 'datagrid', use: 'all', mountedAt: { route: '/orders', region: 'main' } },
    ]);
  });

  it('parses an imports entry with an explicit tag allow-list', () => {
    const yaml = [
      'feature: App feature',
      'imports:',
      '  - lib: datagrid',
      '    use: [smoke, functional]',
      '    mountedAt: { route: "/orders", region: "main" }',
    ].join('\n');
    const b = parseYamlBinding(yaml);
    expect(b.imports?.[0]?.use).toEqual(['smoke', 'functional']);
  });

  it('parses extend as a list of app-specific paths', () => {
    const yaml = ['feature: App feature', 'extend:', '  - ./app-specific.feature'].join('\n');
    const b = parseYamlBinding(yaml);
    expect(b.extend).toEqual(['./app-specific.feature']);
  });
});

describe('AC-1: parseSuite — combined feature + yaml', () => {
  it('joins scenarios with their bindings by name', () => {
    const suite = parseSuite(SORT_FEATURE, SORT_YAML);
    expect(suite.scenarios).toHaveLength(2);
    expect(suite.scenarios[0]?.binding?.scope).toBe('main-grid');
    expect(suite.scenarios[1]?.binding?.scope).toBe('main-grid');
  });

  it('works without a yaml binding (feature-only)', () => {
    const suite = parseSuite(SORT_FEATURE);
    expect(suite.scenarios).toHaveLength(2);
    expect(suite.scenarios[0]?.binding).toBeUndefined();
  });

  it('parseSuiteFiles reads from disk', async () => {
    const suite = await parseSuiteFiles(
      join(FIXTURES, 'sort.feature'),
      join(FIXTURES, 'sort.yaml'),
    );
    expect(suite.feature.name).toBe('Grid sorting');
    expect(suite.scenarios[0]?.binding?.scope).toBe('main-grid');
  });
});

// ── T-3.1.2: Tag model ────────────────────────────────────────────────────────

describe('T-3.1.2: Tag model', () => {
  it('feature-level tags are present on all scenarios', () => {
    const f = parseFeature(SORT_FEATURE);
    for (const scenario of f.scenarios) {
      expect(scenario.tags.map((t) => t.name)).toContain('smoke');
    }
  });

  it('scenario-level tags are additive (not replacing feature tags)', () => {
    const f = parseFeature(SORT_FEATURE);
    const first = f.scenarios[0];
    expect(first?.tags.map((t) => t.name)).toContain('smoke');
    expect(first?.tags.map((t) => t.name)).toContain('regression');
    expect(first?.tags.map((t) => t.name)).toContain('sort');
  });

  it('@sort tag present on second scenario, @regression not present', () => {
    const f = parseFeature(SORT_FEATURE);
    const second = f.scenarios[1];
    const tagNames = second?.tags.map((t) => t.name) ?? [];
    expect(tagNames).toContain('sort');
    expect(tagNames).not.toContain('regression');
  });

  it('feature-level tags come before scenario-level tags', () => {
    const f = parseFeature(SORT_FEATURE);
    const first = f.scenarios[0];
    const names = first?.tags.map((t) => t.name) ?? [];
    expect(names[0]).toBe('smoke');
  });

  it('can filter scenarios by tag', () => {
    const f = parseFeature(SORT_FEATURE);
    const regressionScenarios = f.scenarios.filter((s) =>
      s.tags.some((t) => t.name === 'regression'),
    );
    expect(regressionScenarios).toHaveLength(1);
    expect(regressionScenarios[0]?.name).toBe('Sort by name ascending');
  });

  it('can filter scenarios by @sort tag', () => {
    const f = parseFeature(SORT_FEATURE);
    const sortScenarios = f.scenarios.filter((s) => s.tags.some((t) => t.name === 'sort'));
    expect(sortScenarios).toHaveLength(2);
  });
});

// ── AC-2: Malformed files → precise errors ────────────────────────────────────

describe('AC-2: malformed files raise precise ParseError', () => {
  it('empty string → PARSE_GHERKIN_ERROR with meaningful message', () => {
    expect(() => parseFeature('')).toThrow(ParseError);
    try {
      parseFeature('');
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError);
      expect((e as ParseError).code).toBe('PARSE_GHERKIN_ERROR');
    }
  });

  it('missing Feature: keyword → PARSE_GHERKIN_ERROR', () => {
    const bad = `Scenario: something\n  Given a step`;
    expect(() => parseFeature(bad)).toThrow(ParseError);
    try {
      parseFeature(bad);
    } catch (e) {
      expect((e as ParseError).code).toBe('PARSE_GHERKIN_ERROR');
      expect((e as ParseError).line).toBe(1);
    }
  });

  it('step outside scenario → PARSE_GHERKIN_ERROR with line number', () => {
    const bad = `Feature: Test\nGiven a step without scenario`;
    try {
      parseFeature(bad);
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError);
      expect((e as ParseError).code).toBe('PARSE_GHERKIN_ERROR');
      expect((e as ParseError).line).toBeGreaterThan(0);
    }
  });

  it('invalid YAML → PARSE_YAML_ERROR', () => {
    expect(() => parseYamlBinding('{')).toThrow(ParseError);
    try {
      parseYamlBinding('{');
    } catch (e) {
      expect((e as ParseError).code).toBe('PARSE_YAML_ERROR');
    }
  });

  it('YAML with wrong bindings type → PARSE_YAML_ERROR', () => {
    const bad = 'feature: Test\nbindings: "not-an-array"';
    expect(() => parseYamlBinding(bad)).toThrow(ParseError);
    try {
      parseYamlBinding(bad);
    } catch (e) {
      expect((e as ParseError).code).toBe('PARSE_YAML_ERROR');
    }
  });

  it('YAML binding entry missing scenario field → PARSE_YAML_ERROR', () => {
    const bad = 'feature: Test\nbindings:\n  - scope: main';
    expect(() => parseYamlBinding(bad)).toThrow(ParseError);
  });

  it('imports field not an array → PARSE_YAML_ERROR', () => {
    const bad = 'feature: Test\nimports: "not-an-array"';
    expect(() => parseYamlBinding(bad)).toThrow(ParseError);
  });

  it('imports entry missing lib → PARSE_YAML_ERROR', () => {
    const bad =
      'feature: Test\nimports:\n  - use: all\n    mountedAt: { route: "/x", region: "y" }';
    expect(() => parseYamlBinding(bad)).toThrow(ParseError);
  });

  it('imports entry with invalid use (not "all" or string array) → PARSE_YAML_ERROR', () => {
    const bad =
      'feature: Test\nimports:\n  - lib: datagrid\n    use: 123\n    mountedAt: { route: "/x", region: "y" }';
    expect(() => parseYamlBinding(bad)).toThrow(ParseError);
  });

  it('imports entry missing mountedAt → PARSE_YAML_ERROR', () => {
    const bad = 'feature: Test\nimports:\n  - lib: datagrid\n    use: all';
    expect(() => parseYamlBinding(bad)).toThrow(ParseError);
  });

  it('extend field not an array of strings → PARSE_YAML_ERROR', () => {
    const bad = 'feature: Test\nextend:\n  - 123';
    expect(() => parseYamlBinding(bad)).toThrow(ParseError);
  });

  it('parseSuiteFiles rejects non-existent feature file with PARSE_GHERKIN_ERROR', async () => {
    await expect(parseSuiteFiles('/non/existent.feature')).rejects.toThrow(ParseError);
    try {
      await parseSuiteFiles('/non/existent.feature');
    } catch (e) {
      expect((e as ParseError).code).toBe('PARSE_GHERKIN_ERROR');
    }
  });
});

// ── Data table parsing ────────────────────────────────────────────────────────

describe('Data table parsing', () => {
  it('parses an inline data table on a step', () => {
    const src = [
      'Feature: Tables',
      '  Scenario: With table',
      '    Given the following data',
      '      | name  | age |',
      '      | Alice | 30  |',
      '      | Bob   | 25  |',
    ].join('\n');
    const f = parseFeature(src);
    const step = f.scenarios[0]?.steps[0];
    expect(step?.dataTable).toHaveLength(2);
    expect(step?.dataTable?.[0]).toEqual({ name: 'Alice', age: '30' });
    expect(step?.dataTable?.[1]).toEqual({ name: 'Bob', age: '25' });
  });
});
