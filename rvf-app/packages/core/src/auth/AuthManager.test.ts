import { describe, it, expect, vi } from 'vitest';
import { AuthManager } from './AuthManager.js';
import type { AuthProvider, AuthState } from './types.js';

const makeState = (expiresAt?: number): AuthState => ({
  capturedAt: 1000,
  ...(expiresAt !== undefined ? { expiresAt } : {}),
  cookies: [],
});

const makeProvider = (overrides: Partial<AuthProvider> = {}): AuthProvider => ({
  name: 'mock',
  authenticate: vi.fn().mockResolvedValue(makeState(99999)),
  restore: vi.fn().mockResolvedValue(undefined),
  isValid: vi.fn().mockReturnValue(true),
  ...overrides,
});

// ── AC-1: hook called once, injected into multiple contexts ───────────────────
describe('AC-1: authenticate once, share across workers', () => {
  it('calls authenticate only once for multiple hydrate() calls', async () => {
    const provider = makeProvider();
    const manager = new AuthManager(provider);

    await manager.hydrate('ctx-worker-1');
    await manager.hydrate('ctx-worker-2');
    await manager.hydrate('ctx-worker-3');

    expect(provider.authenticate).toHaveBeenCalledOnce();
  });

  it('calls restore for every hydrate() call', async () => {
    const provider = makeProvider();
    const manager = new AuthManager(provider);

    await manager.hydrate('ctx-1');
    await manager.hydrate('ctx-2');

    expect(provider.restore).toHaveBeenCalledTimes(2);
    expect(provider.restore).toHaveBeenCalledWith(
      expect.objectContaining({ capturedAt: 1000 }),
      'ctx-1',
    );
    expect(provider.restore).toHaveBeenCalledWith(
      expect.objectContaining({ capturedAt: 1000 }),
      'ctx-2',
    );
  });

  it('exposes the cached state after hydration', async () => {
    const provider = makeProvider();
    const manager = new AuthManager(provider);

    expect(manager.state).toBeNull();
    await manager.hydrate({});
    expect(manager.state).not.toBeNull();
    expect(manager.state?.capturedAt).toBe(1000);
  });
});

// ── AC-2: expired session triggers re-auth ────────────────────────────────────
describe('AC-2: expired session triggers re-authentication', () => {
  it('re-authenticates when isValid returns false', async () => {
    // isValid is only called when cachedState !== null, so:
    // - hydrate('ctx-1'): cachedState is null → isValid NOT called → authenticate called
    // - hydrate('ctx-2'): cachedState is set → isValid called → returns false → re-authenticate
    const provider = makeProvider({
      isValid: vi.fn().mockReturnValueOnce(false), // first isValid check: expired
    });
    const manager = new AuthManager(provider);

    await manager.hydrate('ctx-1');
    await manager.hydrate('ctx-2'); // session expired between calls

    expect(provider.authenticate).toHaveBeenCalledTimes(2);
  });

  it('does not re-authenticate when session is still valid', async () => {
    const provider = makeProvider({ isValid: vi.fn().mockReturnValue(true) });
    const manager = new AuthManager(provider);

    await manager.hydrate('ctx-1');
    await manager.hydrate('ctx-2');

    expect(provider.authenticate).toHaveBeenCalledOnce();
  });

  it('invalidate() forces re-authentication on next hydrate', async () => {
    const provider = makeProvider();
    const manager = new AuthManager(provider);

    await manager.hydrate('ctx-1');
    manager.invalidate();
    expect(manager.state).toBeNull();

    await manager.hydrate('ctx-2');
    expect(provider.authenticate).toHaveBeenCalledTimes(2);
  });
});

// ── getOrRefresh ──────────────────────────────────────────────────────────────
describe('getOrRefresh', () => {
  it('returns the cached state on subsequent calls while valid', async () => {
    const provider = makeProvider();
    const manager = new AuthManager(provider);

    const s1 = await manager.getOrRefresh('ctx');
    const s2 = await manager.getOrRefresh('ctx');

    expect(s1).toBe(s2); // same reference
    expect(provider.authenticate).toHaveBeenCalledOnce();
  });

  it('always authenticates on first call when cache is empty', async () => {
    const provider = makeProvider();
    const manager = new AuthManager(provider);

    await manager.getOrRefresh('ctx');

    expect(provider.authenticate).toHaveBeenCalledWith('ctx');
  });
});
