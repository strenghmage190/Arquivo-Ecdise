/**
 * audio.ts - Gerenciamento de Áudio com Unlock seguro para Mobile (iOS/Android)
 */
import { audioManager } from './AudioManager';

let isAudioUnlocked = false;
const unlockListeners: Array<() => void> = [];

/**
 * Registra um callback para quando o áudio for destravado
 */
export function onAudioUnlocked(cb: () => void): () => void {
  if (isAudioUnlocked) {
    try { cb(); } catch {}
    return () => {};
  }
  unlockListeners.push(cb);
  return () => {
    const idx = unlockListeners.indexOf(cb);
    if (idx !== -1) unlockListeners.splice(idx, 1);
  };
}

/**
 * Destrava o Web Audio Context com garantia em qualquer interação de toque/clique
 */
export async function unlockAudio(): Promise<boolean> {
  if (isAudioUnlocked) return true;

  try {
    // 1. Tenta AudioContext do AudioManager
    const ctx = audioManager.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }

    // 2. Toca um buffer silencioso de 1 sample para desarmar o autoplay blocker do Safari/WebKit/Chrome
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const dummyCtx = ctx || new AudioCtx();
      if (dummyCtx.state === 'suspended') {
        await dummyCtx.resume();
      }
      const buffer = dummyCtx.createBuffer(1, 1, 22050);
      const source = dummyCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(dummyCtx.destination);
      source.start(0);
    }

    isAudioUnlocked = true;
    unlockListeners.forEach((fn) => {
      try { fn(); } catch (e) { console.warn(e); }
    });
    unlockListeners.length = 0;
    return true;
  } catch (err) {
    console.warn('[Audio] Falha ao destravar AudioContext:', err);
    return false;
  }
}

// Configura ouvintes globais de primeiro toque (touchstart, pointerdown, touchend, click)
if (typeof window !== 'undefined') {
  const handleFirstInteraction = async () => {
    await unlockAudio();
    if (isAudioUnlocked) {
      window.removeEventListener('touchstart', handleFirstInteraction, true);
      window.removeEventListener('touchend', handleFirstInteraction, true);
      window.removeEventListener('pointerdown', handleFirstInteraction, true);
      window.removeEventListener('click', handleFirstInteraction, true);
      window.removeEventListener('keydown', handleFirstInteraction, true);
    }
  };

  window.addEventListener('touchstart', handleFirstInteraction, { capture: true, passive: true });
  window.addEventListener('touchend', handleFirstInteraction, { capture: true, passive: true });
  window.addEventListener('pointerdown', handleFirstInteraction, { capture: true, passive: true });
  window.addEventListener('click', handleFirstInteraction, { capture: true, passive: true });
  window.addEventListener('keydown', handleFirstInteraction, { capture: true, passive: true });
}

export async function playAudio(url: string) {
  await unlockAudio();
  const a = new Audio(url);
  await a.play();
}

export default { unlockAudio, onAudioUnlocked, playAudio };
