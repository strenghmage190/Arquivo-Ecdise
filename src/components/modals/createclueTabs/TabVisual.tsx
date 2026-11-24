import React, { useRef, useState } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import {
  Info,
  Image as ImageIcon,
  Sliders,
  Video,
  Trash2,
  Upload,
  Smartphone,
  Edit3,
  Layers,
  Eye,
  Thermometer,
  Palette,
  Sparkles,
} from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { toast } from 'sonner';
import { validateImageFile } from '../../../utils/fileValidators';
import { validateFile } from '../../../utils/storage';

type AlignLayerKey = 'uv' | 'thermal' | 'forensic' | 'filter';

const UNIFORM_BTN_STYLE: React.CSSProperties = {
  minHeight: 38,
  flex: '1 1 160px',
  justifyContent: 'center',
  alignItems: 'center',
  display: 'inline-flex',
  gap: 6,
  whiteSpace: 'nowrap',
};

const COMPACT_DANGER_BTN_STYLE: React.CSSProperties = {
  minHeight: 38,
  borderColor: '#ff4444',
  color: '#ff6666',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  flex: '0 1 auto',
};

export default function TabVisual() {
  const {
    mediaState,
    setMediaState,
    setEditorState,
    filterConfig,
    setFilterConfig,
    thermalConfig,
    setThermalConfig,
    registerUrl,
    revokeUrl,
    setActiveTab,
  } = useClueModal();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const uvPngInputRef = useRef<HTMLInputElement>(null);
  const filterPngInputRef = useRef<HTMLInputElement>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // Simple visual alignment overlay state
  const [alignLayer, setAlignLayer] = useState<AlignLayerKey>('uv');
  const [alignOpacity, setAlignOpacity] = useState<number>(75);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const validation = validateImageFile(file, 10 * 1024 * 1024, [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ]);
    if (!validation.ok) {
      toast.error(validation.reason || 'Imagem inválida.');
      e.target.value = '';
      return;
    }
    revokeUrl(mediaState.previewUrl);
    const url = URL.createObjectURL(file);
    registerUrl(url);
    setMediaState((s) => ({
      ...s,
      imgFile: file,
      previewUrl: url,
      removedImage: false,
    }));
    e.target.value = '';
  };

  const handleRemoveBaseImage = () => {
    revokeUrl(mediaState.previewUrl);
    setMediaState((s) => ({
      ...s,
      imgFile: null,
      previewUrl: null,
      removedImage: true,
    }));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const validation = validateFile(file, 'video');
    if (!validation.valid) {
      toast.error(validation.error || 'Vídeo inválido (máx 100MB).');
      e.target.value = '';
      return;
    }
    revokeUrl(mediaState.videoPreviewUrl);
    const url = URL.createObjectURL(file);
    registerUrl(url);
    setMediaState((s) => ({
      ...s,
      videoFile: file,
      videoPreviewUrl: url,
      removedVideo: false,
    }));
    e.target.value = '';
  };

  const handleRemoveVideo = () => {
    revokeUrl(mediaState.videoPreviewUrl);
    setMediaState((s) => ({
      ...s,
      videoFile: null,
      videoPreviewUrl: null,
      videoUrl: null,
      videoUrlInput: '',
      removedVideo: true,
    }));
  };

  const handleUvPngUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const validation = validateImageFile(file, 10 * 1024 * 1024, ['image/png', 'image/webp']);
    if (!validation.ok) {
      toast.error(validation.reason || 'Envie um arquivo PNG válido para a camada UV.');
      e.target.value = '';
      return;
    }
    revokeUrl(mediaState.uvPreviewUrl);
    const url = URL.createObjectURL(file);
    registerUrl(url);
    setMediaState((s) => ({
      ...s,
      uvFile: file,
      uvPreviewUrl: url,
      removedUv: false,
    }));
    setAlignLayer('uv');
    e.target.value = '';
  };

  const handleRemoveUv = () => {
    revokeUrl(mediaState.uvPreviewUrl);
    setMediaState((s) => ({
      ...s,
      uvFile: null,
      uvPreviewUrl: null,
      removedUv: true,
    }));
  };

  const handleFilterPngUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const validation = validateImageFile(file, 10 * 1024 * 1024, [
      'image/png',
      'image/webp',
      'image/jpeg',
    ]);
    if (!validation.ok) {
      toast.error(validation.reason || 'Envie uma imagem válida para a camada de filtro.');
      e.target.value = '';
      return;
    }
    revokeUrl(mediaState.filterPreviewUrl);
    const url = URL.createObjectURL(file);
    registerUrl(url);
    setMediaState((s) => ({
      ...s,
      filterFile: file,
      filterPreviewUrl: url,
      removedFilter: false,
    }));
    setFilterConfig((fc) => ({
      brightness: fc.brightness === 100 && fc.contrast === 100 ? 150 : fc.brightness,
      contrast: fc.contrast === 100 && fc.brightness === 100 ? 150 : fc.contrast,
      saturate: fc.saturate,
      transform: fc.transform || { left: 25, top: 25, width: 50, height: 50 },
    }));
    setAlignLayer('filter');
    e.target.value = '';
  };

  const handleRemoveFilter = () => {
    revokeUrl(mediaState.filterPreviewUrl);
    setMediaState((s) => ({
      ...s,
      filterFile: null,
      filterPreviewUrl: null,
      removedFilter: true,
    }));
    setFilterConfig((fc) => ({ ...fc, transform: null }));
  };

  const handleRemoveThermal = () => {
    revokeUrl(mediaState.thermalPreviewUrl);
    setMediaState((s) => ({
      ...s,
      thermalFile: null,
      thermalPreviewUrl: null,
      removedThermal: true,
    }));
    setThermalConfig((t) => ({ ...t, enabled: false }));
  };

  const handleRemoveForensic = () => {
    revokeUrl(mediaState.forensicPreviewUrl);
    setMediaState((s) => ({
      ...s,
      forensicFile: null,
      forensicPreviewUrl: null,
      forensicTargetChannel: null,
      removedForensic: true,
    }));
  };

  const openThermalEditor = () => {
    if (!mediaState.previewUrl) return;
    if (!thermalConfig?.enabled) {
      setThermalConfig((s) => ({ ...s, enabled: true }));
    }
    setEditorState((s) => ({ ...s, showThermalEditor: true }));
  };

  const filterTransform = filterConfig.transform || { left: 25, top: 25, width: 50, height: 50 };

  // Available overlay layers for the Visual Alignment conference preview
  const availableAlignLayers: { key: AlignLayerKey; label: string; url: string; color: string }[] =
    [
      mediaState.uvPreviewUrl
        ? { key: 'uv', label: 'UV', url: mediaState.uvPreviewUrl, color: '#b366ff' }
        : null,
      mediaState.thermalPreviewUrl
        ? { key: 'thermal', label: 'Termal', url: mediaState.thermalPreviewUrl, color: '#ff9500' }
        : null,
      mediaState.forensicPreviewUrl
        ? {
            key: 'forensic',
            label: `RGB${mediaState.forensicTargetChannel ? ` (${mediaState.forensicTargetChannel})` : ''}`,
            url: mediaState.forensicPreviewUrl,
            color: '#00ff9d',
          }
        : null,
      mediaState.filterPreviewUrl
        ? { key: 'filter', label: 'Filtro', url: mediaState.filterPreviewUrl, color: '#38bdf8' }
        : null,
    ].filter(Boolean) as { key: AlignLayerKey; label: string; url: string; color: string }[];

  const activeAlignObj =
    availableAlignLayers.find((l) => l.key === alignLayer) || availableAlignLayers[0] || null;

  const comparativeCards: {
    id: 'base' | 'uv' | 'thermal' | 'rgb';
    title: string;
    accent: string;
    url: string | null;
    active: boolean;
    badge?: string;
    onEdit: () => void;
    onRemove?: () => void;
    onSelectPreview?: () => void;
    editDisabled?: boolean;
  }[] = [
    {
      id: 'base',
      title: 'Base',
      accent: '#00f3ff',
      url: mediaState.previewUrl,
      active: Boolean(mediaState.previewUrl),
      onEdit: () => fileInputRef.current?.click(),
      onRemove: mediaState.previewUrl ? handleRemoveBaseImage : undefined,
    },
    {
      id: 'uv',
      title: 'UV',
      accent: '#b366ff',
      url: mediaState.uvPreviewUrl,
      active: Boolean(mediaState.uvPreviewUrl),
      onEdit: () => setEditorState((s) => ({ ...s, editorMode: 'uv' })),
      onRemove: mediaState.uvPreviewUrl ? handleRemoveUv : undefined,
      onSelectPreview: mediaState.uvPreviewUrl ? () => setAlignLayer('uv') : undefined,
      editDisabled: !mediaState.previewUrl,
    },
    {
      id: 'thermal',
      title: 'Termal',
      accent: '#ff9500',
      url: mediaState.thermalPreviewUrl,
      active: Boolean(mediaState.thermalPreviewUrl || thermalConfig?.enabled),
      badge: thermalConfig?.enabled && !mediaState.thermalPreviewUrl ? 'TEXTO' : undefined,
      onEdit: openThermalEditor,
      onRemove:
        mediaState.thermalPreviewUrl || thermalConfig?.enabled ? handleRemoveThermal : undefined,
      onSelectPreview: mediaState.thermalPreviewUrl ? () => setAlignLayer('thermal') : undefined,
      editDisabled: !mediaState.previewUrl,
    },
    {
      id: 'rgb',
      title: 'RGB',
      accent: '#00ff9d',
      url: mediaState.forensicPreviewUrl,
      active: Boolean(mediaState.forensicPreviewUrl),
      badge: mediaState.forensicTargetChannel ? `CH ${mediaState.forensicTargetChannel}` : undefined,
      onEdit: () => setEditorState((s) => ({ ...s, showForensicEditor: true })),
      onRemove: mediaState.forensicPreviewUrl ? handleRemoveForensic : undefined,
      onSelectPreview: mediaState.forensicPreviewUrl ? () => setAlignLayer('forensic') : undefined,
      editDisabled: !mediaState.previewUrl,
    },
  ];

  return (
    <div className="cc-tab-content">
      {/* IMAGEM BASE */}
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          IMAGEM BASE
          <span data-tooltip-id="base-image-tip" style={{ cursor: 'help' }}>
            <Info size={16} color="var(--nexus-text-muted, #666)" />
          </span>
        </h3>
        <Tooltip id="base-image-tip" className="cyber-tooltip">
          A imagem principal exibida ao clicar na pista (máx 10MB).
        </Tooltip>
      </div>

      <div style={{ marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={handleImageSelect}
        />
        <button
          type="button"
          className="cc-btn cc-btn-save"
          style={UNIFORM_BTN_STYLE}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={16} /> Selecionar Imagem Base
        </button>
        {mediaState.previewUrl && (
          <button
            type="button"
            className="cc-btn cc-btn-cancel"
            style={COMPACT_DANGER_BTN_STYLE}
            onClick={handleRemoveBaseImage}
          >
            <Trash2 size={16} /> Remover
          </button>
        )}
      </div>

      {/* FAIXA COMPARATIVA DE MINIATURAS: BASE | UV | TERMAL | RGB */}
      <div
        style={{
          marginTop: 12,
          marginBottom: 16,
          padding: 12,
          background: 'rgba(0, 243, 255, 0.03)',
          border: '1px solid rgba(0, 243, 255, 0.18)',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.2,
              color: '#00f3ff',
              textTransform: 'uppercase',
            }}
          >
            <Layers size={14} /> PAINEL COMPARATIVO DE CAMADAS (BASE | UV | TERMAL | RGB)
          </span>
          <span style={{ fontSize: 11, color: '#8ea3b0' }}>
            {comparativeCards.filter((c) => c.active).length}/4 ativas
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
            gap: 10,
          }}
        >
          {comparativeCards.map((card) => (
            <div
              key={card.id}
              onClick={card.onSelectPreview}
              style={{
                borderRadius: 7,
                padding: 8,
                background: card.active ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.35)',
                border: `1px solid ${card.active ? card.accent : 'rgba(255,255,255,0.1)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                cursor: card.onSelectPreview ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: card.active ? card.accent : '#7c8b96' }}>
                  {card.title}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    padding: '2px 5px',
                    borderRadius: 4,
                    background: card.active ? `${card.accent}22` : 'rgba(255,255,255,0.06)',
                    color: card.active ? card.accent : '#667580',
                    fontWeight: 700,
                  }}
                >
                  {card.badge || (card.active ? 'ATIVA' : 'OFF')}
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 10',
                  borderRadius: 5,
                  background: '#05080c',
                  border: '1px dashed rgba(255,255,255,0.12)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {card.url ? (
                  <img
                    src={card.url}
                    alt={card.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: 10, color: '#556570', textAlign: 'center', padding: 4 }}>
                    {card.active ? 'Ativa (Texto)' : 'Sem camada'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="cc-btn cc-btn-cancel"
                  disabled={card.editDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    card.onEdit();
                  }}
                  style={{
                    flex: 1,
                    minHeight: 32,
                    padding: '4px 6px',
                    fontSize: 11,
                    justifyContent: 'center',
                    opacity: card.editDisabled ? 0.45 : 1,
                  }}
                >
                  <Edit3 size={12} /> Editar
                </button>
                {card.onRemove && (
                  <button
                    type="button"
                    className="cc-btn cc-btn-cancel"
                    onClick={(e) => {
                      e.stopPropagation();
                      card.onRemove?.();
                    }}
                    title={`Remover ${card.title}`}
                    style={{
                      minHeight: 32,
                      padding: '4px 8px',
                      borderColor: '#ff4444',
                      color: '#ff6666',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ALINHAMENTO VISUAL SIMPLES (SOBREPOSIÇÃO + OPACIDADE DE CONFERÊNCIA) */}
        {mediaState.previewUrl && activeAlignObj && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: '#cbd5e1',
                  fontWeight: 700,
                }}
              >
                <Eye size={13} color={activeAlignObj.color} /> Alinhamento Visual (Conferência)
              </span>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {availableAlignLayers.map((layer) => (
                  <button
                    key={layer.key}
                    type="button"
                    onClick={() => setAlignLayer(layer.key)}
                    style={{
                      padding: '4px 9px',
                      minHeight: 28,
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer',
                      border: `1px solid ${
                        activeAlignObj.key === layer.key ? layer.color : 'rgba(255,255,255,0.16)'
                      }`,
                      background:
                        activeAlignObj.key === layer.key ? `${layer.color}22` : 'rgba(0,0,0,0.4)',
                      color: activeAlignObj.key === layer.key ? '#fff' : '#94a3b8',
                    }}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: 260,
                borderRadius: 6,
                overflow: 'hidden',
                background: '#020406',
                border: `1px solid ${activeAlignObj.color}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                <img
                  src={mediaState.previewUrl}
                  alt="Base alinhamento"
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: 256,
                    width: 'auto',
                    height: 'auto',
                  }}
                />
                <img
                  src={activeAlignObj.url}
                  alt={`Sobreposição ${activeAlignObj.label}`}
                  style={
                    activeAlignObj.key === 'filter'
                      ? {
                          position: 'absolute',
                          left: `${filterTransform.left}%`,
                          top: `${filterTransform.top}%`,
                          width: `${filterTransform.width}%`,
                          height: `${filterTransform.height}%`,
                          objectFit: 'contain',
                          opacity: alignOpacity / 100,
                          pointerEvents: 'none',
                          outline: '1px dashed #38bdf8',
                        }
                      : {
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          opacity: alignOpacity / 100,
                          pointerEvents: 'none',
                        }
                  }
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: 11, color: '#9bb3c2', whiteSpace: 'nowrap' }}>
                Opacidade da Camada: <strong>{alignOpacity}%</strong>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={alignOpacity}
                onChange={(e) => setAlignOpacity(Number(e.target.value))}
                style={{ flex: 1, accentColor: activeAlignObj.color }}
              />
            </div>
          </div>
        )}
      </div>

      <hr className="cc-divider" style={{ margin: '20px 0' }} />

      {/* VÍDEO */}
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Video size={18} />
          VÍDEO (OPCIONAL)
        </h3>
        <span data-tooltip-id="video-tip" style={{ cursor: 'help', marginLeft: '10px' }}>
          [ ? ]
        </span>
        <Tooltip id="video-tip" className="cyber-tooltip">
          Se você adicionar um vídeo (ou URL de YouTube/Vimeo), ele terá prioridade sobre a imagem base.
        </Tooltip>
      </div>

      <div className="cc-field" style={{ marginTop: '0.75rem' }}>
        <label className="cc-label">URL do Vídeo (YouTube, Vimeo, mp4 externo)</label>
        <input
          type="text"
          className="cc-input"
          value={mediaState.videoUrlInput}
          onChange={(e) =>
            setMediaState((s) => ({
              ...s,
              videoUrlInput: e.target.value,
              removedVideo: !e.target.value.trim() && !s.videoFile,
            }))
          }
          placeholder="Ex: https://youtube.com/watch?v=..."
        />
      </div>

      <div style={{ marginTop: '0.75rem', textAlign: 'center', color: '#888', fontSize: '12px' }}>
        -- OU --
      </div>

      <div style={{ marginTop: '0.75rem', marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          hidden
          ref={videoInputRef}
          onChange={handleVideoSelect}
        />
        <button
          type="button"
          className="cc-btn cc-btn-save"
          style={UNIFORM_BTN_STYLE}
          onClick={() => videoInputRef.current?.click()}
        >
          <Video size={16} /> Selecionar Arquivo de Vídeo (Máx 100MB)
        </button>
        {(mediaState.videoPreviewUrl || mediaState.videoUrlInput) && (
          <button
            type="button"
            className="cc-btn cc-btn-cancel"
            style={COMPACT_DANGER_BTN_STYLE}
            onClick={handleRemoveVideo}
          >
            <Trash2 size={16} /> Remover Vídeo
          </button>
        )}
      </div>

      {mediaState.videoPreviewUrl && (
        <div className="cc-media-grid">
          <video src={mediaState.videoPreviewUrl} controls style={{ maxWidth: '100%', maxHeight: 260 }} />
        </div>
      )}

      <hr className="cc-divider" />

      {/* FAKE PHONE */}
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smartphone size={18} /> MODO FAKE PHONE / CHAT
        </h3>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: 12,
          background: 'rgba(0, 255, 255, 0.04)',
          border: '1px solid var(--cc-border)',
          borderRadius: 6,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--cc-text)', flex: '1 1 220px' }}>
          O construtor de Celular Fake e Bloqueio (PIN/Padrão) fica unificado na aba <strong>Segurança</strong>.
        </span>
        <button
          type="button"
          className="cc-btn cc-btn-save"
          style={{ minHeight: 38 }}
          onClick={() => setActiveTab('seguranca')}
        >
          <Smartphone size={15} /> Configurar Celular
        </button>
      </div>

      <hr className="cc-divider" />

      {/* CAMADA UV */}
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#b366ff" /> Camada UV / Luz Negra
          <span data-tooltip-id="uv-light-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="var(--nexus-neon, #00ffff)" />
          </span>
        </h3>
        <Tooltip id="uv-light-tip" className="cyber-tooltip">
          <span className="cyber-tooltip-title">[ LUZ NEGRA ]</span>
          Permite revelar uma camada oculta ao arrastar a lanterna de luz negra sobre a imagem.
        </Tooltip>
      </div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input type="file" accept="image/png,image/webp" hidden ref={uvPngInputRef} onChange={handleUvPngUpload} />
        <button
          type="button"
          className="cc-btn cc-btn-save"
          style={{ ...UNIFORM_BTN_STYLE, opacity: mediaState.previewUrl ? 1 : 0.5 }}
          disabled={!mediaState.previewUrl}
          onClick={() => setEditorState((s) => ({ ...s, editorMode: 'uv' }))}
        >
          <ImageIcon size={16} /> Desenhar Efeito UV
        </button>
        <button
          type="button"
          className="cc-btn cc-btn-cancel"
          style={UNIFORM_BTN_STYLE}
          onClick={() => uvPngInputRef.current?.click()}
        >
          <Upload size={16} /> Upload PNG UV
        </button>
        {mediaState.uvPreviewUrl && (
          <button
            type="button"
            className="cc-btn cc-btn-cancel"
            style={COMPACT_DANGER_BTN_STYLE}
            onClick={handleRemoveUv}
          >
            <Trash2 size={16} /> Remover UV
          </button>
        )}
      </div>

      <hr className="cc-divider" />

      {/* CAMADA TÉRMICA */}
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Thermometer size={16} color="#ff9500" /> Camada Térmica
          <span data-tooltip-id="thermal-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="var(--nexus-neon, #00ffff)" />
          </span>
        </h3>
        <Tooltip id="thermal-tip" className="cyber-tooltip">
          <span className="cyber-tooltip-title">[ TÉRMICA ]</span>
          Assinaturas de calor/frio, carimbos térmicos e textos ocultos revelados na visão térmica.
        </Tooltip>
      </div>

      <div style={{ marginBottom: 12, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="cc-btn cc-btn-save"
          style={{
            ...UNIFORM_BTN_STYLE,
            opacity: mediaState.previewUrl ? 1 : 0.5,
            background: thermalConfig?.enabled ? 'var(--nexus-neon, #00ffff)' : '',
            color: thermalConfig?.enabled ? '#000' : '',
          }}
          disabled={!mediaState.previewUrl}
          onClick={() => setThermalConfig((s) => ({ ...s, enabled: !s.enabled }))}
        >
          <Info size={16} /> {thermalConfig?.enabled ? 'Térmica: ON' : 'Ativar Térmica'}
        </button>

        <button
          type="button"
          className="cc-btn cc-btn-cancel"
          style={{ ...UNIFORM_BTN_STYLE, opacity: mediaState.previewUrl ? 1 : 0.5 }}
          disabled={!mediaState.previewUrl}
          onClick={openThermalEditor}
        >
          <Thermometer size={16} /> Abrir Editor Térmico
        </button>

        {(thermalConfig?.enabled || mediaState.thermalPreviewUrl) && (
          <button
            type="button"
            className="cc-btn cc-btn-cancel"
            style={COMPACT_DANGER_BTN_STYLE}
            onClick={handleRemoveThermal}
          >
            <Trash2 size={16} /> Remover Térmica
          </button>
        )}
      </div>

      {thermalConfig?.enabled && (
        <div
          style={{
            padding: 12,
            background: 'rgba(255, 100, 0, 0.05)',
            borderRadius: 6,
            border: '1px solid rgba(255, 100, 0, 0.2)',
            marginBottom: 16,
          }}
        >
          <div className="cc-field" style={{ marginBottom: 10 }}>
            <label className="cc-label">Texto Oculto</label>
            <textarea
              className="cc-input"
              rows={3}
              value={thermalConfig.secretText}
              onChange={(e) => setThermalConfig((s) => ({ ...s, secretText: e.target.value }))}
              placeholder="Ex: COORDENADAS: 45.123, -12.456"
            />
          </div>
          <div className="cc-field" style={{ marginBottom: 10 }}>
            <label className="cc-label">Senha / Keyword (Opcional)</label>
            <input
              type="text"
              className="cc-input"
              value={thermalConfig.keyword}
              onChange={(e) => setThermalConfig((s) => ({ ...s, keyword: e.target.value.toUpperCase() }))}
              placeholder="Deixe em branco para revelar automaticamente"
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="cc-field" style={{ flex: '1 1 130px' }}>
              <label className="cc-label">Tamanho da Fonte</label>
              <input
                type="number"
                className="cc-input"
                value={thermalConfig.fontSize}
                onChange={(e) => setThermalConfig((s) => ({ ...s, fontSize: parseInt(e.target.value) || 24 }))}
              />
            </div>
            <div className="cc-field" style={{ flex: '1 1 130px' }}>
              <label className="cc-label">Posição Y (%)</label>
              <input
                type="number"
                className="cc-input"
                value={thermalConfig.positionY}
                onChange={(e) => setThermalConfig((s) => ({ ...s, positionY: parseInt(e.target.value) || 50 }))}
              />
            </div>
          </div>
        </div>
      )}

      <hr className="cc-divider" />

      {/* CAMADA FORENSE E FILTROS */}
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={16} color="#00ff9d" /> Camada Forense RGB e Filtros
        </h3>
      </div>

      <div style={{ marginBottom: 12, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input type="file" accept="image/*" hidden ref={filterPngInputRef} onChange={handleFilterPngUpload} />
        <button
          type="button"
          className="cc-btn cc-btn-save"
          style={{ ...UNIFORM_BTN_STYLE, opacity: mediaState.previewUrl ? 1 : 0.5 }}
          disabled={!mediaState.previewUrl}
          onClick={() => setEditorState((s) => ({ ...s, showForensicEditor: true }))}
        >
          <Palette size={16} /> Abrir Editor Forense RGB
        </button>
        <button
          type="button"
          className="cc-btn cc-btn-cancel"
          style={{ ...UNIFORM_BTN_STYLE, opacity: mediaState.previewUrl ? 1 : 0.5 }}
          disabled={!mediaState.previewUrl}
          onClick={() => setEditorState((s) => ({ ...s, editorMode: 'filter' }))}
        >
          <ImageIcon size={16} /> Desenhar Camada Filtro
        </button>
        <button
          type="button"
          className="cc-btn cc-btn-cancel"
          style={UNIFORM_BTN_STYLE}
          onClick={() => filterPngInputRef.current?.click()}
        >
          <Upload size={16} /> Upload PNG Filtro
        </button>
      </div>

      {mediaState.filterPreviewUrl && (
        <div
          style={{
            marginBottom: 12,
            padding: 8,
            background: 'rgba(52,152,219,0.08)',
            border: '1px solid rgba(52,152,219,0.3)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src={mediaState.filterPreviewUrl}
              alt="Filter"
              style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 4 }}
            />
            <span style={{ fontSize: 12, color: '#7cc4ff' }}>Camada Filtro configurada</span>
          </div>
          <button
            type="button"
            className="cc-btn cc-btn-cancel"
            style={{ minHeight: 34, padding: '4px 10px', borderColor: '#ff4444', color: '#ff6666' }}
            onClick={handleRemoveFilter}
          >
            <Trash2 size={14} /> Remover
          </button>
        </div>
      )}

      <div
        style={{
          padding: 12,
          background: 'rgba(52,152,219,0.05)',
          borderRadius: 6,
          border: '1px solid rgba(52,152,219,0.2)',
        }}
      >
        <button
          type="button"
          onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          className="cc-btn cc-btn-cancel"
          style={{
            width: '100%',
            minHeight: 38,
            fontSize: '11px',
            padding: '6px 10px',
            justifyContent: 'center',
            background: showAdvancedFilter ? 'rgba(52,152,219,0.2)' : 'rgba(50,50,50,0.3)',
          }}
        >
          <Sliders size={14} />{' '}
          {showAdvancedFilter ? 'Ocultar Ajustes de Filtro' : 'Ajustes de Revelação e Posição do Filtro'}
        </button>

        {showAdvancedFilter && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                Brilho <span style={{ color: '#3498db' }}>{filterConfig.brightness}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={filterConfig.brightness}
                onChange={(e) => setFilterConfig((s) => ({ ...s, brightness: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                Contraste <span style={{ color: '#3498db' }}>{filterConfig.contrast}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={filterConfig.contrast}
                onChange={(e) => setFilterConfig((s) => ({ ...s, contrast: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                Saturação <span style={{ color: '#3498db' }}>{filterConfig.saturate}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={filterConfig.saturate}
                onChange={(e) => setFilterConfig((s) => ({ ...s, saturate: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>

            {mediaState.filterPreviewUrl && (
              <div style={{ borderTop: '1px solid rgba(52,152,219,0.2)', paddingTop: 10, marginTop: 4 }}>
                <div style={{ fontSize: 11, color: '#7cc4ff', marginBottom: 8 }}>
                  Posição & Tamanho da Camada Filtro (%)
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                    gap: 8,
                  }}
                >
                  <label style={{ fontSize: 11, color: '#aaa' }}>
                    Esquerda %
                    <input
                      type="number"
                      className="cc-input"
                      min={0}
                      max={100}
                      value={filterTransform.left}
                      onChange={(e) =>
                        setFilterConfig((s) => ({
                          ...s,
                          transform: { ...filterTransform, left: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  </label>
                  <label style={{ fontSize: 11, color: '#aaa' }}>
                    Topo %
                    <input
                      type="number"
                      className="cc-input"
                      min={0}
                      max={100}
                      value={filterTransform.top}
                      onChange={(e) =>
                        setFilterConfig((s) => ({
                          ...s,
                          transform: { ...filterTransform, top: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  </label>
                  <label style={{ fontSize: 11, color: '#aaa' }}>
                    Largura %
                    <input
                      type="number"
                      className="cc-input"
                      min={5}
                      max={100}
                      value={filterTransform.width}
                      onChange={(e) =>
                        setFilterConfig((s) => ({
                          ...s,
                          transform: { ...filterTransform, width: Number(e.target.value) || 50 },
                        }))
                      }
                    />
                  </label>
                  <label style={{ fontSize: 11, color: '#aaa' }}>
                    Altura %
                    <input
                      type="number"
                      className="cc-input"
                      min={5}
                      max={100}
                      value={filterTransform.height}
                      onChange={(e) =>
                        setFilterConfig((s) => ({
                          ...s,
                          transform: { ...filterTransform, height: Number(e.target.value) || 50 },
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
