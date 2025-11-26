import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/auth': {
        target: process.env.API_URL || 'http://localhost:5000',
        changeOrigin: true
      },
      '/events': {
        target: process.env.API_URL || 'http://localhost:5000',
        changeOrigin: true
      },
      '/clubs': {
        target: process.env.API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
