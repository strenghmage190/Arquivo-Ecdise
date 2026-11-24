import React, { useState } from 'react';
import { Stamp } from 'lucide-react';
import {
  UV_STAMPS,
  UV_STAMP_CATEGORIES,
  UVStampCategory,
  UVStampDef,
  buildStampDataUrl,
} from './uvStamps';
import { useUVEditor } from './UVEditorContext';

interface UVStampsPanelProps {
  onInsertStamp: (stamp: UVStampDef, colorHex: string) => void;
}

export function UVStampsPanel({ onInsertStamp }: UVStampsPanelProps) {
  const { color } = useUVEditor();
  const [activeCategory, setActiveCategory] = useState<UVStampCategory>('elementos');
  const [useBrushColor, setUseBrushColor] = useState(false);

  const visibleStamps = UV_STAMPS.filter((s) => s.category === activeCategory);

  return (
    <div className="uv-stamps-panel">
      <div className="uv-stamps-header">
        <span className="uv-section-title">
          <Stamp size={14} /> Carimbos SVG (Ordem &amp; Forenses)
        </span>
        <label className="uv-stamps-color-toggle" title="Usar a cor selecionada no pincel em vez da cor temática do carimbo">
          <input
            type="checkbox"
            checked={useBrushColor}
            onChange={(e) => setUseBrushColor(e.target.checked)}
          />
          <span>Cor ativa</span>
        </label>
      </div>

      <div className="uv-stamps-categories" role="tablist" aria-label="Categorias de carimbos">
        {UV_STAMP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.id}
            className={`uv-stamps-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="uv-stamps-grid">
        {visibleStamps.map((stamp) => {
          const previewColor = useBrushColor ? color : stamp.defaultColor;
          const src = buildStampDataUrl(stamp, previewColor);
          return (
            <button
              key={stamp.id}
              type="button"
              className="uv-stamp-card"
              onClick={() => onInsertStamp(stamp, previewColor)}
              title={`Inserir carimbo ${stamp.name}`}
              aria-label={`Inserir carimbo ${stamp.name}`}
            >
              <div className="uv-stamp-thumb">
                <img
                  src={src}
                  alt={stamp.name}
                  draggable={false}
                  style={{ filter: `drop-shadow(0 0 6px ${previewColor})` }}
                />
              </div>
              <span className="uv-stamp-label">{stamp.name}</span>
            </button>
          );
        })}
      </div>
      <div className="uv-stamps-hint">
        Clique para carimbar no centro. Arraste para mover e use as alças para redimensionar ou rotacionar.
      </div>
    </div>
  );
}
