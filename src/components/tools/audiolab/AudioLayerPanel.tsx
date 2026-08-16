import React, { useRef, useState, useCallback } from 'react';
import { Music, Layers, Play, Square, Download, Save, Loader2, Upload } from 'lucide-react';
import InteractiveWaveform from './InteractiveWaveform';
import { processAudioChain, type DSPFilterNode, type RegionOption } from '../../../utils/dspAudioEngine';
import './AudioLab.css';

// ---------------------------------------------------------------------------
// Inline bufferToWav (WAV encoder)
// ---------------------------------------------------------------------------
function bufferToWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataBytes = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); view.setUint32(4, 36 + dataBytes, true);
  ws(8, 'WAVE'); ws(12, 'fmt '); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true); view.setUint16(34, 16, true);
  ws(36, 'data'); view.setUint32(40, dataBytes, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([view], { type: 'audio/wav' });
}

// ---------------------------------------------------------------------------
// Waveform thumbnail canvas
// ---------------------------------------------------------------------------
function WaveformThumb({ samples }: { samples: Float32Array }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c || !samples.length) return;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#050a12';
    ctx.fillRect(0, 0, c.width, c.height);
    const step = Math.ceil(samples.length / c.width);
    const half = c.height / 2;
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < c.width; x++) {
      let max = 0;
      for (let j = 0; j < step; j++) {
        const v = Math.abs(samples[x * step + j] || 0);
        if (v > max) max = v;
      }
      const h = max * half;
      ctx.moveTo(x, half - h);
      ctx.lineTo(x, half + h);
    }
    ctx.stroke();
  }, [samples]);
  return <canvas ref={canvasRef} width={180} height={36} className="al-waveform-thumb" />;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface AudioLayerPanelProps {
  imageData: ImageData | null;
  minFreqHz: number;
  maxFreqHz: number;
  intensity: number;
  mixRatio: number;
  durationSec: number;
  usePinkNoise: boolean;
  onBaseAudioLoaded: (samples: Float32Array | null, durationSec: number) => void;
  onGeneratedBuffer: (samples: Float32Array, sampleRate: number) => void;
  generatedSamples: Float32Array | null;
  generatedSampleRate: number;
  dspFilters: DSPFilterNode[];
  onSave: (file: File) => void;
}

export default function AudioLayerPanel({
  imageData,
  minFreqHz,
  maxFreqHz,
  intensity,
  mixRatio,
  durationSec,
  usePinkNoise,
  onBaseAudioLoaded,
  onGeneratedBuffer,
  generatedSamples,
  generatedSampleRate,
  dspFilters,
  onSave,
}: AudioLayerPanelProps) {
  const [baseAudioInfo, setBaseAudioInfo] = useState<{ name: string; duration: number; samples: Float32Array } | null>(null);
  const [synthProgress, setSynthProgress] = useState(0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportRegion, setExportRegion] = useState<RegionOption | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const loadBaseAudio = async (file: File) => {
    const buf = await file.arrayBuffer();
    const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ab = await ac.decodeAudioData(buf);
    const samples = ab.getChannelData(0);
    const info = { name: file.name, duration: ab.duration, samples };
    setBaseAudioInfo(info);
    onBaseAudioLoaded(samples, ab.duration);
    await ac.close();
  };

  const synthesize = useCallback(() => {
    if (!imageData) return;
    setIsSynthesizing(true);
    setSynthProgress(0);

    if (workerRef.current) { workerRef.current.terminate(); }
    const worker = new Worker(
      new URL('../../../utils/spectrogramSynthesizerWorker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    const baseBuf = baseAudioInfo ? baseAudioInfo.samples.buffer.slice(0) : null;

    worker.addEventListener('message', (ev) => {
      const d = ev.data as any;
      if (d.cmd === 'progress') {
        setSynthProgress(d.percent);
      } else if (d.cmd === 'result') {
        const samples = new Float32Array(d.samples);
        onGeneratedBuffer(samples, d.sampleRate);
        setIsSynthesizing(false);
        setSynthProgress(100);
        worker.terminate();
        workerRef.current = null;
      } else if (d.cmd === 'error') {
        console.error('SynthWorker error:', d.error);
        setIsSynthesizing(false);
        worker.terminate();
        workerRef.current = null;
      }
    });

    const transferList: Transferable[] = [imageData.data.buffer.slice(0)];
    if (baseBuf) transferList.push(baseBuf);

    worker.postMessage({
      cmd: 'synthesize',
      width: imageData.width,
      height: imageData.height,
      imageData: imageData.data.buffer.slice(0),
      params: {
        sampleRate: 44100,
        durationSec,
        minFreqHz,
        maxFreqHz,
        intensity,
        mixRatio,
        usePinkNoiseBed: usePinkNoise && !baseAudioInfo,
        baseAudioBuffer: baseBuf,
        baseAudioLength: baseAudioInfo ? baseAudioInfo.samples.length : 0,
      },
    });
  }, [imageData, baseAudioInfo, durationSec, minFreqHz, maxFreqHz, intensity, mixRatio, usePinkNoise, onGeneratedBuffer]);

  const exportWav = async () => {
    if (!generatedSamples) return;
    setIsExporting(true);
    try {
      const { samples: processedSamples, sampleRate: processedRate } = await processAudioChain(
        generatedSamples,
        generatedSampleRate || 44100,
        dspFilters,
        exportRegion
      );
      const blob = bufferToWav(processedSamples, processedRate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'audiolab_steg.wav'; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const exportMp3 = async () => {
    if (!generatedSamples) return;
    setIsExporting(true);
    try {
      // Dynamic import lamejs if available, fallback to WAV
      // @ts-ignore
      let lamejs: any;
      try {
        // @ts-ignore
        lamejs = await import('lamejs');
      } catch {
        // lamejs not installed, fallback to WAV
        exportWav();
        setIsExporting(false);
        return;
      }
      const { samples: processedSamples, sampleRate: processedRate } = await processAudioChain(
        generatedSamples,
        generatedSampleRate || 44100,
        dspFilters,
        exportRegion
      );

      const mp3enc = new lamejs.Mp3Encoder(1, processedRate, 128);
      const int16 = new Int16Array(processedSamples.length);
      for (let i = 0; i < processedSamples.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, processedSamples[i] * 32767));
      }
      const chunkSize = 1152;
      const mp3Data: any[] = [];
      for (let i = 0; i < int16.length; i += chunkSize) {
        const chunk = int16.subarray(i, i + chunkSize);
        const mp3buf = mp3enc.encodeBuffer(chunk);
        if (mp3buf.length > 0) mp3Data.push(new Uint8Array(mp3buf.buffer, mp3buf.byteOffset, mp3buf.length));
      }
      const end = mp3enc.flush();
      if (end.length > 0) mp3Data.push(new Uint8Array(end.buffer, end.byteOffset, end.length));
      const blob = new Blob(mp3Data, { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'audiolab_steg.mp3'; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const saveToClue = async () => {
    if (!generatedSamples) return;
    setIsExporting(true);
    try {
      const { samples: processedSamples, sampleRate: processedRate } = await processAudioChain(
        generatedSamples,
        generatedSampleRate || 44100,
        dspFilters,
        exportRegion
      );
      const blob = bufferToWav(processedSamples, processedRate);
      const file = new File([blob], 'audiolab_steg.wav', { type: 'audio/wav' });
      onSave(file);
    } finally {
      setIsExporting(false);
    }
  };

  const genDuration = generatedSamples
    ? (generatedSamples.length / (generatedSampleRate || 44100)).toFixed(1)
    : null;

  return (
    <div className="al-layer-panel">
      {/* Base Audio */}
      <div className="al-section-title">Áudio Base</div>
      <div className="al-layer-card">
        <Music size={14} className="al-layer-icon" />
        {baseAudioInfo ? (
          <div className="al-layer-info">
            <span className="al-layer-name">{baseAudioInfo.name}</span>
            <span className="al-layer-meta">{baseAudioInfo.duration.toFixed(1)}s</span>
            <WaveformThumb samples={baseAudioInfo.samples} />
            <button
              className="al-btn-ghost al-btn-sm"
              onClick={() => { setBaseAudioInfo(null); onBaseAudioLoaded(null, 0); }}
            >
              Remover
            </button>
          </div>
        ) : (
          <label className="al-upload-label">
            <Upload size={12} /> Carregar áudio
            <input
              type="file"
              accept=".mp3,.wav,.ogg,.flac,.m4a"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) loadBaseAudio(f); }}
            />
          </label>
        )}
      </div>

      {/* Steg Layer */}
      <div className="al-layer-card al-layer-steg">
        <Layers size={14} className="al-layer-icon al-neon" />
        <div className="al-layer-info">
          <span className="al-layer-name">Sinal Oculto</span>
          <span className="al-layer-meta">
            {Math.round(intensity * 100)}% intensidade · {Math.round(mixRatio * 100)}% mistura
          </span>
          {generatedSamples && (
            <InteractiveWaveform
              samples={generatedSamples}
              sampleRate={generatedSampleRate || 44100}
              onRegionChange={setExportRegion}
            />
          )}
        </div>
      </div>

      {/* Synthesis */}
      <div className="al-section-divider" />
      <div className="al-section-title">Síntese</div>

      <button
        className={`al-btn-primary ${isSynthesizing ? 'loading' : ''}`}
        onClick={synthesize}
        disabled={!imageData || isSynthesizing}
      >
        {isSynthesizing ? (
          <><Loader2 size={14} className="al-spin" /> Gerando... {synthProgress}%</>
        ) : (
          <><Play size={14} /> Gerar Áudio</>
        )}
      </button>

      {isSynthesizing && (
        <div className="al-progress-bar">
          <div className="al-progress-fill" style={{ width: `${synthProgress}%` }} />
        </div>
      )}

      {generatedSamples && !isSynthesizing && (
        <div className="al-gen-info">
          <Square size={10} className="al-neon" />
          {genDuration}s gerado · {generatedSampleRate} Hz
        </div>
      )}

      {/* Export */}
      {generatedSamples && (
        <>
          <div className="al-section-divider" />
          <div className="al-section-title">Exportar</div>
          <div className="al-export-btns">
            <button className="al-btn-secondary" onClick={exportWav}>
              <Download size={13} /> WAV
            </button>
            <button className="al-btn-secondary" onClick={exportMp3} disabled={isExporting}>
              <Download size={13} /> MP3
            </button>
          </div>
          <button className="al-btn-save" onClick={saveToClue}>
            <Save size={14} /> Salvar na Pista
          </button>
        </>
      )}
    </div>
  );
}
