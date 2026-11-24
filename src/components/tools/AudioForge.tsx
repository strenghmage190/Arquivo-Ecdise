import React, { useState, useRef, useEffect } from 'react';
import { Radio, Disc, Ghost, Upload, Play, Save, X, Wand2 } from 'lucide-react';

export type AudioPresetId = 'police_radio' | 'cassette_tape' | 'paranormal_whisper';

interface Props {
  spectrogramUrl?: string | null;
  triggerTime?: number;
  baseAudio?: File | Blob | string | null;
  onClose: () => void;
  onSave: (file: File) => void;
}

const AUDIO_PRESETS: {
  id: AudioPresetId;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number | string }>;
}[] = [
  {
    id: 'police_radio',
    label: 'Rádio Policial',
    description: 'Bandpass 300–3000Hz + saturação leve + estática de rádio',
    icon: Radio,
  },
  {
    id: 'cassette_tape',
    label: 'Fita Cassete',
    description: 'Lowpass analógico + wow/flutter LFO + chiado de fita',
    icon: Disc,
  },
  {
    id: 'paranormal_whisper',
    label: 'Sussurro Paranormal',
    description: 'Pitch sombrio + reverb cavernoso + sussurro espectral',
    icon: Ghost,
  },
];

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function createSyntheticBuffer(ctx: BaseAudioContext, durationSec = 3): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.sin((Math.PI * t) / durationSec);
    const tone =
      Math.sin(2 * Math.PI * 220 * t) * 0.25 +
      Math.sin(2 * Math.PI * 440 * t) * 0.15 +
      Math.sin(2 * Math.PI * 880 * t) * 0.08;
    const breath = (Math.random() * 2 - 1) * 0.05;
    data[i] = (tone + breath) * env;
  }
  return buffer;
}

function createNoiseBuffer(ctx: BaseAudioContext, durationSec: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createImpulseResponse(ctx: BaseAudioContext, durationSec = 2.2, decay = 3.0): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * durationSec);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const channelData = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const n = i / length;
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
    }
  }
  return impulse;
}

function makeSoftClipCurve(amount = 25): Float32Array<ArrayBuffer> {
  const samples = 256;
  const curve = new Float32Array(new ArrayBuffer(samples * 4));
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

async function decodeInputToBuffer(
  source: File | Blob | string | null | undefined,
  sampleRate = 44100
): Promise<AudioBuffer> {
  const tempCtx = new OfflineAudioContext(1, sampleRate, sampleRate);
  if (!source) {
    return createSyntheticBuffer(tempCtx, 3);
  }

  let arrayBuffer: ArrayBuffer;
  if (typeof source === 'string') {
    const res = await fetch(source);
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = await source.arrayBuffer();
  }
  return await tempCtx.decodeAudioData(arrayBuffer);
}

async function processPresetOffline(
  inputBuffer: AudioBuffer,
  preset: AudioPresetId
): Promise<AudioBuffer> {
  const sampleRate = inputBuffer.sampleRate || 44100;
  const rateScale = preset === 'paranormal_whisper' ? 0.82 : 1;
  const extraTail = preset === 'paranormal_whisper' ? 1.5 : 0.1;
  const outLength = Math.ceil((inputBuffer.length / rateScale) + sampleRate * extraTail);
  const offline = new OfflineAudioContext(2, outLength, sampleRate);

  const src = offline.createBufferSource();
  src.buffer = inputBuffer;
  src.playbackRate.value = rateScale;

  if (preset === 'police_radio') {
    const hp = offline.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 300;

    const lp = offline.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;

    const bp = offline.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1350;
    bp.Q.value = 1.1;

    const shaper = offline.createWaveShaper();
    shaper.curve = makeSoftClipCurve(30);
    shaper.oversample = '2x';

    const masterGain = offline.createGain();
    masterGain.gain.value = 1.15;

    src.connect(hp);
    hp.connect(lp);
    lp.connect(bp);
    bp.connect(shaper);
    shaper.connect(masterGain);
    masterGain.connect(offline.destination);

    // Light radio static
    const noiseSrc = offline.createBufferSource();
    noiseSrc.buffer = createNoiseBuffer(offline, outLength / sampleRate);
    const noiseFilter = offline.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1800;
    const noiseGain = offline.createGain();
    noiseGain.gain.value = 0.04;
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(offline.destination);
    noiseSrc.start(0);
  } else if (preset === 'cassette_tape') {
    const hp = offline.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 85;

    const lp = offline.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3800;

    // Wow & Flutter via modulated delay
    const delay = offline.createDelay(0.1);
    delay.delayTime.value = 0.015;

    const lfo = offline.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 1.8;
    const lfoGain = offline.createGain();
    lfoGain.gain.value = 0.0028;
    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfo.start(0);

    const shaper = offline.createWaveShaper();
    shaper.curve = makeSoftClipCurve(12);

    src.connect(hp);
    hp.connect(lp);
    lp.connect(delay);
    delay.connect(shaper);
    shaper.connect(offline.destination);

    // Analog tape hiss
    const noiseSrc = offline.createBufferSource();
    noiseSrc.buffer = createNoiseBuffer(offline, outLength / sampleRate);
    const noiseLp = offline.createBiquadFilter();
    noiseLp.type = 'lowpass';
    noiseLp.frequency.value = 5500;
    const noiseGain = offline.createGain();
    noiseGain.gain.value = 0.025;
    noiseSrc.connect(noiseLp);
    noiseLp.connect(noiseGain);
    noiseGain.connect(offline.destination);
    noiseSrc.start(0);
  } else {
    // Paranormal Whisper: dark pitch + eerie reverb + breathy whisper
    const lp = offline.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2100;

    const convolver = offline.createConvolver();
    convolver.buffer = createImpulseResponse(offline, 2.0, 2.6);

    const dryGain = offline.createGain();
    dryGain.gain.value = 0.65;
    const wetGain = offline.createGain();
    wetGain.gain.value = 0.55;

    src.connect(lp);
    lp.connect(dryGain);
    lp.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(offline.destination);
    wetGain.connect(offline.destination);

    // Spectral whisper layer
    const whisperSrc = offline.createBufferSource();
    whisperSrc.buffer = createNoiseBuffer(offline, outLength / sampleRate);
    const whisperBp = offline.createBiquadFilter();
    whisperBp.type = 'bandpass';
    whisperBp.frequency.value = 1650;
    whisperBp.Q.value = 2.2;
    const whisperGain = offline.createGain();
    whisperGain.gain.value = 0.035;
    whisperSrc.connect(whisperBp);
    whisperBp.connect(whisperGain);
    whisperGain.connect(offline.destination);
    whisperSrc.start(0);
  }

  src.start(0);
  return await offline.startRendering();
}

export default function AudioForge({
  spectrogramUrl,
  triggerTime,
  baseAudio,
  onClose,
  onSave,
}: Props) {
  const [sourceFile, setSourceFile] = useState<File | Blob | string | null>(baseAudio ?? null);
  const [sourceName, setSourceName] = useState<string>(
    baseAudio instanceof File ? baseAudio.name : baseAudio ? 'Áudio Base' : 'Sinal Sintético (3s)'
  );
  const [selectedPreset, setSelectedPreset] = useState<AudioPresetId>('police_radio');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSourceFile(f);
    setSourceName(f.name);
    setProcessedFile(null);
    setErrorMsg(null);
    e.target.value = '';
  };

  const handleApplyPreset = async (presetId: AudioPresetId = selectedPreset) => {
    setSelectedPreset(presetId);
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const inputBuffer = await decodeInputToBuffer(sourceFile);
      const rendered = await processPresetOffline(inputBuffer, presetId);
      const wavBlob = audioBufferToWavBlob(rendered);
      const file = new File([wavBlob], `audioforge_${presetId}_${Date.now()}.wav`, {
        type: 'audio/wav',
      });
      setProcessedFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err: any) {
      console.error('AudioForge offline processing failed:', err);
      setErrorMsg(err?.message || 'Falha ao processar áudio com Web Audio API.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (processedFile) {
      onSave(processedFile);
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const inputBuffer = await decodeInputToBuffer(sourceFile);
      const rendered = await processPresetOffline(inputBuffer, selectedPreset);
      const wavBlob = audioBufferToWavBlob(rendered);
      const file = new File([wavBlob], `audioforge_${selectedPreset}_${Date.now()}.wav`, {
        type: 'audio/wav',
      });
      onSave(file);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao exportar áudio WAV.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        background: '#0b1220',
        color: '#e2e8f0',
        padding: 18,
        borderRadius: 10,
        border: '1px solid rgba(0, 243, 255, 0.28)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, color: '#00f3ff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wand2 size={16} /> Audio Forge — Processamento Web Audio
          </h3>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            Fonte: {sourceName} {triggerTime ? `• Gatilho: ${triggerTime.toFixed(1)}s` : ''}
            {spectrogramUrl ? ' • Espectrograma ativo' : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#cbd5e1',
            borderRadius: 6,
            padding: '4px 8px',
            cursor: 'pointer',
          }}
          title="Fechar"
        >
          <X size={15} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={handleFilePick}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 6,
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <Upload size={14} /> Carregar Áudio Base
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 8, marginBottom: 14 }}>
        {AUDIO_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const active = selectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset.id)}
              disabled={isProcessing}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 8,
                border: active ? '1px solid #00f3ff' : '1px solid rgba(148, 163, 184, 0.25)',
                background: active ? 'rgba(0, 243, 255, 0.12)' : 'rgba(15, 23, 42, 0.7)',
                color: '#f8fafc',
                cursor: isProcessing ? 'wait' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                <Icon size={14} /> {preset.label}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.35 }}>
                {preset.description}
              </div>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>
          {errorMsg}
        </div>
      )}

      {previewUrl && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#4ade80', marginBottom: 4 }}>
            ✓ WAV processado pronto ({selectedPreset})
          </div>
          <audio controls src={previewUrl} style={{ width: '100%' }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => handleApplyPreset(selectedPreset)}
          disabled={isProcessing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid rgba(0, 243, 255, 0.45)',
            background: 'rgba(0, 243, 255, 0.1)',
            color: '#00f3ff',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <Play size={14} /> {isProcessing ? 'Processando...' : 'Renderizar Prévia WAV'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid #22c55e',
            background: 'rgba(34, 197, 94, 0.2)',
            color: '#4ade80',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Save size={14} /> {isProcessing ? 'Exportando...' : 'Salvar WAV'}
        </button>
      </div>
    </div>
  );
}
