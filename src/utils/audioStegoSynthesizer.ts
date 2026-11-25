import {
  AudioAnomalyReport,
  AudioStegoMode,
  DiscretionLevel,
} from '../types/forensicPillars';

export const SAMPLE_RATE_48K = 48000;

export interface ImageMatrixLike {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface SynthesizeStegoOptions {
  mode: Exclude<AudioStegoMode, 'lsb'>;
  imageData: ImageMatrixLike;
  baseLeft?: Float32Array | null;
  baseRight?: Float32Array | null;
  sampleRate?: number;
  durationSec?: number;
  startSec?: number;
  endSec?: number;
  minFreqHz?: number;
  maxFreqHz?: number;
  intensity?: number;
}

export interface SynthesizeStegoResult {
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
  discretion: DiscretionLevel;
  audibleRatio: number;
  anomaly: AudioAnomalyReport;
}

export function generateAmbientNoise(length: number): Float32Array {
  const out = new Float32Array(length);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let seed = 1337;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < length; i++) {
    const white = nextRand() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
    b6 = white * 0.115926;
    out[i] = Math.max(-0.9, Math.min(0.9, pink));
  }
  return out;
}

export function synthesizeImageSignal(
  imageData: ImageMatrixLike,
  totalSamples: number,
  sampleRate: number,
  startSec: number,
  endSec: number,
  minFreqHz: number,
  maxFreqHz: number,
  intensity: number
): Float32Array {
  const signal = new Float32Array(totalSamples);
  const { width, height, data } = imageData;
  if (width <= 0 || height <= 0 || totalSamples <= 0) return signal;

  const clampedStart = Math.max(0, Math.min(totalSamples, Math.floor(startSec * sampleRate)));
  const clampedEnd = Math.max(clampedStart + 1, Math.min(totalSamples, Math.floor(endSec * sampleRate)));
  const regionSamples = clampedEnd - clampedStart;

  const stepY = Math.max(1, Math.floor(height / 48));
  const phases = new Float32Array(height);
  for (let y = 0; y < height; y++) {
    phases[y] = (y * 1.61803398875) % (2 * Math.PI);
  }

  for (let x = 0; x < width; x++) {
    const colStart = clampedStart + Math.floor((x / width) * regionSamples);
    const colEnd = clampedStart + Math.floor(((x + 1) / width) * regionSamples);
    const colLen = Math.max(1, colEnd - colStart);

    const activeRows: { freq: number; amp: number; phase: number }[] = [];
    for (let y = 0; y < height; y += stepY) {
      const idx = (y * width + x) * 4;
      const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / (3 * 255);
      if (lum > 0.08) {
        const freqNorm = 1 - y / Math.max(1, height - 1);
        const freq = minFreqHz + freqNorm * (maxFreqHz - minFreqHz);
        if (freq < sampleRate * 0.48) {
          activeRows.push({ freq, amp: Math.pow(lum, 0.7), phase: phases[y] });
        }
      }
    }

    if (activeRows.length === 0) continue;
    const normFactor = (intensity * 0.45) / Math.sqrt(Math.max(1, activeRows.length));

    for (let i = 0; i < colLen; i++) {
      const sampleIdx = colStart + i;
      if (sampleIdx >= totalSamples) break;
      const u = colLen > 1 ? i / (colLen - 1) : 0.5;
      const env = 0.5 - 0.5 * Math.cos(2 * Math.PI * u);
      const t = sampleIdx / sampleRate;
      let sum = 0;
      for (let r = 0; r < activeRows.length; r++) {
        const row = activeRows[r];
        sum += Math.sin(2 * Math.PI * row.freq * t + row.phase) * row.amp;
      }
      signal[sampleIdx] += sum * normFactor * (0.25 + 0.75 * env);
    }
  }

  return signal;
}

function goertzelPower(samples: Float32Array, sampleRate: number, targetFreq: number): number {
  const n = Math.min(samples.length, 4096);
  if (n <= 0) return 0;
  const k = Math.round((n * targetFreq) / sampleRate);
  const omega = (2 * Math.PI * k) / n;
  const coeff = 2 * Math.cos(omega);
  let q0 = 0, q1 = 0, q2 = 0;
  const offset = Math.floor(Math.max(0, (samples.length - n) / 2));
  for (let i = 0; i < n; i++) {
    q0 = coeff * q1 - q2 + samples[offset + i];
    q2 = q1;
    q1 = q0;
  }
  const power = q1 * q1 + q2 * q2 - q1 * q2 * coeff;
  return Math.sqrt(Math.max(0, power)) / n;
}

export function analyzeAudioAnomalies(
  left: Float32Array,
  right?: Float32Array | null,
  sampleRate = SAMPLE_RATE_48K
): AudioAnomalyReport {
  let peakHz: number | null = null;
  let maxUltraPower = 0;

  if (sampleRate >= 40000) {
    for (let f = 16800; f <= Math.min(20500, sampleRate * 0.48); f += 900) {
      const p = goertzelPower(left, sampleRate, f);
      if (p > maxUltraPower) {
        maxUltraPower = p;
        peakHz = f;
      }
    }
  }

  let stereoDiffRatio = 0;
  if (right && right.length === left.length && left.length > 0) {
    let diffEnergy = 0;
    let sumEnergy = 0;
    const step = Math.max(1, Math.floor(left.length / 8000));
    for (let i = 0; i < left.length; i += step) {
      const d = left[i] - right[i];
      const s = left[i] + right[i];
      diffEnergy += d * d;
      sumEnergy += s * s;
    }
    stereoDiffRatio = diffEnergy / Math.max(1e-9, sumEnergy + diffEnergy);
  }

  return {
    hasHighFreqEnergy: maxUltraPower > 0.0025,
    highFreqPeakHz: maxUltraPower > 0.0025 ? peakHz : null,
    hasStereoAsymmetry: stereoDiffRatio > 0.04,
    stereoDiffRatio: Number(stereoDiffRatio.toFixed(4)),
    hasLsbPayload: false,
  };
}

export function synthesizeStegoAudio(options: SynthesizeStegoOptions): SynthesizeStegoResult {
  const sampleRate = options.sampleRate ?? SAMPLE_RATE_48K;
  const baseL = options.baseLeft && options.baseLeft.length > 0 ? options.baseLeft : null;
  const baseR = options.baseRight && options.baseRight.length > 0 ? options.baseRight : baseL;
  const totalSamples = baseL ? baseL.length : Math.floor((options.durationSec ?? 6) * sampleRate);

  const startSec = options.startSec ?? 0.2;
  const endSec = options.endSec ?? Math.max(startSec + 0.5, totalSamples / sampleRate - 0.2);
  const intensity = Math.max(0.05, Math.min(1, options.intensity ?? 0.65));

  let minFreq = options.minFreqHz ?? 16800;
  let maxFreq = options.maxFreqHz ?? 20500;
  if (options.mode === 'stereo_lr') {
    minFreq = options.minFreqHz ?? 400;
    maxFreq = options.maxFreqHz ?? 16000;
  } else if (options.mode === 'noise_sculpt') {
    minFreq = options.minFreqHz ?? 800;
    maxFreq = options.maxFreqHz ?? 8500;
  }

  const stegoSignal = synthesizeImageSignal(
    options.imageData,
    totalSamples,
    sampleRate,
    startSec,
    endSec,
    minFreq,
    maxFreq,
    intensity
  );

  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  if (options.mode === 'stereo_lr') {
    const centerSource = baseL || generateAmbientNoise(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
      left[i] = Math.max(-0.99, Math.min(0.99, centerSource[i] + stegoSignal[i] * 0.5));
      right[i] = Math.max(-0.99, Math.min(0.99, centerSource[i] - stegoSignal[i] * 0.5));
    }
  } else if (options.mode === 'noise_sculpt') {
    const noiseBase = baseL || generateAmbientNoise(totalSamples);
    const noiseR = baseR || noiseBase;
    for (let i = 0; i < totalSamples; i++) {
      const sculpted = stegoSignal[i] * 0.38;
      left[i] = Math.max(-0.99, Math.min(0.99, noiseBase[i] + sculpted));
      right[i] = Math.max(-0.99, Math.min(0.99, noiseR[i] + sculpted));
    }
  } else {
    const srcL = baseL || generateAmbientNoise(totalSamples);
    const srcR = baseR || srcL;
    for (let i = 0; i < totalSamples; i++) {
      left[i] = Math.max(-0.99, Math.min(0.99, srcL[i] + stegoSignal[i]));
      right[i] = Math.max(-0.99, Math.min(0.99, srcR[i] + stegoSignal[i]));
    }
  }

  let stegoEnergy = 0;
  for (let i = 0; i < totalSamples; i++) {
    stegoEnergy += stegoSignal[i] * stegoSignal[i];
  }
  const stegoRms = Math.sqrt(stegoEnergy / Math.max(1, totalSamples));

  let discretion: DiscretionLevel = 'discreet';
  if (options.mode === 'ghost_zone' && minFreq >= 16500) {
    discretion = stegoRms > 0.25 ? 'texture' : 'discreet';
  } else if (options.mode === 'stereo_lr') {
    discretion = 'discreet';
  } else {
    discretion = stegoRms > 0.14 ? 'audible' : stegoRms > 0.05 ? 'texture' : 'discreet';
  }

  const anomaly = analyzeAudioAnomalies(left, right, sampleRate);

  return {
    left,
    right,
    sampleRate,
    discretion,
    audibleRatio: Number(stegoRms.toFixed(4)),
    anomaly,
  };
}

export function encodeStereoWavPCM16(
  left: Float32Array,
  right?: Float32Array | null,
  sampleRate = SAMPLE_RATE_48K
): Blob {
  const numChannels = right ? 2 : 1;
  const numFrames = left.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    const sL = Math.max(-1, Math.min(1, left[i]));
    view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true);
    offset += 2;
    if (right) {
      const sR = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
