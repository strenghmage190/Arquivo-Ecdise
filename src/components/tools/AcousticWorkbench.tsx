import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Radio,
  Sliders,
  BookOpen,
  Pin,
  Search,
  Volume2,
} from 'lucide-react';
import {
  analyzeAudioAnomalies,
  SAMPLE_RATE_48K,
} from '../../utils/audioStegoSynthesizer';
import { AudioAnomalyReport } from '../../types/forensicPillars';
import { useForensicDispatch } from '../../contexts/ForensicDispatchContext';
import { useCollaboration } from '../../contexts/CollaborationContext';
import { AcousticPinAnchor, CasePin, PIN_TAG_META } from '../../types/collaboration';
import PinListBar from '../collaboration/PinListBar';
import PinNoteComposer from '../collaboration/PinNoteComposer';
import './AcousticWorkbench.css';

export type ChannelRoute = 'mix' | 'left' | 'right' | 'diff';

interface AcousticWorkbenchProps {
  audioSrc: string;
  title?: string;
  cardId?: string;
  initialMetadata?: Record<string, any> | null;
}

const FFT_SIZE = 1024;
const HOP_SIZE = 256;

function colorMap(val: number, scheme: 'cyan' | 'hot' | 'magma'): [number, number, number] {
  const t = Math.max(0, Math.min(1, val / 255));
  if (t < 0.04) return [4, 7, 12];
  if (scheme === 'cyan') {
    return [0, Math.floor(t * 235), Math.floor(40 + t * 215)];
  }
  if (scheme === 'hot') {
    if (t < 0.4) return [Math.floor(t * 2.5 * 255), 0, 0];
    if (t < 0.75) return [255, Math.floor((t - 0.4) * 2.85 * 255), 0];
    return [255, 255, Math.floor((t - 0.75) * 4 * 255)];
  }
  return [
    Math.floor(Math.min(255, t * 320)),
    Math.floor(Math.max(0, (t - 0.35) * 300)),
    Math.floor(80 + Math.sin(t * Math.PI) * 175),
  ];
}

export default function AcousticWorkbench({
  audioSrc,
  title = 'Evidência Acústica',
  cardId,
}: AcousticWorkbenchProps) {
  const { openFieldManual, saveSnippetToBoard } = useForensicDispatch();
  const {
    investigationId,
    pinsByCardId,
    createPin,
    addFinding,
    pendingAnchorJump,
    clearAnchorJump,
  } = useCollaboration();

  const [pinMode, setPinMode] = useState(false);
  const [showPins, setShowPins] = useState(true);
  const [pendingPinAnchor, setPendingPinAnchor] = useState<AcousticPinAnchor | null>(null);
  const [cursorSec, setCursorSec] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const [sampleRate, setSampleRate] = useState(SAMPLE_RATE_48K);
  const [leftSamples, setLeftSamples] = useState<Float32Array | null>(null);
  const [rightSamples, setRightSamples] = useState<Float32Array | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [channelRoute, setChannelRoute] = useState<ChannelRoute>('mix');
  const [bandMinHz, setBandMinHz] = useState(0);
  const [bandMaxHz, setBandMaxHz] = useState(24000);
  const [contrastDb, setContrastDb] = useState(65);
  const [colorScheme, setColorScheme] = useState<'cyan' | 'hot' | 'magma'>('cyan');

  const [hpFreq, setHpFreq] = useState(20);
  const [lpFreq, setLpFreq] = useState(22000);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isReversed, setIsReversed] = useState(false);
  const [savingSnippet, setSavingSnippet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    const load = async () => {
      try {
        const res = await fetch(audioSrc);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const decoded = await ctx.decodeAudioData(arrayBuf);
        if (cancelled) return;
        setSampleRate(decoded.sampleRate);
        setBandMaxHz(Math.floor(decoded.sampleRate / 2));
        setLpFreq(Math.floor(decoded.sampleRate / 2));
        setLeftSamples(new Float32Array(decoded.getChannelData(0)));
        setRightSamples(
          decoded.numberOfChannels > 1
            ? new Float32Array(decoded.getChannelData(1))
            : null
        );
        setLoading(false);
      } catch {
        if (!cancelled) {
          setLoadError('Não foi possível decodificar o áudio para análise espectral.');
          setLoading(false);
        }
      }
    };
    load();

    return () => {
      cancelled = true;
      try {
        sourceNodeRef.current?.stop();
      } catch {}
      try {
        audioCtxRef.current?.close();
      } catch {}
    };
  }, [audioSrc]);

  const anomalyReport: AudioAnomalyReport | null = useMemo(() => {
    if (!leftSamples) return null;
    return analyzeAudioAnomalies(leftSamples, rightSamples, sampleRate);
  }, [leftSamples, rightSamples, sampleRate]);

  const hasAnomaly = Boolean(
    anomalyReport &&
      (anomalyReport.hasHighFreqEnergy ||
        anomalyReport.hasStereoAsymmetry ||
        anomalyReport.hasLsbPayload)
  );

  const activeSamples = useMemo(() => {
    if (!leftSamples) return null;
    const len = leftSamples.length;
    const out = new Float32Array(len);
    const hasR = Boolean(rightSamples && rightSamples.length === len);

    for (let i = 0; i < len; i++) {
      const idx = isReversed ? len - 1 - i : i;
      const l = leftSamples[idx];
      const r = hasR ? rightSamples![idx] : l;
      if (channelRoute === 'left') out[i] = l;
      else if (channelRoute === 'right') out[i] = r;
      else if (channelRoute === 'diff') out[i] = (l - r) * 0.5;
      else out[i] = (l + r) * 0.5;
    }
    return out;
  }, [leftSamples, rightSamples, channelRoute, isReversed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSamples || activeSamples.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const nyquist = sampleRate / 2;
    const clampedMin = Math.max(0, Math.min(nyquist - 500, bandMinHz));
    const clampedMax = Math.max(clampedMin + 500, Math.min(nyquist, bandMaxHz));

    const numFrames = Math.max(1, Math.floor((activeSamples.length - FFT_SIZE) / HOP_SIZE));
    const imgData = ctx.createImageData(width, height);
    const pixels = imgData.data;

    const hann = new Float32Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) {
      hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
    }

    const binMin = Math.floor((clampedMin / nyquist) * (FFT_SIZE / 2));
    const binMax = Math.max(binMin + 1, Math.floor((clampedMax / nyquist) * (FFT_SIZE / 2)));

    const re = new Float32Array(FFT_SIZE);
    const im = new Float32Array(FFT_SIZE);

    for (let x = 0; x < width; x++) {
      const frameIdx = Math.min(numFrames - 1, Math.floor((x / width) * numFrames));
      const start = frameIdx * HOP_SIZE;

      for (let i = 0; i < FFT_SIZE; i++) {
        re[i] = (activeSamples[start + i] || 0) * hann[i];
        im[i] = 0;
      }

      let j = 0;
      for (let i = 0; i < FFT_SIZE; i++) {
        if (i < j) {
          [re[i], re[j]] = [re[j], re[i]];
          [im[i], im[j]] = [im[j], im[i]];
        }
        let m = FFT_SIZE >> 1;
        while (m >= 1 && j >= m) {
          j -= m;
          m >>= 1;
        }
        j += m;
      }
      for (let len = 2; len <= FFT_SIZE; len <<= 1) {
        const half = len >> 1;
        const ang = (-2 * Math.PI) / len;
        const wRe = Math.cos(ang);
        const wIm = Math.sin(ang);
        for (let i = 0; i < FFT_SIZE; i += len) {
          let curRe = 1;
          let curIm = 0;
          for (let k = 0; k < half; k++) {
            const uRe = re[i + k];
            const uIm = im[i + k];
            const vRe = re[i + k + half] * curRe - im[i + k + half] * curIm;
            const vIm = re[i + k + half] * curIm + im[i + k + half] * curRe;
            re[i + k] = uRe + vRe;
            im[i + k] = uIm + vIm;
            re[i + k + half] = uRe - vRe;
            im[i + k + half] = uIm - vIm;
            const nextRe = curRe * wRe - curIm * wIm;
            curIm = curRe * wIm + curIm * wRe;
            curRe = nextRe;
          }
        }
      }

      for (let y = 0; y < height; y++) {
        const yNorm = 1 - y / Math.max(1, height - 1);
        const bin = Math.min(
          FFT_SIZE / 2 - 1,
          Math.floor(binMin + yNorm * (binMax - binMin))
        );
        const binFreq = (bin / (FFT_SIZE / 2)) * nyquist;
        const inBand = binFreq >= hpFreq && binFreq <= lpFreq;
        const mag = Math.sqrt(re[bin] * re[bin] + im[bin] * im[bin]) / (FFT_SIZE / 2);
        const filteredMag = inBand ? mag : mag * 0.04;
        const db = 20 * Math.log10(Math.max(1e-6, filteredMag));
        const normalized = Math.max(0, Math.min(255, ((db + contrastDb) / contrastDb) * 255));
        const [r, g, b] = colorMap(normalized, colorScheme);
        const pIdx = (y * width + x) * 4;
        pixels[pIdx] = r;
        pixels[pIdx + 1] = g;
        pixels[pIdx + 2] = b;
        pixels[pIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [activeSamples, sampleRate, bandMinHz, bandMaxHz, contrastDb, colorScheme, hpFreq, lpFreq]);

  const stopPlayback = useCallback(() => {
    try {
      sourceNodeRef.current?.stop();
    } catch {}
    sourceNodeRef.current = null;
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    if (!activeSamples || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const buf = ctx.createBuffer(1, activeSamples.length, sampleRate);
    buf.getChannelData(0).set(activeSamples);

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = playbackRate;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = Math.max(20, hpFreq);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(sampleRate * 0.48, lpFreq);

    src.connect(hp);
    hp.connect(lp);
    lp.connect(ctx.destination);

    src.onended = () => {
      setIsPlaying(false);
      sourceNodeRef.current = null;
    };

    sourceNodeRef.current = src;
    const offset = Math.max(0, Math.min(cursorSec, Math.max(0, buf.duration - 0.05)));
    src.start(0, offset);
    setIsPlaying(true);
  }, [isPlaying, stopPlayback, activeSamples, sampleRate, playbackRate, hpFreq, lpFreq, cursorSec]);

  const durationSec = activeSamples ? activeSamples.length / sampleRate : 0;

  const acousticPins = useMemo(() => {
    if (!cardId) return [];
    return (pinsByCardId[cardId] || []).filter((p) => p.tool_type === 'acoustic');
  }, [pinsByCardId, cardId]);

  const applyPinState = useCallback(
    (anchor: AcousticPinAnchor) => {
      if (anchor.channel) setChannelRoute(anchor.channel);
      if (typeof anchor.bandMinHz === 'number') setBandMinHz(anchor.bandMinHz);
      if (typeof anchor.bandMaxHz === 'number') setBandMaxHz(anchor.bandMaxHz);
      if (typeof anchor.timeSec === 'number') setCursorSec(anchor.timeSec);
    },
    []
  );

  useEffect(() => {
    if (!pendingAnchorJump || !cardId) return;
    if (pendingAnchorJump.cardId === cardId && pendingAnchorJump.toolType === 'acoustic') {
      applyPinState(pendingAnchorJump.anchorData as AcousticPinAnchor);
      clearAnchorJump();
    }
  }, [pendingAnchorJump, cardId, applyPinState, clearAnchorJump]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || durationSec <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const xNorm = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const yNorm = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / Math.max(1, rect.height)));
    const timeSec = Number((xNorm * durationSec).toFixed(2));
    const freqHz = Math.round(bandMinHz + yNorm * (bandMaxHz - bandMinHz));
    setCursorSec(timeSec);

    if (pinMode || e.altKey) {
      setPendingPinAnchor({
        timeSec,
        freqHz,
        channel: channelRoute,
        bandMinHz,
        bandMaxHz,
      });
      setPinMode(false);
    }
  };

  const handleSaveSnippet = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSavingSnippet(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob) {
        await saveSnippetToBoard({
          title: `Espectrograma: ${title} (${channelRoute.toUpperCase()})`,
          description: `Recorte extraído na faixa ${bandMinHz} Hz – ${bandMaxHz} Hz.`,
          imageBlob: blob,
          sourceCardId: cardId,
        });
      }
    } finally {
      setSavingSnippet(false);
    }
  };

  const nyquist = Math.floor(sampleRate / 2);

  return (
    <div className="aw-workbench">
      <div className="aw-header">
        <div className="aw-title-group">
          <Radio size={16} />
          <div>
            <h3>BANCADA ACÚSTICA FORENSE</h3>
            <span>{title} • {Math.round(sampleRate / 1000)} kHz</span>
          </div>
        </div>

        <div className="aw-header-actions">
          <div
            className={`aw-anomaly-led ${hasAnomaly ? 'alert' : ''}`}
            title={
              hasAnomaly
                ? 'Energia incomum ou assimetria estéreo detectada no sinal'
                : 'Nenhuma anomalia espectral óbvia detectada'
            }
          >
            <span className="aw-led-dot" />
            <span>{hasAnomaly ? 'ANOMALIA DE SINAL' : 'SINAL ESTÁVEL'}</span>
          </div>

          <button
            type="button"
            className="aw-btn-ghost"
            onClick={() => openFieldManual('audio')}
            title="Abrir Manual de Campo da Ordo"
          >
            <BookOpen size={14} /> Manual
          </button>

          {cardId && investigationId && (
            <button
              type="button"
              className={`aw-btn-ghost ${pinMode ? 'active' : ''}`}
              style={pinMode ? { borderColor: '#f59e0b', color: '#fbbf24' } : undefined}
              onClick={() => setPinMode((m) => !m)}
              title="Clique no espectrograma para cravar um marcador persistente"
            >
              <Pin size={14} /> {pinMode ? 'Clique no Gráfico...' : 'Marcar Ponto'}
            </button>
          )}

          <button
            type="button"
            className="aw-btn-primary"
            onClick={handleSaveSnippet}
            disabled={savingSnippet || loading}
          >
            <Pin size={14} /> {savingSnippet ? 'Salvando...' : 'Salvar Recorte no Mural'}
          </button>
        </div>
      </div>

      <div className="aw-spectrum-box" style={{ position: 'relative' }}>
        {loading && <div className="aw-overlay-msg">Decodificando forma de onda...</div>}
        {loadError && <div className="aw-overlay-msg error">{loadError}</div>}
        <canvas
          ref={canvasRef}
          width={760}
          height={240}
          className="aw-canvas"
          style={{ cursor: pinMode ? 'crosshair' : 'pointer' }}
          onClick={handleCanvasClick}
        />
        {durationSec > 0 && cursorSec > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${Math.min(100, Math.max(0, (cursorSec / durationSec) * 100))}%`,
              width: 2,
              background: '#38bdf8',
              pointerEvents: 'none',
            }}
          />
        )}
        {showPins &&
          durationSec > 0 &&
          acousticPins
            .filter((p) => !p.is_resolved)
            .map((pin) => {
              const anchor = pin.anchor_data as AcousticPinAnchor;
              const leftPct = Math.min(99, Math.max(1, ((anchor.timeSec || 0) / durationSec) * 100));
              const tagMeta = PIN_TAG_META[pin.tag] || PIN_TAG_META.look_here;
              return (
                <button
                  key={pin.id}
                  type="button"
                  title={`${pin.author_name}: ${pin.note}`}
                  onClick={() => applyPinState(anchor)}
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: `${leftPct}%`,
                    transform: 'translateX(-50%)',
                    background: tagMeta.color,
                    color: '#090d16',
                    border: 'none',
                    borderRadius: 999,
                    width: 20,
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    zIndex: 5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  <Pin size={12} />
                </button>
              );
            })}
        <div className="aw-freq-axis">
          <span>{bandMaxHz} Hz</span>
          <span>{Math.round((bandMinHz + bandMaxHz) / 2)} Hz</span>
          <span>{bandMinHz} Hz</span>
        </div>
      </div>

      {pendingPinAnchor && cardId && (
        <PinNoteComposer
          title="Marcar Ponto no Espectrograma"
          subtitle={`${pendingPinAnchor.timeSec.toFixed(1)}s • ${pendingPinAnchor.freqHz || 0} Hz • Canal ${pendingPinAnchor.channel.toUpperCase()}`}
          onSubmitPin={async (tag, note) => {
            await createPin({
              cardId,
              toolType: 'acoustic',
              anchorData: pendingPinAnchor,
              tag,
              note,
            });
          }}
          onSubmitFinding={async (category, label, details) => {
            await addFinding({
              category,
              label,
              details,
              sourceCardId: cardId,
              sourceTool: 'acoustic',
              sourceAnchor: pendingPinAnchor,
            });
          }}
          onCancel={() => setPendingPinAnchor(null)}
        />
      )}

      {cardId && investigationId && (
        <PinListBar
          pins={acousticPins}
          showPins={showPins}
          onToggleShowPins={() => setShowPins((s) => !s)}
          onSelectPin={(pin: CasePin) => applyPinState(pin.anchor_data as AcousticPinAnchor)}
          renderAnchorSummary={(pin) => {
            const a = pin.anchor_data as AcousticPinAnchor;
            return `${(a.timeSec ?? 0).toFixed(1)}s (${(a.channel || 'mix').toUpperCase()})`;
          }}
        />
      )}

      <div className="aw-rack">
        <div className="aw-rack-card">
          <div className="aw-rack-label">
            <Search size={13} /> 1. LUPA DE BANDA VERTICAL
          </div>
          <div className="aw-preset-row">
            <button
              type="button"
              className={bandMinHz === 0 && bandMaxHz >= nyquist - 500 ? 'active' : ''}
              onClick={() => { setBandMinHz(0); setBandMaxHz(nyquist); }}
            >
              Completa
            </button>
            <button
              type="button"
              className={bandMinHz >= 16500 ? 'active' : ''}
              onClick={() => { setBandMinHz(16800); setBandMaxHz(Math.min(20500, nyquist)); }}
            >
              Zona Fantasma (16.8k+)
            </button>
            <button
              type="button"
              className={bandMinHz === 300 && bandMaxHz === 4500 ? 'active' : ''}
              onClick={() => { setBandMinHz(300); setBandMaxHz(4500); }}
            >
              Voz (300–4.5k)
            </button>
          </div>
          <label className="aw-slider-row">
            <span>Base: {bandMinHz} Hz</span>
            <input
              type="range"
              min={0}
              max={Math.max(1000, nyquist - 1000)}
              step={250}
              value={bandMinHz}
              onChange={(e) => setBandMinHz(Math.min(Number(e.target.value), bandMaxHz - 500))}
            />
          </label>
          <label className="aw-slider-row">
            <span>Teto: {bandMaxHz} Hz</span>
            <input
              type="range"
              min={1000}
              max={nyquist}
              step={250}
              value={bandMaxHz}
              onChange={(e) => setBandMaxHz(Math.max(Number(e.target.value), bandMinHz + 500))}
            />
          </label>
          <label className="aw-slider-row">
            <span>Contraste: {contrastDb} dB</span>
            <input
              type="range"
              min={25}
              max={110}
              value={contrastDb}
              onChange={(e) => setContrastDb(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="aw-rack-card">
          <div className="aw-rack-label">
            <Volume2 size={13} /> 2. SELETOR DE CANAIS
          </div>
          <div className="aw-channel-grid">
            {(
              [
                { id: 'mix', label: 'Mix Normal' },
                { id: 'left', label: 'Esquerdo (L)' },
                { id: 'right', label: 'Direito (R)' },
                { id: 'diff', label: 'Diferença (L − R)' },
              ] as { id: ChannelRoute; label: string }[]
            ).map((ch) => (
              <button
                key={ch.id}
                type="button"
                className={channelRoute === ch.id ? 'active' : ''}
                onClick={() => setChannelRoute(ch.id)}
              >
                {ch.label}
              </button>
            ))}
          </div>
          <div className="aw-scheme-row">
            <span>Paleta:</span>
            {(['cyan', 'hot', 'magma'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={colorScheme === s ? 'active' : ''}
                onClick={() => setColorScheme(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="aw-rack-card">
          <div className="aw-rack-label">
            <Sliders size={13} /> 3 &amp; 4. FILTRO E REPRODUÇÃO
          </div>
          <label className="aw-slider-row">
            <span>Corte Graves (HP): {hpFreq} Hz</span>
            <input
              type="range"
              min={20}
              max={15000}
              step={100}
              value={hpFreq}
              onChange={(e) => setHpFreq(Number(e.target.value))}
            />
          </label>
          <label className="aw-slider-row">
            <span>Corte Agudos (LP): {lpFreq} Hz</span>
            <input
              type="range"
              min={500}
              max={nyquist}
              step={250}
              value={lpFreq}
              onChange={(e) => setLpFreq(Number(e.target.value))}
            />
          </label>
          <label className="aw-slider-row">
            <span>Velocidade: {playbackRate.toFixed(2)}x</span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
            />
          </label>
          <div className="aw-transport">
            <button type="button" className="aw-play-btn" onClick={togglePlay} disabled={loading}>
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              {isPlaying ? 'Pausar' : 'Ouvir Sinal'}
            </button>
            <button
              type="button"
              className={`aw-rev-btn ${isReversed ? 'active' : ''}`}
              onClick={() => setIsReversed((r) => !r)}
            >
              <RotateCcw size={14} /> Reverso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
