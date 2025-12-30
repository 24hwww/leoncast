import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: true,
    hmr: {
      clientPort: 3000, // Important: Tell the browser to use port 3000 for HMR WS
      host: 'localhost',
    },
    // Required for proxying and avoiding 403 Forbidden
    origin: 'http://localhost:3000',
    proxy: {
      '/auth': 'http://backend:3000',
      '/api': 'http://backend:3000',
      '/s': 'http://backend:3000',
      '/render': 'http://backend:3000',
      '/ws': {
        target: 'ws://backend:3000',
        ws: true
      }
    }
  }
})
