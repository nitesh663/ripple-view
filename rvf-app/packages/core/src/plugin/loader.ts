import type { RippleViewPlugin } from './spi/types.js';

/**
 * Current SPI major version.
 *
 * G16: a breaking change to the SPI (renaming/removing an interface, changing a
 *      method signature) requires a core major version bump. Plugins declare the
 *      SPI version they target and are rejected if it does not match this constant.
 */
export const SPI_VERSION = 1;

export type PluginErrorCode =
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_EXPORT_MISSING'
  | 'PLUGIN_VERSION_MISMATCH';

/** Thrown for infrastructure/programmer errors during plugin loading. */
export class PluginLoadError extends Error {
  readonly code: PluginErrorCode;

  constructor(code: PluginErrorCode, message: string) {
    super(message);
    this.name = 'PluginLoadError';
    this.code = code;
  }
}

/**
 * Injectable import function — defaults to native ESM dynamic import.
 * Tests inject a mock to avoid real module resolution (G13).
 */
export type ImportFn = (specifier: string) => Promise<unknown>;

/**
 * Dynamically load and validate an RippleView plugin.
 *
 * @param moduleSpecifier - npm package name or local path (e.g. '@rippleview/plugin-storybook')
 * @param exportName      - named export that is the plugin factory function (e.g. 'createPlugin')
 * @param importFn        - injectable for testing (G13); defaults to native dynamic import
 *
 * Throws `PluginLoadError` with one of:
 * - `PLUGIN_NOT_FOUND` — the module cannot be imported
 * - `PLUGIN_EXPORT_MISSING` — the named export is absent or is not a function
 * - `PLUGIN_VERSION_MISMATCH` — `spiVersion !== SPI_VERSION` (G16)
 */
export async function loadPlugin(
  moduleSpecifier: string,
  exportName: string,
  importFn: ImportFn = (s) => import(s),
): Promise<RippleViewPlugin> {
  // 1. Import the module
  let mod: unknown;
  try {
    mod = await importFn(moduleSpecifier);
  } catch (err) {
    throw new PluginLoadError(
      'PLUGIN_NOT_FOUND',
      `Cannot import plugin "${moduleSpecifier}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 2. Locate the named export — module must be a non-null object
  if (typeof mod !== 'object' || mod === null) {
    throw new PluginLoadError(
      'PLUGIN_EXPORT_MISSING',
      `Plugin module "${moduleSpecifier}" did not export an object.`,
    );
  }
  const exports = mod as Record<string, unknown>;
  const factory = exports[exportName];
  if (typeof factory !== 'function') {
    throw new PluginLoadError(
      'PLUGIN_EXPORT_MISSING',
      `Plugin "${moduleSpecifier}" does not export a function named "${exportName}".`,
    );
  }

  // 3. Call the factory
  const plugin = (factory as () => RippleViewPlugin)();

  // 4. Version check (G16)
  if (plugin.spiVersion !== SPI_VERSION) {
    throw new PluginLoadError(
      'PLUGIN_VERSION_MISMATCH',
      `Plugin "${plugin.name}" targets SPI v${plugin.spiVersion} but this core requires SPI v${SPI_VERSION}. ` +
        `Update the plugin or pin a compatible core version.`,
    );
  }

  return plugin;
}
