import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      renderer: path.resolve(__dirname, './src/renderer'),
      Backend: path.resolve(__dirname, './src/Backend'),
      src: path.resolve(__dirname, './src'),
      electron: path.resolve(__dirname, './src/renderer/electron-shim.js'),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});