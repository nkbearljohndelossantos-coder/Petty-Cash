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
            // Group 1: React Core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Group 2: UI & Charts
            if (id.includes('recharts') || id.includes('lucide-react') || id.includes('d3')) {
              return 'vendor-ui';
            }
            // Group 3: Export & PDF
            if (id.includes('jspdf')) {
              return 'vendor-jspdf';
            }
            if (id.includes('html2canvas') || id.includes('canvg') || id.includes('dompurify')) {
              return 'vendor-canvas';
            }
            // Group 4: Utils & Rest
            if (id.includes('axios') || id.includes('date-fns') || id.includes('framer-motion') || id.includes('socket.io')) {
              return 'vendor-utils';
            }
            return 'vendor-others';
          }
        },
      },
    },
  },
})
