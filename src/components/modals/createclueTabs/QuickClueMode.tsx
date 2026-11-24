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
  Wrench,
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
    <div className="cc-tab-content cc-quick-mode">
      <div className="cc-quick-banner">
        <div>
          <strong style={{ color: 'var(--cc-neon)', fontSize: 13, letterSpacing: 1 }}>
            ⚡ MODO RÁPIDO
          </strong>
          <div style={{ fontSize: 12, color: 'var(--cc-text-muted)', marginTop: 2 }}>
            Crie uma pista completa em segundos. Precisa de UV, Cifra, Áudio Oculto ou Glitch? Troque para o Modo Completo a qualquer momento.
          </div>
        </div>
        <button
          type="button"
          className="cc-btn cc-btn-cancel"
          style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
          onClick={() => setCreatorMode('complete')}
        >
          <Wrench size={14} /> Abrir 10 Abas
        </button>
      </div>

      {advancedChips.length > 0 && (
        <div className="cc-quick-chips-row">
          <span style={{ fontSize: 11, color: 'var(--cc-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} color="var(--cc-neon)" /> Camadas avançadas ativas:
          </span>
          {advancedChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className="cc-quick-chip"
              onClick={() => jumpToAdvancedTab(chip.tab)}
              title={`Editar na aba ${chip.tab}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="cc-quick-grid">
        <div className="cc-quick-col">
          <div className="cc-field">
            <label className="cc-label">Título da Pista *</label>
            <input
              type="text"
              className="cc-input"
              value={coreState.title}
              onChange={(e) => setCoreState((s) => ({ ...s, title: e.target.value }))}
              maxLength={100}
              placeholder="Ex: Bilhete Rasgado, Gravação da Recepção..."
              autoFocus
            />
          </div>

          <div className="cc-field">
            <label className="cc-label">Descrição Pública (Visível aos jogadores)</label>
            <textarea
              className="cc-input"
              value={coreState.descPublic}
              onChange={(e) => setCoreState((s) => ({ ...s, descPublic: e.target.value }))}
              rows={3}
              maxLength={1000}
              placeholder="O que os jogadores veem imediatamente ao inspecionar..."
            />
          </div>

          <div className="cc-field">
            <label className="cc-label">Notas Confidenciais do Mestre (Apenas GM)</label>
            <textarea
              className="cc-input"
              value={coreState.descHidden}
              onChange={(e) => setCoreState((s) => ({ ...s, descHidden: e.target.value }))}
              rows={3}
              maxLength={2000}
              placeholder="Contexto secreto, respostas esperadas ou ganchos narrativos..."
            />
          </div>

          <div className="cc-field">
            <label className="cc-label">Tags (separadas por vírgula)</label>
            <input
              type="text"
              className="cc-input"
              value={coreState.tags}
              onChange={(e) => setCoreState((s) => ({ ...s, tags: e.target.value }))}
              placeholder="Ex: suspeito, laboratório, chave"
            />
          </div>
        </div>

        <div className="cc-quick-col">
          <div className="cc-field">
            <label className="cc-label">Mídia Principal (Imagem, Áudio ou Vídeo)</label>
            <div
              className={`cc-quick-dropzone ${isDragging ? 'dragging' : ''}`}
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
              <Upload size={22} color="var(--cc-neon)" />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                Arraste uma Imagem, Áudio ou Vídeo aqui
              </div>
              <div style={{ fontSize: 11, color: 'var(--cc-text-muted)' }}>
                ou clique para selecionar do computador
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,audio/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          <div className="cc-field">
            <label className="cc-label">Ou URL de Vídeo (YouTube / MP4 direto)</label>
            <input
              type="text"
              className="cc-input"
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

          {/* Previews */}
          {mediaState.previewUrl && (
            <div className="cc-quick-media-preview">
              <div className="cc-quick-media-head">
                <span>
                  <ImageIcon size={13} /> Imagem anexada
                </span>
                <button type="button" className="cc-quick-remove-btn" onClick={clearImage}>
                  <X size={13} /> Remover
                </button>
              </div>
              <img
                src={mediaState.previewUrl}
                alt="Preview"
                style={{ maxHeight: 150, width: '100%', objectFit: 'contain', borderRadius: 4, background: '#05070a' }}
              />
            </div>
          )}

          {mediaState.audioBasePreview && (
            <div className="cc-quick-media-preview">
              <div className="cc-quick-media-head">
                <span>
                  <Music size={13} /> Áudio anexado
                </span>
                <button type="button" className="cc-quick-remove-btn" onClick={clearAudio}>
                  <X size={13} /> Remover
                </button>
              </div>
              <audio controls src={mediaState.audioBasePreview} style={{ width: '100%' }} />
            </div>
          )}

          {activeVideoSrc && (
            <div className="cc-quick-media-preview">
              <div className="cc-quick-media-head">
                <span>
                  <Video size={13} /> Vídeo anexado
                </span>
                <button type="button" className="cc-quick-remove-btn" onClick={clearVideo}>
                  <X size={13} /> Remover
                </button>
              </div>
              {mediaState.videoPreviewUrl ? (
                <video
                  controls
                  src={mediaState.videoPreviewUrl}
                  style={{ maxHeight: 140, width: '100%', borderRadius: 4, background: '#000' }}
                />
              ) : (
                <div style={{ fontSize: 12, color: 'var(--cc-neon)', wordBreak: 'break-all' }}>
                  {activeVideoSrc}
                </div>
              )}
            </div>
          )}

          {/* Security & Hidden */}
          <div className="cc-quick-toggles">
            <div className="cc-quick-toggle-card">
              <label className="cc-checkbox">
                <input
                  type="checkbox"
                  checked={securityState.isLocked}
                  onChange={(e) =>
                    setSecurityState((s) => ({ ...s, isLocked: e.target.checked }))
                  }
                />
                <span className="cc-checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={14} /> Bloquear com Senha
                </span>
              </label>
              {securityState.isLocked && (
                <input
                  type="text"
                  className="cc-input"
                  style={{ marginTop: 8 }}
                  value={securityState.lockPass}
                  onChange={(e) =>
                    setSecurityState((s) => ({ ...s, lockPass: e.target.value }))
                  }
                  placeholder="Senha de desbloqueio *"
                />
              )}
            </div>

            <div className="cc-quick-toggle-card">
              <label className="cc-checkbox">
                <input
                  type="checkbox"
                  checked={coreState.isHidden}
                  onChange={(e) =>
                    setCoreState((s) => ({ ...s, isHidden: e.target.checked }))
                  }
                />
                <span className="cc-checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <EyeOff size={14} /> Pista Oculta (Código)
                </span>
              </label>
              {coreState.isHidden && (
                <input
                  type="text"
                  className="cc-input"
                  style={{ marginTop: 8, textTransform: 'uppercase' }}
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
