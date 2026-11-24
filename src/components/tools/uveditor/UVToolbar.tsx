import React, { useRef } from 'react';
import {
  MousePointer,
  Pencil,
  Eraser,
  Type,
  Minus,
  ArrowUpRight,
  Circle,
  Square,
  Camera,
  Undo2,
  Redo2,
  Maximize2,
  Stamp,
} from 'lucide-react';
import { useUVEditor } from './UVEditorContext';
import { UVTool } from './types';

interface UVToolbarProps {
  onAddImageLayer: (file: File) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  undoAvailable?: boolean;
  redoAvailable?: boolean;
  onResetView?: () => void;
  onOpenStamps?: () => void;
  stampsActive?: boolean;
}

export function UVToolbar({
  onAddImageLayer,
  onUndo,
  onRedo,
  undoAvailable = false,
  redoAvailable = false,
  onResetView,
  onOpenStamps,
  stampsActive = false,
}: UVToolbarProps) {
  const { tool, setTool, setPreviewMode } = useUVEditor();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectTool = (next: UVTool) => {
    setPreviewMode('edit');
    setTool(next);
  };

  const toolItems: Array<{ id: UVTool; label: string; icon: React.ReactNode }> = [
    { id: 'select', label: 'Selecionar / Mover / Rotacionar', icon: <MousePointer size={18} /> },
    { id: 'draw', label: 'Pincel UV', icon: <Pencil size={18} /> },
    { id: 'erase', label: 'Borracha', icon: <Eraser size={18} /> },
    { id: 'line', label: 'Linha', icon: <Minus size={18} /> },
    { id: 'arrow', label: 'Seta', icon: <ArrowUpRight size={18} /> },
    { id: 'ellipse', label: 'Círculo / Elipse', icon: <Circle size={18} /> },
    { id: 'rect', label: 'Retângulo', icon: <Square size={18} /> },
    { id: 'placeText', label: 'Texto UV', icon: <Type size={18} /> },
  ];

  return (
    <>
      <div className="uv-tools-dock" role="toolbar" aria-label="Ferramentas de Edição">
        {toolItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tool-button ${tool === item.id ? 'active' : ''}`}
            onClick={() => selectTool(item.id)}
            title={item.label}
            aria-label={item.label}
            aria-pressed={tool === item.id}
          >
            {item.icon}
          </button>
        ))}

        {onOpenStamps && (
          <button
            type="button"
            className={`tool-button ${stampsActive ? 'active' : ''}`}
            onClick={() => {
              setPreviewMode('edit');
              onOpenStamps();
            }}
            title="Carimbos da Ordem & Forenses"
            aria-label="Carimbos da Ordem e Forenses"
            aria-pressed={stampsActive}
          >
            <Stamp size={18} />
          </button>
        )}

        <button
          type="button"
          className="tool-button tool-button--import"
          onClick={() => {
            setPreviewMode('edit');
            fileInputRef.current?.click();
          }}
          title="Importar Imagem / Câmera"
          aria-label="Importar Imagem ou Câmera"
        >
          <Camera size={18} />
        </button>

        <div className="uv-tools-divider" aria-hidden="true" />

        {onUndo && (
          <button
            type="button"
            className="tool-button"
            onClick={onUndo}
            disabled={!undoAvailable}
            title="Desfazer (Ctrl+Z)"
            aria-label="Desfazer"
          >
            <Undo2 size={17} />
          </button>
        )}

        {onRedo && (
          <button
            type="button"
            className="tool-button"
            onClick={onRedo}
            disabled={!redoAvailable}
            title="Refazer (Ctrl+Y)"
            aria-label="Refazer"
          >
            <Redo2 size={17} />
          </button>
        )}

        {onResetView && (
          <button
            type="button"
            className="tool-button"
            onClick={onResetView}
            title="Resetar Zoom / Enquadramento"
            aria-label="Resetar Zoom"
          >
            <Maximize2 size={16} />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files ? e.target.files[0] : null;
          if (!f) return;
          onAddImageLayer(f);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />
    </>
  );
}
