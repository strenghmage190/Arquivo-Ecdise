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
import DocumentStudioEditor from '../../tools/DocumentStudioEditor';
import { PhysicalDocumentMetadata } from '../../../types/forensicPillars';

type AlignLayerKey = 'uv' | 'thermal' | 'forensic' | 'filter';

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
  const [showDocStudio, setShowDocStudio] = useState(false);
  const [docStudioMeta, setDocStudioMeta] = useState<PhysicalDocumentMetadata | null>(() => {
    try {
      return (window as any).__ecdiseDocStudioDraft || null;
    } catch {
      return null;
    }
  });

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
    <div className="ccm-tab-stack">
      <div style={{ marginBottom: 4 }}>
        <button
          type="button"
          className="ccm-btn ccm-btn-primary"
          style={{ width: '100%', justifyContent: 'center', gap: 8, padding: '10px 14px' }}
          onClick={() => setShowDocStudio(true)}
        >
          <Sparkles size={16} /> Abrir Estúdio de Documento Físico (Frente/Verso + UV/Térmica/RGB + Pincel + Rasgar)
        </button>
      </div>

      <DocumentStudioEditor
        isOpen={showDocStudio}
        onClose={() => setShowDocStudio(false)}
        initialDoc={docStudioMeta}
        frontBaseUrl={mediaState.previewUrl}
        onSave={(doc) => {
          setDocStudioMeta(doc);
          (window as any).__ecdiseDocStudioDraft = doc;
          toast.success('Documento Físico configurado na pista!');
        }}
      />

      {/* IMAGEM BASE */}
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <ImageIcon size={16} /> IMAGEM BASE
            <span data-tooltip-id="base-image-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="base-image-tip" className="cyber-tooltip ccm-tooltip">
            A imagem principal exibida ao clicar na pista (máx 10MB).
          </Tooltip>
        </div>

        <div className="ccm-btn-row">
          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <button
            type="button"
            className="ccm-btn ccm-btn-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={16} /> Selecionar Imagem Base
          </button>
          {mediaState.previewUrl && (
            <button
              type="button"
              className="ccm-btn ccm-btn-danger"
              onClick={handleRemoveBaseImage}
            >
              <Trash2 size={16} /> Remover
            </button>
          )}
        </div>

        {/* FAIXA COMPARATIVA DE MINIATURAS: BASE | UV | TERMAL | RGB */}
        <div className="ccm-section ccm-section-accent" style={{ padding: 12 }}>
          <div className="ccm-section-head">
            <h4 className="ccm-section-title">
              <Layers size={14} /> PAINEL COMPARATIVO DE CAMADAS
            </h4>
            <span className="ccm-code-pill">
              {comparativeCards.filter((c) => c.active).length}/4 ativas
            </span>
          </div>

          <div className="ccm-layers-grid">
            {comparativeCards.map((card) => (
              <div
                key={card.id}
                data-accent={card.id}
                onClick={card.onSelectPreview}
                className={`ccm-layer-card ${card.active ? 'is-active' : ''} ${card.onSelectPreview ? 'is-clickable' : ''
                  }`}
              >
                <div className="ccm-layer-head">
                  <span className="ccm-layer-title">{card.title}</span>
                  <span className="ccm-layer-badge">
                    {card.badge || (card.active ? 'ATIVA' : 'OFF')}
                  </span>
                </div>

                <div className="ccm-layer-thumb">
                  {card.url ? (
                    <img src={card.url} alt={card.title} />
                  ) : (
                    <span className="ccm-layer-empty">
                      {card.active ? 'Ativa (Texto)' : 'Sem camada'}
                    </span>
                  )}
                </div>

                <div className="ccm-layer-actions">
                  <button
                    type="button"
                    className="ccm-btn ccm-btn-sm"
                    disabled={card.editDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      card.onEdit();
                    }}
                  >
                    <Edit3 size={12} /> Editar
                  </button>
                  {card.onRemove && (
                    <button
                      type="button"
                      className="ccm-btn ccm-btn-sm ccm-btn-danger"
                      style={{ flex: '0 0 auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        card.onRemove?.();
                      }}
                      title={`Remover ${card.title}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {mediaState.previewUrl && activeAlignObj && (
            <div className="ccm-list-stack" style={{ paddingTop: 10, borderTop: '1px solid var(--ccm-border-subtle)' }}>
              <div className="ccm-section-head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <span className="ccm-label-inline" style={{ fontSize: 12, fontWeight: 600 }}>
                  <Eye size={14} color={activeAlignObj.color} /> Alinhamento Visual (Conferência)
                </span>

                <div className="ccm-btn-row">
                  {availableAlignLayers.map((layer) => (
                    <button
                      key={layer.key}
                      type="button"
                      className={`ccm-btn ccm-btn-sm ${activeAlignObj.key === layer.key ? 'ccm-btn-primary' : ''
                        }`}
                      onClick={() => setAlignLayer(layer.key)}
                    >
                      {layer.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ccm-align-stage">
                <div className="ccm-align-canvas">
                  <img
                    src={mediaState.previewUrl}
                    alt="Base alinhamento"
                    className="ccm-align-base"
                  />
                  <img
                    src={activeAlignObj.url}
                    alt={`Sobreposição ${activeAlignObj.label}`}
                    className={activeAlignObj.key === 'filter' ? undefined : 'ccm-align-overlay'}
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
                        : { opacity: alignOpacity / 100 }
                    }
                  />
                </div>
              </div>

              <div className="ccm-slider-field">
                <div className="ccm-slider-head">
                  <label className="ccm-label">Opacidade da Camada</label>
                  <span className="ccm-slider-val">{alignOpacity}%</span>
                </div>
                <input
                  type="range"
                  className="ccm-range"
                  min={0}
                  max={100}
                  value={alignOpacity}
                  onChange={(e) => setAlignOpacity(Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* VÍDEO */}
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Video size={17} /> VÍDEO (OPCIONAL)
            <span data-tooltip-id="video-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="video-tip" className="cyber-tooltip ccm-tooltip">
            Se você adicionar um vídeo (ou URL de YouTube/Vimeo), ele terá prioridade sobre a imagem base.
          </Tooltip>
        </div>

        <div className="ccm-field">
          <label className="ccm-label">URL do Vídeo (YouTube, Vimeo, mp4 externo)</label>
          <input
            type="text"
            className="ccm-input"
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

        <div className="ccm-btn-row">
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            hidden
            ref={videoInputRef}
            onChange={handleVideoSelect}
          />
          <button
            type="button"
            className="ccm-btn ccm-btn-primary"
            onClick={() => videoInputRef.current?.click()}
          >
            <Video size={16} /> Selecionar Arquivo de Vídeo (Máx 100MB)
          </button>
          {(mediaState.videoPreviewUrl || mediaState.videoUrlInput) && (
            <button
              type="button"
              className="ccm-btn ccm-btn-danger"
              onClick={handleRemoveVideo}
            >
              <Trash2 size={16} /> Remover Vídeo
            </button>
          )}
        </div>

        {mediaState.videoPreviewUrl && (
          <div className="ccm-preview-box">
            <video src={mediaState.videoPreviewUrl} controls className="ccm-preview-media" />
          </div>
        )}
      </section>

      {/* FAKE PHONE */}
      <div className="ccm-callout ccm-callout-info">
        <div className="ccm-callout-left">
          <Smartphone size={18} />
          <span>
            O construtor de Celular Fake e Bloqueio (PIN/Padrão) fica unificado na aba <strong>Segurança</strong>.
          </span>
        </div>
        <button
          type="button"
          className="ccm-btn ccm-btn-sm ccm-btn-primary"
          onClick={() => setActiveTab('seguranca')}
        >
          <Smartphone size={14} /> Configurar Celular
        </button>
      </div>

      {/* CAMADA UV */}
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Sparkles size={16} color="#b366ff" /> Camada UV / Luz Negra
            <span data-tooltip-id="uv-light-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="uv-light-tip" className="cyber-tooltip ccm-tooltip">
            <span className="cyber-tooltip-title">[ LUZ NEGRA ]</span>
            Permite revelar uma camada oculta ao arrastar a lanterna de luz negra sobre a imagem.
          </Tooltip>
        </div>

        <div className="ccm-btn-grid">
          <input type="file" accept="image/png,image/webp" hidden ref={uvPngInputRef} onChange={handleUvPngUpload} />
          <button
            type="button"
            className="ccm-btn ccm-btn-primary"
            disabled={!mediaState.previewUrl}
            onClick={() => setEditorState((s) => ({ ...s, editorMode: 'uv' }))}
          >
            <ImageIcon size={16} /> Desenhar Efeito UV
          </button>
          <button
            type="button"
            className="ccm-btn"
            onClick={() => uvPngInputRef.current?.click()}
          >
            <Upload size={16} /> Upload PNG UV
          </button>
          {mediaState.uvPreviewUrl && (
            <button
              type="button"
              className="ccm-btn ccm-btn-danger"
              onClick={handleRemoveUv}
            >
              <Trash2 size={16} /> Remover UV
            </button>
          )}
        </div>
      </section>

      {/* CAMADA TÉRMICA */}
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Thermometer size={16} color="#ff9500" /> Camada Térmica
            <span data-tooltip-id="thermal-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="thermal-tip" className="cyber-tooltip ccm-tooltip">
            <span className="cyber-tooltip-title">[ TÉRMICA ]</span>
            Assinaturas de calor/frio, carimbos térmicos e textos ocultos revelados na visão térmica.
          </Tooltip>
        </div>

        <div className="ccm-btn-grid">
          <button
            type="button"
            className={`ccm-btn ${thermalConfig?.enabled ? 'ccm-btn-primary' : ''}`}
            disabled={!mediaState.previewUrl}
            onClick={() => setThermalConfig((s) => ({ ...s, enabled: !s.enabled }))}
          >
            <Info size={16} /> {thermalConfig?.enabled ? 'Térmica: ON' : 'Ativar Térmica'}
          </button>

          <button
            type="button"
            className="ccm-btn"
            disabled={!mediaState.previewUrl}
            onClick={openThermalEditor}
          >
            <Thermometer size={16} /> Abrir Editor Térmico
          </button>

          {(thermalConfig?.enabled || mediaState.thermalPreviewUrl) && (
            <button
              type="button"
              className="ccm-btn ccm-btn-danger"
              onClick={handleRemoveThermal}
            >
              <Trash2 size={16} /> Remover Térmica
            </button>
          )}
        </div>

        {thermalConfig?.enabled && (
          <div className="ccm-list-card">
            <div className="ccm-field">
              <label className="ccm-label">Texto Oculto</label>
              <textarea
                className="ccm-input"
                rows={3}
                value={thermalConfig.secretText}
                onChange={(e) => setThermalConfig((s) => ({ ...s, secretText: e.target.value }))}
                placeholder="Ex: COORDENADAS: 45.123, -12.456"
              />
            </div>

            <div className="ccm-grid-3">
              <div className="ccm-field">
                <label className="ccm-label">Senha / Keyword (Opcional)</label>
                <input
                  type="text"
                  className="ccm-input ccm-input-mono"
                  value={thermalConfig.keyword}
                  onChange={(e) => setThermalConfig((s) => ({ ...s, keyword: e.target.value.toUpperCase() }))}
                  placeholder="Deixe em branco p/ automático"
                />
              </div>
              <div className="ccm-field">
                <label className="ccm-label">Tamanho da Fonte</label>
                <input
                  type="number"
                  className="ccm-input"
                  value={thermalConfig.fontSize}
                  onChange={(e) => setThermalConfig((s) => ({ ...s, fontSize: parseInt(e.target.value) || 24 }))}
                />
              </div>
              <div className="ccm-field">
                <label className="ccm-label">Posição Y (%)</label>
                <input
                  type="number"
                  className="ccm-input"
                  value={thermalConfig.positionY}
                  onChange={(e) => setThermalConfig((s) => ({ ...s, positionY: parseInt(e.target.value) || 50 }))}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* CAMADA FORENSE E FILTROS */}
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Palette size={16} color="#00ff9d" /> Camada Forense RGB e Filtros
          </h3>
        </div>

        <div className="ccm-btn-grid">
          <input type="file" accept="image/*" hidden ref={filterPngInputRef} onChange={handleFilterPngUpload} />
          <button
            type="button"
            className="ccm-btn ccm-btn-primary"
            disabled={!mediaState.previewUrl}
            onClick={() => setEditorState((s) => ({ ...s, showForensicEditor: true }))}
          >
            <Palette size={16} /> Abrir Editor Forense RGB
          </button>
          <button
            type="button"
            className="ccm-btn"
            disabled={!mediaState.previewUrl}
            onClick={() => setEditorState((s) => ({ ...s, editorMode: 'filter' }))}
          >
            <ImageIcon size={16} /> Desenhar Camada Filtro
          </button>
          <button
            type="button"
            className="ccm-btn"
            onClick={() => filterPngInputRef.current?.click()}
          >
            <Upload size={16} /> Upload PNG Filtro
          </button>
        </div>

        {mediaState.filterPreviewUrl && (
          <div className="ccm-callout ccm-callout-info">
            <div className="ccm-callout-left">
              <img
                src={mediaState.filterPreviewUrl}
                alt="Filter"
                style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 4 }}
              />
              <span>Camada Filtro configurada</span>
            </div>
            <button
              type="button"
              className="ccm-btn ccm-btn-sm ccm-btn-danger"
              onClick={handleRemoveFilter}
            >
              <Trash2 size={14} /> Remover
            </button>
          </div>
        )}

        <div className="ccm-list-card">
          <button
            type="button"
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={`ccm-btn ccm-btn-block ${showAdvancedFilter ? 'ccm-btn-primary' : ''}`}
          >
            <Sliders size={14} />{' '}
            {showAdvancedFilter ? 'Ocultar Ajustes de Filtro' : 'Ajustes de Revelação e Posição do Filtro'}
          </button>

          {showAdvancedFilter && (
            <div className="ccm-list-stack">
              <div className="ccm-slider-field">
                <div className="ccm-slider-head">
                  <label className="ccm-label">Brilho</label>
                  <span className="ccm-slider-val">{filterConfig.brightness}%</span>
                </div>
                <input
                  type="range"
                  className="ccm-range"
                  min="0"
                  max="200"
                  value={filterConfig.brightness}
                  onChange={(e) => setFilterConfig((s) => ({ ...s, brightness: parseInt(e.target.value) }))}
                />
              </div>

              <div className="ccm-slider-field">
                <div className="ccm-slider-head">
                  <label className="ccm-label">Contraste</label>
                  <span className="ccm-slider-val">{filterConfig.contrast}%</span>
                </div>
                <input
                  type="range"
                  className="ccm-range"
                  min="0"
                  max="200"
                  value={filterConfig.contrast}
                  onChange={(e) => setFilterConfig((s) => ({ ...s, contrast: parseInt(e.target.value) }))}
                />
              </div>

              <div className="ccm-slider-field">
                <div className="ccm-slider-head">
                  <label className="ccm-label">Saturação</label>
                  <span className="ccm-slider-val">{filterConfig.saturate}%</span>
                </div>
                <input
                  type="range"
                  className="ccm-range"
                  min="0"
                  max="200"
                  value={filterConfig.saturate}
                  onChange={(e) => setFilterConfig((s) => ({ ...s, saturate: parseInt(e.target.value) }))}
                />
              </div>

              {mediaState.filterPreviewUrl && (
                <div className="ccm-list-stack">
                  <div className="ccm-label">Posição & Tamanho da Camada Filtro (%)</div>
                  <div className="ccm-grid-4">
                    <div className="ccm-field">
                      <label className="ccm-label">Esquerda %</label>
                      <input
                        type="number"
                        className="ccm-input"
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
                    </div>
                    <div className="ccm-field">
                      <label className="ccm-label">Topo %</label>
                      <input
                        type="number"
                        className="ccm-input"
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
                    </div>
                    <div className="ccm-field">
                      <label className="ccm-label">Largura %</label>
                      <input
                        type="number"
                        className="ccm-input"
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
                    </div>
                    <div className="ccm-field">
                      <label className="ccm-label">Altura %</label>
                      <input
                        type="number"
                        className="ccm-input"
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
