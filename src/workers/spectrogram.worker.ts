/// <reference lib="webworker" />

const DEFAULT_FFT_SIZE = 2048;
const DEFAULT_HOP_SIZE = 512;

const getHotColor = (value: number): [number, number, number] => {
  const t = value / 255;
  if (t < 0.05) return [0, 0, 0];

  let r = 0;
  let g = 0;
  let b = 0;

  if (t < 0.33) {
    r = Math.floor(t * 3 * 255);
  } else if (t < 0.66) {
    r = 255;
    g = Math.floor((t - 0.33) * 3 * 255);
  } else {
    r = 255;
    g = 255;
    b = Math.floor((t - 0.66) * 3 * 255);
  }

  return [r, g, b];
};

const getCyanColor = (value: number): [number, number, number] => {
  const t = value / 255;
  if (t < 0.1) return [0, 0, 0];
  const intensity = Math.floor(t * 255);
  return [0, intensity, intensity];
};

const getMagmaColor = (value: number): [number, number, number] => {
  const t = value / 255;
  if (t < 0.05) return [0, 0, 0];

  if (t < 0.25) {
    return [Math.floor(t * 4 * 100), 0, Math.floor(t * 4 * 120)];
  }
  if (t < 0.5) {
    const localT = (t - 0.25) * 4;
    return [Math.floor(100 + localT * 155), Math.floor(localT * 50), Math.floor(120 - localT * 40)];
  }
  if (t < 0.75) {
    const localT = (t - 0.5) * 4;
    return [255, Math.floor(50 + localT * 150), Math.floor(80 + localT * 50)];
  }
  const localT = (t - 0.75) * 4;
  return [255, Math.floor(200 + localT * 55), Math.floor(130 + localT * 125)];
};

type ColorScheme = 'hot' | 'cyan' | 'magma';

type WorkerRequest = {
  channelData: ArrayBuffer;
  sampleRate: number;
  fftSize?: number;
  hopSize?: number;
  minDB: number;
  maxFreq: number;
  colorScheme: ColorScheme;
};

type FftConfig = {
  size: number;
  bitRev: Uint32Array;
  sin: Float32Array;
  cos: Float32Array;
  re: Float32Array;
  im: Float32Array;
};

const createFftConfig = (size: number): FftConfig => {
  const bitRev = new Uint32Array(size);
  const sin = new Float32Array(size / 2);
  const cos = new Float32Array(size / 2);

  const bits = Math.log2(size);
  for (let i = 0; i < size; i++) {
    let j = 0;
    for (let k = 0; k < bits; k++) {
      j = (j << 1) | ((i >>> k) & 1);
    }
    bitRev[i] = j;
  }

  for (let i = 0; i < size / 2; i++) {
    const angle = (-2 * Math.PI * i) / size;
    cos[i] = Math.cos(angle);
    sin[i] = Math.sin(angle);
  }

  return {
    size,
    bitRev,
    sin,
    cos,
    re: new Float32Array(size),
    im: new Float32Array(size),
  };
};

const fftMagnitude = (
  input: Float32Array,
  cfg: FftConfig,
  minDB: number,
  out: Uint8Array
): void => {
  const { size, bitRev, sin, cos, re, im } = cfg;
  const n = size;

  for (let i = 0; i < n; i++) {
    const j = bitRev[i];
    re[i] = input[j];
    im[i] = 0;
  }

  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >>> 1;
    const step = n / len;
    for (let i = 0; i < n; i += len) {
      for (let j = 0; j < halfLen; j++) {
        const k = j * step;
        const tRe = re[i + j + halfLen] * cos[k] - im[i + j + halfLen] * sin[k];
        const tIm = re[i + j + halfLen] * sin[k] + im[i + j + halfLen] * cos[k];
        re[i + j + halfLen] = re[i + j] - tRe;
        im[i + j + halfLen] = im[i + j] - tIm;
        re[i + j] += tRe;
        im[i + j] += tIm;
      }
    }
  }

  const scale = 1 / n;
  for (let i = 0; i < n / 2; i++) {
    const mag = Math.hypot(re[i], im[i]) * scale;
    const db = 20 * Math.log10(mag || 1e-12);
    const clamped = Math.max(minDB, Math.min(0, db));
    out[i] = Math.max(0, Math.min(255, Math.floor(((clamped - minDB) / -minDB) * 255)));
  }
};

const CHUNK_COLS = 256;

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const {
    channelData,
    sampleRate,
    fftSize = DEFAULT_FFT_SIZE,
    hopSize = DEFAULT_HOP_SIZE,
    minDB,
    maxFreq,
    colorScheme,
  } = ev.data;

  const samples = new Float32Array(channelData);
  const numFramesTotal = Math.max(1, Math.floor((samples.length - fftSize) / hopSize));
  const freqBins = fftSize / 2;
  const maxFreqBin = Math.max(1, Math.floor((maxFreq / (sampleRate / 2)) * freqBins));

  const fftCfg = createFftConfig(fftSize);
  const freqData = new Uint8Array(freqBins);

  let maxVal = 0;
  let maxBinUsed = 0;
  let sumVal = 0;
  let countVal = 0;

  const analysisStep = Math.max(1, Math.floor(numFramesTotal / 200));
  for (let i = 0; i < numFramesTotal; i += analysisStep) {
    const offset = i * hopSize;
    const frame = samples.subarray(offset, offset + fftSize);
    fftMagnitude(frame, fftCfg, minDB, freqData);
    for (let b = 0; b < maxFreqBin; b++) {
      const v = freqData[b];
      if (v > 8) {
        if (v > maxVal) maxVal = v;
        if (b > maxBinUsed) maxBinUsed = b;
        sumVal += v;
        countVal += 1;
      }
    }
  }

  const nyquist = sampleRate / 2;
  const highestFreq = (maxBinUsed / freqBins) * nyquist;
  const optimalMaxFreq = Math.min(22000, Math.max(2000, Math.ceil((highestFreq * 1.2) / 1000) * 1000));
  const optimalMinDB = Math.max(-90, Math.min(-20, Math.round(-(Math.max(30, maxVal) / 2))));

  self.postMessage({
    type: 'analysisComplete',
    payload: { optimalMaxFreq, optimalMinDB },
  });

  const colorFunc = colorScheme === 'hot' ? getHotColor : colorScheme === 'cyan' ? getCyanColor : getMagmaColor;

  for (let frameStart = 0; frameStart < numFramesTotal; frameStart += CHUNK_COLS) {
    const chunkFrames = Math.min(CHUNK_COLS, numFramesTotal - frameStart);
    const chunkData = new Uint8ClampedArray(chunkFrames * maxFreqBin * 4);

    for (let j = 0; j < chunkFrames; j++) {
      const frameIndex = frameStart + j;
      const offset = frameIndex * hopSize;
      const frame = samples.subarray(offset, offset + fftSize);
      if (frame.length < fftSize) continue;

      fftMagnitude(frame, fftCfg, minDB, freqData);

      for (let y = 0; y < maxFreqBin; y++) {
        const value = freqData[y] || 0;
        const [r, g, b] = colorFunc(value);
        const idx = (y * chunkFrames + j) * 4;
        chunkData[idx] = r;
        chunkData[idx + 1] = g;
        chunkData[idx + 2] = b;
        chunkData[idx + 3] = 255;
      }
    }

    const progress = Math.min(99, ((frameStart + chunkFrames) / numFramesTotal) * 100);
    self.postMessage(
      {
        type: 'chunkProcessed',
        payload: {
          chunkData: chunkData.buffer,
          startFrame: frameStart,
          frames: chunkFrames,
          totalFrames: numFramesTotal,
          height: maxFreqBin,
        },
      },
      [chunkData.buffer]
    );

    self.postMessage({ type: 'progress', payload: progress });
  }

  self.postMessage({ type: 'progress', payload: 100 });
  self.postMessage({ type: 'complete' });
};
