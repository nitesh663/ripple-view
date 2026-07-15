/** A Gherkin tag (the "@" prefix is stripped on parse). */
export interface BddTag {
  name: string;
}

/** A single Gherkin step. */
export interface BddStep {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;
  /** Parsed data table rows (headers become keys). Present only when a | table | follows. */
  dataTable?: readonly Readonly<Record<string, string>>[];
}

/** A single Gherkin Scenario. Feature-level tags are merged in before scenario-level tags. */
export interface BddScenario {
  name: string;
  /** Combined feature tags + scenario-specific tags (feature tags first). */
  tags: readonly BddTag[];
  steps: readonly BddStep[];
}

/** A parsed Gherkin Feature file. */
export interface BddFeature {
  name: string;
  tags: readonly BddTag[];
  scenarios: readonly BddScenario[];
}

/** Per-scenario section of the YAML binding. */
export interface ScenarioBinding {
  /** Must match the Gherkin Scenario name exactly (case-sensitive). */
  scenario: string;
  /** BDD-02 region scope for locator disambiguation. */
  scope?: string;
  /** Seed data references (ORC-03) or inline values. */
  data?: Record<string, unknown>;
  /** Expected values asserted by steps. */
  expected?: Record<string, unknown>;
}

/**
 * A consumer importing a library's published base tests. `lib` names
 * the base-test package's bare library segment (e.g. "datagrid" for
 * `@RippleViewTests/datagrid`) — the actual published version is resolved at run
 * time per the active context (/), never hardcoded here.
 */
export interface ImportEntry {
  lib: string;
  /** "all" tags, or an explicit allow-list of tags to include. */
  use: 'all' | string[];
  mountedAt: { route: string; region: string };
}

/** Top-level YAML binding file. */
export interface YamlBinding {
  feature?: string;
  bindings?: ScenarioBinding[];
  /** Consumer importing library base tests (optional). */
  imports?: ImportEntry[];
  /** Paths to app-specific feature/yaml files that extend the base set (optional). */
  extend?: string[];
}

/** A scenario merged with its optional YAML binding. */
export interface ParsedScenario {
  scenario: BddScenario;
  /** Present when a binding entry whose .scenario matches this scenario's name was found. */
  binding?: ScenarioBinding;
}

/** The result of parsing a .feature + optional .yaml pair. */
export interface ParsedSuite {
  feature: BddFeature;
  scenarios: readonly ParsedScenario[];
}
