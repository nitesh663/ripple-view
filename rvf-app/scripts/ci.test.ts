/**
 * Unit tests for  acceptance criteria.
 *
 * AC1: Given a Jenkinsfile at the repo root, when Jenkins runs the pipeline,
 *      lint + typecheck + unit tests + build all execute and report status to the GitHub PR.
 * AC2: Given a failing Jenkins check, the GitHub PR is blocked via branch protection.
 * AC3: Given a local Jenkins instance (Docker Compose), the pipeline can be run
 *      and verified without a remote server.
 *
 * All tests are pure file reads — no process spawning (G13 determinism).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// AC1: Jenkinsfile — declarative pipeline with all required stages
// ---------------------------------------------------------------------------
describe('AC1: Jenkinsfile — declarative pipeline with all required stages', () => {
  const jenkinsfilePath = path.join(repoRoot, 'Jenkinsfile');
  const jenkinsfile = existsSync(jenkinsfilePath) ? readFileSync(jenkinsfilePath, 'utf8') : '';

  it('Jenkinsfile exists at repo root', () => {
    expect(existsSync(jenkinsfilePath)).toBe(true);
  });

  it('uses a Docker agent', () => {
    expect(jenkinsfile).toContain('docker');
  });

  it('pins Node 20 image', () => {
    expect(jenkinsfile).toContain('node:20');
  });

  it('installs dependencies with frozen lockfile', () => {
    expect(jenkinsfile).toContain('npm ci');
  });

  it("has a 'Lint' stage", () => {
    expect(jenkinsfile).toContain("stage('Lint'");
  });

  it("has a 'Typecheck' stage", () => {
    expect(jenkinsfile).toContain("stage('Typecheck'");
  });

  it("has a 'Test' stage", () => {
    expect(jenkinsfile).toContain("stage('Test'");
  });

  it("has a 'Build' stage", () => {
    expect(jenkinsfile).toContain("stage('Build'");
  });

  it('cleans the workspace after every run', () => {
    expect(jenkinsfile).toContain('cleanWs()');
  });
});

// ---------------------------------------------------------------------------
// AC2 + AC3: Docker Compose local stack + CI setup documentation
// ---------------------------------------------------------------------------
describe('AC2 + AC3: Docker Compose local stack and CI documentation', () => {
  const composePath = path.join(repoRoot, 'docker-compose.jenkins.yml');
  const compose = existsSync(composePath) ? readFileSync(composePath, 'utf8') : '';
  const ciDocPath = path.join(repoRoot, 'docs', 'CI.md');
  const ciDoc = existsSync(ciDocPath) ? readFileSync(ciDocPath, 'utf8') : '';

  it('docker-compose.jenkins.yml exists at repo root', () => {
    expect(existsSync(composePath)).toBe(true);
  });

  it('Compose file uses the Jenkins LTS image', () => {
    expect(compose).toContain('jenkins/jenkins');
  });

  it('Compose file mounts the Docker socket (Docker-in-Docker)', () => {
    expect(compose).toContain('/var/run/docker.sock');
  });

  it('docs/CI.md exists', () => {
    expect(existsSync(ciDocPath)).toBe(true);
  });

  it('CI docs mention GitHub webhook setup', () => {
    expect(ciDoc).toContain('webhook');
  });

  it('CI docs mention branch protection', () => {
    expect(ciDoc).toContain('branch protection');
  });

  it('CI docs mention required status check', () => {
    expect(ciDoc).toContain('status check');
  });
});
