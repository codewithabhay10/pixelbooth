import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { assembleStrip, FRAMES, type FrameColor } from '../lib/photobooth';

interface Props {
  cuts: HTMLCanvasElement[];
  onRetake: () => void;
  onExit: () => void;
}

const FRAME_OPTIONS: { id: FrameColor; label: string }[] = [
  { id: 'black', label: 'Noir' },
  { id: 'cream', label: 'Cream' },
  { id: 'retro', label: 'Retro' },
];

export function StripReview({ cuts, onRetake, onExit }: Props) {
  const [frame, setFrame] = useState<FrameColor>('black');
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let live = true;
    assembleStrip(cuts, { frame }).then((url) => {
      if (live) setDataUrl(url);
    });
    return () => {
      live = false;
    };
  }, [cuts, frame]);

  const download = () => {
    if (!dataUrl) return;
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    const name = `4cut-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.png`;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-ink/95 px-4 py-8 backdrop-blur-sm"
    >
      <p className="mb-1 font-mono text-xs uppercase tracking-[0.35em] text-mustard">your strip is ready</p>
      <h2 className="mb-5 font-display text-3xl font-bold tracking-tight">Fresh out the booth ♥</h2>

      {/* the developed strip */}
      <div className="w-full max-w-[280px]">
        {dataUrl ? (
          <motion.img
            key={frame}
            src={dataUrl}
            alt="Your 4-cut photo strip"
            initial={{ opacity: 0, filter: 'brightness(2.2) contrast(0.4) saturate(0.3)' }}
            animate={{ opacity: 1, filter: 'brightness(1) contrast(1) saturate(1)' }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="w-full rounded-md shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
          />
        ) : (
          <div className="flex aspect-[1040/2588] w-full items-center justify-center rounded-md bg-film font-mono text-xs uppercase tracking-widest text-cream/40">
            developing…
          </div>
        )}
      </div>

      {/* frame color picker */}
      <div className="mt-6 flex items-center gap-3">
        {FRAME_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFrame(opt.id)}
            className={`flex flex-col items-center gap-1.5 ${frame === opt.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
          >
            <span
              className={`h-9 w-9 rounded-full border-2 ${frame === opt.id ? 'border-mustard' : 'border-cream/30'}`}
              style={{ backgroundColor: FRAMES[opt.id].bg }}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* actions */}
      <div className="mt-7 w-full max-w-[280px] space-y-3">
        <button
          onClick={download}
          disabled={!dataUrl}
          className="w-full rounded-xl bg-retro px-6 py-4 font-display text-lg font-bold uppercase tracking-wide text-ink transition-transform enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:opacity-40"
        >
          ↓ Download strip
        </button>
        <div className="flex gap-3">
          <button
            onClick={onRetake}
            className="flex-1 rounded-xl border-2 border-cream/80 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide transition-colors hover:bg-cream hover:text-ink"
          >
            Retake
          </button>
          <button
            onClick={onExit}
            className="flex-1 rounded-xl border-2 border-cream/25 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream/70 transition-colors hover:border-cream/70 hover:text-cream"
          >
            New room
          </button>
        </div>
      </div>

      <p className="mt-5 max-w-[280px] text-center font-mono text-[10px] uppercase tracking-widest text-cream/30">
        you each get your own copy — download on both phones
      </p>
    </motion.div>
  );
}
