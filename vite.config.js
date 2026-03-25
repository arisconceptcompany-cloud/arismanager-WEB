import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const certPath = '/home/tech-0002/Téléchargements/PresenceAris1/PresenceAris'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    https: {
      key: fs.readFileSync(path.join(certPath, 'key.pem')),
      cert: fs.readFileSync(path.join(certPath, 'cert.pem'))
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
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/photos': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/badge': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/badge-exemple': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/login': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/logout': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/api/sse': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})
