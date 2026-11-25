import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Radio, Save, Play, Square, Upload, Sparkles } from 'lucide-react';
import {
  synthesizeStegoAudio,
  encodeStereoWavPCM16,
  SAMPLE_RATE_48K,
} from '../../utils/audioStegoSynthesizer';
import { encodeLSB } from '../../utils/lsbStegoEngine';
import {
  AudioStegoMode,
  AudioStudioMetadata,
  DiscretionLevel,
} from '../../types/forensicPillars';
import './AudioStudioModal.css';

interface AudioStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File, studioMeta?: AudioStudioMetadata) => void;
  initialBaseAudio?: File | null;
}

const DISCRETION_BADGE: Record<DiscretionLevel, { label: string; cls: string }> = {
  discreet: { label: 'Discreto: Quase imperceptível ao ouvido', cls: 'green' },
  texture: { label: 'Textura leve: Parece interferência de fita', cls: 'yellow' },
  audible: { label: 'Audível: Vai gerar apito claro nessa faixa', cls: 'red' },
};

export default function AudioStudioModal({
  isOpen,
  onClose,
  onSave,
  initialBaseAudio,
}: AudioStudioModalProps) {
  const [mode, setMode] = useState<AudioStegoMode>('stereo_lr');
  const [secretText, setSecretText] = useState('ORDO REALITAS');
  const [lsbPassword, setLsbPassword] = useState('');
  const [durationSec, setDurationSec] = useState(6);
  const [startSec] = useState(0.5);
  const [endSec, setEndSec] = useState(5.5);
  const [intensity, setIntensity] = useState(0.65);

  const [baseFile, setBaseFile] = useState<File | null>(initialBaseAudio ?? null);
  const [baseL, setBaseL] = useState<Float32Array | null>(null);
  const [baseR, setBaseR] = useState<Float32Array | null>(null);

  const [synthLeft, setSynthLeft] = useState<Float32Array | null>(null);
  const [synthRight, setSynthRight] = useState<Float32Array | null>(null);
  const [discretion, setDiscretion] = useState<DiscretionLevel>('discreet');
  const [lastMeta, setLastMeta] = useState<AudioStudioMetadata | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const previewCtxRef = useRef<AudioContext | null>(null);
  const previewSrcRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!baseFile) {
      setBaseL(null);
      setBaseR(null);
      return;
    }
    let cancelled = false;
    const decode = async () => {
      try {
        const buf = await baseFile.arrayBuffer();
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx({ sampleRate: SAMPLE_RATE_48K });
        const decoded = await ctx.decodeAudioData(buf);
        if (cancelled) return;
        setBaseL(new Float32Array(decoded.getChannelData(0)));
        setBaseR(
          decoded.numberOfChannels > 1
            ? new Float32Array(decoded.getChannelData(1))
            : null
        );
        const dur = Math.max(1, Math.round(decoded.duration));
        setDurationSec(dur);
        setEndSec(Math.max(1, dur - 0.3));
        await ctx.close();
      } catch {
        // ignore decode error
      }
    };
    decode();
    return () => {
      cancelled = true;
    };
  }, [baseFile]);

  useEffect(() => {
    if (isOpen) {
      setBaseFile(initialBaseAudio ?? null);
    } else {
      try {
        previewSrcRef.current?.stop();
      } catch {}
      setIsPlaying(false);
    }
  }, [isOpen, initialBaseAudio]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      try {
        previewSrcRef.current?.stop();
      } catch {}
      try {
        previewCtxRef.current?.close();
      } catch {}
      previewCtxRef.current = null;
    };
  }, []);

  if (!isOpen) return null;

  const renderTextCanvas = (text: string): ImageData => {
    const cvs = document.createElement('canvas');
    cvs.width = 280;
    cvs.height = 96;
    const ctx = cvs.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = text.length > 18 ? 20 : 28;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillText(text || 'ECDISE', cvs.width / 2, cvs.height / 2);
    return ctx.getImageData(0, 0, cvs.width, cvs.height);
  };

  const handleSynthesize = () => {
    setIsGenerating(true);
    try {
      if (mode === 'lsb') {
        const len = baseL ? baseL.length : durationSec * SAMPLE_RATE_48K;
        const srcL = baseL ? new Float32Array(baseL) : new Float32Array(len);
        const encoded = encodeLSB(srcL, secretText, lsbPassword || undefined);
        setSynthLeft(encoded);
        setSynthRight(baseR ? new Float32Array(baseR) : encoded);
        setDiscretion('discreet');
        setLastMeta({
          version: 2,
          mode: 'lsb',
          minFreqHz: 0,
          maxFreqHz: 24000,
          startSec: 0,
          endSec: len / SAMPLE_RATE_48K,
          sampleRate: SAMPLE_RATE_48K,
          discretion: 'discreet',
          anomaly: {
            hasHighFreqEnergy: false,
            highFreqPeakHz: null,
            hasStereoAsymmetry: false,
            stereoDiffRatio: 0,
            hasLsbPayload: true,
          },
        });
      } else {
        const imgData = renderTextCanvas(secretText);
        const minFreqHz = mode === 'ghost_zone' ? 16800 : mode === 'stereo_lr' ? 400 : 800;
        const maxFreqHz = mode === 'ghost_zone' ? 20500 : mode === 'stereo_lr' ? 16000 : 8500;
        const res = synthesizeStegoAudio({
          mode,
          imageData: imgData,
          baseLeft: baseL,
          baseRight: baseR,
          sampleRate: SAMPLE_RATE_48K,
          durationSec,
          startSec,
          endSec,
          minFreqHz,
          maxFreqHz,
          intensity,
        });
        setSynthLeft(res.left);
        setSynthRight(res.right);
        setDiscretion(res.discretion);
        setLastMeta({
          version: 2,
          mode,
          minFreqHz,
          maxFreqHz,
          startSec,
          endSec,
          sampleRate: res.sampleRate,
          discretion: res.discretion,
          anomaly: res.anomaly,
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async (diffOnly = false) => {
    if (isPlaying) {
      try {
        previewSrcRef.current?.stop();
      } catch {}
      setIsPlaying(false);
      return;
    }
    if (!synthLeft) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = previewCtxRef.current || new Ctx({ sampleRate: SAMPLE_RATE_48K });
    previewCtxRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    const buf = ctx.createBuffer(diffOnly ? 1 : 2, synthLeft.length, SAMPLE_RATE_48K);
    if (diffOnly && synthRight) {
      const ch = buf.getChannelData(0);
      for (let i = 0; i < synthLeft.length; i++) {
        ch[i] = (synthLeft[i] - synthRight[i]) * 0.5;
      }
    } else {
      buf.getChannelData(0).set(synthLeft);
      if (buf.numberOfChannels > 1) {
        buf.getChannelData(1).set(synthRight || synthLeft);
      }
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => setIsPlaying(false);
    previewSrcRef.current = src;
    src.start(0);
    setIsPlaying(true);
  };

  const handleExport = () => {
    if (!synthLeft) return;
    const blob = encodeStereoWavPCM16(
      synthLeft,
      mode === 'stereo_lr' || synthRight ? synthRight : null,
      SAMPLE_RATE_48K
    );
    const file = new File([blob], `ecdise_studio_${mode}_48k.wav`, { type: 'audio/wav' });
    onSave(file, lastMeta || undefined);
    onClose();
  };

  const badge = DISCRETION_BADGE[discretion];

  return createPortal(
    <div className="asm-backdrop" onClick={onClose}>
      <div className="asm-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="asm-header">
          <div className="asm-title">
            <Radio size={17} />
            <div>
              <h2>ESTÚDIO ACÚSTICO — MODO MESTRE (48 kHz WAV)</h2>
              <span>Síntese espectral limpa com suavização de bordas e medidor de discrição</span>
            </div>
          </div>
          <button type="button" className="asm-close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="asm-body">
          <div className="asm-modes">
            {(
              [
                { id: 'stereo_lr', label: 'Estéreo Oculto (L − R)', desc: 'Invisível no mix normal; salta limpo ao isolar L − R' },
                { id: 'ghost_zone', label: 'Zona Fantasma (16.8–20.5 kHz)', desc: 'Ultrassônico compatível com 44.1/48 kHz para lupa vertical' },
                { id: 'noise_sculpt', label: 'Escultura em Ruído', desc: 'Escondido dentro de chiado natural' },
                { id: 'lsb', label: 'Esteganografia LSB', desc: 'Texto oculto nos bits menos significativos' },
              ] as { id: AudioStegoMode; label: string; desc: string }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                className={`asm-mode-btn ${mode === m.id ? 'active' : ''}`}
                onClick={() => setMode(m.id)}
              >
                <strong>{m.label}</strong>
                <span>{m.desc}</span>
              </button>
            ))}
          </div>

          <div className="asm-grid">
            <div className="asm-field">
              <label>Mensagem Secreta</label>
              <input
                type="text"
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                placeholder="Ex: CODIGO 7492"
              />
            </div>

            {mode === 'lsb' ? (
              <div className="asm-field">
                <label>Senha XOR (Opcional)</label>
                <input
                  type="text"
                  value={lsbPassword}
                  onChange={(e) => setLsbPassword(e.target.value)}
                  placeholder="Deixe vazio para sem senha"
                />
              </div>
            ) : (
              <div className="asm-field">
                <label>Áudio Base (Opcional — usa ruído ambiente se vazio)</label>
                <label className="asm-upload-btn">
                  <Upload size={14} />
                  <span>{baseFile ? baseFile.name : 'Carregar música/diálogo base'}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={(e) => setBaseFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            )}
          </div>

          {mode !== 'lsb' && (
            <div className="asm-sliders">
              <label>
                <span>Duração Total: {durationSec}s</span>
                <input
                  type="range"
                  min={2}
                  max={30}
                  value={durationSec}
                  disabled={Boolean(baseFile)}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    setDurationSec(d);
                    setEndSec(Math.min(d, Math.max(startSec + 0.5, endSec)));
                  }}
                />
              </label>
              <label>
                <span>Janela: {startSec.toFixed(1)}s – {endSec.toFixed(1)}s</span>
                <input
                  type="range"
                  min={0.5}
                  max={durationSec}
                  step={0.5}
                  value={endSec}
                  onChange={(e) => setEndSec(Math.max(startSec + 0.5, Number(e.target.value)))}
                />
              </label>
              <label>
                <span>Intensidade: {Math.round(intensity * 100)}%</span>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                />
              </label>
            </div>
          )}

          <div className={`asm-discretion ${badge.cls}`}>
            <span>Medidor de Discrição:</span>
            <strong>{badge.label}</strong>
          </div>

          {(() => {
            const estSamples = baseL ? baseL.length : durationSec * SAMPLE_RATE_48K;
            const chCount = mode === 'stereo_lr' || baseR ? 2 : 1;
            const estMb = (estSamples * chCount * 2 + 44) / (1024 * 1024);
            if (estMb > 20) {
              return (
                <div className="asm-discretion yellow">
                  <span>Aviso de Storage:</span>
                  <strong>Arquivo WAV estimado em {estMb.toFixed(1)} MB (&gt; 20 MB). Reduza a duração para evitar lentidão.</strong>
                </div>
              );
            }
            return null;
          })()}
        </div>

        <footer className="asm-footer">
          <button type="button" className="asm-btn-synth" onClick={handleSynthesize} disabled={isGenerating}>
            <Sparkles size={15} /> {isGenerating ? 'Sintetizando...' : 'Sintetizar Sinal 48 kHz'}
          </button>

          {synthLeft && (
            <>
              <button type="button" className="asm-btn-sec" onClick={() => handlePreview(false)}>
                {isPlaying ? <Square size={14} /> : <Play size={14} />} Ouvir Mix
              </button>
              {mode === 'stereo_lr' && (
                <button type="button" className="asm-btn-sec" onClick={() => handlePreview(true)}>
                  <Play size={14} /> Testar L − R
                </button>
              )}
              <button type="button" className="asm-btn-primary" onClick={handleExport}>
                <Save size={15} /> Salvar WAV na Pista
              </button>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}
