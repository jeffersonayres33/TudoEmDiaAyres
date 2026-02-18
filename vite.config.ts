import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      // Importante: usar './' para que os caminhos sejam relativos à subpasta do GitHub
      base: './',
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor': ['react', 'react-dom', 'lucide-react', 'recharts']
            }
          }
        }
      }
    };
});