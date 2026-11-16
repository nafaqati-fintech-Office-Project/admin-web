import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.GATEWAY_URL || 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => proxy.on('proxyReq', (req) => req.removeHeader('origin')),
      },
    },
  },
})
