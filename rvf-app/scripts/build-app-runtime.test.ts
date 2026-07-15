/**
 * Unit tests for  T-5.2.3 — build-app-runtime.mjs.
 *
 * AC-1: a consumer + override produces a served artifact — proven via the
 *       docker build argument array (static and node serve modes).
 * AC-2: a peer-dep/compile break fails the build and is RECORDED as a
 *       backward-compat finding with confidence 0 — NOT swallowed, NOT a crash.
 *
 * The executor is a vi.fn() and idGen is deterministic, so no real docker
 * process is ever spawned (G13 determinism).
 */

import { describe, it, expect, vi } from 'vitest';
import { buildFailureFinding, buildAppRuntime, parseArgs } from './build-app-runtime.mjs';

const DOCKERFILE = 'docker/app-runtime/Dockerfile';
const APP = '/tmp/app';
const TAG = 'app-runtime:candidate';

const staticContract = {
  nodeVersion: '20',
  buildCmd: 'react-scripts build',
  outputDir: 'build',
  serveMode: 'static' as const,
  startCmd: '',
  port: 3000,
};

const nodeContract = {
  nodeVersion: '18',
  buildCmd: 'ng build',
  outputDir: 'dist/app/browser',
  serveMode: 'node' as const,
  startCmd: 'node server.js',
  port: 4200,
};

const fixedId = () => 'fixed-id';

describe('buildAppRuntime — AC-1 success', () => {
  it('returns ok with the image tag and invokes docker with static-target args', () => {
    const executor = vi.fn().mockReturnValue('');
    const result = buildAppRuntime({
      contract: staticContract,
      imageTag: TAG,
      dockerfilePath: DOCKERFILE,
      appDir: APP,
      executor,
      idGen: fixedId,
    });

    expect(result).toEqual({ ok: true, imageTag: TAG });
    const [command, args] = executor.mock.calls[0] as [string, string[]];
    expect(command).toBe('docker');
    expect(args).toContain('--target');
    expect(args[args.indexOf('--target') + 1]).toBe('static');
    expect(args).toContain('NODE_VERSION=20');
    expect(args).toContain('OUTPUT_DIR=build');
  });

  it('builds the node serve mode with START_CMD + PORT args', () => {
    const executor = vi.fn().mockReturnValue('');
    const result = buildAppRuntime({
      contract: nodeContract,
      imageTag: TAG,
      dockerfilePath: DOCKERFILE,
      appDir: APP,
      executor,
      idGen: fixedId,
    });

    expect(result).toEqual({ ok: true, imageTag: TAG });
    const [, args] = executor.mock.calls[0] as [string, string[]];
    expect(args[args.indexOf('--target') + 1]).toBe('node');
    expect(args).toContain('START_CMD=node server.js');
    expect(args).toContain('PORT=4200');
  });
});

describe('buildAppRuntime — AC-2 build/compile break', () => {
  const compileError = "TS2307: Cannot find module '@enterprise/datagrid'";

  it('captures a build failure as a finding and does NOT throw', () => {
    const executor = vi.fn().mockImplementation(() => {
      const err = new Error('docker build exited with code 1') as Error & { stderr?: string };
      err.stderr = `> ng build\n${compileError}\n`;
      throw err;
    });

    const result = buildAppRuntime({
      contract: staticContract,
      imageTag: TAG,
      dockerfilePath: DOCKERFILE,
      appDir: APP,
      executor,
      idGen: fixedId,
    });

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.finding.confidence).toBe(0);
      expect(result.finding.severity).toBe('critical');
      expect(result.finding.component).toBe('app-runtime-build');
      // The induced compile error is reported, not swallowed (DoD).
      expect(result.finding.message).toContain(compileError);
    }
  });

  it('falls back to the error message when no stderr is present', () => {
    const executor = vi.fn().mockImplementation(() => {
      throw new Error('peer dependency conflict: react@19 vs react@18');
    });

    const result = buildAppRuntime({
      contract: staticContract,
      imageTag: TAG,
      dockerfilePath: DOCKERFILE,
      appDir: APP,
      executor,
      idGen: fixedId,
    });

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.finding.message).toContain('peer dependency conflict');
      expect(result.finding.confidence).toBe(0);
    }
  });
});

describe('buildFailureFinding — Finding shape (mirrors @rippleview/core)', () => {
  it('has all five Finding fields with correct types', () => {
    const finding = buildFailureFinding({ message: 'boom', idGen: fixedId });
    expect(finding).toEqual({
      id: 'fixed-id',
      component: 'app-runtime-build',
      confidence: 0,
      severity: 'critical',
      message: 'boom',
    });
    expect(typeof finding.id).toBe('string');
    expect(typeof finding.confidence).toBe('number');
    expect(typeof finding.message).toBe('string');
  });
});

describe('parseArgs', () => {
  it('parses --app, --tag, and --dockerfile', () => {
    const result = parseArgs(['--app', APP, '--tag', TAG, '--dockerfile', DOCKERFILE]);
    expect(result).toEqual({ app: APP, tag: TAG, dockerfile: DOCKERFILE });
  });

  it('defaults the dockerfile path when --dockerfile is omitted', () => {
    const result = parseArgs(['--app', APP, '--tag', TAG]);
    expect(result.dockerfile).toBe('docker/app-runtime/Dockerfile');
  });

  it('throws when --app is missing', () => {
    expect(() => parseArgs(['--tag', TAG])).toThrow(/Usage/);
  });
});
