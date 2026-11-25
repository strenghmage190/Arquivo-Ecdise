import React, { useRef, useState } from 'react';
import {
  Upload,
  X,
  Lock,
  EyeOff,
  Image as ImageIcon,
  Music,
  Video,
  Sparkles,
} from 'lucide-react';
import { useClueModal } from '../../../contexts/ClueModalContext';

export default function QuickClueMode() {
  const {
    coreState,
    setCoreState,
    securityState,
    setSecurityState,
    mediaState,
    setMediaState,
    cipherState,
    thermalConfig,
    phoneState,
    personState,
    metadataState,
    insights,
    registerUrl,
    revokeUrl,
    setCreatorMode,
    setActiveTab,
  } = useClueModal();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const clearImage = () => {
    revokeUrl(mediaState.previewUrl);
    setMediaState((prev) => ({
      ...prev,
      imgFile: null,
      previewUrl: null,
      removedImage: true,
    }));
  };

  const clearAudio = () => {
    revokeUrl(mediaState.audioBasePreview);
    setMediaState((prev) => ({
      ...prev,
      audioBase: null,
      audioBasePreview: null,
      removedAudioBase: true,
    }));
  };

  const clearVideo = () => {
    revokeUrl(mediaState.videoPreviewUrl);
    setMediaState((prev) => ({
      ...prev,
      videoFile: null,
      videoPreviewUrl: null,
      videoUrl: null,
      videoUrlInput: '',
      removedVideo: true,
    }));
  };

  const jumpToAdvancedTab = (tabId: string) => {
    setCreatorMode('complete');
    setActiveTab(tabId);
  };

  // Advanced layer summary chips
  const advancedChips: { label: string; tab: string }[] = [];
  if (mediaState.uvFile || mediaState.uvPreviewUrl) {
    advancedChips.push({ label: 'Camada UV', tab: 'visual' });
  }
  if (mediaState.filterFile || mediaState.filterPreviewUrl) {
    advancedChips.push({ label: 'Filtro Óptico', tab: 'visual' });
  }
  if (thermalConfig.enabled || mediaState.thermalPreviewUrl) {
    advancedChips.push({ label: 'Térmico', tab: 'visual' });
  }
  if (mediaState.forensicFile || mediaState.forensicPreviewUrl) {
    advancedChips.push({ label: 'Forense RGB', tab: 'visual' });
  }
  if (mediaState.audioHidden || mediaState.audioHiddenPreview) {
    advancedChips.push({ label: 'Áudio Oculto', tab: 'audio' });
  }
  if (cipherState.isShredded || cipherState.cipherText || cipherState.hexCode) {
    advancedChips.push({ label: 'Cifra / Shredder', tab: 'cifra' });
  }
  if (coreState.evidenceType === 'glitch_puzzle' || securityState.securityLayerEnabled) {
    advancedChips.push({
      label: 'Glitch / Firewall',
      tab: coreState.evidenceType === 'glitch_puzzle' ? 'glitch' : 'seguranca',
    });
  }
  if (coreState.evidenceType === 'mega_clue') {
    advancedChips.push({ label: 'Mega-Pista', tab: 'mega' });
  }
  if (phoneState.hasKeypad || phoneState.chatList.length > 0) {
    advancedChips.push({ label: `Celular (${phoneState.chatList.length} msgs)`, tab: 'seguranca' });
  }
  if (personState.isPerson) {
    advancedChips.push({ label: 'Dossiê de Pessoa', tab: 'metadata' });
  }
  if (metadataState.stamp || metadataState.externalLink || metadataState.technicalNote) {
    advancedChips.push({ label: 'Metadados', tab: 'metadata' });
  }
  if (insights.length > 0) {
    advancedChips.push({ label: `${insights.length} Perícia(s)`, tab: 'geral' });
  }

  const activeVideoSrc =
    mediaState.videoPreviewUrl || mediaState.videoUrlInput.trim() || mediaState.videoUrl;

  return (
    <div className="ccm-tab-stack">
      <div className="ccm-section" style={{ padding: '10px 12px' }}>
        <div className="ccm-label" style={{ marginBottom: 6 }}>ASSISTENTE POR INTENÇÃO (ATALHO DO MESTRE)</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" className="ccm-chip" onClick={() => jumpToAdvancedTab('visual')}>
            Documento com Tinta Oculta / Rasgado
          </button>
          <button type="button" className="ccm-chip" onClick={() => jumpToAdvancedTab('audio')}>
            Gravação com Sinal Escondido (48 kHz)
          </button>
          <button type="button" className="ccm-chip" onClick={() => jumpToAdvancedTab('seguranca')}>
            Celular Apreendido (Multi-App)
          </button>
          <button
            type="button"
            className="ccm-chip"
            onClick={() => {
              setCoreState((s) => ({ ...s, evidenceType: 'glitch_puzzle' }));
              jumpToAdvancedTab('glitch');
            }}
          >
            Arquivo Corrompido (Glitch)
          </button>
        </div>
      </div>

      {advancedChips.length > 0 && (
        <div className="ccm-chips-row">
          <span className="ccm-note" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} color="var(--ccm-accent)" /> Camadas avançadas ativas:
          </span>
          {advancedChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className="ccm-chip"
              onClick={() => jumpToAdvancedTab(chip.tab)}
              title={`Editar na aba ${chip.tab}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="ccm-grid-2">
        <div className="ccm-section">
          <div className="ccm-field">
            <label className="ccm-label">Título da Pista *</label>
            <input
              type="text"
              className="ccm-input"
              value={coreState.title}
              onChange={(e) => setCoreState((s) => ({ ...s, title: e.target.value }))}
              maxLength={100}
              placeholder="Ex: Bilhete Rasgado, Gravação da Recepção..."
              autoFocus
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Descrição Pública (Visível aos jogadores)</label>
            <textarea
              className="ccm-input"
              value={coreState.descPublic}
              onChange={(e) => setCoreState((s) => ({ ...s, descPublic: e.target.value }))}
              rows={3}
              maxLength={1000}
              placeholder="O que os jogadores veem imediatamente ao inspecionar..."
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Notas Confidenciais do Mestre (Apenas GM)</label>
            <textarea
              className="ccm-input"
              value={coreState.descHidden}
              onChange={(e) => setCoreState((s) => ({ ...s, descHidden: e.target.value }))}
              rows={3}
              maxLength={2000}
              placeholder="Contexto secreto, respostas esperadas ou ganchos narrativos..."
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Tags (separadas por vírgula)</label>
            <input
              type="text"
              className="ccm-input"
              value={coreState.tags}
              onChange={(e) => setCoreState((s) => ({ ...s, tags: e.target.value }))}
              placeholder="Ex: suspeito, laboratório, chave"
            />
          </div>
        </div>

        <div className="ccm-section">
          <div className="ccm-field">
            <label className="ccm-label">Mídia Principal (Imagem, Áudio ou Vídeo)</label>
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
              <Upload size={22} color="var(--ccm-accent)" />
              <div className="ccm-dropzone-title">
                Arraste uma Imagem, Áudio ou Vídeo aqui
              </div>
              <div className="ccm-dropzone-sub">
                ou clique para selecionar do computador
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,audio/*,video/*"
                hidden
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Ou URL de Vídeo (YouTube / MP4 direto)</label>
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

          {mediaState.previewUrl && (
            <div className="ccm-preview-box">
              <div className="ccm-preview-head">
                <span>
                  <ImageIcon size={13} /> Imagem anexada
                </span>
                <button type="button" className="ccm-btn ccm-btn-sm ccm-btn-danger" onClick={clearImage}>
                  <X size={13} /> Remover
                </button>
              </div>
              <img
                src={mediaState.previewUrl}
                alt="Preview"
                className="ccm-preview-media"
              />
            </div>
          )}

          {mediaState.audioBasePreview && (
            <div className="ccm-preview-box">
              <div className="ccm-preview-head">
                <span>
                  <Music size={13} /> Áudio anexado
                </span>
                <button type="button" className="ccm-btn ccm-btn-sm ccm-btn-danger" onClick={clearAudio}>
                  <X size={13} /> Remover
                </button>
              </div>
              <audio controls src={mediaState.audioBasePreview} className="ccm-audio-player" />
            </div>
          )}

          {activeVideoSrc && (
            <div className="ccm-preview-box">
              <div className="ccm-preview-head">
                <span>
                  <Video size={13} /> Vídeo anexado
                </span>
                <button type="button" className="ccm-btn ccm-btn-sm ccm-btn-danger" onClick={clearVideo}>
                  <X size={13} /> Remover
                </button>
              </div>
              {mediaState.videoPreviewUrl ? (
                <video
                  controls
                  src={mediaState.videoPreviewUrl}
                  className="ccm-preview-media"
                />
              ) : (
                <div className="ccm-note" style={{ color: 'var(--ccm-accent)', wordBreak: 'break-all' }}>
                  {activeVideoSrc}
                </div>
              )}
            </div>
          )}

          <div className="ccm-grid-2">
            <div className="ccm-field">
              <label className="ccm-toggle-row">
                <span className="ccm-toggle-text">
                  <span className="ccm-toggle-title">
                    <Lock size={14} /> Bloquear com Senha
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="ccm-checkbox-input"
                  checked={securityState.isLocked}
                  onChange={(e) =>
                    setSecurityState((s) => ({ ...s, isLocked: e.target.checked }))
                  }
                />
              </label>
              {securityState.isLocked && (
                <input
                  type="text"
                  className="ccm-input"
                  value={securityState.lockPass}
                  onChange={(e) =>
                    setSecurityState((s) => ({ ...s, lockPass: e.target.value }))
                  }
                  placeholder="Senha de desbloqueio *"
                />
              )}
            </div>

            <div className="ccm-field">
              <label className="ccm-toggle-row">
                <span className="ccm-toggle-text">
                  <span className="ccm-toggle-title">
                    <EyeOff size={14} /> Pista Oculta (Código)
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="ccm-checkbox-input"
                  checked={coreState.isHidden}
                  onChange={(e) =>
                    setCoreState((s) => ({ ...s, isHidden: e.target.checked }))
                  }
                />
              </label>
              {coreState.isHidden && (
                <input
                  type="text"
                  className="ccm-input ccm-input-mono"
                  value={coreState.discoveryCode}
                  onChange={(e) =>
                    setCoreState((s) => ({
                      ...s,
                      discoveryCode: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Código de descoberta (Ex: ECDISE-07) *"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
