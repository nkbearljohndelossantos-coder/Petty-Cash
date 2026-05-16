import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        'recharts',
        'lucide-react',
        'jspdf',
        'html2canvas',
        'd3',
        'framer-motion'
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
          'recharts': 'Recharts',
          'lucide-react': 'lucide',
          'jspdf': 'jspdf',
          'html2canvas': 'html2canvas',
          'd3': 'd3',
          'framer-motion': 'Motion'
        },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor-bundle';
          }
        },
      },
    },
  },
})
