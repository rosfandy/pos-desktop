import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        preload: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron', 'sql.js', 'node-thermal-printer', 'electron-updater'],
              input: {
                main: resolve(__dirname, 'electron/main.ts'),
                preload: resolve(__dirname, 'electron/preload.ts'),
              },
            },
          },
        },
      },
    ]),
  ],
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve('src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  base: './',
  build: {
    outDir: 'dist',
  },
});
