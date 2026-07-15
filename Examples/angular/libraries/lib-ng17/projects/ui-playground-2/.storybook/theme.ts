import { create } from '@storybook/theming/create';

/** Custom branded Storybook theme for the @op UI library. */
export default create({
  base: 'light',
  brandTitle: 'OP UI Library — Core Controls',
  brandUrl: 'https://operative.com',
  brandTarget: '_self',

  colorPrimary: '#1d4ed8',
  colorSecondary: '#1d4ed8',

  // UI
  appBg: '#f8f9fa',
  appContentBg: '#ffffff',
  appBorderColor: '#dee2e6',
  appBorderRadius: 8,

  // Typography
  fontBase: '"Inter", "Segoe UI", Roboto, sans-serif',
  fontCode: '"Fira Code", "Consolas", monospace',

  // Toolbar / text
  textColor: '#343a40',
  textInverseColor: '#ffffff',
  barTextColor: '#6c757d',
  barSelectedColor: '#1d4ed8',
  barBg: '#ffffff',

  // Form controls
  inputBg: '#ffffff',
  inputBorder: '#ced4da',
  inputTextColor: '#343a40',
  inputBorderRadius: 6,
});
