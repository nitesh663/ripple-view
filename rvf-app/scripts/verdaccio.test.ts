/**
 * Unit tests for  T-5.1.2 — Verdaccio compose service + config.
 *
 * AC-2: Verdaccio works when versioning is tested (no registry needed for
 * the file:/pack path; this is the registry-backed path).
 *
 * All tests are pure file reads — no process spawning, no real Docker
 * (G13 determinism), mirroring scripts/runner.test.ts's exact style.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const composePath = path.join(repoRoot, 'docker', 'verdaccio', 'docker-compose.yml');
const configPath = path.join(repoRoot, 'docker', 'verdaccio', 'config.yaml');

describe('docker/verdaccio/docker-compose.yml', () => {
  it('exists', () => {
    expect(existsSync(composePath)).toBe(true);
  });

  let compose = '';
  beforeEach(() => {
    if (existsSync(composePath)) {
      compose = readFileSync(composePath, 'utf8');
    }
  });

  it('defines a verdaccio service', () => {
    expect(compose).toMatch(/^\s*verdaccio:/m);
  });

  it('pins the verdaccio image to a specific version tag (not latest)', () => {
    expect(compose).not.toMatch(/verdaccio\/verdaccio:latest/);
    expect(compose).toMatch(/verdaccio\/verdaccio:\d+\.\d+\.\d+/);
  });

  it('exposes port 4873', () => {
    expect(compose).toMatch(/4873:4873/);
  });

  it('mounts a config file', () => {
    expect(compose).toContain('config.yaml');
  });

  it('mounts a storage volume', () => {
    expect(compose).toMatch(/verdaccio-storage/);
  });

  it('includes a healthcheck hitting the verdaccio ping endpoint', () => {
    expect(compose).toContain('healthcheck');
    expect(compose).toMatch(/-\/ping/);
  });
});

describe('docker/verdaccio/config.yaml', () => {
  it('exists', () => {
    expect(existsSync(configPath)).toBe(true);
  });

  let config = '';
  beforeEach(() => {
    if (existsSync(configPath)) {
      config = readFileSync(configPath, 'utf8');
    }
  });

  it('declares a storage path', () => {
    expect(config).toMatch(/^storage:/m);
  });

  it('declares an uplink to the real npm registry', () => {
    expect(config).toContain('uplinks:');
    expect(config).toContain('https://registry.npmjs.org/');
  });

  it('declares a permissive packages access rule for publish/unpublish', () => {
    expect(config).toContain('packages:');
    expect(config).toMatch(/publish:\s*\$all/);
    expect(config).toMatch(/unpublish:\s*\$all/);
  });
});
