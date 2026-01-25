import React, { useState, useMemo, useEffect } from 'react';
import { LayerItem } from './LayerItem';
import { Layer } from './tools/UVEditor';
import { Tooltip } from './ui/Tooltip';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { LayerPreview } from './LayerPreview';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayer: string | null;
  editingLayerName: string | null;
  groupChecks: Record<string, boolean>;
  onSelectLayer: (id: string, multi?: boolean) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRenameLayer: (id: string, newName: string) => void;
  onSetEditingLayerName: (id: string | null) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onReorder?: (source: { droppableId: string; index: number }, destination: { droppableId: string; index: number }) => void;
  onCreateGroup: () => void;
  onAddDrawingLayer: () => void;
  onAddTextLayer: () => void;
  onAddMaskToLayer?: (id: string, mask: HTMLCanvasElement) => void;
  onUpdateLayerOpacity?: (id: string, opacity: number) => void;
  onSetLayerBlendMode?: (id: string, mode: string) => void;
  onToggleMaskEdit?: (id: string) => void;
  onToggleGroupCheck: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchLock: (ids: string[]) => void;
  onBatchUnlock: (ids: string[]) => void;
}

export function LayersPanel(props: LayersPanelProps) {
  const { layers, selectedLayer, onMoveLayer } = props;
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id?: string } | null>(null);

  const handleLayerItemContextMenu = (id: string, e: React.MouseEvent) => {
    console.debug('[LayersPanel] handleLayerItemContextMenu', { id, x: e.clientX, y: e.clientY, target: (e.target as HTMLElement)?.tagName });
    e.preventDefault(); // impede o menu padrão do navegador
    e.stopPropagation(); // evita propagação ao contêiner pai
    const x = e.clientX;
    const y = e.clientY;
    console.debug('[LayersPanel] setContextMenu from item', { id, x, y });
    setContextMenu({ x, y, id });
    props.onSelectLayer(id, false);
  };

  useEffect(() => {
    // Close context menu on left-button clicks, but ignore right-button (contextmenu) clicks
    const onDocMouseDown = (ev: MouseEvent) => {
      try {
        if (ev.button === 2) return; // right button - ignore
      } catch (e) {}
      setContextMenu(null);
    };
    document.addEventListener('mousedown', onDocMouseDown);

    // Capture 'contextmenu' at the document level in the capture phase to ensure
    // we intercept right-clicks inside the layers panel before other handlers
    const onDocContext = (ev: MouseEvent) => {
      try {
        const target = ev.target as HTMLElement | null;
        console.debug('[LayersPanel] onDocContext capture', { x: ev.clientX, y: ev.clientY, targetTag: target?.tagName });
        if (!target) return;
        const sidebar = document.querySelector('.uv-sidebar-section.layers-section') as HTMLElement | null;
        if (!sidebar) return;
        if (!sidebar.contains(target)) return;
        ev.preventDefault();
        ev.stopPropagation();
        const layerEl = target.closest('[data-layer-id]') as HTMLElement | null;
        const id = layerEl ? layerEl.getAttribute('data-layer-id') || undefined : undefined;
        console.debug('[LayersPanel] onDocContext will setContextMenu', { id });
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

    // If parent provided a generic reorder handler, use it for all moves
    if (props.onReorder) {
      props.onReorder({ droppableId: fromDroppable, index: fromIndex }, { droppableId: toDroppable, index: toIndex });
      return;
    }

    // Backwards-compatible: only handle top-level reorders via onMoveLayer
    if (fromDroppable === 'layers-list' && toDroppable === 'layers-list') {
      if (fromIndex !== toIndex) onMoveLayer(fromIndex, toIndex);
    }
  };

  const handleSelectLayer = (id: string, multi?: boolean) => {
    if (multi) {
      setSelectedLayers((prev) => (prev.includes(id) ? prev.filter((layerId) => layerId !== id) : [...prev, id]));
    } else {
      setSelectedLayers([id]);
    }
  };

  const selectedLayerObj = selectedLayer ? (layers.find(l => l.id === selectedLayer) || layers.flatMap(l => l.type === 'group' && l.childrenData ? l.childrenData : []).find(c => c.id === selectedLayer)) : null;

  const handleBatchDelete = () => {
    props.onBatchDelete(selectedLayers);
    setSelectedLayers([]);
    setContextMenu(null);
  };

  const handleBatchLock = () => {
    props.onBatchLock(selectedLayers);
    setContextMenu(null);
  };

  const handleBatchUnlock = () => {
    props.onBatchUnlock(selectedLayers);
    setContextMenu(null);
  };

  const toggleGroupExpand = (id: string) => {
    setExpandedGroups(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('expandedGroups', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const savedGroups = localStorage.getItem('expandedGroups');
    if (savedGroups) {
      setExpandedGroups(JSON.parse(savedGroups));
    }
  }, []);

  const closeContextMenu = () => setContextMenu(null);

  const handleContextAction = (action: string) => {
    const id = contextMenu?.id;
    if (!id) return;
    switch(action) {
      case 'delete': props.onBatchDelete ? props.onBatchDelete([id]) : props.onDeleteLayer(id); break;
      case 'duplicate': props.onDuplicateLayer(id); break;
      case 'lock': props.onToggleLock(id); break;
      case 'rename': props.onSetEditingLayerName && props.onSetEditingLayerName(id); break;
      case 'blend': break; // Placeholder for blending logic
    }
    closeContextMenu();
  };

  const renderContextMenu = () => {
    if (!contextMenu) return null;
    // batch actions when no specific id provided
      if (!contextMenu.id) {
      return (
        <div className="layers-context-menu" style={{position:'fixed', left:contextMenu.x, top:contextMenu.y, zIndex:2147483646}} onMouseLeave={closeContextMenu}>
          <div style={{display:'flex', flexDirection:'column', gap:8, minWidth:180}}>
            <div style={{fontSize:13, fontWeight:600}}>Ações para {selectedLayers.length} camada(s)</div>
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
      <div className="layers-context-menu" style={{position:'fixed',left:contextMenu.x,top:contextMenu.y,zIndex:2147483646, background:'var(--panel-bg, #222)', color:'var(--text-color, #fff)', padding:8, borderRadius:6, boxShadow:'0 8px 24px rgba(0,0,0,0.5)'}} onMouseLeave={closeContextMenu}>
        <div style={{display:'flex', flexDirection:'column', gap:8, minWidth:180}}>
          <div style={{fontSize:13, fontWeight:600}}>{layer.name}</div>
          <label style={{fontSize:12, opacity:0.85}}>Opacidade</label>
          <input type="range" min={0} max={100} defaultValue={layer.opacity || 100} onChange={e => props.onUpdateLayerOpacity && props.onUpdateLayerOpacity(layer.id, Number((e.target as HTMLInputElement).value))} />
          <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <button onClick={() => { props.onDuplicateLayer(layer.id); setContextMenu(null); }}>Duplicar</button>
            <button onClick={() => { props.onToggleLock(layer.id); setContextMenu(null); }}>{layer.locked ? 'Desbloquear' : 'Bloquear'}</button>
            <button onClick={() => { props.onDeleteLayer(layer.id); setContextMenu(null); }} style={{color:'var(--danger, #f66)'}}>Excluir</button>
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

  return (
    <div className="uv-sidebar-section layers-section" role="region" aria-label="Painel de Camadas" style={{display:'flex', flexDirection:'column', minWidth:360, maxWidth:900, minHeight:0, resize:'horizontal', overflow:'auto'}}>
      <div className="layers-header">
        <h4>📦 Camadas ({layers.length})</h4>
        <input
          type="text"
          placeholder="Buscar camadas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="layers-search-input"
          aria-label="Buscar camadas"
        />
        <div className="layers-header-buttons">
          <Tooltip id="create-group" text="Criar Grupo">
            <button aria-label="Criar Grupo" onClick={props.onCreateGroup} tabIndex={0}>
              <i className="icon-group"></i>
            </button>
          </Tooltip>
          <Tooltip id="add-drawing-layer" text="Adicionar Camada de Desenho">
            <button aria-label="Adicionar Camada de Desenho" onClick={props.onAddDrawingLayer} tabIndex={0}>
              <i className="icon-draw"></i>
            </button>
          </Tooltip>
          <Tooltip id="add-text-layer" text="Adicionar Camada de Texto">
            <button aria-label="Adicionar Camada de Texto" onClick={props.onAddTextLayer} tabIndex={0}>
              <i className="icon-text"></i>
            </button>
          </Tooltip>
          <Tooltip id="add-mask" text="Adicionar Máscara">
            <button
              aria-label="Adicionar Máscara"
              onClick={() => {
                if (!selectedLayer) return;
                const targetLayer = layers.find(l => l.id === selectedLayer);
                const w = (targetLayer as any)?.width || 512;
                const h = (targetLayer as any)?.height || 512;
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = w;
                maskCanvas.height = h;
                const maskCtx = maskCanvas.getContext('2d');
                if (maskCtx) {
                  maskCtx.fillStyle = 'white';
                  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
                }
                if (props.onAddMaskToLayer) {
                  props.onAddMaskToLayer(selectedLayer, maskCanvas);
                } else {
                  // fallback for existing handlers
                  props.onAddDrawingLayer();
                }
              }}
              tabIndex={0}
            >
              <i className="icon-mask"></i>
            </button>
          </Tooltip>
          <Tooltip id="actions-toggle" text="Mostrar ações de camada">
            <button aria-label="Mostrar ações" onClick={() => setShowActionsBar(s => !s)} tabIndex={0} className="layers-actions-toggle">
              ⚙️
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Actions bar: visible when toggled and there is a selection */}
      {showActionsBar && selectedLayers.length > 0 ? (
        <div className="layers-action-bar" role="toolbar" aria-label="Ações de Camada">
          <button onClick={() => {
            // duplicate first selected if single, otherwise duplicate each
            if (selectedLayers.length === 1) props.onDuplicateLayer(selectedLayers[0]);
            else selectedLayers.forEach(id => props.onDuplicateLayer(id));
          }}>Duplicar</button>

          <button onClick={() => {
            props.onBatchLock(selectedLayers);
          }}>Bloquear</button>

          <button onClick={() => {
            props.onBatchUnlock(selectedLayers);
          }}>Desbloquear</button>

          <button onClick={() => { handleBatchDelete(); }}>Excluir</button>
        </div>
      ) : null}

      {selectedLayerObj ? (
        <div className="selected-opacity" style={{display:'flex', alignItems:'center', gap:8, padding:'6px 0'}}>
          <label style={{fontSize:12, color:'var(--text-color-dimmed)'}}>Opacidade</label>
          <input
            type="range"
            min={0}
            max={100}
            value={selectedLayerObj.opacity ?? 100}
            onChange={e => { if (props.onUpdateLayerOpacity) props.onUpdateLayerOpacity(selectedLayerObj.id, Number((e.target as HTMLInputElement).value)); }}
          />
        </div>
      ) : null}
      {/* Selected-layer properties handled in right properties panel; context menu used for quick actions */}

      <div className="layers-list-container" style={{flex:1, minHeight:0, overflow:'auto'}}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="layers-list">
            {(provided) => (
              <div
                className="layers-list"
                role="list"
                {...provided.droppableProps}
                ref={provided.innerRef}
                onContextMenu={(e: React.MouseEvent) => {
                  // Always prevent the browser context menu inside the layers list
                  console.debug('[LayersPanel] layers-list onContextMenu', { x: e.clientX, y: e.clientY, target: (e.target as HTMLElement)?.tagName });
                  e.preventDefault();
                  const target = e.target as HTMLElement;
                  // Try to find the closest element that holds the layer id
                  const layerEl = target.closest('[data-layer-id]') as HTMLElement | null;
                  if (layerEl) {
                    const id = layerEl.getAttribute('data-layer-id');
                    console.debug('[LayersPanel] layers-list found data-layer-id', { id });
                    if (id) {
                      setContextMenu({ x: e.clientX, y: e.clientY, id });
                      return;
                    }
                  }
                  // Fallback: show batch menu when selection exists
                  console.debug('[LayersPanel] layers-list no layerEl, selectedLayers.length=', selectedLayers.length);
                  if (selectedLayers.length > 0) {
                    setContextMenu({ x: e.clientX, y: e.clientY });
                  } else {
                    setContextMenu(null);
                  }
                }}
              >
              {filteredLayers.length === 0 ? (
                <div className="no-layers" role="alert">Nenhuma camada encontrada.</div>
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
                            <div style={{display:'flex', alignItems:'center', gap:12}}
                              onContextMenu={(e: React.MouseEvent) => handleLayerItemContextMenu(layer.id, e)}
                            >
                              {layer.type === 'group' ? (
                                <button
                                  aria-label={expandedGroups[layer.id] ? 'Colapsar grupo' : 'Expandir grupo'}
                                  onClick={(e) => { e.stopPropagation(); toggleGroupExpand(layer.id); }}
                                  className="group-toggle-btn"
                                >
                                  {expandedGroups[layer.id] ? '▾' : '▸'}
                                </button>
                              ) : <div style={{width:18}} />}
                              <LayerItem
                                layer={layer}
                                isSelected={selectedLayer === layer.id}
                                isEditing={props.editingLayerName === layer.id}
                                isLocked={layer.locked}
                                groupCheck={!!props.groupChecks[layer.id]}
                                onSelect={(id, multi) => {
                                  props.onSelectLayer(id, multi);
                                  handleSelectLayer(id, multi);
                                }}
                                onDelete={props.onDeleteLayer}
                                onDuplicate={props.onDuplicateLayer}
                                onToggleVisibility={props.onToggleVisibility}
                                onToggleLock={props.onToggleLock}
                                onRename={(id, name) => props.onRenameLayer(id, name)}
                                onStartEditing={(id) => props.onSetEditingLayerName(id)}
                                onStopEditing={() => props.onSetEditingLayerName(null)}
                                onToggleGroupCheck={props.onToggleGroupCheck}
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
                            <div className="layer-children" style={{paddingLeft: 28}} ref={providedGroup.innerRef} {...providedGroup.droppableProps}>
                              {(layer.childrenData || []).map((child, childIndex) => (
                                <Draggable key={child.id} draggableId={child.id} index={childIndex}>
                                  {(providedChild) => (
                                    <div
                                      className="layer-item-wrapper"
                                      ref={providedChild.innerRef}
                                      {...providedChild.draggableProps}
                                      {...providedChild.dragHandleProps}
                                      style={{...((providedChild as any).draggableProps.style || {})}}
                                    >
                                      <div style={{display:'flex', alignItems:'center', gap:12}}
                                           onContextMenu={(e: React.MouseEvent) => handleLayerItemContextMenu(child.id, e)}>
                                        <div style={{width:18}} />
                                        <LayerItem
                                          layer={child}
                                          isSelected={selectedLayer === child.id}
                                          isEditing={props.editingLayerName === child.id}
                                          isLocked={child.locked}
                                          groupCheck={!!props.groupChecks[child.id]}
                                          onSelect={(id, multi) => { props.onSelectLayer(id, multi); handleSelectLayer(id, multi); }}
                                          onDelete={props.onDeleteLayer}
                                          onDuplicate={props.onDuplicateLayer}
                                          onToggleVisibility={props.onToggleVisibility}
                                          onToggleLock={props.onToggleLock}
                                          onRename={(id, name) => props.onRenameLayer(id, name)}
                                          onStartEditing={(id) => props.onSetEditingLayerName(id)}
                                          onStopEditing={() => props.onSetEditingLayerName(null)}
                                          onToggleGroupCheck={props.onToggleGroupCheck}
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

      {/* Rodapé com botões de ação */}
      <div className="layers-footer">
        <Tooltip id="add-drawing-footer" text="Criar nova camada de desenho">
          <button onClick={props.onAddDrawingLayer}>Nova Camada</button>
        </Tooltip>
        <Tooltip id="create-group-footer" text="Criar um grupo de camadas">
          <button onClick={props.onCreateGroup}>Novo Grupo</button>
        </Tooltip>
        <div style={{flex:1}} />
        <Tooltip id="delete-selected-footer" text="Excluir camadas selecionadas">
          <button onClick={handleBatchDelete} disabled={selectedLayers.length === 0}>Excluir</button>
        </Tooltip>
      </div>

      {renderContextMenu()}
    </div>
  );
}