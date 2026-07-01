// Tiny WebAudio sound effects — no audio files needed. Everything is guarded so
// it silently no-ops if the browser blocks audio.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Soft blip used for each countdown number. */
export function playTick() {
  const a = audio();
  if (!a) return;
  try {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    o.connect(g);
    g.connect(a.destination);
    const t = a.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    o.start(t);
    o.stop(t + 0.14);
  } catch {
    /* ignore */
  }
}

/** Camera-shutter "cha-chk": a bright noise burst plus a low click. */
export function playShutter() {
  const a = audio();
  if (!a) return;
  try {
    const t = a.currentTime;

    const dur = 0.09;
    const buffer = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    const noise = a.createBufferSource();
    noise.buffer = buffer;
    const hp = a.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1100;
    const ng = a.createGain();
    ng.gain.value = 0.5;
    noise.connect(hp);
    hp.connect(ng);
    ng.connect(a.destination);
    noise.start(t);

    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'square';
    o.frequency.value = 150;
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + 0.1);
  } catch {
    /* ignore */
  }
}
