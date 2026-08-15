import React from 'react';
import { Layer } from './tools/UVEditor';
import LayerIcon, { MaskIcon, Eye, EyeOff, Lock, Unlock, Copy, Trash2, Pencil, Layers } from './LayerIcons';

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  isEditing: boolean;
  isLocked: boolean;

  onSelect: (id: string, multi?: boolean, shift?: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onStartEditing: (id: string) => void;
  onStopEditing: () => void;

  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onSetBlendMode?: (id: string, mode: string) => void;
  onToggleMaskEdit?: (id: string) => void;
  tabIndex?: number;
}

export function LayerItem({ layer, isSelected, ...props }: LayerItemProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.onRename(layer.id, e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      props.onStopEditing();
    }
  };

  return (
    <div
      data-layer-id={layer.id}
      className={`layer-item ${isSelected ? 'active' : ''} ${layer.locked ? 'locked' : ''}`}
      role="button"
      tabIndex={0}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, textarea, select, .layer-item-actions, .group-toggle-btn')) return;
        const multi = (e.ctrlKey || e.metaKey);
        const shift = e.shiftKey;
        props.onSelect(layer.id, multi, shift);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const multi = (e.ctrlKey || e.metaKey);
          const shift = e.shiftKey;
          props.onSelect(layer.id, multi, shift);
        }
      }}
      onContextMenu={(e) => {
        if (props.onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          props.onContextMenu(layer.id, e);
        }
      }}
    >
      <div className="layer-controls">

        <button
          className={`layer-btn layer-btn--icon layer-visibility ${!layer.visible ? 'layer-btn--inactive' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            props.onToggleVisibility(layer.id);
          }}
          title={layer.visible ? 'Ocultar camada' : 'Exibir camada'}
          aria-label={layer.visible ? 'Ocultar camada' : 'Exibir camada'}
        >
          {layer.visible ? <Eye size={14} /> : <EyeOff size={14} className="icon-muted" />}
        </button>
        <button
          className={`layer-btn layer-btn--icon layer-lock ${layer.locked ? 'layer-btn--active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            props.onToggleLock(layer.id);
          }}
          title={layer.locked ? 'Desbloquear camada' : 'Bloquear camada'}
          aria-label={layer.locked ? 'Desbloquear camada' : 'Bloquear camada'}
        >
          {layer.locked ? <Lock size={14} className="icon-locked" /> : <Unlock size={14} className="icon-unlocked" />}
        </button>
      </div>

      <div
        className="layer-item-thumbnail"
        onClick={(e) => {
          e.stopPropagation();
          if (!layer.locked) props.onSelect(layer.id);
        }}
        style={{ cursor: 'pointer' }}
        title="Visualização da camada"
      >
        {layer.img ? (
          <img src={(layer.img as any)?.src || String(layer.img)} alt={layer.name} className="layer-img-thumbnail" loading="lazy" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
        ) : layer.mask ? (
          <img src={layer.mask.toDataURL()} alt="Máscara" className="mask-thumbnail" loading="lazy" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <div className="placeholder-thumbnail" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
            <LayerIcon type={layer.type} size={18} className="icon-placeholder" />
          </div>
        )}
      </div>

      <div
        className="layer-item-info"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          if (!layer.locked) {
            const multi = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            props.onSelect(layer.id, multi, shift);
          }
        }}
      >
        {props.isEditing ? (
          <input
            type="text"
            className="layer-name-input"
            value={layer.name}
            onChange={handleNameChange}
            onBlur={props.onStopEditing}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div
            className="layer-item-title"
            onDoubleClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              if (!layer.locked) props.onStartEditing(layer.id);
            }}
          >
            <span className="layer-name-text">{layer.name}</span>
            <button
              className="layer-edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (!layer.locked) props.onStartEditing(layer.id);
              }}
              title="Renomear camada"
              aria-label="Renomear camada"
              tabIndex={0}
            >
              <Pencil size={12} />
            </button>
          </div>
        )}
        <div className="layer-item-type" aria-hidden="true">
          <span className="layer-type-icon" title={layer.type}>
            <LayerIcon type={layer.type} size={12} className="icon-svg" />
          </span>
          {layer.mask ? (
            <span className="layer-mask-icon" title="Possui Máscara">
              <MaskIcon size={12} className="icon-svg" />
            </span>
          ) : null}
        </div>
      </div>


    </div>
  );
}