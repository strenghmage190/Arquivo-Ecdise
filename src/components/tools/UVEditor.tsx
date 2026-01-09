import React, { useState, useRef, useEffect } from 'react';
import './UVEditor.css';
import './UVEditor.animations.css';
import './UVEditor.animations.css';

// Interface para as propriedades do componente
interface UVEditorProps {
  baseImageUrl: string;
  onSave: (file: File) => void;
  onClose: () => void;
  mode?: 'uv' | 'filter';
}

// Definindo o tipo para uma Camada (Layer)
type Layer = {
  id: string;
  type: 'text' | 'drawing' | 'image' | 'group';
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  x: number;
  y: number;
  text?: string;
  size?: number;
  color?: string;
  drawingCanvas?: HTMLCanvasElement;
  img?: HTMLImageElement;
  scale?: number;
  parentId?: string | null;
  children?: string[];
  isExpanded?: boolean;
  blendMode?: GlobalCompositeOperation;
};

// Definição do Componente
export default function UVEditor({ baseImageUrl, onSave, onClose, mode = 'uv' }: UVEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- ESTADO DO COMPONENTE ---
  const [layers, setLayersState] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [history, setHistory] = useState<Layer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [multiSelectIds, setMultiSelectIds] = useState<Set<string>>(new Set());

  // Ferramentas
  const [tool, setTool] = useState<'select' | 'draw' | 'erase'>('select');
  const [color, setColor] = useState(mode === 'filter' ? '#ffffff' : '#b366ff');
  const [brushSize, setBrushSize] = useState(mode === 'filter' ? 18 : 6);

  // Referência para controlar ações do mouse (desenhar, arrastar)
  const actionRef = useRef<{
    type: 'draw' | 'drag' | 'resize';
    startX: number;
    startY: number;
    tempCanvas?: HTMLCanvasElement;
    initialLayerState?: Layer;
    // for resize
    handle?: 'nw' | 'ne' | 'sw' | 'se';
    initialBounds?: { x: number; y: number; w: number; h: number };
    initialScale?: number;
    initialSize?: number;
    // for direct draw/erase
    targetLayerId?: string | null;
    directCtx?: CanvasRenderingContext2D | null;
  } | null>(null);

  // --- LÓGICA DE HISTÓRICO (UNDO/REDO) ---
  const updateLayersAndRecordHistory = (newLayers: Layer[] | ((prev: Layer[]) => Layer[])) => {
    const updatedLayers = typeof newLayers === 'function' ? newLayers(layers) : newLayers;
    setLayersState(updatedLayers);
    const newHistory = history.slice(0, historyIndex + 1);
    // store serialized snapshot: copy props and serialize any drawingCanvas to dataURL
    const snapshot = updatedLayers.map(l => {
      const copy: any = { ...l };
      if (l.drawingCanvas) {
        try {
          // deep-copy canvas bitmap into a new canvas for immediate undo/redo fidelity
          const c = document.createElement('canvas');
          c.width = l.drawingCanvas.width;
          c.height = l.drawingCanvas.height;
          const cctx = c.getContext('2d')!;
          cctx.clearRect(0, 0, c.width, c.height);
          cctx.drawImage(l.drawingCanvas, 0, 0);
          copy.drawingCanvasCopy = c;
        } catch (err) {
          copy.drawingCanvasCopy = undefined;
        }
        try {
          copy.drawingDataUrl = l.drawingCanvas.toDataURL();
        } catch (err) {
          copy.drawingDataUrl = undefined;
        }
        // don't store original DOM canvas reference in history snapshot
        delete copy.drawingCanvas;
      }
      return copy;
    });
    newHistory.push(snapshot);
    setHistory(newHistory as any);
    setHistoryIndex(newHistory.length - 1);
  };

  const restoreSnapshot = (snapshot: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return snapshot.map(s => ({ ...s }));
    // reconstruct drawingCanvas from serialized dataURL (async image load)
    const reconstructed = snapshot.map(s => {
      const copy: any = { ...s };
      if (s.drawingCanvasCopy) {
        // prefer in-memory canvas copy stored in snapshot
        copy.drawingCanvas = s.drawingCanvasCopy;
        delete copy.drawingCanvasCopy;
      } else if (s.drawingDataUrl) {
        const c = document.createElement('canvas');
        c.width = canvas.width;
        c.height = canvas.height;
        copy.drawingCanvas = c;
        // draw image into canvas once it's loaded
        const img = new Image();
        img.onload = () => {
          const ctx = c.getContext('2d')!;
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0);
          // update live state to ensure UI reflects the restored pixel data
          setLayersState(prev => prev.map(p => p.id === copy.id ? { ...p, drawingCanvas: c } : p));
        };
        img.src = s.drawingDataUrl;
        delete copy.drawingDataUrl;
      }
      return copy;
    });
    return reconstructed;
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const snapshot = history[newIndex] as any[];
      const restored = restoreSnapshot(snapshot);
      setLayersState(restored as Layer[]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const snapshot = history[newIndex] as any[];
      const restored = restoreSnapshot(snapshot);
      setLayersState(restored as Layer[]);
    }
  };

  // --- RENDERIZAÇÃO NO CANVAS ---
  const redrawAll = () => {
    const canvas = canvasRef.current;
    const baseImg = baseImageRef.current;
    if (!canvas || !baseImg) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    const drawSingle = (layer: Layer) => {
      if (!layer.visible) return;
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.blendMode || 'source-over';
      if (layer.type === 'drawing' && layer.drawingCanvas) {
        ctx.drawImage(layer.drawingCanvas, 0, 0);
      } else if (layer.type === 'text' && layer.text) {
        ctx.fillStyle = layer.color || '#000000';
        ctx.font = `${layer.size || 24}px 'Share Tech Mono', monospace`;
        ctx.textBaseline = 'top';
        ctx.fillText(layer.text, layer.x, layer.y);
      } else if ((layer as any).type === 'image' && (layer as any).img) {
        const img = (layer as any).img as HTMLImageElement;
        const scale = (layer as any).scale ?? 1;
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, layer.x - w / 2, layer.y - h / 2, w, h);
      }
      ctx.restore();
    };

    // draw only top-level layers; grouped children are drawn when their group is encountered
    layers.forEach(layer => {
      if (layer.parentId) return; // skip child entries
      if (layer.type === 'group') {
        // draw group's children in the group's children order
        const ids = layer.children || [];
        ids.forEach(cid => {
          const child = layers.find(l => l.id === cid);
          if (child) drawSingle(child);
        });
      } else {
        drawSingle(layer);
      }
    });

    // draw selection bounds and handles for the selected layer
    if (selectedLayerId) {
      const layer = layers.find(l => l.id === selectedLayerId);
      if (layer) {
        ctx.save();
        let bounds = { x: 0, y: 0, w: 0, h: 0 };
        if (layer.type === 'text') {
          ctx.font = `${layer.size || 24}px 'Share Tech Mono', monospace`;
          bounds.w = ctx.measureText(layer.text || '').width;
          bounds.h = (layer.size || 24) * 1.2;
          bounds.x = layer.x;
          bounds.y = layer.y;
        } else if (layer.type === 'image' && (layer as any).img) {
          const img = (layer as any).img as HTMLImageElement;
          const scale = (layer as any).scale ?? 1;
          bounds.w = img.naturalWidth * scale;
          bounds.h = img.naturalHeight * scale;
          bounds.x = layer.x - bounds.w / 2;
          bounds.y = layer.y - bounds.h / 2;
        } else if (layer.type === 'drawing' && layer.drawingCanvas) {
          bounds.x = 0; bounds.y = 0; bounds.w = canvas.width; bounds.h = canvas.height;
        }

        // dashed rect
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
        ctx.setLineDash([]);

        // handle size
        const hs = 10;
        // draw handles
        ctx.fillStyle = '#00ffff';
        // bottom-right
        ctx.fillRect(bounds.x + bounds.w - hs/2, bounds.y + bounds.h - hs/2, hs, hs);
        // bottom-left
        ctx.fillRect(bounds.x - hs/2, bounds.y + bounds.h - hs/2, hs, hs);
        // top-left
        ctx.fillRect(bounds.x - hs/2, bounds.y - hs/2, hs, hs);
        // top-right
        ctx.fillRect(bounds.x + bounds.w - hs/2, bounds.y - hs/2, hs, hs);

        ctx.restore();
      }
    }

    if (actionRef.current?.type === 'draw' && actionRef.current.tempCanvas) {
      ctx.drawImage(actionRef.current.tempCanvas, 0, 0);
    }
  };

  useEffect(() => { redrawAll(); }, [layers]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImageUrl;
    img.onload = () => {
      baseImageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxWidth = 900;
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      redrawAll();
      setHistory([[]]);
      setHistoryIndex(0);
    };
  }, [baseImageUrl]);

  // Keyboard shortcuts for layer reordering and deletion
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedLayerId) return;
      if (e.key === 'Delete') {
        e.preventDefault();
        deleteLayer(selectedLayerId);
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = layers.findIndex(l => l.id === selectedLayerId);
        if (idx === -1) return;
        const newLayers = [...layers];
        if (e.key === 'ArrowUp' && idx < layers.length - 1) {
          // move up (towards front/top)
          const tmp = newLayers[idx+1]; newLayers[idx+1] = newLayers[idx]; newLayers[idx] = tmp;
          updateLayersAndRecordHistory(newLayers);
        } else if (e.key === 'ArrowDown' && idx > 0) {
          // move down (towards back/bottom)
          const tmp = newLayers[idx-1]; newLayers[idx-1] = newLayers[idx]; newLayers[idx] = tmp;
          updateLayersAndRecordHistory(newLayers);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedLayerId, layers]);

  // --- INTERAÇÕES DO MOUSE ---
  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);

    if (tool === 'draw' || tool === 'erase') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasRef.current!.width;
      tempCanvas.height = canvasRef.current!.height;
      // If erasing directly into an existing drawing layer, draw to that layer's canvas
      if (tool === 'erase') {
        // prefer selected drawing layer
        let target = layers.find(l => l.id === selectedLayerId && l.type === 'drawing');
        if (!target) {
          // fallback to last drawing layer
          for (let i = layers.length - 1; i >= 0; i--) {
            if (layers[i].type === 'drawing') { target = layers[i]; break; }
          }
        }

        if (target && target.drawingCanvas) {
          const dctx = target.drawingCanvas.getContext('2d')!;
          dctx.globalCompositeOperation = 'destination-out';
          dctx.strokeStyle = 'rgba(0,0,0,1)';
          dctx.lineWidth = brushSize;
          dctx.lineCap = 'round';
          dctx.lineJoin = 'round';
          dctx.beginPath();
          dctx.moveTo(x, y);
          actionRef.current = { type: 'draw', startX: x, startY: y, directCtx: dctx, targetLayerId: target.id };
          return;
        }

        // otherwise draw to tempCanvas and merge later
      }

      const ctx = tempCanvas.getContext('2d')!;
      if (tool === 'erase') ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      actionRef.current = { type: 'draw', startX: x, startY: y, tempCanvas, targetLayerId: undefined };
      return;
    }

    if (tool === 'select') {
      // Find top-most layer under the pointer (basic bounding boxes for text/image/drawing)
      const found = [...layers].reverse().find(l => {
        if (!l.visible) return false;
        const ctx = canvasRef.current!.getContext('2d')!;
        let bx = 0, by = 0, bw = 0, bh = 0;
        if (l.type === 'text' && l.text) {
          ctx.font = `${l.size || 24}px 'Share Tech Mono', monospace`;
          bw = ctx.measureText(l.text).width;
          bh = (l.size || 24) * 1.2;
          bx = l.x; by = l.y;
        } else if (l.type === 'image' && (l as any).img) {
          const img = (l as any).img as HTMLImageElement;
          const scale = (l as any).scale ?? 1;
          bw = img.naturalWidth * scale;
          bh = img.naturalHeight * scale;
          bx = l.x - bw / 2;
          by = l.y - bh / 2;
        } else if (l.type === 'drawing') {
          bx = 0; by = 0; bw = canvasRef.current!.width; bh = canvasRef.current!.height;
        }
        return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
      });

      if (found && !found.locked) {
        // determine if pointer hit a resize handle on the found layer
        const ctx = canvasRef.current!.getContext('2d')!;
        let bounds = { x: 0, y: 0, w: 0, h: 0 };
        if (found.type === 'text') {
          ctx.font = `${found.size || 24}px 'Share Tech Mono', monospace`;
          bounds.w = ctx.measureText(found.text || '').width;
          bounds.h = (found.size || 24) * 1.2;
          bounds.x = found.x; bounds.y = found.y;
        } else if (found.type === 'image' && (found as any).img) {
          const img = (found as any).img as HTMLImageElement;
          const scale = (found as any).scale ?? 1;
          bounds.w = img.naturalWidth * scale;
          bounds.h = img.naturalHeight * scale;
          bounds.x = found.x - bounds.w / 2; bounds.y = found.y - bounds.h / 2;
        } else if (found.type === 'drawing') {
          bounds.x = 0; bounds.y = 0; bounds.w = canvasRef.current!.width; bounds.h = canvasRef.current!.height;
        }

        const hs = 10;
        const handleRects = {
          nw: { x: bounds.x - hs/2, y: bounds.y - hs/2, w: hs, h: hs },
          ne: { x: bounds.x + bounds.w - hs/2, y: bounds.y - hs/2, w: hs, h: hs },
          sw: { x: bounds.x - hs/2, y: bounds.y + bounds.h - hs/2, w: hs, h: hs },
          se: { x: bounds.x + bounds.w - hs/2, y: bounds.y + bounds.h - hs/2, w: hs, h: hs },
        };

        const hitHandle = (Object.keys(handleRects) as Array<keyof typeof handleRects>).find(k => {
          const r = handleRects[k];
          return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
        }) as ('nw' | 'ne' | 'sw' | 'se') | undefined;

        setSelectedLayerId(found.id);
        if (hitHandle) {
          actionRef.current = {
            type: 'resize', startX: x, startY: y, handle: hitHandle,
            initialBounds: bounds,
            initialScale: (found as any).scale ?? 1,
            initialSize: (found as any).size ?? 24,
          };
        } else {
          actionRef.current = { type: 'drag', startX: x, startY: y, initialLayerState: found };
        }
      } else {
        setSelectedLayerId(null);
        actionRef.current = null;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    const canvasEl = canvasRef.current!;
    // when idle (no action), provide hover feedback for handles and layers
    if (!actionRef.current) {
      let cursor = 'default';
      if (selectedLayerId) {
        const l = layers.find(ll => ll.id === selectedLayerId);
        if (l) {
          const ctx = canvasEl.getContext('2d')!;
          let bounds = { x: 0, y: 0, w: 0, h: 0 };
          if (l.type === 'text') {
            ctx.font = `${l.size || 24}px 'Share Tech Mono', monospace`;
            bounds.w = ctx.measureText(l.text || '').width;
            bounds.h = (l.size || 24) * 1.2;
            bounds.x = l.x; bounds.y = l.y;
          } else if (l.type === 'image' && (l as any).img) {
            const img = (l as any).img as HTMLImageElement;
            const scale = (l as any).scale ?? 1;
            bounds.w = img.naturalWidth * scale;
            bounds.h = img.naturalHeight * scale;
            bounds.x = l.x - bounds.w / 2; bounds.y = l.y - bounds.h / 2;
          }
          const hs = 12;
          const handleRects = [
            { cursor: 'nwse-resize', x: bounds.x - hs/2, y: bounds.y - hs/2, w: hs, h: hs },
            { cursor: 'nesw-resize', x: bounds.x + bounds.w - hs/2, y: bounds.y - hs/2, w: hs, h: hs },
            { cursor: 'nesw-resize', x: bounds.x - hs/2, y: bounds.y + bounds.h - hs/2, w: hs, h: hs },
            { cursor: 'nwse-resize', x: bounds.x + bounds.w - hs/2, y: bounds.y + bounds.h - hs/2, w: hs, h: hs },
          ];
          for (const r of handleRects) {
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { cursor = r.cursor; break; }
          }
          if (cursor === 'default') {
            // if pointer over any layer, show move cursor
            const over = [...layers].reverse().find(ll => {
              if (!ll.visible) return false;
              const ctx2 = canvasEl.getContext('2d')!;
              let bx = 0, by = 0, bw = 0, bh = 0;
              if (ll.type === 'text' && ll.text) {
                ctx2.font = `${ll.size || 24}px 'Share Tech Mono', monospace`;
                bw = ctx2.measureText(ll.text).width; bh = (ll.size || 24) * 1.2; bx = ll.x; by = ll.y;
              } else if (ll.type === 'image' && (ll as any).img) {
                const img = (ll as any).img as HTMLImageElement;
                const scale = (ll as any).scale ?? 1;
                bw = img.naturalWidth * scale; bh = img.naturalHeight * scale; bx = ll.x - bw/2; by = ll.y - bh/2;
              }
              return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
            });
            if (over) cursor = 'move';
          }
        }
      }
      canvasEl.style.cursor = cursor;
    }

    if (!actionRef.current) return;

    // proceed with active actions
    // if drawing directly into a layer (eraser direct), draw on that ctx
    if (actionRef.current.type === 'draw' && actionRef.current.directCtx) {
      const dctx = actionRef.current.directCtx;
      dctx.lineTo(x, y);
      dctx.stroke();
      redrawAll();
      return;
    }

    if (actionRef.current.type === 'draw' && actionRef.current.tempCanvas) {
      const ctx = actionRef.current.tempCanvas.getContext('2d')!;
      ctx.lineTo(x, y);
      ctx.stroke();
      redrawAll();
      return;
    }

    if (actionRef.current.type === 'resize' && selectedLayerId) {
      const meta = actionRef.current;
      const dx = x - meta.startX;
      const dy = y - meta.startY;
      const bounds = meta.initialBounds!;
      const l = layers.find(ll => ll.id === selectedLayerId)!;
      if (!bounds || !l) return;
      const isEast = meta.handle === 'ne' || meta.handle === 'se';
      const isSouth = meta.handle === 'se' || meta.handle === 'sw';
      const scaleX = (bounds.w + (isEast ? dx : -dx)) / Math.max(1, bounds.w);
      const scaleY = (bounds.h + (isSouth ? dy : -dy)) / Math.max(1, bounds.h);
      // If Shift is pressed, constrain aspect ratio (use the smaller scale)
      const factor = Math.max(0.05, (e.shiftKey ? Math.min(scaleX, scaleY) : (scaleX + scaleY) / 2));
      if (l.type === 'image') {
        const newScale = (meta.initialScale || 1) * factor;
        setLayersState(current => current.map(layer => layer.id === l.id ? { ...layer, scale: newScale } : layer));
      } else if (l.type === 'text') {
        const newSize = Math.max(6, Math.round((meta.initialSize || 24) * factor));
        setLayersState(current => current.map(layer => layer.id === l.id ? { ...layer, size: newSize } : layer));
      }
      redrawAll();
      return;
    }

    if (actionRef.current.type === 'drag' && selectedLayerId) {
      const dx = x - actionRef.current.startX;
      const dy = y - actionRef.current.startY;
      const initial = actionRef.current.initialLayerState!;
      setLayersState(currentLayers => currentLayers.map(l =>
        l.id === selectedLayerId ? { ...l, x: initial.x + dx, y: initial.y + dy } : l
      ));
    }
  };

  const handleMouseUp = () => {
    if (!actionRef.current) return;

    if (actionRef.current.type === 'draw' && actionRef.current.tempCanvas) {
      if (tool === 'erase') {
        // merge tempCanvas onto a drawing layer if target specified
        if (actionRef.current.targetLayerId) {
          const target = layers.find(l => l.id === actionRef.current.targetLayerId!);
          if (target && target.drawingCanvas) {
            const tctx = target.drawingCanvas.getContext('2d')!;
            tctx.globalCompositeOperation = 'destination-out';
            tctx.drawImage(actionRef.current.tempCanvas!, 0, 0);
            tctx.globalCompositeOperation = 'source-over';
            updateLayersAndRecordHistory(layers);
          }
        } else {
          // create a new drawing layer (contains eraser strokes as transparent marks)
          const newLayer: Layer = {
            id: `l-${Date.now()}`,
            type: 'drawing', name: 'Eraser', visible: true, opacity: 100, locked: false,
            x: 0, y: 0, drawingCanvas: actionRef.current.tempCanvas,
          };
          updateLayersAndRecordHistory(prev => [...prev, newLayer]);
        }
      } else {
        const newLayer: Layer = {
          id: `l-${Date.now()}`,
          type: 'drawing', name: 'Desenho', visible: true, opacity: 100, locked: false,
          x: 0, y: 0, drawingCanvas: actionRef.current.tempCanvas,
        };
        updateLayersAndRecordHistory(prev => [...prev, newLayer]);
      }
    } else if (actionRef.current.type === 'draw' && actionRef.current.directCtx) {
      // drawing/erasing directly modified a layer
      updateLayersAndRecordHistory(layers);
    } else if (actionRef.current.type === 'drag') {
      updateLayersAndRecordHistory(layers);
    } else if (actionRef.current.type === 'resize') {
      updateLayersAndRecordHistory(layers);
    }
    actionRef.current = null;
  };

  // --- AÇÕES DE CAMADAS ---
  const addTextLayer = () => {
    const canvas = canvasRef.current!;
    const newLayer: Layer = {
      id: `l-${Date.now()}`,
      type: 'text', name: 'Texto Novo', visible: true, opacity: 100, locked: false,
      x: canvas.width / 2 - 50, y: canvas.height / 2, text: 'Edite-me', size: 32, color,
    };
    setSelectedLayerId(newLayer.id);
    updateLayersAndRecordHistory(prev => [...prev, newLayer]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current!;
        const newLayer: Layer = {
          id: `l-${Date.now()}`,
          type: 'image',
          name: file.name,
          visible: true,
          opacity: 100,
          locked: false,
          x: canvas.width / 2,
          y: canvas.height / 2,
          img: img,
          scale: 0.5,
        } as Layer;
        updateLayersAndRecordHistory(prev => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const updateLayerProperty = (id: string, prop: Partial<Layer>) => {
    const newLayers = layers.map(l => l.id === id ? { ...l, ...prop } : l);
    updateLayersAndRecordHistory(newLayers);
  };

  const deleteLayer = (id: string) => {
    updateLayersAndRecordHistory(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const duplicateLayer = (id: string) => {
    const layerToDup = layers.find(l => l.id === id);
    if (!layerToDup) return;
    const newLayer = {
      ...layerToDup,
      id: `l-${Date.now()}`,
      name: `${layerToDup.name} Cópia`,
      x: layerToDup.x + 10,
      y: layerToDup.y + 10,
    };
    updateLayersAndRecordHistory(prev => [...prev, newLayer]);
  };

  const groupSelected = () => {
    const ids = Array.from(multiSelectIds);
    if (ids.length < 2) return;
    // preserve order from layers array
    const ordered = layers.filter(l => ids.includes(l.id)).map(l => l.id);
    const groupLayer: Layer = {
      id: `g-${Date.now()}`,
      type: 'group', name: `Group ${Date.now()}`, visible: true, opacity: 100, locked: false,
      x: 0, y: 0, children: ordered, isExpanded: true
    } as Layer;
    // set parentId on children
    const newLayers = layers.map(l => ids.includes(l.id) ? { ...l, parentId: groupLayer.id } : l);
    // add group on top
    newLayers.push(groupLayer);
    updateLayersAndRecordHistory(newLayers);
    setMultiSelectIds(new Set());
    setSelectedLayerId(groupLayer.id);
  };

  const ungroupSelected = (groupId: string) => {
    const group = layers.find(l => l.id === groupId && l.type === 'group');
    if (!group) return;
    // clear parentId from children and remove group
    const newLayers = layers.filter(l => l.id !== groupId).map(l => l.parentId === groupId ? { ...l, parentId: null } : l);
    updateLayersAndRecordHistory(newLayers);
    setSelectedLayerId(null);
  };

  const mergeDown = (id: string) => {
    const idx = layers.findIndex(l => l.id === id);
    if (idx <= 0) return; // nothing below
    const top = layers[idx];
    const bottom = layers[idx - 1];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const temp = document.createElement('canvas');
    temp.width = canvas.width; temp.height = canvas.height;
    const tctx = temp.getContext('2d')!;
    // draw bottom then top respecting layer rendering rules
    const drawLayerOnto = (l: Layer) => {
      if (!l.visible) return;
      if (l.type === 'drawing' && l.drawingCanvas) tctx.drawImage(l.drawingCanvas, 0, 0);
      else if (l.type === 'text' && l.text) {
        tctx.fillStyle = l.color || '#000';
        tctx.font = `${l.size ?? 24}px 'Share Tech Mono', monospace`;
        tctx.textBaseline = 'top';
        tctx.fillText(l.text, l.x, l.y);
      } else if (l.type === 'image' && (l as any).img) {
        const img = (l as any).img as HTMLImageElement;
        const scale = (l as any).scale ?? 1;
        const w = img.naturalWidth * scale; const h = img.naturalHeight * scale;
        tctx.drawImage(img, l.x - w/2, l.y - h/2, w, h);
      }
    };
    drawLayerOnto(bottom);
    drawLayerOnto(top);
    // create merged drawing layer replacing bottom, remove top
    const mergedLayer: Layer = {
      id: `l-${Date.now()}`,
      type: 'drawing', name: `Merged ${bottom.name}+${top.name}`, visible: true, opacity: 100, locked: false,
      x: 0, y: 0, drawingCanvas: temp,
    };
    const newLayers = [...layers];
    newLayers.splice(idx - 1, 2, mergedLayer);
    updateLayersAndRecordHistory(newLayers);
    setSelectedLayerId(mergedLayer.id);
  };

  const mergeVisible = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const visibleLayers = layers.filter(l => l.visible && l.type !== 'group');
    if (visibleLayers.length <= 1) return;
    const temp = document.createElement('canvas'); temp.width = canvas.width; temp.height = canvas.height;
    const tctx = temp.getContext('2d')!;
    // draw in original order
    for (const l of layers) {
      if (!l.visible || l.type === 'group') continue;
      if (l.type === 'drawing' && l.drawingCanvas) tctx.drawImage(l.drawingCanvas, 0, 0);
      else if (l.type === 'text' && l.text) {
        tctx.fillStyle = l.color || '#000';
        tctx.font = `${l.size ?? 24}px 'Share Tech Mono', monospace`;
        tctx.textBaseline = 'top';
        tctx.fillText(l.text, l.x, l.y);
      } else if (l.type === 'image' && (l as any).img) {
        const img = (l as any).img as HTMLImageElement;
        const scale = (l as any).scale ?? 1;
        const w = img.naturalWidth * scale; const h = img.naturalHeight * scale;
        tctx.drawImage(img, l.x - w/2, l.y - h/2, w, h);
      }
    }
    // remove visible non-group layers and insert merged at lowest index among them
    const visibleIds = new Set(layers.filter(l => l.visible && l.type !== 'group').map(l => l.id));
    let lowestIndex = Infinity;
    layers.forEach((l, i) => { if (visibleIds.has(l.id)) lowestIndex = Math.min(lowestIndex, i); });
    const mergedLayer: Layer = {
      id: `l-${Date.now()}`,
      type: 'drawing', name: `Merged Visible`, visible: true, opacity: 100, locked: false,
      x: 0, y: 0, drawingCanvas: temp,
    };
    const newLayers = layers.filter(l => !visibleIds.has(l.id));
    newLayers.splice(lowestIndex === Infinity ? 0 : lowestIndex, 0, mergedLayer);
    updateLayersAndRecordHistory(newLayers);
    setSelectedLayerId(mergedLayer.id);
  };

  // --- FINALIZAÇÃO ---
  const handleFinish = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const ctx = finalCanvas.getContext('2d')!;
    if (baseImageRef.current) {
      ctx.drawImage(baseImageRef.current, 0, 0, finalCanvas.width, finalCanvas.height);
    }
    layers.forEach(l => {
      if (!l.visible) return;
      ctx.save();
      ctx.globalAlpha = l.opacity / 100;
      ctx.globalCompositeOperation = l.blendMode || 'source-over';
      if (l.type === 'drawing' && l.drawingCanvas) {
        ctx.drawImage(l.drawingCanvas, 0, 0);
      } else if (l.type === 'text' && l.text) {
        ctx.fillStyle = l.color || '#000000';
        ctx.font = `${l.size ?? 24}px 'Share Tech Mono', monospace`;
        ctx.textBaseline = 'top';
        ctx.fillText(l.text, l.x, l.y);
      } else if ((l as any).type === 'image' && (l as any).img) {
        const img = (l as any).img as HTMLImageElement;
        const scale = (l as any).scale ?? 1;
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, l.x - w / 2, l.y - h / 2, w, h);
      }
      ctx.restore();
    });
    finalCanvas.toBlob(blob => {
      if (blob) onSave(new File([blob], `edited-image-${Date.now()}.png`, { type: 'image/png' }));
    }, 'image/png');
  };

  // --- RENDERIZAÇÃO DO JSX ---
  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const topLayers = layers.filter(l => !l.parentId);

  return (
    <div className="uv-editor-overlay">
      <div className="uv-editor-panel">
        <div className="uv-header">
          <h3>{mode === 'filter' ? '🔍 Editor Avançado' : '💎 Luz UV'}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={undo} disabled={historyIndex <= 0} title="Desfazer (Ctrl+Z)">↶</button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Refazer (Ctrl+Y)">↷</button>
            <button onClick={onClose} className="btn-close">✕</button>
          </div>
        </div>

        <div className="uv-editor-main">
          <div className="editor-workspace">
            <div className="canvas-container">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: tool === 'draw' || tool === 'erase' ? 'crosshair' : 'default' }}
              />
            </div>
          </div>

          <div className="uv-sidebar">
            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <h4>Ferramentas</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '20px' }}>
                <button onClick={() => setTool('select')} className={tool === 'select' ? 'active' : ''}>🖐️ Selecionar</button>
                <button onClick={() => setTool('draw')} className={tool === 'draw' ? 'active' : ''}>✏️ Desenhar</button>
                <button onClick={() => setTool('erase')} className={tool === 'erase' ? 'active' : ''}>🧼 Borracha</button>
                <button onClick={addTextLayer}>🅰️ Ad. Texto</button>
                <button onClick={() => fileInputRef.current?.click()}>🖼️ Ad. Imagem</button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/png, image/jpeg"
                onChange={handleImageUpload}
              />

              {(tool === 'draw' || tool === 'erase') && (
                <div style={{marginBottom: '20px'}}>
                  <label>Cor (para desenho):</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} />
                  <label>Pincel: {brushSize}px</label>
                  <input type="range" min="1" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} />
                </div>
              )}
                        
              <h4 style={{ marginTop: 0 }}>Camadas</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={groupSelected} disabled={multiSelectIds.size < 2}>📁 Agrupar selecionadas</button>
                <button onClick={() => { if (selectedLayer && selectedLayer.type === 'group') ungroupSelected(selectedLayer.id); }} disabled={!selectedLayer || selectedLayer.type !== 'group'}>📂 Desagrupar</button>
                <button onClick={mergeVisible}>🧩 Mesclar Visíveis</button>
              </div>
              <div className="layers-container">
                {topLayers.length === 0 ? <div className="no-layers-placeholder">Nenhuma camada</div> : 
                  [...topLayers].reverse().map((l, reversedIndex) => {
                    const originalIndex = topLayers.length - 1 - reversedIndex;
                    const isGroup = l.type === 'group';
                    return (
                      <div key={l.id} className={`layer-item ${selectedLayerId === l.id ? 'active' : ''} ${draggedLayerId === l.id ? 'dragging' : ''}`} onClick={() => setSelectedLayerId(l.id)} onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => {
                        e.preventDefault();
                        const draggedId = draggedLayerId || e.dataTransfer?.getData('text/plain');
                        if (!draggedId || draggedId === l.id) return;
                        const draggedIndex = layers.findIndex(layer => layer.id === draggedId);
                        // compute target index in original layers array as the index of the referenced topLayers item
                        const targetTop = topLayers[originalIndex];
                        const targetIndex = layers.findIndex(layer => layer.id === targetTop.id);
                        if (draggedIndex === -1) { setDraggedLayerId(null); return; }
                        const newLayers = [...layers];
                        const [draggedItem] = newLayers.splice(draggedIndex, 1);
                        newLayers.splice(targetIndex, 0, draggedItem);
                        updateLayersAndRecordHistory(newLayers);
                        setDraggedLayerId(null);
                      }}>
                        <div className='layer-item-main'>
                          <input type="checkbox" checked={multiSelectIds.has(l.id)} onChange={(e) => {
                            const next = new Set(multiSelectIds);
                            if (e.target.checked) next.add(l.id); else next.delete(l.id);
                            setMultiSelectIds(next);
                          }} onClick={(ev) => ev.stopPropagation()} />
                          <span
                            className="layer-drag-handle"
                            draggable={!l.locked}
                            onDragStart={(e) => {
                              if (l.locked) { e.preventDefault(); return; }
                              setDraggedLayerId(l.id);
                              try { e.dataTransfer?.setData('text/plain', l.id); } catch (err) {}
                              try { e.dataTransfer?.setDragImage((e.target as HTMLElement), 0, 0); } catch (err) {}
                            }}
                            onDragEnd={() => setDraggedLayerId(null)}
                            onClick={(ev) => ev.stopPropagation()}
                            title="Arrastar camada"
                          >☰</span>
                          {editingLayerId === l.id ? (
                             <input 
                               type="text" 
                               defaultValue={l.name} 
                               onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateLayerProperty(l.id, { name: e.currentTarget.value }); setEditingLayerId(null); }}
                               onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { updateLayerProperty(l.id, { name: e.currentTarget.value }); setEditingLayerId(null); }}}
                               autoFocus
                             />
                          ) : (
                             <span onDoubleClick={() => !l.locked && setEditingLayerId(l.id)}>{l.name}</span>
                          )}
                        </div>
                        <div className='layer-item-controls'>
                          <button onClick={(e) => { e.stopPropagation(); duplicateLayer(l.id); }}>📑</button>
                          <button onClick={(e) => { e.stopPropagation(); updateLayerProperty(l.id, { locked: !l.locked }); }}>{l.locked ? '🔒' : '🔓'}</button>
                          <button onClick={(e) => { e.stopPropagation(); updateLayerProperty(l.id, { visible: !l.visible }); }}>{l.visible ? '👁️' : '🚫'}</button>
                          <button className="delete-layer-btn" onClick={(e) => { e.stopPropagation(); deleteLayer(l.id); }}>🗑️</button>
                          {isGroup && <button onClick={(e) => { e.stopPropagation(); const g = layers.find(x => x.id === l.id); if (g) { setSelectedLayerId(g.id); } }}>📂</button>}
                        </div>
                        {/* render children if group */}
                        {isGroup && l.children && l.isExpanded && (
                          <div style={{ paddingLeft: 24, marginTop: 8 }}>
                            {l.children.map(cid => {
                              const child = layers.find(x => x.id === cid);
                              if (!child) return null;
                              return (
                                <div key={child.id} className={`layer-item ${selectedLayerId === child.id ? 'active' : ''}`} style={{ marginBottom: 6 }} onClick={() => setSelectedLayerId(child.id)}>
                                  <div className='layer-item-main' style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" checked={multiSelectIds.has(child.id)} onChange={(e) => { const next = new Set(multiSelectIds); if (e.target.checked) next.add(child.id); else next.delete(child.id); setMultiSelectIds(next); }} onClick={(ev) => ev.stopPropagation()} />
                                    <span style={{ opacity: 0.9 }}>{child.name}</span>
                                  </div>
                                  <div className='layer-item-controls'>
                                    <button onClick={(e) => { e.stopPropagation(); duplicateLayer(child.id); }}>📑</button>
                                    <button onClick={(e) => { e.stopPropagation(); updateLayerProperty(child.id, { locked: !child.locked }); }}>{child.locked ? '🔒' : '🔓'}</button>
                                    <button onClick={(e) => { e.stopPropagation(); updateLayerProperty(child.id, { visible: !child.visible }); }}>{child.visible ? '👁️' : '🚫'}</button>
                                    <button className="delete-layer-btn" onClick={(e) => { e.stopPropagation(); deleteLayer(child.id); }}>🗑️</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                }
              </div>

             {selectedLayer && (
                <div className="layer-properties">
                    <h4>Propriedades da Camada</h4>
                    {/* Texto editing controls */}
                    {selectedLayer.type === 'text' && (
                      <>
                        <div>
                          <label>Conteúdo do Texto</label>
                          <textarea
                            value={selectedLayer.text}
                            disabled={selectedLayer.locked}
                            onChange={(e) => updateLayerProperty(selectedLayerId!, { text: e.target.value })}
                            rows={3}
                            style={{ width: '100%', resize: 'vertical', marginTop: 6 }}
                          />
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <label>Tamanho da Fonte: {selectedLayer.size}px</label>
                          <input
                            type="range" min="8" max="200"
                            value={selectedLayer.size}
                            disabled={selectedLayer.locked}
                            onChange={(e) => updateLayerProperty(selectedLayerId!, { size: Number(e.target.value) })}
                          />
                        </div>
                      </>
                    )}
                    <div>
                        <label>Opacidade: {selectedLayer.opacity}%</label>
                        <input 
                            type="range" min="0" max="100" 
                            value={selectedLayer.opacity} 
                            disabled={selectedLayer.locked}
                            onChange={(e) => updateLayerProperty(selectedLayerId!, { opacity: Number(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label>Modo de Mesclagem</label>
                        <select
                           value={selectedLayer.blendMode || 'source-over'}
                           disabled={selectedLayer.locked}
                           onChange={(e) => updateLayerProperty(selectedLayerId!, { blendMode: e.target.value as GlobalCompositeOperation})}
                        >
                            <option value="source-over">Normal</option>
                            <option value="multiply">Multiply</option>
                            <option value="screen">Screen</option>
                            <option value="overlay">Overlay</option>
                            <option value="darken">Darken</option>
                            <option value="lighten">Lighten</option>
                        </select>
                    </div>
                </div>
             )}

            </div>
            <div className="sidebar-footer">
              <button onClick={handleFinish} className="save-button">Salvar & Fechar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
