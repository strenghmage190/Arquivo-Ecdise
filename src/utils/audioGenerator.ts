// Transforma dados de imagem (pixels) em um AudioBuffer e converte para WAV
export async function imageToAudioBuffer(
  canvas: HTMLCanvasElement,
  durationSec: number,
  minFreq = 500,
  maxFreq = 15000,
  horizontalStep = 1,
  verticalStep = 1
): Promise<AudioBuffer> {
  const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
  const ctx = new AudioCtx();
  const sampleRate = ctx.sampleRate;
  const totalSamples = Math.floor(sampleRate * durationSec);

  const audioBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  const imgCtx = canvas.getContext('2d', { willReadFrequently: true });
  if (!imgCtx) throw new Error('Canvas 2D context not available');
  const imgData = imgCtx.getImageData(0, 0, canvas.width, canvas.height);
  const width = canvas.width;
  const height = canvas.height;
  const pixels = imgData.data;

  // Compute reduced columns and rows to speed up generation
  const cols = Math.ceil(width / horizontalStep);
  const rows = Math.ceil(height / verticalStep);

  for (let cx = 0; cx < cols; cx++) {
    const srcX = Math.min(width - 1, cx * horizontalStep);
    const timeStart = Math.floor((cx / cols) * totalSamples);
    const timeEnd = Math.floor(((cx + 1) / cols) * totalSamples);

    for (let ry = 0; ry < rows; ry++) {
      const srcY = Math.min(height - 1, ry * verticalStep);
      const visualY = height - 1 - srcY;
      const pIndex = (srcY * width + srcX) * 4;
      const intensity = (pixels[pIndex] + pixels[pIndex + 1] + pixels[pIndex + 2]) / (3 * 255);
      if (intensity > 0.08) {
        const freq = minFreq + (visualY / height) * (maxFreq - minFreq);
        for (let i = timeStart; i < timeEnd; i++) {
          const t = i / sampleRate;
          channelData[i] += Math.sin(2 * Math.PI * freq * t) * (intensity * 0.04);
        }
      }
    }
  }

  // normalize
  let maxAmp = 0;
  for (let i = 0; i < totalSamples; i++) if (Math.abs(channelData[i]) > maxAmp) maxAmp = Math.abs(channelData[i]);
  if (maxAmp > 0) for (let i = 0; i < totalSamples; i++) channelData[i] /= maxAmp;

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
