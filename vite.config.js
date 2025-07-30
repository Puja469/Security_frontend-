import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

// Full HTTPS + Proxy Setup for Local Development
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5177,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'cert/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert/cert.pem')),
    },
    proxy: {
      // API proxy to backend
      '/api': {
        target: 'https://localhost:3000', // Backend with HTTPS
        changeOrigin: true,
        secure: false, // Allow self-signed SSL
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('API Proxy Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('➡️ API Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('⬅️ API Response:', proxyRes.statusCode, req.url);
          });
        },
      },

      // Images proxy (for /item_images)
      '/item_images': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('Image Proxy Error:', err);
          });
        },
      },

      // Socket.IO over HTTPS
      '/socket.io': {
        target: 'https://localhost:3000',
        ws: true, // WebSocket
        secure: false,
      },
    },
  },
});
