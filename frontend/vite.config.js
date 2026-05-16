import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('recharts')) return 'charts-re';
            if (id.includes('d3')) return 'charts-d3';
            if (id.includes('framer-motion')) return 'animations';
            if (id.includes('axios')) return 'axios';
            if (id.includes('date-fns')) return 'date-utils';
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react')) return 'react-core';
            return 'vendor-bundle';
          }
        },
      },
    },
  },
})
