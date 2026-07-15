import type {
  RippleViewPlugin,
  SceneProvider,
  StateProbe,
  DiffSignal,
  BaselineStore,
  RegistrySource,
  Notifier,
  SecretsProvider,
} from './spi/types.js';

/**
 * Holds registered plugins and provides typed accessors per SPI interface.
 *
 * Instantiate one registry per run; never share state across runs (G13).
 * Plugins are registered via `register()` — usually after `loadPlugin()`.
 */
export class PluginRegistry {
  private readonly _plugins: RippleViewPlugin[] = [];

  /** Register a plugin. Plugins are returned in registration order. */
  register(plugin: RippleViewPlugin): void {
    this._plugins.push(plugin);
  }

  /** All registered plugins in insertion order. */
  get all(): readonly RippleViewPlugin[] {
    return this._plugins;
  }

  /** All SceneProvider implementations across registered plugins. */
  getSceneProviders(): SceneProvider[] {
    return this._plugins.flatMap((p) => (p.sceneProvider !== undefined ? [p.sceneProvider] : []));
  }

  /** All StateProbe implementations across registered plugins. */
  getStateProbes(): StateProbe[] {
    return this._plugins.flatMap((p) => (p.stateProbe !== undefined ? [p.stateProbe] : []));
  }

  /** All DiffSignal implementations across registered plugins. */
  getDiffSignals(): DiffSignal[] {
    return this._plugins.flatMap((p) => (p.diffSignal !== undefined ? [p.diffSignal] : []));
  }

  /** All BaselineStore implementations across registered plugins. */
  getBaselineStores(): BaselineStore[] {
    return this._plugins.flatMap((p) => (p.baselineStore !== undefined ? [p.baselineStore] : []));
  }

  /** All RegistrySource implementations across registered plugins. */
  getRegistrySources(): RegistrySource[] {
    return this._plugins.flatMap((p) => (p.registrySource !== undefined ? [p.registrySource] : []));
  }

  /** All Notifier implementations across registered plugins. */
  getNotifiers(): Notifier[] {
    return this._plugins.flatMap((p) => (p.notifier !== undefined ? [p.notifier] : []));
  }

  /** All SecretsProvider implementations across registered plugins. */
  getSecretsProviders(): SecretsProvider[] {
    return this._plugins.flatMap((p) =>
      p.secretsProvider !== undefined ? [p.secretsProvider] : [],
    );
  }
}
