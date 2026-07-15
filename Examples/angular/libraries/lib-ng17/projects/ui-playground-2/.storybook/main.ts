import type { StorybookConfig } from '@storybook/angular';

/**
 * Storybook host for @op/core-controls. Stories live alongside the controls'
 * demo app; the controls themselves are consumed from the built libraries in
 * dist/ via the workspace `@op/*` tsconfig paths.
 */
const config: StorybookConfig = {
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  stories: ['../src/**/*.stories.ts', '../src/**/*.mdx'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  docs: {
    autodocs: 'tag',
  },
  webpackFinal: async (webpackConfig, { configType }) => {
    // In development, surface source maps from the built @op libraries so
    // stepping into a control lands in its real source rather than a bundle.
    if (configType === 'DEVELOPMENT') {
      webpackConfig.module = webpackConfig.module ?? {};
      webpackConfig.module.rules = webpackConfig.module.rules ?? [];
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        enforce: 'pre',
        loader: 'source-map-loader',
        include: [/dist[\\/]op-/, /node_modules[\\/]@op/],
      });
    }
    return webpackConfig;
  },
};

export default config;
