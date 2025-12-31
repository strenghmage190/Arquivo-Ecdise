import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import './AdvancedAudioLab.css';

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
  const baseSpectrogramRef = useRef<HTMLDivElement | null>(null);
  const overlaySpectrogramRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wavesurfer = useRef<any | null>(null);
  const hiddenWavesurfer = useRef<any | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlaySpectrogram, setShowOverlaySpectrogram] = useState(true);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [baseDuration, setBaseDuration] = useState<number | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(1);
  const [overlayHighlight, setOverlayHighlight] = useState<boolean>(true);
  const [triggerLocal, setTriggerLocal] = useState<number>(triggerTime || 0);
  const dragState = useRef<{ dragging: boolean; startX: number; startLeftPercent: number; overlayPercent: number } | null>(null);

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
      plugins: [
        (SpectrogramPlugin as any).create({
          container: baseSpectrogramRef.current,
          labels: false,
        }),
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
  useEffect(() => {
    // cleanup existing
    if (hiddenWavesurfer.current) {
      try { hiddenWavesurfer.current.destroy(); } catch (e) {}
      hiddenWavesurfer.current = null;
    }
    const overlayContainer = overlaySpectrogramRef.current;
    if (!overlayContainer || !hiddenSrc || !baseDuration) return;

    let cancelled = false;
    (async () => {
      try {
        // fetch and decode hidden audio duration to size the overlay correctly
        const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
        const resp = await fetch(hiddenSrc);
        const arrayBuf = await resp.arrayBuffer();
        const hiddenBuf = await ac.decodeAudioData(arrayBuf.slice(0));
        if (cancelled) return;
        const hiddenDur = hiddenBuf.duration || 0.001;

        // compute overlay width as percentage of base timeline
        const percent = Math.min(100, (hiddenDur / baseDuration) * 100);
        overlayContainer.style.position = 'absolute';
        overlayContainer.style.left = `${Math.max(0, (triggerLocal / baseDuration) * 100)}%`;
        overlayContainer.style.top = '0';
        overlayContainer.style.height = '150px';
        overlayContainer.style.pointerEvents = 'auto';
        overlayContainer.style.width = `${percent}%`;
        overlayContainer.style.overflow = 'hidden';

        // create hidden wavesurfer instance that draws into the overlay container
        const wsHidden = (WaveSurfer as any).create({
          container: overlayContainer,
          height: 150,
          responsive: true,
          backend: 'MediaElement',
          plugins: [
            (SpectrogramPlugin as any).create({
              container: overlayContainer,
              labels: false,
            }),
          ],
        });
        hiddenWavesurfer.current = wsHidden;
        wsHidden.load(hiddenSrc);
        wsHidden.setVolume(0);
      } catch (e) {
        console.warn('Failed to build overlay spectrogram', e);
      }
    })();

    return () => { cancelled = true; };
  }, [hiddenSrc, baseDuration, triggerTime]);

  // reposition overlay when triggerLocal changes (e.g. by dragging)
  useEffect(() => {
    const el = overlaySpectrogramRef.current;
    if (!el || !baseDuration) return;
    el.style.left = `${Math.max(0, (triggerLocal / baseDuration) * 100)}%`;
  }, [triggerLocal, baseDuration]);

  // Drag handlers for overlay: enable pointer events on overlay container and allow horizontal dragging
  useEffect(() => {
    const el = overlaySpectrogramRef.current;
    const baseEl = baseSpectrogramRef.current;
    if (!el || !baseEl) return;

    el.style.pointerEvents = 'auto';
    el.style.cursor = 'grab';

    let dragging = false;
    let startX = 0;
    let startLeftPercent = 0;
    let overlayPercent = 0;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      const baseRect = baseEl.getBoundingClientRect();
      const left = el.getBoundingClientRect().left - baseRect.left;
      startLeftPercent = (left / baseRect.width) * 100;
      overlayPercent = (el.getBoundingClientRect().width / baseRect.width) * 100;
      el.setPointerCapture?.((e as any).pointerId);
      el.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const baseRect = baseEl.getBoundingClientRect();
      const deltaPx = e.clientX - startX;
      const deltaPercent = (deltaPx / baseRect.width) * 100;
      let newLeft = startLeftPercent + deltaPercent;
      newLeft = Math.max(0, Math.min(newLeft, 100 - overlayPercent));
      el.style.left = `${newLeft}%`;
      const newTrigger = (newLeft / 100) * (baseDuration || 0);
      setTriggerLocal(newTrigger);
      if (typeof onTriggerChange === 'function') onTriggerChange(newTrigger);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = 'grab';
      try { el.releasePointerCapture?.((e as any).pointerId); } catch (e) {}
      const baseRect = baseEl.getBoundingClientRect();
      const left = el.getBoundingClientRect().left - baseRect.left;
      const leftPercent = (left / baseRect.width) * 100;
      const finalTrigger = (leftPercent / 100) * (baseDuration || 0);
      setTriggerLocal(finalTrigger);
      if (typeof onTriggerChange === 'function') onTriggerChange(finalTrigger);
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [baseDuration, onTriggerChange]);


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
    <div className="advanced-audio-root">
      <div id="advanced-waveform" ref={waveformRef} />

      {/* Spectrogram area: base spectrogram (full width) and optional overlay */}
      <div ref={wrapperRef as any} style={{ position: 'relative', marginTop: 12 }}>
        <div id="advanced-spectrogram-base" ref={baseSpectrogramRef} style={{ width: '100%' }} />
        {hiddenSrc && (
          <div id="advanced-spectrogram-overlay" ref={overlaySpectrogramRef} style={{ display: showOverlaySpectrogram ? 'block' : 'none', position: 'absolute', top: 0, left: 0 }} />
        )}
      </div>

      <div className="advanced-controls">
        <button onClick={handlePlayPause} className="adv-btn">{isPlaying ? 'PAUSE' : 'PLAY'}</button>

        {hiddenSrc && (
          <>
            <button onClick={() => setShowOverlaySpectrogram(v => !v)} className="adv-btn toggle">{showOverlaySpectrogram ? 'OCULTAR CAMADA OCULTA' : 'MOSTRAR CAMADA OCULTA'}</button>
            <button onClick={() => {
                try {
                  const ws = wavesurfer.current;
                  if (!ws || !ws.regions) return;
                  const list = Object.values(ws.regions.list || {});
                  const region = list[0];
                  if (!region) return;
                  // play region (looping was enabled on create)
                  try { region.play(); } catch(e) { ws.play(region.start, region.end); }
                  // seek to region start to center
                  try { ws.seekTo(region.start / (ws.getDuration() || 1)); } catch(e) {}
                } catch(e) { console.warn(e); }
            }} className="adv-btn">🔍 Zoom na Seleção</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, color: '#ccc' }}>
              Opacidade
              <input type="range" min={0} max={100} value={Math.round(overlayOpacity * 100)} onChange={e => setOverlayOpacity(Number(e.target.value) / 100)} />
              <span style={{ fontFamily: 'monospace', color: '#00ffaa' }}>{Math.round(overlayOpacity * 100)}%</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 12, color: '#ccc' }}>
              <input type="checkbox" checked={overlayHighlight} onChange={e => setOverlayHighlight(e.target.checked)} /> Destaque
            </label>
          </>
        )}

        <div className="adv-time">{currentTime} / {duration}</div>
      </div>
    </div>
  );
}
