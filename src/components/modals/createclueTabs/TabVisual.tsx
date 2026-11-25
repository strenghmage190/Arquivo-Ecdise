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
  FlipHorizontal,
  Scissors,
  Plus,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { Tooltip } from 'react-tooltip';
import { toast } from 'sonner';
import { validateImageFile } from '../../../utils/fileValidators';
import { validateFile } from '../../../utils/storage';
import {
  DocumentLayer,
  FragmentationConfig,
  InkLayerType,
  PhysicalDocumentMetadata,
} from '../../../types/forensicPillars';

type AlignLayerKey = 'uv' | 'thermal' | 'forensic' | 'filter';

const DEFAULT_FRAGMENTATION: FragmentationConfig = {
  mode: 'intact',
  cols: 6,
  rows: 1,
  allowRotation: true,
  allowFlip: true,
};

const createEmptyPhysicalDoc = (frontBaseUrl?: string | null): PhysicalDocumentMetadata => ({
  version: 2,
  frontBaseUrl: frontBaseUrl || null,
  backBaseUrl: null,
  layers: [],
  fragmentation: { ...DEFAULT_FRAGMENTATION },
});

const INK_TYPE_OPTIONS: { value: InkLayerType; label: string }[] = [
  { value: 'normal', label: 'Tinta Comum' },
  { value: 'uv', label: 'Tinta UV (Luz Negra)' },
  { value: 'thermal', label: 'Tinta Térmica (Calor)' },
  { value: 'chromatic_r', label: 'Camuflagem Vermelha (R)' },
  { value: 'chromatic_g', label: 'Camuflagem Verde (G)' },
  { value: 'chromatic_b', label: 'Camuflagem Azul (B)' },
];

async function fileToSafeDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Falha ao ler imagem.'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(reader.error || new Error('Falha ao ler imagem.'));
    reader.readAsDataURL(file);
  });
}

export default function TabVisual() {
  const clueCtx = useClueModal() as ReturnType<typeof useClueModal> & {
    physicalDocument?: PhysicalDocumentMetadata | null;
    setPhysicalDocument?: React.Dispatch<React.SetStateAction<PhysicalDocumentMetadata | null>>;
  };
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
  } = clueCtx;

  const [localPhysicalDoc, setLocalPhysicalDoc] = useState<PhysicalDocumentMetadata | null>(null);
  const physicalDoc = clueCtx.physicalDocument ?? localPhysicalDoc;

  const updatePhysicalDoc = (
    updater: (prev: PhysicalDocumentMetadata) => PhysicalDocumentMetadata
  ) => {
    const apply = (prev: PhysicalDocumentMetadata | null) =>
      updater(prev || createEmptyPhysicalDoc(mediaState.previewUrl));
    if (clueCtx.setPhysicalDocument) {
      clueCtx.setPhysicalDocument(apply);
    }
    setLocalPhysicalDoc(apply);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const uvPngInputRef = useRef<HTMLInputElement>(null);
  const filterPngInputRef = useRef<HTMLInputElement>(null);
  const backImageInputRef = useRef<HTMLInputElement>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [docLayerSide, setDocLayerSide] = useState<'front' | 'back'>('back');
  const [newLayerInk, setNewLayerInk] = useState<InkLayerType>('uv');
  const [newLayerText, setNewLayerText] = useState('');

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

  const handleBackImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      toast.error(validation.reason || 'Imagem de verso inválida.');
      e.target.value = '';
      return;
    }
    try {
      const dataUrl = await fileToSafeDataUrl(file);
      updatePhysicalDoc((prev) => ({
        ...prev,
        backBaseUrl: dataUrl,
      }));
    } catch {
      toast.error('Não foi possível processar a imagem do verso.');
    }
    e.target.value = '';
  };

  const handleRemoveBackImage = () => {
    updatePhysicalDoc((prev) => ({
      ...prev,
      backBaseUrl: null,
    }));
  };

  const handleAddDocLayer = () => {
    const content = newLayerText.trim();
    if (!content) {
      toast.error('Digite o texto da camada antes de adicionar.');
      return;
    }
    const colorMap: Record<InkLayerType, string> = {
      normal: '#1e293b',
      uv: '#a855f7',
      thermal: '#5c3a1e',
      chromatic_r: '#ef4444',
      chromatic_g: '#22c55e',
      chromatic_b: '#3b82f6',
    };
    const layer: DocumentLayer = {
      id: nanoid(8),
      side: docLayerSide,
      inkType: newLayerInk,
      kind: 'text',
      content,
      x: 50,
      y: 50,
      width: 60,
      height: 20,
      rotation: 0,
      opacity: newLayerInk === 'uv' ? 0.95 : 1,
      fontSize: 18,
      color: colorMap[newLayerInk],
    };
    updatePhysicalDoc((prev) => ({
      ...prev,
      layers: [...prev.layers, layer],
    }));
    setNewLayerText('');
  };

  const handleRemoveDocLayer = (id: string) => {
    updatePhysicalDoc((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== id),
    }));
  };

  const handleUpdateDocLayer = (id: string, patch: Partial<DocumentLayer>) => {
    updatePhysicalDoc((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
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

      {/* VERSO & FRAGMENTAÇÃO (physical_document) */}
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <FlipHorizontal size={16} /> Verso &amp; Fragmentação (Documento Físico)
            <span data-tooltip-id="physical-doc-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <span className="ccm-code-pill">
            {physicalDoc?.layers.length || 0} camadas •{' '}
            {physicalDoc?.fragmentation.mode && physicalDoc.fragmentation.mode !== 'intact'
              ? `${physicalDoc.fragmentation.cols} tiras`
              : 'Intacto'}
          </span>
          <Tooltip id="physical-doc-tip" className="cyber-tooltip ccm-tooltip">
            Configure imagem do verso, camadas de tinta (UV/Térmica/RGB) na frente ou verso e fragmentação em tiras para a Mesa de Luz.
          </Tooltip>
        </div>

        {/* Verso: Imagem + URL */}
        <div className="ccm-list-card">
          <div className="ccm-section-head">
            <span className="ccm-label-inline" style={{ fontSize: 12, fontWeight: 600 }}>
              <FlipHorizontal size={14} /> Imagem do Verso (Opcional)
            </span>
          </div>

          <div className="ccm-btn-row">
            <input
              type="file"
              accept="image/*"
              hidden
              ref={backImageInputRef}
              onChange={handleBackImageSelect}
            />
            <button
              type="button"
              className="ccm-btn ccm-btn-primary"
              onClick={() => backImageInputRef.current?.click()}
            >
              <Upload size={15} /> Selecionar Imagem do Verso
            </button>
            {physicalDoc?.backBaseUrl && (
              <button
                type="button"
                className="ccm-btn ccm-btn-danger"
                onClick={handleRemoveBackImage}
              >
                <Trash2 size={15} /> Remover Verso
              </button>
            )}
            <button
              type="button"
              className="ccm-btn"
              disabled={!mediaState.previewUrl}
              onClick={() => setEditorState((s) => ({ ...s, editorMode: 'uv' }))}
              title="Abrir UVEditor na imagem principal"
            >
              <Sparkles size={15} /> Editar UV (Frente)
            </button>
          </div>

          <div className="ccm-field">
            <label className="ccm-label">URL Externa do Verso (opcional)</label>
            <input
              type="text"
              className="ccm-input"
              value={physicalDoc?.backBaseUrl && !physicalDoc.backBaseUrl.startsWith('data:') ? physicalDoc.backBaseUrl : ''}
              onChange={(e) =>
                updatePhysicalDoc((prev) => ({
                  ...prev,
                  backBaseUrl: e.target.value.trim() || null,
                }))
              }
              placeholder="https://..."
            />
          </div>

          {physicalDoc?.backBaseUrl && (
            <div className="ccm-callout ccm-callout-info">
              <div className="ccm-callout-left">
                <img
                  src={physicalDoc.backBaseUrl}
                  alt="Prévia do verso"
                  style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 4 }}
                />
                <span>Imagem do verso configurada</span>
              </div>
            </div>
          )}
        </div>

        {/* Camadas Frente / Verso */}
        <div className="ccm-list-card">
          <div className="ccm-section-head">
            <span className="ccm-label-inline" style={{ fontSize: 12, fontWeight: 600 }}>
              <Layers size={14} /> Camadas de Tinta (Frente / Verso)
            </span>
            <div className="ccm-btn-row">
              <button
                type="button"
                className={`ccm-btn ccm-btn-sm ${docLayerSide === 'front' ? 'ccm-btn-primary' : ''}`}
                onClick={() => setDocLayerSide('front')}
              >
                Frente
              </button>
              <button
                type="button"
                className={`ccm-btn ccm-btn-sm ${docLayerSide === 'back' ? 'ccm-btn-primary' : ''}`}
                onClick={() => setDocLayerSide('back')}
              >
                Verso
              </button>
            </div>
          </div>

          <div className="ccm-grid-3">
            <div className="ccm-field">
              <label className="ccm-label">Tipo de Tinta</label>
              <select
                className="ccm-input"
                value={newLayerInk}
                onChange={(e) => setNewLayerInk(e.target.value as InkLayerType)}
              >
                {INK_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="ccm-field" style={{ gridColumn: 'span 2' }}>
              <label className="ccm-label">Texto da Camada ({docLayerSide === 'front' ? 'Frente' : 'Verso'})</label>
              <div className="ccm-btn-row">
                <input
                  type="text"
                  className="ccm-input"
                  value={newLayerText}
                  onChange={(e) => setNewLayerText(e.target.value)}
                  placeholder="Ex: SENHA DO COFRE: 4920"
                />
                <button
                  type="button"
                  className="ccm-btn ccm-btn-primary"
                  onClick={handleAddDocLayer}
                >
                  <Plus size={15} /> Adicionar
                </button>
              </div>
            </div>
          </div>

          {(physicalDoc?.layers || []).filter((l) => l.side === docLayerSide).length > 0 && (
            <div className="ccm-list-stack">
              {(physicalDoc?.layers || [])
                .filter((l) => l.side === docLayerSide)
                .map((layer) => (
                  <div key={layer.id} className="ccm-callout ccm-callout-info" style={{ flexWrap: 'wrap', gap: 8 }}>
                    <div className="ccm-callout-left" style={{ flex: '1 1 220px' }}>
                      <span className="ccm-code-pill">{layer.inkType.toUpperCase()}</span>
                      <input
                        type="text"
                        className="ccm-input"
                        value={layer.content}
                        onChange={(e) => handleUpdateDocLayer(layer.id, { content: e.target.value })}
                      />
                    </div>
                    <div className="ccm-btn-row" style={{ alignItems: 'center' }}>
                      <label className="ccm-label" style={{ margin: 0 }}>X%</label>
                      <input
                        type="number"
                        className="ccm-input"
                        style={{ width: 64 }}
                        min={0}
                        max={100}
                        value={layer.x}
                        onChange={(e) => handleUpdateDocLayer(layer.id, { x: Number(e.target.value) || 0 })}
                      />
                      <label className="ccm-label" style={{ margin: 0 }}>Y%</label>
                      <input
                        type="number"
                        className="ccm-input"
                        style={{ width: 64 }}
                        min={0}
                        max={100}
                        value={layer.y}
                        onChange={(e) => handleUpdateDocLayer(layer.id, { y: Number(e.target.value) || 0 })}
                      />
                      <button
                        type="button"
                        className="ccm-btn ccm-btn-sm ccm-btn-danger"
                        onClick={() => handleRemoveDocLayer(layer.id)}
                        title="Remover camada"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Fragmentação */}
        <div className="ccm-list-card">
          <div className="ccm-section-head">
            <span className="ccm-label-inline" style={{ fontSize: 12, fontWeight: 600 }}>
              <Scissors size={14} /> Fragmentação do Documento
            </span>
          </div>

          <div className="ccm-grid-3">
            <div className="ccm-field">
              <label className="ccm-label">Modo</label>
              <select
                className="ccm-input"
                value={physicalDoc?.fragmentation.mode || 'intact'}
                onChange={(e) =>
                  updatePhysicalDoc((prev) => ({
                    ...prev,
                    fragmentation: {
                      ...prev.fragmentation,
                      mode: e.target.value as FragmentationConfig['mode'],
                    },
                  }))
                }
              >
                <option value="intact">Intacto (Folha inteira)</option>
                <option value="shredder_strips">Tiras de Triturador</option>
                <option value="torn_pieces">Pedaços Rasgados</option>
              </select>
            </div>

            {physicalDoc?.fragmentation.mode && physicalDoc.fragmentation.mode !== 'intact' && (
              <>
                <div className="ccm-field">
                  <label className="ccm-label">Quantidade de Tiras (2-12)</label>
                  <input
                    type="number"
                    className="ccm-input"
                    min={2}
                    max={12}
                    value={physicalDoc.fragmentation.cols}
                    onChange={(e) =>
                      updatePhysicalDoc((prev) => ({
                        ...prev,
                        fragmentation: {
                          ...prev.fragmentation,
                          cols: Math.max(2, Math.min(12, Number(e.target.value) || 6)),
                        },
                      }))
                    }
                  />
                </div>
                <div className="ccm-field" style={{ justifyContent: 'center' }}>
                  <label className="ccm-label" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={physicalDoc.fragmentation.allowRotation}
                      onChange={(e) =>
                        updatePhysicalDoc((prev) => ({
                          ...prev,
                          fragmentation: {
                            ...prev.fragmentation,
                            allowRotation: e.target.checked,
                          },
                        }))
                      }
                    />
                    Permitir Rotação (90°)
                  </label>
                  <label className="ccm-label" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={physicalDoc.fragmentation.allowFlip}
                      onChange={(e) =>
                        updatePhysicalDoc((prev) => ({
                          ...prev,
                          fragmentation: {
                            ...prev.fragmentation,
                            allowFlip: e.target.checked,
                          },
                        }))
                      }
                    />
                    Permitir Virar Verso
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
