/**
 * Unit tests for  acceptance criteria — inject-override.js, npm path.
 *
 * AC-1: Given a candidate version, when provisioning, an override is
 *       injected into a throwaway copy and resolves transitively (proven by
 *       asserting the merged package.json override shape AND that the
 *       matching lockfile's target-package entries are pruned).
 * AC-2: Given a local PoC, a file:/pack override works with no registry —
 *       the script treats versionSpec as opaque, so a `file:...` spec
 *       round-trips identically to a plain semver string.
 *
 * pnpm/yarn coverage lives in inject-override.merge.test.ts (split to stay
 * under the 200-line file limit).
 *
 * All I/O uses in-memory fake readFileFn/writeFileFn/existsFn — no real fs
 * writes (G13 determinism).
 */

import { describe, it, expect } from 'vitest';
import { injectOverride } from './inject-override.js';
import { makeFakeFs } from './fixtures/fakeFs.js';

const appDir = '/throwaway/app';

describe('AC-1/AC-2: injectOverride — npm', () => {
  it('injects an npm override and prunes only the target package from package-lock.json', () => {
    const lockfile = {
      lockfileVersion: 3,
      packages: {
        '': { name: 'app' },
        'node_modules/lodash': { version: '4.17.20', integrity: 'sha512-old' },
        'node_modules/foo': { version: '1.0.0', integrity: 'sha512-foo' },
      },
    };
    const fakeFs = makeFakeFs({
      [`${appDir}/package.json`]: JSON.stringify({ name: 'app', version: '1.0.0' }),
      [`${appDir}/package-lock.json`]: JSON.stringify(lockfile),
    });

    const result = injectOverride({
      appDir,
      packageName: 'lodash',
      versionSpec: '4.17.21',
      readFileFn: fakeFs.readFileFn,
      writeFileFn: fakeFs.writeFileFn,
      existsFn: fakeFs.existsFn,
    });

    expect(result.pm).toBe('npm');

    const writtenPackageJson = JSON.parse(fakeFs.files.get(`${appDir}/package.json`) as string);
    expect(writtenPackageJson.overrides).toEqual({ lodash: '4.17.21' });

    const writtenLockfile = JSON.parse(fakeFs.files.get(`${appDir}/package-lock.json`) as string);
    expect(writtenLockfile.packages['node_modules/lodash']).toBeUndefined();
    expect(writtenLockfile.packages['node_modules/foo']).toEqual(
      lockfile.packages['node_modules/foo'],
    );
  });

  it('detects and uses npm-shrinkwrap.json in preference to package-lock.json when both exist', () => {
    const shrinkwrap = {
      lockfileVersion: 3,
      packages: { 'node_modules/lodash': { version: '4.17.20' } },
    };
    const packageLock = {
      lockfileVersion: 3,
      packages: { 'node_modules/lodash': { version: '9.9.9' } },
    };
    const fakeFs = makeFakeFs({
      [`${appDir}/package.json`]: JSON.stringify({ name: 'app' }),
      [`${appDir}/npm-shrinkwrap.json`]: JSON.stringify(shrinkwrap),
      [`${appDir}/package-lock.json`]: JSON.stringify(packageLock),
    });

    const result = injectOverride({
      appDir,
      packageName: 'lodash',
      versionSpec: '4.17.21',
      readFileFn: fakeFs.readFileFn,
      writeFileFn: fakeFs.writeFileFn,
      existsFn: fakeFs.existsFn,
    });

    expect(result.lockfilePath).toBe(`${appDir}/npm-shrinkwrap.json`);
    // package-lock.json must be left completely untouched
    expect(fakeFs.writeFileFn).not.toHaveBeenCalledWith(
      `${appDir}/package-lock.json`,
      expect.anything(),
      expect.anything(),
    );
    const writtenShrinkwrap = JSON.parse(
      fakeFs.files.get(`${appDir}/npm-shrinkwrap.json`) as string,
    );
    expect(writtenShrinkwrap.packages['node_modules/lodash']).toBeUndefined();
  });

  it('merge preserves pre-existing unrelated overrides already in package.json', () => {
    const fakeFs = makeFakeFs({
      [`${appDir}/package.json`]: JSON.stringify({
        name: 'app',
        overrides: { 'some-other-pkg': '2.0.0' },
      }),
    });

    injectOverride({
      appDir,
      packageName: 'lodash',
      versionSpec: '4.17.21',
      pm: 'npm',
      readFileFn: fakeFs.readFileFn,
      writeFileFn: fakeFs.writeFileFn,
      existsFn: fakeFs.existsFn,
    });

    const written = JSON.parse(fakeFs.files.get(`${appDir}/package.json`) as string);
    expect(written.overrides).toEqual({ 'some-other-pkg': '2.0.0', lodash: '4.17.21' });
  });

  it('AC-2: a file: override round-trips identically to a plain semver spec', () => {
    const fakeFs = makeFakeFs({
      [`${appDir}/package.json`]: JSON.stringify({ name: 'app' }),
    });

    injectOverride({
      appDir,
      packageName: 'my-lib',
      versionSpec: 'file:../candidate-pack',
      pm: 'npm',
      readFileFn: fakeFs.readFileFn,
      writeFileFn: fakeFs.writeFileFn,
      existsFn: fakeFs.existsFn,
    });

    const written = JSON.parse(fakeFs.files.get(`${appDir}/package.json`) as string);
    expect(written.overrides).toEqual({ 'my-lib': 'file:../candidate-pack' });
  });

  it('no lockfile present: injection still succeeds, override written, pruning skipped', () => {
    const fakeFs = makeFakeFs({
      [`${appDir}/package.json`]: JSON.stringify({ name: 'app' }),
    });

    const result = injectOverride({
      appDir,
      packageName: 'lodash',
      versionSpec: '4.17.21',
      pm: 'npm',
      readFileFn: fakeFs.readFileFn,
      writeFileFn: fakeFs.writeFileFn,
      existsFn: fakeFs.existsFn,
    });

    expect(result.lockfilePath).toBeNull();
    const written = JSON.parse(fakeFs.files.get(`${appDir}/package.json`) as string);
    expect(written.overrides).toEqual({ lodash: '4.17.21' });
  });
});
