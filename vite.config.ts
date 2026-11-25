import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import path from 'path';

// Ensure a single React instance is used and pre-bundle Excalidraw.
export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({ webp: { quality: 80 }, png: { quality: 80 }, jpeg: { quality: 80 } })
  ],
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
    esbuildOptions: {
      target: 'es2015',
    },
  },
  build: {
    target: 'es2015',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // React core & DOM
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react-router-dom') ||
            id.includes('node_modules/@remix-run')
          ) {
            return 'vendor-react';
          }

          // Audio processing & players
          if (
            id.includes('node_modules/wavesurfer.js') ||
            id.includes('node_modules/@wavesurfer') ||
            id.includes('node_modules/howler') ||
            id.includes('node_modules/use-sound') ||
            id.includes('node_modules/lamejs')
          ) {
            return 'vendor-audio';
          }

          // Security, Crypto & Backend APIs
          if (
            id.includes('node_modules/@supabase') ||
            id.includes('node_modules/@marsidev/react-turnstile') ||
            id.includes('node_modules/nanoid')
          ) {
            return 'vendor-crypto';
          }

          // UI libraries, icons, toast, motions
          if (
            id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/framer-motion') ||
            id.includes('node_modules/sonner') ||
            id.includes('node_modules/react-hot-toast') ||
            id.includes('node_modules/react-tooltip') ||
            id.includes('node_modules/driver.js') ||
            id.includes('node_modules/react-virtuoso')
          ) {
            return 'vendor-ui';
          }
        },
      },
    },
  },
  server: {
    host: true,
  },
  ssr: {
    noExternal: ['@excalidraw/excalidraw']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.IS_PREACT': JSON.stringify('false'),
  },
});
