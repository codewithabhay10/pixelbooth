// Canvas compositing: one "cut" = you | partner side-by-side. Four cuts stack
// into a classic film strip that downloads as a crisp PNG.

export type FrameColor = 'black' | 'cream' | 'retro';

interface FrameTheme {
  bg: string;
  fg: string;
  accent: string;
  line: string;
  sprocket: string;
}

export const FRAMES: Record<FrameColor, FrameTheme> = {
  black: {
    bg: '#0B0B0B',
    fg: '#F3E9D8',
    accent: '#E4572E',
    line: 'rgba(243,233,216,0.18)',
    sprocket: 'rgba(243,233,216,0.85)',
  },
  cream: {
    bg: '#F3E9D8',
    fg: '#141414',
    accent: '#E4572E',
    line: 'rgba(20,20,20,0.16)',
    sprocket: 'rgba(20,20,20,0.78)',
  },
  retro: {
    bg: '#E4572E',
    fg: '#FFF6EE',
    accent: '#141414',
    line: 'rgba(255,246,238,0.28)',
    sprocket: 'rgba(255,246,238,0.92)',
  },
};

const CUT_W = 900;
const CUT_H = 560;

/** Draw a video frame to fill a rect (object-fit: cover), optionally mirrored. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  mirror: boolean,
) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(dx, dy, dw, dh);
    return;
  }
  const scale = Math.max(dw / vw, dh / vh);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;
  ctx.save();
  if (mirror) {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh);
  } else {
    ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  ctx.restore();
}

/** Capture a single cut (you | partner) as an offscreen canvas. */
export function captureCut(
  local: HTMLVideoElement,
  remote: HTMLVideoElement | null,
  mirrorLocal: boolean,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CUT_W;
  canvas.height = CUT_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, CUT_W, CUT_H);

  const half = CUT_W / 2;
  drawCover(ctx, local, 0, 0, half, CUT_H, mirrorLocal);
  if (remote && remote.videoWidth) {
    drawCover(ctx, remote, half, 0, half, CUT_H, false);
  } else {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(half, 0, half, CUT_H);
  }

  // subtle seam between the two halves
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(half - 1, 0, 2, CUT_H);
  return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSprockets(
  ctx: CanvasRenderingContext2D,
  border: number,
  top: number,
  height: number,
  width: number,
  theme: FrameTheme,
) {
  const holeW = 26;
  const holeH = 18;
  const gap = 26;
  const count = Math.max(1, Math.floor(height / (holeH + gap)));
  const totalH = count * (holeH + gap) - gap;
  let y = top + (height - totalH) / 2;
  const leftX = (border - holeW) / 2;
  const rightX = width - border + (border - holeW) / 2;
  ctx.fillStyle = theme.sprocket;
  for (let i = 0; i < count; i++) {
    roundRect(ctx, leftX, y, holeW, holeH, 5);
    ctx.fill();
    roundRect(ctx, rightX, y, holeW, holeH, 5);
    ctx.fill();
    y += holeH + gap;
  }
}

function formatDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

/** Compose the finished cuts into a film strip and return a PNG data URL. */
export async function assembleStrip(
  cuts: HTMLCanvasElement[],
  opts: { frame: FrameColor; caption?: string },
): Promise<string> {
  // Make sure the web fonts are loaded so the stamp text renders correctly.
  try {
    await document.fonts.load('700 58px "Space Grotesk"');
    await document.fonts.load('700 34px "Space Mono"');
    await document.fonts.ready;
  } catch {
    /* fall back to system fonts */
  }

  const BORDER = 70;
  const GAP = 26;
  const HEADER = 132;
  const FOOTER = 164;
  const width = CUT_W + BORDER * 2;
  const cutsBlock = cuts.length * CUT_H + (cuts.length - 1) * GAP;
  const height = HEADER + cutsBlock + FOOTER;

  const dpr = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const theme = FRAMES[opts.frame];
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // header
  ctx.fillStyle = theme.fg;
  ctx.font = '700 58px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText('4CUT', width / 2, HEADER / 2 - 8);
  ctx.font = '400 19px "Space Mono", monospace';
  ctx.fillStyle = theme.accent;
  ctx.fillText('· A PHOTOBOOTH FOR TWO ·', width / 2, HEADER / 2 + 30);

  // cuts
  cuts.forEach((cut, i) => {
    const y = HEADER + i * (CUT_H + GAP);
    ctx.drawImage(cut, BORDER, y, CUT_W, CUT_H);
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 2;
    ctx.strokeRect(BORDER, y, CUT_W, CUT_H);
  });

  drawSprockets(ctx, BORDER, HEADER, cutsBlock, width, theme);

  // footer
  const footCenter = height - FOOTER / 2;
  ctx.fillStyle = theme.fg;
  ctx.font = '700 34px "Space Mono", monospace';
  ctx.fillText((opts.caption || 'us, together').toUpperCase(), width / 2, footCenter - 20);
  ctx.font = '400 24px "Space Mono", monospace';
  ctx.fillStyle = theme.accent;
  ctx.fillText(`♥  ${formatDate(new Date())}`, width / 2, footCenter + 26);

  return canvas.toDataURL('image/png');
}
