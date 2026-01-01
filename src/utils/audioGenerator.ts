// Transforma dados de imagem (pixels) em um AudioBuffer e converte para WAV
export async function imageToAudioBuffer(
  canvas: HTMLCanvasElement,
  durationSec: number,
  minFreq = 500,
  maxFreq = 15000
): Promise<AudioBuffer> {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = ctx.sampleRate; // usually 44100 or 48000
  const totalSamples = Math.floor(sampleRate * durationSec);

  const audioBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // 1. Prepare image
  const w = canvas.width;
  const h = canvas.height;
  const imgCtx = canvas.getContext('2d');
  if (!imgCtx) throw new Error('Canvas context error');

  const imageData = imgCtx.getImageData(0, 0, w, h);
  const pixels = imageData.data;

  // 2. Additive synthesis optimized: iterate image X->time, Y->frequency
  for (let x = 0; x < w; x++) {
    const sampleStart = Math.floor((x / w) * totalSamples);
    const sampleEnd = Math.floor(((x + 1) / w) * totalSamples);
    const samplesInColumn = Math.max(1, sampleEnd - sampleStart);

    for (let y = 0; y < h; y++) {
      const pixelIndex = (y * w + x) * 4;
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const intensity = (r + g + b) / 3 / 255;
      if (intensity > 0.01) {
        // stronger boost for faint pixels and slightly lower threshold
        const eff = Math.pow(intensity, 0.35);
        const freqPercent = 1 - (y / h);
        const frequency = minFreq + freqPercent * (maxFreq - minFreq);
        for (let i = 0; i < samplesInColumn; i++) {
          const t = (sampleStart + i) / sampleRate;
          const fundamental = Math.sin(2 * Math.PI * frequency * t) * (eff * 0.5);
          const harmonic2 = Math.sin(2 * Math.PI * frequency * 2 * t) * (eff * 0.2);
          const harmonic3 = Math.sin(2 * Math.PI * frequency * 3 * t) * (eff * 0.1);
          channelData[sampleStart + i] += fundamental + harmonic2 + harmonic3;
        }
      }
    }
  }

  // 3. normalize (avoid clipping)
  let peak = 0;
  for (let i = 0; i < totalSamples; i++) {
    const absv = Math.abs(channelData[i]);
    if (absv > peak) peak = absv;
  }
  if (peak > 0) {
    const scale = 0.9 / peak;
    for (let i = 0; i < totalSamples; i++) channelData[i] *= scale;
  }

  return audioBuffer;
}

// Converte um AudioBuffer em WAV Blob (PCM16)
export function bufferToWav(abuffer: AudioBuffer, len: number): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const sampleRate = abuffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numOfChan * bytesPerSample;
  const bufferLength = 44 + len * blockAlign;

  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);

  /* RIFF identifier */ writeString(view, 0, 'RIFF');
  /* file length */ view.setUint32(4, 36 + len * blockAlign, true);
  /* RIFF type */ writeString(view, 8, 'WAVE');
  /* format chunk identifier */ writeString(view, 12, 'fmt ');
  /* format chunk length */ view.setUint32(16, 16, true);
  /* sample format (raw) */ view.setUint16(20, 1, true);
  /* channel count */ view.setUint16(22, numOfChan, true);
  /* sample rate */ view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */ view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */ view.setUint16(32, blockAlign, true);
  /* bits per sample */ view.setUint16(34, 16, true);
  /* data chunk identifier */ writeString(view, 36, 'data');
  /* data chunk length */ view.setUint32(40, len * blockAlign, true);

  // write interleaved PCM samples
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let i = 0; i < numOfChan; i++) channels.push(abuffer.getChannelData(i));

  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      let sample = channels[ch][i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });

  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export default { imageToAudioBuffer, bufferToWav };
