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
        target: 'https://a325-34-148-105-29.ngrok-free.app/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ocr-proxy/, ''),
        headers: { 'ngrok-skip-browser-warning': 'true' },
      },
    },
  },
})
