import { defineConfig } from 'vite';
import angular from '@vitejs/plugin-angular';

export default defineConfig({
  plugins: [angular()],
  server: {
    proxy: {
      '/uploads': {
        target: 'http://gardream-backend-1:8000',
        changeOrigin: true,
      },
    },
    // Explicitly configure HMR to prevent query params from Keycloak redirects
    // from interfering with the WebSocket connection
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 4200,
      // Don't use pathname, which would include query params
      path: '/vite-hmr',
    },
  },
});
