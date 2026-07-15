import { describe, it, expect } from 'vitest';
import {
  ConfigError,
  interpolateEnv,
  parseWorkspaceConfig,
  parseAppConfig,
  buildRunContext,
} from './loader.js';

// ── interpolateEnv ────────────────────────────────────────────────────────────

describe('interpolateEnv', () => {
  it('returns the value unchanged when there are no placeholders', () => {
    expect(interpolateEnv('hello-world', {})).toBe('hello-world');
  });

  it('resolves a ${VAR_NAME} placeholder from the env record', () => {
    const env = { BASE_URL: 'https://example.com' };
    expect(interpolateEnv('${BASE_URL}/api', env)).toBe('https://example.com/api');
  });

  it('resolves multiple placeholders in one string', () => {
    const env = { HOST: 'localhost', PORT: '3000' };
    expect(interpolateEnv('${HOST}:${PORT}', env)).toBe('localhost:3000');
  });

  // AC-2 (env variant): missing env var → ConfigError CONFIG_ENV_MISSING
  it('AC-2: throws ConfigError CONFIG_ENV_MISSING for an unset variable', () => {
    expect(() => interpolateEnv('${MISSING_VAR}', {})).toThrow(ConfigError);

    try {
      interpolateEnv('${MISSING_VAR}', {});
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).code).toBe('CONFIG_ENV_MISSING');
    }
  });
});

// ── parseWorkspaceConfig ──────────────────────────────────────────────────────

describe('parseWorkspaceConfig', () => {
  const validYaml = `
version: "1.0.0"
name: my-workspace
`;

  it('parses valid workspace YAML into a WorkspaceConfig', () => {
    const config = parseWorkspaceConfig(validYaml, {});
    expect(config.version).toBe('1.0.0');
    expect(config.name).toBe('my-workspace');
  });

  // AC-2: invalid workspace YAML → ConfigError CONFIG_SCHEMA_ERROR
  it('AC-2: throws ConfigError CONFIG_SCHEMA_ERROR for invalid workspace YAML', () => {
    const badYaml = `
name: my-workspace
`;
    expect(() => parseWorkspaceConfig(badYaml, {})).toThrow(ConfigError);

    try {
      parseWorkspaceConfig(badYaml, {});
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).code).toBe('CONFIG_SCHEMA_ERROR');
      expect((err as ConfigError).message).toContain('version');
    }
  });

  it('resolves ${ENV_VAR} placeholders in workspace YAML', () => {
    const yamlWithEnv = `
version: "1.0.0"
name: \${WORKSPACE_NAME}
`;
    const config = parseWorkspaceConfig(yamlWithEnv, {
      WORKSPACE_NAME: 'injected-workspace',
    });
    expect(config.name).toBe('injected-workspace');
  });
});

// ── parseAppConfig ────────────────────────────────────────────────────────────

describe('parseAppConfig', () => {
  it('parses valid app YAML into an AppConfig', () => {
    const yaml = `
department: payments
baseUrl: "http://app:8080"
visual:
  threshold: 0.02
`;
    const config = parseAppConfig(yaml, {});
    expect(config.department).toBe('payments');
    expect(config.visual.threshold).toBe(0.02);
  });

  // AC-3: app YAML without department → defaults to 'default'
  it('AC-3: defaults department to "default" when absent from YAML', () => {
    const config = parseAppConfig('baseUrl: "http://app:8080"', {});
    expect(config.department).toBe('default');
  });

  it('resolves ${ENV_VAR} placeholders in app YAML', () => {
    const yaml = `
baseUrl: "http://app:8080"
sceneProvider: \${SCENE_PROVIDER}
`;
    const config = parseAppConfig(yaml, { SCENE_PROVIDER: 'my-plugin' });
    expect(config.sceneProvider).toBe('my-plugin');
  });

  it('throws ConfigError CONFIG_ENV_MISSING when a referenced env var is absent', () => {
    const yaml = `
baseUrl: "http://app:8080"
sceneProvider: \${MISSING_PLUGIN}
`;
    try {
      parseAppConfig(yaml, {});
      expect.fail('Expected a ConfigError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).code).toBe('CONFIG_ENV_MISSING');
    }
  });

  //  Decision 1: baseUrl is required — missing it is a schema error
  it('throws ConfigError CONFIG_SCHEMA_ERROR when baseUrl is absent', () => {
    try {
      parseAppConfig('department: payments', {});
      expect.fail('Expected a ConfigError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).code).toBe('CONFIG_SCHEMA_ERROR');
      expect((err as ConfigError).message).toContain('baseUrl');
    }
  });
});

// ── buildRunContext ────────────────────────────────────────────────────────────

describe('buildRunContext', () => {
  const workspaceYaml = `
version: "1.0.0"
name: acme
`;
  const appYaml = `
department: finance
baseUrl: "http://app:8080"
`;
  const paths = {
    workspace: '/abs/rippleview.workspace.yaml',
    app: '/abs/apps/finance-app/rippleview.config.yaml',
    output: '/abs/output',
  };

  // AC-1: valid workspace + app → RunContext with correct tenant, department, paths
  it('AC-1: produces a RunContext with tenant = workspace.name + ":" + appName', () => {
    const workspaceConfig = parseWorkspaceConfig(workspaceYaml, {});
    const appConfig = parseAppConfig(appYaml, {});
    const ctx = buildRunContext({
      workspaceConfig,
      appConfig,
      appName: 'finance-app',
      paths,
    });

    expect(ctx.tenant).toBe('acme:finance-app');
    expect(ctx.appName).toBe('finance-app');
    expect(ctx.department).toBe('finance');
    expect(ctx.paths.workspace).toBe('/abs/rippleview.workspace.yaml');
    expect(ctx.paths.app).toBe('/abs/apps/finance-app/rippleview.config.yaml');
    expect(ctx.paths.output).toBe('/abs/output');
    expect(ctx.workspace.name).toBe('acme');
    expect(ctx.app.department).toBe('finance');
  });

  // AC-3: no department in app YAML → RunContext.department === 'default'
  it('AC-3: RunContext.department is "default" when app YAML omits department', () => {
    const workspaceConfig = parseWorkspaceConfig(workspaceYaml, {});
    const appConfig = parseAppConfig('baseUrl: "http://app:8080"', {});
    const ctx = buildRunContext({
      workspaceConfig,
      appConfig,
      appName: 'some-app',
      paths,
    });
    expect(ctx.department).toBe('default');
  });
});
