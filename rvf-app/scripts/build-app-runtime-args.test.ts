/**
 * Unit tests for  T-5.2.3 — build-app-runtime-args.mjs.
 *
 * AC-1: a consumer + override produces a served artifact — proven via the
 *       docker build argument array (static and node serve modes).
 *
 * Pure functions, no process spawning (G13 determinism).
 */

import { describe, it, expect } from 'vitest';
import { buildDockerArgs } from './build-app-runtime-args.mjs';

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

describe('buildDockerArgs — static serve mode', () => {
  it('targets the static stage with the tag, dockerfile, and contract build-args', () => {
    const args = buildDockerArgs({
      contract: staticContract,
      imageTag: TAG,
      dockerfilePath: DOCKERFILE,
      appDir: APP,
    });
    expect(args).toContain('--target');
    expect(args[args.indexOf('--target') + 1]).toBe('static');
    expect(args).toContain('-t');
    expect(args[args.indexOf('-t') + 1]).toBe(TAG);
    expect(args).toContain('-f');
    expect(args[args.indexOf('-f') + 1]).toBe(DOCKERFILE);
    expect(args).toContain('NODE_VERSION=20');
    expect(args).toContain('BUILD_CMD=react-scripts build');
    expect(args).toContain('OUTPUT_DIR=build');
    expect(args[args.length - 1]).toBe(APP);
  });

  it('omits START_CMD and PORT build-args in static mode', () => {
    const args = buildDockerArgs({
      contract: staticContract,
      imageTag: TAG,
      dockerfilePath: DOCKERFILE,
      appDir: APP,
    });
    expect(args.some((a) => a.startsWith('START_CMD='))).toBe(false);
    expect(args.some((a) => a.startsWith('PORT='))).toBe(false);
  });
});

describe('buildDockerArgs — frameworkRoot secondary build context', () => {
  it('omits --build-context when frameworkRoot is not given', () => {
    const args = buildDockerArgs({
      contract: staticContract,
      imageTag: TAG,
      dockerfilePath: DOCKERFILE,
      appDir: APP,
    });
    expect(args).not.toContain('--build-context');
    // appDir must stay the final positional arg regardless.
    expect(args[args.length - 1]).toBe(APP);
  });

  it('adds rv-framework=<frameworkRoot> before the trailing appDir when given', () => {
    const args = buildDockerArgs({
      contract: staticContract,
      imageTag: TAG,
      dockerfilePath: DOCKERFILE,
      appDir: APP,
      frameworkRoot: '/repo/rv',
    });
    expect(args).toContain('--build-context');
    expect(args[args.indexOf('--build-context') + 1]).toBe('rv-framework=/repo/rv');
    expect(args[args.length - 1]).toBe(APP);
  });
});

describe('buildDockerArgs — node serve mode', () => {
  it('targets the node stage and adds START_CMD + PORT build-args', () => {
    const args = buildDockerArgs({
      contract: nodeContract,
      imageTag: TAG,
      dockerfilePath: DOCKERFILE,
      appDir: APP,
    });
    expect(args[args.indexOf('--target') + 1]).toBe('node');
    expect(args).toContain('NODE_VERSION=18');
    expect(args).toContain('START_CMD=node server.js');
    expect(args).toContain('PORT=4200');
  });
});
