import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the Vite server proxies API + websocket traffic to the Node server on
// :3001 so the whole app runs from one origin (matches the production setup).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: 'http://localhost:3001', ws: true },
      '/ice': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
});
