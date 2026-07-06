import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // expõe na rede local — permite jogar pelo celular (http://IP-do-PC:5173)
    port: 5173,
    // Proxy para a API em dev — o frontend chama /api/... sem se preocupar com CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
});
