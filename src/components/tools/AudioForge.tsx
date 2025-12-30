import React, { useState } from 'react';
import './AudioForge.css';

interface Props {
  onSave: (processedFile: File) => void;
  onClose: () => void;
}

function makeDistortionCurve(amount: number) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// Convert AudioBuffer to WAV Blob
function bufferToWav(abuffer: AudioBuffer, len: number) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  const sampleRate = abuffer.sampleRate;
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + len * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChan * 2, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, len * 2, true);

  let offset = 44;
  const interleaved = new Float32Array(len * numOfChan);
  for (let ch = 0; ch < numOfChan; ch++) {
    const data = abuffer.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      interleaved[i * numOfChan + ch] = data[i] || 0;
    }
  }

  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export default function AudioForge({ onSave, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useReverse, setUseReverse] = useState(false);
  const [useReverb, setUseReverb] = useState(false);
  const [useDistortion, setUseDistortion] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setFile(f);
    const arrayBuffer = await f.arrayBuffer();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    setAudioBuffer(decoded);
  };

  const processAudio = async () => {
    if (!audioBuffer) return null;
    setProcessing(true);
    const sampleRate = audioBuffer.sampleRate;
    const extra = useReverb ? 2.0 : 0.0;
    const outLen = Math.round((audioBuffer.length + sampleRate * extra));
    const offline = new OfflineAudioContext(audioBuffer.numberOfChannels, outLen, sampleRate);

    // source
    const src = offline.createBufferSource();

    // prepare working buffer (reverse if needed)
    let working: AudioBuffer = audioBuffer;
    if (useReverse) {
      const numChannels = audioBuffer.numberOfChannels;
      const reversed = offline.createBuffer(numChannels, audioBuffer.length, audioBuffer.sampleRate);
      for (let c = 0; c < numChannels; c++) {
        const data = audioBuffer.getChannelData(c);
        const rd = reversed.getChannelData(c);
        for (let i = 0; i < data.length; i++) rd[i] = data[data.length - 1 - i];
      }
      working = reversed;
    }
    src.buffer = working;

    // nodes chain
    let last: AudioNode = src;

    if (useDistortion) {
      const dist = offline.createWaveShaper();
      dist.curve = makeDistortionCurve(400);
      dist.oversample = '4x';
      last.connect(dist);
      last = dist;
    }

    if (useReverb) {
      const conv = offline.createConvolver();
      const rate = sampleRate;
      const len = rate * 2.0;
      const ir = offline.createBuffer(2, len, rate);
      for (let ch = 0; ch < 2; ch++) {
        const id = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) id[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      }
      conv.buffer = ir;
      last.connect(conv);
      last = conv;
    }

    last.connect(offline.destination);
    src.start(0);
    const rendered = await offline.startRendering();
    const wav = bufferToWav(rendered, rendered.length);
    const url = URL.createObjectURL(wav);
    setPreviewUrl(url);
    setProcessing(false);
    const outFile = new File([wav], `forged_${Date.now()}.wav`, { type: 'audio/wav' });
    return outFile;
  };

  return (
    <div className="audio-forge-panel">
      <h3 className="af-title">FORJA DE ÁUDIO</h3>
      <div className="af-file-row">
        <input className="af-file-input" type="file" accept="audio/*" onChange={handleFileChange} />
        {audioBuffer && <span className="af-loaded">✓ {audioBuffer.duration.toFixed(1)}s carregado</span>}
      </div>

      <div className="af-tools-row">
        <button onClick={() => setUseReverse(s => !s)} className={`hud-btn ${useReverse ? 'primary' : ''}`}>🔄 INVERTER</button>
        <button onClick={() => setUseDistortion(s => !s)} className={`hud-btn ${useDistortion ? 'primary' : ''}`}>📢 DISTORÇÃO</button>
        <button onClick={() => setUseReverb(s => !s)} className={`hud-btn ${useReverb ? 'primary' : ''}`}>🏟️ REVERB</button>
      </div>

      <div className="af-actions">
        <button className="af-process" onClick={async () => {
            const processed = await processAudio();
            if (processed) onSave(processed);
          }} disabled={!audioBuffer || processing}
        >{processing ? 'PROCESSANDO...' : 'PROCESSAR E SALVAR'}</button>
        <button className="af-cancel" onClick={onClose}>Cancelar</button>
      </div>

      {previewUrl && (
        <div className="af-preview">
          <label>PRÉVIA</label>
          <audio src={previewUrl} controls style={{ width: '100%' }} />
        </div>
      )}
    </div>
  );
}
