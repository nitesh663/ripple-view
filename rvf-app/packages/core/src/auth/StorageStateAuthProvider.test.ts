import { describe, it, expect, vi } from 'vitest';
import { StorageStateAuthProvider } from './StorageStateAuthProvider.js';
import type { AuthState } from './types.js';

const makeRawState = (): AuthState => ({
  cookies: [
    {
      name: 'sid',
      value: 'abc',
      domain: 'example.com',
      path: '/',
      expires: -1,
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
  ],
  capturedAt: 0,
});

describe('StorageStateAuthProvider.authenticate', () => {
  it('calls the hook and stamps capturedAt and expiresAt', async () => {
    const hook = vi.fn().mockResolvedValue(makeRawState());
    const now = vi.fn().mockReturnValue(1000);
    const provider = new StorageStateAuthProvider(hook, 5000, now);

    const state = await provider.authenticate({});

    expect(hook).toHaveBeenCalledOnce();
    expect(state.capturedAt).toBe(1000);
    expect(state.expiresAt).toBe(6000); // 1000 + 5000
  });

  it('preserves cookies from the hook response', async () => {
    const hook = vi.fn().mockResolvedValue(makeRawState());
    const provider = new StorageStateAuthProvider(hook, 5000, () => 0);
    const state = await provider.authenticate({});
    expect(state.cookies).toHaveLength(1);
    expect(state.cookies?.[0]?.name).toBe('sid');
  });
});

describe('StorageStateAuthProvider.isValid', () => {
  it('returns true when now < expiresAt', () => {
    const provider = new StorageStateAuthProvider(vi.fn(), 5000, () => 500);
    expect(provider.isValid({ capturedAt: 0, expiresAt: 1000 })).toBe(true);
  });

  it('returns false when now >= expiresAt', () => {
    const provider = new StorageStateAuthProvider(vi.fn(), 5000, () => 1000);
    expect(provider.isValid({ capturedAt: 0, expiresAt: 1000 })).toBe(false);
  });

  it('returns true when expiresAt is undefined (never expires)', () => {
    const provider = new StorageStateAuthProvider(vi.fn(), 5000, () => 99999);
    expect(provider.isValid({ capturedAt: 0 })).toBe(true);
  });
});

describe('StorageStateAuthProvider.restore', () => {
  it('is a no-op and resolves without error', async () => {
    const provider = new StorageStateAuthProvider(vi.fn(), 5000, () => 0);
    await expect(provider.restore()).resolves.toBeUndefined();
  });
});
