import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { WorkspaceConfigSchema, AppConfigSchema } from './schema.js';

describe('WorkspaceConfigSchema', () => {
  it('parses a valid workspace config', () => {
    const result = WorkspaceConfigSchema.parse({
      version: '1.0.0',
      name: 'my-workspace',
    });
    expect(result.version).toBe('1.0.0');
    expect(result.name).toBe('my-workspace');
    expect(result.packages).toEqual([]);
    expect(result.settings.strict).toBe(false);
  });

  // AC-2: missing required field 'version' → ZodError with path ['version']
  it('AC-2: rejects config missing version with ZodError path [version]', () => {
    const result = WorkspaceConfigSchema.safeParse({ name: 'my-workspace' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path);
      expect(paths).toContainEqual(['version']);
    }
  });

  // AC-2: missing required field 'name' → ZodError with path ['name']
  it('AC-2: rejects config missing name with ZodError path [name]', () => {
    const result = WorkspaceConfigSchema.safeParse({ version: '1.0.0' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path);
      expect(paths).toContainEqual(['name']);
    }
  });
});

const BASE_URL = 'http://app:8080';

describe('AppConfigSchema', () => {
  it('parses a valid app config', () => {
    const result = AppConfigSchema.parse({
      department: 'payments',
      baseUrl: BASE_URL,
      visual: { threshold: 0.05 },
    });
    expect(result.department).toBe('payments');
    expect(result.visual.threshold).toBe(0.05);
  });

  // AC-3: absent department → defaults to 'default'
  it('AC-3: defaults department to "default" when absent', () => {
    const result = AppConfigSchema.parse({ baseUrl: BASE_URL });
    expect(result.department).toBe('default');
  });

  // AC-2: visual.threshold = 1.5 → ZodError (out of range, max is 1)
  it('AC-2: rejects visual.threshold above 1 with a ZodError', () => {
    expect(() => AppConfigSchema.parse({ baseUrl: BASE_URL, visual: { threshold: 1.5 } })).toThrow(
      ZodError,
    );
  });

  it('applies defaults for hooks, matrix, and visual when absent', () => {
    const result = AppConfigSchema.parse({ baseUrl: BASE_URL });
    expect(result.hooks).toEqual({});
    expect(result.matrix).toEqual([]);
    expect(result.visual.threshold).toBe(0.01);
  });

  // build contract block round-trips every field
  it('parses and round-trips a full build block', () => {
    const build = {
      node: '18',
      command: 'ng build',
      outputDir: 'dist/app/browser',
      serve: 'node' as const,
      start: 'node server.js',
      port: 4200,
    };
    const result = AppConfigSchema.parse({ baseUrl: BASE_URL, build });
    expect(result.build).toEqual(build);
  });

  // the whole build block is optional — absent → undefined, no crash
  it('leaves build undefined when absent', () => {
    const result = AppConfigSchema.parse({ baseUrl: BASE_URL });
    expect(result.build).toBeUndefined();
  });

  // an invalid serve value is rejected
  it('rejects an invalid build.serve value with a ZodError', () => {
    expect(() =>
      AppConfigSchema.parse({ baseUrl: BASE_URL, build: { serve: 'devserver' } }),
    ).toThrow(ZodError);
  });

  // a non-number build.port is rejected
  it('rejects a non-number build.port with a ZodError', () => {
    expect(() => AppConfigSchema.parse({ baseUrl: BASE_URL, build: { port: '3000' } })).toThrow(
      ZodError,
    );
  });

  // baseUrl round-trips when present
  it('parses and round-trips baseUrl', () => {
    const result = AppConfigSchema.parse({ baseUrl: BASE_URL });
    expect(result.baseUrl).toBe(BASE_URL);
  });

  //  Decision 1: baseUrl is REQUIRED — every real rippleview.config.yaml
  // has it, and the engine cannot navigate anywhere without it.
  it('rejects a config missing baseUrl with ZodError path [baseUrl]', () => {
    const result = AppConfigSchema.safeParse({ department: 'payments' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path);
      expect(paths).toContainEqual(['baseUrl']);
    }
  });

  // a non-string baseUrl is rejected
  it('rejects a non-string baseUrl with a ZodError', () => {
    expect(() => AppConfigSchema.parse({ baseUrl: 8080 })).toThrow(ZodError);
  });
});
