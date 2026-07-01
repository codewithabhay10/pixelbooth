import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../lib/socket';

type SignalMessage = {
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

async function fetchIceConfig(): Promise<RTCConfiguration> {
  try {
    const res = await fetch('/ice');
    if (res.ok) return (await res.json()) as RTCConfiguration;
  } catch {
    /* fall through */
  }
  return { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
}

/**
 * Establishes a peer-to-peer video connection with the other person in the room
 * using the WebRTC "perfect negotiation" pattern, with signaling relayed over
 * Socket.IO. `polite` (assigned by the server) resolves offer glare.
 */
export function usePeer(localStream: MediaStream | null, active: boolean, polite: boolean) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!localStream || !active) return;

    let pc: RTCPeerConnection | null = null;
    let makingOffer = false;
    let ignoreOffer = false;
    let cancelled = false;
    const early: SignalMessage[] = [];

    async function handle(msg: SignalMessage) {
      if (!pc) {
        early.push(msg); // buffer signals that arrive before the connection is ready
        return;
      }
      try {
        if (msg.description) {
          const collision =
            msg.description.type === 'offer' && (makingOffer || pc.signalingState !== 'stable');
          ignoreOffer = !polite && collision;
          if (ignoreOffer) return;
          await pc.setRemoteDescription(msg.description);
          if (msg.description.type === 'offer') {
            await pc.setLocalDescription();
            socket.emit('signal', { description: pc.localDescription });
          }
        } else if (msg.candidate) {
          try {
            await pc.addIceCandidate(msg.candidate);
          } catch (err) {
            if (!ignoreOffer) console.error('addIceCandidate failed', err);
          }
        }
      } catch (err) {
        console.error('signaling error', err);
      }
    }

    const onSignal = (msg: SignalMessage) => void handle(msg);
    socket.on('signal', onSignal);

    (async () => {
      const config = await fetchIceConfig();
      if (cancelled) return;

      pc = new RTCPeerConnection(config);
      pcRef.current = pc;

      pc.onnegotiationneeded = async () => {
        try {
          makingOffer = true;
          await pc!.setLocalDescription();
          socket.emit('signal', { description: pc!.localDescription });
        } catch (err) {
          console.error('negotiation error', err);
        } finally {
          makingOffer = false;
        }
      };
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) socket.emit('signal', { candidate });
      };
      pc.ontrack = ({ streams }) => {
        if (streams && streams[0]) setRemoteStream(streams[0]);
      };
      pc.onconnectionstatechange = () => {
        if (!pc) return;
        setConnected(pc.connectionState === 'connected');
      };

      localStream!.getTracks().forEach((t) => pc!.addTrack(t, localStream!));

      // Flush any signals that arrived before the connection existed.
      const buffered = early.splice(0);
      for (const m of buffered) await handle(m);
    })();

    return () => {
      cancelled = true;
      socket.off('signal', onSignal);
      if (pc) {
        pc.onnegotiationneeded = null;
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.close();
      }
      pcRef.current = null;
      setRemoteStream(null);
      setConnected(false);
    };
  }, [localStream, active, polite]);

  // Swap the outgoing video track (used by the front/back camera flip) without
  // rebuilding the connection.
  const replaceVideoTrack = useCallback(async (track: MediaStreamTrack) => {
    const pc = pcRef.current;
    if (!pc) return;
    const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
    if (sender) await sender.replaceTrack(track);
  }, []);

  return { remoteStream, connected, replaceVideoTrack };
}
