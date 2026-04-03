import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_IP = 'http://167.86.118.96';

export default defineConfig({
  plugins: [react()],
  root: '.',
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: './index.html'
    }
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND_IP + ':3001',
        changeOrigin: true,
        secure: false
      },
      '/photos': {
        target: BACKEND_IP + ':3001',
        changeOrigin: true,
        secure: false
      },
      '/badge': {
        target: BACKEND_IP + ':3001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: BACKEND_IP + ':3001',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/chat-files': {
        target: BACKEND_IP + ':3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
