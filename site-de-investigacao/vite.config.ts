import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    define: {
      // Define variáveis globais para enganar bibliotecas antigas/Node
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
        IS_PREACT: JSON.stringify('false'),
      },
    },
  optimizeDeps: {
    include: ['@excalidraw/excalidraw'],
  },
})
