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
            if (id.includes('react-dom')) return 'v-rd';
            if (id.includes('react-router')) return 'v-rr';
            if (id.includes('recharts')) return 'v-re';
            if (id.includes('jspdf')) return 'v-jp';
            if (id.includes('html2canvas')) return 'v-hc';
            if (id.includes('lucide')) return 'v-lc';
            if (id.includes('framer-motion')) return 'v-fm';
            if (id.includes('axios')) return 'v-ax';
            if (id.includes('date-fns')) return 'v-df';
            if (id.includes('socket.io')) return 'v-si';
            if (id.includes('d3')) return 'v-d3';
            if (id.includes('react')) return 'v-rc';
            return 'v-others';
          }
        },
      },
    },
  },
})
