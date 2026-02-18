import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Use path.resolve() instead of process.cwd() to avoid TypeScript errors on global process object
    const rootDir = path.resolve();
    const env = loadEnv(mode, rootDir, '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      // Importante: usar './' para que os caminhos sejam relativos à subpasta do GitHub
      base: './',
      plugins: [react()],
      define: {
        // Ensures the API_KEY is available in the client-side code
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || ''),
      },
      resolve: {
        alias: {
          // Use the resolved rootDir variable instead of __dirname which is not defined in ESM
          '@': rootDir,
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