import React, { useState } from 'react';
import { Sparkles, Radio, Eye, Headphones, Lock, Upload } from 'lucide-react';
import {
  buildQuickLsbRecipe,
  buildSceneEffectRecipe,
  buildSpectrogramSecretRecipe,
  buildStereoDiffVoiceRecipe,
  RecipeAudioOutput,
  SceneEffectType,
} from '../../../utils/audioRecipes';

interface AudioRecipesPanelProps {
  baseAudioSamples: Float32Array | null;
  onRecipeGenerated: (output: RecipeAudioOutput) => void;
  onSaveFile?: (file: File) => void;
}

type RecipeTab = 'spectrogram' | 'scene' | 'diff' | 'lsb';

export default function AudioRecipesPanel({
  baseAudioSamples,
  onRecipeGenerated,
  onSaveFile,
}: AudioRecipesPanelProps) {
  const [selected, setSelected] = useState<RecipeTab>('spectrogram');
  const [specText, setSpecText] = useState('SALA 4B');
  const [sceneEffect, setSceneEffect] = useState<SceneEffectType>('radio');
  const [lsbText, setLsbText] = useState('');
  const [lsbPass, setLsbPass] = useState('');
  const [secretVoiceSamples, setSecretVoiceSamples] = useState<Float32Array | null>(null);
  const [secretVoiceName, setSecretVoiceName] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [lastOutput, setLastOutput] = useState<RecipeAudioOutput | null>(null);

  const handleLoadSecretVoice = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setStatusMsg('Decodificando voz secreta...');
    try {
      const arrayBuf = await file.arrayBuffer();
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const decoded = await ctx.decodeAudioData(arrayBuf);
      setSecretVoiceSamples(new Float32Array(decoded.getChannelData(0)));
      setSecretVoiceName(file.name);
      setStatusMsg(`Voz carregada: ${file.name}`);
      try {
        await ctx.close();
      } catch {}
    } catch {
      setStatusMsg('Não foi possível decodificar este arquivo de voz.');
    } finally {
      setBusy(false);
    }
  };

  const handleGenerate = () => {
    setBusy(true);
    setStatusMsg(null);
    try {
      let out: RecipeAudioOutput;
      if (selected === 'spectrogram') {
        out = buildSpectrogramSecretRecipe(specText, baseAudioSamples);
        setStatusMsg(`Espectrograma "${specText.trim().toUpperCase() || 'ORDO'}" gerado!`);
      } else if (selected === 'scene') {
        out = buildSceneEffectRecipe(baseAudioSamples, sceneEffect);
        setStatusMsg(`Efeito de cena (${sceneEffect.toUpperCase()}) aplicado!`);
      } else if (selected === 'diff') {
        if (!secretVoiceSamples) {
          setStatusMsg('Envie primeiro o áudio da pista falada para esconder no canal Diff (L-R).');
          setBusy(false);
          return;
        }
        out = buildStereoDiffVoiceRecipe(secretVoiceSamples, baseAudioSamples);
        setStatusMsg('Áudio estéreo Diff (L-R) gerado! Só aparece ao isolar Diferença Estéreo.');
      } else {
        out = buildQuickLsbRecipe(lsbText, baseAudioSamples, lsbPass);
        setStatusMsg('Texto secreto injetado nos bits LSB (.wav pronto)!');
      }
      setLastOutput(out);
      onRecipeGenerated(out);
    } catch (err: any) {
      setStatusMsg(err?.message || 'Erro ao gerar áudio.');
    } finally {
      setBusy(false);
    }
  };

  const handleApplyToClue = () => {
    if (!lastOutput || !onSaveFile) return;
    const file = new File([lastOutput.wavBlob], lastOutput.filename, { type: 'audio/wav' });
    onSaveFile(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="al-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Sparkles size={12} />
        Receitas de 1 Clique (Zero-Asset)
      </div>

      <div className="al-segmented-2">
        <button
          type="button"
          className={`al-btn-ghost al-btn-sm ${selected === 'spectrogram' ? 'active' : ''}`}
          onClick={() => setSelected('spectrogram')}
        >
          <Eye size={12} /> Espectrograma
        </button>
        <button
          type="button"
          className={`al-btn-ghost al-btn-sm ${selected === 'scene' ? 'active' : ''}`}
          onClick={() => setSelected('scene')}
        >
          <Radio size={12} /> Efeito de Cena
        </button>
        <button
          type="button"
          className={`al-btn-ghost al-btn-sm ${selected === 'diff' ? 'active' : ''}`}
          onClick={() => setSelected('diff')}
        >
          <Headphones size={12} /> Voz Diff L-R
        </button>
        <button
          type="button"
          className={`al-btn-ghost al-btn-sm ${selected === 'lsb' ? 'active' : ''}`}
          onClick={() => setSelected('lsb')}
        >
          <Lock size={12} /> LSB Rápido
        </button>
      </div>

      {selected === 'spectrogram' && (
        <div className="al-card-box">
          <label className="al-field-label">Palavra / Código Oculto no Espectro</label>
          <input
            type="text"
            value={specText}
            onChange={(e) => setSpecText(e.target.value)}
            placeholder="Ex: SALA 4B, ECDISE..."
            maxLength={24}
            className="al-input-dark"
            style={{ fontFamily: 'var(--font-system, monospace)' }}
          />
          <span className="al-mix-hint">
            Gera automaticamente ruído ambiente + texto oculto em 8.5–18 kHz (ou mistura no áudio base).
          </span>
        </div>
      )}

      {selected === 'scene' && (
        <div className="al-card-box">
          <label className="al-field-label">Preset de Cena</label>
          <select
            value={sceneEffect}
            onChange={(e) => setSceneEffect(e.target.value as SceneEffectType)}
            className="al-select-dark"
          >
            <option value="radio">Rádio da Ordo (Interferência + Bandpass)</option>
            <option value="telephone">Ligação Telefônica Interceptada</option>
            <option value="cassette">Fita Cassete Antiga (Hiss + Calor)</option>
          </select>
          <span className="al-mix-hint">
            Aplica sobre o áudio base carregado (ou gera estática de rádio se não houver áudio base).
          </span>
        </div>
      )}

      {selected === 'diff' && (
        <div className="al-card-box">
          <label className="al-field-label">Áudio da Pista Falada (Oculta)</label>
          <label
            className="al-btn-ghost al-btn-sm"
            style={{ width: '100%', cursor: 'pointer' }}
          >
            <Upload size={13} /> {secretVoiceName || 'Selecionar áudio de voz (.mp3 / .wav)'}
            <input
              type="file"
              accept="audio/*"
              hidden
              onChange={(e) => handleLoadSecretVoice(e.target.files?.[0])}
            />
          </label>
          <span className="al-mix-hint">
            No Mix normal a voz se cancela; no preset <strong>Diferença Estéreo (L-R)</strong> ela aparece cristalina.
          </span>
        </div>
      )}

      {selected === 'lsb' && (
        <div className="al-card-box">
          <label className="al-field-label">Mensagem Secreta (Bits LSB)</label>
          <textarea
            rows={2}
            value={lsbText}
            onChange={(e) => setLsbText(e.target.value)}
            placeholder="Ex: Coordenadas 23.5505 S, 46.6333 W..."
            className="al-textarea-dark"
          />
          <input
            type="text"
            value={lsbPass}
            onChange={(e) => setLsbPass(e.target.value)}
            placeholder="Senha XOR opcional (deixe vazio para sem senha)"
            className="al-input-dark"
            style={{ fontFamily: 'var(--font-system, monospace)', fontSize: 12 }}
          />
        </div>
      )}

      <button
        type="button"
        className="al-btn-primary"
        disabled={busy}
        onClick={handleGenerate}
      >
        {busy ? 'Processando...' : 'Gerar Preview da Receita'}
      </button>

      {lastOutput && onSaveFile && (
        <button
          type="button"
          className="al-btn-save"
          onClick={handleApplyToClue}
        >
          Salvar .WAV na Pista Agora
        </button>
      )}

      {statusMsg && (
        <div className="al-status-banner">
          {statusMsg}
        </div>
      )}
    </div>
  );
}
