import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['path', 'fs', 'crypto'], // Evita que o bundler tente incluir módulos nativos do Node
    }
  }
});