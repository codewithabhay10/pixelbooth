import { useCallback, useEffect, useRef, useState } from 'react';

export type CamError = 'denied' | 'notfound' | 'error' | null;

/**
 * Acquires the local camera (video only — no mic, to avoid echo). Exposes a
 * `flip()` that swaps front/back on phones by replacing the video track in place
 * (via the provided callback) so the peer connection isn't torn down.
 */
export function useLocalMedia(onTrackReplaced?: (track: MediaStreamTrack) => void) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<CamError>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const replacedRef = useRef(onTrackReplaced);
  replacedRef.current = onTrackReplaced;

  useEffect(() => {
    let cancelled = false;
    let acquired: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        acquired = s;
        setStream(s);
        setError(null);
      })
      .catch((err: DOMException) => {
        if (cancelled) return;
        if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') setError('denied');
        else if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') setError('notfound');
        else setError('error');
      });

    return () => {
      cancelled = true;
      if (acquired) acquired.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const flip = useCallback(async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next },
        audio: false,
      });
      const newTrack = fresh.getVideoTracks()[0];
      setStream((prev) => {
        if (!prev) return fresh;
        prev.getVideoTracks().forEach((t) => {
          prev.removeTrack(t);
          t.stop();
        });
        prev.addTrack(newTrack);
        return prev; // same stream object — <video> keeps playing with the new track
      });
      replacedRef.current?.(newTrack);
      setFacingMode(next);
    } catch {
      /* keep current camera on failure */
    }
  }, [facingMode]);

  return { stream, error, facingMode, flip };
}
