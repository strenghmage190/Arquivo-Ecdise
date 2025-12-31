import React, { useEffect, useRef, useState } from 'react';
import './WaveformPlayer.css';
// wavesurfer types may not be installed; cast to any to avoid TS errors until the package is added
import WaveSurfer from 'wavesurfer.js';

interface Props {
  src: string;
}

const formWaveSurferOptions = (ref: HTMLDivElement) => ({
  container: ref,
  waveColor: '#666',
  progressColor: '#00ffaa',
  cursorColor: '#ff0000',
  barWidth: 3,
  barRadius: 2,
  responsive: true,
  height: 120,
  normalize: true,
  partialRender: true,
  backend: 'MediaElement',
});

export default function WaveformPlayer({ src }: Props) {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurfer = useRef<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [zoom, setZoom] = useState(50);

  useEffect(() => {
    if (!waveformRef.current) return;

    if (wavesurfer.current) {
      wavesurfer.current.destroy();
      wavesurfer.current = null;
    }

    const options = formWaveSurferOptions(waveformRef.current);
    const ws = (WaveSurfer as any).create(options);
    wavesurfer.current = ws;

    ws.load(src);

    const formatTime = (secs: number) => {
      const minutes = Math.floor(secs / 60);
      const seconds = Math.floor(secs % 60);
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const onReady = () => setDuration(formatTime(ws.getDuration()));
    const onProcess = () => setCurrentTime(formatTime(ws.getCurrentTime()));
    const onFinish = () => setIsPlaying(false);

    ws.on('ready', onReady);
    ws.on('audioprocess', onProcess);
    ws.on('finish', onFinish);

    return () => {
      ws.un('ready', onReady);
      ws.un('audioprocess', onProcess);
      ws.un('finish', onFinish);
      ws.destroy();
    };
  }, [src]);

  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.zoom(zoom);
    }
  }, [zoom]);

  const handlePlayPause = () => {
    const ws = wavesurfer.current;
    if (!ws) return;
    ws.playPause();
    setIsPlaying(ws.isPlaying());
  };

  return (
    <div className="waveform-player-root">
      <div id="waveform" ref={waveformRef} className="waveform-canvas" />

      <div className="waveform-controls">
        <button onClick={handlePlayPause} className="wave-btn">{isPlaying ? 'PAUSE' : 'PLAY'}</button>

        <div className="wave-zoom">
          <span className="zoom-label">ZOOM</span>
          <input type="range" min={1} max={200} value={zoom} onChange={e => setZoom(Number(e.target.value))} />
        </div>

        <div className="wave-time">{currentTime} / {duration}</div>
      </div>
    </div>
  );
}
