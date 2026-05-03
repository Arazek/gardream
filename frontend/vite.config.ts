import { defineConfig } from 'vite';
import angular from '@vitejs/plugin-angular';

export default defineConfig({
  plugins: [angular()],
  server: {
    maxHttpHeaderSize: 65536,
    proxy: {
      '/uploads': {
        target: 'http://gardream-backend-1:8000',
        changeOrigin: true,
      },
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 4200,
      path: '/vite-hmr',
    },
  },
});
