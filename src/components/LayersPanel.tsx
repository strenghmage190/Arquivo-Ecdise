import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LayerItem } from './LayerItem';
import { Layer } from './tools/UVEditor';
import { Tooltip } from './ui/Tooltip';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { LayerPreview } from './LayerPreview';
import {
  FolderPlus,
  Pencil,
  Type,
  ImageIcon,
  Layers,
  Settings,
  Trash2,
  Copy,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Plus,
} from './LayerIcons';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayer: string | null;
  editingLayerName: string | null;

  onSelectLayer: (id: string, multi?: boolean) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRenameLayer: (id: string, newName: string) => void;
  onSetEditingLayerName: (id: string | null) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onReorder?: (source: { droppableId: string; index: number }, destination: { droppableId: string; index: number }) => void;
  onCreateGroup: (ids: string[]) => void;
  onAddDrawingLayer: () => void;
  onAddTextLayer: () => void;
  onAddImageLayer?: (file: File) => void;
  onAddMaskToLayer?: (id: string, mask: HTMLCanvasElement) => void;
  onUpdateLayerOpacity?: (id: string, opacity: number) => void;
  onSetLayerBlendMode?: (id: string, mode: string) => void;
  onToggleMaskEdit?: (id: string) => void;
  onRasterizeLayer?: (id: string) => void;

  onBatchDelete: (ids: string[]) => void;
  onBatchLock: (ids: string[]) => void;
  onBatchUnlock: (ids: string[]) => void;
}

export function LayersPanel(props: LayersPanelProps) {
  const { layers, selectedLayer, onMoveLayer } = props;
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id?: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const activeBatchSelection = selectedLayers;

  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const flatLayers = useMemo(() => {
    const flat: string[] = [];
    layers.forEach(l => {
      flat.push(l.id);
      if (l.type === 'group' && l.childrenData && expandedGroups[l.id]) {
        l.childrenData.forEach(c => flat.push(c.id));
      }
    });
    return flat;
  }, [layers, expandedGroups]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    if (props.onAddImageLayer) {
      props.onAddImageLayer(file);
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleTriggerImageUpload = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleLayerItemContextMenu = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const x = e.clientX;
    const y = e.clientY;
    setContextMenu({ x, y, id });
    props.onSelectLayer(id, false);
  };

  useEffect(() => {
    const onDocMouseDown = (ev: MouseEvent) => {
      try {
        if (ev.button === 2) return;
      } catch (e) {}
      setContextMenu(null);
    };
    document.addEventListener('mousedown', onDocMouseDown);

    const onDocContext = (ev: MouseEvent) => {
      try {
        const target = ev.target as HTMLElement | null;
        if (!target) return;
        const sidebar = document.querySelector('.uv-sidebar-section.layers-section') as HTMLElement | null;
        if (!sidebar) return;
        if (!sidebar.contains(target)) return;
        ev.preventDefault();
        ev.stopPropagation();
        const layerEl = target.closest('[data-layer-id]') as HTMLElement | null;
        const id = layerEl ? layerEl.getAttribute('data-layer-id') || undefined : undefined;
        setContextMenu({ x: ev.clientX, y: ev.clientY, id });
      } catch (e) {
        console.error('[LayersPanel] onDocContext error', e);
      }
    };
    document.addEventListener('contextmenu', onDocContext, true);

    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('contextmenu', onDocContext, true);
    };
  }, []);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;
    const fromDroppable = result.source.droppableId;
    const toDroppable = result.destination.droppableId;

    if (props.onReorder) {
      props.onReorder(
        { droppableId: fromDroppable, index: fromIndex },
        { droppableId: toDroppable, index: toIndex }
      );
      return;
    }

    if (fromIndex !== toIndex) {
      onMoveLayer(fromIndex, toIndex);
    }
  };

  const handleSelectLayer = (id: string, multi = false, shift = false) => {
    if (shift && lastSelectedId) {
      const startIdx = flatLayers.indexOf(lastSelectedId);
      const endIdx = flatLayers.indexOf(id);
      if (startIdx !== -1 && endIdx !== -1) {
        const min = Math.min(startIdx, endIdx);
        const max = Math.max(startIdx, endIdx);
        const rangeIds = flatLayers.slice(min, max + 1);
        setSelectedLayers(prev => Array.from(new Set([...prev, ...rangeIds])));
        setLastSelectedId(id);
        return;
      }
    }

    if (multi) {
      setSelectedLayers(prev =>
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    } else {
      setSelectedLayers([id]);
    }
    setLastSelectedId(id);
  };

  const handleBatchDelete = () => {
    if (activeBatchSelection.length > 0) {
      props.onBatchDelete(activeBatchSelection);
      setSelectedLayers([]);
    }
  };

  const handleBatchLock = () => {
    if (activeBatchSelection.length > 0) {
      props.onBatchLock(activeBatchSelection);
    }
  };

  const handleBatchUnlock = () => {
    if (activeBatchSelection.length > 0) {
      props.onBatchUnlock(activeBatchSelection);
    }
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      localStorage.setItem('uv_expanded_groups', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const savedGroups = localStorage.getItem('uv_expanded_groups');
    if (savedGroups) {
      try {
        setExpandedGroups(JSON.parse(savedGroups));
      } catch (e) {}
    }
  }, []);

  const closeContextMenu = () => setContextMenu(null);

  const renderContextMenu = () => {
    if (!contextMenu) return null;
    if (!contextMenu.id) {
      return (
        <div className="layers-context-menu" style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 2147483646 }} onMouseLeave={closeContextMenu}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Ações para {activeBatchSelection.length} camada(s)</div>
            <button onClick={() => { handleBatchDelete(); }}>Excluir Selecionados</button>
            <button onClick={() => { handleBatchLock(); }}>Bloquear Selecionados</button>
            <button onClick={() => { handleBatchUnlock(); }}>Desbloquear Selecionados</button>
          </div>
        </div>
      );
    }

    const layer = layers.find(l => l.id === contextMenu.id) || layers.flatMap(l => l.type === 'group' && l.childrenData ? l.childrenData : []).find(c => c.id === contextMenu.id);
    if (!layer) return null;
    return (
      <div className="layers-context-menu" style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 2147483646, background: 'var(--panel-bg, #1a1a2e)', color: 'var(--text-color, #fff)', padding: 10, borderRadius: 8, border: '1px solid rgba(0, 243, 255, 0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.7)' }} onMouseLeave={closeContextMenu}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nexus-cyan, #00f3ff)' }}>{layer.name}</div>
          <label style={{ fontSize: 12, opacity: 0.85 }}>Opacidade</label>
          <input type="range" min={0} max={100} defaultValue={layer.opacity || 100} onChange={e => props.onUpdateLayerOpacity && props.onUpdateLayerOpacity(layer.id, Number((e.target as HTMLInputElement).value))} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4, flexWrap: 'wrap' }}>
            {layer.type !== 'drawing' && layer.type !== 'group' && (
              <button onClick={() => { props.onRasterizeLayer?.(layer.id); setContextMenu(null); }} style={{ width: '100%', marginBottom: 4, background: 'rgba(0, 243, 255, 0.1)', color: 'var(--nexus-cyan, #00f3ff)' }}>Rasterizar Camada</button>
            )}
            <button onClick={() => { props.onDuplicateLayer(layer.id); setContextMenu(null); }}>Duplicar</button>
            <button onClick={() => { props.onToggleLock(layer.id); setContextMenu(null); }}>{layer.locked ? 'Desbloquear' : 'Bloquear'}</button>
            <button onClick={() => { props.onDeleteLayer(layer.id); setContextMenu(null); }} style={{ color: 'var(--danger, #ff0055)' }}>Excluir</button>
          </div>
        </div>
      </div>
    );
  };

  const filteredLayers = useMemo(() => {
    return layers.filter(layer =>
      layer.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [layers, searchQuery]);

  const activeLayer = layers.find(l => selectedLayers.includes(l.id)) || layers.flatMap(l => l.type === 'group' && l.childrenData ? l.childrenData : []).find(c => selectedLayers.includes(c.id));
  const currentOpacity = activeLayer?.opacity ?? 100;
  const currentBlendMode = activeLayer?.blendMode ?? 'normal';

  return (
    <div className="uv-sidebar-section layers-section" role="region" aria-label="Painel de Camadas" style={{ display: 'flex', flexDirection: 'column', minWidth: 360, maxWidth: 900, height: '100%', minHeight: 0, resize: 'horizontal', overflow: 'hidden' }}>
      {/* Hidden file input for image uploads */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />

      <div className="layers-header">
        <h4>Camadas ({layers.length})</h4>
        <input
          type="text"
          placeholder="Buscar camadas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="layers-search-input"
          aria-label="Buscar camadas"
        />
        <div className="layers-header-buttons">
          <Tooltip id="add-image-header" text="Adicionar Imagem">
            <button aria-label="Adicionar Imagem" onClick={handleTriggerImageUpload} tabIndex={0} className="icon-btn">
              <ImageIcon size={16} />
            </button>
          </Tooltip>
          <Tooltip id="add-drawing-layer" text="Adicionar Desenho">
            <button aria-label="Adicionar Desenho" onClick={props.onAddDrawingLayer} tabIndex={0} className="icon-btn">
              <Pencil size={16} />
            </button>
          </Tooltip>
          <Tooltip id="add-text-layer" text="Adicionar Texto">
            <button aria-label="Adicionar Texto" onClick={props.onAddTextLayer} tabIndex={0} className="icon-btn">
              <Type size={16} />
            </button>
          </Tooltip>
          <Tooltip id="create-group" text="Criar Grupo">
            <button aria-label="Criar Grupo" onClick={() => props.onCreateGroup(selectedLayers)} tabIndex={0} className="icon-btn">
              <FolderPlus size={16} />
            </button>
          </Tooltip>
          <Tooltip id="actions-toggle" text="Ações em Lote">
            <button
              aria-label="Ações em Lote"
              onClick={() => setShowActionsBar(s => !s)}
              tabIndex={0}
              className={`layers-actions-toggle icon-btn ${(showActionsBar || activeBatchSelection.length > 0) ? 'active' : ''}`}
            >
              <Settings size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="layers-global-controls" style={{ display: 'flex', gap: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(0, 243, 255, 0.1)' }}>
        <select 
          value={currentBlendMode} 
          onChange={e => {
            selectedLayers.forEach(id => props.onSetLayerBlendMode && props.onSetLayerBlendMode(id, e.target.value));
          }}
          disabled={selectedLayers.length === 0}
          className="layer-blend-select"
          style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, padding: '2px 4px', fontSize: 12 }}
        >
          <option value="normal">Normal</option>
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
          <option value="add">Add</option>
          <option value="darken">Darken</option>
          <option value="lighten">Lighten</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <label style={{ fontSize: 11, opacity: 0.7 }}>Opac.</label>
          <input 
            type="range" 
            min={0} max={100} 
            value={currentOpacity} 
            onChange={e => {
              selectedLayers.forEach(id => props.onUpdateLayerOpacity && props.onUpdateLayerOpacity(id, Number(e.target.value)));
            }}
            disabled={selectedLayers.length === 0}
            style={{ flex: 1, minWidth: 40 }}
          />
        </div>
      </div>

      {/* Quick Action bar for multi-selection or toggled batch bar */}
      {(showActionsBar || activeBatchSelection.length > 0) ? (
        <div className="layers-action-bar" role="toolbar" aria-label="Ações de Camada">
          <span className="batch-counter-badge">{activeBatchSelection.length} selecionada(s)</span>
          
          <button
            onClick={() => {
              if (activeBatchSelection.length === 1) props.onDuplicateLayer(activeBatchSelection[0]);
              else activeBatchSelection.forEach(id => props.onDuplicateLayer(id));
            }}
            className="action-btn"
            disabled={activeBatchSelection.length === 0}
          >
            <Copy size={13} style={{ marginRight: 4 }} /> Duplicar
          </button>

          <button onClick={handleBatchLock} className="action-btn" disabled={activeBatchSelection.length === 0}>
            <Lock size={13} style={{ marginRight: 4 }} /> Bloquear
          </button>

          <button onClick={handleBatchUnlock} className="action-btn" disabled={activeBatchSelection.length === 0}>
            <Unlock size={13} style={{ marginRight: 4 }} /> Desbloquear
          </button>

          {activeBatchSelection.length >= 2 && (
            <button onClick={() => props.onCreateGroup(selectedLayers)} className="action-btn">
              <FolderPlus size={13} style={{ marginRight: 4 }} /> Agrupar
            </button>
          )}

          <button onClick={handleBatchDelete} className="action-btn action-btn--danger" disabled={activeBatchSelection.length === 0}>
            <Trash2 size={13} style={{ marginRight: 4 }} /> Excluir
          </button>
        </div>
      ) : null}

      <div className="layers-list-container" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="layers-list">
            {(provided) => (
              <div
                className="layers-list"
                role="list"
                {...provided.droppableProps}
                ref={provided.innerRef}
                onContextMenu={(e: React.MouseEvent) => {
                  e.preventDefault();
                  const target = e.target as HTMLElement;
                  const layerEl = target.closest('[data-layer-id]') as HTMLElement | null;
                  if (layerEl) {
                    const id = layerEl.getAttribute('data-layer-id');
                    if (id) {
                      setContextMenu({ x: e.clientX, y: e.clientY, id });
                      return;
                    }
                  }
                  if (activeBatchSelection.length > 0) {
                    setContextMenu({ x: e.clientX, y: e.clientY });
                  } else {
                    setContextMenu(null);
                  }
                }}
              >
                {layers.length === 0 ? (
                  <div className="layers-empty-state" role="region" aria-label="Nenhuma camada">
                    <div className="empty-title">Nenhuma camada criada</div>
                    <div className="empty-subtitle">Adicione elementos para começar a editar:</div>
                    <div className="empty-actions">
                      <button className="empty-btn" onClick={handleTriggerImageUpload}>
                        <ImageIcon size={16} /> Adicionar Imagem
                      </button>
                      <button className="empty-btn" onClick={props.onAddDrawingLayer}>
                        <Pencil size={16} /> Nova Camada de Desenho
                      </button>
                      <button className="empty-btn" onClick={props.onAddTextLayer}>
                        <Type size={16} /> Inserir Texto
                      </button>
                    </div>
                  </div>
                ) : filteredLayers.length === 0 ? (
                  <div className="no-layers" role="alert">Nenhuma camada encontrada para "{searchQuery}".</div>
                ) : (
                  [...filteredLayers].reverse().map((layer, reverseIndex) => {
                    const actualIndex = filteredLayers.length - 1 - reverseIndex;
                    return (
                      <React.Fragment key={layer.id}>
                        <Draggable key={layer.id} draggableId={layer.id} index={actualIndex}>
                          {(provided) => (
                            <div
                              className="layer-item-wrapper"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                onContextMenu={(e: React.MouseEvent) => handleLayerItemContextMenu(layer.id, e)}
                              >
                                {layer.type === 'group' ? (
                                  <button
                                    aria-label={expandedGroups[layer.id] ? 'Colapsar grupo' : 'Expandir grupo'}
                                    onClick={(e) => { e.stopPropagation(); toggleGroupExpand(layer.id); }}
                                    className="group-toggle-btn icon-btn"
                                  >
                                    {expandedGroups[layer.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                                ) : <div style={{ width: 18 }} />}
                                <LayerItem
                                  layer={layer}
                                  isSelected={selectedLayer === layer.id}
                                  isEditing={props.editingLayerName === layer.id}
                                  isLocked={layer.locked}
                                  onSelect={(id, multi, shift) => {
                                    props.onSelectLayer(id, multi);
                                    handleSelectLayer(id, multi, shift);
                                  }}
                                  onDelete={props.onDeleteLayer}
                                  onDuplicate={props.onDuplicateLayer}
                                  onToggleVisibility={props.onToggleVisibility}
                                  onToggleLock={props.onToggleLock}
                                  onRename={(id, name) => props.onRenameLayer(id, name)}
                                  onStartEditing={(id) => props.onSetEditingLayerName(id)}
                                  onStopEditing={() => props.onSetEditingLayerName(null)}
                                  onSetBlendMode={props.onSetLayerBlendMode}
                                  onToggleMaskEdit={props.onToggleMaskEdit}
                                  tabIndex={0}
                                />
                                <LayerPreview layer={layer} />
                              </div>
                            </div>
                          )}
                        </Draggable>

                        {layer.type === 'group' && expandedGroups[layer.id] && (layer.childrenData || []).length > 0 ? (
                          <Droppable droppableId={`group-${layer.id}`} key={`droppable-${layer.id}`}>
                            {(providedGroup) => (
                              <div className="layer-children" style={{ paddingLeft: 28 }} ref={providedGroup.innerRef} {...providedGroup.droppableProps}>
                                {(layer.childrenData || []).map((child, childIndex) => (
                                  <Draggable key={child.id} draggableId={child.id} index={childIndex}>
                                    {(providedChild) => (
                                      <div
                                        className="layer-item-wrapper"
                                        ref={providedChild.innerRef}
                                        {...providedChild.draggableProps}
                                        {...providedChild.dragHandleProps}
                                        style={{ ...((providedChild as any).draggableProps.style || {}) }}
                                      >
                                        <div
                                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                          onContextMenu={(e: React.MouseEvent) => handleLayerItemContextMenu(child.id, e)}
                                        >
                                          <div style={{ width: 18 }} />
                                          <LayerItem
                                            layer={child}
                                            isSelected={selectedLayer === child.id}
                                            isEditing={props.editingLayerName === child.id}
                                            isLocked={child.locked}
                                            onSelect={(id, multi, shift) => { props.onSelectLayer(id, multi); handleSelectLayer(id, multi, shift); }}
                                            onDelete={props.onDeleteLayer}
                                            onDuplicate={props.onDuplicateLayer}
                                            onToggleVisibility={props.onToggleVisibility}
                                            onToggleLock={props.onToggleLock}
                                            onRename={(id, name) => props.onRenameLayer(id, name)}
                                            onStartEditing={(id) => props.onSetEditingLayerName(id)}
                                            onStopEditing={() => props.onSetEditingLayerName(null)}
                                            onSetBlendMode={props.onSetLayerBlendMode}
                                            onToggleMaskEdit={props.onToggleMaskEdit}
                                            tabIndex={0}
                                          />
                                          <LayerPreview layer={child} />
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {providedGroup.placeholder}
                              </div>
                            )}
                          </Droppable>
                        ) : null}
                      </React.Fragment>
                    );
                  })
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="layers-footer">
        <div className="layers-footer-left">
          <Tooltip id="add-image-footer" text="Adicionar Imagem">
            <button className="icon-btn" aria-label="Adicionar Imagem" onClick={handleTriggerImageUpload}>
              <ImageIcon size={16} />
            </button>
          </Tooltip>

          <Tooltip id="add-drawing-footer" text="Criar nova camada de desenho">
            <button className="icon-btn" aria-label="Criar nova camada de desenho" onClick={props.onAddDrawingLayer}>
              <Pencil size={16} />
            </button>
          </Tooltip>

          <Tooltip id="add-text-footer" text="Adicionar Texto">
            <button className="icon-btn" aria-label="Adicionar Texto" onClick={props.onAddTextLayer}>
              <Type size={16} />
            </button>
          </Tooltip>

          <Tooltip id="create-group-footer" text="Criar novo grupo">
            <button className="icon-btn" aria-label="Criar novo grupo" onClick={() => props.onCreateGroup(selectedLayers)}>
              <FolderPlus size={16} />
            </button>
          </Tooltip>
        </div>

        <div style={{ flex: 1 }} />

        <div className="layers-footer-right">
          <Tooltip id="delete-selected-footer" text="Excluir camadas selecionadas">
            <button className="icon-btn icon-btn--danger" aria-label="Excluir camadas selecionadas" onClick={handleBatchDelete} disabled={activeBatchSelection.length === 0}>
              <Trash2 size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      {renderContextMenu()}
    </div>
  );
}