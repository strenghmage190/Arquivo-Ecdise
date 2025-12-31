import React, { useState } from 'react';
import './AudioForge.css';
import SpectrogramCreator from './SpectrogramCreator';
import { bufferToWav } from '../../utils/audioGenerator';

interface Props {
  onSave: (processedFile: File) => void;
  onClose: () => void;
  // optional: a spectrogram audio URL (blob or public) to mix into the base
  spectrogramUrl?: string | null;
  // trigger time (seconds) when spectrogram should start
  triggerTime?: number;
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



export default function AudioForge({ onSave, onClose, spectrogramUrl, triggerTime }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useReverse, setUseReverse] = useState(false);
  const [useReverb, setUseReverb] = useState(false);
  const [useDistortion, setUseDistortion] = useState(false);
  const [processing, setProcessing] = useState(false);
  // NOVO: buffer gerado pelo SpectrogramCreator
  const [spectrogramBuffer, setSpectrogramBuffer] = useState<AudioBuffer | null>(null);
  const [showSpectroMaker, setShowSpectroMaker] = useState(false);
  const [triggerTimeState, setTriggerTimeState] = useState<number>(0); // Em que segundo injetar

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

    // if there is a spectrogram buffer provided by the SpectrogramCreator, MIXA PRIMEIRO
    let finalRendered: AudioBuffer = rendered;
    try {
      if (spectrogramBuffer) {
        const mixed = await mixAudio(rendered, spectrogramBuffer, triggerTimeState);
        if (mixed) finalRendered = mixed;
      } else if (spectrogramUrl) {
        try {
          const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
          const resp = await fetch(spectrogramUrl);
          const ab = await resp.arrayBuffer();
          const spectroBuffer = await ac.decodeAudioData(ab.slice(0));
          const trig = Number(triggerTime || 0);
          const mixed = await mixAudio(rendered, spectroBuffer, trig);
          if (mixed) finalRendered = mixed;
        } catch (e) {
          console.warn('Failed to mix spectrogram audio', e);
        }
      }
    } catch (e) {}

    const wav = bufferToWav(finalRendered, finalRendered.length);
    const url = URL.createObjectURL(wav);
    setPreviewUrl(url);
    setProcessing(false);
    const outFile = new File([wav], `forged_${Date.now()}.wav`, { type: 'audio/wav' });
    return outFile;
  };

  // Mix two AudioBuffers: place spectroBuffer starting at triggerTime (seconds)
  const mixAudio = async (baseBuffer: AudioBuffer, spectroBuffer: AudioBuffer, triggerSec = 0): Promise<AudioBuffer | null> => {
    try {
      const sampleRate = baseBuffer.sampleRate;
      const baseDuration = baseBuffer.duration;
      const spectroDuration = spectroBuffer.duration;
      const newDuration = Math.max(baseDuration, triggerSec + spectroDuration);
      const numChannels = Math.max(baseBuffer.numberOfChannels, spectroBuffer.numberOfChannels);
      const offline = new OfflineAudioContext(numChannels, Math.ceil(newDuration * sampleRate), sampleRate);

      // base source
      const srcBase = offline.createBufferSource();
      srcBase.buffer = baseBuffer;
      srcBase.connect(offline.destination);

      // spectro source and low gain
      const srcSpec = offline.createBufferSource();
      srcSpec.buffer = spectroBuffer;
      const gain = offline.createGain();
      gain.gain.value = 0.05;
      srcSpec.connect(gain);
      gain.connect(offline.destination);

      srcBase.start(0);
      srcSpec.start(triggerSec);

      const rendered = await offline.startRendering();
      return rendered;
    } catch (e) {
      console.error('mixAudio error', e);
      return null;
    }
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

      <div style={{marginTop: 20}}>
        <label style={{color:'#b33'}}>Sinal Oculto (Espectrograma)</label>
        <button onClick={() => setShowSpectroMaker(true)}>📝 TEXTO → ÁUDIO (ESPECTRO)</button>
        {spectrogramBuffer && (
          <div style={{color:'lime'}}>
            ✓ Sinal de Espectro carregado. Injetar em:
            <input type="number" value={triggerTimeState} onChange={e=>setTriggerTimeState(Number(e.target.value))} style={{width:50}}/> s
          </div>
        )}
      </div>

      {showSpectroMaker && (
        <SpectrogramCreator 
          onClose={() => setShowSpectroMaker(false)}
          onGenerateBuffer={(buffer) => {
            setSpectrogramBuffer(buffer);
          }}
        />
      )}

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
          <audio
            src={previewUrl}
            controls
            controlsList="nodownload noplaybackrate noremoteplayback"
            onContextMenu={(e) => e.preventDefault()}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );
}
