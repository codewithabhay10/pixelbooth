// Subtle animated film-grain + vignette overlay to make the whole app read
// analog rather than flat digital. Purely decorative.
const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export function FilmGrain() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: `url("${NOISE}")`, backgroundSize: '180px 180px' }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 30%, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </>
  );
}
