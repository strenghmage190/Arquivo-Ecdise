import React, { useRef, useState, useEffect } from 'react';
import './UVEditor.css';
import { LayersPanel } from '../LayersPanel';
import { markPerfKeep } from '../../utils/perf_helpers';
import {
  Radio,
  Palette,
  Eye,
  Save,
  X,
  MousePointer,
  Pencil,
  Eraser,
  Image as ImageIcon,
  Type,
  Target,
  Sparkles,
  Layers,
} from 'lucide-react';

export interface Layer {
  id: string;
  type: 'text' | 'image' | 'drawing' | 'group';
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  blendMode?: string; // e.g. 'normal','multiply','screen','overlay','add'
  x?: number;
  y?: number;
  rotation?: number; // rotation in radians
  text?: string;
  size?: number;
  color?: string;
  img?: HTMLImageElement;
  scale?: number;
  drawingCanvas?: HTMLCanvasElement; // For drawing layers
  children?: string[]; // IDs of child layers if type is 'group'
  childrenData?: Layer[]; // Inlined child layer objects when grouped
  parentId?: string | null; // ID of parent group, if any
  mask?: HTMLCanvasElement; // Optional mask for the layer
  isEditingMask?: boolean; // Indicates if the user is editing the mask
  preview?: string; // Optional preview property for layer thumbnails
}

interface UVEditorProps {
  baseImageUrl: string;
  onSave: (file: File, meta?: { targetChannel?: 'R' | 'G' | 'B' }) => void;
  onClose: () => void;
  mode?: 'uv' | 'filter' | 'rgb';
  initialImageFile?: File | null;
  showForensicControls?: boolean;
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

export default function UVEditor({ baseImageUrl, onSave, onClose, mode = 'rgb', initialImageFile, showForensicControls = false }: UVEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(mode === 'filter' ? '#ffffff' : '#ff0000'); // Default to red for RGB mode
  const [brushSize, setBrushSize] = useState(mode === 'filter' ? 18 : 6);
  const [maskBrushSoftness, setMaskBrushSoftness] = useState(0.6);
  const [maskBrushOpacity, setMaskBrushOpacity] = useState(1);
  const [tool, setTool] = useState<'select' | 'draw' | 'erase' | 'placeImage' | 'placeText'>('draw');
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
  const [isRotating, setIsRotating] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ox:number, oy:number} | null>(null);
  const resizeStartRef = useRef<{x:number, y:number, width:number, height:number, scale:number, minX?: number, minY?: number} | null>(null);
  
  const [editingLayerName, setEditingLayerName] = useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAddLayerMenu, setShowAddLayerMenu] = useState(false);
  const [maskPaintMode, setMaskPaintMode] = useState<'hide'|'reveal'>('hide');
  const [maskUseEraser, setMaskUseEraser] = useState(false);
  const prevToolRef = useRef<typeof tool | null>(null);
  const [maskCursor, setMaskCursor] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [expandedSections, setExpandedSections] = useState({
    tools: true,
    colors: true,
    layers: true,
    properties: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // inline canvas text edit state
  const [inlineTextEdit, setInlineTextEdit] = useState<null | { id: string; value: string; cssX: number; cssY: number; fontSize: number }>(null);
  
  // RAF optimization for draw
  const rafIdRef = useRef<number | null>(null);
  const lastMouseEventRef = useRef<any | null>(null);
  const redrawRafIdRef = useRef<number | null>(null);
  const redrawScheduledRef = useRef<boolean>(false);
  const lastRedrawRef = useRef<number>(0);
  const redrawTimeoutRef = useRef<number | null>(null);
  // Throttle/schedule pointermove processing to avoid flooding redraws
  const moveScheduledRef = useRef<boolean>(false);
  const latestMoveRef = useRef<{clientX:number, clientY:number, pointerId?: number, buttons?: number} | null>(null);
  const REDRAW_MIN_MS = 16; // ~60fps
  // Track created object URLs so we can revoke them on unmount
  const objectUrlsRef = useRef<string[]>([]);
  const dprRef = useRef<number>(1);
  const debugPointerOverlayRef = useRef<boolean>(true);
  const cssWidthRef = useRef<number | null>(null);
  const cssHeightRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const pointerMapRef = useRef<Map<number, {x:number,y:number}>>(new Map());
  const pinchStartRef = useRef<any | null>(null);
  const panRef = useRef<{x:number,y:number}>({ x: 0, y: 0 });
  const scaleRef = useRef<number>(1);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const strokeStartRef = useRef<{x:number,y:number} | null>(null);
  const strokePointsRef = useRef<Array<{x:number,y:number}>>([]);
  const drawingTargetCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingMaskRef = useRef<boolean>(false);

  const [targetChannel, setTargetChannel] = useState<'R' | 'G' | 'B'>('R');

  const handleTargetChannelChange = (channel: 'R' | 'G' | 'B') => {
    setTargetChannel(channel);
  };

  // Helper: get base image bounds in canvas "world" (CSS pixel) coordinates
  const getImageBounds = () => {
    try {
      const base = layers.find(l => l.id === '__base_image');
      // Ensure base image exists and is loaded
      if (!base || !base.img) return null;
      if (!(base.img.complete || (base.img as any).naturalWidth > 0)) return null;
      const imgW = (base.img.naturalWidth || base.img.width || 0) * (base.scale || 1);
      const imgH = (base.img.naturalHeight || base.img.height || 0) * (base.scale || 1);
      const left = (base.x || 0) - imgW / 2;
      const top = (base.y || 0) - imgH / 2;
      const right = (base.x || 0) + imgW / 2;
      const bottom = (base.y || 0) + imgH / 2;
      return { left, top, right, bottom, width: imgW, height: imgH, centerX: base.x || 0, centerY: base.y || 0 };
    } catch (e) { return null; }
  };

  // Helpers for soft mask brush
  const hexToRgb = (hex: string) => {
    try {
      if (hex.startsWith('rgba')) {
        const m = hex.match(/rgba\((\d+),(\d+),(\d+),(\d*\.?\d+)\)/);
        if (m) return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]), a: parseFloat(m[4]) };
      }
      if (hex.startsWith('rgb')) {
        const m = hex.match(/rgb\((\d+),(\d+),(\d+)\)/);
        if (m) return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]), a: 1 };
      }
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      const bigint = parseInt(h, 16);
      return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255, a: 1 };
    } catch (e) { return { r: 0, g: 0, b: 0, a: 1 }; }
  };

  const drawSoftStroke = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, radius: number, hexColor: string, softness: number, opacity: number) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy) || 1;
    const step = Math.max(1, Math.floor(radius * 0.3));
    const steps = Math.max(1, Math.ceil(dist / step));
    const rgb = hexToRgb(hexColor || '#000000');
    const innerAlpha = opacity * (rgb.a || 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x0 + dx * t;
      const py = y0 + dy * t;
      const r = radius / 2;
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${innerAlpha})`);
      g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g as any;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Clamp pan so the base image always covers the viewport (prevents panning into empty space)
  const clampPan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = getImageBounds();
    if (!bounds) return;
    const s = scaleRef.current || 1;
    const viewportW = cssWidthRef.current || (canvas.width / (dprRef.current || 1));
    const viewportH = cssHeightRef.current || (canvas.height / (dprRef.current || 1));

    // compute allowed pan range so image edges at least cover viewport
    const minPanX = viewportW - s * (bounds.centerX + bounds.width / 2);
    const maxPanX = -s * (bounds.centerX - bounds.width / 2);
    const minPanY = viewportH - s * (bounds.centerY + bounds.height / 2);
    const maxPanY = -s * (bounds.centerY - bounds.height / 2);

    // if image is smaller than viewport at current scale, center it
    if (minPanX > maxPanX) {
      panRef.current.x = (minPanX + maxPanX) / 2;
    } else {
      panRef.current.x = Math.min(maxPanX, Math.max(minPanX, panRef.current.x));
    }
    if (minPanY > maxPanY) {
      panRef.current.y = (minPanY + maxPanY) / 2;
    } else {
      panRef.current.y = Math.min(maxPanY, Math.max(minPanY, panRef.current.y));
    }
  };

  // NOVO E CORRIGIDO: Helper para converter coordenadas do mouse para o canvas
  const getCanvasCoordinates = (e: React.PointerEvent | React.MouseEvent | any): { x: number, y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    try {
        const rect = canvas.getBoundingClientRect();

        // Posição do mouse relativa ao elemento canvas (em pixels de CSS)
        const mouseX = (e.clientX || 0) - rect.left;
        const mouseY = (e.clientY || 0) - rect.top;

        // O tamanho real do canvas na tela (pode ser esticado pelo CSS)
        const displayWidth = rect.width;
        const displayHeight = rect.height;

        // A resolução interna do canvas (o buffer de desenho)
        const bufferWidth = canvas.width / (dprRef.current || 1);
        const bufferHeight = canvas.height / (dprRef.current || 1);
        
        // Corrige a posição do mouse com base na proporção entre o tamanho de exibição e a resolução interna.
        // Isso anula qualquer distorção causada pelo CSS.
        const correctedX = mouseX * (bufferWidth / displayWidth);
        const correctedY = mouseY * (bufferHeight / displayHeight);

        const scale = scaleRef.current || 1;
        const pan = panRef.current || { x: 0, y: 0 };

        // Aplica o inverso do pan e do zoom para obter as coordenadas do "mundo" do canvas
        const worldX = (correctedX - pan.x) / scale;
        const worldY = (correctedY - pan.y) / scale;

        // debug logging disabled

        return { x: worldX, y: worldY };
    } catch (err) {
        console.error("Falha ao calcular coordenadas do canvas:", err);
        return { x: 0, y: 0 };
    }
  };

  const colors = COLOR_PALETTES[mode];
  const handleColorChange = (newColor: string) => {
    try {
      setColor(newColor);
      // if there's an active drawing layer, update its context strokeStyle so changes take effect immediately
      if (selectedLayer) {
        const layer = layers.find(l => l.id === selectedLayer);
        if (layer && layer.type === 'drawing' && layer.drawingCanvas) {
          const ctx = layer.drawingCanvas.getContext('2d');
          if (ctx) {
            if (censorMode) ctx.strokeStyle = '#000000'; else ctx.strokeStyle = newColor;
            // shadow settings
            if (!censorMode) {
              ctx.shadowColor = mode === 'filter' ? 'rgba(255,255,255,0.9)' : newColor;
            }
          }
        }
      }
    } catch (e) { /* handleColorChange error suppressed */ }
  };
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
        if (l.mask) {
          try { copy.maskData = (l.mask as HTMLCanvasElement).toDataURL(); } catch (e) { copy.maskData = null; }
        }
        // handle group children recursively
        if ((l as any).childrenData && Array.isArray((l as any).childrenData)) {
          copy.childrenData = (l as any).childrenData.map((c: Layer) => serializeLayer(c));
        }
        delete copy.cachedCanvas;
        return copy;
      };
      const layersCopy = layers.map(l => serializeLayer(l));
      return { layers: layersCopy };
    } catch (e) { return { layers: [] }; }
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
          if (src.maskData) {
            try {
              const mc = document.createElement('canvas');
              mc.width = Math.round(cssW * dpr);
              mc.height = Math.round(cssH * dpr);
              const mctx = mc.getContext('2d');
              if (mctx) mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
              const mimg = new Image();
              mimg.onload = () => { try { mctx?.drawImage(mimg, 0, 0); redrawAll(); } catch (e) {} };
              mimg.src = src.maskData;
              base.mask = mc;
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
      // no global offscreen drawing to restore; drawings are stored per-layer
      redrawAll();
    } catch (e) {}
  };

    // Pan / zoom refs & handlers
    const isPanningRef = useRef(false);
    const panStartRef = useRef<{x:number,y:number}|null>(null);

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // require Ctrl/Cmd for zoom to avoid hijacking scroll
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const prevScale = scaleRef.current || 1;
      const delta = -e.deltaY;
      const factor = Math.exp(delta * 0.001);
      const newScale = Math.min(4, Math.max(0.2, prevScale * factor));

      // map mouse position to world coordinates (before transform)
      const worldX = (mouseX - panRef.current.x) / prevScale;
      const worldY = (mouseY - panRef.current.y) / prevScale;

      // compute new pan so that world point stays under the cursor
      const newPanX = mouseX - worldX * newScale;
      const newPanY = mouseY - worldY * newScale;

      scaleRef.current = newScale;
      panRef.current.x = newPanX;
      panRef.current.y = newPanY;

      // ensure pan stays within visible image bounds
      clampPan();
      redrawAll();
    };

    const handlePointerDownGeneric = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // debug: handlePointerDownGeneric
      try { if (typeof e.pointerId === 'number') pointerMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); } catch (err) {}
      // middle (1) or right (2) button -> start panning
      if (e.button === 1 || e.button === 2) {
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX, y: e.clientY };
        try { (e.target as Element).setPointerCapture?.(e.pointerId); activePointerIdRef.current = e.pointerId; } catch (err) {}
        return;
      }
      const handled = handleCanvasClick(e);
      // debug: handlePointerDownGeneric handled?
      if (!handled && (tool === 'draw' || tool === 'erase')) startDrawing(e);
    };

    const handlePointerMoveGeneric = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Store latest coords as plain object (React synthetic events are pooled)
      latestMoveRef.current = { clientX: e.clientX, clientY: e.clientY, pointerId: (e as any).pointerId, buttons: (e as any).buttons };

      // Lightweight logging — keep frequency low to avoid console spam
      if (isPanningRef.current) {
        // debug: panning scheduled
      } else {
        // debug: move scheduled
      }

      // If a processing RAF is already scheduled, we'll let it pick up the latestMoveRef
      if (moveScheduledRef.current) return;
      moveScheduledRef.current = true;

      requestAnimationFrame(() => {
        moveScheduledRef.current = false;
        const m = latestMoveRef.current;
        if (!m) return;

        // Process panning immediately with the latest coordinates
        if (isPanningRef.current && panStartRef.current) {
          const dx = m.clientX - panStartRef.current.x;
          const dy = m.clientY - panStartRef.current.y;
          panStartRef.current = { x: m.clientX, y: m.clientY };
          panRef.current.x += dx;
          panRef.current.y += dy;
          clampPan();
          redrawAll();
          return;
        }
        // update mask cursor overlay when editing a mask
        try {
          const activeLayer = selectedLayer ? layers.find(l => l.id === selectedLayer) : null;
          if (activeLayer && activeLayer.isEditingMask) {
            // convert client coords to CSS coords relative to canvas container
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              setMaskCursor({ x: m.clientX - rect.left, y: m.clientY - rect.top, visible: true });
            }
          } else {
            if (maskCursor.visible) setMaskCursor(prev => ({ ...prev, visible: false }));
          }
        } catch (e) {}

        // Not panning — forward a plain object to draw which expects minimal mouse fields
        draw({ clientX: m.clientX, clientY: m.clientY, pointerId: m.pointerId, buttons: m.buttons });
      });
    };

    const handlePointerUpGeneric = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // debug: handlePointerUpGeneric
      try { if (typeof e.pointerId === 'number') pointerMapRef.current.delete(e.pointerId); } catch (err) {}
      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartRef.current = null;
        try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch (err) {}
        return;
      }
      stopDrawing();
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

  // Shortcuts for brush/mask quick actions (x toggles eraser, [/] adjust brush, b toggles mask paint mode)
  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (ev.key === 'x') {
        ev.preventDefault();
        setMaskUseEraser(prev => !prev);
      } else if (ev.key === '[') {
        ev.preventDefault();
        setBrushSize(s => Math.max(1, (s || 1) - 1));
      } else if (ev.key === ']') {
        ev.preventDefault();
        setBrushSize(s => Math.min(500, (s || 1) + 1));
      } else if (ev.key.toLowerCase() === 'b') {
        ev.preventDefault();
        setMaskPaintMode(m => m === 'hide' ? 'reveal' : 'hide');
      } else if (ev.key.toLowerCase() === 'm') {
        // toggle mask edit for selected layer
        ev.preventDefault();
        if (selectedLayer) try { toggleEditMask(selectedLayer); } catch (e) {}
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedLayer]);

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
    try { console.debug('UVEditor: useEffect start', { baseImageUrl, initialImageFile }); } catch (e) {}
    // Try loading with CORS first, then retry without crossOrigin on failure
    let img: HTMLImageElement = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImageUrl;
    img.onload = () => {
      try { console.debug('UVEditor: base image loaded', { src: baseImageUrl, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }); } catch (e) {}
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
      // offscreen drawing canvas removed: drawings are stored in per-layer canvases
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
            // prepare preview for the new layer
            let previewData: string | undefined = undefined;
            try {
              const thumbW = 64;
              const thumbH = Math.max(1, Math.round((img2.naturalHeight || img2.height || 100) * (thumbW / naturalW)));
              const tc = document.createElement('canvas');
              tc.width = thumbW;
              tc.height = thumbH;
              const tctx = tc.getContext('2d');
              if (tctx) tctx.drawImage(img2, 0, 0, tc.width, tc.height);
              previewData = tc.toDataURL();
            } catch (e) {}

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
            , preview: previewData }]);
            setSelectedLayer(id);
            redrawAll();
            try { setTimeout(() => pushHistory(), 0); } catch (e) {}
            try { console.debug('UVEditor: initialImageFile layer added', { id, src: img2.src, naturalWidth: img2.naturalWidth, naturalHeight: img2.naturalHeight }); } catch(e) {}
          } catch (e) {
            // ignore
          }
        };
        img2.onerror = () => { try { console.error('UVEditor: failed to load initialImageFile', { src: url }); } catch(e) {} };
        // cleanup object url when component unmounts
        const cleanup = () => { try { URL.revokeObjectURL(url); } catch (e) {};
          const idx = objectUrlsRef.current.indexOf(url); if (idx >= 0) objectUrlsRef.current.splice(idx, 1);
        };
        // schedule cleanup on unmount
        (canvas as any).__initialImageCleanup = cleanup;
      }
    img.onerror = () => {
      try { console.warn('UVEditor: base image load with crossOrigin failed, retrying without crossOrigin', { src: baseImageUrl }); } catch (e) {}
      // Retry without crossOrigin in case remote server doesn't permit anonymous CORS
      const img2 = new Image();
      img2.onload = img.onload;
      img2.onerror = () => { try { console.error('UVEditor: failed to load baseImageUrl', { src: baseImageUrl }); } catch(e) {} };
      img = img2;
      try { img.src = baseImageUrl; } catch (e) { try { console.error('UVEditor: setting retry src failed', e); } catch (e2) {} }
    };
      // Ensure base image is available as a locked background layer so it's always rendered
        try {
          const bgScale = Math.min(1, cssWidth / (img.naturalWidth || img.width || cssWidth), cssHeight / (img.naturalHeight || img.height || cssHeight));
        setLayers(prev => {
          const exists = prev.some(l => l.id === '__base_image');
          if (exists) { try { console.debug('UVEditor: __base_image already exists, skipping add'); } catch(e) {} return prev; }
          const baseLayer: Layer = {
            id: '__base_image',
            type: 'image',
            name: 'Background',
            visible: true,
            opacity: 100,
            locked: true,
            x: (cssWidthRef.current || cssWidth) / 2,
            y: (cssHeightRef.current || cssHeight) / 2,
            img: img,
            scale: bgScale,
          };
          try { console.debug('UVEditor: adding __base_image layer', { src: (img && (img as any).src) || null, bgScale }); } catch(e) {}
          // generate a small preview dataURL for layer thumbnails
          try {
            const thumbW = 64;
            const thumbH = Math.round((img.naturalHeight || img.height || cssHeight) * (thumbW / (img.naturalWidth || img.width || cssWidth)));
            const c = document.createElement('canvas');
            c.width = thumbW;
            c.height = Math.max(1, thumbH);
            const ctx = c.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, c.width, c.height);
              (baseLayer as any).preview = c.toDataURL();
            }
          } catch (e) {}
          return [baseLayer, ...prev];
        });
      } catch (e) {}
    };
    return () => {
      // revoke any initial image url
      const cleanup = (canvasRef.current as any)?.__initialImageCleanup;
      if (cleanup && typeof cleanup === 'function') cleanup();
    };
  }, [baseImageUrl, initialImageFile]);

  // redraw main canvas from layers (simplified, direct draw)
  const redrawAll = () => {
    if (redrawScheduledRef.current) return;
    try { console.debug('redrawAll requested', { layersCount: layers.length, pendingRAF: redrawScheduledRef.current }); } catch (e) {}
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

    redrawScheduledRef.current = true;
    redrawRafIdRef.current = requestAnimationFrame(() => {
      redrawScheduledRef.current = false;
      redrawRafIdRef.current = null;

      const canvas = canvasRef.current;
      if (!canvas) {
        try { console.warn('redrawAll: no canvasRef'); } catch (e) {}
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        const hasBase = layers.some(l => l.id === '__base_image');
        if (!hasBase) console.warn('redrawAll: no __base_image layer present');
      } catch (e) {}

      const clearW = cssWidthRef.current || (canvas.width / (dprRef.current || 1));
      const clearH = cssHeightRef.current || (canvas.height / (dprRef.current || 1));

      // 1. Apply DPR baseline, clear, then apply pan & zoom to canvas context (not DOM)
      try {
        const dpr = dprRef.current || 1;
        const zoom = scaleRef.current || 1;
        const p = panRef.current || { x: 0, y: 0 };
        // reset transform to DPR baseline so coordinates are in CSS pixels
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // clear full CSS-area
        ctx.clearRect(0, 0, clearW, clearH);
        // apply pan & zoom in CSS-pixel space
        ctx.translate(p.x, p.y);
        ctx.scale(zoom, zoom);
      } catch (e) {}

      // 3. Draw layers from bottom to top
      const mapBlendOp = (mode?: string) => {
        switch ((mode || '').toLowerCase()) {
          case 'multiply': return 'multiply';
          case 'screen': return 'screen';
          case 'overlay': return 'overlay';
          case 'add': return 'lighter';
          case 'darken': return 'darken';
          case 'lighten': return 'lighten';
          default: return 'source-over';
        }
      };

      for (const layer of layers) {
        if (!layer.visible) continue;

        // if layer has a mask, draw into an offscreen canvas, apply the mask, then composite
        const useMask = !!layer.mask;

        if (useMask) {
          try {
            // temp canvas in buffer pixels
            const temp = document.createElement('canvas');
            temp.width = canvas.width;
            temp.height = canvas.height;
            const tctx = temp.getContext('2d');
            if (!tctx) continue;
            // set same DPR baseline on temp
            tctx.setTransform(dprRef.current || 1, 0, 0, dprRef.current || 1, 0, 0);
            // apply pan & zoom so drawing aligns
            const s = scaleRef.current || 1;
            const p = panRef.current || { x: 0, y: 0 };
            tctx.translate(p.x, p.y);
            tctx.scale(s, s);

            // draw layer into temp context
            tctx.save();
            tctx.globalAlpha = (layer.opacity || 100) / 100;
            const drawInto = (ctxToDraw: CanvasRenderingContext2D) => {
              switch (layer.type) {
                case 'image':
                  if (layer.img && layer.img.complete) {
                    const w = (layer.img.naturalWidth || layer.img.width) * (layer.scale || 1);
                    const h = (layer.img.naturalHeight || layer.img.height) * (layer.scale || 1);
                    ctxToDraw.drawImage(layer.img, (layer.x || 0) - w / 2, (layer.y || 0) - h / 2, w, h);
                  }
                  break;
                case 'text':
                  if (layer.text) {
                    ctxToDraw.fillStyle = layer.color || color;
                    ctxToDraw.font = `${Math.max(8, layer.size || textSize)}px serif`;
                    ctxToDraw.textBaseline = 'top';
                    ctxToDraw.fillText(layer.text || '', layer.x || 0, layer.y || 0);
                  }
                  break;
                case 'drawing':
                  if (layer.drawingCanvas) {
                    ctxToDraw.drawImage(layer.drawingCanvas, 0, 0);
                  }
                  break;
                case 'group':
                  if (layer.childrenData && Array.isArray(layer.childrenData)) {
                    const gx = layer.x || 0;
                    const gy = layer.y || 0;
                    const gscale = layer.scale || 1;
                    ctxToDraw.save();
                    ctxToDraw.translate(gx, gy);
                    ctxToDraw.scale(gscale, gscale);
                    for (const child of layer.childrenData) {
                      try {
                        ctxToDraw.save();
                        ctxToDraw.globalAlpha = (child.opacity || 100) / 100;
                        if (child.type === 'text') {
                          ctxToDraw.fillStyle = child.color || color;
                          ctxToDraw.font = `${Math.max(8, child.size || textSize)}px serif`;
                          ctxToDraw.textBaseline = 'top';
                          ctxToDraw.fillText(child.text || '', child.x || 0, child.y || 0);
                        } else if (child.type === 'image' && child.img) {
                          const w = child.img.naturalWidth * (child.scale || 1);
                          const h = child.img.naturalHeight * (child.scale || 1);
                          ctxToDraw.drawImage(child.img, (child.x || 0) - w / 2, (child.y || 0) - h / 2, w, h);
                        } else if (child.type === 'drawing' && child.drawingCanvas) {
                          ctxToDraw.drawImage(child.drawingCanvas, 0, 0);
                        }
                        ctxToDraw.restore();
                      } catch (e) {}
                    }
                    ctxToDraw.restore();
                  }
                  break;
              }
            };

            drawInto(tctx);
            tctx.restore();

            // apply mask: keep only parts where mask is white/opaque
            try {
              tctx.globalCompositeOperation = 'destination-in';
              // draw mask stretched to temp canvas
              tctx.drawImage(layer.mask as HTMLCanvasElement, 0, 0, temp.width / (dprRef.current || 1), temp.height / (dprRef.current || 1));
              tctx.globalCompositeOperation = 'source-over';
            } catch (e) {}

            // Composite temp onto main ctx with blend mode
            try {
              ctx.save();
              ctx.globalAlpha = 1; // already applied in temp
              ctx.globalCompositeOperation = mapBlendOp(layer.blendMode);
              // draw temp canvas into main (temp is in buffer pixels)
              ctx.drawImage(temp, 0, 0, temp.width / (dprRef.current || 1), temp.height / (dprRef.current || 1));
              ctx.restore();
            } catch (e) {
              console.error('redrawAll: composite masked layer failed', e);
            }
          } catch (e) {
            console.error('redrawAll: failed applying mask for layer', layer.id, e);
          }
          continue; // next layer
        }

        // No mask: draw directly with blend mode
        ctx.save();
        ctx.globalAlpha = (layer.opacity || 100) / 100;
        ctx.globalCompositeOperation = mapBlendOp(layer.blendMode);
        switch (layer.type) {
          case 'image':
            if (layer.img) {
              try {
                if (!layer.img.complete || ((layer.img as any).naturalWidth || 0) === 0) {
                  console.warn('redrawAll: image layer not ready for drawing (skipping)', { id: layer.id, src: (layer.img && (layer.img as any).src) || null });
                  break;
                }
                const w = (layer.img.naturalWidth || layer.img.width) * (layer.scale || 1);
                const h = (layer.img.naturalHeight || layer.img.height) * (layer.scale || 1);
                ctx.drawImage(layer.img, (layer.x || 0) - w / 2, (layer.y || 0) - h / 2, w, h);
              } catch (err) {
                console.error('redrawAll: error drawing image layer', { id: layer.id, err });
              }
            }
            break;
          case 'text':
            if (layer.text) {
              ctx.fillStyle = layer.color || color;
              ctx.font = `${Math.max(8, layer.size || textSize)}px serif`;
              ctx.textBaseline = 'top';
              ctx.fillText(layer.text || '', layer.x || 0, layer.y || 0);
            }
            break;
          case 'drawing':
            if (layer.drawingCanvas) {
              ctx.drawImage(layer.drawingCanvas, 0, 0);
            }
            break;
          case 'group':
            if (layer.childrenData && Array.isArray(layer.childrenData)) {
              // apply group's blend mode to its children composite
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
                    ctx.drawImage(child.img, (child.x || 0) - w / 2, (child.y || 0) - h / 2, w, h);
                  } else if (child.type === 'drawing' && child.drawingCanvas) {
                    ctx.drawImage(child.drawingCanvas, 0, 0);
                  }
                  ctx.restore();
                } catch (e) {}
              }
              ctx.restore();
            }
            break;
        }
        // reset composite op
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
      }

      // 3.5 Draw mask outside base image to visually indicate non-interactive area
      try {
        const ib = getImageBounds();
        if (ib) {
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';

          ctx.beginPath();
          // Path for the outer rectangle (the full canvas)
          ctx.rect(0, 0, clearW, clearH);
          // Path for the inner rectangle (the image)
          ctx.rect(ib.left, ib.top, ib.width, ib.height);

          // Fill using the 'evenodd' rule, which fills the space between the two rectangles
          // without affecting the content inside the inner rectangle.
          // Note: pass the fill rule string to `fill` for broad browser support.
          (ctx as any).fill('evenodd');

          // Draw a subtle border around the image area
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 2;
          ctx.strokeRect(ib.left + 1, ib.top + 1, ib.width - 2, ib.height - 2);
          ctx.restore();
        }
      } catch (e) {
        console.error("Error drawing image bounds mask:", e);
      }

      // 4. Draw selection and handles (NOVA VERSÃO COM ROTAÇÃO)
      if (selectedLayer) {
        const s = layers.find(l => l.id === selectedLayer);
        if (s && (s.type === 'image' || s.type === 'text')) {
          ctx.save(); // Salva o estado do contexto (antes de qualquer transformação)

          // Calcula os limites (bounds) da camada em seu estado não rotacionado
          let bounds = { x: 0, y: 0, w: 0, h: 0 };
          if (s.type === 'image' && s.img) {
            const w = s.img.naturalWidth * (s.scale || 1);
            const h = s.img.naturalHeight * (s.scale || 1);
            bounds = { x: (s.x || 0) - w / 2, y: (s.y || 0) - h / 2, w, h };
          } else if (s.type === 'text') {
            ctx.font = `${Math.max(8, s.size || textSize)}px serif`;
            const measure = ctx.measureText(s.text || '');
            const w = measure.width;
            const h = (s.size || textSize) * 1.2; // Aproximação da altura
            bounds = { x: s.x || 0, y: s.y || 0, w, h };
          }

          const layerCenterX = bounds.x + bounds.w / 2;
          const layerCenterY = bounds.y + bounds.h / 2;
          const rotation = s.rotation || 0;

          // Aplica a rotação ao redor do centro da camada
          ctx.translate(layerCenterX, layerCenterY);
          ctx.rotate(rotation);
          ctx.translate(-layerCenterX, -layerCenterY);

          // Desenha a caixa de seleção pontilhada
          ctx.strokeStyle = '#00ffff';
          ctx.setLineDash([6, 4]);
          // make stroke and handles constant screen-size regardless of zoom
          const screenHandleSize = 10; // px on screen
          const handleSizeWorld = Math.max(2, screenHandleSize / (scaleRef.current || 1));
          const strokeWidthWorld = Math.max(0.5, 2 / (scaleRef.current || 1));
          ctx.lineWidth = strokeWidthWorld;
          ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

          // Desenha os manipuladores (handles)
          ctx.fillStyle = '#00ffff';
          ctx.strokeStyle = '#ffffff';
          ctx.setLineDash([]);
          ctx.lineWidth = strokeWidthWorld;

          // Manipuladores de redimensionamento nos cantos
          const handles = {
            nw: { x: bounds.x, y: bounds.y },
            ne: { x: bounds.x + bounds.w, y: bounds.y },
            sw: { x: bounds.x, y: bounds.y + bounds.h },
            se: { x: bounds.x + bounds.w, y: bounds.y + bounds.h },
          };
          
          Object.values(handles).forEach(handle => {
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, Math.max(2, handleSizeWorld / 2), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });

          // NOVO: Manipulador de Rotação
          const rotationHandle = { x: bounds.x + bounds.w / 2, y: bounds.y - 25 };
          ctx.beginPath();
          ctx.moveTo(bounds.x + bounds.w / 2, bounds.y);
          ctx.lineTo(rotationHandle.x, rotationHandle.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(rotationHandle.x, rotationHandle.y, Math.max(2, handleSizeWorld / 2), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.restore(); // Restaura o contexto para o estado sem rotação
        }
      }

      // brush preview cursor: draw after handles so it isn't painted into layers
      try {
        if ((tool === 'draw' || tool === 'erase') && lastMouseEventRef.current) {
          const pos = getCanvasCoordinates(lastMouseEventRef.current);
          if (pos) {
            ctx.save();
            // preview fill and stroke
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.strokeStyle = 'rgba(0,0,0,0.45)';
            ctx.lineWidth = Math.max(1, 1 / (scaleRef.current || 1));
            const r = (brushSize || 8) / 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }
      } catch (e) {}

      try { lastRedrawRef.current = performance.now(); } catch(e) { lastRedrawRef.current = Date.now(); }
    });
  };

  useEffect(() => {
    if (!imageFile) return;
    const img = new Image();
    // For blob/object URLs we don't need crossOrigin; setting it can sometimes interfere in some browsers
    try { img.crossOrigin = 'anonymous'; } catch (e) {}
    const url = URL.createObjectURL(imageFile);
    objectUrlsRef.current.push(url);
    img.src = url;
    img.onload = () => {
      try { console.debug('UVEditor: imageFile loaded', { name: imageFile.name, src: img.src, w: img.naturalWidth, h: img.naturalHeight }); } catch (e) {}
      setImageEl(img);
      try { setTool('placeImage'); } catch (e) {}
    };
    img.onerror = (err) => {
      console.warn('UVEditor: image load error with objectURL, falling back to FileReader', err);
      // fallback: use FileReader to read as dataURL
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          img.src = dataUrl;
        };
        reader.onerror = (rerr) => { console.error('UVEditor: FileReader error', rerr); };
        reader.readAsDataURL(imageFile);
      } catch (e) { console.error('UVEditor: fallback FileReader failed', e); }
    };
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
      // offscreen drawing removed; no global offscreen to clean
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

  

  const startDrawing = (e: React.PointerEvent | React.MouseEvent | any) => {
    // startDrawing invoked
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    if (tool !== 'draw' && tool !== 'erase') { return; }

    // Allow painting if selected layer is a drawing layer OR if user is editing the mask of a layer
    if (selectedLayer) {
      const activeLayer = layers.find(l => l.id === selectedLayer);
        if (activeLayer && activeLayer.type !== 'drawing' && !activeLayer.isEditingMask) {
        return;
      }
    }

    // A lógica inteligente começa aqui
    let targetCanvas: HTMLCanvasElement | null = null;
    const activeLayer = layers.find(l => l.id === selectedLayer);

    // Caso 1: Uma camada de desenho válida já está selecionada. Usaremos ela.
    if (activeLayer && activeLayer.type === 'drawing' && activeLayer.drawingCanvas) {
      targetCanvas = activeLayer.drawingCanvas;
    }
    // Caso especial: Se o usuário está editando a máscara desta camada, desenhamos na máscara
    else if (activeLayer && activeLayer.isEditingMask) {
      // ensure mask exists and matches canvas size
      const cssW = cssWidthRef.current || (canvas.width / (dprRef.current || 1));
      const cssH = cssHeightRef.current || (canvas.height / (dprRef.current || 1));
      if (!activeLayer.mask) {
        const m = document.createElement('canvas');
        m.width = Math.round(cssW * (dprRef.current || 1));
        m.height = Math.round(cssH * (dprRef.current || 1));
        const mctx = m.getContext('2d');
        if (mctx) {
          mctx.setTransform(dprRef.current || 1, 0, 0, dprRef.current || 1, 0, 0);
          // default mask: fully white (revealed)
          mctx.fillStyle = '#ffffff';
          mctx.fillRect(0, 0, m.width / (dprRef.current || 1), m.height / (dprRef.current || 1));
        }
        // attach mask to layer
        setLayers(prev => prev.map(l => l.id === activeLayer.id ? { ...l, mask: m } : l));
        activeLayer.mask = m; // update local reference
        try { setTimeout(() => pushHistory(), 0); } catch (e) {}
      }
      targetCanvas = activeLayer.mask || null;
    }
    // Caso 2: Nenhuma camada ou uma camada não-desenhável está selecionada.
    // Vamos criar uma nova camada de desenho no topo e usá-la.
    else {
      // creating a new drawing layer
      const id = `layer-${Date.now()}`;
      
      const newDrawingCanvas = document.createElement('canvas');
      const cssW = cssWidthRef.current || (canvas.width / (dprRef.current || 1));
      const cssH = cssHeightRef.current || (canvas.height / (dprRef.current || 1));
      newDrawingCanvas.width = Math.round(cssW * (dprRef.current || 1));
      newDrawingCanvas.height = Math.round(cssH * (dprRef.current || 1));
      const drawCtx = newDrawingCanvas.getContext('2d');
      if (drawCtx) drawCtx.setTransform(dprRef.current || 1, 0, 0, dprRef.current || 1, 0, 0);
      
      const newLayer: Layer = { 
        id, 
        type: 'drawing',
        name: 'Desenho ' + (layers.filter(l => l.type === 'drawing').length + 1),
        visible: true,
        opacity: 100,
        locked: false,
        drawingCanvas: newDrawingCanvas,
        x: 0,
        y: 0
      };

      // Adiciona a nova camada ao topo (final do array) e a seleciona
      setLayers(prev => [...prev, newLayer]);
      setSelectedLayer(id);
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
      
      // Define o canvas recém-criado como o alvo para o desenho atual
      targetCanvas = newDrawingCanvas;
    }
    
    // O restante da função continua como antes, mas usando o targetCanvas definido
    if (!targetCanvas) return;
    const octx = targetCanvas.getContext('2d');
    if (!octx) { return; }
    const { x, y } = getCanvasCoordinates(e);
    // Prevent starting a stroke outside the base image bounds
    try {
      const ib = getImageBounds();
      if (ib) {
          if (x < ib.left || x > ib.right || y < ib.top || y > ib.bottom) {
          return;
        }
      }
    } catch (e) {}
    
    // initialize smoothing state and target reference
    strokeStartRef.current = { x, y };
    strokePointsRef.current = [{ x, y }];
    drawingTargetCanvasRef.current = targetCanvas;
    drawingMaskRef.current = !!(activeLayer && activeLayer.isEditingMask);
    octx.beginPath();
    octx.moveTo(x, y);
    octx.lineCap = 'round';
    octx.lineJoin = 'round';
    octx.lineWidth = brushSize;
    if (activeLayer && activeLayer.isEditingMask) {
      // painting mask: draw black to hide, white to reveal
      const paintHide = maskPaintMode === 'hide';
      // if user used eraser tool, invert the paint behavior
      const colorForMask = tool === 'erase' ? (paintHide ? '#ffffff' : '#000000') : (paintHide ? '#000000' : '#ffffff');
      octx.globalCompositeOperation = 'source-over';
      octx.shadowBlur = 0;
      octx.strokeStyle = colorForMask;
      octx.lineWidth = brushSize;
    } else {
      if (tool === 'erase') {
        octx.globalCompositeOperation = 'destination-out';
        octx.shadowBlur = 0;
      } else {
        octx.globalCompositeOperation = 'source-over';
        if (censorMode) {
          octx.strokeStyle = '#000000';
          octx.shadowBlur = 0;
        } else {
          octx.strokeStyle = color;
          octx.shadowColor = mode === 'filter' ? 'rgba(255,255,255,0.9)' : color;
          octx.shadowBlur = mode === 'filter' ? 8 : 15;
        }
      }
    }
    setIsDrawing(true);
    try {
      if (typeof (e.pointerId) === 'number') {
        canvas.setPointerCapture?.(e.pointerId);
        activePointerIdRef.current = e.pointerId;
      }
    } catch (err) {}
    redrawAll();
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent | React.PointerEvent) => {
    // convert to world coords and find topmost text layer under cursor
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoordinates(e as any);
    const x = coords.x, y = coords.y;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue;
      if (layer.locked) continue;
      if (layer.type === 'text') {
        const ctx = getCtx();
        if (!ctx) continue;
        ctx.font = `${Math.max(8, layer.size || textSize)}px serif`;
        const measure = ctx.measureText(layer.text || '');
        const w = measure.width;
        const h = (layer.size || textSize) * 1.2;
        const left = layer.x || 0;
        const top = layer.y || 0;
        if (x >= left && x <= left + w && y >= top && y <= top + h) {
          // compute CSS pixel position for overlay
          const s = scaleRef.current || 1;
          const p = panRef.current || { x: 0, y: 0 };
          const cssX = (layer.x || 0) * s + p.x;
          const cssY = (layer.y || 0) * s + p.y;
          const fontSize = (layer.size || textSize) * s;
          setInlineTextEdit({ id: layer.id, value: layer.text || '', cssX, cssY, fontSize });
          // focus will be handled by the rendered input via useEffect
          return;
        }
      }
    }
  };

  const handleCanvasClick = (e: React.PointerEvent | React.MouseEvent | any): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = getCtx();
    if (!ctx) return false;
    const { x, y } = getCanvasCoordinates(e);
    // Do not allow interactions outside the base image
    try {
      const ib = getImageBounds();
      if (ib) {
        if (x < ib.left || x > ib.right || y < ib.top || y > ib.bottom) {
          setSelectedLayer(null);
          return false;
        }
      }
    } catch (err) {}
    
    // If user is in placement mode, prioritize placing the new item even if clicking over existing layers
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
      // placing new text layer
      setLayers(prev => [...prev, newLayer]);
      setTool('draw');
      setTextValue('');
      redrawAll();
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
      return true;
    }
    if ((tool as any) === 'placeImage') {
      if (!imageEl) {
        try { console.warn('handleCanvasClick: placeImage requested but imageEl is null (still loading?)'); } catch (e) {}
        // Consume the click so drawing doesn't start while waiting for the image
        return true;
      }
      if (!(imageEl.complete) || ((imageEl as any).naturalWidth || 0) === 0) {
        try { console.warn('handleCanvasClick: placeImage requested but imageEl not fully loaded yet', { src: (imageEl as any).src }); } catch (e) {}
        return true;
      }
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
      // placing new image layer
      setLayers(prev => [...prev, newLayer]);
      setTool('draw');
      setImageFile(null);
      setImageEl(null);
      redrawAll();
      return true;
    }

    // Check if clicking on resize/rotation handle of selected layer (rotation-aware)
    if (selectedLayer) {
      const s = layers.find(l => l.id === selectedLayer);
      if (s) {
        if (s.locked) return false;
        let bounds = { x: 0, y: 0, w: 0, h: 0 };
        if (s.type === 'image' && s.img) {
          const w = s.img.naturalWidth * (s.scale || 1);
          const h = s.img.naturalHeight * (s.scale || 1);
          bounds = { x: s.x - w / 2, y: s.y - h / 2, w, h };
        } else if (s.type === 'text') {
          ctx.font = `${Math.max(8, s.size || textSize)}px serif`;
          const measure = ctx.measureText(s.text || '');
          const w = measure.width;
          const h = (s.size || textSize) * 1.2;
          bounds = { x: s.x, y: s.y, w, h };
        } else if (s.type === 'group' && s.childrenData && Array.isArray(s.childrenData)) {
          // fallback to previous group bbox calculation
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

        // Transform mouse into layer-local coordinates to account for rotation
        const rotation = s.rotation || 0;
        const layerCenterX = bounds.x + bounds.w / 2;
        const layerCenterY = bounds.y + bounds.h / 2;
        const dx = x - layerCenterX;
        const dy = y - layerCenterY;
        const cosR = Math.cos(-rotation);
        const sinR = Math.sin(-rotation);
        const localMouseX = layerCenterX + (dx * cosR - dy * sinR);
        const localMouseY = layerCenterY + (dx * sinR + dy * cosR);

        const handleSize = 14;

        // Check rotation handle (above the top-center)
        const rotationHandlePos = { x: bounds.x + bounds.w / 2, y: bounds.y - 25 };
        if (Math.hypot(localMouseX - rotationHandlePos.x, localMouseY - rotationHandlePos.y) <= handleSize) {
          setIsRotating(true);
          try { (e.target as Element).setPointerCapture?.(e.pointerId); activePointerIdRef.current = e.pointerId; } catch (err) {}
          return true;
        }

        // Check resize handles in local space
        const handles = [
          { x: bounds.x, y: bounds.y, pos: 'nw' },
          { x: bounds.x + bounds.w, y: bounds.y, pos: 'ne' },
          { x: bounds.x, y: bounds.y + bounds.h, pos: 'sw' },
          { x: bounds.x + bounds.w, y: bounds.y + bounds.h, pos: 'se' },
        ];

        for (const handle of handles) {
          const dist = Math.hypot(localMouseX - handle.x, localMouseY - handle.y);
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
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              for (const child of s.childrenData) {
                try {
                  if (child.type === 'text') {
                    const measure = ctx.measureText(child.text || '');
                    const childW = measure.width;
                    const childH = (child.size || textSize) * 1.2;
                    const left = (child.x || 0);
                    const top = (child.y || 0) - childH / 2;
                    minX = Math.min(minX, left);
                    minY = Math.min(minY, top);
                    maxX = Math.max(maxX, left + childW);
                    maxY = Math.max(maxY, top + childH);
                  } else if (child.type === 'image' && child.img) {
                    const childW = child.img.naturalWidth * (child.scale || 1);
                    const childH = child.img.naturalHeight * (child.scale || 1);
                    const left = (child.x || 0) - childW / 2;
                    const top = (child.y || 0) - childH / 2;
                    minX = Math.min(minX, left);
                    minY = Math.min(minY, top);
                    maxX = Math.max(maxX, left + childW);
                    maxY = Math.max(maxY, top + childH);
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
            try { (e.target as Element).setPointerCapture?.(e.pointerId); activePointerIdRef.current = e.pointerId; } catch (err) {}
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
          // select image layer
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
          // select text layer
          setSelectedLayer(layer.id);
          dragOffsetRef.current = { ox: x - layer.x, oy: y - layer.y };
          setIsDraggingLayer(true);
          try { if (typeof e.pointerId === 'number') { const canvasEl = canvasRef.current; if (canvasEl) { (canvasEl as any).setPointerCapture?.(e.pointerId); activePointerIdRef.current = e.pointerId; } } } catch (err) {}
          return true;
        }
      } else if (layer.type === 'drawing' && layer.drawingCanvas) {
        // drawing layers typically cover the whole canvas; allow selecting/detecting them
        const cssW = cssWidthRef.current || (canvas.width / (dprRef.current || 1));
        const cssH = cssHeightRef.current || (canvas.height / (dprRef.current || 1));
        const left = layer.x || 0;
        const top = layer.y || 0;
        if (x >= left && x <= left + cssW && y >= top && y <= top + cssH) {
          // Perform alpha hit-test on drawing canvas for pixel-accurate selection
          try {
            const dpr = dprRef.current || 1;
            const px = Math.round(x * dpr);
            const py = Math.round(y * dpr);
            const dc = layer.drawingCanvas as HTMLCanvasElement;
            const dctx = dc.getContext('2d');
            if (dctx) {
              const data = dctx.getImageData(px, py, 1, 1).data;
              const alpha = data[3] || 0;
              if (alpha < 10) {
                // transparent pixel — do not select this layer, continue searching below
                continue;
              }
            }
          } catch (e) {
            // fallback to bounding-box selection on error
          }

          // select drawing layer
          setSelectedLayer(layer.id);
          dragOffsetRef.current = { ox: x - (layer.x || 0), oy: y - (layer.y || 0) };
          setIsDraggingLayer(true);
          try { if (typeof e.pointerId === 'number') { const canvasEl = canvasRef.current; if (canvasEl) { (canvasEl as any).setPointerCapture?.(e.pointerId); activePointerIdRef.current = e.pointerId; } } } catch (err) {}
          // If user is in draw/erase mode, start drawing immediately on this layer
          if (tool === 'draw' || tool === 'erase') {
            try {
              // start stroke directly on the existing drawing layer so erase/draw start immediately
              const targetCanvas = layer.drawingCanvas as HTMLCanvasElement | undefined;
              if (targetCanvas) {
                const octx = targetCanvas.getContext('2d');
                if (octx) {
                  const coords = getCanvasCoordinates(e);
                  octx.beginPath();
                  octx.moveTo(coords.x, coords.y);
                  octx.lineCap = 'round';
                  octx.lineJoin = 'round';
                  octx.lineWidth = brushSize;
                  if (tool === 'erase') {
                    octx.globalCompositeOperation = 'destination-out';
                    octx.shadowBlur = 0;
                  } else {
                    octx.globalCompositeOperation = 'source-over';
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
                  try { if (typeof e.pointerId === 'number') { const canvasEl = canvasRef.current; if (canvasEl) { (canvasEl as any).setPointerCapture?.(e.pointerId); activePointerIdRef.current = e.pointerId; } } } catch (err) {}
                  redrawAll();
                }
              }
            } catch (err) {}
          }
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
      // placing new text layer
      setLayers(prev => [...prev, newLayer]);
      setTool('draw');
      setTextValue('');
      redrawAll();
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
      return true;
    }

    if ((tool as any) === 'placeImage' && imageEl) {
      // if image is not yet fully loaded, wait for it and then place
      if (!(imageEl.complete && (imageEl as any).naturalWidth > 0)) {
        // image not complete yet, deferring placement
        const img = imageEl;
        const onload = () => {
          try {
            const id = `layer-${Date.now()}`;
            const scale = imageScale;
            const newLayer: Layer = {
              id,
              type: 'image',
              name: 'Imagem ' + (layers.filter(l => l.type === 'image').length + 1),
              visible: true,
              opacity: 100,
              locked: false,
              x,
              y,
              img: img,
              scale
            };
            setLayers(prev => [...prev, newLayer]);
            try { console.debug('handleCanvasClick: deferred image placed', { id, src: img.src }); } catch(e) {}
            redrawAll();
            try { setTimeout(() => pushHistory(), 0); } catch (e) {}
          } catch (e) {}
          img.removeEventListener('load', onload);
          img.removeEventListener('error', onerror);
        };
        const onerror = () => {
          try { console.error('handleCanvasClick: deferred image failed to load', { src: img.src }); } catch(e) {}
          img.removeEventListener('load', onload);
          img.removeEventListener('error', onerror);
        };
        img.addEventListener('load', onload);
        img.addEventListener('error', onerror);
        // keep tool in placeImage so user can click again if needed
        return true;
      }

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
      // placing new image layer
      setLayers(prev => [...prev, newLayer]);
      setTool('draw');
      setImageFile(null);
      setImageEl(null);
      redrawAll();
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
      return true;
    }
    // if clicked on empty space, clear selection and indicate we did not handle placement
    // clear selection
    setSelectedLayer(null);
    return false;
  };

  const draw = (e: React.PointerEvent | React.MouseEvent | any) => {
    // draw invoked
    // Salva o último evento de ponteiro/mouse
    lastMouseEventRef.current = e;
    
    // Se já tem um RAF agendado, não agenda outro
    if (rafIdRef.current !== null) { return; }
    
    // Agenda processamento no próximo frame
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      
      const mouseEvent = lastMouseEventRef.current;
      if (!mouseEvent) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = getCanvasCoordinates(mouseEvent);
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

          // rotation handle (above top-center)
          const rotationHandlePos = { x: bounds.x + bounds.w / 2, y: bounds.y - 25 };
          const rotDist = Math.hypot(x - rotationHandlePos.x, y - rotationHandlePos.y);
          const canvasEl = canvasRef.current;
          let cursorToSet = 'crosshair';
          if (rotDist <= hitRadius) {
            found = null; // prioritize rotation handle
            hoveredHandleRef.current = 'rotation';
            cursorToSet = 'grab';
          } else if (found) {
            hoveredHandleRef.current = found;
            if (found === 'nw' || found === 'se') cursorToSet = 'nwse-resize';
            else if (found === 'ne' || found === 'sw') cursorToSet = 'nesw-resize';
          } else {
            // if pointer is inside bounds, show move cursor
            if (x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h) {
              hoveredHandleRef.current = null;
              cursorToSet = 'move';
            } else {
              hoveredHandleRef.current = null;
              cursorToSet = 'crosshair';
            }
          }
          const prev = hoveredHandleRef.current;
          if (canvasEl) canvasEl.style.cursor = cursorToSet;
          if (prev !== hoveredHandleRef.current) redrawAll();
        }
      }
      
      // Handle resizing
      if (isResizing && selectedLayer && resizeHandle && resizeStartRef.current) {
        const s = layers.find(l => l.id === selectedLayer);
        if (s) {
          const startData = resizeStartRef.current;
          const shift = !!(lastMouseEventRef.current && lastMouseEventRef.current.shiftKey);

          if (s.type === 'image' && s.img) {
            // Calculate new scale based on handle movement
            const dxRaw = resizeHandle.includes('e') ? (x - startData.x) : (startData.x - x);
            const dyRaw = resizeHandle.includes('s') ? (y - startData.y) : (startData.y - y);
            let delta = Math.max(dxRaw, dyRaw);
            if (shift) {
              // keep aspect ratio: use the dominant absolute delta but preserve sign
              const sign = Math.sign(Math.abs(dxRaw) >= Math.abs(dyRaw) ? dxRaw : dyRaw) || 1;
              delta = sign * Math.max(Math.abs(dxRaw), Math.abs(dyRaw));
            }
            const newScale = Math.max(0.05, startData.scale + (delta / Math.max(1, s.img.naturalWidth)));

            setLayers(prev => prev.map(l => 
              l.id === selectedLayer ? { ...l, scale: newScale } : l
            ));
          } else if (s.type === 'text') {
            // For text, resize means changing font size
            const dxRaw = resizeHandle.includes('e') ? (x - startData.x) : (startData.x - x);
            const dyRaw = resizeHandle.includes('s') ? (y - startData.y) : (startData.y - y);
            let delta = Math.max(dxRaw, dyRaw);
            if (shift) {
              delta = Math.sign(Math.abs(dxRaw) >= Math.abs(dyRaw) ? dxRaw : dyRaw) * Math.max(Math.abs(dxRaw), Math.abs(dyRaw));
            }
            const newSize = Math.max(8, Math.min(400, startData.scale + delta / 2));

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
          }

          redrawAll();
        }
        return;
      }
      
      // Handle drawing
        if (isDrawing) {
        // Draw on the selected drawing layer or, if editing mask, on the mask canvas
        let targetCanvas: HTMLCanvasElement | null = null;
        if (selectedLayer) {
          const layer = layers.find(l => l.id === selectedLayer);
          if (layer) {
            if (layer.type === 'drawing' && layer.drawingCanvas) targetCanvas = layer.drawingCanvas;
            else if (layer.isEditingMask && layer.mask) targetCanvas = layer.mask;
          }
        }
        const off = targetCanvas;
        if (!off) { return; }
        const ctx = off.getContext('2d');
        if (!ctx) { return; }
        // Enforce image bounds while drawing. If pointer leaves image, stop the stroke.
        try {
          const ib = getImageBounds();
            if (ib) {
            if (x < ib.left || x > ib.right || y < ib.top || y > ib.bottom) {
              stopDrawing();
              return;
            }
          }
        } catch (e) {}

        // If we are drawing into a mask, use soft brush circles along the stroke
        if (drawingMaskRef.current) {
          try {
            const paintHide = maskPaintMode === 'hide';
            const colorForMask = maskUseEraser ? (paintHide ? '#ffffff' : '#000000') : (paintHide ? '#000000' : '#ffffff');
            const last = strokePointsRef.current[strokePointsRef.current.length - 1] || { x, y };
            drawSoftStroke(ctx, last.x, last.y, x, y, brushSize, colorForMask, maskBrushSoftness, maskBrushOpacity);
            strokePointsRef.current.push({ x, y });
            redrawAll();
            return;
          } catch (err) { /* draw mask error suppressed */ }
        }

        // Otherwise, normal path-based stroke for drawing layers
        try {
          ctx.lineTo(x, y);
        } catch (e) {
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        redrawAll();
        return;
      }
    });
  };

  const stopDrawing = () => {
    // stopDrawing invoked
    if (!isDrawing) { return; }
    // Determine the target canvas (drawing layer or mask) and finish the stroke.
    const targetCanvas = drawingTargetCanvasRef.current || (selectedLayer ? (layers.find(l => l.id === selectedLayer && l.type === 'drawing')?.drawingCanvas || (layers.find(l => l.id === selectedLayer)?.mask || null)) : null);
    const ctx = targetCanvas?.getContext('2d') || null;
    if (ctx) {
      // finishing path on target canvas
      const shift = !!(lastMouseEventRef.current && lastMouseEventRef.current.shiftKey);
      if (shift && strokeStartRef.current && lastMouseEventRef.current) {
        try {
          const start = strokeStartRef.current;
          const end = getCanvasCoordinates(lastMouseEventRef.current);
          ctx.beginPath();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = brushSize;
          if (tool === 'erase') ctx.globalCompositeOperation = 'destination-out';
          else ctx.globalCompositeOperation = 'source-over';
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          ctx.closePath();
        } catch (e) { console.error('stopDrawing: failed to draw straight line', e); }
      } else {
        try { ctx.closePath(); } catch (e) {}
      }
    } else {
      // no ctx to close on selected layer
    }
    setIsDrawing(false);
    drawingTargetCanvasRef.current = null;
    strokeStartRef.current = null;
    strokePointsRef.current = [];
    // snapshot history after finishing a stroke
    try { setTimeout(() => pushHistory(), 0); } catch (e) { /* pushHistory failed */ }
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
          // Apply new scale (keep pan unchanged for simplicity)
          scaleRef.current = newScale;
          redrawAll();
          return;
        }
      } else {
        pinchStartRef.current = null;
      }

      lastPointerEvent = ev;

      if (!isDraggingLayer && !isResizing && !isRotating) return;

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
        const x = rawX / scale;
        const y = rawY / scale;

        if (isDraggingLayer && selectedLayer) {
          setLayers(prev => prev.map(l => l.id !== selectedLayer ? l : { ...l, x: x - (dragOffsetRef.current?.ox||0), y: y - (dragOffsetRef.current?.oy||0) }));
          redrawAll();
          return;
        }

        if (isRotating && selectedLayer) {
          const s = layers.find(l => l.id === selectedLayer);
          if (s) {
            const layerCenterX = s.x || 0;
            const layerCenterY = s.y || 0;
            const newRotation = Math.atan2(y - layerCenterY, x - layerCenterX);
            setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, rotation: newRotation } : l));
            redrawAll();
          }
          return;
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
      if (isRotating) {
        setIsRotating(false);
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
        activePointerIdRef.current = null;
      } catch (e) {}
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
  }, [isDraggingLayer, isResizing, isRotating, selectedLayer, layers]);

  const handleFinish = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // ensure latest drawing + layers are rendered
    redrawAll();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const timestamp = Date.now();
      const prefix = mode === 'rgb' ? 'forensic_rgb' : mode === 'filter' ? 'filter' : 'uv';
      const suffix = mode === 'rgb' ? `_${targetChannel}` : '';
      const filename = `${prefix}_layer${suffix}_${timestamp}.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      
      const meta: { targetChannel?: 'R' | 'G' | 'B' } = {};
      if (mode === 'rgb') {
        meta.targetChannel = targetChannel;
      }
      
      console.log('📤 Exportando:', { filename, mode, channel: mode === 'rgb' ? targetChannel : 'N/A' });
      try { 
        onSave(file, meta); 
      } catch (e) { 
        console.error('Erro ao salvar arquivo:', e);
        try { onSave(file); } catch (e) {} 
      }
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // clear any drawing canvases attached to layers (we use per-layer canvases now)
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
      // try remove top-level
      const removed = prev.find(l => l.id === id);
      if (removed) {
        let next = prev.filter(l => l.id !== id);
        if (removed.type === 'drawing' && removed.drawingCanvas) {
          try { removed.drawingCanvas.width = 0; removed.drawingCanvas.height = 0; } catch (e) {}
        }
        if (removed.type === 'image' && removed.img && removed.img.src && removed.img.src.startsWith('blob:')) {
          try { URL.revokeObjectURL(removed.img.src); } catch (e) {}
          const idx = objectUrlsRef.current.indexOf(removed.img.src);
          if (idx >= 0) objectUrlsRef.current.splice(idx, 1);
        }
        try { if ((removed as any).cachedCanvas) { ((removed as any).cachedCanvas as HTMLCanvasElement).width = 0; ((removed as any).cachedCanvas as HTMLCanvasElement).height = 0; } } catch (e) {}
        if (removed.type === 'group' && removed.childrenData && Array.isArray(removed.childrenData)) {
          const absChildren = removed.childrenData.map(c => ({ ...c, x: (c.x || 0) + (removed.x || 0), y: (c.y || 0) + (removed.y || 0) }));
          next = [...next, ...absChildren];
        }
        return next;
      }
      // otherwise, try to remove from group children
      return prev.map(l => {
        if (l.type === 'group' && l.childrenData) {
          const kids = l.childrenData.filter(c => c.id !== id);
          if (kids.length !== l.childrenData.length) {
            return { ...l, childrenData: kids } as Layer;
          }
        }
        return l;
      });
    });
    // clear selection if needed (use functional setter to avoid stale value)
    setSelectedLayer(prev => prev === id ? null : prev);
    // allow useEffect([layers]) to redraw after state update
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const selectLayer = (id: string) => {
    setSelectedLayer(id);
    setTool('draw');
    redrawAll();
  };

  // Delegated click handler: allow clicking anywhere in a layer row to select it.
  // This augments the per-element handlers and ensures the whole row fills visually.
  useEffect(() => {
    const root = document.querySelector('.layers-list');
    if (!root) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const row = target.closest?.('.layer-item') as HTMLElement | null;
      if (!row) return;
      // ignore clicks on interactive items
      if (target.closest('button, a, input, textarea, .layer-item-actions, .group-toggle-btn')) return;
      const layerId = row.getAttribute('data-layer-id');
      if (!layerId) return;
      // select the layer (single-select behavior)
      selectLayer(layerId);
    };
    root.addEventListener('click', handler);
    return () => root.removeEventListener('click', handler);
  }, [layers]);

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
    
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id) return { ...l, visible: !l.visible };
      if (l.type === 'group' && l.childrenData) {
        return { ...l, childrenData: l.childrenData.map(c => c.id === id ? { ...c, visible: !c.visible } : c) } as Layer;
      }
      return l;
    }));
    
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const toggleLayerLock = (id: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id) return { ...l, locked: !l.locked };
      if (l.type === 'group' && l.childrenData) {
        return { ...l, childrenData: l.childrenData.map(c => c.id === id ? { ...c, locked: !c.locked } : c) } as Layer;
      }
      return l;
    }));
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const updateLayerOpacity = (id: string, opacity: number) => {
    const clamped = Math.max(0, Math.min(100, opacity));
    setLayers(prev => prev.map(l => {
      if (l.id === id) return { ...l, opacity: clamped };
      if (l.type === 'group' && l.childrenData) {
        return { ...l, childrenData: l.childrenData.map(c => c.id === id ? { ...c, opacity: clamped } : c) } as Layer;
      }
      return l;
    }));
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const renameLayer = (id: string, newName: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id) return { ...l, name: newName };
      if (l.type === 'group' && l.childrenData) {
        return { ...l, childrenData: l.childrenData.map(c => c.id === id ? { ...c, name: newName } : c) } as Layer;
      }
      return l;
    }));
    setEditingLayerName(null);
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const duplicateLayer = (id: string) => {
    // duplicate either a top-level layer or a child inside a group
    const topIndex = layers.findIndex(l => l.id === id);
    if (topIndex >= 0) {
      const layer = layers[topIndex];
      const newId = `layer-${Date.now()}`;
      const duplicated: Layer = { ...layer, id: newId, name: layer.name + ' (cópia)', x: (layer.x || 0) + 20, y: (layer.y || 0) + 20 };
      setLayers(prev => [...prev.slice(0, topIndex + 1), duplicated, ...prev.slice(topIndex + 1)]);
      setSelectedLayer(newId);
      redrawAll();
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
      return;
    }
    // search groups
    for (let gi = 0; gi < layers.length; gi++) {
      const g = layers[gi];
      if (g.type === 'group' && g.childrenData) {
        const childIndex = g.childrenData.findIndex(c => c.id === id);
        if (childIndex >= 0) {
          const child = g.childrenData[childIndex];
          const newId = `layer-${Date.now()}`;
          const duplicated: Layer = { ...child, id: newId, name: child.name + ' (cópia)', x: (child.x || 0) + 20, y: (child.y || 0) + 20 } as Layer;
          setLayers(prev => prev.map((l, idx) => {
            if (idx === gi && l.type === 'group' && l.childrenData) {
              const newChildren = [...l.childrenData.slice(0, childIndex + 1), duplicated, ...l.childrenData.slice(childIndex + 1)];
              return { ...l, childrenData: newChildren } as Layer;
            }
            return l;
          }));
          setSelectedLayer(newId);
          redrawAll();
          try { setTimeout(() => pushHistory(), 0); } catch (e) {}
          return;
        }
      }
    }
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
    
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const updateLayerById = (prev: Layer[], id: string, updater: (layer: Layer) => Layer) => {
    return prev.map(l => {
      if (l.id === id) return updater(l);
      if (l.type === 'group' && l.childrenData && Array.isArray(l.childrenData)) {
        return { ...l, childrenData: l.childrenData.map(c => c.id === id ? updater(c) : c) } as Layer;
      }
      return l;
    });
  };

  const batchDelete = (ids: string[]) => {
    setLayers(prev => {
      // cleanup resources for removed layers (drawingCanvas, blob URLs, cachedCanvas)
      const removed = prev.filter(l => ids.includes(l.id));
      removed.forEach(l => {
        try {
          if (l.type === 'drawing' && l.drawingCanvas) { l.drawingCanvas.width = 0; l.drawingCanvas.height = 0; }
        } catch (e) {}
        try {
          if (l.type === 'image' && l.img && (l as any).img.src && (l as any).img.src.startsWith('blob:')) {
            try { URL.revokeObjectURL((l as any).img.src); } catch (e) {}
            const idx = objectUrlsRef.current.indexOf((l as any).img.src);
            if (idx >= 0) objectUrlsRef.current.splice(idx, 1);
          }
        } catch (e) {}
        try { if ((l as any).cachedCanvas) { ((l as any).cachedCanvas as HTMLCanvasElement).width = 0; ((l as any).cachedCanvas as HTMLCanvasElement).height = 0; } } catch (e) {}
      });

      // remove from top-level and from any group children
      const top = prev.filter(l => !ids.includes(l.id));
      const result = top.map(l => l.type === 'group' && l.childrenData ? { ...l, childrenData: l.childrenData!.filter(c => !ids.includes(c.id)) } : l);
      return result;
    });
    // clear selection if any removed
    setSelectedLayer(prev => (prev && ids.includes(prev) ? null : prev));
    // allow useEffect([layers]) to redraw after state update
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const batchLock = (ids: string[]) => {
    setLayers(prev => prev.map(l => {
      if (ids.includes(l.id)) return { ...l, locked: true };
      if (l.type === 'group' && l.childrenData) {
        return { ...l, childrenData: l.childrenData.map(c => ids.includes(c.id) ? { ...c, locked: true } : c) } as Layer;
      }
      return l;
    }));
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const batchUnlock = (ids: string[]) => {
    setLayers(prev => prev.map(l => {
      if (ids.includes(l.id)) return { ...l, locked: false };
      if (l.type === 'group' && l.childrenData) {
        return { ...l, childrenData: l.childrenData.map(c => ids.includes(c.id) ? { ...c, locked: false } : c) } as Layer;
      }
      return l;
    }));
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const addMaskToLayer = (id: string, mask: HTMLCanvasElement) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id) return { ...l, mask };
      if (l.type === 'group' && l.childrenData) {
        return { ...l, childrenData: l.childrenData.map(c => c.id === id ? { ...c, mask } : c) } as Layer;
      }
      return l;
    }));
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const invertMask = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || !layer.mask) return;
    try {
      const m = layer.mask;
      const mctx = m.getContext('2d');
      if (!mctx) return;
      const w = m.width;
      const h = m.height;
      const img = mctx.getImageData(0, 0, w, h);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i+1] = 255 - data[i+1];
        data[i+2] = 255 - data[i+2];
        // alpha left intact
      }
      mctx.putImageData(img, 0, 0);
      redrawAll();
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
    } catch (e) {}
  };

  const clearMask = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;
    try {
      if (!layer.mask) {
        // nothing to clear
        return;
      }
      const m = layer.mask;
      const mctx = m.getContext('2d');
      if (!mctx) return;
      mctx.setTransform(dprRef.current || 1, 0, 0, dprRef.current || 1, 0, 0);
      mctx.fillStyle = '#ffffff';
      mctx.fillRect(0, 0, m.width / (dprRef.current || 1), m.height / (dprRef.current || 1));
      redrawAll();
      try { setTimeout(() => pushHistory(), 0); } catch (e) {}
    } catch (e) {}
  };

  const setLayerBlendMode = (id: string, mode: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id) return { ...l, blendMode: mode } as Layer;
      if (l.type === 'group' && l.childrenData) {
        // also allow child to have blend mode if id matches
        const updatedChildren = l.childrenData.map(c => c.id === id ? { ...c, blendMode: mode } : c);
        return { ...l, childrenData: updatedChildren } as Layer;
      }
      return l;
    }));
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const toggleEditMask = (id: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id) return { ...l, isEditingMask: !l.isEditingMask } as Layer;
      if (l.type === 'group' && l.childrenData) return { ...l, childrenData: l.childrenData.map(c => c.id === id ? { ...c, isEditingMask: !c.isEditingMask } : c) } as Layer;
      return l;
    }));
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const handleReorder = (source: { droppableId: string; index: number }, destination: { droppableId: string; index: number }) => {
    setLayers(prev => {
      // shallow copy top-level and children arrays
      const newLayers = prev.map(l => l.type === 'group' ? { ...l, childrenData: l.childrenData ? [...l.childrenData] : [] } : { ...l });

      const isTop = (droppableId: string) => droppableId === 'layers-list';

      let moved: Layer | undefined;

      // remove from source
      if (isTop(source.droppableId)) {
        moved = newLayers.splice(source.index, 1)[0];
      } else {
        const gid = source.droppableId.replace(/^group-/, '');
        const group = newLayers.find(g => g.id === gid || g.id === `group-${gid}`);
        if (!group || group.type !== 'group' || !group.childrenData) return prev;
        moved = group.childrenData.splice(source.index, 1)[0];
      }

      if (!moved) return prev;

      // insert into destination
      if (isTop(destination.droppableId)) {
        newLayers.splice(destination.index, 0, moved);
      } else {
        const gid = destination.droppableId.replace(/^group-/, '');
        const group = newLayers.find(g => g.id === gid || g.id === `group-${gid}`) as any;
        if (!group) {
          // fallback: push to top
          newLayers.splice(destination.index, 0, moved);
        } else {
          group.childrenData = group.childrenData || [];
          group.childrenData.splice(destination.index, 0, moved);
        }
      }

      return newLayers;
    });
    redrawAll();
    try { setTimeout(() => pushHistory(), 0); } catch (e) {}
  };

  const getToolInstructions = () => {
    switch (tool) {
      case 'placeImage':
        return {
          title: 'Inserir Imagem',
          steps: [
            ['1', 'Clique no botão "Imagem" para selecionar'],
            ['2', 'Escolha uma imagem do seu PC'],
            ['3', 'Ajuste a escala (10%-200%)'],
            ['4', 'Clique no canvas para colocar'],
          ],
        };
      case 'draw':
        return { title: 'Desenhar', steps: [['1', 'Clique e arraste para desenhar'], ['2', 'Segure Shift para linha reta']] };
      case 'erase':
        return { title: 'Borracha', steps: [['1', 'Clique e arraste para apagar'], ['2', 'Segure Shift para linha reta']] };
      default:
        return null;
    }
  };

  const handleSaveClick = () => {
    try {
      // Export current canvas and deliver via onSave with proper metadata
      const meta: { targetChannel?: 'R' | 'G' | 'B' } = {};
      if (mode === 'rgb') {
        meta.targetChannel = targetChannel;
        console.log('💾 Salvando com canal RGB:', targetChannel);
      }
      handleFinish();
    } catch (e) {
      console.error('Erro ao salvar:', e);
      try { onSave(new File([], 'uv-export.png'), { targetChannel }); } catch (e) { try { onSave(new File([], 'uv-export.png')); } catch (e) {} }
    }
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    try {
      root.classList.toggle('tool-draw', tool === 'draw');
      root.classList.toggle('tool-erase', tool === 'erase');
    } catch (e) {}
  }, [tool]);

  // Ensure UV editor preserves critical filters/animations when performance mode is active
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cleanup = markPerfKeep(root);
    return () => {
      try { cleanup(); } catch (e) {}
    };
  }, []);

  return (
    <div className="uv-editor-panel" ref={rootRef}>
      <div className="uv-editor-header">
        <div className="uv-header-title">
          {mode === 'rgb' ? (
            <><Radio size={18} className="header-icon icon-rgb" /> <span>Editor RGB Forense</span></>
          ) : mode === 'filter' ? (
            <><Palette size={18} className="header-icon icon-filter" /> <span>Editor de Filtros</span></>
          ) : (
            <><Eye size={18} className="header-icon icon-uv" /> <span>Editor UV</span></>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={handleSaveClick} className="btn-save" title="Salvar imagem"><Save size={14} style={{ marginRight: 4 }} /> Salvar</button>
          <button onClick={onClose} className="btn-close" title="Fechar editor"><X size={14} style={{ marginRight: 4 }} /> Fechar</button>
        </div>
      </div>

      <div className="uv-tools-dock" role="toolbar" aria-label="Ferramentas de Edição">
        <button className={`tool-button ${tool === 'select' ? 'active' : ''}`} onClick={() => setTool('select')} title="Selecionar" aria-label="Selecionar"><MousePointer size={18} /></button>
        <button className={`tool-button ${tool === 'draw' ? 'active' : ''}`} onClick={() => setTool('draw')} title="Desenhar" aria-label="Desenhar"><Pencil size={18} /></button>
        <button className={`tool-button ${tool === 'erase' ? 'active' : ''}`} onClick={() => setTool('erase')} title="Borracha" aria-label="Borracha"><Eraser size={18} /></button>
        <button className={`tool-button ${tool === 'placeImage' ? 'active' : ''}`} onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }} title="Inserir Imagem" aria-label="Inserir Imagem"><ImageIcon size={18} /></button>
        <button className={`tool-button ${tool === 'placeText' ? 'active' : ''}`} onClick={() => setTool('placeText')} title="Texto" aria-label="Texto"><Type size={18} /></button>
      </div>

      {/* Hidden file input for quick image insertion via toolbar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = (e.target as HTMLInputElement).files ? (e.target as HTMLInputElement).files![0] : null;
          if (!f) return;
          setImageFile(f);
        }}
      />

      <div className="uv-editor-viewport">
        <div ref={canvasContainerRef} className="viewport-canvas">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onPointerDown={handlePointerDownGeneric}
            onPointerMove={handlePointerMoveGeneric}
            onPointerUp={handlePointerUpGeneric}
            onPointerCancel={handlePointerUpGeneric as any}
            onWheel={handleWheel}
            onDoubleClick={(e) => handleCanvasDoubleClick(e)}
            style={{ touchAction: 'none', cursor: tool === 'draw' ? 'crosshair' : tool === 'erase' ? 'cell' : tool === 'select' ? 'default' : 'default', display: 'block' }}
          />
          {inlineTextEdit ? (
            <textarea
              autoFocus
              defaultValue={inlineTextEdit.value}
              onBlur={(ev) => {
                const newText = (ev.target as HTMLTextAreaElement).value;
                setLayers(prev => prev.map(l => l.id === inlineTextEdit.id ? { ...l, text: newText } : l));
                setInlineTextEdit(null);
                redrawAll();
                try { setTimeout(() => pushHistory(), 0); } catch (e) {}
              }}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' && !ev.shiftKey) {
                  ev.preventDefault();
                  (ev.target as HTMLTextAreaElement).blur();
                } else if (ev.key === 'Escape') {
                  ev.preventDefault();
                  setInlineTextEdit(null);
                }
              }}
              style={{
                position: 'absolute',
                left: inlineTextEdit.cssX + 'px',
                top: inlineTextEdit.cssY + 'px',
                fontSize: inlineTextEdit.fontSize + 'px',
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: 4,
                minWidth: 80,
                maxWidth: 600,
                resize: 'vertical',
                outline: 'none'
              }}
            />
          ) : null}
          {maskCursor.visible ? (
            <div
              className="mask-cursor"
              style={{ left: maskCursor.x + 'px', top: maskCursor.y + 'px', width: brushSize + 'px', height: brushSize + 'px' }}
            />
          ) : null}
        </div>
      </div>

      <div className="uv-right-panel">
        <div className="uv-right-tabs">
          <div className={`tab ${expandedSections.colors ? 'active' : ''}`} onClick={() => toggleSection('colors')}>Cores</div>
          <div className={`tab ${expandedSections.layers ? 'active' : ''}`} onClick={() => toggleSection('layers')}>Camadas</div>
          <div className={`tab ${expandedSections.properties ? 'active' : ''}`} onClick={() => toggleSection('properties')}>Propriedades</div>
        </div>

        <div className="properties-panel">
          {expandedSections.colors && (
            <div style={{marginBottom:12}}>
              <label>Paleta</label>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
                <div style={{width:28,height:28,borderRadius:6,background:color,border:'1px solid rgba(0,0,0,0.2)'}} title={`Cor atual: ${color}`} />
                <input type="color" value={color} onChange={e => handleColorChange(e.target.value)} aria-label="Selecionar cor" />
              </div>
            </div>
          )}

          {/* Canal RGB - Sempre visível em modo RGB */}
          {expandedSections.properties && mode === 'rgb' && (
            <div className="rgb-channel-container">
              <label className="rgb-channel-title">
                <Target size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Canal Alvo RGB
              </label>
              <div className="rgb-channel-desc">
                Escolha qual canal de cor receberá os dados forenses:
              </div>
              <div className="rgb-channel-group">
                <button
                  type="button"
                  onClick={() => handleTargetChannelChange('R')}
                  className={`rgb-channel-btn rgb-channel-btn--r ${targetChannel === 'R' ? 'active' : ''}`}
                  aria-pressed={targetChannel === 'R'}
                >
                  <span className="channel-dot channel-dot--r" /> R (Red)
                </button>
                <button
                  type="button"
                  onClick={() => handleTargetChannelChange('G')}
                  className={`rgb-channel-btn rgb-channel-btn--g ${targetChannel === 'G' ? 'active' : ''}`}
                  aria-pressed={targetChannel === 'G'}
                >
                  <span className="channel-dot channel-dot--g" /> G (Green)
                </button>
                <button
                  type="button"
                  onClick={() => handleTargetChannelChange('B')}
                  className={`rgb-channel-btn rgb-channel-btn--b ${targetChannel === 'B' ? 'active' : ''}`}
                  aria-pressed={targetChannel === 'B'}
                >
                  <span className="channel-dot channel-dot--b" /> B (Blue)
                </button>
              </div>
              <div className="rgb-channel-status">
                Canal selecionado: <strong className={`channel-tag channel-tag--${targetChannel.toLowerCase()}`}>{targetChannel}</strong>
              </div>
            </div>
          )}
          
          {expandedSections.properties && (
            <div style={{marginTop:12}}>
              <label>Tamanho do pincel</label>
              <input className="uv-range" type="range" min={1} max={200} value={brushSize} onChange={e => setBrushSize(Number((e.target as HTMLInputElement).value))} />
            </div>
          )}
          {expandedSections.properties && (
            <div style={{marginTop:12}}>
              <label>Máscara: Suavidade do Pincel</label>
              <input className="uv-range" type="range" min={0} max={1} step={0.01} value={maskBrushSoftness} onChange={e => setMaskBrushSoftness(Number((e.target as HTMLInputElement).value))} />
              <label style={{marginTop:8}}>Máscara: Opacidade do Pincel</label>
              <input className="uv-range" type="range" min={0.05} max={1} step={0.01} value={maskBrushOpacity} onChange={e => setMaskBrushOpacity(Number((e.target as HTMLInputElement).value))} />
            </div>
          )}
          {/* Selected layer UI moved into LayersPanel for a single, unified layers area */}
          {expandedSections.properties && tool === 'placeText' && (
            <div style={{marginTop:12}}>
              <label>Texto a inserir</label>
              <input type="text" value={textValue} onChange={e => setTextValue(e.target.value)} placeholder="Digite o texto e clique no canvas" style={{width:'100%',boxSizing:'border-box',marginTop:6}} />
              <label style={{marginTop:8}}>Tamanho do texto</label>
              <input type="number" min={8} max={200} value={textSize} onChange={e => setTextSize(Number((e.target as HTMLInputElement).value))} style={{width: '100%'}} />
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button onClick={() => { /* keep tool as placeText, user must click canvas to place */ }} >Pronto — clique no canvas</button>
                <button onClick={() => { setTextValue(''); setTool('draw'); }}>Cancelar</button>
              </div>
            </div>
          )}

          {expandedSections.properties && tool === 'placeImage' && (
            <div style={{marginTop:12}}>
              <label>Selecionar imagem</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = (e.target as HTMLInputElement).files ? (e.target as HTMLInputElement).files![0] : null; setImageFile(f); }} style={{display:'block',marginTop:6}} />
              <label style={{marginTop:8}}>Escala</label>
              <input type="range" min={0.1} max={3} step={0.05} value={imageScale} onChange={e => setImageScale(Number((e.target as HTMLInputElement).value))} />
              {imageEl ? (
                <div style={{marginTop:8}}>
                  <div style={{fontSize:12,opacity:0.8}}>Pré-visualização</div>
                  <img src={imageEl.src} alt="preview" loading="lazy" style={{maxWidth:'100%', marginTop:6}} />
                </div>
              ) : (
                <div style={{marginTop:8, fontSize:13, opacity:0.9}}>Carregando imagem... Aguarde antes de clicar no canvas.</div>
              )}
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button onClick={() => { /* user should click canvas to place */ }} disabled={!imageEl}>Pronto — clique no canvas</button>
                <button onClick={() => { setImageFile(null); setImageEl(null); if (fileInputRef.current) fileInputRef.current.value = ''; setTool('draw'); }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>

        <LayersPanel
          layers={layers}
          selectedLayer={selectedLayer}
          editingLayerName={editingLayerName}
          groupChecks={groupChecks}
          onSelectLayer={(id, multi) => selectLayer(id)}
          onDeleteLayer={deleteLayer}
          onDuplicateLayer={duplicateLayer}
          onToggleVisibility={toggleLayerVisibility}
          onToggleLock={toggleLayerLock}
          onRenameLayer={renameLayer}
          onSetEditingLayerName={(id) => setEditingLayerName(id)}
          onMoveLayer={moveLayer}
          onUpdateLayerOpacity={updateLayerOpacity}
          onCreateGroup={createGroup}
          onAddDrawingLayer={addEmptyDrawingLayer}
          onAddTextLayer={addEmptyTextLayer}
          onToggleGroupCheck={toggleGroupCheck}
          onBatchDelete={batchDelete}
          onBatchLock={batchLock}
          onBatchUnlock={batchUnlock}
          onAddMaskToLayer={addMaskToLayer}
          onSetLayerBlendMode={setLayerBlendMode}
          onToggleMaskEdit={toggleEditMask}
          onReorder={handleReorder}
        />

        {/** Mask editing controls shown when user toggles mask edit on selected layer */}
        {selectedLayer && (() => {
          const layer = layers.find(l => l.id === selectedLayer);
          if (!layer || !layer.isEditingMask) return null;
          return (
            <div style={{padding:12, borderTop:'1px dashed rgba(255,255,255,0.04)', marginTop:8}}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                <strong>Editar Máscara</strong>
                <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                  <button onClick={() => invertMask(layer.id)}>Inverter</button>
                  <button onClick={() => clearMask(layer.id)}>Limpar</button>
                </div>
              </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <label style={{fontSize:13}}>Modo pintura:</label>
                    <select value={maskPaintMode} onChange={e => setMaskPaintMode(e.target.value as any)}>
                      <option value="hide">Pintar (esconder)</option>
                      <option value="reveal">Pintar (mostrar)</option>
                    </select>
                    <label style={{fontSize:13, marginLeft:12}}>Tamanho</label>
                    <input type="range" min={1} max={200} value={brushSize} onChange={e => setBrushSize(Number((e.target as HTMLInputElement).value))} />
                    <button onClick={() => {
                      // toggle eraser mode for mask editing (temporarily switch main tool)
                      if (!maskUseEraser) {
                        prevToolRef.current = tool;
                        setTool('erase');
                        setMaskUseEraser(true);
                      } else {
                        setMaskUseEraser(false);
                        if (prevToolRef.current) setTool(prevToolRef.current);
                        prevToolRef.current = null;
                      }
                    }} style={{marginLeft:8}}>{maskUseEraser ? 'Usando Borracha' : 'Usar Borracha'}</button>
                    <div style={{marginLeft:'auto', fontSize:12, opacity:0.85}}>Use pincel/borracha para pintar a máscara</div>
                  </div>
            </div>
          );
        })()}
      </div>

    </div>
  );
}
