import type { RippleViewPlugin } from '../spi/types.js';
import { SPI_VERSION } from '../loader.js';

/**
 * No-op SceneProvider built-in.
 *
 * Loaded through the same factory path as external plugins (T-1.4.3), which
 * proves the SPI factory pattern is end-to-end consistent.
 *
 * Returns an empty scene list — real providers (Storybook, route-crawler, etc.)
 * are separate plugins (G11).
 */
export function createPlugin(): RippleViewPlugin {
  return {
    spiVersion: SPI_VERSION,
    name: 'noop-scene-provider',
    sceneProvider: {
      name: 'noop',
      async listScenes() {
        return [];
      },
      async renderScene() {
        // no-op: skeleton stage — real rendering lives in framework plugins
      },
    },
  };
}
