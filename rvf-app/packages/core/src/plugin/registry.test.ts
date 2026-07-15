import { describe, it, expect } from 'vitest';
import { PluginRegistry } from './registry.js';
import { loadPlugin, SPI_VERSION } from './loader.js';
import { createPlugin as createNoop } from './built-ins/noop-scene-provider.js';
import type { RippleViewPlugin } from './spi/types.js';

// ── Test helpers ──────────────────────────────────────────────────────────────

const makePlugin = (name: string, overrides: Partial<RippleViewPlugin> = {}): RippleViewPlugin => ({
  spiVersion: SPI_VERSION,
  name,
  ...overrides,
});

// ── PluginRegistry core behaviour ─────────────────────────────────────────────

describe('PluginRegistry', () => {
  it('starts empty', () => {
    const registry = new PluginRegistry();
    expect(registry.all).toHaveLength(0);
    expect(registry.getSceneProviders()).toHaveLength(0);
    expect(registry.getStateProbes()).toHaveLength(0);
    expect(registry.getDiffSignals()).toHaveLength(0);
    expect(registry.getBaselineStores()).toHaveLength(0);
    expect(registry.getRegistrySources()).toHaveLength(0);
    expect(registry.getNotifiers()).toHaveLength(0);
    expect(registry.getSecretsProviders()).toHaveLength(0);
  });

  it('register() adds a plugin to all()', () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin('p1'));
    expect(registry.all).toHaveLength(1);
  });

  it('getSceneProviders() returns only plugins that have sceneProvider', () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin('no-scene'));
    registry.register(
      makePlugin('with-scene', {
        sceneProvider: {
          name: 'sp',
          async listScenes() {
            return [];
          },
          async renderScene() {
            // no-op
          },
        },
      }),
    );
    expect(registry.getSceneProviders()).toHaveLength(1);
    expect(registry.getSceneProviders()[0]?.name).toBe('sp');
  });

  it('getDiffSignals() returns only plugins with diffSignal', () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin('no-diff'));
    registry.register(
      makePlugin('with-diff', {
        diffSignal: {
          name: 'geo',
          async compare() {
            return { name: 'geo', category: 'layout', severity: 'low', passed: true };
          },
        },
      }),
    );
    expect(registry.getDiffSignals()).toHaveLength(1);
    expect(registry.getDiffSignals()[0]?.name).toBe('geo');
  });

  it('getNotifiers() returns only plugins with notifier', () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin('no-notify'));
    registry.register(
      makePlugin('with-notify', {
        notifier: {
          name: 'slack',
          async notify() {
            // no-op
          },
        },
      }),
    );
    expect(registry.getNotifiers()).toHaveLength(1);
    expect(registry.getNotifiers()[0]?.name).toBe('slack');
  });

  it('getSecretsProviders() returns only plugins with secretsProvider', () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin('no-secrets'));
    registry.register(
      makePlugin('with-secrets', {
        secretsProvider: {
          name: 'vault',
          async getSecret() {
            return undefined;
          },
        },
      }),
    );
    expect(registry.getSecretsProviders()).toHaveLength(1);
    expect(registry.getSecretsProviders()[0]?.name).toBe('vault');
  });

  it('multiple plugins can coexist in the registry', () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin('p1'));
    registry.register(makePlugin('p2'));
    registry.register(makePlugin('p3'));
    expect(registry.all).toHaveLength(3);
  });

  it('all() is read-only (typed as readonly)', () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin('p1'));
    // Readonly array — TypeScript prevents .push(); runtime length is stable
    const all = registry.all;
    expect(all).toHaveLength(1);
  });
});

// ── T-1.4.3: built-in loaded via same loadPlugin path as external plugins ─────

describe('T-1.4.3: built-in registered through SPI', () => {
  it('noop scene provider loads via loadPlugin and registers correctly', async () => {
    // Inject a mock importFn that returns the actual noop built-in module.
    // This proves the factory pattern works end-to-end without real dynamic import (G13).
    const importFn = async () => ({ createPlugin: createNoop });
    const plugin = await loadPlugin('built-in:noop-scene-provider', 'createPlugin', importFn);

    const registry = new PluginRegistry();
    registry.register(plugin);

    expect(plugin.name).toBe('noop-scene-provider');
    expect(plugin.spiVersion).toBe(SPI_VERSION);
    expect(registry.getSceneProviders()).toHaveLength(1);
    expect(registry.getSceneProviders()[0]?.name).toBe('noop');
  });

  it('noop listScenes() returns an empty array', async () => {
    const importFn = async () => ({ createPlugin: createNoop });
    const plugin = await loadPlugin('built-in:noop', 'createPlugin', importFn);
    const scenes = await plugin.sceneProvider?.listScenes();
    expect(scenes).toEqual([]);
  });

  it('noop renderScene() resolves without throwing', async () => {
    const noop = createNoop();
    await expect(
      noop.sceneProvider?.renderScene({ id: 'home', name: 'Home' }, null),
    ).resolves.toBeUndefined();
  });

  it('noop plugin does not provide any other SPI implementation', () => {
    const noop = createNoop();
    expect(noop.stateProbe).toBeUndefined();
    expect(noop.diffSignal).toBeUndefined();
    expect(noop.baselineStore).toBeUndefined();
    expect(noop.registrySource).toBeUndefined();
    expect(noop.notifier).toBeUndefined();
    expect(noop.secretsProvider).toBeUndefined();
  });
});
