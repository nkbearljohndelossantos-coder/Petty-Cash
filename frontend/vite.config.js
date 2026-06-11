import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Safe chunk names for Hostinger/Apache (no @ in filenames) */
function safePackageChunkName(id) {
  const match = id.match(/node_modules\/(.+)/)
  if (!match) return undefined
  const parts = match[1].split('/')
  if (parts[0].startsWith('@')) {
    const scope = parts[0].slice(1)
    const pkg = parts[1] || 'pkg'
    return `${scope}-${pkg}`.replace(/[^a-zA-Z0-9-]/g, '-')
  }
  return parts[0].replace(/[^a-zA-Z0-9-]/g, '-')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return safePackageChunkName(id)
        }
      }
    }
  }
})
