import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const certPath = '/home/tech-0002/Téléchargements/PresenceAris1/PresenceAris'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    https: {
      key: fs.readFileSync(path.join(certPath, 'key.pem')),
      cert: fs.readFileSync(path.join(certPath, 'cert.pem'))
    },
    hmr: {
      protocol: 'wss',
      port: 5173
    },
    proxy: {
      '/api/login': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false
      },
      '/api/register': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false
      },
      '/api/verify': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false
      },
      '/api/postes': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/photos': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/api/photos': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/badge': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/badge-exemple': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/login': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/logout': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/api/sse': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/chat-files': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
