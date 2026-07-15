// ── SPI types ─────────────────────────────────────────────────────────────────
export type {
  Scene,
  Capture,
  SignalResult,
  GateDecision,
  RegistryMetadata,
  SceneProvider,
  StateProbe,
  DiffSignal,
  BaselineStore,
  RegistrySource,
  Notifier,
  SecretsProvider,
  RippleViewPlugin,
} from './spi/types.js';

// ── Loader ────────────────────────────────────────────────────────────────────
export { SPI_VERSION, PluginLoadError, loadPlugin } from './loader.js';
export type { PluginErrorCode, ImportFn } from './loader.js';

// ── Registry ──────────────────────────────────────────────────────────────────
export { PluginRegistry } from './registry.js';

// ── Built-ins ─────────────────────────────────────────────────────────────────
export { createPlugin as createNoopSceneProvider } from './built-ins/noop-scene-provider.js';
