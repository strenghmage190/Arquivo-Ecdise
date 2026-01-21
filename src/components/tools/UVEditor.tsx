import React, { useRef, useState, useEffect } from 'react';
import './UVEditor.css';
import './UVEditor.animations.css';

interface UVEditorProps {
  baseImageUrl: string;
  onSave: (file: File) => void;
  onClose: () => void;
  mode?: 'uv' | 'filter';
  initialImageFile?: File | null;
}

interface Layer {
  id: string;
  type: 'text' | 'image' | 'drawing' | 'group';
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  x?: number;
  y?: number;
  text?: string;
  size?: number;
  color?: string;
  img?: HTMLImageElement;
  scale?: number;
  drawingCanvas?: HTMLCanvasElement; // For drawing layers
  children?: string[]; // IDs of child layers if type is 'group'
  childrenData?: Layer[]; // Inlined child layer objects when grouped
  parentId?: string | null; // ID of parent group, if any
}

const COLOR_PALETTES = {
  uv: [
    { label: 'Magenta', hex: '#b366ff', glow: '0 0 10px #b366ff' },
    { label: 'Ciano', hex: '#00ffff', glow: '0 0 10px #00ffff' },
    { label: 'Vermelho', hex: '#ff0033', glow: '0 0 10px #ff0033' },
    { label: 'Verde Neon', hex: '#39ff14', glow: '0 0 10px #39ff14' },
    { label: 'Rosa Quente', hex: '#ff10f0', glow: '0 0 10px #ff10f0' },
    { label: 'Azul Elétrico', hex: '#0080ff', glow: '0 0 10px #0080ff' },
    { label: 'Amarelo Neon', hex: '#ffff00', glow: '0 0 10px #ffff00' },
    { label: 'Laranja Neon', hex: '#ff6600', glow: '0 0 10px #ff6600' },
  ],
  filter: [
    { label: 'Branco', hex: '#ffffff', glow: '0 0 10px #fff' },
    { label: 'Cinza', hex: '#cccccc', glow: '0 0 8px #ccc' },
    { label: 'Branco Transparente', hex: 'rgba(255,255,255,0.5)', glow: '0 0 5px rgba(255,255,255,0.5)' },
    { label: 'Cinza Escuro', hex: '#888888', glow: '0 0 5px #888' },
  ],
};

export default function UVEditor({ baseImageUrl, onSave, onClose, mode = 'uv', initialImageFile }: UVEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(mode === 'filter' ? '#ffffff' : '#b366ff');
  const [brushSize, setBrushSize] = useState(mode === 'filter' ? 18 : 6);
  const [tool, setTool] = useState<'draw' | 'erase' | 'placeImage' | 'placeText'>('draw');
  const [textValue, setTextValue] = useState('');
  const [textSize, setTextSize] = useState(24);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [censorMode, setCensorMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Layers support: placed texts/images (editable)
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ox:number, oy:number} | null>(null);
  const resizeStartRef = useRef<{x:number, y:number, width:number, height:number, scale:number, minX?: number, minY?: number} | null>(null);
  const drawingOffscreen = useRef<HTMLCanvasElement | null>(null);
  const [editingLayerName, setEditingLayerName] = useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAddLayerMenu, setShowAddLayerMenu] = useState(false);
  
  // RAF optimization for draw
  const rafIdRef = useRef<number | null>(null);
  const lastMouseEventRef = useRef<any | null>(null);
  const redrawRafIdRef = useRef<number | null>(null);
  const redrawScheduledRef = useRef<boolean>(false);
  const lastRedrawRef = useRef<number>(0);
  const redrawTimeoutRef = useRef<number | null>(null);
  const REDRAW_MIN_MS = 16; // ~60fps
  // Track created object URLs so we can revoke them on unmount
  const objectUrlsRef = useRef<string[]>([]);
  const dprRef = useRef<number>(1);
  const cssWidthRef = useRef<number | null>(null);
  const cssHeightRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const pointerMapRef = useRef<Map<number, {x:number,y:number}>>(new Map());
  const pinchStartRef = useRef<any | null>(null);
  const panRef = useRef<{x:number,y:number}>({ x: 0, y: 0 });
  const scaleRef = useRef<number>(1);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const colors = COLOR_PALETTES[mode];
  const hoveredHandleRef = useRef<string | null>(null);
  const [groupChecks, setGroupChecks] = useState<Record<string, boolean>>({});
  const undoStackRef = useRef<any[]>([]);
  const redoStackRef = useRef<any[]>([]);
  const HISTORY_LIMIT = 50;
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [redoAvailable, setRedoAvailable] = useState(false);

  const serializeState = () => {
    try {
      const serializeLayer = (l: Layer): any => {
        const copy: any = { ...l };
        if (l.img && (l as any).img.src) copy.imgSrc = (l as any).img.src;
        delete copy.img;
        if (l.drawingCanvas) {
          try { copy.drawingData = l.drawingCanvas.toDataURL(); } catch (e) { copy.drawingData = null; }
        }
        // handle group children recursively
        if ((l as any).childrenData && Array.isArray((l as any).childrenData)) {
          copy.childrenData = (l as any).childrenData.map((c: Layer) => serializeLayer(c));
        }
        delete copy.cachedCanvas;
        return copy;
      };
      const layersCopy = layers.map(l => serializeLayer(l));
      let drawingOffscreenData: string | null = null;
      try { if (drawingOffscreen.current) drawingOffscreenData = drawingOffscreen.current.toDataURL(); } catch (e) { drawingOffscreenData = null; }
      return { layers: layersCopy, drawingOffscreenData };
    } catch (e) { return { layers: [], drawingOffscreenData: null }; }
  };

  const restoreState = (snapshot: any) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = dprRef.current || 1;
      const cssW = cssWidthRef.current || (canvas.width / dpr);
      const cssH = cssHeightRef.current || (canvas.height / dpr);

      const restoredLayers: Layer[] = snapshot.layers.map((s: any) => {
        const buildLayer = (src: any): any => {
          const base: any = { ...src };
          if (src.imgSrc) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src.imgSrc;
            base.img = img;
          }
          if (src.drawingData) {
            try {
              const c = document.createElement('canvas');
              c.width = Math.round(cssW * dpr);
              c.height = Math.round(cssH * dpr);
              const ctx = c.getContext('2d');
              if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
              const img = new Image();
              img.onload = () => { try { ctx?.drawImage(img, 0, 0); redrawAll(); } catch (e) {} };
              img.src = src.drawingData;
              base.drawingCanvas = c;
            } catch (e) {}
          }
          if (src.childrenData && Array.isArray(src.childrenData)) {
            base.childrenData = src.childrenData.map((c: any) => buildLayer(c));
          }
          delete base.imgSrc;
          delete base.drawingData;
          delete base.cachedCanvas;
          return base as Layer;
        };
        return buildLayer(s);
      });

      setLayers(restoredLayers);
      // restore offscreen drawing
      if (snapshot.drawingOffscreenData) {
        try {
          const off = document.createElement('canvas');
          off.width = Math.round(cssW * dpr);
          off.height = Math.round(cssH * dpr);
          const ctx = off.getContext('2d');
          if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const img = new Image();
          img.onload = () => { try { ctx?.drawImage(img, 0, 0); drawingOffscreen.current = off; redrawAll(); } catch (e) {} };
          img.src = snapshot.drawingOffscreenData;
        } catch (e) {}
      } else {
        drawingOffscreen.current = null;
      }
      redrawAll();
    } catch (e) {}
  };

  const pushHistory = () => {
    try {
      const snap = serializeState();
      undoStackRef.current.push(snap);
      if (undoStackRef.current.length > HISTORY_LIMIT) undoStackRef.current.shift();
      // clear redo on new action
      redoStackRef.current = [];
      setUndoAvailable(undoStackRef.current.length > 0);
      setRedoAvailable(false);
    } catch (e) {}
  };

  const undo = () => {
    try {
      if (undoStackRef.current.length === 0) return;
      const snap = undoStackRef.current.pop();
      if (!snap) return;
      // push current to redo
      const cur = serializeState();
      redoStackRef.current.push(cur);
      restoreState(snap);
      setUndoAvailable(undoStackRef.current.length > 0);
      setRedoAvailable(redoStackRef.current.length > 0);
    } catch (e) {}
  };

  const redo = () => {
    try {
      if (redoStackRef.current.length === 0) return;
      const snap = redoStackRef.current.pop();
      if (!snap) return;
      const cur = serializeState();
      undoStackRef.current.push(cur);
      restoreState(snap);
      setUndoAvailable(undoStackRef.current.length > 0);
      setRedoAvailable(redoStackRef.current.length > 0);
    } catch (e) {}
  };

  const historyFileInputRef = useRef<HTMLInputElement | null>(null);

  const exportHistory = () => {
    try {
      const payload = JSON.stringify({ undo: undoStackRef.current, redo: redoStackRef.current });
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uv_history_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      try { URL.revokeObjectURL(url); } catch (e) {}
    } catch (e) {}
  };

  const importHistoryFile = (file: File | null) => {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const txt = String(fr.result || '');
        const parsed = JSON.parse(txt);
        undoStackRef.current = Array.isArray(parsed.undo) ? parsed.undo : [];
        redoStackRef.current = Array.isArray(parsed.redo) ? parsed.redo : [];
        setUndoAvailable(undoStackRef.current.length > 0);
        setRedoAvailable(redoStackRef.current.length > 0);
      } catch (e) {}
    };
    fr.readAsText(file);
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const mod = ev.ctrlKey || ev.metaKey;
      if (!mod) return;
      if (ev.key.toLowerCase() === 'z') {
        ev.preventDefault();
        if (ev.shiftKey) redo(); else undo();
      } else if (ev.key.toLowerCase() === 'y') {
        ev.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => {
    const cancelAllRafs = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (redrawRafIdRef.current !== null) {
        cancelAnimationFrame(redrawRafIdRef.current);
        redrawRafIdRef.current = null;
      }
    };

    return () => {
      cancelAllRafs();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImageUrl;
    img.onload = () => {
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      // Set canvas pixel size taking DPR into account, keep CSS size as expected
      const cssWidth = Math.round(img.naturalWidth * scale);
      const cssHeight = Math.round(img.naturalHeight * scale);
      cssWidthRef.current = cssWidth;
      cssHeightRef.current = cssHeight;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      try { console.debug('UVEditor init', { canvasWidth: canvas.width, canvasHeight: canvas.height, mode, baseImageUrl }); } catch(e) {}
      // initialize offscreen drawing canvas to capture brush strokes
      drawingOffscreen.current = document.createElement('canvas');
      drawingOffscreen.current.width = Math.round(cssWidth * dpr);
      drawingOffscreen.current.height = Math.round(cssHeight * dpr);
      const offCtx = drawingOffscreen.current.getContext('2d');
      if (offCtx) offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (ctx) ctx.clearRect(0, 0, cssWidth, cssHeight);
      // if an initial image file (e.g. glitch) was provided, add it as an image layer centered
      if (initialImageFile) {
        const url = URL.createObjectURL(initialImageFile);
        objectUrlsRef.current.push(url);
        const img2 = new Image();
        img2.crossOrigin = 'anonymous';
        img2.src = url;
        img2.onload = () => {
          try {
            const id = `layer-${Date.now()}`;
            const naturalW = img2.naturalWidth || img2.width || 100;
            const scaleToFit = Math.min(1, canvas.width / naturalW, canvas.height / (img2.naturalHeight || img2.height || 100));
            setLayers(prev => [...prev, { 
              id, 
              type: 'image', 
              name: 'Imagem Inicial',
              visible: true,
              opacity: 100,
              locked: false,
              x: (cssWidthRef.current || (canvas.width / (dprRef.current||1))) / 2, 
              y: (cssHeightRef.current || (canvas.height / (dprRef.current||1))) / 2, 
              img: img2, 
              scale: scaleToFit 
            }]);
            setSelectedLayer(id);
            redrawAll();
          } catch (e) {
            // ignore
          }
        };
        // cleanup object url when component unmounts
        const cleanup = () => { try { URL.revokeObjectURL(url); } catch (e) {};
          const idx = objectUrlsRef.current.indexOf(url); if (idx >= 0) objectUrlsRef.current.splice(idx, 1);
        };
        // schedule cleanup on unmount
        (canvas as any).__initialImageCleanup = cleanup;
      }
    };
    return () => {
      // revoke any initial image url
      const cleanup = (canvasRef.current as any)?.__initialImageCleanup;
      if (cleanup && typeof cleanup === 'function') cleanup();
    };
  }, [baseImageUrl, initialImageFile]);

  // redraw main canvas from offscreen drawing + layers
  const redrawAll = () => {
    // Se já tem um redraw agendado, não agenda outro
    if (redrawScheduledRef.current) return;
    // throttle: if last redraw was very recent, schedule later
    try {
      const now = performance.now();
      const since = now - (lastRedrawRef.current || 0);
      if (since < REDRAW_MIN_MS) {
        if (redrawTimeoutRef.current == null) {
          redrawTimeoutRef.current = window.setTimeout(() => {
            redrawTimeoutRef.current = null;
            redrawAll();
          }, Math.max(1, Math.round(REDRAW_MIN_MS - since)));
        }
        return;
      }
    } catch (e) {}
    try { console.debug('UVEditor redrawAll', { layersLength: layers.length, mode }); } catch(e) {}
    
    redrawScheduledRef.current = true;
    redrawRafIdRef.current = requestAnimationFrame(() => {
      redrawScheduledRef.current = false;
      redrawRafIdRef.current = null;
      
      const canvas = canvasRef.current;
      const off = drawingOffscreen.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const clearW = cssWidthRef.current || (canvas.width / (dprRef.current || 1));
      const clearH = cssHeightRef.current || (canvas.height / (dprRef.current || 1));
      ctx.clearRect(0, 0, clearW, clearH);
      // Apply transform to canvas container (pan/zoom)
      try {
        const cont = canvasContainerRef.current;
        if (cont) {
          const s = scaleRef.current || 1;
          const p = panRef.current || { x: 0, y: 0 };
          cont.style.transform = `translate(${p.x}px, ${p.y}px) scale(${s})`;
        }
      } catch (e) {}
      // draw existing strokes from offscreen
      if (off) ctx.drawImage(off, 0, 0);
      // draw layers (respecting visibility and opacity)
      for (const layer of layers) {
        if (!layer.visible) continue; // skip invisible layers
        
        ctx.save();
        ctx.globalAlpha = (layer.opacity || 100) / 100;
        
        // Use cached raster for text/image layers when available
        if (layer.type === 'text' || layer.type === 'image') {
          const cached = (layer as any).cachedCanvas as HTMLCanvasElement | undefined;
          if (cached) {
            ctx.drawImage(cached, 0, 0);
          } else {
            // build cache on demand
            const built = buildLayerCache(layer);
            if (built) {
              // attach cache to layer
              try { setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, ...( { cachedCanvas: built } as any) } : l)); } catch(e) {}
              ctx.drawImage(built, 0, 0);
            }
          }
        } else if (layer.type === 'drawing' && layer.drawingCanvas) {
          // Draw the drawing layer canvas (already an offscreen canvas)
          ctx.drawImage(layer.drawingCanvas, 0, 0);
        } else if (layer.type === 'group' && layer.childrenData && Array.isArray(layer.childrenData)) {
          // Draw group: translate to group's origin and draw children relative (apply group scale)
          ctx.save();
          const gx = layer.x || 0;
          const gy = layer.y || 0;
          const gscale = layer.scale || 1;
          ctx.translate(gx, gy);
          ctx.scale(gscale, gscale);
          for (const child of layer.childrenData) {
            try {
              ctx.save();
              ctx.globalAlpha = (child.opacity || 100) / 100;
              if (child.type === 'text') {
                ctx.fillStyle = child.color || color;
                ctx.font = `${Math.max(8, child.size || textSize)}px serif`;
                ctx.textBaseline = 'top';
                ctx.fillText(child.text || '', child.x || 0, child.y || 0);
              } else if (child.type === 'image' && child.img) {
                const w = child.img.naturalWidth * (child.scale || 1);
                const h = child.img.naturalHeight * (child.scale || 1);
                ctx.drawImage(child.img, (child.x || 0) - w/2, (child.y || 0) - h/2, w, h);
              } else if (child.type === 'drawing' && child.drawingCanvas) {
                ctx.drawImage(child.drawingCanvas, 0, 0);
              }
              ctx.restore();
            } catch (e) {}
          }
          ctx.restore();
        }
        
        ctx.restore();
      }
      // draw selection outline with resize handles
      if (selectedLayer) {
        const s = layers.find(l => l.id === selectedLayer);
        if (s) {
          ctx.save();
          ctx.strokeStyle = '#00ffff';
          ctx.setLineDash([6,4]);
          ctx.lineWidth = 2;
          
          let bounds = { x: 0, y: 0, w: 0, h: 0 };
          
          if (s.type === 'image' && s.img) {
            const w = s.img.naturalWidth * (s.scale || 1);
            const h = s.img.naturalHeight * (s.scale || 1);
            bounds = { x: s.x - w/2, y: s.y - h/2, w, h };
          } else if (s.type === 'text') {
            ctx.font = `${Math.max(8, s.size || textSize)}px serif`;
            const measure = ctx.measureText(s.text || '');
            const w = measure.width;
            const h = (s.size || textSize) * 1.2;
            bounds = { x: s.x, y: s.y, w, h };
          } else if (s.type === 'group' && s.childrenData && Array.isArray(s.childrenData)) {
            // compute group's bounding box from children (in group-local coords)
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            const gscale = s.scale || 1;
            for (const child of s.childrenData) {
              try {
                if (child.type === 'text') {
                  ctx.font = `${Math.max(8, child.size || textSize)}px serif`;
                  const m = ctx.measureText(child.text || '');
                  const cw = m.width;
                  const ch = (child.size || textSize) * 1.2;
                  const left = (child.x || 0);
                  const top = (child.y || 0);
                  minX = Math.min(minX, left);
                  minY = Math.min(minY, top);
                  maxX = Math.max(maxX, left + cw);
                  maxY = Math.max(maxY, top + ch);
                } else if (child.type === 'image' && child.img) {
                  const cw = child.img.naturalWidth * (child.scale || 1);
                  const ch = child.img.naturalHeight * (child.scale || 1);
                  const left = (child.x || 0) - cw/2;
                  const top = (child.y || 0) - ch/2;
                  minX = Math.min(minX, left);
                  minY = Math.min(minY, top);
                  maxX = Math.max(maxX, left + cw);
                  maxY = Math.max(maxY, top + ch);
                } else if (child.type === 'drawing') {
                  const cssW = cssWidthRef.current || 0;
                  const cssH = cssHeightRef.current || 0;
                  minX = Math.min(minX, child.x || 0);
                  minY = Math.min(minY, child.y || 0);
                  maxX = Math.max(maxX, (child.x || 0) + cssW);
                  maxY = Math.max(maxY, (child.y || 0) + cssH);
                }
              } catch (e) {}
            }
            if (minX === Infinity) { minX = 0; minY = 0; maxX = 0; maxY = 0; }
            const w = (maxX - minX) * gscale;
            const h = (maxY - minY) * gscale;
            bounds = { x: s.x + minX * gscale, y: s.y + minY * gscale, w, h };
          }
          
          // Draw bounding box
          // If currently resizing, draw a translucent ghost showing the new bbox
          try {
            const lastEv = lastMouseEventRef.current;
            if (isResizing && resizeHandle && resizeStartRef.current && lastEv) {
              const rect = canvas.getBoundingClientRect();
              const rawX = lastEv.clientX - rect.left;
              const rawY = lastEv.clientY - rect.top;
              const scale = scaleRef.current || 1;
              const pan = panRef.current;
              const px = (rawX - pan.x) / scale;
              const py = (rawY - pan.y) / scale;

              let ghost = { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h };
              const startData = resizeStartRef.current;
              if (s.type === 'image' && s.img) {
                const dx = resizeHandle.includes('e') ? (px - startData.x) : (startData.x - px);
                const dy = resizeHandle.includes('s') ? (py - startData.y) : (startData.y - py);
                const delta = Math.max(dx, dy);
                const newScale = Math.max(0.1, startData.scale + (delta / s.img.naturalWidth));
                const w = s.img.naturalWidth * newScale;
                const h = s.img.naturalHeight * newScale;
                ghost = { x: s.x - w/2, y: s.y - h/2, w, h };
              } else if (s.type === 'text') {
                const dx = resizeHandle.includes('e') ? (px - startData.x) : (startData.x - px);
                const dy = resizeHandle.includes('s') ? (py - startData.y) : (startData.y - py);
                const delta = Math.max(dx, dy);
                const newSize = Math.max(8, Math.min(200, startData.scale + delta / 2));
                ctx.font = `${Math.max(8, newSize)}px serif`;
                const measure = ctx.measureText(s.text || '');
                const w = measure.width;
                const h = (newSize) * 1.2;
                ghost = { x: s.x, y: s.y, w, h };
              } else if (s.type === 'group' && s.childrenData && Array.isArray(s.childrenData)) {
                const dx = px - startData.x;
                const dy = py - startData.y;
                const startW = startData.width || 1;
                const startH = startData.height || 1;
                const minX = (startData as any).minX || 0;
                const minY = (startData as any).minY || 0;
                let anchorX = minX, anchorY = minY;
                if (resizeHandle === 'ne') { anchorX = minX + startW; anchorY = minY; }
                if (resizeHandle === 'se') { anchorX = minX + startW; anchorY = minY + startH; }
                if (resizeHandle === 'nw') { anchorX = minX; anchorY = minY; }
                if (resizeHandle === 'sw') { anchorX = minX; anchorY = minY + startH; }
                const startDist = Math.hypot(anchorX, anchorY) || Math.max(startW, startH);
                const curDist = Math.hypot(anchorX + dx, anchorY + dy);
                const scaleFactor = curDist / Math.max(1, startDist);
                const newScale = Math.max(0.2, Math.min(4, (startData.scale || 1) * scaleFactor));
                const oldScale = startData.scale || 1;
                const oldGx = startData.x;
                const oldGy = startData.y;
                const newGx = oldGx + anchorX * (oldScale - newScale);
                const newGy = oldGy + anchorY * (oldScale - newScale);
                // recompute bbox from children
                let minXX = Infinity, minYY = Infinity, maxXX = -Infinity, maxYY = -Infinity;
                for (const child of s.childrenData) {
                  try {
                    if (child.type === 'text') {
                      ctx.font = `${Math.max(8, child.size || textSize)}px serif`;
                      const m = ctx.measureText(child.text || '');
                      const cw = m.width;
                      const ch = (child.size || textSize) * 1.2;
                      const left = (child.x || 0);
                      const top = (child.y || 0);
                      minXX = Math.min(minXX, left);
                      minYY = Math.min(minYY, top);
                      maxXX = Math.max(maxXX, left + cw);
                      maxYY = Math.max(maxYY, top + ch);
                    } else if (child.type === 'image' && child.img) {
                      const cw = child.img.naturalWidth * (child.scale || 1);
                      const ch = child.img.naturalHeight * (child.scale || 1);
                      const left = (child.x || 0) - cw/2;
                      const top = (child.y || 0) - ch/2;
                      minXX = Math.min(minXX, left);
                      minYY = Math.min(minYY, top);
                      maxXX = Math.max(maxXX, left + cw);
                      maxYY = Math.max(maxYY, top + ch);
                    } else if (child.type === 'drawing') {
                      const cssW = cssWidthRef.current || 0;
                      const cssH = cssHeightRef.current || 0;
                      minXX = Math.min(minXX, child.x || 0);
                      minYY = Math.min(minYY, child.y || 0);
                      maxXX = Math.max(maxXX, (child.x || 0) + cssW);
                      maxYY = Math.max(maxYY, (child.y || 0) + cssH);
                    }
                  } catch (e) {}
                }
                if (minXX === Infinity) { minXX = 0; minYY = 0; maxXX = 0; maxYY = 0; }
                const w = (maxXX - minXX) * newScale;
                const h = (maxYY - minYY) * newScale;
                ghost = { x: newGx + minXX * newScale, y: newGy + minYY * newScale, w, h };
              }

              ctx.save();
              ctx.fillStyle = 'rgba(0,255,255,0.12)';
              ctx.strokeStyle = 'rgba(0,255,255,0.45)';
              ctx.lineWidth = 2;
              ctx.fillRect(ghost.x - 6, ghost.y - 6, ghost.w + 12, ghost.h + 12);
              ctx.strokeRect(ghost.x - 6, ghost.y - 6, ghost.w + 12, ghost.h + 12);
              ctx.restore();
            }
          } catch (e) {}

          ctx.strokeRect(bounds.x - 6, bounds.y - 6, bounds.w + 12, bounds.h + 12);
          
          // Draw resize handles (corner circles)
          const handleSize = 10;
          ctx.fillStyle = '#00ffff';
          ctx.strokeStyle = '#ffffff';
          ctx.setLineDash([]);
          ctx.lineWidth = 2;
          
          const handles = [
            { x: bounds.x - 6, y: bounds.y - 6, pos: 'nw' }, // top-left
            { x: bounds.x + bounds.w + 6, y: bounds.y - 6, pos: 'ne' }, // top-right
            { x: bounds.x - 6, y: bounds.y + bounds.h + 6, pos: 'sw' }, // bottom-left
            { x: bounds.x + bounds.w + 6, y: bounds.y + bounds.h + 6, pos: 'se' }, // bottom-right
          ];
          
          handles.forEach(handle => {
            ctx.beginPath();
            const isHovered = hoveredHandleRef.current === handle.pos;
            const r = isHovered ? handleSize : handleSize / 2;
            if (isHovered) {
              ctx.shadowColor = '#00ffff';
              ctx.shadowBlur = 12;
            } else {
              ctx.shadowBlur = 0;
            }
            ctx.arc(handle.x, handle.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;
          });
          
          ctx.restore();
        }
      }
      try { lastRedrawRef.current = performance.now(); } catch(e) { lastRedrawRef.current = Date.now(); }
    });
  };

  useEffect(() => {
    if (!imageFile) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const url = URL.createObjectURL(imageFile);
    objectUrlsRef.current.push(url);
    img.src = url;
    img.onload = () => setImageEl(img);
    return () => { try { URL.revokeObjectURL(url); } catch(e) {};
      const idx = objectUrlsRef.current.indexOf(url); if (idx >= 0) objectUrlsRef.current.splice(idx, 1);
    };
  }, [imageFile]);

  // Revoke any leftover object URLs on unmount
  useEffect(() => {
    return () => {
      try {
        objectUrlsRef.current.forEach(u => { try { URL.revokeObjectURL(u); } catch(e) {} });
      } catch (e) {}
      objectUrlsRef.current = [];
      // clean offscreen canvas
      try {
        const off = drawingOffscreen.current;
        if (off) { try { off.width = 0; off.height = 0; } catch (e) {} }
      } catch (e) {}
      // clear any pending redraw timeout
      try {
        if (redrawTimeoutRef.current != null) {
          clearTimeout(redrawTimeoutRef.current);
          redrawTimeoutRef.current = null;
        }
      } catch (e) {}
      // cancel any pending RAFs
      try { if (rafIdRef.current != null) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; } } catch (e) {}
      try { if (redrawRafIdRef.current != null) { cancelAnimationFrame(redrawRafIdRef.current); redrawRafIdRef.current = null; } } catch (e) {}
      // release pointer capture if active
      try {
        const pid = activePointerIdRef.current;
        const canvasEl = canvasRef.current;
        if (canvasEl && pid != null) {
          try { (canvasEl as any).releasePointerCapture?.(pid); } catch (e) {}
        }
        activePointerIdRef.current = null;
      } catch (e) {}
    };
  }, []);

  // redraw when layers change
  useEffect(() => { redrawAll(); }, [layers]);

  const getCtx = (): CanvasRenderingContext2D | null => canvasRef.current?.getContext('2d') || null;

  // Per-layer cache helpers: store rendered appearance in an offscreen canvas
  const invalidateLayerCache = (id: string) => {
    setLayers(prev => {
      return prev.map(l => {
        if (l.id !== id) return l;
        try { if ((l as any).cachedCanvas) { ((l as any).cachedCanvas as HTMLCanvasElement).width = 0; ((l as any).cachedCanvas as HTMLCanvasElement).height = 0; } } catch (e) {}
        const copy = { ...l } as any;
        delete copy.cachedCanvas;
        return copy;
      });
    });
  };

  const invalidateAllLayerCaches = () => {
    setLayers(prev => {
      return prev.map(l => {
        try { if ((l as any).cachedCanvas) { ((l as any).cachedCanvas as HTMLCanvasElement).width = 0; ((l as any).cachedCanvas as HTMLCanvasElement).height = 0; } } catch (e) {}
        const copy = { ...l } as any;
        delete copy.cachedCanvas;
        return copy;
      });
    });
  };

  const buildLayerCache = (layer: Layer) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const cssW = cssWidthRef.current || (canvas.width / (dprRef.current || 1));
      const cssH = cssHeightRef.current || (canvas.height / (dprRef.current || 1));
      const dpr = dprRef.current || 1;
      const cached = document.createElement('canvas');
      cached.width = Math.round(cssW * dpr);
      cached.height = Math.round(cssH * dpr);
      const cctx = cached.getContext('2d');
      if (!cctx) return null;
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (layer.type === 'image' && layer.img) {
        const w = layer.img.naturalWidth * (layer.scale || 1);
        const h = layer.img.naturalHeight * (layer.scale || 1);
        cctx.drawImage(layer.img, (layer.x || 0) - w/2, (layer.y || 0) - h/2, w, h);
      } else if (layer.type === 'group' && (layer as any).childrenData && Array.isArray((layer as any).childrenData)) {
        // rasterize group into cache
        const g = layer as any;
        const gx = g.x || 0;
        const gy = g.y || 0;
        const gscale = g.scale || 1;
        cctx.save();
        cctx.translate(gx, gy);
        cctx.scale(gscale, gscale);
        for (const child of g.childrenData) {
          try {
            cctx.save();
            cctx.globalAlpha = (child.opacity || 100) / 100;
            if (child.type === 'text') {
              cctx.fillStyle = child.color || color;
              cctx.font = `${Math.max(8, child.size || textSize)}px serif`;
              cctx.textBaseline = 'top';
              cctx.fillText(child.text || '', child.x || 0, child.y || 0);
            } else if (child.type === 'image' && child.img) {
              const w = child.img.naturalWidth * (child.scale || 1);
              const h = child.img.naturalHeight * (child.scale || 1);
              cctx.drawImage(child.img, (child.x || 0) - w/2, (child.y || 0) - h/2, w, h);
            } else if (child.type === 'drawing' && child.drawingCanvas) {
              cctx.drawImage(child.drawingCanvas, 0, 0);
            }
            cctx.restore();
          } catch (e) {}
        }
        cctx.restore();
      } else if (layer.type === 'text') {
        cctx.fillStyle = layer.color || color;
        cctx.font = `${Math.max(8, layer.size || textSize)}px serif`;
        cctx.textBaseline = 'top';
        cctx.fillText(layer.text || '', layer.x || 0, layer.y || 0);
      }
      return cached;
    } catch (e) {
      return null;
    }
  };

  const startDrawing = (e: React.PointerEvent | React.MouseEvent | any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (tool !== 'draw' && tool !== 'erase') return;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    // Map from client coords to canvas (account for pan/scale)
    const scale = scaleRef.current || 1;
    const pan = panRef.current;
    const x = (rawX - pan.x) / scale;
    const y = (rawY - pan.y) / scale;
    
    // Check if we should draw on a selected drawing layer
    let targetCanvas = drawingOffscreen.current;
    if (selectedLayer) {
      const layer = layers.find(l => l.id === selectedLayer);
      if (layer && layer.type === 'drawing' && layer.drawingCanvas) {
        targetCanvas = layer.drawingCanvas;
      }
    }
    
    // draw on offscreen canvas or layer canvas
    const off = targetCanvas;
    if (!off) return;
    const octx = off.getContext('2d');
    if (!octx) return;
    octx.beginPath();
    octx.moveTo(x, y);
    octx.lineCap = 'round';
    octx.lineJoin = 'round';
    octx.lineWidth = brushSize;
    if (tool === 'erase') {
      octx.globalCompositeOperation = 'destination-out';
      octx.shadowBlur = 0;
    } else {
      octx.globalCompositeOperation = 'source-over';
      // if censor mode is active, draw flat black with no blur for redaction bars
      if (censorMode) {
        octx.strokeStyle = '#000000';
        octx.shadowBlur = 0;
      } else {
        octx.strokeStyle = color;
        octx.shadowColor = mode === 'filter' ? 'rgba(255,255,255,0.9)' : color;
        octx.shadowBlur = mode === 'filter' ? 8 : 15;
      }
    }
    setIsDrawing(true);
    // Capture pointer so we keep receiving pointer events while dragging/drawing
    try {
      if (typeof (e.pointerId) === 'number') {
        canvas.setPointerCapture?.(e.pointerId);
        activePointerIdRef.current = e.pointerId;
      }
    } catch (err) {}
    // immediately reflect on main canvas
    redrawAll();
  };

  const handleCanvasClick = (e: React.PointerEvent | React.MouseEvent | any): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = getCtx();
    if (!ctx) return false;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const scale = scaleRef.current || 1;
    const pan = panRef.current;
    const x = (rawX - pan.x) / scale;
    const y = (rawY - pan.y) / scale;
    
    // Check if clicking on resize handle of selected layer
    if (selectedLayer) {
      const s = layers.find(l => l.id === selectedLayer);
      if (s) {
        // don't allow resizing if the layer is locked
        if (s.locked) return false;
        let bounds = { x: 0, y: 0, w: 0, h: 0 };
        
        if (s.type === 'image' && s.img) {
          const w = s.img.naturalWidth * (s.scale || 1);
          const h = s.img.naturalHeight * (s.scale || 1);
          bounds = { x: s.x - w/2, y: s.y - h/2, w, h };
        } else if (s.type === 'text') {
          ctx.font = `${Math.max(8, s.size || textSize)}px serif`;
          const measure = ctx.measureText(s.text || '');
          const w = measure.width;
          const h = (s.size || textSize) * 1.2;
          bounds = { x: s.x, y: s.y, w, h };
        } else if (s.type === 'group' && s.childrenData && Array.isArray(s.childrenData)) {
          // compute group's bounding box from children (in group-local coords)
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          const gscale = s.scale || 1;
          for (const child of s.childrenData) {
            try {
              if (child.type === 'text') {
                ctx.font = `${Math.max(8, child.size || textSize)}px serif`;
                const m = ctx.measureText(child.text || '');
                const cw = m.width;
                const ch = (child.size || textSize) * 1.2;
                const left = (child.x || 0);
                const top = (child.y || 0);
                minX = Math.min(minX, left);
                minY = Math.min(minY, top);
                maxX = Math.max(maxX, left + cw);
                maxY = Math.max(maxY, top + ch);
              } else if (child.type === 'image' && child.img) {
                const cw = child.img.naturalWidth * (child.scale || 1);
                const ch = child.img.naturalHeight * (child.scale || 1);
                const left = (child.x || 0) - cw/2;
                const top = (child.y || 0) - ch/2;
                minX = Math.min(minX, left);
                minY = Math.min(minY, top);
                maxX = Math.max(maxX, left + cw);
                maxY = Math.max(maxY, top + ch);
              } else if (child.type === 'drawing') {
                // assume drawing covers from 0..canvas size
                const cssW = cssWidthRef.current || 0;
                const cssH = cssHeightRef.current || 0;
                minX = Math.min(minX, child.x || 0);
                minY = Math.min(minY, child.y || 0);
                maxX = Math.max(maxX, (child.x || 0) + cssW);
                maxY = Math.max(maxY, (child.y || 0) + cssH);
              }
            } catch (e) {}
          }
          if (minX === Infinity) { minX = 0; minY = 0; maxX = 0; maxY = 0; }
          const w = (maxX - minX) * gscale;
          const h = (maxY - minY) * gscale;
          bounds = { x: s.x + minX * gscale, y: s.y + minY * gscale, w, h };
        }
        
        // larger handle hit area for easier interaction
        const handleSize = 14;
        const handles = [
          { x: bounds.x - 6, y: bounds.y - 6, pos: 'nw' },
          { x: bounds.x + bounds.w + 6, y: bounds.y - 6, pos: 'ne' },
          { x: bounds.x - 6, y: bounds.y + bounds.h + 6, pos: 'sw' },
          { x: bounds.x + bounds.w + 6, y: bounds.y + bounds.h + 6, pos: 'se' },
        ];
        
        for (const handle of handles) {
            const dist = Math.sqrt(Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2));
          if (dist <= handleSize) {
            // Start resizing
            setIsResizing(true);
            setResizeHandle(handle.pos);
            if (s.type === 'image' && s.img) {
              resizeStartRef.current = {
                x: s.x,
                y: s.y,
                width: s.img.naturalWidth * (s.scale || 1),
                height: s.img.naturalHeight * (s.scale || 1),
                scale: s.scale || 1
              };
            } else if (s.type === 'text') {
              resizeStartRef.current = {
                x: s.x,
                y: s.y,
                width: 0,
                height: 0,
                scale: s.size || textSize
              };
            } else if (s.type === 'group' && s.childrenData) {
              // compute group's bbox for resize start
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              for (const child of s.childrenData) {
                try {
                  if (child.type === 'text') {
                    const measure = ctx.measureText(child.text || '');
                    const cw = measure.width;
                    const ch = (child.size || textSize) * 1.2;
                    const left = (child.x || 0);
                    const top = (child.y || 0);
                    minX = Math.min(minX, left);
                    minY = Math.min(minY, top);
                    maxX = Math.max(maxX, left + cw);
                    maxY = Math.max(maxY, top + ch);
                  } else if (child.type === 'image' && child.img) {
                    const cw = child.img.naturalWidth * (child.scale || 1);
                    const ch = child.img.naturalHeight * (child.scale || 1);
                    const left = (child.x || 0) - cw/2;
                    const top = (child.y || 0) - ch/2;
                    minX = Math.min(minX, left);
                    minY = Math.min(minY, top);
                    maxX = Math.max(maxX, left + cw);
                    maxY = Math.max(maxY, top + ch);
                  } else if (child.type === 'drawing') {
                    const cssW = cssWidthRef.current || 0;
                    const cssH = cssHeightRef.current || 0;
                    minX = Math.min(minX, child.x || 0);
                    minY = Math.min(minY, child.y || 0);
                    maxX = Math.max(maxX, (child.x || 0) + cssW);
                    maxY = Math.max(maxY, (child.y || 0) + cssH);
                  }
                } catch(e) {}
              }
              if (minX === Infinity) { minX = 0; minY = 0; maxX = 0; maxY = 0; }
              const w = maxX - minX;
              const h = maxY - minY;
              resizeStartRef.current = {
                x: s.x,
                y: s.y,
                width: w,
                height: h,
                minX,
                minY,
                scale: s.scale || 1
              };
            }
            return true;
          }
        }
      }
    }
    
    // if clicking on an existing layer, select it (unless locked)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue; // skip invisible layers
      if (layer.locked) continue; // skip locked layers for selection
      if (layer.type === 'image' && layer.img) {
        const w = layer.img.naturalWidth * (layer.scale || 1);
        const h = layer.img.naturalHeight * (layer.scale || 1);
        const left = layer.x - w/2;
        const top = layer.y - h/2;
        if (x >= left && x <= left + w && y >= top && y <= top + h) {
          setSelectedLayer(layer.id);
          // prepare drag offset and start dragging immediately
          dragOffsetRef.current = { ox: x - layer.x, oy: y - layer.y };
          setIsDraggingLayer(true);
          // capture pointer so we keep receiving pointer events during drag
          try { if (typeof e.pointerId === 'number') { const canvasEl = canvasRef.current; if (canvasEl) { (canvasEl as any).setPointerCapture?.(e.pointerId); activePointerIdRef.current = e.pointerId; } } } catch (err) {}
          return true;
        }
      } else if (layer.type === 'text') {
        const size = layer.size || textSize;
        const measure = ctx.measureText(layer.text || '');
        const w = measure.width;
        const h = size * 1.2;
        const left = layer.x;
        const top = layer.y;
        if (x >= left && x <= left + w && y >= top && y <= top + h) {
          setSelectedLayer(layer.id);
          dragOffsetRef.current = { ox: x - layer.x, oy: y - layer.y };
          setIsDraggingLayer(true);
          try { if (typeof e.pointerId === 'number') { const canvasEl = canvasRef.current; if (canvasEl) { (canvasEl as any).setPointerCapture?.(e.pointerId); activePointerIdRef.current = e.pointerId; } } } catch (err) {}
          return true;
        }
      }
    }

    // placing new items
    if (tool === 'placeText' && textValue) {
      const id = `layer-${Date.now()}`;
      const newLayer: Layer = { 
        id, 
        type: 'text', 
        name: textValue.substring(0, 20) || 'Texto',
        visible: true,
        opacity: 100,
        locked: false,
        x, 
        y, 
        text: textValue, 
        size: textSize, 
        color 
      };
      setLayers(prev => [...prev, newLayer]);
      setTool('draw');
      setTextValue('');
      redrawAll();
      return true;
    }

    if (tool === 'placeImage' && imageEl) {
      const id = `layer-${Date.now()}`;
      const newLayer: Layer = { 
        id, 
        type: 'image', 
        name: 'Imagem ' + (layers.filter(l => l.type === 'image').length + 1),
        visible: true,
        opacity: 100,
        locked: false,
        x, 
        y, 
        img: imageEl, 
        scale: imageScale 
      };
      setLayers(prev => [...prev, newLayer]);
      setTool('draw');
      setImageFile(null);
      setImageEl(null);
      redrawAll();
      return true;
    }
    // if clicked on empty space, clear selection and indicate we did not handle placement
    setSelectedLayer(null);
    return false;
  };

  const draw = (e: React.PointerEvent | React.MouseEvent | any) => {
    // Salva o último evento de ponteiro/mouse
    lastMouseEventRef.current = e;
    
    // Se já tem um RAF agendado, não agenda outro
    if (rafIdRef.current !== null) return;
    
    // Agenda processamento no próximo frame
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      
      const mouseEvent = lastMouseEventRef.current;
      if (!mouseEvent) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const rawX = mouseEvent.clientX - rect.left;
      const rawY = mouseEvent.clientY - rect.top;
      const scale = scaleRef.current || 1;
      const pan = panRef.current;
      const x = (rawX - pan.x) / scale;
      const y = (rawY - pan.y) / scale;
      // Hover detection for resize handles (only when not drawing)
      if (!isDrawing && selectedLayer) {
        const s = layers.find(l => l.id === selectedLayer);
        if (s && !s.locked) {
          let bounds = { x: 0, y: 0, w: 0, h: 0 };
          if (s.type === 'image' && s.img) {
            const w = s.img.naturalWidth * (s.scale || 1);
            const h = s.img.naturalHeight * (s.scale || 1);
            bounds = { x: s.x - w/2, y: s.y - h/2, w, h };
          } else if (s.type === 'text') {
            const ctx = getCtx();
            if (ctx) ctx.font = `${Math.max(8, s.size || textSize)}px serif`;
            const measure = ctx?.measureText(s.text || '') || { width: 0 };
            const w = measure.width;
            const h = (s.size || textSize) * 1.2;
            bounds = { x: s.x, y: s.y, w, h };
          }

          const handles = [
            { x: bounds.x - 6, y: bounds.y - 6, pos: 'nw' },
            { x: bounds.x + bounds.w + 6, y: bounds.y - 6, pos: 'ne' },
            { x: bounds.x - 6, y: bounds.y + bounds.h + 6, pos: 'sw' },
            { x: bounds.x + bounds.w + 6, y: bounds.y + bounds.h + 6, pos: 'se' },
          ];
          let found: string | null = null;
          const hitRadius = 14;
          for (const h of handles) {
            const dist = Math.hypot(x - h.x, y - h.y);
            if (dist <= hitRadius) { found = h.pos; break; }
          }
          const prev = hoveredHandleRef.current;
          if (found !== prev) {
            hoveredHandleRef.current = found;
            const canvasEl = canvasRef.current;
            if (canvasEl) {
              // set cursor direction based on handle position
              let cur = 'crosshair';
              if (found === 'nw' || found === 'se') cur = 'nwse-resize';
              else if (found === 'ne' || found === 'sw') cur = 'nesw-resize';
              canvasEl.style.cursor = cur;
            }
            redrawAll();
          }
        }
      }
      
      // Handle resizing
      if (isResizing && selectedLayer && resizeHandle && resizeStartRef.current) {
        const s = layers.find(l => l.id === selectedLayer);
        if (s) {
          const startData = resizeStartRef.current;

          if (s.type === 'image' && s.img) {
            // Calculate new scale based on handle movement
            const dx = resizeHandle.includes('e') ? (x - startData.x) : (startData.x - x);
            const dy = resizeHandle.includes('s') ? (y - startData.y) : (startData.y - y);
            const delta = Math.max(dx, dy);
            const newScale = Math.max(0.1, startData.scale + (delta / s.img.naturalWidth));

            setLayers(prev => prev.map(l => 
              l.id === selectedLayer ? { ...l, scale: newScale } : l
            ));
          } else if (s.type === 'text') {
            // For text, resize means changing font size
            const dx = resizeHandle.includes('e') ? (x - startData.x) : (startData.x - x);
            const dy = resizeHandle.includes('s') ? (y - startData.y) : (startData.y - y);
            const delta = Math.max(dx, dy);
            const newSize = Math.max(8, Math.min(200, startData.scale + delta / 2));

            setLayers(prev => prev.map(l => 
              l.id === selectedLayer ? { ...l, size: Math.round(newSize) } : l
            ));
          } else if (s.type === 'group' && s.childrenData) {
            // Compute group's scale change based on pointer delta relative to start bbox
            const dx = x - startData.x;
            const dy = y - startData.y;
            const startW = startData.width || 1;
            const startH = startData.height || 1;
            const minX = (startData as any).minX || 0;
            const minY = (startData as any).minY || 0;
            // choose anchor point based on handle (in group-local coords)
            let anchorX = minX, anchorY = minY;
            if (resizeHandle === 'ne') { anchorX = minX + startW; anchorY = minY; }
            if (resizeHandle === 'se') { anchorX = minX + startW; anchorY = minY + startH; }
            if (resizeHandle === 'nw') { anchorX = minX; anchorY = minY; }
            if (resizeHandle === 'sw') { anchorX = minX; anchorY = minY + startH; }
            const startDist = Math.hypot(anchorX, anchorY) || Math.max(startW, startH);
            const curDist = Math.hypot(anchorX + dx, anchorY + dy);
            const scaleFactor = curDist / Math.max(1, startDist);
            const newScale = Math.max(0.2, Math.min(4, (startData.scale || 1) * scaleFactor));

            // adjust group origin so the anchor point stays stationary in global coords
            const oldScale = startData.scale || 1;
            const oldGx = startData.x;
            const oldGy = startData.y;
            const anchorLocalX = anchorX;
            const anchorLocalY = anchorY;
            const newGx = oldGx + anchorLocalX * (oldScale - newScale);
            const newGy = oldGy + anchorLocalY * (oldScale - newScale);

            setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, scale: newScale, x: newGx, y: newGy } : l));
            try { if (selectedLayer) invalidateLayerCache(selectedLayer); } catch (e) {}
          }

          redrawAll();
        }
        return;
      }
      
      // Handle drawing
      if (isDrawing) {
        // Check if we should draw on a selected drawing layer
        let targetCanvas = drawingOffscreen.current;
        if (selectedLayer) {
          const layer = layers.find(l => l.id === selectedLayer);
          if (layer && layer.type === 'drawing' && layer.drawingCanvas) {
            targetCanvas = layer.drawingCanvas;
          }
        }
        
        const off = targetCanvas;
        if (!off) return;
        const ctx = off.getContext('2d');
        if (!ctx) return;
        ctx.lineTo(x, y);
        ctx.stroke();
        redrawAll();
        return;
      }
    });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const off = drawingOffscreen.current;
    const ctx = off?.getContext('2d') || null;
    ctx?.closePath();
    setIsDrawing(false);
    // snapshot history after finishing a stroke
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
    // release any pointer capture
    try {
      const canvas = canvasRef.current;
      if (canvas && (window as any).PointerEvent) {
        // iterate active pointers is not exposed; attempt to release generically
        // best-effort: release all pointer captures by querying stored pointerId on lastMouseEventRef
        const last = lastMouseEventRef.current;
        if (last && typeof last.pointerId === 'number') {
          try { canvas.releasePointerCapture(last.pointerId); } catch (e) {}
        }
      }
    } catch (e) {}
  };

  // drag handling for selected layer
  useEffect(() => {
    let rafId: number | null = null;
    let lastPointerEvent: PointerEvent | null = null;

    const handleMove = (ev: PointerEvent) => {
      // update pointer map if tracked
      try { if (pointerMapRef.current.has(ev.pointerId)) pointerMapRef.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); } catch (e) {}

      // pinch/pan handling when 2+ pointers
      if (pointerMapRef.current.size >= 2) {
        const ids = Array.from(pointerMapRef.current.keys());
        const a = pointerMapRef.current.get(ids[0])!;
        const b = pointerMapRef.current.get(ids[1])!;
        if (a && b) {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          if (!pinchStartRef.current) {
            pinchStartRef.current = {
              distance,
              center,
              startScale: scaleRef.current,
              startPan: { ...panRef.current }
            };
          }
          const ps = pinchStartRef.current;
          const newScaleRaw = (distance / ps.distance) * ps.startScale;
          const newScale = Math.max(0.2, Math.min(4, newScaleRaw));
          const canvasEl = canvasRef.current;
          if (canvasEl) {
            const rect = canvasEl.getBoundingClientRect();
            const centerStartClient = { x: ps.center.x - rect.left, y: ps.center.y - rect.top };
            const canvasPoint = {
              x: (centerStartClient.x - ps.startPan.x) / ps.startScale,
              y: (centerStartClient.y - ps.startPan.y) / ps.startScale
            };
            const centerNowClient = { x: center.x - rect.left, y: center.y - rect.top };
            const newPan = {
              x: centerNowClient.x - canvasPoint.x * newScale,
              y: centerNowClient.y - canvasPoint.y * newScale
            };
            scaleRef.current = newScale;
            panRef.current = newPan;
            redrawAll();
          }
          return;
        }
      } else {
        pinchStartRef.current = null;
      }

      lastPointerEvent = ev;

      if (!isDraggingLayer && !isResizing) return;

      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;

        if (!lastPointerEvent) return;
        const e = lastPointerEvent;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        const scale = scaleRef.current || 1;
        const pan = panRef.current;
        const x = (rawX - pan.x) / scale;
        const y = (rawY - pan.y) / scale;

        if (isDraggingLayer && selectedLayer) {
          setLayers(prev => prev.map(l => l.id !== selectedLayer ? l : { ...l, x: x - (dragOffsetRef.current?.ox||0), y: y - (dragOffsetRef.current?.oy||0) }));
          redrawAll();
        }
      });
    };

    const handleUp = (ev?: PointerEvent) => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      // remove from pointer map
      try { if (ev && typeof ev.pointerId === 'number') pointerMapRef.current.delete(ev.pointerId); } catch (e) {}
      if (pointerMapRef.current.size < 2) pinchStartRef.current = null;
      if (isDraggingLayer) setIsDraggingLayer(false);
      if (isResizing) {
        setIsResizing(false);
        setResizeHandle(null);
        resizeStartRef.current = null;
      }
      // push history when a drag/resize finishes
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
      // release pointer capture if any
      try {
        const canvasEl = canvasRef.current;
        const pid = activePointerIdRef.current;
        if (canvasEl && pid !== null && typeof pid === 'number') {
          (canvasEl as any).releasePointerCapture?.(pid);
        }
      } catch (e) {}
      activePointerIdRef.current = null;
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isDraggingLayer, isResizing, selectedLayer]);

  const handleFinish = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // ensure latest drawing + layers are rendered
    redrawAll();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `uv_layer_${Date.now()}.png`, { type: 'image/png' });
      onSave(file);
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const off = drawingOffscreen.current;
    if (off) {
      const octx = off.getContext('2d');
      const cssW = cssWidthRef.current || (off.width / (dprRef.current || 1));
      const cssH = cssHeightRef.current || (off.height / (dprRef.current || 1));
      octx?.clearRect(0, 0, cssW, cssH);
      try { off.width = 0; off.height = 0; } catch (e) {}
      drawingOffscreen.current = null;
    }
    // free any drawing canvases attached to layers
    setLayers(prev => {
      prev.forEach(l => {
        if (l.type === 'drawing' && l.drawingCanvas) {
          try { l.drawingCanvas.width = 0; l.drawingCanvas.height = 0; } catch (e) {}
        }
        if (l.type === 'image' && l.img && l.img.src && l.img.src.startsWith('blob:')) {
          try { URL.revokeObjectURL(l.img.src); } catch (e) {}
          const idx = objectUrlsRef.current.indexOf(l.img.src);
          if (idx >= 0) objectUrlsRef.current.splice(idx, 1);
        }
        // clear any cached raster canvas
        try { if ((l as any).cachedCanvas) { ((l as any).cachedCanvas as HTMLCanvasElement).width = 0; ((l as any).cachedCanvas as HTMLCanvasElement).height = 0; } } catch (e) {}
      });
      return [];
    });
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const deleteLayer = (id: string) => {
    setLayers(prev => {
      const removed = prev.find(l => l.id === id);
      let next = prev.filter(l => l.id !== id);
      if (removed) {
        if (removed.type === 'drawing' && removed.drawingCanvas) {
          try { removed.drawingCanvas.width = 0; removed.drawingCanvas.height = 0; } catch (e) {}
        }
        if (removed.type === 'image' && removed.img && removed.img.src && removed.img.src.startsWith('blob:')) {
          try { URL.revokeObjectURL(removed.img.src); } catch (e) {}
          const idx = objectUrlsRef.current.indexOf(removed.img.src);
          if (idx >= 0) objectUrlsRef.current.splice(idx, 1);
        }
        // clear cached raster if any
        try { if ((removed as any).cachedCanvas) { ((removed as any).cachedCanvas as HTMLCanvasElement).width = 0; ((removed as any).cachedCanvas as HTMLCanvasElement).height = 0; } } catch (e) {}
        // if group, restore children into top-level with absolute positions
        if (removed.type === 'group' && removed.childrenData && Array.isArray(removed.childrenData)) {
          const absChildren = removed.childrenData.map(c => ({ ...c, x: (c.x || 0) + (removed.x || 0), y: (c.y || 0) + (removed.y || 0) }));
          next = [...next, ...absChildren];
        }
      }
      return next;
    });
    if (selectedLayer === id) setSelectedLayer(null);
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const selectLayer = (id: string) => {
    setSelectedLayer(id);
    setTool('draw');
    redrawAll();
  };

  const addEmptyTextLayer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const id = `layer-${Date.now()}`;
    const newLayer: Layer = { 
      id, 
      type: 'text',
      name: 'Novo Texto',
      visible: true,
      opacity: 100,
      locked: false,
      x: (cssWidthRef.current || (canvas.width / (dprRef.current || 1))) / 2, 
      y: (cssHeightRef.current || (canvas.height / (dprRef.current || 1))) / 2, 
      text: 'Novo Texto', 
      size: textSize, 
      color 
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayer(id);
    setShowAddLayerMenu(false);
    // mark this new layer cache to be built on next redraw
    invalidateLayerCache(id);
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const addEmptyDrawingLayer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const id = `layer-${Date.now()}`;
    
    // Create an offscreen canvas for this drawing layer
    const drawCanvas = document.createElement('canvas');
    const cssW = cssWidthRef.current || (canvas.width / (dprRef.current || 1));
    const cssH = cssHeightRef.current || (canvas.height / (dprRef.current || 1));
    drawCanvas.width = Math.round(cssW * (dprRef.current || 1));
    drawCanvas.height = Math.round(cssH * (dprRef.current || 1));
    const drawCtx = drawCanvas.getContext('2d');
    if (drawCtx) drawCtx.setTransform(dprRef.current || 1, 0, 0, dprRef.current || 1, 0, 0);
    
    const newLayer: Layer = { 
      id, 
      type: 'drawing',
      name: 'Desenho ' + (layers.filter(l => l.type === 'drawing').length + 1),
      visible: true,
      opacity: 100,
      locked: false,
      drawingCanvas: drawCanvas,
      x: 0,
      y: 0
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayer(id);
    setShowAddLayerMenu(false);
    setTool('draw');
    invalidateLayerCache(id);
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
    try { invalidateLayerCache(id); } catch (e) {}
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const toggleLayerLock = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const updateLayerOpacity = (id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity: Math.max(0, Math.min(100, opacity)) } : l));
    try { invalidateLayerCache(id); } catch (e) {}
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const renameLayer = (id: string, newName: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));
    setEditingLayerName(null);
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const duplicateLayer = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;
    const newId = `layer-${Date.now()}`;
    const duplicated: Layer = {
      ...layer,
      id: newId,
      name: layer.name + ' (cópia)',
      x: (layer.x || 0) + 20,
      y: (layer.y || 0) + 20
    };
    const index = layers.findIndex(l => l.id === id);
    setLayers(prev => [...prev.slice(0, index + 1), duplicated, ...prev.slice(index + 1)]);
    setSelectedLayer(newId);
    try { invalidateLayerCache(newId); } catch (e) {}
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const toggleGroupCheck = (id: string) => {
    setGroupChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const createGroup = () => {
    try {
      const checkedIds = Object.keys(groupChecks).filter(k => groupChecks[k]);
      if (checkedIds.length < 2) return;
      const selectedLayers = layers.filter(l => checkedIds.includes(l.id));
      if (selectedLayers.length < 2) return;
      // compute centroid
      const cx = selectedLayers.reduce((s, l) => s + (l.x || 0), 0) / selectedLayers.length;
      const cy = selectedLayers.reduce((s, l) => s + (l.y || 0), 0) / selectedLayers.length;
      // make children relative
      const childrenData = selectedLayers.map(l => ({ ...l, x: (l.x || 0) - cx, y: (l.y || 0) - cy }));
      // remove originals from top-level
      const remaining = layers.filter(l => !checkedIds.includes(l.id));
      const groupLayer: Layer = {
        id: `group-${Date.now()}`,
        type: 'group',
        name: 'Grupo',
        visible: true,
        opacity: 100,
        locked: false,
        x: cx,
        y: cy,
        scale: 1,
        childrenData
      } as any;
      setLayers([...remaining, groupLayer]);
      try { invalidateAllLayerCaches(); } catch (e) {}
      setGroupChecks({});
      setSelectedLayer(groupLayer.id);
      redrawAll();
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
    } catch (e) {}
  };

  const ungroupLayer = (id: string) => {
    try {
      const grp = layers.find(l => l.id === id && l.type === 'group');
      if (!grp || !grp.childrenData) return;
      const absChildren = grp.childrenData.map(c => ({ ...c, x: (c.x || 0) + (grp.x || 0), y: (c.y || 0) + (grp.y || 0) }));
      // remove group and add children back at group's position
      const remaining = layers.filter(l => l.id !== id);
      setLayers([...remaining, ...absChildren]);
      try { invalidateAllLayerCaches(); } catch (e) {}
      if (selectedLayer === id) setSelectedLayer(null);
      redrawAll();
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
    } catch (e) {}
  };

  const mergeDown = (id: string) => {
    const index = layers.findIndex(l => l.id === id);
    if (index <= 0) return; // can't merge if it's the bottom layer
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create temporary canvas to merge layers
    const tempCanvas = document.createElement('canvas');
    const cssW = cssWidthRef.current || (canvas.width / (dprRef.current || 1));
    const cssH = cssHeightRef.current || (canvas.height / (dprRef.current || 1));
    tempCanvas.width = Math.round(cssW * (dprRef.current || 1));
    tempCanvas.height = Math.round(cssH * (dprRef.current || 1));
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) tempCtx.setTransform(dprRef.current || 1, 0, 0, dprRef.current || 1, 0, 0);
    if (!tempCtx) return;
    
    const lowerLayer = layers[index - 1];
    const upperLayer = layers[index];
    
    // Draw lower layer
    tempCtx.globalAlpha = (lowerLayer.opacity || 100) / 100;
    if (lowerLayer.type === 'image' && lowerLayer.img) {
      const w = lowerLayer.img.naturalWidth * (lowerLayer.scale || 1);
      const h = lowerLayer.img.naturalHeight * (lowerLayer.scale || 1);
      tempCtx.drawImage(lowerLayer.img, (lowerLayer.x || 0) - w/2, (lowerLayer.y || 0) - h/2, w, h);
    }
    
    // Draw upper layer on top
    tempCtx.globalAlpha = (upperLayer.opacity || 100) / 100;
    if (upperLayer.type === 'image' && upperLayer.img) {
      const w = upperLayer.img.naturalWidth * (upperLayer.scale || 1);
      const h = upperLayer.img.naturalHeight * (upperLayer.scale || 1);
      tempCtx.drawImage(upperLayer.img, (upperLayer.x || 0) - w/2, (upperLayer.y || 0) - h/2, w, h);
    }
    
    // Create merged image
    const mergedImg = new Image();
    mergedImg.src = tempCanvas.toDataURL();
    mergedImg.onload = () => {
      const mergedLayer: Layer = {
        id: `layer-${Date.now()}`,
        type: 'image',
        name: `${lowerLayer.name} + ${upperLayer.name}`,
        visible: true,
        opacity: 100,
        locked: false,
        x: (cssWidthRef.current || (canvas.width / (dprRef.current || 1))) / 2,
        y: (cssHeightRef.current || (canvas.height / (dprRef.current || 1))) / 2,
        img: mergedImg,
        scale: 1
      };
      
      setLayers(prev => [
        ...prev.slice(0, index - 1),
        mergedLayer,
        ...prev.slice(index + 1)
      ]);
      try { invalidateAllLayerCaches(); } catch (e) {}
      setSelectedLayer(mergedLayer.id);
      redrawAll();
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
    };
  };

  const mergeVisible = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const tempCanvas = document.createElement('canvas');
    const cssW = cssWidthRef.current || (canvas.width / (dprRef.current || 1));
    const cssH = cssHeightRef.current || (canvas.height / (dprRef.current || 1));
    tempCanvas.width = Math.round(cssW * (dprRef.current || 1));
    tempCanvas.height = Math.round(cssH * (dprRef.current || 1));
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) tempCtx.setTransform(dprRef.current || 1, 0, 0, dprRef.current || 1, 0, 0);
    if (!tempCtx) return;
    
    // Draw all visible layers
    for (const layer of layers) {
      if (!layer.visible) continue;
      
      tempCtx.globalAlpha = (layer.opacity || 100) / 100;
      
      if (layer.type === 'text') {
        tempCtx.fillStyle = layer.color || color;
        tempCtx.font = `${Math.max(8, layer.size || textSize)}px serif`;
        tempCtx.textBaseline = 'top';
        tempCtx.fillText(layer.text || '', layer.x || 0, layer.y || 0);
      } else if (layer.type === 'image' && layer.img) {
        const w = layer.img.naturalWidth * (layer.scale || 1);
        const h = layer.img.naturalHeight * (layer.scale || 1);
        tempCtx.drawImage(layer.img, (layer.x || 0) - w/2, (layer.y || 0) - h/2, w, h);
      }
    }
    
    const mergedImg = new Image();
    mergedImg.src = tempCanvas.toDataURL();
    mergedImg.onload = () => {
      const mergedLayer: Layer = {
        id: `layer-${Date.now()}`,
        type: 'image',
        name: 'Camadas Mescladas',
        visible: true,
        opacity: 100,
        locked: false,
        x: (cssWidthRef.current || (canvas.width / (dprRef.current || 1))) / 2,
        y: (cssHeightRef.current || (canvas.height / (dprRef.current || 1))) / 2,
        img: mergedImg,
        scale: 1
      };
      
      setLayers([mergedLayer]);
      try { invalidateAllLayerCaches(); } catch (e) {}
      setSelectedLayer(mergedLayer.id);
      redrawAll();
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
    };
  };

  const moveLayer = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newLayers = [...layers];
    const [movedLayer] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, movedLayer);
    setLayers(newLayers);
    try { if (movedLayer && movedLayer.id) invalidateLayerCache(movedLayer.id); } catch (e) {}
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const getToolInstructions = () => {
    switch (tool) {
      case 'draw':
        return {
          title: '✏️ Modo Desenho',
          description: 'Desenhe livremente no canvas',
          steps: [
            ['1', 'Escolha uma cor na seção acima'],
            ['2', 'Ajuste o tamanho do pincel'],
            ['3', 'Clique e arraste no canvas para desenhar'],
          ],
        };
      case 'erase':
        return {
          title: '🗑️ Borracha',
          description: 'Apague partes do desenho',
          steps: [
            ['1', 'Use o tamanho para controlar a força de apagamento'],
            ['2', 'Clique e arraste para apagar'],
            ['3', 'Maior tamanho = área maior apagada'],
          ],
        };
      case 'placeText':
        return {
          title: '🅰️ Inserir Texto',
          description: 'Adicione textos à sua arte',
          steps: [
            ['1', 'Digite o texto na caixa abaixo'],
            ['2', 'Defina o tamanho (8-200px)'],
            ['3', 'Clique no canvas para colocar'],
            ['4', 'Pressione ENTER ou clique para confirmar'],
          ],
        };
      case 'placeImage':
        return {
          title: '🖼️ Inserir Imagem',
          description: 'Coloque imagens do seu computador',
          steps: [
            ['1', 'Clique no botão "Imagem" para selecionar'],
            ['2', 'Escolha uma imagem do seu PC'],
            ['3', 'Ajuste a escala (10%-200%)'],
            ['4', 'Clique no canvas para colocar'],
          ],
        };
      default:
        return null;
    }
  };

  return (
    <div className="uv-editor-overlay">
      <div className="uv-editor-panel">
        <div className="uv-header">
          <h3>{mode === 'filter' ? '🔍 Desenhar Segredos' : '💎 Luz UV'}</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={undo} className="tool-btn" title="Desfazer (Ctrl/Cmd+Z)" disabled={!undoAvailable} aria-disabled={!undoAvailable}>
              ↶{undoAvailable ? <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>{undoStackRef.current.length}</span> : null}
            </button>
            <button onClick={redo} className="tool-btn" title="Refazer (Ctrl/Cmd+Y / Shift+Ctrl+Z)" disabled={!redoAvailable} aria-disabled={!redoAvailable}>
              ↷{redoAvailable ? <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>{redoStackRef.current.length}</span> : null}
            </button>
            <button onClick={exportHistory} className="tool-btn" title="Exportar histórico (JSON)">⇩</button>
            <button onClick={() => historyFileInputRef.current?.click()} className="tool-btn" title="Importar histórico (JSON)">⇪</button>
            <input ref={historyFileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0] || null; importHistoryFile(f); e.currentTarget.value = ''; }} />
            <button onClick={onClose} className="btn-close">✕</button>
          </div>
        </div>

        <div className="uv-editor-main">
          <div className="editor-workspace">
            <div ref={canvasContainerRef} className="canvas-container" style={{ backgroundImage: `url(${baseImageUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
              <canvas
                ref={canvasRef}
                onPointerDown={(e) => { try { if (typeof e.pointerId === 'number') pointerMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); } catch (err) {} const handled = handleCanvasClick(e); if (!handled && (tool === 'draw' || tool === 'erase')) startDrawing(e); }}
                onPointerMove={draw}
                onPointerUp={(e) => { try { if (typeof e.pointerId === 'number') pointerMapRef.current.delete(e.pointerId); } catch (err) {} stopDrawing(); }}
                onPointerCancel={(e) => { try { if (typeof e.pointerId === 'number') pointerMapRef.current.delete(e.pointerId); } catch (err) {} stopDrawing(); }}
                onPointerLeave={(e) => { try { if (typeof e.pointerId === 'number') pointerMapRef.current.delete(e.pointerId); } catch (err) {} stopDrawing(); }}
                className={isResizing ? 'resizing' : isDraggingLayer ? 'dragging' : ''}
                style={{ display: 'block', maxWidth: '100%' }}
              />
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="uv-sidebar">
            <div className="uv-sidebar-scroll">
            
            {/* TOOLS */}
            <div className="uv-sidebar-section" style={{ minHeight: '200px' }}>
              <h4>🛠️ Ferramentas</h4>
              <div className="tools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button
                  className={`tool-btn ${tool === 'draw' ? 'active' : ''}`}
                  onClick={() => setTool('draw')}
                  title="Desenhar"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  ✏️ Desenhar
                </button>
                <button
                  className={`tool-btn ${tool === 'erase' ? 'active' : ''}`}
                  onClick={() => setTool('erase')}
                  title="Apagar"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  🗑️ Borracha
                </button>
                <button
                  className={`tool-btn ${censorMode ? 'active' : ''}`}
                  onClick={() => {
                    const next = !censorMode;
                    setCensorMode(next);
                    if (next) {
                      setColor('#000000');
                      setTool('draw');
                      setBrushSize(20);
                    }
                  }}
                  title="Censura"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  🟥 Censura
                </button>
                <button
                  className={`tool-btn ${tool === 'placeText' ? 'active' : ''}`}
                  onClick={() => setTool('placeText')}
                  title="Texto"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  🅰️ Texto
                </button>
                <button
                  className={`tool-btn ${tool === 'placeImage' ? 'active' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  title="Imagem"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  🖼️ Imagem
                </button>
                <button
                  className="tool-btn"
                  onClick={clearCanvas}
                  title="Limpar"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  ⚡ Limpar
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0] || null; setImageFile(f); if (f) setTool('placeImage'); }} />
            </div>

            {/* COLORS */}
            <div className="uv-sidebar-section">
              <h4>🎨 Cor</h4>
              <div className="color-grid">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    className={`color-btn ${color === c.hex ? 'active' : ''}`}
                    style={{ background: c.hex, boxShadow: color === c.hex ? `${c.glow}, inset 0 0 10px rgba(255,255,255,0.3)` : `0 0 0 1px rgba(0,0,0,0.5)` }}
                    onClick={() => { setColor(c.hex); setTool('draw'); }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* SIZE */}
            <div className="uv-sidebar-section">
              <h4>📏 Tamanho</h4>
              <div className="size-control">
                <div className="size-input-group">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Math.max(1, Math.min(100, Number(e.target.value))))}
                  />
                  <span style={{color:'#aaa', fontSize:'11px', minWidth:'20px'}}>px</span>
                </div>
                <div className="size-preview">
                  <div className="size-preview-dot" style={{ width: `${Math.min(brushSize, 40)}px`, height: `${Math.min(brushSize, 40)}px` }} />
                </div>
              </div>
            </div>

            {/* LAYERS */}
            <div className="uv-sidebar-section layers-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0 }}>📦 Camadas ({layers.length})</h4>
                <div style={{ display: 'flex', gap: '6px', position: 'relative' }}>
                  <button 
                    onClick={mergeVisible}
                    className="layer-action-btn"
                    title="Mesclar Visíveis"
                    disabled={layers.filter(l => l.visible).length < 2}
                  >
                    🔗
                  </button>
                    <button
                      onClick={createGroup}
                      className="layer-action-btn"
                      title="Criar Grupo com camadas selecionadas"
                      disabled={Object.values(groupChecks).filter(Boolean).length < 2}
                    >
                      👥
                    </button>
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setShowAddLayerMenu(!showAddLayerMenu)}
                      className="add-layer-btn"
                      title="Adicionar nova camada"
                    >
                      ➕
                    </button>
                    
                    {showAddLayerMenu && (
                      <>
                        <div 
                          style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 999
                          }}
                          onClick={() => setShowAddLayerMenu(false)}
                        />
                        <div 
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            background: 'rgba(20, 20, 20, 0.98)',
                            border: '1px solid #b366ff',
                            borderRadius: '6px',
                            padding: '6px',
                            minWidth: '160px',
                            boxShadow: '0 0 20px rgba(179, 102, 255, 0.4)',
                            zIndex: 1000
                          }}
                        >
                          <button
                            onClick={addEmptyDrawingLayer}
                            style={{
                              width: '100%',
                              background: 'rgba(100, 100, 100, 0.3)',
                              border: '1px solid rgba(180, 180, 180, 0.3)',
                              color: '#ddd',
                              padding: '8px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              textAlign: 'left',
                              marginBottom: '4px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(150, 150, 150, 0.5)';
                              e.currentTarget.style.borderColor = '#00ffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(100, 100, 100, 0.3)';
                              e.currentTarget.style.borderColor = 'rgba(180, 180, 180, 0.3)';
                            }}
                          >
                            🎨 Camada de Desenho
                          </button>
                          <button
                            onClick={addEmptyTextLayer}
                            style={{
                              width: '100%',
                              background: 'rgba(100, 100, 100, 0.3)',
                              border: '1px solid rgba(180, 180, 180, 0.3)',
                              color: '#ddd',
                              padding: '8px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              textAlign: 'left',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(150, 150, 150, 0.5)';
                              e.currentTarget.style.borderColor = '#00ffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(100, 100, 100, 0.3)';
                              e.currentTarget.style.borderColor = 'rgba(180, 180, 180, 0.3)';
                            }}
                          >
                            🅰️ Camada de Texto
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="layers-list">
                {layers.length === 0 ? (
                  <div className="no-layers">
                    Nenhuma camada ainda.
                    <br />
                    <small>Clique no "➕" acima para adicionar</small>
                  </div>
                ) : (
                  [...layers].reverse().map((layer, reverseIndex) => {
                    const actualIndex = layers.length - 1 - reverseIndex;
                    return (
                      <div
                        key={layer.id}
                        className={`layer-item ${selectedLayer === layer.id ? 'active' : ''} ${layer.locked ? 'locked' : ''}`}
                        draggable={!layer.locked}
                        onDragStart={(e) => {
                          if (layer.locked) {
                            e.preventDefault();
                            return;
                          }
                          setDraggedLayerId(layer.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverLayerId(layer.id);
                        }}
                        onDragLeave={() => {
                          setDragOverLayerId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedLayerId && draggedLayerId !== layer.id) {
                            const fromIndex = layers.findIndex(l => l.id === draggedLayerId);
                            const toIndex = actualIndex;
                            moveLayer(fromIndex, toIndex);
                          }
                          setDraggedLayerId(null);
                          setDragOverLayerId(null);
                        }}
                        onDragEnd={() => {
                          setDraggedLayerId(null);
                          setDragOverLayerId(null);
                        }}
                        style={{
                          borderColor: dragOverLayerId === layer.id ? '#b366ff' : undefined,
                          borderWidth: dragOverLayerId === layer.id ? '2px' : '1px',
                          opacity: draggedLayerId === layer.id ? 0.5 : 1,
                        }}
                      >
                        <div className="layer-controls">
                          <input type="checkbox" checked={!!groupChecks[layer.id]} onChange={(e) => { e.stopPropagation(); toggleGroupCheck(layer.id); }} title="Selecionar para agrupar" />
                          <button
                            className={`layer-visibility-btn ${layer.visible ? 'visible' : 'hidden'}`}
                            onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                            title={layer.visible ? 'Ocultar camada' : 'Mostrar camada'}
                          >
                            {layer.visible ? '👁️' : '🚫'}
                          </button>
                          <button
                            className={`layer-lock-btn ${layer.locked ? 'locked' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                            title={layer.locked ? 'Desbloquear camada' : 'Bloquear camada'}
                          >
                            {layer.locked ? '🔒' : '🔓'}
                          </button>
                        </div>
                        <div className="layer-item-info" onClick={() => !layer.locked && selectLayer(layer.id)}>
                          {editingLayerName === layer.id ? (
                            <input
                              type="text"
                              className="layer-name-input"
                              value={layer.name}
                              onChange={(e) => setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, name: e.target.value } : l))}
                              onBlur={() => setEditingLayerName(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingLayerName(null);
                                if (e.key === 'Escape') {
                                  setEditingLayerName(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="layer-item-title"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                if (!layer.locked) setEditingLayerName(layer.id);
                              }}
                              title="Clique duplo para renomear"
                            >
                              {layer.name}
                            </div>
                          )}
                          <div className="layer-item-type">
                            {layer.type === 'text' ? `Texto ${layer.size}px` : 
                             layer.type === 'image' ? `Escala ${((layer.scale || 1) * 100).toFixed(0)}%` : 
                             layer.type === 'drawing' ? 'Desenho livre' : 
                             layer.type === 'group' ? 'Grupo' : layer.type}
                          </div>
                        </div>
                        <div className="layer-item-actions">
                          <button 
                            onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }} 
                            title="Duplicar"
                            disabled={layer.locked}
                          >
                            📑
                          </button>
                          {layer.type === 'group' && (
                            <button onClick={(e) => { e.stopPropagation(); ungroupLayer(layer.id); }} title="Desagrupar">🔓</button>
                          )}
                          {actualIndex > 0 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); mergeDown(layer.id); }} 
                              title="Mesclar para baixo"
                              disabled={layer.locked}
                            >
                              ⬇️
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} 
                            className="delete" 
                            title="Deletar"
                            disabled={layer.locked}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* LAYER CONTROLS - OUTSIDE SCROLLABLE AREA */}
            {selectedLayer && layers.find(l => l.id === selectedLayer) && (() => {
              const layer = layers.find(l => l.id === selectedLayer);
              if (!layer) return null;
              return (
                <div className="uv-sidebar-section" style={{ borderTop: '2px solid #b366ff', paddingTop: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#00ffff' }}>⚙️ Controles da Camada</h4>
                  
                  {/* OPACITY */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', color: '#aaa' }}>Opacidade</label>
                      <span style={{ fontSize: '11px', color: '#00ffff', fontWeight: 'bold' }}>{layer.opacity || 100}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={layer.opacity || 100}
                      onChange={(e) => updateLayerOpacity(selectedLayer, Number(e.target.value))}
                      disabled={layer.locked}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  {/* SCALE - Only for images */}
                  {layer.type === 'image' && layer.img && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', color: '#aaa' }}>Escala</label>
                        <span style={{ fontSize: '11px', color: '#00ffff', fontWeight: 'bold' }}>{((layer.scale || 1) * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={300}
                        step={5}
                        value={(layer.scale || 1) * 100}
                        onChange={(e) => {
                          const newScale = Number(e.target.value) / 100;
                          setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, scale: newScale } : l));
                          redrawAll();
                        }}
                        disabled={layer.locked}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                        <button 
                          onClick={() => {
                            setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, scale: 0.5 } : l));
                            redrawAll();
                          }}
                          disabled={layer.locked}
                          style={{ flex: 1, padding: '4px', fontSize: '10px', background: 'rgba(100,100,100,0.3)', border: '1px solid #555', color: '#ddd', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          50%
                        </button>
                        <button 
                          onClick={() => {
                            setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, scale: 1 } : l));
                            redrawAll();
                          }}
                          disabled={layer.locked}
                          style={{ flex: 1, padding: '4px', fontSize: '10px', background: 'rgba(100,100,100,0.3)', border: '1px solid #555', color: '#ddd', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          100%
                        </button>
                        <button 
                          onClick={() => {
                            setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, scale: 2 } : l));
                            redrawAll();
                          }}
                          disabled={layer.locked}
                          style={{ flex: 1, padding: '4px', fontSize: '10px', background: 'rgba(100,100,100,0.3)', border: '1px solid #555', color: '#ddd', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          200%
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* FONT SIZE - Only for text */}
                  {layer.type === 'text' && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', color: '#aaa' }}>Tamanho</label>
                        <span style={{ fontSize: '11px', color: '#00ffff', fontWeight: 'bold' }}>{layer.size || textSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={8}
                        max={200}
                        value={layer.size || textSize}
                        onChange={(e) => {
                          const newSize = Number(e.target.value);
                          setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, size: newSize } : l));
                          redrawAll();
                        }}
                        disabled={layer.locked}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
          </div>
        </div>

        {/* FLOATING CONTROLS */}
        {tool === 'placeText' && (
          <div className="floating-control">
            <input
              placeholder="Texto..."
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && textValue) { handleCanvasClick(e as any); } }}
              autoFocus
            />
            <label>Tam:</label>
            <input
              type="number"
              min={8}
              max={200}
              value={textSize}
              onChange={e => setTextSize(Number(e.target.value))}
              style={{ width: 60 }}
            />
            <span style={{color:'#aaa', fontSize:'10px'}}>Clique no canvas</span>
          </div>
        )}

        {tool === 'placeImage' && imageFile && (
          <div className="floating-control">
            <label>Escala:</label>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.05}
              value={imageScale}
              onChange={e => setImageScale(Number(e.target.value))}
              style={{ width: 100 }}
            />
            <span style={{color:'#aaa', fontSize:'10px'}}>{(imageScale * 100).toFixed(0)}%</span>
            <span style={{color:'#aaa', fontSize:'10px'}}>Clique no canvas</span>
          </div>
        )}

        {/* RESIZE INDICATOR */}
        {isResizing && selectedLayer && (() => {
          const s = layers.find(l => l.id === selectedLayer);
          if (!s) return null;
          
          let sizeText = '';
          if (s.type === 'image' && s.img) {
            const w = Math.round(s.img.naturalWidth * (s.scale || 1));
            const h = Math.round(s.img.naturalHeight * (s.scale || 1));
            sizeText = `${w}×${h}px (${((s.scale || 1) * 100).toFixed(0)}%)`;
          } else if (s.type === 'text') {
            sizeText = `${s.size || textSize}px`;
          }
          
          return (
            <div className="resize-indicator">
              📏 {sizeText}
            </div>
          );
        })()}

        {/* INSTRUCTIONS PANEL - OPTIONAL */}
        {showInstructions && (() => {
          const instructions = getToolInstructions();
          if (!instructions) return null;
          return (
            <div className="instructions-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h5 style={{ margin: 0 }}>{instructions.title}</h5>
                <button 
                  onClick={() => setShowInstructions(false)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', padding: '0 4px' }}
                  title="Fechar ajuda"
                >
                  ✕
                </button>
              </div>
              <p>{instructions.description}</p>
              {instructions.steps.map((step, i) => (
                <div key={i} className="instruction-step">
                  <strong>{step[0]}</strong>
                  <span>{step[1]}</span>
                </div>
              ))}
            </div>
          );
        })()}

        <div className="uv-toolbar">
          <button 
            className="btn-help"
            onClick={() => setShowInstructions(!showInstructions)}
            title={showInstructions ? 'Ocultar ajuda' : 'Mostrar ajuda'}
          >
            {showInstructions ? '📖' : '❓'}
          </button>
          <button className="btn-save-uv" onClick={handleFinish}>✓ Confirmar</button>
        </div>
      </div>
    </div>
  );
}
