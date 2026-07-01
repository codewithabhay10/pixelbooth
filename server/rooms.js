// In-memory room registry. No database — this app only ever has two people per
// room, and losing rooms on restart is fine (just create a new one).

// Ambiguous letters (I, O) are omitted so codes are easy to read aloud / text.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 5;

/** @type {Map<string, { members: Set<string>, createdAt: number }>} */
const rooms = new Map();

function generateCode() {
  let code;
  do {
    code = Array.from(
      { length: CODE_LENGTH },
      () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

export function createRoom(socketId) {
  const code = generateCode();
  rooms.set(code, { members: new Set([socketId]), createdAt: Date.now() });
  return code;
}

export function joinRoom(code, socketId) {
  const room = rooms.get(code);
  if (!room) return { ok: false, error: 'That room code doesn’t exist.' };
  if (room.members.size >= 2 && !room.members.has(socketId)) {
    return { ok: false, error: 'That room is already full.' };
  }
  room.members.add(socketId);
  return { ok: true };
}

export function leaveRoom(code, socketId) {
  const room = rooms.get(code);
  if (!room) return;
  room.members.delete(socketId);
  if (room.members.size === 0) rooms.delete(code);
}

// Occasional cleanup of stale empty/abandoned rooms (older than 6 hours).
setInterval(() => {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [code, room] of rooms) {
    if (room.members.size === 0 || room.createdAt < cutoff) rooms.delete(code);
  }
}, 60 * 60 * 1000).unref?.();
