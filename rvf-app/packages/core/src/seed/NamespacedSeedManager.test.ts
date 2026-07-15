import { describe, it, expect, vi } from 'vitest';
import { NamespacedSeedManager } from './NamespacedSeedManager.js';
import type { SeedProvider, SeedResult } from './types.js';

const makeResult = (namespace: string, ids: string[]): SeedResult => ({
  namespace,
  createdIds: ids,
});

const makeProvider = (name: string, overrides: Partial<SeedProvider> = {}): SeedProvider => ({
  name,
  seed: vi
    .fn()
    .mockImplementation(async (ctx: { namespace: string }) =>
      makeResult(ctx.namespace, [`${name}-id-1`]),
    ),
  teardown: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

// ── AC-1: seed before browser ─────────────────────────────────────────────────
describe('AC-1: seed establishes backend state before browser opens', () => {
  it('calls seed() on every registered provider', async () => {
    const p1 = makeProvider('users');
    const p2 = makeProvider('products');
    const manager = new NamespacedSeedManager([p1, p2], 'run-001');

    await manager.seedAll();

    expect(p1.seed).toHaveBeenCalledOnce();
    expect(p2.seed).toHaveBeenCalledOnce();
  });

  it('passes the correct namespace to each provider', async () => {
    const p1 = makeProvider('users');
    const p2 = makeProvider('orders');
    const manager = new NamespacedSeedManager([p1, p2], 'run-abc');

    await manager.seedAll();

    expect(p1.seed).toHaveBeenCalledWith(
      expect.objectContaining({ runId: 'run-abc', namespace: 'run-abc:users' }),
    );
    expect(p2.seed).toHaveBeenCalledWith(
      expect.objectContaining({ runId: 'run-abc', namespace: 'run-abc:orders' }),
    );
  });

  it('forwards env to the seed context', async () => {
    const p = makeProvider('users');
    const manager = new NamespacedSeedManager([p], 'run-001');
    const env = { API_URL: 'http://localhost:3000' };

    await manager.seedAll(env);

    expect(p.seed).toHaveBeenCalledWith(expect.objectContaining({ env }));
  });

  it('stores results so they can be retrieved before the browser opens', async () => {
    const p = makeProvider('users');
    const manager = new NamespacedSeedManager([p], 'run-001');

    await manager.seedAll();

    const result = manager.getResult('users');
    expect(result).toBeDefined();
    expect(result?.createdIds).toEqual(['users-id-1']);
    expect(manager.seededCount).toBe(1);
  });

  it('calls providers in registration order', async () => {
    const order: string[] = [];
    const p1 = makeProvider('a');
    (p1.seed as ReturnType<typeof vi.fn>).mockImplementation(async (ctx: { namespace: string }) => {
      order.push('a');
      return makeResult(ctx.namespace, []);
    });
    const p2 = makeProvider('b');
    (p2.seed as ReturnType<typeof vi.fn>).mockImplementation(async (ctx: { namespace: string }) => {
      order.push('b');
      return makeResult(ctx.namespace, []);
    });
    const manager = new NamespacedSeedManager([p1, p2], 'run-001');

    await manager.seedAll();

    expect(order).toEqual(['a', 'b']);
  });
});

// ── AC-2: teardown purges data ────────────────────────────────────────────────
describe('AC-2: teardown purges created data', () => {
  it('calls teardown() with the stored SeedResult for each provider', async () => {
    const p1 = makeProvider('users');
    const p2 = makeProvider('orders');
    const manager = new NamespacedSeedManager([p1, p2], 'run-001');

    await manager.seedAll();
    await manager.teardownAll();

    expect(p1.teardown).toHaveBeenCalledOnce();
    expect(p2.teardown).toHaveBeenCalledOnce();
    expect(p1.teardown).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: 'run-001:users', createdIds: ['users-id-1'] }),
    );
    expect(p2.teardown).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: 'run-001:orders', createdIds: ['orders-id-1'] }),
    );
  });

  it('calls teardown in reverse registration order (dependents before dependencies)', async () => {
    const order: string[] = [];
    const makeOrdered = (name: string): SeedProvider => ({
      name,
      seed: vi
        .fn()
        .mockImplementation(async (ctx: { namespace: string }) => makeResult(ctx.namespace, [])),
      teardown: vi.fn().mockImplementation(async () => {
        order.push(name);
      }),
    });
    const p1 = makeOrdered('a');
    const p2 = makeOrdered('b');
    const p3 = makeOrdered('c');
    const manager = new NamespacedSeedManager([p1, p2, p3], 'run-001');

    await manager.seedAll();
    await manager.teardownAll();

    expect(order).toEqual(['c', 'b', 'a']);
  });

  it('clears results after teardown', async () => {
    const p = makeProvider('users');
    const manager = new NamespacedSeedManager([p], 'run-001');

    await manager.seedAll();
    expect(manager.getResult('users')).toBeDefined();

    await manager.teardownAll();

    expect(manager.getResult('users')).toBeUndefined();
    expect(manager.seededCount).toBe(0);
  });

  it('is safe to call teardownAll() when nothing has been seeded', async () => {
    const p = makeProvider('users');
    const manager = new NamespacedSeedManager([p], 'run-001');

    await expect(manager.teardownAll()).resolves.toBeUndefined();
    expect(p.teardown).not.toHaveBeenCalled();
  });
});

// ── T-2.2.2: namespace isolation between parallel runs ───────────────────────
describe('T-2.2.2: namespace isolation', () => {
  it('two managers with different runIds produce distinct namespaces', async () => {
    const capturedNamespaces: string[] = [];
    const makeCapturing = (name: string): SeedProvider => ({
      name,
      seed: vi.fn().mockImplementation(async (ctx: { namespace: string }) => {
        capturedNamespaces.push(ctx.namespace);
        return makeResult(ctx.namespace, []);
      }),
      teardown: vi.fn().mockResolvedValue(undefined),
    });

    const m1 = new NamespacedSeedManager([makeCapturing('users')], 'run-AAA');
    const m2 = new NamespacedSeedManager([makeCapturing('users')], 'run-BBB');

    await m1.seedAll();
    await m2.seedAll();

    expect(capturedNamespaces).toHaveLength(2);
    expect(capturedNamespaces[0]).toBe('run-AAA:users');
    expect(capturedNamespaces[1]).toBe('run-BBB:users');
    expect(capturedNamespaces[0]).not.toBe(capturedNamespaces[1]);
  });

  it('namespace is always "<runId>:<providerName>"', async () => {
    const p = makeProvider('my-provider');
    const manager = new NamespacedSeedManager([p], 'run-XYZ');

    await manager.seedAll();

    const result = manager.getResult('my-provider');
    expect(result?.namespace).toBe('run-XYZ:my-provider');
  });
});
