import React, { useState, useRef, useEffect } from 'react';
import RealTimeSpectrogram from './RealTimeSpectrogram';

function bufferToWav(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length;
  const sampleRate = abuffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numOfChan * bytesPerSample;
  const bufferLength = 44 + length * blockAlign;
  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * blockAlign, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * blockAlign, true);
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let i = 0; i < numOfChan; i++) channels.push(abuffer.getChannelData(i));
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      let sample = channels[ch][i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}

type Props = { onGenerated?: (wavBlob: Blob, buffer?: AudioBuffer) => void };

export default function SpectrogramCreator({ onGenerated }: Props) {
  const [text, setText] = useState('VITE ROCKS');
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      try { if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; } } catch {}
    };
  }, []);

  const generate = async () => {
    setProgress(0);
    setIsGenerating(true);

    const fontSize = 64;
    const pxPerChar = 22;
    const width = Math.max(64, Math.ceil((text.length || 1) * pxPerChar));
    const height = 96;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(fontSize * 0.6)}px monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 2, height / 2);

    const sendW = Math.max(32, Math.floor(width * 0.5));
    const sendH = Math.max(16, Math.floor(height * 0.5));
    const tmp = document.createElement('canvas');
    tmp.width = sendW; tmp.height = sendH;
    const tctx = tmp.getContext('2d');
    if (!tctx) return;
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(canvas, 0, 0, width, height, 0, 0, sendW, sendH);
    const imageData = tctx.getImageData(0, 0, sendW, sendH);

    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../../utils/textSynthWorker.ts', import.meta.url), { type: 'module' });
    }
    const worker = workerRef.current;

    const DURATION_PER_PIXEL = 0.2;
    const MIN_FREQ = 1000;
    const MAX_FREQ = 12000;
    const SAMPLE_RATE = 44100;

    const onMessage = (ev: MessageEvent) => {
      const d = ev.data as any;
      if (d.cmd === 'progress') {
        requestAnimationFrame(() => setProgress(d.percent || 0));
        } else if (d.cmd === 'result') {
        try {
          const arr = new Float32Array(d.samples);
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const ab = ctx.createBuffer(1, arr.length, d.sampleRate || SAMPLE_RATE);
          ab.getChannelData(0).set(arr);
          setAudioBuffer(ab);
          try {
            if (typeof onGenerated === 'function') {
              const wav = bufferToWav(ab);
              onGenerated(wav, ab);
            }
          } catch (e) { console.error('onGenerated callback failed', e); }
        } catch (e) {
          console.error(e);
        } finally {
          setIsGenerating(false);
          setProgress(100);
          worker.removeEventListener('message', onMessage);
        }
      } else if (d.cmd === 'error') {
        console.error('Worker error', d.error);
        setIsGenerating(false);
        worker.removeEventListener('message', onMessage);
      }
    };

    worker.addEventListener('message', onMessage);
    worker.postMessage({ cmd: 'synthesize', width: sendW, height: sendH, imageData: imageData.data.buffer, params: { DURATION_PER_PIXEL, MIN_FREQ, MAX_FREQ, SAMPLE_RATE } }, [imageData.data.buffer]);
  };

  const download = () => {
    if (!audioBuffer) return;
    const wav = bufferToWav(audioBuffer);
    const url = URL.createObjectURL(wav);
    const a = document.createElement('a');
    a.href = url; a.download = 'text_spectrogram.wav'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-xl border border-cyan-500/30 overflow-hidden">
      {/* Header */}
      <div className="bg-black/50 px-4 py-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
          <h3 className="text-cyan-400 font-bold text-sm tracking-wide">TEXTO → ÁUDIO ESPECTROGRAMA</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Input */}
        <div className="flex gap-2">
          <input 
            value={text} 
            onChange={e => setText(e.target.value)} 
            maxLength={30}
            placeholder="Digite o texto aqui..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button 
            onClick={generate} 
            disabled={isGenerating}
            className={`px-6 py-2 rounded font-semibold transition-all ${
              isGenerating 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg'
            }`}
          >
            {isGenerating ? '⏳ Gerando...' : '✨ Gerar'}
          </button>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Preview */}
        <div className="bg-black/40 rounded-lg border border-gray-700/50 overflow-hidden">
          {audioBuffer ? (
            <div className="p-3 space-y-3">
              {/* Spectrogram */}
              <div className="bg-black rounded overflow-hidden">
                <RealTimeSpectrogram 
                  audioBuffer={audioBuffer} 
                  minFreq={1000} 
                  maxFreq={12000} 
                  width={800} 
                  height={160} 
                />
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button 
                  onClick={() => { 
                    try { 
                      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); 
                      const s = ctx.createBufferSource(); 
                      s.buffer = audioBuffer; 
                      s.connect(ctx.destination); 
                      s.start(); 
                    } catch(e) { console.error(e); } 
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded transition-all"
                >
                  ▶ Tocar
                </button>
                <button 
                  onClick={download}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded transition-all"
                >
                  💾 Baixar WAV
                </button>
              </div>
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-gray-500 text-sm">
              <div className="text-4xl mb-2">📝</div>
              <p>Digite um texto e clique em Gerar</p>
              <p className="text-xs text-gray-600 mt-1">O texto aparecerá como imagem no espectrograma</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

