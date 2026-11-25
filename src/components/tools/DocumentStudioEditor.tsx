import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Save,
  Layers,
  Plus,
  Trash2,
  FlipHorizontal,
  Scissors,
  Eye,
  Flame,
  Flashlight,
  PenTool,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import {
  DocumentLayer,
  FragmentationConfig,
  InkLayerType,
  PhysicalDocumentMetadata,
} from '../../types/forensicPillars';
import './DocumentStudioEditor.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: PhysicalDocumentMetadata | null;
  frontBaseUrl?: string | null;
  onSave: (doc: PhysicalDocumentMetadata) => void;
}

const INK_LABELS: Record<InkLayerType, string> = {
  normal: 'Tinta Comum',
  uv: 'Tinta UV (Fluorescente)',
  thermal: 'Tinta Térmica (Calor)',
  chromatic_r: 'Camuflagem Vermelha (R)',
  chromatic_g: 'Camuflagem Verde (G)',
  chromatic_b: 'Camuflagem Azul (B)',
};

export default function DocumentStudioEditor({
  isOpen,
  onClose,
  initialDoc,
  frontBaseUrl,
  onSave,
}: Props) {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [previewTool, setPreviewTool] = useState<'none' | 'uv' | 'thermal' | 'r' | 'g' | 'b'>('none');
  const [layers, setLayers] = useState<DocumentLayer[]>(() => initialDoc?.layers || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [brushInk, setBrushInk] = useState<InkLayerType | null>(null);
  const [drawingLayerId, setDrawingLayerId] = useState<string | null>(null);
  const [frag, setFrag] = useState<FragmentationConfig>(
    () =>
      initialDoc?.fragmentation || {
        mode: 'intact',
        cols: 6,
        rows: 1,
        allowRotation: true,
        allowFlip: true,
      }
  );

  if (!isOpen) return null;

  const sideLayers = layers.filter((l) => l.side === activeSide);
  const selectedLayer = layers.find((l) => l.id === selectedId) || null;

  const addLayer = (inkType: InkLayerType, kind: 'text' | 'scribble_mask' = 'text') => {
    setBrushInk(null);
    const newLayer: DocumentLayer = {
      id: nanoid(8),
      side: activeSide,
      inkType,
      kind,
      content:
        kind === 'scribble_mask'
          ? '//// //// ////'
          : inkType === 'uv'
          ? 'MARCA UV SECRETA'
          : inkType === 'thermal'
          ? 'TINTA SIMPÁTICA (AQUECER)'
          : 'Texto do documento...',
      x: 50,
      y: 50,
      width: 60,
      height: 20,
      rotation: 0,
      opacity: inkType === 'uv' ? 0.95 : 1,
      fontSize: 18,
      color:
        inkType === 'uv'
          ? '#a855f7'
          : inkType === 'thermal'
          ? '#5c3a1e'
          : inkType === 'chromatic_r'
          ? '#ef4444'
          : inkType === 'chromatic_g'
          ? '#22c55e'
          : inkType === 'chromatic_b'
          ? '#3b82f6'
          : '#1e293b',
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedId(newLayer.id);
  };

  const updateSelected = (patch: Partial<DocumentLayer>) => {
    if (!selectedId) return;
    setLayers((prev) => prev.map((l) => (l.id === selectedId ? { ...l, ...patch } : l)));
  };

  const deleteLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSave = () => {
    onSave({
      version: 2,
      frontBaseUrl: initialDoc?.frontBaseUrl || frontBaseUrl || null,
      backBaseUrl: initialDoc?.backBaseUrl || null,
      layers,
      fragmentation: frag,
    });
    onClose();
  };

  const isLayerVisibleInPreview = (l: DocumentLayer) => {
    if (l.inkType === 'uv') return previewTool === 'uv';
    if (l.inkType === 'thermal') return previewTool === 'thermal';
    if (previewTool === 'r' && l.inkType === 'chromatic_r') return false;
    if (previewTool === 'g' && l.inkType === 'chromatic_g') return false;
    if (previewTool === 'b' && l.inkType === 'chromatic_b') return false;
    return true;
  };

  return createPortal(
    <div className="dse-backdrop" onClick={onClose}>
      <div className="dse-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="dse-header">
          <div className="dse-title">
            <Layers size={17} />
            <div>
              <h2>ESTÚDIO DE DOCUMENTO FÍSICO — MODO MESTRE</h2>
              <span>Camadas Frente/Verso, Tintas UV/Térmica/RGB, Pincel Livre e Fragmentação</span>
            </div>
          </div>
          <button type="button" className="dse-close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="dse-workspace">
          <aside className="dse-sidebar">
            <div className="dse-side-toggle">
              <button
                type="button"
                className={activeSide === 'front' ? 'active' : ''}
                onClick={() => setActiveSide('front')}
              >
                <FlipHorizontal size={14} /> Frente
              </button>
              <button
                type="button"
                className={activeSide === 'back' ? 'active' : ''}
                onClick={() => setActiveSide('back')}
              >
                <FlipHorizontal size={14} /> Verso
              </button>
            </div>

            <div className="dse-add-group">
              <span className="dse-label">Adicionar Camada ({activeSide === 'front' ? 'Frente' : 'Verso'}):</span>
              <button type="button" onClick={() => addLayer('normal')}>
                <Plus size={13} /> Tinta Comum
              </button>
              <button type="button" onClick={() => addLayer('uv')}>
                <Flashlight size={13} /> Tinta UV
              </button>
              <button type="button" onClick={() => addLayer('thermal')}>
                <Flame size={13} /> Tinta Térmica (Calor)
              </button>
              <button type="button" onClick={() => addLayer('chromatic_r', 'scribble_mask')}>
                <Eye size={13} /> Rabisco Filtro Vermelho
              </button>
              <button type="button" onClick={() => addLayer('chromatic_b')}>
                <Eye size={13} /> Texto Oculto Azul
              </button>
              <button
                type="button"
                className={brushInk === 'uv' ? 'active' : ''}
                onClick={() => setBrushInk(brushInk === 'uv' ? null : 'uv')}
              >
                <PenTool size={13} /> {brushInk === 'uv' ? 'Parar Pincel UV' : 'Pincel Livre UV'}
              </button>
              <button
                type="button"
                className={brushInk === 'thermal' ? 'active' : ''}
                onClick={() => setBrushInk(brushInk === 'thermal' ? null : 'thermal')}
              >
                <PenTool size={13} /> {brushInk === 'thermal' ? 'Parar Pincel Térmico' : 'Pincel Livre Térmico'}
              </button>
            </div>

            <div className="dse-layer-list">
              <span className="dse-label">Camadas neste lado ({sideLayers.length}):</span>
              {sideLayers.map((l) => (
                <div
                  key={l.id}
                  className={`dse-layer-item ${selectedId === l.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(l.id)}
                >
                  <div>
                    <strong>{INK_LABELS[l.inkType]}</strong>
                    <span>{l.content.slice(0, 24)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(l.id);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="dse-frag-box">
              <span className="dse-label">
                <Scissors size={13} /> Triturador / Rasgador:
              </span>
              <select
                value={frag.mode}
                onChange={(e) => setFrag({ ...frag, mode: e.target.value as any })}
              >
                <option value="intact">Documento Inteiro</option>
                <option value="shredder_strips">Cortar em Tiras (Shredder)</option>
                <option value="torn_pieces">Rasgar em Pedaços</option>
              </select>
              {frag.mode !== 'intact' && (
                <div className="dse-frag-opts">
                  <label>
                    Colunas: {frag.cols}
                    <input
                      type="range"
                      min={3}
                      max={10}
                      value={frag.cols}
                      onChange={(e) => setFrag({ ...frag, cols: Number(e.target.value) })}
                    />
                  </label>
                  <label className="dse-check">
                    <input
                      type="checkbox"
                      checked={frag.allowRotation}
                      onChange={(e) => setFrag({ ...frag, allowRotation: e.target.checked })}
                    />
                    Pedaços girados (90°/180°)
                  </label>
                  <label className="dse-check">
                    <input
                      type="checkbox"
                      checked={frag.allowFlip}
                      onChange={(e) => setFrag({ ...frag, allowFlip: e.target.checked })}
                    />
                    Permitir virar Frente/Verso
                  </label>
                </div>
              )}
            </div>
          </aside>

          <main className="dse-canvas-area">
            <div className="dse-preview-bar">
              <span>Simular Instrumento:</span>
              {(['none', 'uv', 'thermal', 'r', 'g', 'b'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={previewTool === t ? 'active' : ''}
                  onClick={() => setPreviewTool(t)}
                >
                  {t === 'none'
                    ? 'Luz Normal'
                    : t === 'uv'
                    ? 'Lanterna UV'
                    : t === 'thermal'
                    ? 'Aquecedor'
                    : `Lente ${t.toUpperCase()}`}
                </button>
              ))}
            </div>

            <div
              className={`dse-paper ${activeSide} tool-${previewTool}`}
              style={{ touchAction: brushInk ? 'none' : 'auto', cursor: brushInk ? 'crosshair' : 'default' }}
              onPointerDown={(e) => {
                if (!brushInk) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                const id = nanoid(8);
                const stroke: DocumentLayer = {
                  id,
                  side: activeSide,
                  inkType: brushInk,
                  kind: 'freehand',
                  content: `Traço Livre (${brushInk.toUpperCase()})`,
                  x: 50,
                  y: 50,
                  width: 100,
                  height: 100,
                  rotation: 0,
                  opacity: 1,
                  color: brushInk === 'uv' ? '#a855f7' : '#5c3a1e',
                  strokeWidth: 1.4,
                  points: [{ x, y }],
                };
                setLayers((prev) => [...prev, stroke]);
                setDrawingLayerId(id);
                setSelectedId(id);
              }}
              onPointerMove={(e) => {
                if (!brushInk || !drawingLayerId) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setLayers((prev) =>
                  prev.map((l) =>
                    l.id === drawingLayerId
                      ? { ...l, points: [...(l.points || []), { x, y }] }
                      : l
                  )
                );
              }}
              onPointerUp={() => setDrawingLayerId(null)}
            >
              {activeSide === 'front' && (initialDoc?.frontBaseUrl || frontBaseUrl) && (
                <img
                  src={(initialDoc?.frontBaseUrl || frontBaseUrl)!}
                  alt="Base frente"
                  className="dse-paper-bg"
                />
              )}
              {sideLayers.map((l) => {
                const visible = isLayerVisibleInPreview(l);
                if (l.kind === 'freehand' && l.points && l.points.length > 1) {
                  const d = l.points.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
                  return (
                    <svg
                      key={l.id}
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        opacity: visible ? l.opacity : 0.08,
                      }}
                    >
                      <path
                        d={d}
                        fill="none"
                        stroke={l.color || '#a855f7'}
                        strokeWidth={l.strokeWidth || 1.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  );
                }
                return (
                  <div
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    className={`dse-layer-node ${selectedId === l.id ? 'selected' : ''} ${
                      visible ? 'visible' : 'hidden-ink'
                    }`}
                    style={{
                      left: `${l.x}%`,
                      top: `${l.y}%`,
                      transform: `translate(-50%, -50%) rotate(${l.rotation}deg)`,
                      color: l.color,
                      fontSize: `${l.fontSize || 18}px`,
                      opacity: visible ? l.opacity : 0.08,
                    }}
                  >
                    {l.content}
                  </div>
                );
              })}
            </div>
          </main>

          <aside className="dse-inspector">
            <span className="dse-label">Propriedades da Camada</span>
            {selectedLayer ? (
              <div className="dse-prop-stack">
                <label>
                  Texto / Conteúdo
                  <textarea
                    rows={3}
                    value={selectedLayer.content}
                    onChange={(e) => updateSelected({ content: e.target.value })}
                  />
                </label>
                <label>
                  Posição X: {selectedLayer.x}%
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={selectedLayer.x}
                    onChange={(e) => updateSelected({ x: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Posição Y: {selectedLayer.y}%
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={selectedLayer.y}
                    onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Tamanho: {selectedLayer.fontSize || 18}px
                  <input
                    type="range"
                    min={10}
                    max={48}
                    value={selectedLayer.fontSize || 18}
                    onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Rotação: {selectedLayer.rotation}°
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={selectedLayer.rotation}
                    onChange={(e) => updateSelected({ rotation: Number(e.target.value) })}
                  />
                </label>
              </div>
            ) : (
              <p className="dse-empty-prop">Selecione ou adicione uma camada para editar.</p>
            )}
          </aside>
        </div>

        <footer className="dse-footer">
          <button type="button" className="dse-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="dse-btn-save" onClick={handleSave}>
            <Save size={15} /> Salvar Documento na Pista
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
