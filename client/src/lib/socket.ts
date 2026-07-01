import { io, type Socket } from 'socket.io-client';

// Same-origin connection. In dev, Vite proxies /socket.io to the Node server;
// in production the Node server serves this app and handles /socket.io directly.
export const socket: Socket = io({
  autoConnect: true,
});

// Debug hook (harmless in prod): lets us inspect the live socket from devtools.
if (typeof window !== 'undefined') {
  (window as unknown as { __socket: Socket }).__socket = socket;
}
