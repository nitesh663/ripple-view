import { describe, it, expect, vi, afterEach } from 'vitest';
import { dashboardCommand } from './dashboard.js';

// Prevent the real server from starting during tests
vi.mock('@rippleview/dashboard', () => ({
  startServer: vi.fn().mockResolvedValue(undefined),
}));

// Resolve immediately so dashboardCommand returns without waiting for OS signals
const STOP = Promise.resolve();

afterEach(() => {
  vi.clearAllMocks();
});

describe('dashboardCommand', () => {
  it('returns exitCode 0 for a valid port', async () => {
    const result = await dashboardCommand({
      input: './registry.json',
      port: '9999',
      stopSignal: STOP,
    });
    expect(result.exitCode).toBe(0);
  });

  it('returns exitCode 1 for a non-numeric port', async () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const result = await dashboardCommand({
      input: './registry.json',
      port: 'abc',
      stopSignal: STOP,
    });
    expect(result.exitCode).toBe(1);
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid --port'));
    stderrSpy.mockRestore();
  });

  it('returns exitCode 1 for port 0 (out of range)', async () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const result = await dashboardCommand({
      input: './registry.json',
      port: '0',
      stopSignal: STOP,
    });
    expect(result.exitCode).toBe(1);
    stderrSpy.mockRestore();
  });

  it('calls startServer with parsed port and input path', async () => {
    const { startServer } = await import('@rippleview/dashboard');
    await dashboardCommand({ input: '/custom/registry.json', port: '8080', stopSignal: STOP });
    expect(startServer).toHaveBeenCalledWith({ registryPath: '/custom/registry.json', port: 8080 });
  });

  it('starts with empty registry when --input is omitted', async () => {
    const { startServer } = await import('@rippleview/dashboard');
    await dashboardCommand({ port: '9999', stopSignal: STOP });
    expect(startServer).toHaveBeenCalledWith({ registryPath: undefined, port: 9999 });
  });
});
