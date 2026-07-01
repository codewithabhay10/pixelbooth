import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import { createRoom, joinRoom, leaveRoom } from './rooms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// --- ICE configuration (STUN always; TURN when env vars are provided) ---------
app.get('/ice', (_req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ];
  if (process.env.TURN_URL) {
    iceServers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    });
  }
  res.json({ iceServers });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// --- serve the built client (production) --------------------------------------
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

// --- realtime: room management + WebRTC signaling relay ------------------------
io.on('connection', (socket) => {
  socket.on('create', (cb) => {
    const code = createRoom(socket.id);
    socket.join(code);
    socket.data.code = code;
    // The room creator is the "polite" peer in perfect-negotiation terms.
    cb?.({ ok: true, code, polite: true });
  });

  socket.on('join', ({ code } = {}, cb) => {
    code = String(code || '').toUpperCase().trim();
    const result = joinRoom(code, socket.id);
    if (!result.ok) {
      cb?.(result);
      return;
    }
    socket.join(code);
    socket.data.code = code;
    cb?.({ ok: true, code, polite: false });
    // Both members now know the room is full and can begin negotiating.
    io.to(code).emit('partner-joined');
  });

  // Opaque WebRTC signaling payload ({ description } or { candidate }) relayed
  // to the other person in the room.
  socket.on('signal', (payload) => {
    const code = socket.data.code;
    if (code) socket.to(code).emit('signal', payload);
  });

  // Either partner can trigger the synced countdown; broadcast to BOTH so they
  // fire the shots together.
  socket.on('start-countdown', (opts = {}) => {
    const code = socket.data.code;
    if (code) io.to(code).emit('countdown', { shots: 4, ...opts });
  });

  socket.on('leave', () => cleanup(socket));
  socket.on('disconnect', () => cleanup(socket));
});

function cleanup(socket) {
  const code = socket.data.code;
  if (!code) return;
  leaveRoom(code, socket.id);
  socket.to(code).emit('partner-left');
  socket.leave(code);
  socket.data.code = null;
}

httpServer.listen(PORT, () => {
  console.log(`📸 Photobooth server listening on http://localhost:${PORT}`);
});
