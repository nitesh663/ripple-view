import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { ZodError } from 'zod';
import type { AppConfig, RunContext, WorkspaceConfig } from './schema.js';
import { AppConfigSchema, WorkspaceConfigSchema } from './schema.js';

// ── ConfigError ───────────────────────────────────────────────────────────────

export type ConfigErrorCode = 'CONFIG_SCHEMA_ERROR' | 'CONFIG_ENV_MISSING';

/** Thrown for infrastructure / programmer errors in config loading. */
export class ConfigError extends Error {
  readonly code: ConfigErrorCode;

  constructor(code: ConfigErrorCode, message: string) {
    super(message);
    this.name = 'ConfigError';
    this.code = code;
  }
}

// ── Environment interpolation ─────────────────────────────────────────────────

/**
 * Replace every `${VAR_NAME}` placeholder in `value` with the corresponding
 * value from `env`. Throws ConfigError (CONFIG_ENV_MISSING) if a referenced
 * variable is absent from `env`.
 */
export function interpolateEnv(value: string, env: Record<string, string | undefined>): string {
  return value.replace(/\$\{([^}]+)\}/g, (_match, name: string) => {
    const resolved = env[name];
    if (resolved === undefined) {
      throw new ConfigError(
        'CONFIG_ENV_MISSING',
        `Environment variable "${name}" is referenced in config but not set.`,
      );
    }
    return resolved;
  });
}

/**
 * Recursively walk `obj` and apply `interpolateEnv` to every string value.
 * Returns a deep copy with placeholders resolved.
 */
export function interpolateObject<T>(obj: T, env: Record<string, string | undefined>): T {
  if (typeof obj === 'string') {
    return interpolateEnv(obj, env) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item: unknown) => interpolateObject(item, env)) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      result[key] = interpolateObject((obj as Record<string, unknown>)[key], env);
    }
    return result as T;
  }
  return obj;
}

// ── Schema helpers ────────────────────────────────────────────────────────────

function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => `[${issue.path.join('.')}] ${issue.message}`).join('; ');
}

// ── Workspace config ──────────────────────────────────────────────────────────

/**
 * Parse a YAML string and validate it against WorkspaceConfigSchema.
 * Env placeholders are resolved using `env` (defaults to `process.env`).
 * Throws ConfigError on schema or env failure.
 */
export function parseWorkspaceConfig(
  yaml: string,
  env: Record<string, string | undefined> = process.env,
): WorkspaceConfig {
  const raw: unknown = parseYaml(yaml);
  const interpolated = interpolateObject(raw, env);
  const result = WorkspaceConfigSchema.safeParse(interpolated);
  if (!result.success) {
    throw new ConfigError(
      'CONFIG_SCHEMA_ERROR',
      `Workspace config is invalid: ${formatZodError(result.error)}`,
    );
  }
  return result.data;
}

/**
 * Read a file from disk, then parse and validate it as a workspace config.
 */
export function loadWorkspaceConfig(
  filePath: string,
  env: Record<string, string | undefined> = process.env,
): WorkspaceConfig {
  const content = readFileSync(filePath, 'utf8');
  return parseWorkspaceConfig(content, env);
}

// ── App config ────────────────────────────────────────────────────────────────

/**
 * Parse a YAML string and validate it against AppConfigSchema.
 * Env placeholders are resolved using `env` (defaults to `process.env`).
 * Throws ConfigError on schema or env failure.
 */
export function parseAppConfig(
  yaml: string,
  env: Record<string, string | undefined> = process.env,
): AppConfig {
  const raw: unknown = parseYaml(yaml);
  const interpolated = interpolateObject(raw, env);
  const result = AppConfigSchema.safeParse(interpolated);
  if (!result.success) {
    throw new ConfigError(
      'CONFIG_SCHEMA_ERROR',
      `App config is invalid: ${formatZodError(result.error)}`,
    );
  }
  return result.data;
}

/**
 * Read a file from disk, then parse and validate it as an app config.
 */
export function loadAppConfig(
  filePath: string,
  env: Record<string, string | undefined> = process.env,
): AppConfig {
  const content = readFileSync(filePath, 'utf8');
  return parseAppConfig(content, env);
}

// ── Run context ───────────────────────────────────────────────────────────────

/**
 * Combine a validated workspace config and app config into a RunContext.
 * The `tenant` is derived as `workspace.name + ':' + appName`.
 */
export function buildRunContext(opts: {
  workspaceConfig: WorkspaceConfig;
  appConfig: AppConfig;
  appName: string;
  paths: { workspace: string; app: string; output: string };
}): RunContext {
  const { workspaceConfig, appConfig, appName, paths } = opts;
  return {
    tenant: `${workspaceConfig.name}:${appName}`,
    appName,
    department: appConfig.department,
    paths,
    workspace: workspaceConfig,
    app: appConfig,
  };
}
