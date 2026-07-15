import { parse as parseYaml } from 'yaml';
import type { YamlBinding, ScenarioBinding, ImportEntry } from './types.js';
import { ParseError } from './ParseError.js';

/**
 * Parse a YAML binding string into a YamlBinding.
 * Throws ParseError (PARSE_YAML_ERROR) on malformed YAML or wrong shape.
 */
export function parseYamlBinding(source: string, file?: string): YamlBinding {
  let parsed: unknown;

  try {
    parsed = parseYaml(source);
  } catch (err) {
    throw new ParseError({
      code: 'PARSE_YAML_ERROR',
      message: `YAML parse failed: ${String(err instanceof Error ? err.message : err)}`,
      ...(file !== undefined ? { file } : {}),
      cause: err,
    });
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ParseError({
      code: 'PARSE_YAML_ERROR',
      message: 'YAML binding must be a mapping (object) at the top level',
      ...(file !== undefined ? { file } : {}),
    });
  }

  const raw = parsed as Record<string, unknown>;
  const binding: YamlBinding = {};

  if (raw['feature'] !== undefined) {
    if (typeof raw['feature'] !== 'string') {
      throw new ParseError({
        code: 'PARSE_YAML_ERROR',
        message: '"feature" field must be a string',
        ...(file !== undefined ? { file } : {}),
      });
    }
    binding.feature = raw['feature'];
  }

  if (raw['bindings'] !== undefined) {
    if (!Array.isArray(raw['bindings'])) {
      throw new ParseError({
        code: 'PARSE_YAML_ERROR',
        message: '"bindings" field must be an array',
        ...(file !== undefined ? { file } : {}),
      });
    }
    binding.bindings = raw['bindings'].map(
      (entry: unknown, idx: number): ScenarioBinding => parseBindingEntry(entry, idx, file),
    );
  }

  if (raw['imports'] !== undefined) {
    if (!Array.isArray(raw['imports'])) {
      throw new ParseError({
        code: 'PARSE_YAML_ERROR',
        message: '"imports" field must be an array',
        ...(file !== undefined ? { file } : {}),
      });
    }
    binding.imports = raw['imports'].map(
      (entry: unknown, idx: number): ImportEntry => parseImportEntry(entry, idx, file),
    );
  }

  if (raw['extend'] !== undefined) {
    if (!Array.isArray(raw['extend']) || raw['extend'].some((e) => typeof e !== 'string')) {
      throw new ParseError({
        code: 'PARSE_YAML_ERROR',
        message: '"extend" field must be an array of strings',
        ...(file !== undefined ? { file } : {}),
      });
    }
    binding.extend = raw['extend'] as string[];
  }

  return binding;
}

function parseImportEntry(entry: unknown, idx: number, file: string | undefined): ImportEntry {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new ParseError({
      code: 'PARSE_YAML_ERROR',
      message: `imports[${idx}] must be an object`,
      ...(file !== undefined ? { file } : {}),
    });
  }

  const e = entry as Record<string, unknown>;

  if (typeof e['lib'] !== 'string') {
    throw new ParseError({
      code: 'PARSE_YAML_ERROR',
      message: `imports[${idx}].lib must be a string`,
      ...(file !== undefined ? { file } : {}),
    });
  }

  const use = e['use'];
  if (use !== 'all' && !(Array.isArray(use) && use.every((u) => typeof u === 'string'))) {
    throw new ParseError({
      code: 'PARSE_YAML_ERROR',
      message: `imports[${idx}].use must be "all" or an array of strings`,
      ...(file !== undefined ? { file } : {}),
    });
  }

  const mountedAt = e['mountedAt'];
  if (
    mountedAt === null ||
    typeof mountedAt !== 'object' ||
    Array.isArray(mountedAt) ||
    typeof (mountedAt as Record<string, unknown>)['route'] !== 'string' ||
    typeof (mountedAt as Record<string, unknown>)['region'] !== 'string'
  ) {
    throw new ParseError({
      code: 'PARSE_YAML_ERROR',
      message: `imports[${idx}].mountedAt must be an object with string "route" and "region"`,
      ...(file !== undefined ? { file } : {}),
    });
  }

  return {
    lib: e['lib'],
    use: use as 'all' | string[],
    mountedAt: {
      route: (mountedAt as { route: string; region: string }).route,
      region: (mountedAt as { route: string; region: string }).region,
    },
  };
}

function parseBindingEntry(entry: unknown, idx: number, file: string | undefined): ScenarioBinding {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new ParseError({
      code: 'PARSE_YAML_ERROR',
      message: `bindings[${idx}] must be an object`,
      ...(file !== undefined ? { file } : {}),
    });
  }

  const e = entry as Record<string, unknown>;

  if (typeof e['scenario'] !== 'string') {
    throw new ParseError({
      code: 'PARSE_YAML_ERROR',
      message: `bindings[${idx}].scenario must be a string`,
      ...(file !== undefined ? { file } : {}),
    });
  }

  const sb: ScenarioBinding = { scenario: e['scenario'] };

  if (e['scope'] !== undefined) {
    if (typeof e['scope'] !== 'string') {
      throw new ParseError({
        code: 'PARSE_YAML_ERROR',
        message: `bindings[${idx}].scope must be a string`,
        ...(file !== undefined ? { file } : {}),
      });
    }
    sb.scope = e['scope'];
  }

  if (e['data'] !== undefined && typeof e['data'] === 'object' && e['data'] !== null) {
    sb.data = e['data'] as Record<string, unknown>;
  }

  if (e['expected'] !== undefined && typeof e['expected'] === 'object' && e['expected'] !== null) {
    sb.expected = e['expected'] as Record<string, unknown>;
  }

  return sb;
}
