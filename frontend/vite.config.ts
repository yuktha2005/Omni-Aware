import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/recipients': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/audiences': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/segments': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/master': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/campaigns': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/analytics': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/broadcasts': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
