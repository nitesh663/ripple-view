import { describe, it, expect } from 'vitest';
import { loadPlugin, PluginLoadError, SPI_VERSION } from './loader.js';
import type { RippleViewPlugin, SceneProvider } from './spi/types.js';

// ── Test helpers ──────────────────────────────────────────────────────────────

const makeSceneProvider = (): SceneProvider => ({
  name: 'test',
  async listScenes() {
    return [];
  },
  async renderScene() {
    // no-op
  },
});

const makePlugin = (overrides: Partial<RippleViewPlugin> = {}): RippleViewPlugin => ({
  spiVersion: SPI_VERSION,
  name: 'test-plugin',
  sceneProvider: makeSceneProvider(),
  ...overrides,
});

// ── AC-1: plugin is dynamically loaded from module specifier ──────────────────

describe('AC-1: loadPlugin — successful load', () => {
  it('returns the plugin when module, export, and version are correct', async () => {
    const importFn = async () => ({ createPlugin: () => makePlugin() });
    const plugin = await loadPlugin('test-module', 'createPlugin', importFn);
    expect(plugin.name).toBe('test-plugin');
    expect(plugin.spiVersion).toBe(SPI_VERSION);
  });

  it('returns a plugin with a sceneProvider', async () => {
    const importFn = async () => ({ createPlugin: () => makePlugin() });
    const plugin = await loadPlugin('test-module', 'createPlugin', importFn);
    expect(plugin.sceneProvider?.name).toBe('test');
  });

  it('resolves multiple plugins independently', async () => {
    const importFn = async () => ({
      createPlugin: () => makePlugin({ name: 'plugin-a' }),
    });
    const plugin = await loadPlugin('module-a', 'createPlugin', importFn);
    expect(plugin.name).toBe('plugin-a');
  });
});

// ── AC-2: SPI version mismatch → PluginLoadError with a clear message ─────────

describe('AC-2: loadPlugin — SPI version mismatch', () => {
  it('throws PluginLoadError with code PLUGIN_VERSION_MISMATCH', async () => {
    const importFn = async () => ({
      createPlugin: () => makePlugin({ spiVersion: 99 }),
    });
    await expect(loadPlugin('test-module', 'createPlugin', importFn)).rejects.toMatchObject({
      code: 'PLUGIN_VERSION_MISMATCH',
    });
  });

  it('error message names both the plugin version and the core version', async () => {
    const importFn = async () => ({
      createPlugin: () => makePlugin({ spiVersion: 99 }),
    });
    try {
      await loadPlugin('test-module', 'createPlugin', importFn);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PluginLoadError);
      const loadErr = err as PluginLoadError;
      expect(loadErr.message).toMatch('99');
      expect(loadErr.message).toMatch(String(SPI_VERSION));
    }
  });

  it('error is an instance of Error as well as PluginLoadError', async () => {
    const importFn = async () => ({
      createPlugin: () => makePlugin({ spiVersion: 0 }),
    });
    await expect(loadPlugin('test-module', 'createPlugin', importFn)).rejects.toBeInstanceOf(
      PluginLoadError,
    );
  });
});

// ── Error cases ───────────────────────────────────────────────────────────────

describe('loadPlugin — error cases', () => {
  it('throws PLUGIN_NOT_FOUND when import throws', async () => {
    const importFn = async (): Promise<unknown> => {
      throw new Error('Module not found');
    };
    await expect(loadPlugin('bad-module', 'createPlugin', importFn)).rejects.toMatchObject({
      code: 'PLUGIN_NOT_FOUND',
    });
  });

  it('error message includes the specifier on PLUGIN_NOT_FOUND', async () => {
    const importFn = async (): Promise<unknown> => {
      throw new Error('Cannot find');
    };
    try {
      await loadPlugin('@my-scope/missing-plugin', 'createPlugin', importFn);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PluginLoadError);
      expect((err as PluginLoadError).message).toContain('@my-scope/missing-plugin');
    }
  });

  it('throws PLUGIN_EXPORT_MISSING when the named export does not exist', async () => {
    const importFn = async () => ({ otherExport: () => ({}) });
    await expect(loadPlugin('test-module', 'createPlugin', importFn)).rejects.toMatchObject({
      code: 'PLUGIN_EXPORT_MISSING',
    });
  });

  it('throws PLUGIN_EXPORT_MISSING when the export is not a function', async () => {
    const importFn = async () => ({ createPlugin: 42 });
    await expect(loadPlugin('test-module', 'createPlugin', importFn)).rejects.toMatchObject({
      code: 'PLUGIN_EXPORT_MISSING',
    });
  });

  it('throws PLUGIN_EXPORT_MISSING when module exports null', async () => {
    const importFn = async () => null;
    await expect(loadPlugin('test-module', 'createPlugin', importFn)).rejects.toMatchObject({
      code: 'PLUGIN_EXPORT_MISSING',
    });
  });

  it('throws PLUGIN_EXPORT_MISSING when module exports a primitive', async () => {
    const importFn = async () => 'not-an-object';
    await expect(loadPlugin('test-module', 'createPlugin', importFn)).rejects.toMatchObject({
      code: 'PLUGIN_EXPORT_MISSING',
    });
  });
});
