import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Ensure a single React instance is used and pre-bundle Excalidraw.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'react', replacement: path.resolve(__dirname, 'node_modules/react') },
      { find: 'react-dom', replacement: path.resolve(__dirname, 'node_modules/react-dom') },
      { find: 'react/jsx-runtime', replacement: path.resolve(__dirname, 'node_modules/react/jsx-runtime') },
      { find: 'react/jsx-dev-runtime', replacement: path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime') },
    ],
  },
  optimizeDeps: {
    include: ['@excalidraw/excalidraw', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  ssr: {
    noExternal: ['@excalidraw/excalidraw']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.IS_PREACT': JSON.stringify('false'),
  },
  build: {
    // Reduce large vendor chunk sizes by splitting common libs
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('excalidraw')) return 'vendor-excalidraw';
            return 'vendor';
          }
        }
      }
    },
    // Relax warning threshold a bit to avoid noisy warnings for intentionally large chunks
    chunkSizeWarningLimit: 1500
  }
});
