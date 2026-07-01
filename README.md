# 4CUT — a real-time photobooth for two 📸

A browser-based photobooth for (long-distance) couples, inspired by
[getangie.com](https://getangie.com). One partner creates a room and shares a
5-letter code; the other joins. You see each other live, hit start, and a
**synced countdown fires four shots on both screens at once** — so every frame
of the strip holds both of you. Then download the strip as a PNG.

No app, no sign-up, just a code. Styled as an authentic Korean 인생네컷
("life 4-cut") film strip.

## How it works

- **Live video** is peer-to-peer over **WebRTC** (`getUserMedia` +
  `RTCPeerConnection`, perfect-negotiation). Each browser holds both camera
  streams locally, so each side composites "you | partner" itself — no
  server-side video.
- A small **Socket.IO** server handles rooms (5-letter codes, max 2 people,
  in-memory), relays WebRTC signaling, and broadcasts the synced countdown.
- The same Node server serves the built client, so it's **one deploy**.

```
client/   Vite + React + TypeScript + Tailwind (the UI + capture/compositing)
server/   Express + Socket.IO (static hosting, rooms, signaling relay)
```

## Run locally

```bash
npm install
npm run dev
```

- Client (with hot reload): http://localhost:5173
- Server / Socket.IO: http://localhost:3001 (the client proxies to it)

Open **two** browser windows on `localhost` (localhost is a secure context, so
the camera works). Create in one, join with the code in the other.

Production preview (single server, exactly like deploy):

```bash
npm run build && npm start   # http://localhost:3001
```

## Deploy (free) — Render

The camera requires HTTPS, which Render provides automatically.

1. Push this repo to GitHub.
2. On [render.com](https://render.com): **New → Blueprint**, pick the repo
   (a `render.yaml` is included), and deploy. Or create a **Web Service** with
   Build `npm install && npm run build` and Start `npm start`.
3. Open the Render URL, create a room, and text the link to your partner.

Render's free tier sleeps after inactivity, so open the link a minute before
your date to wake it.

### TURN (only if video won't connect)

STUN alone works on most home networks. On restrictive networks, add a free
TURN relay (e.g. [Cloudflare Realtime](https://developers.cloudflare.com/realtime/)
or Metered Open Relay) via env vars on the server:

```
TURN_URL=turn:your-turn-host:3478
TURN_USERNAME=...
TURN_CREDENTIAL=...
```

The server exposes these at `/ice`; the client falls back to STUN-only when
they're unset.

## Notes

- Video only (no mic) to avoid echo — talk on a separate call while you shoot.
- In-memory rooms reset if the server restarts; just create a new room.
- Made for two. 💛
