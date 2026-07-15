/**
 * Unit tests for  T-5.1.2 — publish-to-verdaccio.mjs.
 *
 * Proves the correct command/cwd/registry URL is used, and that an
 * executor failure propagates as a thrown error rather than being
 * silently swallowed. No real child process is ever spawned (G13).
 */

import { describe, it, expect, vi } from 'vitest';
import { publishToVerdaccio, parseArgs } from './publish-to-verdaccio.mjs';

describe('publishToVerdaccio — command construction', () => {
  it('runs npm publish with the given registry URL', () => {
    const executor = vi.fn().mockReturnValue('+ my-lib@1.0.0\n');

    publishToVerdaccio({
      packageDir: '/tmp/candidate-pack',
      registryUrl: 'http://localhost:4873',
      executor,
    });

    expect(executor).toHaveBeenCalledWith('npm publish --registry http://localhost:4873', {
      cwd: '/tmp/candidate-pack',
    });
  });

  it('runs the command with cwd set to packageDir', () => {
    const executor = vi.fn().mockReturnValue('');

    publishToVerdaccio({
      packageDir: '/another/path',
      registryUrl: 'http://localhost:4873',
      executor,
    });

    const [, options] = executor.mock.calls[0] as [string, { cwd: string }];
    expect(options.cwd).toBe('/another/path');
  });

  it('returns whatever the executor returns', () => {
    const executor = vi.fn().mockReturnValue('publish output');

    const result = publishToVerdaccio({
      packageDir: '/tmp/candidate-pack',
      registryUrl: 'http://localhost:4873',
      executor,
    });

    expect(result).toBe('publish output');
  });
});

describe('publishToVerdaccio — failure propagation', () => {
  it('propagates an executor error rather than swallowing it', () => {
    const executor = vi.fn().mockImplementation(() => {
      throw new Error('npm publish failed: 403 Forbidden');
    });

    expect(() =>
      publishToVerdaccio({
        packageDir: '/tmp/candidate-pack',
        registryUrl: 'http://localhost:4873',
        executor,
      }),
    ).toThrow('npm publish failed: 403 Forbidden');
  });
});

describe('parseArgs', () => {
  it('parses --dir and --registry', () => {
    const result = parseArgs([
      '--dir',
      '/tmp/candidate-pack',
      '--registry',
      'http://localhost:4873',
    ]);
    expect(result).toEqual({ dir: '/tmp/candidate-pack', registry: 'http://localhost:4873' });
  });

  it('throws when --dir is missing', () => {
    expect(() => parseArgs(['--registry', 'http://localhost:4873'])).toThrow(/Usage/);
  });

  it('throws when --registry is missing', () => {
    expect(() => parseArgs(['--dir', '/tmp/candidate-pack'])).toThrow(/Usage/);
  });
});
