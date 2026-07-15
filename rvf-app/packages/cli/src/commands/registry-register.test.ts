import { describe, it, expect, vi, afterEach } from 'vitest';
import { registryRegisterCommand } from './registry-register.js';

vi.mock('@rippleview/core', () => ({
  loadWorkspaceConfig: vi.fn(),
}));

vi.mock('@rippleview/registry', () => ({
  scanRegistry: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('registryRegisterCommand', () => {
  it('returns exitCode 1 when workspace config cannot be loaded', async () => {
    const { loadWorkspaceConfig } = await import('@rippleview/core');
    vi.mocked(loadWorkspaceConfig).mockImplementation(() => {
      throw new Error('not found');
    });

    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const result = await registryRegisterCommand({
      workspace: '/missing/rippleview.workspace.yaml',
      target: 'http://localhost:9999',
    });
    expect(result.exitCode).toBe(1);
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load'));
    stderrSpy.mockRestore();
  });

  it('returns exitCode 1 when scan fails', async () => {
    const { loadWorkspaceConfig } = await import('@rippleview/core');
    const { scanRegistry } = await import('@rippleview/registry');
    vi.mocked(loadWorkspaceConfig).mockReturnValue({
      name: 'test',
      packages: ['@op/core'],
    } as never);
    vi.mocked(scanRegistry).mockImplementation(() => {
      throw new Error('scan error');
    });

    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const result = await registryRegisterCommand({
      workspace: '/project/rippleview.workspace.yaml',
      target: 'http://localhost:9999',
    });
    expect(result.exitCode).toBe(1);
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to scan'));
    stderrSpy.mockRestore();
  });

  it('returns exitCode 1 when the dashboard is unreachable', async () => {
    const { loadWorkspaceConfig } = await import('@rippleview/core');
    const { scanRegistry } = await import('@rippleview/registry');
    vi.mocked(loadWorkspaceConfig).mockReturnValue({
      name: 'test',
      packages: ['@op/core'],
    } as never);
    vi.mocked(scanRegistry).mockReturnValue({
      angular: { '17': { '@op/core': { latest: '1.0.0', consumers: {} } } },
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const result = await registryRegisterCommand({
      workspace: '/project/rippleview.workspace.yaml',
      target: 'http://localhost:9999',
    });
    expect(result.exitCode).toBe(1);
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot reach dashboard'));
    stderrSpy.mockRestore();
  });

  it('returns exitCode 0 and reports channel count on success', async () => {
    const { loadWorkspaceConfig } = await import('@rippleview/core');
    const { scanRegistry } = await import('@rippleview/registry');
    vi.mocked(loadWorkspaceConfig).mockReturnValue({
      name: 'test',
      packages: ['@op/core'],
    } as never);
    vi.mocked(scanRegistry).mockReturnValue({
      angular: {
        '15': { '@op/core': { latest: '15.0.0', consumers: {} } },
        '17': { '@op/core': { latest: '17.0.0', consumers: {} } },
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => '' }));

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await registryRegisterCommand({
      workspace: '/project/rippleview.workspace.yaml',
      target: 'http://localhost:9999',
    });
    expect(result.exitCode).toBe(0);
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('2 channel(s)'));
    stdoutSpy.mockRestore();
  });
});
