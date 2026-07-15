import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    // tsc writes the .d.ts files into dist/ BEFORE this runs (see package.json's
    // build script order) - vite's default emptyOutDir would wipe them out.
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EnterpriseReactCoreControls',
      fileName: (format) => (format === 'es' ? 'react-core-controls.js' : 'react-core-controls.cjs'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'primereact', /^primereact\//],
    },
    cssCodeSplit: false,
  },
});
