import React, { useState } from 'react';
import { Trash2, GripHorizontal } from 'lucide-react';
import type { BoardZone } from '../../store/boardStore';

export interface MagneticGuides {
  x: number | null;
  y: number | null;
}

interface BoardZonesLayerProps {
  zones: BoardZone[];
  zoom: number;
  canEdit: boolean;
  guides?: MagneticGuides;
  onUpdateZone: (id: string, patch: Partial<BoardZone>) => void;
  onDeleteZone: (id: string) => void;
}

const ZONE_COLORS = [
  { id: 'slate', value: '#64748b', label: 'Neutro' },
  { id: 'sangue', value: '#e63946', label: 'Sangue' },
  { id: 'energia', value: '#a855f7', label: 'Energia' },
  { id: 'conhecimento', value: '#eab308', label: 'Conhecimento' },
  { id: 'verified', value: '#2ecc71', label: 'Confirmado' },
];

export const BoardZonesLayer: React.FC<BoardZonesLayerProps> = ({
  zones,
  zoom,
  canEdit,
  guides,
  onUpdateZone,
  onDeleteZone,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const startDragZone = (e: React.PointerEvent, zone: BoardZone) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = zone.x;
    const origY = zone.y;

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / Math.max(zoom, 0.1);
      const dy = (ev.clientY - startY) / Math.max(zoom, 0.1);
      onUpdateZone(zone.id, { x: Math.round(origX + dx), y: Math.round(origY + dy) });
    };

    const onUp = (ev: PointerEvent) => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {
        // ignore
      }
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  const startResizeZone = (e: React.PointerEvent, zone: BoardZone) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = zone.width;
    const origH = zone.height;

    const onMove = (ev: PointerEvent) => {
      const dw = (ev.clientX - startX) / Math.max(zoom, 0.1);
      const dh = (ev.clientY - startY) / Math.max(zoom, 0.1);
      onUpdateZone(zone.id, {
        width: Math.max(260, Math.round(origW + dw)),
        height: Math.max(200, Math.round(origH + dh)),
      });
    };

    const onUp = (ev: PointerEvent) => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {
        // ignore
      }
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  return (
    <>
      <div className="board-zones-layer" aria-label="Zonas de agrupamento">
        {zones.map((zone) => {
          const accent = zone.color || '#64748b';
          const isEditing = editingId === zone.id;
          return (
            <div
              key={zone.id}
              className="board-zone-frame"
              style={{
                left: zone.x,
                top: zone.y,
                width: zone.width,
                height: zone.height,
                borderColor: `${accent}88`,
                backgroundColor: `${accent}12`,
              }}
            >
              <div
                className="board-zone-header"
                style={{ borderBottomColor: `${accent}55`, color: accent }}
                onPointerDown={(e) => startDragZone(e, zone)}
              >
                <span className="board-zone-grip" aria-hidden="true">
                  <GripHorizontal size={14} />
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    className="board-zone-title-input"
                    value={zone.title}
                    autoFocus
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateZone(zone.id, { title: e.target.value })}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditingId(null);
                    }}
                  />
                ) : (
                  <span
                    className="board-zone-title"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingId(zone.id);
                    }}
                    title="Duplo clique para renomear zona"
                  >
                    {zone.title || 'ZONA DE INVESTIGAÇÃO'}
                  </span>
                )}

                <div className="board-zone-controls" onPointerDown={(e) => e.stopPropagation()}>
                  {ZONE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`board-zone-color-dot ${accent === c.value ? 'active' : ''}`}
                      style={{ backgroundColor: c.value }}
                      title={`Cor: ${c.label}`}
                      aria-label={`Cor da zona: ${c.label}`}
                      onClick={() => onUpdateZone(zone.id, { color: c.value })}
                    />
                  ))}
                  {canEdit && (
                    <button
                      type="button"
                      className="board-zone-delete-btn"
                      title="Remover zona"
                      aria-label="Remover zona"
                      onClick={() => onDeleteZone(zone.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div
                className="board-zone-resize-handle"
                title="Arraste para redimensionar zona"
                onPointerDown={(e) => startResizeZone(e, zone)}
              />
            </div>
          );
        })}
      </div>

      {/* Guias magnéticas de alinhamento */}
      {guides && (guides.x !== null || guides.y !== null) && (
        <div className="magnetic-guides-layer" aria-hidden="true">
          {guides.x !== null && (
            <div
              className="magnetic-guide-v"
              style={{ left: guides.x }}
            />
          )}
          {guides.y !== null && (
            <div
              className="magnetic-guide-h"
              style={{ top: guides.y }}
            />
          )}
        </div>
      )}
    </>
  );
};

export default BoardZonesLayer;
