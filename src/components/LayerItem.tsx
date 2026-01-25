import React from 'react';
import { Layer } from './tools/UVEditor';
import LayerIcon, { MaskIcon } from './LayerIcons';

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  isEditing: boolean;
  isLocked: boolean;
  groupCheck: boolean;
  onSelect: (id: string, multi?: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onStartEditing: (id: string) => void;
  onStopEditing: () => void;
  onToggleGroupCheck: (id: string) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onSetBlendMode?: (id: string, mode: string) => void;
  onToggleMaskEdit?: (id: string) => void;
  tabIndex?: number; // Optional tabIndex for accessibility
}

export function LayerItem({ layer, isSelected, ...props }: LayerItemProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.onRename(layer.id, e.target.value);
  };

  const getLayerIcon = (layer: Layer) => {
    switch (layer.type) {
      case 'text':
        return '🅰️';
      case 'image':
        return '🖼️';
      case 'drawing':
        return '✏️';
      case 'group':
        return '📁';
      default:
        return '📄';
    }
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
        if (target.closest('button, a, input, textarea, .layer-item-actions, .group-toggle-btn')) return;
        const multi = (e.ctrlKey || e.metaKey || e.shiftKey);
        props.onSelect(layer.id, multi);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const multi = (e.ctrlKey || e.metaKey || e.shiftKey);
          props.onSelect(layer.id, multi);
        }
      }}
      onContextMenu={(e) => {
        // Only intercept the context menu if a handler was provided by the parent.
        // Otherwise allow the event to bubble so container wrappers can handle it.
        if (props.onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          props.onContextMenu(layer.id, e);
        }
      }}
    >
      <div className="layer-controls">
        <input
          type="checkbox"
          checked={props.groupCheck}
          onChange={() => props.onToggleGroupCheck(layer.id)}
          onClick={e => e.stopPropagation()}
          title="Selecionar grupo"
        />
        <button className="layer-btn layer-btn--icon layer-visibility" onClick={() => props.onToggleVisibility(layer.id)} title="Alternar visibilidade">
          {layer.visible ? '👁️' : '🚫'}
        </button>
      </div>

      <div className="layer-item-thumbnail" onClick={(e) => { e.stopPropagation(); if (!layer.locked) props.onSelect(layer.id); }} style={{cursor: 'pointer'}}>
        {layer.img ? (
          <img src={(layer.img as any)?.src || String(layer.img)} alt="Layer Thumbnail" className="layer-img-thumbnail" />
        ) : layer.mask ? (
          <img src={layer.mask.toDataURL()} alt="Mask Thumbnail" className="mask-thumbnail" />
        ) : (
          <div className="placeholder-thumbnail" />
        )}
      </div>

      <div
        className="layer-item-info"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          if (!layer.locked) {
            const multi = e.ctrlKey || e.metaKey || e.shiftKey;
            props.onSelect(layer.id, multi);
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
            onDoubleClick={(e: React.MouseEvent) => { e.stopPropagation(); if (!layer.locked) props.onStartEditing(layer.id); }}
          >
            {layer.name}
            <button
              className="layer-edit-btn"
              onClick={(e) => { e.stopPropagation(); if (!layer.locked) props.onStartEditing(layer.id); }}
              title="Editar camada"
              aria-label="Editar camada"
              tabIndex={0}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="0" fill="currentColor" />
                <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" stroke="currentColor" strokeWidth="0" fill="currentColor" />
              </svg>
            </button>
          </div>
        )}
        <div className="layer-item-type" aria-hidden>
          <span className="layer-type-icon" title={layer.type}><LayerIcon type={layer.type} className="icon-svg" /></span>
          {layer.mask ? <span className="layer-mask-icon" title="Mask"><MaskIcon className="icon-svg" /></span> : null}
        </div>
      </div>

      <div className="layer-item-actions">
        <select
          value={layer.blendMode || 'normal'}
          onChange={e => { e.stopPropagation(); props.onSetBlendMode && props.onSetBlendMode(layer.id, e.target.value); }}
          title="Modo de Mesclagem"
          style={{marginRight:8}}
        >
          <option value="normal">Normal</option>
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
          <option value="add">Add</option>
          <option value="darken">Darken</option>
          <option value="lighten">Lighten</option>
        </select>
        <button className="layer-btn" onClick={() => props.onToggleMaskEdit && props.onToggleMaskEdit(layer.id)} title="Editar Máscara">🎯</button>
        <button className="layer-btn" onClick={() => props.onDuplicate(layer.id)} disabled={layer.locked} title="Duplicar">📑</button>
        <button className="layer-btn layer-btn--danger" onClick={() => props.onDelete(layer.id)} disabled={layer.locked} title="Excluir">🗑️</button>
      </div>
    </div>
  );
}