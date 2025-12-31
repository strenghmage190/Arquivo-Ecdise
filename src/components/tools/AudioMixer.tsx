import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';
import { bufferToWav } from '../../utils/audioGenerator';
import SpectrogramCreator from './SpectrogramCreator';
import './AudioMixer.css';

interface Props {
  baseAudioFile?: File;
  onSave: (mixedFile: File, triggerTime: number) => void;
  onClose: () => void;
}

export default function AudioMixer({ baseAudioFile, onSave, onClose }: Props) {
  const [baseBuffer, setBaseBuffer] = useState<AudioBuffer | null>(null);
  const [hiddenBuffer, setHiddenBuffer] = useState<AudioBuffer | null>(null);
  const [triggerTime, setTriggerTime] = useState<number>(3);
  const [hiddenVolume, setHiddenVolume] = useState<number>(0.08);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showSpectroMaker, setShowSpectroMaker] = useState<boolean>(false);

  const [lowpassEnabled, setLowpassEnabled] = useState<boolean>(false);
  const [lowpassFreq, setLowpassFreq] = useState<number>(5000);
  const [fftSamples, setFftSamples] = useState<number>(2048);
  const [colorMap, setColorMap] = useState<string>('hot');
  const [invertSpectro, setInvertSpectro] = useState<boolean>(false);

  const baseWaveRef = useRef<HTMLDivElement | null>(null);
  const hiddenWaveRef = useRef<HTMLDivElement | null>(null);
  const finalSpectroRef = useRef<HTMLDivElement | null>(null);
  const finalWsRef = useRef<any | null>(null);
  const mixedBufferRef = useRef<AudioBuffer | null>(null);

  // Decode uploaded base file
  useEffect(() => {
    if (!baseAudioFile) return;
    let cancelled = false;
    baseAudioFile.arrayBuffer().then(async (ab) => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buf = await ctx.decodeAudioData(ab.slice(0));
        if (!cancelled) setBaseBuffer(buf);
        ctx.close().catch(()=>{});
      } catch (e) {
        console.error('decode base failed', e);
      }
    });
    return () => { cancelled = true; };
  }, [baseAudioFile]);

  // render small previews for A and B
  useEffect(() => {
    let wsA: any = null;
    if (baseWaveRef.current && baseBuffer) {
      wsA = WaveSurfer.create({ container: baseWaveRef.current, waveColor: '#89b', progressColor: '#57a', height: 80 });
      try { wsA.loadDecodedBuffer(baseBuffer); } catch(e){ console.warn(e); }
    }
    return () => { if (wsA) { try{ wsA.destroy(); }catch(e){} } };
  }, [baseBuffer]);

  useEffect(() => {
    let wsB: any = null;
    if (hiddenWaveRef.current && hiddenBuffer) {
      wsB = WaveSurfer.create({ container: hiddenWaveRef.current, waveColor: '#b98', progressColor: '#a75', height: 60 });
      try { wsB.loadDecodedBuffer(hiddenBuffer); } catch(e){ console.warn(e); }
    }
    return () => { if (wsB) { try{ wsB.destroy(); }catch(e){} } };
  }, [hiddenBuffer]);

  // Mix offline and preview final spectrogram
  async function handleMixAndPreview() {
    if (!baseBuffer || !hiddenBuffer) return;
    setIsProcessing(true);
    try {
      const sampleRate = Math.max(baseBuffer.sampleRate, hiddenBuffer.sampleRate, 44100);
      const finalDuration = Math.max(baseBuffer.duration, triggerTime + hiddenBuffer.duration);
      const offline = new OfflineAudioContext(2, Math.ceil(finalDuration * sampleRate), sampleRate);

      // base source
      const baseSrc = offline.createBufferSource();
      baseSrc.buffer = baseBuffer;
      let baseNode: AudioNode = baseSrc;
      if (lowpassEnabled) {
        const lp = offline.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = lowpassFreq;
        baseNode.connect(lp);
        baseNode = lp;
      }
      const baseGain = offline.createGain();
      baseGain.gain.value = 1.0;
      baseNode.connect(baseGain).connect(offline.destination);

      // hidden source
      const hiddenSrc = offline.createBufferSource();
      hiddenSrc.buffer = hiddenBuffer;
      const hiddenGain = offline.createGain();
      hiddenGain.gain.value = hiddenVolume;
      hiddenSrc.connect(hiddenGain).connect(offline.destination);

      baseSrc.start(0);
      hiddenSrc.start(triggerTime);

      const rendered = await offline.startRendering();
      mixedBufferRef.current = rendered;

      // render spectrogram preview with wavesurfer
      if (finalSpectroRef.current) {
        if (finalWsRef.current) {
          try { finalWsRef.current.destroy(); } catch(e){}
          finalWsRef.current = null;
        }
        const ws = WaveSurfer.create({ container: finalSpectroRef.current, waveColor: '#fff', progressColor: '#0f0', height: 160 });
        // safe plugin creation
        let plugin: any = null;
        try {
          plugin = SpectrogramPlugin.create({
            container: finalSpectroRef.current,
            fftSamples,
            labels: true,
            colorMap,
            smoothingTimeConstant: 0.1,
            frequencyLog: true,
          });
        } catch (err) {
          console.warn('spectrogram plugin colorMap failed, retrying without colorMap', err);
          try { plugin = SpectrogramPlugin.create({ container: finalSpectroRef.current, fftSamples, labels:true, smoothingTimeConstant:0.1, frequencyLog:true }); } catch(e){ console.warn(e); }
        }
        if (plugin) ws.addPlugin(plugin);
        try { ws.loadDecodedBuffer(rendered); } catch(e){ console.warn(e); }
        finalWsRef.current = ws;
        // apply invert style
        if (invertSpectro && finalSpectroRef.current) finalSpectroRef.current.classList.add('inverted');
        else if (finalSpectroRef.current) finalSpectroRef.current.classList.remove('inverted');
      }
    } catch (e) {
      console.error('mix/render failed', e);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleFinalSave() {
    const buf = mixedBufferRef.current;
    if (!buf) return;
    const wav = bufferToWav(buf, buf.length);
    const file = new File([wav], 'mixed.wav', { type: 'audio/wav' });
    onSave(file, triggerTime);
  }

  return (
    <div className="mixer-overlay">
      <div className="mixer-window">
        <div className="mixer-header">
          <h3>Estação de Mixagem de Sinais</h3>
          <button onClick={onClose}>✖</button>
        </div>

        <div className="mixer-body">
          <div className="track">
            <div className="track-header">TRILHA A (SOM AMBIENTE)</div>
            <div ref={baseWaveRef} className="waveform-container" />
            {!baseBuffer && <div className="placeholder-text">Carregue um áudio na Aba "ÁUDIO" primeiro.</div>}
          </div>

          <div className="track">
            <div className="track-header">TRILHA B (SINAL OCULTO)</div>
            <div ref={hiddenWaveRef} className="waveform-container" />
            {!hiddenBuffer && (
              <div className="empty-track">
                <button onClick={() => setShowSpectroMaker(true)}>📝 TEXTO → ÁUDIO (ESPECTRO)</button>
              </div>
            )}
          </div>

          <div className="mixer-controls">
            <div className="control-group">
              <label>INÍCIO DO SINAL OCULTO: {triggerTime.toFixed(1)}s</label>
              <input type="range" min="0" max={baseBuffer?.duration || 60} step="0.1" value={triggerTime} onChange={e=>setTriggerTime(Number(e.target.value))} />
            </div>
            <div className="control-group">
              <label>OPACIDADE (VOLUME DO SINAL): {(hiddenVolume*100).toFixed(0)}%</label>
              <input type="range" min="0.01" max="0.5" step="0.01" value={hiddenVolume} onChange={e=>setHiddenVolume(Number(e.target.value))} />
            </div>

            <div className="control-group">
              <label>Limpar Agudos (low-pass)</label>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <input type="checkbox" checked={lowpassEnabled} onChange={e=>setLowpassEnabled(e.target.checked)} />
                <input type="number" value={lowpassFreq} onChange={e=>setLowpassFreq(Number(e.target.value))} style={{width:100}} />
                <span style={{color:'#888'}}>Hz</span>
              </div>
            </div>

            <div className="control-group">
              <label>Resolução (FFT)</label>
              <select value={fftSamples} onChange={e=>setFftSamples(Number(e.target.value))}>
                <option value={512}>512</option>
                <option value={1024}>1024</option>
                <option value={2048}>2048</option>
              </select>
            </div>

            <div className="control-group">
              <label>Paleta</label>
              <div className="palette-selector">
                <button onClick={()=>setColorMap('hot')} className={colorMap==='hot'?'active':''}>Hot</button>
                <button onClick={()=>setColorMap('viridis')} className={colorMap==='viridis'?'active':''}>Viridis</button>
                <button onClick={()=>setColorMap('greyscale')} className={colorMap==='greyscale'?'active':''}>Greyscale</button>
              </div>
            </div>

            <div className="control-group">
              <label>Inverter Visual</label>
              <input type="checkbox" checked={invertSpectro} onChange={e=>setInvertSpectro(e.target.checked)} />
            </div>
          </div>

          <button onClick={handleMixAndPreview} disabled={!baseBuffer || !hiddenBuffer || isProcessing} className="btn-preview">
            {isProcessing ? 'RENDERIZANDO...' : '▶ GERAR PREVIEW DO ESPECTROGRAMA'}
          </button>

          <div className="final-preview">
            <div className="track-header">RESULTADO FINAL (O QUE O JOGADOR VAI VER E OUVIR)</div>
            <div ref={finalSpectroRef} className="spectrogram-container" />
            {finalWsRef.current && (
              <div style={{display:'flex', gap:10, padding:5, background:'#000'}}>
                <button onClick={() => { try { finalWsRef.current.playPause(); } catch(e){ /* ignore */ } }}>Play/Pause</button>
                <button onClick={() => { try { finalWsRef.current.stop(); } catch(e){ /* ignore */ } }}>Stop</button>
              </div>
            )}
          </div>
        </div>

        <div className="mixer-footer">
          <button onClick={onClose}>CANCELAR</button>
          <button className="btn-save-mix" onClick={handleFinalSave}>✔ USAR ÁUDIO MIXADO</button>
        </div>
      </div>

      {showSpectroMaker && (
        <SpectrogramCreator
          onClose={() => setShowSpectroMaker(false)}
          onGenerateBuffer={(buffer) => { setHiddenBuffer(buffer); setShowSpectroMaker(false); }}
        />
      )}
    </div>
  );
}

