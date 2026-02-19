import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Crucial para GitHub Pages e ambientes de preview
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['jspdf', 'recharts']
        }
      }
    }
  }
  // Fix: Removed the 'server' block because 'historyApiFallback' is not a valid Vite configuration property.
  // Vite's development server automatically provides history API fallback for SPA routing.
});