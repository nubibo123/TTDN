import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/ocr-proxy': {
        target: 'https://3055-34-57-130-62.ngrok-free.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ocr-proxy/, ''),
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 180000,
        proxyTimeout: 180000,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            const response = res as any
            if (response && !response.headersSent && typeof response.writeHead === 'function') {
              response.writeHead(502, { 'Content-Type': 'application/json' })
              response.end(JSON.stringify({ error: 'OCR proxy offline' }))
            }
          })
        },
      },
    },
  },
})
