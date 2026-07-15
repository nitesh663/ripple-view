/**
 * Unit tests for  T-5.3.1 — generate-compose.mjs.
 *
 * AC-1: the runner only starts after the app is `service_healthy`, and the
 *       generated compose document carries everything the orchestrator needs
 *       (image tags, volumes, the run command) to later block on
 *       `--exit-code-from runner` (proven in run-isolation-unit.test.ts).
 *
 * Pure string/YAML assertions only — no real docker-compose ever invoked
 * (G13 determinism).
 */

import { describe, it, expect } from 'vitest';
import { parse as yamlParse } from 'yaml';
import { generateComposeYaml } from './generate-compose.mjs';

const BASE_OPTIONS = {
  appImageTag: 'app-runtime:candidate',
  runnerImageTag: 'rv-runner:0.0.0',
  resultsHostDir: '/tmp/rv-results',
  appHostDir: '/tmp/rv-app',
};

describe('generateComposeYaml — AC-1: service_healthy gating', () => {
  it('makes the runner depend on the app reaching service_healthy', () => {
    const yaml = generateComposeYaml(BASE_OPTIONS);
    const doc = yamlParse(yaml);

    expect(doc.services.app.image).toBe('app-runtime:candidate');
    expect(doc.services.runner.image).toBe('rv-runner:0.0.0');
    expect(doc.services.runner.depends_on.app.condition).toBe('service_healthy');
  });

  it('does not redeclare a healthcheck — the app-runtime image bakes its own in', () => {
    const yaml = generateComposeYaml(BASE_OPTIONS);
    const doc = yamlParse(yaml);

    expect(doc.services.app.healthcheck).toBeUndefined();
  });
});

describe('generateComposeYaml — volumes + run command', () => {
  it('mounts the app dir read-only and the results dir read-write', () => {
    const yaml = generateComposeYaml(BASE_OPTIONS);
    const doc = yamlParse(yaml);

    expect(doc.services.runner.volumes).toContain('/tmp/rv-app:/data/app:ro');
    expect(doc.services.runner.volumes).toContain('/tmp/rv-results:/data/results');
  });

  it('defaults the app config path to rippleview.config.yaml', () => {
    const yaml = generateComposeYaml(BASE_OPTIONS);
    const doc = yamlParse(yaml);

    expect(doc.services.runner.command).toEqual([
      'run',
      '--config',
      '/data/app/rippleview.config.yaml',
      '--output',
      '/data/results',
    ]);
  });

  it('honours a custom appConfigRelPath', () => {
    const yaml = generateComposeYaml({
      ...BASE_OPTIONS,
      appConfigRelPath: 'config/rippleview.config.yaml',
    });
    const doc = yamlParse(yaml);

    expect(doc.services.runner.command).toContain('/data/app/config/rippleview.config.yaml');
  });

  it('does not declare a top-level named volumes block (bind mounts only)', () => {
    const yaml = generateComposeYaml(BASE_OPTIONS);
    const doc = yamlParse(yaml);

    expect(doc.volumes).toBeUndefined();
  });

  it('points the runner at the app service over the compose network', () => {
    const yaml = generateComposeYaml(BASE_OPTIONS);
    const doc = yamlParse(yaml);

    expect(doc.services.runner.environment.BASE_URL).toBe('http://app:80');
  });
});
