import { useState } from 'react';
import { Marquee } from './Marquee';

interface Props {
  initialCode: string;
  error: string | null;
  onCreate: () => void;
  onJoin: (code: string) => void;
}

export function Lobby({ initialCode, error, onCreate, onJoin }: Props) {
  const [code, setCode] = useState(initialCode);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center px-5 py-8">
      <div className="w-full overflow-hidden rounded-2xl border-2 border-cream/80 bg-film shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
        <Marquee />

        <div className="flex flex-col items-center px-6 pb-8 pt-9 text-center">
          <div className="mb-1 font-mono text-xs uppercase tracking-[0.4em] text-mustard">est. today</div>
          <h1 className="font-display text-6xl font-bold leading-none tracking-tight text-cream">
            4CUT
          </h1>
          <p className="mt-3 max-w-xs font-body text-sm leading-relaxed text-cream/70">
            A real-time photobooth for two. One shared countdown, both of you in every frame —
            wherever you are.
          </p>

          <div className="mt-8 w-full space-y-3">
            <button
              onClick={onCreate}
              className="group w-full rounded-xl bg-retro px-6 py-4 font-display text-lg font-bold uppercase tracking-wide text-ink transition-transform active:scale-[0.98] hover:brightness-110"
            >
              Start a strip →
            </button>

            <div className="flex items-center gap-3 py-1 text-cream/40">
              <span className="h-px flex-1 bg-cream/20" />
              <span className="font-mono text-xs uppercase tracking-widest">or join</span>
              <span className="h-px flex-1 bg-cream/20" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onJoin(code);
              }}
              className="space-y-3"
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))}
                placeholder="CODE"
                autoCapitalize="characters"
                autoComplete="off"
                inputMode="text"
                className="w-full rounded-xl border-2 border-cream/25 bg-ink px-4 py-4 text-center font-mono text-2xl font-bold uppercase tracking-[0.5em] text-cream placeholder:tracking-[0.5em] placeholder:text-cream/25 focus:border-mustard focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-xl border-2 border-cream/80 px-6 py-3.5 font-display text-base font-bold uppercase tracking-wide text-cream transition-colors hover:bg-cream hover:text-ink"
              >
                Join your partner
              </button>
            </form>

            {error && (
              <p className="pt-1 font-mono text-sm text-retro" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-cream/30">
        no app · no sign-up · just a code
      </p>
    </main>
  );
}
