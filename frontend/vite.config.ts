import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'http://localhost:8000'

const proxyConfig = {
  target: BACKEND,
  changeOrigin: true,
  secure: false,
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/auth':                   proxyConfig,
      '/recipients':             proxyConfig,
      '/audiences':              proxyConfig,
      '/segments':               proxyConfig,
      '/imports':                proxyConfig,
      '/master':                 proxyConfig,
      '/campaigns':              proxyConfig,
      '/ai':                     proxyConfig,
      '/analytics':              proxyConfig,
      '/broadcasts':             proxyConfig,
      '/emergency':              proxyConfig,
      '/fact-verification':      proxyConfig,
      '/translation-evaluation': proxyConfig,
      '/quizzes':                proxyConfig,
      '/health':                 proxyConfig,
      '/api':                    proxyConfig,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          axios: ['axios'],
        },
      },
    },
  },
})
