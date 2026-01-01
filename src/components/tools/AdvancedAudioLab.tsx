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
      height: 100,
      responsive: true,
      backend: 'MediaElement',
      // stretch horizontally so hidden-text spectrograms are readable
      minPxPerSec: 250,
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
    const onProcess = () => setCurrentTime(formatTime(ws.getCurrentTime()));
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
  }, [baseSrc]);

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
  }, [triggerLocal, baseDuration]);

  // revoke any local hidden URL on unmount
  useEffect(() => {
    return () => {
      try { if (prevLocalHiddenRef.current) { URL.revokeObjectURL(prevLocalHiddenRef.current); prevLocalHiddenRef.current = null; } } catch (e) {}
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

  return (
    <div className="w-full space-y-3">
      {/* COMPACT HEADER WITH WAVEFORM */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-xl border border-purple-500/30 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-black/50 px-4 py-2 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
            <h3 className="text-purple-400 font-bold text-sm tracking-wide">ÁUDIO</h3>
          </div>
          <div className="text-[11px] font-mono text-gray-400">
            {currentTime} <span className="text-purple-400">/</span> {duration}
          </div>
        </div>

        {/* Waveform Compact */}
        <div className="px-3 py-2 bg-black/20">
          <div ref={waveformRef} className="rounded overflow-hidden border border-gray-700/50" />
        </div>

        {/* Controls Compact */}
        <div className="px-3 py-2 bg-black/20 border-t border-gray-700/50">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Play/Pause */}
            <button 
              onClick={handlePlayPause}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded shadow-lg transition-all"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Test Text */}
            <button 
              onClick={() => setShowTextTester(s => !s)}
              className={`px-3 py-1.5 ${showTextTester ? 'bg-cyan-600' : 'bg-gray-700'} hover:bg-cyan-500 text-white font-semibold rounded transition-all`}
            >
              {showTextTester ? '✓' : '🔤'} Texto
            </button>

            {hiddenSrc && (
              <>
                {/* Zoom Region */}
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
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded transition-all"
                >
                  🔍
                </button>

                {/* Opacity Slider */}
                <div className="flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded">
                  <label className="text-[10px] text-gray-300 font-semibold whitespace-nowrap">OVERLAY</label>
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    value={Math.round(overlayOpacity * 100)} 
                    onChange={e => setOverlayOpacity(Number(e.target.value) / 100)}
                    className="w-20 h-1 bg-gray-700 rounded appearance-none cursor-pointer accent-purple-500"
                  />
                  <span className="text-[10px] font-mono text-purple-400 min-w-[30px]">
                    {Math.round(overlayOpacity * 100)}%
                  </span>
                </div>

                {/* Highlight Toggle */}
                <label className="flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded cursor-pointer hover:bg-gray-700/50 transition-all">
                  <input 
                    type="checkbox" 
                    checked={overlayHighlight} 
                    onChange={e => setOverlayHighlight(e.target.checked)}
                    className="w-3 h-3 accent-purple-500"
                  />
                  <span className="text-[10px] text-gray-300 font-semibold whitespace-nowrap">GLOW</span>
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SPECTROGRAMS - DIRECTLY BELOW WITHOUT MUCH SPACING */}
      <div ref={wrapperRef as any} className="relative">
        {/* Base Spectrogram */}
        <ProfessionalSpectrogram audioUrl={baseSrc} />
        
        {/* Overlay Spectrogram */}
        { (localHiddenSrc || hiddenSrc) && baseDuration && (
          <div 
            id="advanced-spectrogram-overlay" 
            ref={overlaySpectrogramRef} 
            className="absolute top-0 left-0 transition-all duration-300"
            style={{ 
              display: 'block',
              filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))'
            }}
          >
            <div className="border-2 border-purple-500/40 rounded-xl overflow-hidden">
              <ProfessionalSpectrogram audioUrl={localHiddenSrc || hiddenSrc} />
            </div>
          </div>
        )}
      </div>

      {/* TEXT TESTER */}
      {showTextTester && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-xl border border-cyan-500/30 overflow-hidden">
          <div className="bg-black/50 px-4 py-2 border-b border-cyan-500/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
            <h4 className="text-cyan-400 font-bold text-sm tracking-wide">GERADOR DE TEXTO</h4>
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
  );
}
