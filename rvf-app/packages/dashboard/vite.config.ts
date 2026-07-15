import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: join(__dirname, 'ui'),
  build: {
    outDir: join(__dirname, 'dist', 'ui'),
    emptyOutDir: true,
  },
  server: {
    // Proxy API calls to the Fastify server when running `vite` in dev mode
    proxy: {
      '/api': 'http://localhost:9999',
    },
  },
});
