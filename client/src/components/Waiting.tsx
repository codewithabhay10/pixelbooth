import { useState } from 'react';
import { Marquee } from './Marquee';

interface Props {
  code: string;
  onCancel: () => void;
}

export function Waiting({ code, onCancel }: Props) {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const shareUrl = `${window.location.origin}/?code=${code}`;

  const copy = async (kind: 'link' | 'code') => {
    const text = kind === 'link' ? shareUrl : code;
    try {
      if (navigator.share && kind === 'link') {
        await navigator.share({ title: '4CUT', text: `Join me on 4CUT — our room code is ${code}`, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard blocked — user can read the code on screen */
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center px-5 py-8">
      <div className="w-full overflow-hidden rounded-2xl border-2 border-cream/80 bg-film shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
        <Marquee text="YOUR ROOM" />

        <div className="flex flex-col items-center px-6 pb-8 pt-9 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-mustard">share this code</p>

          <button
            onClick={() => copy('code')}
            className="mt-4 rounded-xl border-2 border-dashed border-cream/40 bg-ink px-6 py-5 font-mono text-5xl font-bold tracking-[0.35em] text-cream transition-colors hover:border-mustard"
            title="Tap to copy"
          >
            {code}
          </button>

          <button
            onClick={() => copy('link')}
            className="mt-5 w-full rounded-xl bg-retro px-6 py-3.5 font-display text-base font-bold uppercase tracking-wide text-ink transition-transform active:scale-[0.98] hover:brightness-110"
          >
            {copied === 'link' ? 'Copied!' : 'Copy invite link'}
          </button>
          {copied === 'code' && (
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-mustard">code copied ✓</p>
          )}

          <div className="mt-8 flex items-center gap-2 font-body text-sm text-cream/70">
            <span className="inline-flex gap-1">
              <Dot delay={0} />
              <Dot delay={0.2} />
              <Dot delay={0.4} />
            </span>
            waiting for your other half…
          </div>

          <button
            onClick={onCancel}
            className="mt-6 font-mono text-xs uppercase tracking-widest text-cream/40 underline underline-offset-4 hover:text-cream/80"
          >
            cancel
          </button>
        </div>
      </div>
    </main>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="dot-pulse inline-block h-1.5 w-1.5 rounded-full bg-mustard"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}
