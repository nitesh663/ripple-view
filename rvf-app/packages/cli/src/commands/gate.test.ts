import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { gateCommand } from './gate.js';
import type { GateDeps } from './gateDeps.js';

// Real temp dir for the app fixture — mirrors bundle.test.ts's convention;
// gateCommand's own copy-to-tmp step is a fast, pure-local fs op (G13).

let fixtureRoot: string;
let appDir: string;

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'rv-cli-gate-'));
  appDir = join(fixtureRoot, 'fixture-app');
  mkdirSync(join(appDir, 'src'), { recursive: true });
  writeFileSync(join(appDir, 'package.json'), JSON.stringify({ name: 'fixture-app' }));
  writeFileSync(join(appDir, 'src', 'index.js'), "console.log('hi');\n");
  writeFileSync(join(appDir, 'rippleview.config.yaml'), 'department: default\n');
});

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

/** A fully-faked GateDeps bundle — no real docker/network ever invoked (G13). */
function fakeDeps(overrides: Partial<GateDeps> = {}): Partial<GateDeps> {
  return {
    copyAppToTmp: vi.fn().mockReturnValue(appDir),
    injectOverride: vi.fn(),
    resolveBuildContract: vi.fn().mockReturnValue({
      nodeVersion: '20',
      buildCmd: '',
      outputDir: 'dist',
      serveMode: 'static',
      startCmd: '',
      port: 3000,
    }),
    buildAppRuntime: vi.fn().mockReturnValue({ ok: true, imageTag: 'app-runtime:test' }),
    generateComposeYaml: vi.fn().mockReturnValue('services: {}\n'),
    runIsolationUnit: vi.fn().mockReturnValue({
      status: 'passed',
      exitCode: 0,
      durationMs: 10,
      flaky: false,
      findings: [],
    }),
    writeFileFn: vi.fn(),
    mkdirp: vi.fn(),
    cleanupTmp: vi.fn(),
    idGen: () => 'fixed-id',
    ...overrides,
  };
}

describe('gateCommand — scope guard', () => {
  it('returns exitCode 1 with an explanatory message when --local is omitted', async () => {
    const result = await gateCommand({ local: false, app: appDir, deps: fakeDeps() });
    expect(result).toEqual({ exitCode: 1 });
  });
});

describe('gateCommand — nonexistent --app', () => {
  it('returns exitCode 1 without throwing for a missing app directory', async () => {
    await expect(
      gateCommand({ local: true, app: '/nonexistent/app/dir', deps: fakeDeps() }),
    ).resolves.toEqual({ exitCode: 1 });
  });
});

describe('gateCommand — happy path (AC-1/AC-2)', () => {
  it('exits 0 with status passed when build + isolation unit both succeed', async () => {
    const deps = fakeDeps();
    const result = await gateCommand({ local: true, app: appDir, deps });

    expect(result).toEqual({ exitCode: 0, status: 'passed' });
    expect(deps.buildAppRuntime).toHaveBeenCalledTimes(1);
    expect(deps.runIsolationUnit).toHaveBeenCalledTimes(1);
    expect(deps.writeFileFn).toHaveBeenCalled(); // compose file + summary.json
  });

  it('injects the version override when --package and --version are both provided', async () => {
    const deps = fakeDeps();
    await gateCommand({
      local: true,
      app: appDir,
      package: '@enterprise/datagrid',
      version: '2.0.0',
      deps,
    });

    expect(deps.injectOverride).toHaveBeenCalledWith(
      expect.objectContaining({ packageName: '@enterprise/datagrid', versionSpec: '2.0.0' }),
    );
  });

  it('does not inject an override when --package/--version are omitted', async () => {
    const deps = fakeDeps();
    await gateCommand({ local: true, app: appDir, deps });
    expect(deps.injectOverride).not.toHaveBeenCalled();
  });
});

describe('gateCommand — build failure (retry-once)', () => {
  it('retries the build once, then records an errored summary on a persistent failure', async () => {
    const finding = {
      id: 'f1',
      component: 'app-runtime-build',
      confidence: 0,
      severity: 'critical' as const,
      message: 'compile error',
    };
    const buildAppRuntime = vi.fn().mockReturnValue({ ok: false, finding });
    const deps = fakeDeps({ buildAppRuntime });

    const result = await gateCommand({ local: true, app: appDir, deps });

    expect(buildAppRuntime).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ exitCode: 1, status: 'errored' });
    expect(deps.runIsolationUnit).not.toHaveBeenCalled();
  });

  it('succeeds without a second attempt when the first build attempt succeeds', async () => {
    const deps = fakeDeps();
    await gateCommand({ local: true, app: appDir, deps });
    expect(deps.buildAppRuntime).toHaveBeenCalledTimes(1);
  });

  it('recovers when the retry attempt succeeds after a transient first failure', async () => {
    const finding = {
      id: 'f1',
      component: 'app-runtime-build',
      confidence: 0,
      severity: 'critical' as const,
      message: 'registry timeout',
    };
    let callCount = 0;
    const buildAppRuntime = vi.fn().mockImplementation(() => {
      callCount += 1;
      return callCount === 1
        ? { ok: false, finding }
        : { ok: true, imageTag: 'app-runtime:retry-ok' };
    });
    const deps = fakeDeps({ buildAppRuntime });

    const result = await gateCommand({ local: true, app: appDir, deps });

    expect(result.exitCode).toBe(0);
    expect(result.status).toBe('passed');
  });
});

describe('gateCommand — temp dir cleanup always runs (hygiene)', () => {
  it('cleans up the temp copy on the happy path', async () => {
    const deps = fakeDeps();
    await gateCommand({ local: true, app: appDir, deps });
    expect(deps.cleanupTmp).toHaveBeenCalledTimes(1);
  });

  it('cleans up the temp copy even when the build fails persistently', async () => {
    const finding = {
      id: 'f1',
      component: 'app-runtime-build',
      confidence: 0,
      severity: 'critical' as const,
      message: 'compile error',
    };
    const buildAppRuntime = vi.fn().mockReturnValue({ ok: false, finding });
    const deps = fakeDeps({ buildAppRuntime });
    await gateCommand({ local: true, app: appDir, deps });
    expect(deps.cleanupTmp).toHaveBeenCalledTimes(1);
  });

  it('cleans up the temp copy when the isolation unit errors', async () => {
    const runIsolationUnit = vi.fn().mockReturnValue({
      status: 'errored',
      exitCode: 1,
      durationMs: 5,
      flaky: false,
      findings: [],
    });
    const deps = fakeDeps({ runIsolationUnit });
    await gateCommand({ local: true, app: appDir, deps });
    expect(deps.cleanupTmp).toHaveBeenCalledTimes(1);
  });
});

describe('gateCommand — isolation unit failure/errored paths (AC-3)', () => {
  it('maps a failed isolation unit to exitCode 1', async () => {
    const runIsolationUnit = vi.fn().mockReturnValue({
      status: 'failed',
      exitCode: 1,
      durationMs: 5,
      flaky: false,
      findings: [],
    });
    const result = await gateCommand({
      local: true,
      app: appDir,
      deps: fakeDeps({ runIsolationUnit }),
    });
    expect(result).toEqual({ exitCode: 1, status: 'failed' });
  });

  it('maps an errored isolation unit (infra timeout) to exitCode 1, not a product fail', async () => {
    const runIsolationUnit = vi.fn().mockReturnValue({
      status: 'errored',
      exitCode: 1,
      durationMs: 5,
      flaky: false,
      findings: [
        {
          id: 'f1',
          component: 'isolation-unit-health',
          confidence: 0,
          severity: 'critical' as const,
          message: 'app never became healthy',
        },
      ],
    });
    const result = await gateCommand({
      local: true,
      app: appDir,
      deps: fakeDeps({ runIsolationUnit }),
    });
    expect(result).toEqual({ exitCode: 1, status: 'errored' });
  });
});
