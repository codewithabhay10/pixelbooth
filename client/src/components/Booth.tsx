import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { socket } from '../lib/socket';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { usePeer } from '../hooks/usePeer';
import { captureCut } from '../lib/photobooth';
import { playShutter, playTick } from '../lib/sound';
import { StripReview } from './StripReview';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface Props {
  polite: boolean;
  partnerLeft: boolean;
  onExit: () => void;
}

export function Booth({ polite, partnerLeft, onExit }: Props) {
  const replaceRef = useRef<((t: MediaStreamTrack) => void) | undefined>(undefined);
  const { stream, error: camError, facingMode, flip } = useLocalMedia((t) => replaceRef.current?.(t));
  const { remoteStream, connected, replaceVideoTrack } = usePeer(stream, true, polite);
  replaceRef.current = replaceVideoTrack;

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  const [count, setCount] = useState<number | null>(null);
  const [shotIdx, setShotIdx] = useState(0);
  const [counting, setCounting] = useState(false);
  const [flash, setFlash] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [reviewCuts, setReviewCuts] = useState<HTMLCanvasElement[] | null>(null);

  const countingRef = useRef(false);
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  const mirrorRef = useRef(facingMode === 'user');
  mirrorRef.current = facingMode === 'user';

  // Attach streams to their <video> elements.
  useEffect(() => {
    const v = localRef.current;
    if (v && stream) {
      v.srcObject = stream;
      v.play?.().catch(() => {});
    }
  }, [stream]);
  useEffect(() => {
    const v = remoteRef.current;
    if (v) {
      v.srcObject = remoteStream;
      if (remoteStream) v.play?.().catch(() => {});
    }
  }, [remoteStream]);

  const runSequence = useCallback(async (shots: number) => {
    if (countingRef.current) return;
    countingRef.current = true;
    setCounting(true);
    setReviewCuts(null);

    const cuts: HTMLCanvasElement[] = [];
    for (let s = 0; s < shots; s++) {
      setShotIdx(s + 1);
      for (let n = 3; n >= 1; n--) {
        setCount(n);
        if (soundRef.current) playTick();
        await delay(1000);
      }
      setCount(0);
      if (soundRef.current) playShutter();
      setFlash(true);
      const local = localRef.current;
      if (local) cuts.push(captureCut(local, remoteRef.current, mirrorRef.current));
      await delay(70);
      setFlash(false);
      await delay(820);
    }

    setCount(null);
    setShotIdx(0);
    setCounting(false);
    countingRef.current = false;
    confetti({ particleCount: 90, spread: 72, origin: { y: 0.65 }, colors: ['#E4572E', '#E6B23A', '#F3E9D8'] });
    setReviewCuts(cuts);
  }, []);

  // Both partners receive the broadcast and run the exact same sequence.
  useEffect(() => {
    const onCountdown = ({ shots }: { shots?: number }) => void runSequence(shots || 4);
    socket.on('countdown', onCountdown);
    return () => {
      socket.off('countdown', onCountdown);
    };
  }, [runSequence]);

  const start = () => {
    if (connected && !countingRef.current) socket.emit('start-countdown');
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-4">
      {/* top bar */}
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          4CUT
          <span
            className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
              connected ? 'bg-retro/20 text-retro' : 'bg-cream/10 text-cream/50'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'animate-blink bg-retro' : 'bg-cream/40'}`} />
            {connected ? 'live' : 'connecting'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <IconButton label={soundOn ? 'Mute' : 'Unmute'} onClick={() => setSoundOn((s) => !s)}>
            {soundOn ? '🔊' : '🔈'}
          </IconButton>
          <IconButton label="Flip camera" onClick={flip}>
            🔄
          </IconButton>
          <IconButton label="Leave" onClick={onExit}>
            ✕
          </IconButton>
        </div>
      </header>

      {partnerLeft && (
        <div className="mb-3 rounded-lg border border-retro/40 bg-retro/10 px-4 py-2.5 text-center font-mono text-xs uppercase tracking-widest text-retro">
          your partner disconnected — start a new room
        </div>
      )}

      {/* film frame */}
      <div className="relative rounded-2xl border-2 border-cream/80 bg-film p-3">
        <SprocketStrip side="left" />
        <SprocketStrip side="right" />

        <div className="grid grid-cols-2 gap-2">
          <Tile label="you">
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${facingMode === 'user' ? 'mirror' : ''}`}
            />
          </Tile>
          <Tile label="your partner">
            <video ref={remoteRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/80 text-center font-mono text-xs uppercase tracking-widest text-cream/50">
                waiting for
                <br />
                their camera…
              </div>
            )}
          </Tile>
        </div>

        {/* shot counter */}
        {counting && (
          <div className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-mustard">
            shot {shotIdx} / 4
          </div>
        )}

        {/* countdown overlay */}
        {count !== null && (
          <div
            key={`${shotIdx}-${count}`}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          >
            <span className="count-pop font-display text-[9rem] font-bold leading-none text-cream drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              {count === 0 ? '♥' : count}
            </span>
          </div>
        )}

        {/* shutter flash */}
        {flash && (
          <div className="shutter-flash pointer-events-none absolute inset-0 z-30 rounded-2xl bg-white" />
        )}
      </div>

      {/* controls */}
      {camError ? (
        <CamErrorPanel error={camError} />
      ) : (
        <div className="mt-5 flex flex-col items-center">
          <button
            onClick={start}
            disabled={!connected || counting}
            className="w-full rounded-xl bg-retro px-6 py-4 font-display text-lg font-bold uppercase tracking-wide text-ink transition-transform enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {counting ? 'say cheese…' : connected ? 'start the countdown →' : 'connecting…'}
          </button>
          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-widest text-cream/40">
            one countdown · four shots · both of you in every frame
          </p>
        </div>
      )}

      {reviewCuts && (
        <StripReview cuts={reviewCuts} onRetake={() => setReviewCuts(null)} onExit={onExit} />
      )}
    </main>
  );
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-ink">
      {children}
      <span className="absolute left-2 top-2 z-10 rounded bg-ink/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cream/90">
        {label}
      </span>
    </div>
  );
}

function SprocketStrip({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-y-3 ${side === 'left' ? 'left-1' : 'right-1'} w-1.5`}
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(243,233,216,0.75) 0 2.5px, transparent 3.5px)',
        backgroundSize: '100% 22px',
      }}
    />
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/25 text-sm transition-colors hover:border-cream/70 hover:bg-cream/10"
    >
      {children}
    </button>
  );
}

function CamErrorPanel({ error }: { error: 'denied' | 'notfound' | 'error' }) {
  const message =
    error === 'denied'
      ? 'Camera access was blocked. Allow the camera in your browser’s address bar, then reload.'
      : error === 'notfound'
        ? 'No camera was found on this device.'
        : 'Couldn’t start your camera. Check that no other app is using it, then reload.';
  return (
    <div className="mt-5 rounded-xl border border-retro/40 bg-retro/10 px-5 py-4 text-center">
      <p className="font-body text-sm text-cream/80">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-3 rounded-lg border-2 border-cream/70 px-5 py-2 font-display text-sm font-bold uppercase tracking-wide hover:bg-cream hover:text-ink"
      >
        Reload
      </button>
    </div>
  );
}
