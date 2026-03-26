import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_IP = 'http://167.86.118.96';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/login': {
        target: `https://${BACKEND_IP.replace('http://', '')}:8082`,
        changeOrigin: true,
        secure: false
      },
      '/api/register': {
        target: `https://${BACKEND_IP.replace('http://', '')}:8082`,
        changeOrigin: true,
        secure: false
      },
      '/api/verify': {
        target: `https://${BACKEND_IP.replace('http://', '')}:8082`,
        changeOrigin: true,
        secure: false
      },
      '/api/postes': {
        target: `https://${BACKEND_IP.replace('http://', '')}:8082`,
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: `${BACKEND_IP}:3001`,
        changeOrigin: true,
        secure: false
      },
      '/photos': {
        target: `${BACKEND_IP}:3001`,
        changeOrigin: true,
        secure: false
      },
      '/api/photos': {
        target: `${BACKEND_IP}:3001`,
        changeOrigin: true,
        secure: false
      },
      '/badge': {
        target: `${BACKEND_IP}:3001`,
        changeOrigin: true,
        secure: false
      },
      '/badge-exemple': {
        target: `${BACKEND_IP}:3001`,
        changeOrigin: true,
        secure: false
      },
      '/login': {
        target: `${BACKEND_IP}:3001`,
        changeOrigin: true,
        secure: false
      },
      '/logout': {
        target: `${BACKEND_IP}:3001`,
        changeOrigin: true,
        secure: false
      },
      '/api/sse': {
        target: `${BACKEND_IP}:3001`,
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/socket.io': {
        target: `${BACKEND_IP}:3001`,
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/chat-files': {
        target: `${BACKEND_IP}:3001`,
        changeOrigin: true,
        secure: false
      }
    }
  }
})
