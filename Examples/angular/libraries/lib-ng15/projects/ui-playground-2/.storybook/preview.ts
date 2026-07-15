import type { Preview } from '@storybook/angular';

/**
 * Global styles for the preview iframe — the PrimeNG `lara-light-blue` theme,
 * primeng base, PrimeIcons and Bootstrap, plus the preview-only `styles.scss` —
 * are loaded via the `ui-playground-2` build target's `styles` array in
 * angular.json, which @storybook/angular injects into the preview. This keeps
 * the SCSS/CSS out of the TypeScript compilation while still wiring the full
 * global stylesheet stack the controls expect.
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        date: /Date$/i,
        color: /(background|color)$/i,
      },
      expanded: true,
    },
    a11y: {
      element: '#storybook-root',
    },
    docs: {
      toc: true,
    },
    options: {
      storySort: {
        order: ['Core Controls', ['Dropdown', 'Input', 'Date Picker', 'Multi-Select']],
      },
    },
  },
};

export default preview;
