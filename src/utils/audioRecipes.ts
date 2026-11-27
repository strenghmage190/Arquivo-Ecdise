import {
  encodeStereoWavPCM16,
  generateAmbientNoise,
  ImageMatrixLike,
  SAMPLE_RATE_48K,
  synthesizeStegoAudio,
} from './audioStegoSynthesizer';
import { encodeLSB } from './lsbStegoEngine';

export type SceneEffectType = 'radio' | 'telephone' | 'cassette';

export interface RecipeAudioOutput {
  left: Float32Array;
  right: Float32Array | null;
  sampleRate: number;
  wavBlob: Blob;
  filename: string;
}

/**
 * Simple 1st-order RC high-pass + low-pass filter chain for deterministic offline scene styling.
 */
function applyBandpass(
  samples: Float32Array,
  sampleRate: number,
  hpHz: number,
  lpHz: number
): Float32Array {
  const out = new Float32Array(samples.length);
  const dt = 1 / sampleRate;
  const rcHp = 1 / (2 * Math.PI * Math.max(20, hpHz));
  const alphaHp = rcHp / (rcHp + dt);
  const rcLp = 1 / (2 * Math.PI * Math.max(hpHz + 100, lpHz));
  const alphaLp = dt / (rcLp + dt);

  let prevIn = 0;
  let prevHp = 0;
  let prevLp = 0;

  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    const hp = alphaHp * (prevHp + x - prevIn);
    prevIn = x;
    prevHp = hp;
    const lp = prevLp + alphaLp * (hp - prevLp);
    prevLp = lp;
    out[i] = lp;
  }
  return out;
}

/**
 * Recipe 1: Apply realistic diegetic scene effect (Ordo Radio, Telephone, Old Cassette).
 */
export function buildSceneEffectRecipe(
  baseSamples: Float32Array | null,
  effect: SceneEffectType,
  sampleRate = SAMPLE_RATE_48K
): RecipeAudioOutput {
  const src =
    baseSamples && baseSamples.length > 0
      ? baseSamples
      : generateAmbientNoise(Math.floor(sampleRate * 3));

  const noise = generateAmbientNoise(src.length);
  let filtered: Float32Array;
  let drive = 1.4;
  let noiseMix = 0.08;

  if (effect === 'radio') {
    filtered = applyBandpass(src, sampleRate, 420, 2900);
    drive = 2.4;
    noiseMix = 0.14;
  } else if (effect === 'telephone') {
    filtered = applyBandpass(src, sampleRate, 320, 3100);
    drive = 1.8;
    noiseMix = 0.05;
  } else {
    // cassette: warmer lows, rolled-off highs, subtle tape hiss
    filtered = applyBandpass(src, sampleRate, 90, 5200);
    drive = 1.35;
    noiseMix = 0.1;
  }

  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) {
    const saturated = Math.tanh(filtered[i] * drive) * 0.85;
    out[i] = Math.max(-0.98, Math.min(0.98, saturated + noise[i] * noiseMix));
  }

  const wavBlob = encodeStereoWavPCM16(out, null, sampleRate);
  return {
    left: out,
    right: null,
    sampleRate,
    wavBlob,
    filename: `cena_${effect}_${Date.now()}.wav`,
  };
}

/**
 * Renders secret text into an offscreen canvas ImageMatrixLike for spectrogram synthesis.
 */
export function renderTextToSpectrogramMatrix(text: string): ImageMatrixLike {
  const clean = text.trim() || 'ORDO';
  const width = Math.max(160, Math.min(480, clean.length * 26 + 40));
  const height = 64;

  if (typeof document === 'undefined') {
    // Fallback deterministic bitmap for non-DOM test environments
    const data = new Uint8ClampedArray(width * height * 4);
    for (let x = 10; x < width - 10; x++) {
      const y = Math.floor(height / 2 + Math.sin(x * 0.25) * 12);
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
    return { width, height, data };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { width, height, data: new Uint8ClampedArray(width * height * 4) };
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(clean.toUpperCase(), width / 2, height / 2);

  const img = ctx.getImageData(0, 0, width, height);
  return { width: img.width, height: img.height, data: img.data };
}

/**
 * Recipe 2: One-click Spectrogram Secret Text embedded in ambient static or base audio.
 */
export function buildSpectrogramSecretRecipe(
  secretText: string,
  baseSamples: Float32Array | null,
  options?: {
    sampleRate?: number;
    minFreqHz?: number;
    maxFreqHz?: number;
    durationSec?: number;
    matrixOverride?: ImageMatrixLike;
  }
): RecipeAudioOutput {
  const sampleRate = options?.sampleRate ?? SAMPLE_RATE_48K;
  const durationSec = Math.max(
    2.5,
    options?.durationSec ?? (baseSamples ? baseSamples.length / sampleRate : 4)
  );
  const matrix = options?.matrixOverride ?? renderTextToSpectrogramMatrix(secretText);

  const result = synthesizeStegoAudio({
    mode: 'ghost_zone',
    imageData: matrix,
    baseLeft: baseSamples,
    baseRight: baseSamples,
    sampleRate,
    durationSec,
    startSec: Math.min(0.4, durationSec * 0.1),
    endSec: Math.max(1.5, durationSec - 0.4),
    minFreqHz: options?.minFreqHz ?? 8500,
    maxFreqHz: options?.maxFreqHz ?? 18000,
    intensity: 0.85,
  });

  const wavBlob = encodeStereoWavPCM16(result.left, result.right, sampleRate);
  return {
    left: result.left,
    right: result.right,
    sampleRate,
    wavBlob,
    filename: `espectrograma_${Date.now()}.wav`,
  };
}

/**
 * Recipe 3: Hidden Voice in Stereo Diff (L-R) channel.
 * Disguise audio is identical on L & R (cancels in Diff), while the secret voice is phase-inverted
 * (+secret on L, -secret on R) so it cancels in Mono Mix and stands out clearly in Diff (L-R)!
 */
export function buildStereoDiffVoiceRecipe(
  secretVoice: Float32Array,
  disguiseBase: Float32Array | null,
  sampleRate = SAMPLE_RATE_48K
): RecipeAudioOutput {
  const totalLen = Math.max(
    secretVoice.length,
    disguiseBase ? disguiseBase.length : Math.floor(sampleRate * 3)
  );
  const cover =
    disguiseBase && disguiseBase.length >= totalLen
      ? disguiseBase
      : generateAmbientNoise(totalLen);

  const left = new Float32Array(totalLen);
  const right = new Float32Array(totalLen);

  for (let i = 0; i < totalLen; i++) {
    const c = (cover[i] || 0) * 0.55;
    const s = (i < secretVoice.length ? secretVoice[i] : 0) * 0.42;
    left[i] = Math.max(-0.98, Math.min(0.98, c + s));
    right[i] = Math.max(-0.98, Math.min(0.98, c - s));
  }

  const wavBlob = encodeStereoWavPCM16(left, right, sampleRate);
  return {
    left,
    right,
    sampleRate,
    wavBlob,
    filename: `canal_oculto_diff_${Date.now()}.wav`,
  };
}

/**
 * Recipe 4: One-click Quick LSB Injection (auto-generates ambient carrier if no base audio provided).
 */
export function buildQuickLsbRecipe(
  secretText: string,
  baseSamples: Float32Array | null,
  password?: string,
  sampleRate = SAMPLE_RATE_48K
): RecipeAudioOutput {
  const clean = secretText.trim();
  if (!clean) {
    throw new Error('Informe o texto secreto para injeção LSB.');
  }
  const minSamples = Math.max(Math.floor(sampleRate * 2.5), (clean.length + 16) * 16);
  const carrier =
    baseSamples && baseSamples.length >= minSamples
      ? baseSamples
      : generateAmbientNoise(minSamples);

  const encoded = encodeLSB(carrier, clean, password?.trim() || undefined);
  const wavBlob = encodeStereoWavPCM16(encoded, null, sampleRate);
  return {
    left: encoded,
    right: null,
    sampleRate,
    wavBlob,
    filename: `lsb_forense_${Date.now()}.wav`,
  };
}
