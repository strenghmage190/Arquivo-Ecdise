import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import './AdvancedAudioLab.css';
import SpectrogramCreator from './SpectrogramCreator';
import ProfessionalSpectrogram from './ProfessionalSpectrogram';

interface Props {
  baseSrc: string;
  hiddenSrc?: string | null;
  triggerTime?: number;
  targetFreq?: number;
  // optional callback to update trigger time (seconds) when user drags the overlay
  onTriggerChange?: (t: number) => void;
}

export default function AdvancedAudioLab({ baseSrc, hiddenSrc, triggerTime = 0, targetFreq, onTriggerChange }: Props) {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const overlaySpectrogramRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wavesurfer = useRef<any | null>(null);
  const hiddenWavesurfer = useRef<any | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  // overlay always visible
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [baseDuration, setBaseDuration] = useState<number | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(1);
  const [overlayHighlight, setOverlayHighlight] = useState<boolean>(true);
  const [triggerLocal, setTriggerLocal] = useState<number>(triggerTime || 0);
  const dragState = useRef<{ dragging: boolean; startX: number; startLeftPercent: number; overlayPercent: number } | null>(null);

  const [showTextTester, setShowTextTester] = useState(false);
  const [localHiddenSrc, setLocalHiddenSrc] = useState<string | null>(null);
  const prevLocalHiddenRef = useRef<string | null>(null);
  
  // Novos estados para funcionalidades avançadas
  const [audioExpanded, setAudioExpanded] = useState(false);
  const [zoomMagnification, setZoomMagnification] = useState(1);
  const [isSynced, setIsSynced] = useState(false);
  const [isGhosting, setIsGhosting] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);

  useEffect(() => {
    if (!waveformRef.current) return;
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
      wavesurfer.current = null;
    }

    const ws = (WaveSurfer as any).create({
      container: waveformRef.current,
      waveColor: '#666',
      progressColor: '#00ffaa',
      cursorColor: 'red',
      height: audioExpanded ? 120 : 100,
      responsive: true,
      backend: 'MediaElement',
      // stretch horizontally so hidden-text spectrograms are readable
      // Aplicar magnificação
      minPxPerSec: 250 * zoomMagnification,
      plugins: [
        (RegionsPlugin as any).create({
          regions: [],
          dragSelection: {
            slop: 5,
          },
          color: 'rgba(255,255,0,0.12)'
        }),
      ],
    });

    wavesurfer.current = ws;
    ws.load(baseSrc);

    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const onReady = () => {
      setDuration(formatTime(ws.getDuration()));
      setBaseDuration(ws.getDuration());
    };
    const onProcess = () => {
      setCurrentTime(formatTime(ws.getCurrentTime()));
      // Atualizar posição do playhead
      const dur = ws.getDuration();
      if (dur) {
        setPlayheadPosition((ws.getCurrentTime() / dur) * 100);
      }
    };
    const onFinish = () => setIsPlaying(false);

    ws.on('ready', onReady);
    ws.on('audioprocess', onProcess);
    ws.on('finish', onFinish);

    // Listen for region-created events and add simple behavior
    try {
      ws.on && ws.on('region-created', (region: any) => {
        // when a region is created, make it loopable and give it subtle color
        try { region.loop = true; } catch (e) {}
      });
    } catch (e) { /* ignore */ }

    return () => {
      ws.un('ready', onReady);
      ws.un('audioprocess', onProcess);
      ws.un('finish', onFinish);
      try {
        const r = ws.destroy();
        if (r && typeof r.then === 'function') r.catch(() => {});
      } catch (e) {}
    };
  }, [baseSrc, zoomMagnification, audioExpanded]);

  // Render the hidden spectrogram as an overlay aligned to the base audio timeline.
  // Instead of creating a hidden WaveSurfer instance, decode the hidden audio to compute
  // overlay sizing/position and render the React `SpectrogramViewer` into the overlay container.
  useEffect(() => {
    const overlayContainer = overlaySpectrogramRef.current;
    const effectiveHiddenSrc = localHiddenSrc || hiddenSrc;
    if (!overlayContainer || !effectiveHiddenSrc || !baseDuration) return;

    let cancelled = false;
    (async () => {
      try {
        const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
        const resp = await fetch(effectiveHiddenSrc);
        const arrayBuf = await resp.arrayBuffer();
        const hiddenBuf = await ac.decodeAudioData(arrayBuf.slice(0));
        if (cancelled) return;
        const hiddenDur = hiddenBuf.duration || 0.001;

        const percent = Math.min(100, (hiddenDur / baseDuration) * 100);
        overlayContainer.style.position = 'absolute';
        overlayContainer.style.left = `${Math.max(0, (triggerLocal / baseDuration) * 100)}%`;
        overlayContainer.style.top = '0';
        overlayContainer.style.height = '150px';
        overlayContainer.style.pointerEvents = 'auto';
        overlayContainer.style.width = `${percent}%`;
        overlayContainer.style.overflow = 'hidden';
      } catch (e) {
        console.warn('Failed to size overlay spectrogram', e);
      }
    })();

    return () => { cancelled = true; };
  }, [hiddenSrc, localHiddenSrc, baseDuration, triggerTime, triggerLocal]);

  // reposition overlay when triggerLocal changes (e.g. by dragging)
  useEffect(() => {
    const el = overlaySpectrogramRef.current;
    if (!el || !baseDuration) return;
    el.style.left = `${Math.max(0, (triggerLocal / baseDuration) * 100)}%`;
    
    // Verificar sincronia harmônica (tolerância de 0.2 segundos)
    const targetTrigger = triggerTime || 0;
    const syncTolerance = 0.2;
    const synced = Math.abs(triggerLocal - targetTrigger) < syncTolerance;
    setIsSynced(synced);
  }, [triggerLocal, baseDuration, triggerTime]);

  // ✅ Unified cleanup: revoke URL AND destroy wavesurfer together
  useEffect(() => {
    return () => {
      if (prevLocalHiddenRef.current) {
        try { 
          URL.revokeObjectURL(prevLocalHiddenRef.current); 
        } catch (e) {
          console.warn('Failed to revoke URL:', e);
        }
        prevLocalHiddenRef.current = null;
      }
      try {
        const ws = wavesurfer.current;
        if (ws) {
          const r = ws.destroy();
          if (r && typeof r.then === 'function') r.catch(() => {});
        }
      } catch (e) { }
    };
  }, []);

  // apply opacity and highlight toggle to overlay container whenever they change
  useEffect(() => {
    const el = overlaySpectrogramRef.current;
    if (!el) return;
    try {
      el.style.opacity = String(overlayOpacity);
      if (overlayHighlight) el.classList.add('spectrogram-overlay-highlight');
      else el.classList.remove('spectrogram-overlay-highlight');
    } catch (e) {}
  }, [overlayOpacity, overlayHighlight]);

  // keep triggerLocal in sync when parent prop changes
  useEffect(() => {
    // don't override local value while the user is actively dragging the overlay
    if (dragState.current && dragState.current.dragging) return;
    setTriggerLocal(triggerTime || 0);
  }, [triggerTime]);

  const handlePlayPause = () => {
    const ws = wavesurfer.current;
    if (!ws) return;
    ws.playPause();

    // sync hidden: when base plays and current time is >= trigger, start hidden and seek relative
    const hidden = hiddenWavesurfer.current;
    if (hidden) {
      if (ws.isPlaying()) {
        const cur = ws.getCurrentTime();
        if (cur >= (triggerTime || 0)) {
          const hiddenDuration = hidden.getDuration() || 1;
          // compute ratio inside hidden track to seek to (cur - trigger)/hiddenDuration
          const rel = Math.max(0, Math.min(1, (cur - (triggerTime || 0)) / hiddenDuration));
          try { hidden.seekTo(rel); } catch (e) {}
          hidden.play();
        }
      } else {
        hidden.pause();
      }
    }

    setIsPlaying(ws.isPlaying());
  };

  // Handler para arrastar overlay com efeito ghosting
  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    const el = overlaySpectrogramRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper || !baseDuration) return;

    e.preventDefault();
    setIsGhosting(true);
    
    const rect = wrapper.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startLeftPercent = parseFloat(el.style.left || '0');
    const overlayWidthPercent = (elRect.width / rect.width) * 100;

    dragState.current = {
      dragging: true,
      startX,
      startLeftPercent,
      overlayPercent: overlayWidthPercent,
    };

    el.classList.add('grabbing');
    el.classList.add('ghosting');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.current?.dragging) return;
    const wrapper = wrapperRef.current;
    const el = overlaySpectrogramRef.current;
    if (!wrapper || !el || !baseDuration) return;

    const rect = wrapper.getBoundingClientRect();
    const deltaX = e.clientX - dragState.current.startX;
    const deltaPercent = (deltaX / rect.width) * 100;
    let newLeftPercent = dragState.current.startLeftPercent + deltaPercent;

    // Clamp dentro dos limites
    const maxLeft = 100 - dragState.current.overlayPercent;
    newLeftPercent = Math.max(0, Math.min(maxLeft, newLeftPercent));

    el.style.left = `${newLeftPercent}%`;
    
    // Converter para tempo
    const newTrigger = (newLeftPercent / 100) * baseDuration;
    setTriggerLocal(newTrigger);
    
    if (onTriggerChange) {
      onTriggerChange(newTrigger);
    }
  };

  const handleMouseUp = () => {
    if (!dragState.current?.dragging) return;
    
    const el = overlaySpectrogramRef.current;
    if (el) {
      el.classList.remove('grabbing');
      // Manter ghosting por mais um momento
      setTimeout(() => {
        el.classList.remove('ghosting');
        setIsGhosting(false);
      }, 400);
    }
    
    dragState.current = null;
  };

  // Registrar event listeners globais para drag
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [baseDuration]);

  return (
    <>
      {/* Backdrop Blur para Modo Cinema */}
      {audioExpanded && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          onClick={() => setAudioExpanded(false)}
          style={{ animation: 'fadeIn 0.3s ease-in-out' }}
        />
      )}

      <div className={`advanced-audio-lab-container ${audioExpanded ? 'expanded' : ''}`} data-integrity="critical" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      
      {/* ÁREA 1: CONTROLE DE FLUXO (HEADER) - Status da Transmissão */}
      <div className="audio-header-status">
        <div className="flex items-center gap-3">
          <div className="signal-led" data-active={isPlaying}></div>
          <span className="text-purple-400 font-bold text-xs tracking-wider">
            {audioExpanded ? 'ANALISADOR DE FREQUÊNCIAS OBSCURAS' : 'ÁUDIO'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="timestamp-digital">
            {currentTime} <span className="text-purple-400">//</span> {duration}
          </span>
          {isSynced && (
            <span className="text-emerald-400 text-[10px] font-bold animate-pulse">
              ⬢ FREQUÊNCIA ALINHADA
            </span>
          )}
        </div>
      </div>

      {/* ÁREA 2: MONITOR DE ONDAS (WAVEFORM) - Osciloscópio CRT */}
      <div className="waveform-housing" style={{ height: audioExpanded ? '120px' : '80px' }}>
        <div ref={waveformRef} id="main-oscillator" />
        {/* Scanner line vertical que percorre o waveform */}
        <div className="playhead-line" style={{ left: `${playheadPosition}%` }} />
      </div>

      {/* ÁREA 3: CÂMARA ESPECTRAL (Onde a mágica acontece) */}
      <div 
        ref={wrapperRef as any} 
        className={`spectral-chamber zoom-magnification-container`}
        data-zoom-level={zoomMagnification > 2 ? 'high' : 'normal'}
        style={{ 
          position: 'relative', 
          marginTop: '4px',
          height: audioExpanded ? '600px' : '350px', // Aumentado de 150px para 350px
          transition: 'height 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }}
      >
        {/* Fundo: O sinal base */}
        <div className="base-spectrogram">
          <ProfessionalSpectrogram audioUrl={baseSrc} width={800} />
        </div>

        {/* Overlay: O rastro da Entidade */}
        {(localHiddenSrc || hiddenSrc) && baseDuration && (
          <div 
            id="advanced-spectrogram-overlay" 
            ref={overlaySpectrogramRef}
            data-synced={isSynced}
            onMouseDown={handleOverlayMouseDown}
            style={{ 
              display: 'block',
              filter: overlayHighlight ? 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))' : 'none'
            }}
          >
            <div className="border-2 border-purple-500/40 rounded-xl overflow-hidden">
              <ProfessionalSpectrogram audioUrl={localHiddenSrc || hiddenSrc} width={800} />
            </div>
            {/* Handle visual para o jogador saber que pode arrastar */}
            <div className="drag-handle-vertical" />
          </div>
        )}

        {/* Ruído estático em modo cinema */}
        {audioExpanded && <div className="cinema-static-noise" />}
      </div>

      {/* ÁREA 4: PAINEL DE COMANDO TÁTICO (FOOTER) */}
      <div className="tactical-footer">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão Play/Pause */}
          <button onClick={handlePlayPause} className="btn-play-tactical">
            {isPlaying ? '[ CANCEL_SIG ]' : '[ EMIT_SIG ]'}
          </button>

          {/* Estação de Mensagem EVP */}
          <button 
            onClick={() => setShowTextTester(!showTextTester)} 
            className="btn-utility"
          >
            {showTextTester ? '[ FECHAR_EVP ]' : '[ ESTAÇÃO_MENSAGEM_EVP ]'}
          </button>

          {/* Modo Cinema */}
          <button 
            onClick={() => setAudioExpanded(!audioExpanded)} 
            className="btn-utility"
            style={{ 
              background: audioExpanded 
                ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(139, 92, 246, 0.2))' 
                : undefined 
            }}
          >
            {audioExpanded ? '[ CONTRAIR ]' : '[ MODO_CINEMA ]'}
          </button>

          {/* Zoom Region Button */}
          {hiddenSrc && (
            <button 
              onClick={() => {
                try {
                  const ws = wavesurfer.current as any;
                  if (!ws || !ws.regions) return;
                  const list = Object.values((ws.regions && ws.regions.list) || {}) as any[];
                  const region = list[0] as any;
                  if (!region) return;
                  try { if (typeof region.play === 'function') region.play(); else ws.play(region.start, region.end); } catch(e) { ws.play(region.start, region.end); }
                  try { ws.seekTo((region.start || 0) / (ws.getDuration() || 1)); } catch(e) {}
                } catch(e) { console.warn(e); }
              }}
              className="btn-utility text-xs"
            >
              🔍 ZOOM
            </button>
          )}
        </div>
      </div>

      {/* RACK DE POTENCIÔMETROS ANALÓGICOS */}
      {hiddenSrc && (
        <div className="knob-rack">
          {/* Controle de Opacidade do Segredo (Resonância da Membrana) */}
          <div className="knob-control">
            <label data-overload={overlayOpacity === 1}>
              {overlayOpacity === 1 ? 'OVERLOAD' : 'SPECTRAL_DENSITY'}
            </label>
            <input 
              type="range" 
              className="nexus-knob"
              min={0} 
              max={100} 
              value={Math.round(overlayOpacity * 100)} 
              onChange={e => setOverlayOpacity(Number(e.target.value) / 100)}
            />
            <span className="text-[10px] font-mono text-purple-400">
              {Math.round(overlayOpacity * 100)}%
            </span>
          </div>

          {/* Controle de Brilho do Espectro (Interferência) */}
          <div className="knob-control">
            <label>VOID_RESONANCE</label>
            <input 
              type="range" 
              className="nexus-knob"
              min={0} 
              max={100} 
              value={overlayHighlight ? 80 : 20}
              onChange={e => setOverlayHighlight(Number(e.target.value) > 50)}
            />
            <div className="status-light" data-on={overlayHighlight}></div>
          </div>

          {/* Gatilho de Sync (Trigger de tempo) */}
          <div className="knob-control">
            <label>TEMPORAL_OFFSET</label>
            <input 
              type="range" 
              className="nexus-knob"
              min={0} 
              max={baseDuration || 100} 
              step={0.01}
              value={triggerLocal}
              onChange={e => {
                const val = Number(e.target.value);
                setTriggerLocal(val);
                if (onTriggerChange) onTriggerChange(val);
              }}
            />
            <span className="text-[10px] font-mono text-cyan-400">
              {triggerLocal.toFixed(2)}s
            </span>
          </div>

          {/* Zoom Inteligente - Magnificação */}
          <div className="knob-control">
            <label>MAGNIFICAÇÃO</label>
            <input 
              type="range" 
              className="nexus-knob"
              min={1} 
              max={5} 
              step={0.5}
              value={zoomMagnification} 
              onChange={e => setZoomMagnification(Number(e.target.value))}
            />
            <span className="text-[9px] font-mono text-cyan-400">
              {zoomMagnification.toFixed(1)}x
            </span>
          </div>
        </div>
      )}

      {/* TEXT TESTER - Hidden Drawer */}
      {showTextTester && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-xl border border-cyan-500/30 overflow-hidden mt-3">
          <div className="bg-black/50 px-4 py-2 border-b border-cyan-500/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
            <h4 className="text-cyan-400 font-bold text-sm tracking-wide">GERADOR DE FANTASMAS</h4>
          </div>
          <div className="p-4">
            <SpectrogramCreator onGenerated={(wavBlob: Blob) => {
              try {
                if (prevLocalHiddenRef.current) {
                  URL.revokeObjectURL(prevLocalHiddenRef.current);
                  prevLocalHiddenRef.current = null;
                }
              } catch (e) {}
              const url = URL.createObjectURL(wavBlob);
              prevLocalHiddenRef.current = url;
              setLocalHiddenSrc(url);
              setShowTextTester(false);
            }} />
          </div>
        </div>
      )}
    </div>
    </>
  );
}
