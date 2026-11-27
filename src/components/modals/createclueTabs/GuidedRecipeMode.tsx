import React, { useMemo, useRef, useState } from 'react';
import {
  FileText,
  Smartphone,
  Music,
  Video,
  KeyRound,
  SlidersHorizontal,
  Upload,
  X,
  Image as ImageIcon,
  Flashlight,
  Flame,
  Layers,
  Scissors,
  Clock,
  Lock,
  Gift,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Info,
  LucideIcon,
} from 'lucide-react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import FakePhoneChatBuilder from './FakePhoneChatBuilder';
import HandoutStudioModal, { HandoutStudioResult } from '../HandoutStudioModal';
import {
  analyzeClueSolvability,
  BoardCardSummary,
  SolvabilityIssue,
} from '../../../utils/solvabilityLinter';

export type GuidedRecipeId = 'doc_uv' | 'phone' | 'audio' | 'cctv' | 'terminal_lock';

interface RecipeDefinition {
  id: GuidedRecipeId;
  label: string;
  subtitle: string;
  defaultPace: 'in_session' | 'between_sessions';
  icon: LucideIcon;
}

const RECIPES: RecipeDefinition[] = [
  {
    id: 'doc_uv',
    label: 'Documento / Foto UV',
    subtitle: 'Provas visuais, UV, Termal ou papel picotado',
    defaultPace: 'in_session',
    icon: FileText,
  },
  {
    id: 'phone',
    label: 'Celular Apreendido',
    subtitle: 'Mensagens, PIN/Padrão e arquivos internos',
    defaultPace: 'in_session',
    icon: Smartphone,
  },
  {
    id: 'audio',
    label: 'Áudio Forense',
    subtitle: 'Gravações, espectrograma e sinal oculto',
    defaultPace: 'between_sessions',
    icon: Music,
  },
  {
    id: 'cctv',
    label: 'Câmera CCTV / Vídeo',
    subtitle: 'Filmagens de segurança com filtros',
    defaultPace: 'in_session',
    icon: Video,
  },
  {
    id: 'terminal_lock',
    label: 'Terminal / Arquivo Protegido',
    subtitle: 'Credencial Anti-F12, cifra ou Dead-Drop',
    defaultPace: 'between_sessions',
    icon: KeyRound,
  },
];

export interface GuidedRecipeModeProps {
  investigationId: string;
  currentCardId?: string;
  boardCards: BoardCardSummary[];
}

export default function GuidedRecipeMode({
  currentCardId,
  boardCards,
}: GuidedRecipeModeProps) {
  const {
    coreState,
    setCoreState,
    securityState,
    setSecurityState,
    mediaState,
    setMediaState,
    cipherState,
    setCipherState,
    thermalConfig,
    setThermalConfig,
    phoneState,
    setPhoneState,
    setEditorState,
    registerUrl,
    revokeUrl,
    setCreatorMode,
    setActiveTab,
  } = useClueModal();

  // Infer initial recipe from hydrated card state
  const inferRecipe = (): GuidedRecipeId => {
    if (phoneState.hasKeypad || phoneState.chatList.length > 0) return 'phone';
    if (mediaState.videoPreviewUrl || mediaState.videoUrl || mediaState.videoUrlInput) return 'cctv';
    if (mediaState.audioBasePreview || mediaState.audioHiddenPreview) return 'audio';
    if (securityState.isLocked || cipherState.cipherText || cipherState.hexCode) return 'terminal_lock';
    return 'doc_uv';
  };

  const [recipe, setRecipe] = useState<GuidedRecipeId>(inferRecipe);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showHandoutStudio, setShowHandoutStudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const assistHintRef = useRef<HTMLInputElement | null>(null);

  const handleApplyHandout = (result: HandoutStudioResult) => {
    const baseUrl = URL.createObjectURL(result.baseFile);
    registerUrl(baseUrl);
    revokeUrl(mediaState.previewUrl);

    let uvUrl: string | undefined;
    let thermalUrl: string | undefined;
    if (result.secretFile) {
      const sUrl = URL.createObjectURL(result.secretFile);
      registerUrl(sUrl);
      if (result.secretMode === 'uv') {
        revokeUrl(mediaState.uvPreviewUrl);
        uvUrl = sUrl;
      } else if (result.secretMode === 'thermal') {
        revokeUrl(mediaState.thermalPreviewUrl);
        thermalUrl = sUrl;
      }
    }

    setMediaState((prev) => ({
      ...prev,
      imgFile: result.baseFile,
      previewUrl: baseUrl,
      removedImage: false,
      ...(uvUrl ? { uvFile: result.secretFile, uvPreviewUrl: uvUrl, removedUv: false } : {}),
      ...(thermalUrl ? { thermalFile: result.secretFile, thermalPreviewUrl: thermalUrl, removedThermal: false } : {}),
    }));

    if (result.secretMode === 'thermal' && result.secretFile) {
      setThermalConfig((t) => ({ ...t, enabled: true }));
    }
    if (!coreState.title.trim()) {
      setCoreState((c) => ({ ...c, title: result.suggestedTitle }));
    }
  };

  const selectRecipe = (next: GuidedRecipeId) => {
    setRecipe(next);
    const def = RECIPES.find((r) => r.id === next);
    if (def) {
      setSecurityState((s) => ({
        ...s,
        paceMode: def.defaultPace,
        isLocked: next === 'terminal_lock' ? true : s.isLocked,
      }));
    }
    if (next === 'phone') {
      setPhoneState((p) => ({ ...p, hasKeypad: p.hasKeypad || true }));
    }
  };

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    registerUrl(url);

    if (file.type.startsWith('image/')) {
      revokeUrl(mediaState.previewUrl);
      setMediaState((prev) => ({
        ...prev,
        imgFile: file,
        previewUrl: url,
        removedImage: false,
      }));
    } else if (file.type.startsWith('audio/')) {
      revokeUrl(mediaState.audioBasePreview);
      setMediaState((prev) => ({
        ...prev,
        audioBase: file,
        audioBasePreview: url,
        removedAudioBase: false,
      }));
    } else if (file.type.startsWith('video/')) {
      revokeUrl(mediaState.videoPreviewUrl);
      setMediaState((prev) => ({
        ...prev,
        videoFile: file,
        videoPreviewUrl: url,
        videoUrlInput: '',
        removedVideo: false,
      }));
    }
  };

  const jumpToAdvancedTab = (tabId: string) => {
    setCreatorMode('complete');
    setActiveTab(tabId);
  };

  const toggleRewardCard = (id: string) => {
    setSecurityState((s) => {
      const current = s.rewardCardIds || [];
      const exists = current.includes(id);
      return {
        ...s,
        rewardCardIds: exists ? current.filter((x) => x !== id) : [...current, id],
      };
    });
  };

  const rewardCandidates = useMemo(
    () => (boardCards || []).filter((c) => c.id && c.id !== currentCardId),
    [boardCards, currentCardId]
  );

  const solvability = useMemo(
    () =>
      analyzeClueSolvability({
        currentCardId,
        title: coreState.title,
        evidenceType: coreState.evidenceType,
        isLocked: securityState.isLocked,
        lockPass: securityState.lockPass,
        paceMode: securityState.paceMode,
        assistHint: securityState.assistHint,
        rewardCardIds: securityState.rewardCardIds || [],
        hasUvOrThermal: Boolean(
          mediaState.uvPreviewUrl ||
            mediaState.uvFile ||
            thermalConfig.enabled ||
            mediaState.thermalPreviewUrl ||
            mediaState.forensicPreviewUrl
        ),
        hasHiddenAudio: Boolean(mediaState.audioHiddenPreview || mediaState.audioHidden),
        hasCipherOrHex: Boolean(cipherState.cipherText?.trim() || cipherState.hexCode?.trim()),
        isShredded: Boolean(cipherState.isShredded),
        shredPiecesCount: (cipherState.shredRows || 1) * (cipherState.shredCols || 8),
        boardCards,
      }),
    [
      currentCardId,
      coreState.title,
      coreState.evidenceType,
      securityState.isLocked,
      securityState.lockPass,
      securityState.paceMode,
      securityState.assistHint,
      securityState.rewardCardIds,
      mediaState.uvPreviewUrl,
      mediaState.uvFile,
      mediaState.thermalPreviewUrl,
      mediaState.forensicPreviewUrl,
      mediaState.audioHiddenPreview,
      mediaState.audioHidden,
      thermalConfig.enabled,
      cipherState.cipherText,
      cipherState.hexCode,
      cipherState.isShredded,
      cipherState.shredRows,
      cipherState.shredCols,
      boardCards,
    ]
  );

  const handleQuickFix = (issue: SolvabilityIssue) => {
    if (issue.quickFix === 'switch_between_sessions') {
      setSecurityState((s) => ({ ...s, paceMode: 'between_sessions' }));
    } else if (issue.quickFix === 'focus_assist_hint') {
      setStep(3);
      setTimeout(() => assistHintRef.current?.focus(), 80);
    }
  };

  return (
    <div className="ccm-tab-stack" style={{ gap: 14 }}>
      {/* 1. Seletor de Receita (Intenção Narrativa) */}
      <div className="ccm-section" style={{ padding: '10px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <span className="ccm-label" style={{ margin: 0 }}>
            ESCOLHA A RECEITA DA CENA (3 PASSOS)
          </span>
          <button
            type="button"
            className="ccm-btn ccm-btn-sm"
            onClick={() => jumpToAdvancedTab('geral')}
            title="Abrir todas as 10 abas técnicas (Shredder, Glitch, Enigma, Mega-Pista...)"
          >
            <SlidersHorizontal size={13} /> Módulos Avançados (10 Abas)
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
            gap: 8,
          }}
        >
          {RECIPES.map((r) => {
            const Icon = r.icon;
            const active = recipe === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => selectRecipe(r.id)}
                className={`ccm-btn ${active ? 'ccm-btn-primary' : ''}`}
                style={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  padding: '9px 10px',
                  gap: 4,
                  height: 'auto',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12 }}>
                  <Icon size={14} /> {r.label}
                </span>
                <span style={{ fontSize: 10.5, opacity: 0.78, lineHeight: 1.25 }}>{r.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Stepper Linear em 3 Passos */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { num: 1 as const, label: '1. Camada Pública' },
          { num: 2 as const, label: '2. Camada Oculta' },
          { num: 3 as const, label: '3. Trava, Ritmo & Recompensa' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={`ccm-btn ${step === s.num ? 'ccm-btn-primary' : ''}`}
            style={{ flex: '1 1 160px', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 3. Área Principal + Painel Vivo do Linter de Solubilidade */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.65fr) minmax(240px, 0.85fr)',
          gap: 14,
          alignItems: 'start',
        }}
      >
        {/* Coluna Esquerda: Passo Atual */}
        <div className="ccm-section" style={{ minWidth: 0 }}>
          {step === 1 && (
            <div className="ccm-list-stack">
              <div className="ccm-field">
                <label className="ccm-label">Título da Evidência *</label>
                <input
                  type="text"
                  className="ccm-input"
                  value={coreState.title}
                  onChange={(e) => setCoreState((s) => ({ ...s, title: e.target.value }))}
                  maxLength={100}
                  placeholder="Ex: Laudo da Autópsia, Celular de Marcos, Gravação 04..."
                  autoFocus
                />
              </div>

              <div className="ccm-field">
                <label className="ccm-label">O que os jogadores veem de cara (Descrição Pública)</label>
                <textarea
                  className="ccm-input"
                  rows={3}
                  value={coreState.descPublic}
                  onChange={(e) => setCoreState((s) => ({ ...s, descPublic: e.target.value }))}
                  placeholder="Texto visível imediatamente ao abrir a evidência..."
                />
              </div>

              <div className="ccm-field">
                <label className="ccm-label">Notas Secretas do Mestre (Invisível aos Jogadores)</label>
                <textarea
                  className="ccm-input"
                  rows={2}
                  value={coreState.descHidden}
                  onChange={(e) => setCoreState((s) => ({ ...s, descHidden: e.target.value }))}
                  placeholder="Lembrete rápido para você durante a call..."
                />
              </div>

              <div className="ccm-field">
                <label className="ccm-label">
                  Mídia Base (
                  {recipe === 'audio'
                    ? 'Áudio .mp3 / .wav'
                    : recipe === 'cctv'
                    ? 'Vídeo .mp4 / .webm'
                    : 'Imagem, Áudio ou Vídeo'}
                  )
                </label>
                <div
                  className={`ccm-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={20} color="var(--ccm-accent)" />
                  <div className="ccm-dropzone-title">Arraste o arquivo aqui ou clique para selecionar</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={
                      recipe === 'audio'
                        ? 'audio/*'
                        : recipe === 'cctv'
                        ? 'video/*'
                        : 'image/*,audio/*,video/*'
                    }
                    hidden
                    onChange={(e) => {
                      handleFile(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              {recipe === 'cctv' && (
                <div className="ccm-field">
                  <label className="ccm-label">Ou URL de Vídeo (MP4 / YouTube)</label>
                  <input
                    type="text"
                    className="ccm-input"
                    value={mediaState.videoUrlInput}
                    onChange={(e) =>
                      setMediaState((prev) => ({
                        ...prev,
                        videoUrlInput: e.target.value,
                        removedVideo: false,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
              )}

              {mediaState.previewUrl && (
                <div className="ccm-preview-box">
                  <div className="ccm-preview-head">
                    <span>
                      <ImageIcon size={13} /> Imagem base anexada
                    </span>
                    <button
                      type="button"
                      className="ccm-btn ccm-btn-sm ccm-btn-danger"
                      onClick={() => {
                        revokeUrl(mediaState.previewUrl);
                        setMediaState((p) => ({ ...p, imgFile: null, previewUrl: null, removedImage: true }));
                      }}
                    >
                      <X size={13} /> Remover
                    </button>
                  </div>
                  <img src={mediaState.previewUrl} alt="Prévia" className="ccm-preview-img" />
                </div>
              )}

              {mediaState.audioBasePreview && (
                <div className="ccm-preview-box">
                  <div className="ccm-preview-head">
                    <span>
                      <Music size={13} /> Áudio base anexado
                    </span>
                    <button
                      type="button"
                      className="ccm-btn ccm-btn-sm ccm-btn-danger"
                      onClick={() => {
                        revokeUrl(mediaState.audioBasePreview);
                        setMediaState((p) => ({ ...p, audioBase: null, audioBasePreview: null, removedAudioBase: true }));
                      }}
                    >
                      <X size={13} /> Remover
                    </button>
                  </div>
                  <audio controls src={mediaState.audioBasePreview} style={{ width: '100%' }} />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="ccm-list-stack">
              {recipe === 'doc_uv' && (
                <>
                  <div className="ccm-note">
                    Gere um documento pronto estilo Cthulhu Architect ou adicione camadas ocultas:
                  </div>
                  <button
                    type="button"
                    className="ccm-btn ccm-btn-primary"
                    onClick={() => setShowHandoutStudio(true)}
                  >
                    <FileText size={15} /> Gerar Documento / Handout (C.R.I.S., Jornal, Diário, Laudo, Polaroid)
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                    <button
                      type="button"
                      className="ccm-btn"
                      onClick={() =>
                        setEditorState((e) => ({
                          ...e,
                          editorMode: 'uv',
                          uvEditorBaseUrl: mediaState.previewUrl,
                          uvEditorPurpose: null,
                        }))
                      }
                    >
                      <Flashlight size={15} /> Abrir Editor de Luz UV
                    </button>
                    <button
                      type="button"
                      className="ccm-btn"
                      onClick={() => setEditorState((e) => ({ ...e, showThermalEditor: true }))}
                    >
                      <Flame size={15} /> Abrir Editor Termal
                    </button>
                    <button
                      type="button"
                      className="ccm-btn"
                      onClick={() => setEditorState((e) => ({ ...e, showForensicEditor: true }))}
                    >
                      <Layers size={15} /> Canais RGB Forense
                    </button>
                  </div>

                  <label className="ccm-toggle-row">
                    <span className="ccm-toggle-text">
                      <span className="ccm-toggle-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Scissors size={14} /> Fragmentar como Papel Picotado (Shredder)
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      className="ccm-checkbox-input"
                      checked={cipherState.isShredded}
                      onChange={(e) => setCipherState((c) => ({ ...c, isShredded: e.target.checked }))}
                    />
                  </label>

                  {cipherState.isShredded && (
                    <div className="ccm-grid-2">
                      <div className="ccm-field">
                        <label className="ccm-label">Tiras (Colunas)</label>
                        <input
                          type="number"
                          min={2}
                          max={12}
                          className="ccm-input"
                          value={cipherState.shredCols}
                          onChange={(e) =>
                            setCipherState((c) => ({ ...c, shredCols: Math.max(2, Number(e.target.value) || 4) }))
                          }
                        />
                      </div>
                      <div className="ccm-field">
                        <label className="ccm-label">Linhas</label>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          className="ccm-input"
                          value={cipherState.shredRows}
                          onChange={(e) =>
                            setCipherState((c) => ({ ...c, shredRows: Math.max(1, Number(e.target.value) || 1) }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {recipe === 'phone' && (
                <>
                  <label className="ccm-toggle-row">
                    <span className="ccm-toggle-title">Exigir PIN ou Padrão 3x3 na tela de bloqueio</span>
                    <input
                      type="checkbox"
                      className="ccm-checkbox-input"
                      checked={phoneState.hasKeypad}
                      onChange={(e) => setPhoneState((p) => ({ ...p, hasKeypad: e.target.checked }))}
                    />
                  </label>

                  {phoneState.hasKeypad && (
                    <div className="ccm-grid-2">
                      <div className="ccm-field">
                        <label className="ccm-label">PIN / Padrão do Celular</label>
                        <input
                          type="text"
                          className="ccm-input ccm-input-mono"
                          value={phoneState.password}
                          onChange={(e) => setPhoneState((p) => ({ ...p, password: e.target.value }))}
                          placeholder={phoneState.lockType === 'pin' ? 'Ex: 4812' : 'Ex: 1-2-5-8-9'}
                        />
                      </div>
                      <div className="ccm-field">
                        <label className="ccm-label">Tipo de Bloqueio</label>
                        <select
                          className="ccm-input"
                          value={phoneState.lockType}
                          onChange={(e) => setPhoneState((p) => ({ ...p, lockType: e.target.value as any }))}
                        >
                          <option value="pin">PIN Numérico</option>
                          <option value="pattern">Padrão 3x3</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <FakePhoneChatBuilder />
                </>
              )}

              {recipe === 'audio' && (
                <>
                  <div className="ccm-note">
                    Use o <strong>AudioLab</strong> para injetar texto no espectrograma, filtros de rádio/telefone ou esteganografia LSB no seu áudio.
                  </div>
                  <button
                    type="button"
                    className="ccm-btn ccm-btn-primary"
                    onClick={() => setEditorState((e) => ({ ...e, showAudioForgeFor: 'hidden' }))}
                  >
                    <Music size={15} /> Abrir Estúdio AudioLab (Espectrograma / LSB / DSP)
                  </button>
                  {mediaState.audioHiddenPreview && (
                    <div className="ccm-preview-box">
                      <div className="ccm-preview-head">
                        <span>Áudio processado pronto</span>
                      </div>
                      <audio controls src={mediaState.audioHiddenPreview} style={{ width: '100%' }} />
                    </div>
                  )}
                </>
              )}

              {recipe === 'cctv' && (
                <>
                  <div className="ccm-note">
                    Configure um detalhe oculto visível quando os agentes ativarem o modo Termal na câmera:
                  </div>
                  <label className="ccm-toggle-row">
                    <span className="ccm-toggle-title">Ativar anomalia no modo Termal</span>
                    <input
                      type="checkbox"
                      className="ccm-checkbox-input"
                      checked={thermalConfig.enabled}
                      onChange={(e) => setThermalConfig((t) => ({ ...t, enabled: e.target.checked }))}
                    />
                  </label>
                  {thermalConfig.enabled && (
                    <div className="ccm-field">
                      <label className="ccm-label">Texto / Código da Assinatura Termal</label>
                      <input
                        type="text"
                        className="ccm-input ccm-input-mono"
                        value={thermalConfig.secretText}
                        onChange={(e) => setThermalConfig((t) => ({ ...t, secretText: e.target.value }))}
                        placeholder="Ex: PORTA C — 03:14"
                      />
                    </div>
                  )}
                </>
              )}

              {recipe === 'terminal_lock' && (
                <>
                  <div className="ccm-field">
                    <label className="ccm-label">Texto Cifrado / Interceptado (Opcional)</label>
                    <textarea
                      className="ccm-input ccm-input-mono"
                      rows={3}
                      value={cipherState.cipherText}
                      onChange={(e) => setCipherState((c) => ({ ...c, cipherText: e.target.value }))}
                      placeholder="Cole ou escreva uma cifra para o decodificador..."
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="ccm-btn ccm-btn-sm" onClick={() => jumpToAdvancedTab('cifra')}>
                      Abrir Cifra, Hex & Enigma
                    </button>
                    <button
                      type="button"
                      className="ccm-btn ccm-btn-sm"
                      onClick={() => {
                        setCoreState((s) => ({ ...s, evidenceType: 'glitch_puzzle' }));
                        jumpToAdvancedTab('glitch');
                      }}
                    >
                      Transformar em Glitch Puzzle
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="ccm-list-stack">
              <div className="ccm-field">
                <label className="ccm-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} /> Ritmo da Investigação
                </label>
                <div className="ccm-grid-2">
                  <button
                    type="button"
                    className={`ccm-btn ${securityState.paceMode === 'in_session' ? 'ccm-btn-primary' : ''}`}
                    onClick={() => setSecurityState((s) => ({ ...s, paceMode: 'in_session' }))}
                  >
                    Em Cena (30s – 3min)
                  </button>
                  <button
                    type="button"
                    className={`ccm-btn ${securityState.paceMode === 'between_sessions' ? 'ccm-btn-primary' : ''}`}
                    onClick={() => setSecurityState((s) => ({ ...s, paceMode: 'between_sessions' }))}
                  >
                    Entre Sessões (Quarentena)
                  </button>
                </div>
              </div>

              <label className="ccm-toggle-row">
                <span className="ccm-toggle-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={14} /> Travar Pista com Senha Segura (Anti-F12)
                </span>
                <input
                  type="checkbox"
                  className="ccm-checkbox-input"
                  checked={securityState.isLocked}
                  onChange={(e) => setSecurityState((s) => ({ ...s, isLocked: e.target.checked }))}
                />
              </label>

              {securityState.isLocked && (
                <>
                  <div className="ccm-field">
                    <label className="ccm-label">Credencial (PIN, Padrão 3x3 ou Senha) *</label>
                    <input
                      type="text"
                      className="ccm-input ccm-input-mono"
                      value={securityState.lockPass}
                      onChange={(e) => setSecurityState((s) => ({ ...s, lockPass: e.target.value }))}
                      placeholder="Ex: 4812 (Keypad), 1-2-5-8 (Pattern), ou ECDISE (Terminal)"
                    />
                  </div>

                  <div className="ccm-field">
                    <label className="ccm-label">Dica de Calibração Assistida (C.R.I.S. / Teste de Perícia)</label>
                    <input
                      ref={assistHintRef}
                      type="text"
                      className="ccm-input"
                      value={securityState.assistHint}
                      onChange={(e) => setSecurityState((s) => ({ ...s, assistHint: e.target.value }))}
                      placeholder="Dica orgânica liberada se a mesa passar no teste de perícia..."
                    />
                  </div>

                  {rewardCandidates.length > 0 && (
                    <div className="ccm-field">
                      <label className="ccm-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Gift size={14} /> Recompensas Automáticas (Dead-Drop)
                      </label>
                      <div
                        style={{
                          maxHeight: 130,
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 5,
                          padding: 6,
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 6,
                        }}
                      >
                        {rewardCandidates.map((c) => {
                          const checked = (securityState.rewardCardIds || []).includes(c.id);
                          return (
                            <label
                              key={c.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}
                            >
                              <input type="checkbox" checked={checked} onChange={() => toggleRewardCard(c.id)} />
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.title || 'Sem título'}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: '1px 6px',
                                  borderRadius: 999,
                                  background: c.is_hidden ? 'rgba(230,57,70,0.25)' : 'rgba(16,185,129,0.2)',
                                  color: c.is_hidden ? '#fda4af' : '#6ee7b7',
                                }}
                              >
                                {c.is_hidden ? 'OCULTA' : 'VISÍVEL'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              <label className="ccm-toggle-row">
                <span className="ccm-toggle-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <EyeOff size={14} /> Começar Oculta no Mural (Ideal para Recompensa Dead-Drop)
                </span>
                <input
                  type="checkbox"
                  className="ccm-checkbox-input"
                  checked={coreState.isHidden}
                  onChange={(e) => setCoreState((s) => ({ ...s, isHidden: e.target.checked }))}
                />
              </label>
            </div>
          )}

          {/* Navegação Anterior / Próximo Passo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              className="ccm-btn ccm-btn-sm"
              disabled={step === 1}
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
            >
              <ChevronLeft size={14} /> Passo Anterior
            </button>
            {step < 3 ? (
              <button
                type="button"
                className="ccm-btn ccm-btn-sm ccm-btn-primary"
                onClick={() => setStep((s) => ((s + 1) as 1 | 2 | 3))}
              >
                Próximo Passo <ChevronRight size={14} />
              </button>
            ) : (
              <span className="ccm-note" style={{ alignSelf: 'center' }}>
                Tudo pronto! Clique em <strong>Salvar</strong> abaixo.
              </span>
            )}
          </div>
        </div>

        {/* Coluna Direita: Linter de Solubilidade (Anti Soft-Lock) */}
        <aside
          className="ccm-section"
          style={{
            background: 'rgba(10, 15, 24, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.22)',
            padding: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="ccm-label" style={{ margin: 0 }}>
              LINTER DE SOLUBILIDADE
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 999,
                textTransform: 'uppercase',
                background:
                  solvability.complexity === 'densa'
                    ? 'rgba(168, 85, 247, 0.25)'
                    : solvability.complexity === 'média'
                    ? 'rgba(251, 191, 36, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)',
                color:
                  solvability.complexity === 'densa'
                    ? '#d8b4fe'
                    : solvability.complexity === 'média'
                    ? '#fde68a'
                    : '#6ee7b7',
              }}
            >
              {solvability.complexity} · {solvability.estimatedMinutesLabel}
            </span>
          </div>

          {solvability.issues.length === 0 ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#6ee7b7' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Nenhum risco de soft-lock detectado. Ritmo e dependências alinhados para a mesa.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {solvability.issues.map((issue) => (
                <div
                  key={issue.id}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    fontSize: 11.5,
                    background:
                      issue.severity === 'warning'
                        ? 'rgba(251, 191, 36, 0.1)'
                        : 'rgba(56, 189, 248, 0.1)',
                    border:
                      issue.severity === 'warning'
                        ? '1px solid rgba(251, 191, 36, 0.35)'
                        : '1px solid rgba(56, 189, 248, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 3 }}>
                    {issue.severity === 'warning' ? (
                      <AlertTriangle size={13} color="#fbbf24" />
                    ) : (
                      <Info size={13} color="#38bdf8" />
                    )}
                    <span>{issue.title}</span>
                  </div>
                  <div style={{ opacity: 0.85, lineHeight: 1.35 }}>{issue.detail}</div>
                  {issue.quickFix && (
                    <button
                      type="button"
                      className="ccm-btn ccm-btn-sm"
                      style={{ marginTop: 6 }}
                      onClick={() => handleQuickFix(issue)}
                    >
                      {issue.quickFix === 'switch_between_sessions'
                        ? 'Mover para Entre Sessões'
                        : 'Adicionar Dica C.R.I.S.'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <HandoutStudioModal
        isOpen={showHandoutStudio}
        onClose={() => setShowHandoutStudio(false)}
        onApply={handleApplyHandout}
      />
    </div>
  );
}
