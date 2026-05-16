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
            const parts = id.toString().split('node_modules/');
            if (parts.length > 1) {
              const pkgName = parts[1].split('/')[0].toString().replace('@', '');
              // If it's a very large library, split it even more if possible (though usually they are just one file)
              if (pkgName === 'jspdf' || pkgName === 'recharts' || pkgName === 'html2canvas') {
                // Try to create more unique chunks for these specific large libs
                return `lib-${pkgName}`;
              }
              return `pkg-${pkgName}`;
            }
            return 'vendor-others';
          }
        },
      },
    },
  },
})
