// Lightweight WebAudio-based lock-in sound. Falls back to noop if WebAudio unavailable.
let sharedCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (sharedCtx) return sharedCtx;
    const C = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    sharedCtx = new C();
    return sharedCtx;
  } catch (e) {
    return null;
  }
}

export function playLockIn() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    o.start(now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    // stop oscillator after short time
    setTimeout(() => {
      try { o.stop(); o.disconnect(); g.disconnect(); } catch (e) {}
      // keep sharedCtx open for reuse
    }, 220);
  } catch (e) {
    // ignore
  }
}

export default { playLockIn };
