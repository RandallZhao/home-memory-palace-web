import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: {
    preserveSymlinks: true,
  },
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets/bundled',
    sourcemap: false,
    chunkSizeWarningLimit: 750,
  },
});
