/* Allow side-effect imports of stylesheet assets from TypeScript (used by
   .storybook/preview.ts to load the global PrimeNG theme, PrimeIcons and
   Bootstrap). Webpack resolves the actual files; these declarations keep the
   Angular TypeScript compilation happy. */
declare module '*.css';
declare module '*.scss';
