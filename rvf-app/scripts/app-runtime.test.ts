/**
 * Unit tests for  T-5.2.1/T-5.2.2 — the app-runtime image artifacts.
 *
 * AC-1: a multi-stage build produces a served artifact with a healthcheck.
 *
 * All tests are pure file reads — no process spawning (G13 determinism),
 * mirroring scripts/runner.test.ts's style.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dockerfilePath = path.join(repoRoot, 'docker', 'app-runtime', 'Dockerfile');
const nginxPath = path.join(repoRoot, 'docker', 'app-runtime', 'nginx.conf');

// ── AC-1: multi-stage parameterized build → served artifact ───────────────────
describe('AC-1: app-runtime Dockerfile — parameterized multi-stage build', () => {
  it('docker/app-runtime/Dockerfile exists', () => {
    expect(existsSync(dockerfilePath)).toBe(true);
  });

  let dockerfile = '';
  beforeEach(() => {
    if (existsSync(dockerfilePath)) {
      dockerfile = readFileSync(dockerfilePath, 'utf8');
    }
  });

  it('declares ARG NODE_VERSION so the base image is parameterized', () => {
    expect(dockerfile).toMatch(/ARG NODE_VERSION/);
  });

  it('has a builder stage on a node base', () => {
    expect(dockerfile).toMatch(/FROM node:\$\{NODE_VERSION\}-bookworm-slim AS builder/);
  });

  it('has a static target stage on a pinned nginx base (not :latest)', () => {
    expect(dockerfile).toMatch(/FROM nginx:[\d.]+-alpine AS static/);
    expect(dockerfile).not.toMatch(/nginx:latest/);
  });

  it('has a node target stage on a node base', () => {
    expect(dockerfile).toMatch(/FROM node:\$\{NODE_VERSION\}-bookworm-slim AS node/);
  });

  it('does NOT use a frozen install in the builder (preserves the version-swap)', () => {
    expect(dockerfile).not.toContain('npm ci');
    expect(dockerfile).not.toContain('--frozen-lockfile');
  });

  it('detects the package manager by lockfile', () => {
    expect(dockerfile).toContain('pnpm-lock.yaml');
    expect(dockerfile).toContain('yarn.lock');
  });

  it('runs the parameterized build command with an OUTPUT_DIR arg', () => {
    expect(dockerfile).toContain('ARG BUILD_CMD');
    expect(dockerfile).toContain('ARG OUTPUT_DIR');
  });
});

// ── AC-1/T-5.2.2: healthcheck + exposed port in both final stages ─────────────
describe('AC-1/T-5.2.2: healthcheck and exposed ports', () => {
  let dockerfile = '';
  beforeEach(() => {
    if (existsSync(dockerfilePath)) {
      dockerfile = readFileSync(dockerfilePath, 'utf8');
    }
  });

  it('declares a HEALTHCHECK in both final stages', () => {
    const matches = dockerfile.match(/HEALTHCHECK/g) ?? [];
    expect(matches.length).toBe(2);
  });

  it('exposes a port', () => {
    expect(dockerfile).toMatch(/EXPOSE/);
  });

  it('serves the consumer start command in the node stage', () => {
    expect(dockerfile).toContain('ARG START_CMD');
    expect(dockerfile).toMatch(/CMD \["sh", "-c", "\$START_CMD"\]/);
  });
});

// ── nginx SPA config ──────────────────────────────────────────────────────────
describe('app-runtime nginx.conf', () => {
  it('docker/app-runtime/nginx.conf exists', () => {
    expect(existsSync(nginxPath)).toBe(true);
  });

  let nginx = '';
  beforeEach(() => {
    if (existsSync(nginxPath)) {
      nginx = readFileSync(nginxPath, 'utf8');
    }
  });

  it('has an SPA try_files fallback to index.html', () => {
    expect(nginx).toMatch(/try_files\s+\$uri\s+\$uri\/\s+\/index\.html/);
  });

  it('serves from the nginx html root', () => {
    expect(nginx).toContain('/usr/share/nginx/html');
  });
});
