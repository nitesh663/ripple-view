/**
 * Unit tests for  acceptance criteria — inject-override.js, pnpm and
 * yarn paths. Split from inject-override.test.ts to stay under the
 * 200-line file limit.
 *
 * AC-1: Given a candidate version, when provisioning, an override is
 *       injected into a throwaway copy and resolves transitively (proven by
 *       asserting the merged package.json override shape AND that the
 *       matching lockfile's target-package entries are pruned).
 *
 * All I/O uses in-memory fake readFileFn/writeFileFn/existsFn — no real fs
 * writes (G13 determinism).
 */

import { describe, it, expect } from 'vitest';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { injectOverride } from './inject-override.js';
import { makeFakeFs } from './fixtures/fakeFs.js';

const appDir = '/throwaway/app';

describe('AC-1: injectOverride — pnpm', () => {
  it('injects a pnpm.overrides field and prunes only the target package from pnpm-lock.yaml', () => {
    const lockfile = {
      importers: { '.': { dependencies: { lodash: { specifier: '^4.0.0', version: '4.17.20' } } } },
      packages: { 'lodash@4.17.20': {}, 'foo@1.0.0': {} },
    };
    const fakeFs = makeFakeFs({
      [`${appDir}/package.json`]: JSON.stringify({ name: 'app' }),
      [`${appDir}/pnpm-lock.yaml`]: yamlStringify(lockfile),
    });

    const result = injectOverride({
      appDir,
      packageName: 'lodash',
      versionSpec: '4.17.21',
      pm: 'pnpm',
      readFileFn: fakeFs.readFileFn,
      writeFileFn: fakeFs.writeFileFn,
      existsFn: fakeFs.existsFn,
      yamlParse,
      yamlStringify,
    });

    expect(result.pm).toBe('pnpm');
    const writtenPackageJson = JSON.parse(fakeFs.files.get(`${appDir}/package.json`) as string);
    expect(writtenPackageJson.pnpm.overrides).toEqual({ lodash: '4.17.21' });

    const writtenLockfile = yamlParse(
      fakeFs.files.get(`${appDir}/pnpm-lock.yaml`) as string,
    ) as typeof lockfile;
    expect(writtenLockfile.packages['lodash@4.17.20']).toBeUndefined();
    expect(writtenLockfile.packages['foo@1.0.0']).toEqual(lockfile.packages['foo@1.0.0']);
  });

  it('throws a clear error if yamlParse/yamlStringify are not supplied but a lockfile exists', () => {
    const fakeFs = makeFakeFs({
      [`${appDir}/package.json`]: JSON.stringify({ name: 'app' }),
      [`${appDir}/pnpm-lock.yaml`]: 'importers: {}\n',
    });

    expect(() =>
      injectOverride({
        appDir,
        packageName: 'lodash',
        versionSpec: '4.17.21',
        pm: 'pnpm',
        readFileFn: fakeFs.readFileFn,
        writeFileFn: fakeFs.writeFileFn,
        existsFn: fakeFs.existsFn,
      }),
    ).toThrow(/yamlParse/);
  });
});

describe('AC-1: injectOverride — yarn', () => {
  it('injects a resolutions field and prunes only the target package from yarn.lock', () => {
    const yarnLock = `lodash@^4.0.0:
  version "4.17.20"
  integrity sha512-old

foo@^1.0.0:
  version "1.0.0"
  integrity sha512-foo
`;
    const fakeFs = makeFakeFs({
      [`${appDir}/package.json`]: JSON.stringify({ name: 'app' }),
      [`${appDir}/yarn.lock`]: yarnLock,
    });

    const result = injectOverride({
      appDir,
      packageName: 'lodash',
      versionSpec: '4.17.21',
      pm: 'yarn',
      readFileFn: fakeFs.readFileFn,
      writeFileFn: fakeFs.writeFileFn,
      existsFn: fakeFs.existsFn,
    });

    expect(result.pm).toBe('yarn');
    const writtenPackageJson = JSON.parse(fakeFs.files.get(`${appDir}/package.json`) as string);
    expect(writtenPackageJson.resolutions).toEqual({ lodash: '4.17.21' });

    const writtenLockfile = fakeFs.files.get(`${appDir}/yarn.lock`) as string;
    expect(writtenLockfile).not.toContain('lodash@^4.0.0');
    expect(writtenLockfile).toContain('foo@^1.0.0');
    expect(writtenLockfile).toContain('sha512-foo');
  });
});
