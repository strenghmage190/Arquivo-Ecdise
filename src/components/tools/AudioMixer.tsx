import React, { useEffect, useRef, useState } from 'react';
import AudioForge from './AudioForge';
import './AudioMixer.css';

interface Props {
  baseAudioFile?: File;
  onClose: () => void;
  onSave: (mixedFile: File, triggerTime: number) => void;
}

export default function AudioMixer({ baseAudioFile, onClose, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  // Audio effects
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [reverb, setReverb] = useState(0);
  const [echo, setEcho] = useState(0);
  const [distortion, setDistortion] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [normalize, setNormalize] = useState(false);
  const [showForge, setShowForge] = useState(false);

  // Selection
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);

  // Load audio file
  useEffect(() => {
    if (!baseAudioFile) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        setAudioBuffer(buffer);
        setDuration(buffer.duration);
        setSelectionEnd(buffer.duration);
        drawWaveform(buffer);
      } catch (err) {
        console.error('Failed to decode audio', err);
      }
    };
    reader.readAsArrayBuffer(baseAudioFile);

    return () => {
      ctx.close();
    };
  }, [baseAudioFile]);

  // Draw waveform
  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);

    ctx.fillStyle = '#0a0e15';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const index = i * step + j;
        if (index < channelData.length) {
          const datum = channelData[index];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
      }

      const y1 = ((1 + min) * height) / 2;
      const y2 = ((1 + max) * height) / 2;

      if (i === 0) {
        ctx.moveTo(i, y1);
      }
      ctx.lineTo(i, y1);
      ctx.lineTo(i, y2);
    }

    ctx.stroke();

    // Draw selection
    if (selectionStart !== selectionEnd) {
      const startX = (selectionStart / buffer.duration) * width;
      const endX = (selectionEnd / buffer.duration) * width;
      
      ctx.fillStyle = 'rgba(0,243,255,0.2)';
      ctx.fillRect(startX, 0, endX - startX, height);
      
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();
    }

    // Draw playhead
    const playheadX = (currentTime / buffer.duration) * width;
    ctx.strokeStyle = '#ff003c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  };

  // Update waveform when selection or playhead changes
  useEffect(() => {
    if (audioBuffer) {
      drawWaveform(audioBuffer);
    }
  }, [selectionStart, selectionEnd, currentTime]);

  // Play/Pause
  const togglePlayPause = () => {
    if (!audioContext || !audioBuffer) return;

    if (isPlaying) {
      sourceRef.current?.stop();
      pauseTimeRef.current = currentTime;
      setIsPlaying(false);
    } else {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      source.playbackRate.value = speed;
      
      const startOffset = pauseTimeRef.current || 0;
      source.start(0, startOffset);
      
      sourceRef.current = source;
      startTimeRef.current = audioContext.currentTime - startOffset;
      setIsPlaying(true);

      source.onended = () => {
        setIsPlaying(false);
        pauseTimeRef.current = 0;
        setCurrentTime(0);
      };
    }
  };

  // Update playhead position
  useEffect(() => {
    if (!isPlaying || !audioContext) return;

    const interval = setInterval(() => {
      const elapsed = audioContext.currentTime - startTimeRef.current;
      setCurrentTime(elapsed);
      
      if (elapsed >= duration) {
        setIsPlaying(false);
        setCurrentTime(0);
        pauseTimeRef.current = 0;
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, audioContext, duration]);

  // Canvas mouse events for selection
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / canvas.width) * audioBuffer.duration;
    
    setSelectionStart(time);
    setSelectionEnd(time);
    setIsSelecting(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelecting || !audioBuffer) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min((x / canvas.width) * audioBuffer.duration, audioBuffer.duration));
    
    setSelectionEnd(time);
  };

  const handleCanvasMouseUp = () => {
    setIsSelecting(false);
  };

  // Apply effects and export
  const handleSave = async () => {
    if (!audioContext || !audioBuffer) {
      alert('Nenhum áudio carregado');
      return;
    }

    try {
      let processedBuffer = audioBuffer;

      // Apply reverse
      if (reverse) {
        processedBuffer = reverseBuffer(processedBuffer);
      }

      // Apply normalization
      if (normalize) {
        processedBuffer = normalizeBuffer(processedBuffer);
      }

      // Create offline context for rendering
      const offlineContext = new OfflineAudioContext(
        processedBuffer.numberOfChannels,
        processedBuffer.length,
        processedBuffer.sampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = processedBuffer;
      source.playbackRate.value = speed;

      // Volume
      const gainNode = offlineContext.createGain();
      gainNode.gain.value = volume;

      // Apply fade in/out
      if (fadeIn > 0) {
        gainNode.gain.setValueAtTime(0, 0);
        gainNode.gain.linearRampToValueAtTime(volume, fadeIn);
      }
      
      if (fadeOut > 0) {
        const startFadeOut = processedBuffer.duration - fadeOut;
        gainNode.gain.setValueAtTime(volume, startFadeOut);
        gainNode.gain.linearRampToValueAtTime(0, processedBuffer.duration);
      }

      source.connect(gainNode);
      gainNode.connect(offlineContext.destination);
      
      source.start(0);
      const renderedBuffer = await offlineContext.startRendering();

      // Convert to WAV
      const wav = bufferToWave(renderedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const file = new File([blob], `processed_${baseAudioFile?.name || 'audio.wav'}`, { type: 'audio/wav' });
      
      onSave(file, 0);
    } catch (err) {
      console.error('Failed to process audio', err);
      alert('Erro ao processar áudio');
    }
  };

  // Helper: Reverse audio buffer
  const reverseBuffer = (buffer: AudioBuffer): AudioBuffer => {
    const reversed = audioContext!.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const reversedData = reversed.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        reversedData[i] = channelData[channelData.length - 1 - i];
      }
    }

    return reversed;
  };

  // Helper: Normalize audio buffer
  const normalizeBuffer = (buffer: AudioBuffer): AudioBuffer => {
    const normalized = audioContext!.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const normalizedData = normalized.getChannelData(channel);
      
      // Find peak
      let peak = 0;
      for (let i = 0; i < channelData.length; i++) {
        peak = Math.max(peak, Math.abs(channelData[i]));
      }
      
      // Normalize
      const factor = peak > 0 ? 1 / peak : 1;
      for (let i = 0; i < channelData.length; i++) {
        normalizedData[i] = channelData[i] * factor;
      }
    }

    return normalized;
  };

  // Helper: Convert AudioBuffer to WAV
  const bufferToWave = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * buffer.numberOfChannels * 2);
    setUint16(buffer.numberOfChannels * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    // Write audio data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = channels[i][offset];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-mixer-overlay" onClick={onClose}>
      <div className="audio-mixer-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="mixer-header">
          <div className="header-content">
            <div className="status-indicator-mixer"></div>
            <h2 className="mixer-title">🎛️ ESTAÇÃO DE MIXAGEM PROFISSIONAL</h2>
          </div>
          <div className="header-actions">
            <button className="btn-transport forge" onClick={() => setShowForge((v) => !v)}>
              {showForge ? 'Fechar Audio Forge' : 'Abrir Audio Forge'}
            </button>
            <button className="btn-close-mixer" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Waveform Display */}
        <div className="waveform-section">
          <div className="waveform-header">
            <div className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</div>
            <div className="file-name">{baseAudioFile?.name || 'Sem arquivo'}</div>
          </div>
          
          <canvas 
            ref={canvasRef}
            width={1200}
            height={160}
            className="waveform-canvas"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />

          <div className="transport-controls">
            <button className="btn-transport" onClick={() => { setCurrentTime(0); pauseTimeRef.current = 0; }}>
              ⏮ Início
            </button>
            <button className="btn-transport play" onClick={togglePlayPause}>
              {isPlaying ? '⏸ Pausar' : '▶ Play'}
            </button>
            <button className="btn-transport" onClick={() => { setCurrentTime(duration); pauseTimeRef.current = duration; }}>
              ⏭ Fim
            </button>
          </div>
        </div>

        {/* Effects Panel */}
        <div className="effects-panel">
          <div className="effects-grid">
            
            {/* Volume */}
            <div className="effect-group">
              <label className="effect-label">
                🔊 VOLUME
                <span className="effect-value">{Math.round(volume * 100)}%</span>
              </label>
              <input 
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="effect-slider"
              />
            </div>

            {/* Speed */}
            <div className="effect-group">
              <label className="effect-label">
                ⚡ VELOCIDADE
                <span className="effect-value">{speed.toFixed(2)}x</span>
              </label>
              <input 
                type="range"
                min={0.25}
                max={4}
                step={0.05}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="effect-slider"
              />
            </div>

            {/* Fade In */}
            <div className="effect-group">
              <label className="effect-label">
                📈 FADE IN
                <span className="effect-value">{fadeIn.toFixed(1)}s</span>
              </label>
              <input 
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={fadeIn}
                onChange={(e) => setFadeIn(Number(e.target.value))}
                className="effect-slider"
              />
            </div>

            {/* Fade Out */}
            <div className="effect-group">
              <label className="effect-label">
                📉 FADE OUT
                <span className="effect-value">{fadeOut.toFixed(1)}s</span>
              </label>
              <input 
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={fadeOut}
                onChange={(e) => setFadeOut(Number(e.target.value))}
                className="effect-slider"
              />
            </div>

          </div>

          {/* Toggle Effects */}
          <div className="toggle-effects">
            <button 
              className={`btn-toggle ${reverse ? 'active' : ''}`}
              onClick={() => setReverse(!reverse)}
            >
              🔄 REVERSO
            </button>
            <button 
              className={`btn-toggle ${normalize ? 'active' : ''}`}
              onClick={() => setNormalize(!normalize)}
            >
              📊 NORMALIZAR
            </button>
          </div>

          {showForge && (
            <div className="audio-forge-panel">
              <div className="audio-forge-header">
                <div>
                  <div className="forge-title">Audio Forge (Beta)</div>
                  <div className="forge-subtitle">Refine, cortar e exportar como nova camada</div>
                </div>
                <button className="btn-transport" onClick={() => setShowForge(false)}>Fechar</button>
              </div>
              <AudioForge
                spectrogramUrl={undefined}
                triggerTime={selectionStart}
                onClose={() => setShowForge(false)}
                onSave={(file) => {
                  onSave(file, selectionStart || 0);
                  setShowForge(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Selection Info */}
        {selectionStart !== selectionEnd && (
          <div className="selection-info">
            <span>📍 Seleção: {formatTime(Math.min(selectionStart, selectionEnd))} → {formatTime(Math.max(selectionStart, selectionEnd))}</span>
            <span>Duração: {formatTime(Math.abs(selectionEnd - selectionStart))}</span>
          </div>
        )}

        {/* Footer */}
        <div className="mixer-footer">
          <button className="btn-cancel-mixer" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-save-mixer" onClick={handleSave}>
            💾 Exportar Áudio Processado
          </button>
        </div>

      </div>
    </div>
  );
}
