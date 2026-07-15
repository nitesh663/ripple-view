/**
 * Unit tests for  acceptance criteria.
 *
 * AC-1: Given the image, then it is based on the pinned Playwright image
 *       with @rippleview/cli installed.
 * AC-2: Given a config + volume, when `docker run rv-runner run ...`,
 *       then results are written to the mounted volume.
 *
 * T-1.5.2 DoD: CI stage wired — Jenkinsfile contains a Build Runner Image stage.
 *
 * All tests are pure file reads — no process spawning (G13 determinism).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dockerfilePath = path.join(repoRoot, 'docker', 'rv-runner', 'Dockerfile');
const dockerignorePath = path.join(repoRoot, 'docker', 'rv-runner', '.dockerignore');
const jenkinspath = path.join(repoRoot, 'Jenkinsfile');

// ── AC-1: image based on pinned Playwright image with CLI ─────────────────────
describe('AC-1: Dockerfile — Playwright base + rv CLI', () => {
  it('docker/rv-runner/Dockerfile exists', () => {
    expect(existsSync(dockerfilePath)).toBe(true);
  });

  let dockerfile = '';
  beforeEach(() => {
    if (existsSync(dockerfilePath)) {
      dockerfile = readFileSync(dockerfilePath, 'utf8');
    }
  });

  it('is based on the pinned Playwright image', () => {
    expect(dockerfile).toMatch(/FROM mcr\.microsoft\.com\/playwright:/);
  });

  it('pins the Playwright image to a specific version tag (not latest)', () => {
    // Must not use :latest — determinism requires a pinned tag (G13)
    expect(dockerfile).not.toMatch(/playwright:latest/);
    expect(dockerfile).toMatch(/playwright:v\d+\.\d+/);
  });

  it('pins npm version in packageManager field', () => {
    const pkg = JSON.parse(
      readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
    ) as { packageManager?: string };
    expect(pkg.packageManager).toMatch(/^npm@\d+\.\d+\.\d+/);
  });

  it('builds @rippleview/core', () => {
    expect(dockerfile).toContain('@rippleview/core');
  });

  it('builds @rippleview/cli', () => {
    expect(dockerfile).toContain('@rippleview/cli');
  });

  it('exposes rv on PATH', () => {
    expect(dockerfile).toContain('rv');
    expect(dockerfile).toMatch(/ln -s.*rv|chmod.*cli\.js/);
  });

  it('sets ENTRYPOINT to rv', () => {
    expect(dockerfile).toMatch(/ENTRYPOINT\s+\["rv"\]/);
  });
});

// ── AC-2: volume mount for results ────────────────────────────────────────────
describe('AC-2: Dockerfile — /data volume for config + results', () => {
  let dockerfile = '';
  beforeEach(() => {
    if (existsSync(dockerfilePath)) {
      dockerfile = readFileSync(dockerfilePath, 'utf8');
    }
  });

  it('sets WORKDIR /data as the default working directory', () => {
    expect(dockerfile).toContain('WORKDIR /data');
  });

  it('uses npm ci for deterministic installs (G13)', () => {
    expect(dockerfile).toContain('npm ci');
  });
});

// ── T-1.5.2: CI build stage ───────────────────────────────────────────────────
describe('T-1.5.2: Jenkinsfile — Build Runner Image stage', () => {
  it('Jenkinsfile exists', () => {
    expect(existsSync(jenkinspath)).toBe(true);
  });

  let jenkinsfile = '';
  beforeEach(() => {
    if (existsSync(jenkinspath)) {
      jenkinsfile = readFileSync(jenkinspath, 'utf8');
    }
  });

  it('contains a Build Runner Image stage', () => {
    expect(jenkinsfile).toContain('Build Runner Image');
  });

  it('build stage runs docker build with the correct Dockerfile path', () => {
    expect(jenkinsfile).toMatch(/docker build/);
    expect(jenkinsfile).toContain('docker/rv-runner/Dockerfile');
  });

  it('build stage tags the image as rv-runner', () => {
    expect(jenkinsfile).toContain('rv-runner');
  });

  it('build stage is guarded by when { branch main }', () => {
    expect(jenkinsfile).toMatch(/when\s*\{[\s\S]*?branch\s+['"]main['"]/);
  });
});

// ── .dockerignore ─────────────────────────────────────────────────────────────
describe('.dockerignore', () => {
  it('docker/rv-runner/.dockerignore exists', () => {
    expect(existsSync(dockerignorePath)).toBe(true);
  });

  let dockerignore = '';
  beforeEach(() => {
    if (existsSync(dockerignorePath)) {
      dockerignore = readFileSync(dockerignorePath, 'utf8');
    }
  });

  it('excludes node_modules', () => {
    expect(dockerignore).toContain('node_modules');
  });

  it('excludes .git', () => {
    expect(dockerignore).toContain('.git');
  });

  it('excludes dist directories', () => {
    expect(dockerignore).toContain('dist');
  });
});
