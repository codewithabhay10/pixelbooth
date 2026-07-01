// Scrolling "PHOTO BOOTH ● ..." marquee used as a header band.
export function Marquee({ text = 'PHOTO BOOTH' }: { text?: string }) {
  const unit = ` ${text} ● `;
  const run = unit.repeat(8);
  return (
    <div className="w-full overflow-hidden border-y-2 border-cream/80 bg-retro py-1.5 text-ink">
      <div className="flex w-max animate-marquee whitespace-nowrap font-mono text-sm font-bold tracking-[0.3em]">
        <span>{run}</span>
        <span>{run}</span>
      </div>
    </div>
  );
}
