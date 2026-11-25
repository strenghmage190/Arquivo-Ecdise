import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import './UVEditor.css';
import { LayersPanel } from '../LayersPanel';
import { markPerfKeep } from '../../utils/perf_helpers';
import {
  Radio,
  Palette,
  Eye,
  EyeOff,
  Flashlight,
  PenTool,
  Save,
  X,
  Target,
  Sparkles,
  Upload,
  RotateCw,
  SlidersHorizontal,
  Stamp,
  Layers as LayersIcon,
  Sun,
  BookmarkPlus,
} from 'lucide-react';

import { UVToolbar } from './uveditor/UVToolbar';
import { UVStampsPanel } from './uveditor/UVStampsPanel';
import { useUVEditor } from './uveditor/UVEditorContext';
import {
  Layer,
  UVTool,
  UV_FONT_STYLES,
  UVFontStyle,
  UVPreviewMode,
  UVBrushStyle,
  UVAuthoringState,
  SerializedUVLayer,
  getCanvasFont,
} from './uveditor/types';
import { UVStampDef, UV_STAMPS, loadStampImage } from './uveditor/uvStamps';
import { useDirtyGuard } from '../../hooks/useDirtyGuard';
import toast from 'react-hot-toast';

interface UVEditorProps {
  baseImageUrl: string;
  onSave: (
    file: File,
    meta?: { targetChannel?: 'R' | 'G' | 'B'; uvAuthoringState?: UVAuthoringState }
  ) => void;
  onClose: () => void;
  mode?: 'uv' | 'filter' | 'rgb' | 'thermal';
  initialImageFile?: File | null;
  initialAuthoringState?: UVAuthoringState | null;
  showForensicControls?: boolean;
}

interface UVStylePreset {
  id: string;
  label: string;
  color: string;
  brushStyle: UVBrushStyle;
  neonBloom: number;
  drawOpacity: number;
  fontStyle: UVFontStyle;
  custom?: boolean;
}

const BUILTIN_UV_PRESETS: UVStylePreset[] = [
  {
    id: 'neon-classic',
    label: 'Neon Clássico',
    color: '#b366ff',
    brushStyle: 'fluorescent',
    neonBloom: 75,
    drawOpacity: 100,
    fontStyle: 'mono',
  },
  {
    id: 'ritual-blood',
    label: 'Sangue Ritual',
    color: '#ff0033',
    brushStyle: 'fluorescent',
    neonBloom: 85,
    drawOpacity: 95,
    fontStyle: 'runic',
  },
  {
    id: 'ghost-ink',
    label: 'Tinta Fantasma',
    color: '#00ffff',
    brushStyle: 'solid',
    neonBloom: 45,
    drawOpacity: 55,
    fontStyle: 'handwritten',
  },
];

const UV_PRESETS_KEY = 'ecdise_uv_presets_v1';

function serializeLayersToAuthoringState(
  layerList: Layer[],
  baseWidth?: number,
  baseHeight?: number
): UVAuthoringState {
  const serialized: SerializedUVLayer[] = layerList
    .filter((l) => l.id !== '__base_image' && l.type !== 'group')
    .map((l) => {
      let drawingDataUrl: string | undefined;
      if (l.type === 'drawing' && l.drawingCanvas) {
        try {
          drawingDataUrl = l.drawingCanvas.toDataURL('image/png');
        } catch {}
      } else if (l.type === 'image' && !l.isStamp && l.img?.src) {
        drawingDataUrl = l.img.src;
      }
      return {
        id: l.id,
        type: l.type === 'text' ? 'text' : l.type === 'image' ? 'image' : 'drawing',
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        locked: l.locked,
        blendMode: l.blendMode,
        x: l.x ?? 0,
        y: l.y ?? 0,
        width: l.width,
        height: l.height,
        rotation: l.rotation ?? 0,
        scale: l.scale,
        text: l.text,
        size: l.size,
        color: l.color,
        fontStyle: l.fontStyle,
        neonIntensity: l.bloom,
        isStamp: l.isStamp,
        stampId: l.stampId,
        stampColor: l.stampColor,
        drawingDataUrl,
      };
    });

  return {
    version: 1,
    baseWidth,
    baseHeight,
    layers: serialized,
  };
}

const COLOR_PALETTES = {
  uv: [
    { label: 'Violeta UV', hex: '#b366ff', glow: '0 0 10px #b366ff' },
    { label: 'Ciano Forense', hex: '#00ffff', glow: '0 0 10px #00ffff' },
    { label: 'Sangue Neon', hex: '#ff0033', glow: '0 0 10px #ff0033' },
    { label: 'Verde Químico', hex: '#39ff14', glow: '0 0 10px #39ff14' },
    { label: 'Rosa UV', hex: '#ff10f0', glow: '0 0 10px #ff10f0' },
    { label: 'Azul Elétrico', hex: '#0080ff', glow: '0 0 10px #0080ff' },
    { label: 'Amarelo Conhecimento', hex: '#ffff00', glow: '0 0 10px #ffff00' },
    { label: 'Laranja Alerta', hex: '#ff6600', glow: '0 0 10px #ff6600' },
  ],
  rgb: [
    { label: 'Vermelho Puro', hex: '#ff0000', glow: '0 0 10px #ff0000' },
    { label: 'Verde Puro', hex: '#00ff00', glow: '0 0 10px #00ff00' },
    { label: 'Azul Puro', hex: '#0000ff', glow: '0 0 10px #0000ff' },
    { label: 'Branco', hex: '#ffffff', glow: '0 0 8px #ffffff' },
  ],
  filter: [
    { label: 'Branco', hex: '#ffffff', glow: '0 0 10px #fff' },
    { label: 'Cinza', hex: '#cccccc', glow: '0 0 8px #ccc' },
    { label: 'Branco Translúcido', hex: '#e2e8f0', glow: '0 0 5px #e2e8f0' },
    { label: 'Cinza Escuro', hex: '#888888', glow: '0 0 5px #888' },
  ],
  thermal: [
    { label: 'Branco Quente', hex: '#ffffff', glow: '0 0 10px #fff' },
    { label: 'Amarelo Quente', hex: '#ffe600', glow: '0 0 10px #ffe600' },
    { label: 'Laranja Quente', hex: '#ff6600', glow: '0 0 10px #ff6600' },
    { label: 'Vermelho Quente', hex: '#ff0000', glow: '0 0 10px #ff0000' },
    { label: 'Roxo Frio', hex: '#800080', glow: '0 0 10px #800080' },
    { label: 'Azul Frio', hex: '#0000ff', glow: '0 0 10px #0000ff' },
    { label: 'Preto (Fundo)', hex: '#000000', glow: '0 0 10px rgba(0,0,0,0.5)' },
  ],
};

const isShapeTool = (t: UVTool): boolean =>
  t === 'line' || t === 'arrow' || t === 'ellipse' || t === 'rect';

export function UVEditorInner({
  baseImageUrl,
  onSave,
  onClose,
  mode = 'rgb',
  initialImageFile,
  initialAuthoringState,
}: UVEditorProps) {
  const {
    tool,
    setTool,
    color,
    setColor,
    brushSize,
    setBrushSize,
    brushStyle,
    setBrushStyle,
    drawOpacity,
    setDrawOpacity,
    neonBloom,
    setNeonBloom,
    fontStyle,
    setFontStyle,
    previewMode,
    setPreviewMode,
    maskBrushSoftness,
    setMaskBrushSoftness,
    maskBrushOpacity,
    setMaskBrushOpacity,
    textValue,
    setTextValue,
    textSize,
    setTextSize,
    censorMode,
    setCensorMode,
    layers,
    setLayers,
    selectedLayer,
    setSelectedLayer,
    maskPaintMode,
    setMaskPaintMode,
    maskUseEraser,
    setMaskUseEraser,
    inlineTextEdit,
    setInlineTextEdit,
    editingLayerName,
    setEditingLayerName,
    setTargetChannel,
    targetChannel,
  } = useUVEditor();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ ox: number; oy: number } | null>(null);
  const resizeStartRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    minX?: number;
    minY?: number;
  } | null>(null);

  const prevToolRef = useRef<UVTool | null>(null);
  const [maskCursor, setMaskCursor] = useState<{
    x: number;
    y: number;
    size: number;
    visible: boolean;
  }>({ x: 0, y: 0, size: 20, visible: false });

  type RightTab = 'properties' | 'stamps' | 'layers';
  const [activeRightTab, setActiveRightTab] = useState<RightTab>('properties');
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [flashlightRadius, setFlashlightRadius] = useState(135);
  const snapGuidesRef = useRef<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [drawMutationCount, setDrawMutationCount] = useState(0);
  const [customPresets, setCustomPresets] = useState<UVStylePreset[]>(() => {
    try {
      const raw = localStorage.getItem(UV_PRESETS_KEY);
      return raw ? (JSON.parse(raw) as UVStylePreset[]) : [];
    } catch {
      return [];
    }
  });

  const dirtyFingerprint = useMemo(
    () =>
      JSON.stringify({
        drawMutationCount,
        layers: layers
          .filter((l) => l.id !== '__base_image')
          .map((l) => ({
            id: l.id,
            visible: l.visible,
            opacity: l.opacity,
            locked: l.locked,
            x: l.x,
            y: l.y,
            width: l.width,
            height: l.height,
            rotation: l.rotation,
            scale: l.scale,
            text: l.text,
            size: l.size,
            color: l.color,
            fontStyle: l.fontStyle,
            bloom: l.bloom,
            stampId: l.stampId,
            stampColor: l.stampColor,
          })),
      }),
    [layers, drawMutationCount]
  );
  const baselineFingerprintRef = useRef<string | null>(null);
  const isDirty =
    baselineFingerprintRef.current !== null &&
    dirtyFingerprint !== baselineFingerprintRef.current;

  const { guardClose } = useDirtyGuard({
    isDirty,
    onClose,
    listenEscape: !inlineTextEdit,
    message: 'Você tem alterações não salvas no Editor UV. Deseja descartar e fechar?',
  });

  // Refs synced with latest state for RAF / pointer callbacks
  const layersRef = useRef<Layer[]>(layers);
  layersRef.current = layers;
  const selectedLayerRef = useRef<string | null>(selectedLayer);
  selectedLayerRef.current = selectedLayer;
  const previewModeRef = useRef<UVPreviewMode>(previewMode);
  previewModeRef.current = previewMode;
  const flashlightRadiusRef = useRef<number>(flashlightRadius);
  flashlightRadiusRef.current = flashlightRadius;
  const flashlightPosRef = useRef<{ x: number; y: number } | null>(null);

  // Shape drawing refs
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const shapeCurrentRef = useRef<{ x: number; y: number; shiftKey?: boolean } | null>(null);
  const isDrawingShapeRef = useRef<boolean>(false);

  // Stroke backup for cancelling accidental 1-finger stroke when 2nd finger lands
  const preStrokeImageDataRef = useRef<{
    canvas: HTMLCanvasElement;
    data: ImageData;
  } | null>(null);

  // RAF / pointer / viewport refs
  const rafIdRef = useRef<number | null>(null);
  const lastMouseEventRef = useRef<any | null>(null);
  const redrawRafIdRef = useRef<number | null>(null);
  const redrawScheduledRef = useRef<boolean>(false);
  const lastRedrawRef = useRef<number>(0);
  const redrawTimeoutRef = useRef<number | null>(null);
  const moveScheduledRef = useRef<boolean>(false);
  const latestMoveRef = useRef<{
    clientX: number;
    clientY: number;
    pointerId?: number;
    buttons?: number;
    shiftKey?: boolean;
  } | null>(null);
  const REDRAW_MIN_MS = 16;

  const objectUrlsRef = useRef<string[]>([]);
  const dprRef = useRef<number>(1);
  const cssWidthRef = useRef<number>(800);
  const cssHeightRef = useRef<number>(600);
  const activePointerIdRef = useRef<number | null>(null);
  const pointerMapRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{
    distance: number;
    center: { x: number; y: number };
    startScale: number;
    startPan: { x: number; y: number };
  } | null>(null);
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const scaleRef = useRef<number>(1);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const strokeStartRef = useRef<{ x: number; y: number } | null>(null);
  const strokePointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const drawingTargetCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingMaskRef = useRef<boolean>(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredHandleRef = useRef<string | null>(null);

  // Undo / Redo
  const undoStackRef = useRef<any[]>([]);
  const redoStackRef = useRef<any[]>([]);
  const HISTORY_LIMIT = 50;
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [redoAvailable, setRedoAvailable] = useState(false);

  const colors = COLOR_PALETTES[mode] || COLOR_PALETTES.uv;

  const handleTargetChannelChange = (channel: 'R' | 'G' | 'B') => {
    setTargetChannel(channel);
  };

  // Helper: get base image bounds in canvas "world" (CSS pixel) coordinates
  const getImageBounds = () => {
    const w = cssWidthRef.current || 800;
    const h = cssHeightRef.current || 600;
    return {
      left: 0,
      top: 0,
      right: w,
      bottom: h,
      width: w,
      height: h,
      centerX: w / 2,
      centerY: h / 2,
    };
  };

  const hexToRgb = (hex: string) => {
    try {
      if (hex.startsWith('rgba')) {
        const m = hex.match(/rgba\((\d+),(\d+),(\d+),(\d*\.?\d+)\)/);
        if (m)
          return {
            r: parseInt(m[1], 10),
            g: parseInt(m[2], 10),
            b: parseInt(m[3], 10),
            a: parseFloat(m[4]),
          };
      }
      if (hex.startsWith('rgb')) {
        const m = hex.match(/rgb\((\d+),(\d+),(\d+)\)/);
        if (m)
          return {
            r: parseInt(m[1], 10),
            g: parseInt(m[2], 10),
            b: parseInt(m[3], 10),
            a: 1,
          };
      }
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      const bigint = parseInt(h, 16);
      return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255, a: 1 };
    } catch {
      return { r: 179, g: 102, b: 255, a: 1 };
    }
  };

  const drawSoftStroke = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    radius: number,
    hexColor: string,
    _softness: number,
    opacity: number
  ) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy) || 1;
    const step = Math.max(1, Math.floor(radius * 0.25));
    const steps = Math.max(1, Math.ceil(dist / step));
    const rgb = hexToRgb(hexColor || '#000000');
    const innerAlpha = opacity * (rgb.a || 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x0 + dx * t;
      const py = y0 + dy * t;
      const r = Math.max(1, radius / 2);
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${innerAlpha})`);
      g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Fluorescent soft UV brush segment renderer
  const drawFluorescentSegment = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    size: number,
    hexColor: string,
    opacityPercent: number,
    bloomPercent: number
  ) => {
    const op = Math.max(0.02, Math.min(1, opacityPercent / 100));
    const bl = Math.max(0, Math.min(1, bloomPercent / 100));
    const rgb = hexToRgb(hexColor);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    const step = Math.max(1, size * 0.22);
    const steps = Math.max(1, Math.ceil(dist / step));

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // Outer soft radial fluorescent halo
    const haloRadius = Math.max(2, size * (0.75 + bl * 0.85));
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const px = x0 + dx * t;
      const py = y0 + dy * t;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, haloRadius);
      grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${(0.42 * op).toFixed(3)})`);
      grad.addColorStop(0.45, `rgba(${rgb.r},${rgb.g},${rgb.b},${(0.22 * op * (0.5 + bl * 0.5)).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, haloRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bright luminous inner core
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1, size * 0.48);
    ctx.strokeStyle = `rgba(255,255,255,${(0.32 * op * (0.4 + bl * 0.6)).toFixed(3)})`;
    ctx.shadowColor = hexColor;
    ctx.shadowBlur = Math.max(4, bl * 24);
    ctx.stroke();

    ctx.restore();
  };

  // Shape drawing helper (shared between live preview & commit)
  const drawShapeOnContext = (
    ctx: CanvasRenderingContext2D,
    shapeTool: UVTool,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    opts: {
      color: string;
      lineWidth: number;
      opacity: number;
      bloom: number;
      brushStyle: 'solid' | 'fluorescent';
      shiftKey?: boolean;
    }
  ) => {
    let endX = x1;
    let endY = y1;
    if (opts.shiftKey) {
      const dx = endX - x0;
      const dy = endY - y0;
      if (shapeTool === 'ellipse' || shapeTool === 'rect') {
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        endX = x0 + Math.sign(dx || 1) * side;
        endY = y0 + Math.sign(dy || 1) * side;
      } else {
        // snap line/arrow to 45 deg increments
        const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
        const len = Math.hypot(dx, dy);
        endX = x0 + Math.cos(angle) * len;
        endY = y0 + Math.sin(angle) * len;
      }
    }

    const op = Math.max(0, Math.min(1, opts.opacity / 100));
    const bl = Math.max(0, Math.min(1, opts.bloom / 100));
    const blurPx = opts.brushStyle === 'fluorescent' ? Math.max(8, bl * 32) : bl * 22;

    const strokeCurrentPath = () => {
      ctx.stroke();
      if (opts.brushStyle === 'fluorescent' && bl > 0.1) {
        ctx.save();
        ctx.lineWidth = Math.max(1, opts.lineWidth * 0.45);
        ctx.strokeStyle = `rgba(255,255,255,${(0.45 * op).toFixed(3)})`;
        ctx.shadowBlur = blurPx * 0.6;
        ctx.stroke();
        ctx.restore();
      }
    };

    ctx.save();
    ctx.globalAlpha = op;
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = opts.color;
    ctx.fillStyle = opts.color;
    ctx.lineWidth = Math.max(1, opts.lineWidth);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = opts.color;
    ctx.shadowBlur = blurPx;

    if (shapeTool === 'line') {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(endX, endY);
      strokeCurrentPath();
    } else if (shapeTool === 'arrow') {
      const angle = Math.atan2(endY - y0, endX - x0);
      const headLen = Math.max(14, opts.lineWidth * 3.2);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(endX, endY);
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLen * Math.cos(angle - Math.PI / 6),
        endY - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLen * Math.cos(angle + Math.PI / 6),
        endY - headLen * Math.sin(angle + Math.PI / 6)
      );
      strokeCurrentPath();
    } else if (shapeTool === 'ellipse') {
      const cx = (x0 + endX) / 2;
      const cy = (y0 + endY) / 2;
      const rx = Math.max(1, Math.abs(endX - x0) / 2);
      const ry = Math.max(1, Math.abs(endY - y0) / 2);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      strokeCurrentPath();
    } else if (shapeTool === 'rect') {
      const rx = Math.min(x0, endX);
      const ry = Math.min(y0, endY);
      const rw = Math.abs(endX - x0);
      const rh = Math.abs(endY - y0);
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      strokeCurrentPath();
    }

    ctx.restore();
  };

  // Clamp pan so base image stays reachable
  const clampPan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = getImageBounds();
    const s = scaleRef.current || 1;
    const viewportW = cssWidthRef.current || canvas.width / (dprRef.current || 1);
    const viewportH = cssHeightRef.current || canvas.height / (dprRef.current || 1);

    const minPanX = viewportW - s * (bounds.centerX + bounds.width / 2);
    const maxPanX = -s * (bounds.centerX - bounds.width / 2);
    const minPanY = viewportH - s * (bounds.centerY + bounds.height / 2);
    const maxPanY = -s * (bounds.centerY - bounds.height / 2);

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

  const resetView = () => {
    scaleRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    redrawAll();
  };

  // Convert client pointer coords -> canvas world coords (object-fit: contain aware)
  const getCanvasCoordinates = (e: { clientX?: number; clientY?: number }): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    try {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX || 0) - rect.left;
      const mouseY = (e.clientY || 0) - rect.top;

      const displayWidth = rect.width || 1;
      const displayHeight = rect.height || 1;
      const bufferWidth = canvas.width / (dprRef.current || 1);
      const bufferHeight = canvas.height / (dprRef.current || 1);

      const canvasAspect = bufferWidth / bufferHeight;
      const displayAspect = displayWidth / displayHeight;

      let renderedWidth = displayWidth;
      let renderedHeight = displayHeight;
      let renderedLeft = 0;
      let renderedTop = 0;

      if (canvasAspect > displayAspect) {
        renderedHeight = displayWidth / canvasAspect;
        renderedTop = (displayHeight - renderedHeight) / 2;
      } else {
        renderedWidth = displayHeight * canvasAspect;
        renderedLeft = (displayWidth - renderedWidth) / 2;
      }

      const adjustedMouseX = mouseX - renderedLeft;
      const adjustedMouseY = mouseY - renderedTop;

      const correctedX = adjustedMouseX * (bufferWidth / renderedWidth);
      const correctedY = adjustedMouseY * (bufferHeight / renderedHeight);

      const scale = scaleRef.current || 1;
      const pan = panRef.current || { x: 0, y: 0 };

      return {
        x: (correctedX - pan.x) / scale,
        y: (correctedY - pan.y) / scale,
      };
    } catch {
      return { x: 0, y: 0 };
    }
  };

  // Measure layer bounds in unrotated world space
  const getLayerBounds = (
    layer: Layer,
    ctx: CanvasRenderingContext2D | null
  ): { x: number; y: number; w: number; h: number } | null => {
    if (layer.type === 'image' && layer.img) {
      const w = (layer.img.naturalWidth || layer.width || 100) * (layer.scale || 1);
      const h = (layer.img.naturalHeight || layer.height || 100) * (layer.scale || 1);
      return { x: (layer.x || 0) - w / 2, y: (layer.y || 0) - h / 2, w, h };
    }
    if (layer.type === 'text') {
      const size = Math.max(8, layer.size || textSize);
      const lines = (layer.text || '').split('\n');
      let maxW = size * 2;
      if (ctx) {
        ctx.save();
        ctx.font = getCanvasFont(size, layer.fontStyle || 'mono');
        for (const line of lines) {
          maxW = Math.max(maxW, ctx.measureText(line).width);
        }
        ctx.restore();
      }
      const h = Math.max(1, lines.length) * size * 1.25;
      return { x: layer.x || 0, y: layer.y || 0, w: maxW, h };
    }
    return null;
  };

  const mapBlendOp = (blendMode?: string): GlobalCompositeOperation => {
    switch ((blendMode || '').toLowerCase()) {
      case 'multiply':
        return 'multiply';
      case 'screen':
        return 'screen';
      case 'overlay':
        return 'overlay';
      case 'add':
        return 'lighter';
      case 'darken':
        return 'darken';
      case 'lighten':
        return 'lighten';
      default:
        return 'source-over';
    }
  };

  // Unified layer renderer (used by redrawAll, flashlight simulation, and clean PNG export)
  const drawLayerToContext = (
    ctxToDraw: CanvasRenderingContext2D,
    layer: Layer,
    clearW: number,
    clearH: number
  ) => {
    const bloomVal = typeof layer.bloom === 'number' ? layer.bloom : 0;

    switch (layer.type) {
      case 'image':
        if (layer.img && layer.img.complete && (layer.img.naturalWidth || layer.img.width) > 0) {
          const w = (layer.img.naturalWidth || layer.width || 100) * (layer.scale || 1);
          const h = (layer.img.naturalHeight || layer.height || 100) * (layer.scale || 1);
          const cx = layer.x || 0;
          const cy = layer.y || 0;
          const rot = layer.rotation || 0;

          ctxToDraw.save();
          ctxToDraw.translate(cx, cy);
          if (rot) ctxToDraw.rotate(rot);
          if (bloomVal > 0) {
            ctxToDraw.shadowColor = layer.stampColor || layer.color || '#b366ff';
            ctxToDraw.shadowBlur = (bloomVal / 100) * 28;
          }
          ctxToDraw.drawImage(layer.img, -w / 2, -h / 2, w, h);
          if (bloomVal > 50) {
            // Secondary glow pass for strong neon stamps
            ctxToDraw.shadowBlur = (bloomVal / 100) * 14;
            ctxToDraw.drawImage(layer.img, -w / 2, -h / 2, w, h);
          }
          ctxToDraw.restore();
        }
        break;

      case 'text':
        if (layer.text) {
          const size = Math.max(8, layer.size || textSize);
          const fontStr = getCanvasFont(size, layer.fontStyle || 'mono');
          const lines = layer.text.split('\n');
          const textColor = layer.color || color;

          ctxToDraw.save();
          ctxToDraw.font = fontStr;
          ctxToDraw.textBaseline = 'top';
          ctxToDraw.fillStyle = textColor;

          let maxW = 0;
          for (const line of lines) {
            maxW = Math.max(maxW, ctxToDraw.measureText(line).width);
          }
          const totalH = lines.length * size * 1.25;
          const ox = layer.x || 0;
          const oy = layer.y || 0;
          const cx = ox + maxW / 2;
          const cy = oy + totalH / 2;
          const rot = layer.rotation || 0;

          if (rot) {
            ctxToDraw.translate(cx, cy);
            ctxToDraw.rotate(rot);
            ctxToDraw.translate(-cx, -cy);
          }

          if (bloomVal > 0) {
            ctxToDraw.shadowColor = textColor;
            ctxToDraw.shadowBlur = (bloomVal / 100) * 26;
          }

          lines.forEach((line, idx) => {
            const ly = oy + idx * size * 1.25;
            ctxToDraw.fillText(line, ox, ly);
            if (bloomVal > 45) {
              ctxToDraw.shadowBlur = (bloomVal / 100) * 12;
              ctxToDraw.fillText(line, ox, ly);
            }
          });
          ctxToDraw.restore();
        }
        break;

      case 'drawing':
        if (layer.drawingCanvas) {
          ctxToDraw.drawImage(layer.drawingCanvas, 0, 0, clearW, clearH);
        }
        break;

      case 'group':
        if (layer.childrenData && Array.isArray(layer.childrenData)) {
          ctxToDraw.save();
          ctxToDraw.translate(layer.x || 0, layer.y || 0);
          ctxToDraw.scale(layer.scale || 1, layer.scale || 1);
          for (const child of layer.childrenData) {
            if (!child.visible) continue;
            ctxToDraw.save();
            ctxToDraw.globalAlpha = (child.opacity ?? 100) / 100;
            ctxToDraw.globalCompositeOperation = mapBlendOp(child.blendMode);
            drawLayerToContext(ctxToDraw, child, clearW, clearH);
            ctxToDraw.restore();
          }
          ctxToDraw.restore();
        }
        break;
    }
  };

  // Render a list of layers (with masks) onto target context
  const renderLayersList = (
    ctx: CanvasRenderingContext2D,
    list: Layer[],
    clearW: number,
    clearH: number,
    dpr: number,
    applyViewportTransform: boolean
  ) => {
    for (const layer of list) {
      if (!layer.visible) continue;

      if (layer.mask) {
        try {
          const temp = document.createElement('canvas');
          temp.width = Math.round(clearW * dpr);
          temp.height = Math.round(clearH * dpr);
          const tctx = temp.getContext('2d');
          if (!tctx) continue;
          tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          tctx.save();
          tctx.globalAlpha = (layer.opacity ?? 100) / 100;
          drawLayerToContext(tctx, layer, clearW, clearH);
          tctx.restore();

          tctx.globalCompositeOperation = 'destination-in';
          tctx.drawImage(layer.mask, 0, 0, clearW, clearH);
          tctx.globalCompositeOperation = 'source-over';

          ctx.save();
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = mapBlendOp(layer.blendMode);
          ctx.drawImage(temp, 0, 0, clearW, clearH);
          ctx.restore();
        } catch {
          // ignore mask failure
        }
        continue;
      }

      ctx.save();
      ctx.globalAlpha = (layer.opacity ?? 100) / 100;
      ctx.globalCompositeOperation = mapBlendOp(layer.blendMode);
      drawLayerToContext(ctx, layer, clearW, clearH);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }
    void applyViewportTransform;
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    const selId = selectedLayerRef.current;
    if (selId) {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== selId) return l;
          if (l.type === 'text') return { ...l, color: newColor };
          return l;
        })
      );
    }
  };

  // History serialization
  const serializeState = () => {
    try {
      const serializeLayer = (l: Layer): any => {
        const copy: any = { ...l };
        if (l.img && l.img.src) copy.imgSrc = l.img.src;
        delete copy.img;
        if (l.drawingCanvas) {
          try {
            copy.drawingData = l.drawingCanvas.toDataURL();
          } catch {
            copy.drawingData = null;
          }
        }
        if (l.mask) {
          try {
            copy.maskData = l.mask.toDataURL();
          } catch {
            copy.maskData = null;
          }
        }
        if (l.childrenData && Array.isArray(l.childrenData)) {
          copy.childrenData = l.childrenData.map((c: Layer) => serializeLayer(c));
        }
        return copy;
      };
      return { layers: layersRef.current.map((l) => serializeLayer(l)) };
    } catch {
      return { layers: [] };
    }
  };

  const restoreState = (snapshot: any) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = dprRef.current || 1;
      const cssW = cssWidthRef.current || canvas.width / dpr;
      const cssH = cssHeightRef.current || canvas.height / dpr;

      const buildLayer = (src: any): Layer => {
        const base: any = { ...src };
        if (src.imgSrc) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => redrawAll();
          img.src = src.imgSrc;
          base.img = img;
        }
        if (src.drawingData) {
          const c = document.createElement('canvas');
          c.width = Math.round(cssW * dpr);
          c.height = Math.round(cssH * dpr);
          const ctx = c.getContext('2d');
          if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const img = new Image();
          img.onload = () => {
            try {
              ctx?.drawImage(img, 0, 0, cssW, cssH);
              redrawAll();
            } catch {}
          };
          img.src = src.drawingData;
          base.drawingCanvas = c;
        }
        if (src.maskData) {
          const mc = document.createElement('canvas');
          mc.width = Math.round(cssW * dpr);
          mc.height = Math.round(cssH * dpr);
          const mctx = mc.getContext('2d');
          if (mctx) mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const mimg = new Image();
          mimg.onload = () => {
            try {
              mctx?.drawImage(mimg, 0, 0, cssW, cssH);
              redrawAll();
            } catch {}
          };
          mimg.src = src.maskData;
          base.mask = mc;
        }
        if (src.childrenData && Array.isArray(src.childrenData)) {
          base.childrenData = src.childrenData.map((c: any) => buildLayer(c));
        }
        delete base.imgSrc;
        delete base.drawingData;
        delete base.maskData;
        return base as Layer;
      };

      const restoredLayers: Layer[] = snapshot.layers.map((s: any) => buildLayer(s));
      setLayers(restoredLayers);
      redrawAll();
    } catch {}
  };

  const pushHistory = () => {
    try {
      const snap = serializeState();
      undoStackRef.current.push(snap);
      if (undoStackRef.current.length > HISTORY_LIMIT) undoStackRef.current.shift();
      redoStackRef.current = [];
      setUndoAvailable(undoStackRef.current.length > 0);
      setRedoAvailable(false);
      setDrawMutationCount((c) => c + 1);
    } catch {}
  };

  const undo = () => {
    try {
      if (undoStackRef.current.length === 0) return;
      const snap = undoStackRef.current.pop();
      if (!snap) return;
      redoStackRef.current.push(serializeState());
      restoreState(snap);
      setUndoAvailable(undoStackRef.current.length > 0);
      setRedoAvailable(redoStackRef.current.length > 0);
    } catch {}
  };

  const redo = () => {
    try {
      if (redoStackRef.current.length === 0) return;
      const snap = redoStackRef.current.pop();
      if (!snap) return;
      undoStackRef.current.push(serializeState());
      restoreState(snap);
      setUndoAvailable(undoStackRef.current.length > 0);
      setRedoAvailable(redoStackRef.current.length > 0);
    } catch {}
  };

  // Create or find an unlocked drawing layer synchronously
  const ensureDrawingLayer = (): Layer | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const currentLayers = layersRef.current;
    const sel = currentLayers.find((l) => l.id === selectedLayerRef.current);
    if (sel && !sel.locked && (sel.type === 'drawing' || sel.isEditingMask)) {
      return sel;
    }
    // Find topmost unlocked drawing layer (excluding __base_image)
    for (let i = currentLayers.length - 1; i >= 0; i--) {
      const l = currentLayers[i];
      if (l.id !== '__base_image' && l.type === 'drawing' && !l.locked && l.drawingCanvas) {
        setSelectedLayer(l.id);
        return l;
      }
    }
    // Auto-create a fresh UV drawing layer
    const dpr = dprRef.current || 1;
    const cssW = cssWidthRef.current || canvas.width / dpr;
    const cssH = cssHeightRef.current || canvas.height / dpr;
    const drawCanvas = document.createElement('canvas');
    drawCanvas.width = Math.round(cssW * dpr);
    drawCanvas.height = Math.round(cssH * dpr);
    const drawCtx = drawCanvas.getContext('2d');
    if (drawCtx) drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const id = `layer-draw-${Date.now()}`;
    const newLayer: Layer = {
      id,
      type: 'drawing',
      name: `Camada UV ${currentLayers.filter((l) => l.type === 'drawing' && l.id !== '__base_image').length + 1}`,
      visible: true,
      opacity: 100,
      locked: false,
      drawingCanvas: drawCanvas,
      x: 0,
      y: 0,
    };
    layersRef.current = [...currentLayers, newLayer];
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayer(id);
    return newLayer;
  };

  // Main canvas redraw
  const redrawAll = useCallback(() => {
    if (redrawScheduledRef.current) return;
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
    } catch {}

    redrawScheduledRef.current = true;
    redrawRafIdRef.current = requestAnimationFrame(() => {
      redrawScheduledRef.current = false;
      redrawRafIdRef.current = null;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = dprRef.current || 1;
      const clearW = cssWidthRef.current || canvas.width / dpr;
      const clearH = cssHeightRef.current || canvas.height / dpr;
      const zoom = scaleRef.current || 1;
      const p = panRef.current || { x: 0, y: 0 };
      const curLayers = layersRef.current;
      const curPreview = previewModeRef.current;

      // 1. Reset transform to DPR baseline, clear, apply pan & zoom
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, clearW, clearH);
      ctx.translate(p.x, p.y);
      ctx.scale(zoom, zoom);

      const baseLayer = curLayers.find((l) => l.id === '__base_image');
      const secretLayers = curLayers.filter((l) => l.id !== '__base_image');

      if (curPreview === 'naked') {
        // [Olho Nu / Sem UV] — ONLY base image, simulating player view without flashlight
        if (baseLayer && baseLayer.visible) {
          renderLayersList(ctx, [baseLayer], clearW, clearH, dpr, true);
        }
      } else if (curPreview === 'flashlight') {
        // [Testar Lanterna UV] — Base image darkened slightly + radial circular UV reveal mask
        if (baseLayer && baseLayer.visible) {
          renderLayersList(ctx, [baseLayer], clearW, clearH, dpr, true);
        }

        // Dim ambient light so UV glow pops realistically
        ctx.save();
        ctx.fillStyle = 'rgba(6, 4, 16, 0.42)';
        ctx.fillRect(0, 0, clearW, clearH);
        ctx.restore();

        const spot = flashlightPosRef.current || { x: clearW / 2, y: clearH / 2 };
        const radius = flashlightRadiusRef.current || 135;

        // Render all secret UV layers to offscreen buffer
        const uvBuf = document.createElement('canvas');
        uvBuf.width = Math.round(clearW * dpr);
        uvBuf.height = Math.round(clearH * dpr);
        const uvCtx = uvBuf.getContext('2d');
        if (uvCtx) {
          uvCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          renderLayersList(uvCtx, secretLayers, clearW, clearH, dpr, false);

          // Apply soft radial circular mask around flashlight beam
          uvCtx.globalCompositeOperation = 'destination-in';
          const maskGrad = uvCtx.createRadialGradient(
            spot.x,
            spot.y,
            radius * 0.15,
            spot.x,
            spot.y,
            radius
          );
          maskGrad.addColorStop(0, 'rgba(255,255,255,1)');
          maskGrad.addColorStop(0.68, 'rgba(255,255,255,0.94)');
          maskGrad.addColorStop(0.9, 'rgba(255,255,255,0.35)');
          maskGrad.addColorStop(1, 'rgba(255,255,255,0)');
          uvCtx.fillStyle = maskGrad;
          uvCtx.fillRect(0, 0, clearW, clearH);
          uvCtx.globalCompositeOperation = 'source-over';

          // Subtle UV purple beam illumination over the base image
          ctx.save();
          const beamGrad = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, radius);
          beamGrad.addColorStop(0, 'rgba(168, 85, 247, 0.24)');
          beamGrad.addColorStop(0.65, 'rgba(124, 58, 237, 0.14)');
          beamGrad.addColorStop(1, 'rgba(88, 28, 135, 0)');
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.arc(spot.x, spot.y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Composite revealed UV ink
          ctx.save();
          ctx.drawImage(uvBuf, 0, 0, clearW, clearH);
          ctx.restore();

          // Tactical UV lens ring
          ctx.save();
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
          ctx.lineWidth = Math.max(1, 1.5 / zoom);
          ctx.setLineDash([6 / zoom, 5 / zoom]);
          ctx.beginPath();
          ctx.arc(spot.x, spot.y, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      } else {
        // [Edição Mestre] — Full authoring view
        renderLayersList(ctx, curLayers, clearW, clearH, dpr, true);

        // Live shape preview while dragging
        if (isDrawingShapeRef.current && shapeStartRef.current && shapeCurrentRef.current) {
          drawShapeOnContext(
            ctx,
            tool,
            shapeStartRef.current.x,
            shapeStartRef.current.y,
            shapeCurrentRef.current.x,
            shapeCurrentRef.current.y,
            {
              color,
              lineWidth: brushSize,
              opacity: drawOpacity,
              bloom: neonBloom,
              brushStyle,
              shiftKey: shapeCurrentRef.current.shiftKey,
            }
          );
        }

        // RGB Mode Forensic Multiply Preview
        if (mode === 'rgb') {
          ctx.save();
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle =
            targetChannel === 'R' ? '#ff0000' : targetChannel === 'G' ? '#00ff00' : '#0000ff';
          ctx.fillRect(0, 0, clearW, clearH);
          ctx.restore();
        }

        // Selection bounding box & rotation/resize handles
        const selId = selectedLayerRef.current;
        if (selId) {
          const s = curLayers.find((l) => l.id === selId);
          if (s && !s.locked && (s.type === 'image' || s.type === 'text')) {
            const bounds = getLayerBounds(s, ctx);
            if (bounds) {
              ctx.save();
              const layerCenterX = bounds.x + bounds.w / 2;
              const layerCenterY = bounds.y + bounds.h / 2;
              const rotation = s.rotation || 0;

              ctx.translate(layerCenterX, layerCenterY);
              ctx.rotate(rotation);
              ctx.translate(-layerCenterX, -layerCenterY);

              const handleRadius = Math.max(5, 8 / zoom);
              const strokeW = Math.max(1, 1.75 / zoom);

              ctx.strokeStyle = '#c084fc';
              ctx.setLineDash([6 / zoom, 4 / zoom]);
              ctx.lineWidth = strokeW;
              ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

              ctx.fillStyle = '#0b0c10';
              ctx.strokeStyle = '#00ffff';
              ctx.setLineDash([]);
              ctx.lineWidth = strokeW;

              const corners = [
                { x: bounds.x, y: bounds.y },
                { x: bounds.x + bounds.w, y: bounds.y },
                { x: bounds.x, y: bounds.y + bounds.h },
                { x: bounds.x + bounds.w, y: bounds.y + bounds.h },
              ];
              corners.forEach((h) => {
                ctx.beginPath();
                ctx.arc(h.x, h.y, handleRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              });

              // Rotation handle above top center
              const rotOffset = Math.max(24, 28 / zoom);
              const rotPos = { x: bounds.x + bounds.w / 2, y: bounds.y - rotOffset };
              ctx.beginPath();
              ctx.moveTo(bounds.x + bounds.w / 2, bounds.y);
              ctx.lineTo(rotPos.x, rotPos.y);
              ctx.stroke();

              ctx.fillStyle = '#a855f7';
              ctx.beginPath();
              ctx.arc(rotPos.x, rotPos.y, handleRadius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.restore();
            }
          }
        }

        // Magnetic center guide lines
        if (snapGuidesRef.current.x || snapGuidesRef.current.y) {
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.85)';
          ctx.lineWidth = Math.max(1, 1.5 / zoom);
          ctx.setLineDash([6 / zoom, 4 / zoom]);
          if (snapGuidesRef.current.x) {
            ctx.beginPath();
            ctx.moveTo(clearW / 2, 0);
            ctx.lineTo(clearW / 2, clearH);
            ctx.stroke();
          }
          if (snapGuidesRef.current.y) {
            ctx.beginPath();
            ctx.moveTo(0, clearH / 2);
            ctx.lineTo(clearW, clearH / 2);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      try {
        lastRedrawRef.current = performance.now();
      } catch {
        lastRedrawRef.current = Date.now();
      }
    });
  }, [tool, color, brushSize, drawOpacity, neonBloom, brushStyle, mode, targetChannel]);

  // Redraw when layers, previewMode, flashlightRadius, or selection changes
  useEffect(() => {
    redrawAll();
  }, [layers, previewMode, flashlightRadius, selectedLayer, redrawAll]);

  // Initialize base image & default UV drawing layer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let img: HTMLImageElement = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImageUrl;

    const handleLoaded = () => {
      const maxWidth = 960;
      const scale = Math.min(1, maxWidth / (img.naturalWidth || 800));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;

      const cssWidth = Math.max(100, Math.round((img.naturalWidth || 800) * scale));
      const cssHeight = Math.max(100, Math.round((img.naturalHeight || 600) * scale));
      cssWidthRef.current = cssWidth;
      cssHeightRef.current = cssHeight;

      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssWidth, cssHeight);
      }

      flashlightPosRef.current = { x: cssWidth / 2, y: cssHeight / 2 };

      // Build base image layer + default unlocked UV drawing layer
      setLayers((prev) => {
        if (prev.some((l) => l.id === '__base_image')) return prev;

        const m = document.createElement('canvas');
        m.width = Math.round(cssWidth * dpr);
        m.height = Math.round(cssHeight * dpr);
        const mctx = m.getContext('2d');
        if (mctx) {
          mctx.drawImage(img, 0, 0, m.width, m.height);
        }

        const baseLayer: Layer = {
          id: '__base_image',
          type: 'drawing',
          name: 'Plano de Fundo',
          visible: true,
          opacity: 100,
          locked: true,
          x: 0,
          y: 0,
          drawingCanvas: m,
        };

        try {
          const thumbW = 64;
          const thumbH = Math.max(
            1,
            Math.round((img.naturalHeight || cssHeight) * (thumbW / (img.naturalWidth || cssWidth)))
          );
          const c = document.createElement('canvas');
          c.width = thumbW;
          c.height = thumbH;
          const tctx = c.getContext('2d');
          if (tctx) {
            tctx.drawImage(img, 0, 0, c.width, c.height);
            baseLayer.preview = c.toDataURL();
          }
        } catch {}

        if (initialAuthoringState && Array.isArray(initialAuthoringState.layers) && initialAuthoringState.layers.length > 0) {
          const restoredLayers: Layer[] = initialAuthoringState.layers.map((sl) => {
            if (sl.type === 'text') {
              return {
                id: sl.id,
                type: 'text',
                name: sl.name,
                visible: sl.visible,
                opacity: sl.opacity,
                locked: sl.locked,
                blendMode: sl.blendMode,
                x: sl.x,
                y: sl.y,
                width: sl.width,
                height: sl.height,
                rotation: sl.rotation,
                scale: sl.scale,
                text: sl.text || '',
                size: sl.size || 28,
                color: sl.color || '#b366ff',
                fontStyle: sl.fontStyle || 'mono',
                bloom: sl.neonIntensity ?? 70,
              };
            }
            if (sl.type === 'drawing') {
              const dc = document.createElement('canvas');
              dc.width = Math.round(cssWidth * dpr);
              dc.height = Math.round(cssHeight * dpr);
              const dctx = dc.getContext('2d');
              if (dctx) dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
              if (sl.drawingDataUrl) {
                const dImg = new Image();
                dImg.onload = () => {
                  const ctx2 = dc.getContext('2d');
                  if (ctx2) {
                    ctx2.save();
                    ctx2.setTransform(1, 0, 0, 1, 0, 0);
                    ctx2.drawImage(dImg, 0, 0, dc.width, dc.height);
                    ctx2.restore();
                    redrawAll();
                  }
                };
                dImg.src = sl.drawingDataUrl;
              }
              return {
                id: sl.id,
                type: 'drawing',
                name: sl.name,
                visible: sl.visible,
                opacity: sl.opacity,
                locked: sl.locked,
                blendMode: sl.blendMode,
                x: sl.x,
                y: sl.y,
                rotation: sl.rotation,
                drawingCanvas: dc,
              };
            }
            const layerObj: Layer = {
              id: sl.id,
              type: 'image',
              name: sl.name,
              visible: sl.visible,
              opacity: sl.opacity,
              locked: sl.locked,
              blendMode: sl.blendMode,
              x: sl.x,
              y: sl.y,
              width: sl.width,
              height: sl.height,
              rotation: sl.rotation,
              scale: sl.scale ?? 1,
              color: sl.color,
              bloom: sl.neonIntensity ?? 70,
              isStamp: sl.isStamp,
              stampId: sl.stampId,
              stampColor: sl.stampColor,
            };
            if (sl.isStamp && sl.stampId) {
              const stampDef = UV_STAMPS.find((s) => s.id === sl.stampId);
              if (stampDef) {
                loadStampImage(stampDef, sl.stampColor || sl.color || '#b366ff').then((sImg) => {
                  setLayers((cur) =>
                    cur.map((item) => (item.id === sl.id ? { ...item, img: sImg } : item))
                  );
                  redrawAll();
                });
              }
            } else if (sl.drawingDataUrl) {
              const rImg = new Image();
              rImg.onload = () => {
                setLayers((cur) =>
                  cur.map((item) => (item.id === sl.id ? { ...item, img: rImg } : item))
                );
                redrawAll();
              };
              rImg.src = sl.drawingDataUrl;
            }
            return layerObj;
          });
          setSelectedLayer(restoredLayers[0]?.id ?? null);
          return [baseLayer, ...restoredLayers, ...prev];
        }

        // Default unlocked UV layer so Mestre can paint immediately
        const drawCanvas = document.createElement('canvas');
        drawCanvas.width = Math.round(cssWidth * dpr);
        drawCanvas.height = Math.round(cssHeight * dpr);
        const dctx = drawCanvas.getContext('2d');
        if (dctx) dctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const defaultDrawId = `layer-uv-default-${Date.now()}`;
        const defaultDrawLayer: Layer = {
          id: defaultDrawId,
          type: 'drawing',
          name: mode === 'uv' ? 'Camada UV 1' : 'Camada Secreta 1',
          visible: true,
          opacity: 100,
          locked: false,
          x: 0,
          y: 0,
          drawingCanvas: drawCanvas,
        };

        setSelectedLayer(defaultDrawId);
        return [baseLayer, defaultDrawLayer, ...prev];
      });

      setTimeout(() => {
        baselineFingerprintRef.current = JSON.stringify({
          drawMutationCount: 0,
          layers: layersRef.current
            .filter((l) => l.id !== '__base_image')
            .map((l) => ({
              id: l.id,
              visible: l.visible,
              opacity: l.opacity,
              locked: l.locked,
              x: l.x,
              y: l.y,
              width: l.width,
              height: l.height,
              rotation: l.rotation,
              scale: l.scale,
              text: l.text,
              size: l.size,
              color: l.color,
              fontStyle: l.fontStyle,
              bloom: l.bloom,
              stampId: l.stampId,
              stampColor: l.stampColor,
            })),
        });
      }, 60);

      if (initialImageFile) {
        addImageLayerFromFile(initialImageFile, 'Imagem Inicial');
      }
    };

    img.onload = handleLoaded;
    img.onerror = () => {
      const retry = new Image();
      retry.onload = () => {
        img = retry;
        handleLoaded();
      };
      retry.src = baseImageUrl;
    };
  }, [baseImageUrl, initialImageFile]);

  // Cleanup URLs & RAFs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
      objectUrlsRef.current = [];
      if (redrawTimeoutRef.current != null) clearTimeout(redrawTimeoutRef.current);
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      if (redrawRafIdRef.current != null) cancelAnimationFrame(redrawRafIdRef.current);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      const mod = ev.ctrlKey || ev.metaKey;
      if (mod && ev.key.toLowerCase() === 'z') {
        ev.preventDefault();
        if (ev.shiftKey) redo();
        else undo();
      } else if (mod && ev.key.toLowerCase() === 'y') {
        ev.preventDefault();
        redo();
      } else if (ev.key === '[') {
        ev.preventDefault();
        setBrushSize((s) => Math.max(1, (s || 1) - 2));
      } else if (ev.key === ']') {
        ev.preventDefault();
        setBrushSize((s) => Math.min(200, (s || 1) + 2));
      } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
        const selId = selectedLayerRef.current;
        if (selId && selId !== '__base_image') {
          const sel = layersRef.current.find((l) => l.id === selId);
          if (sel && !sel.locked && (sel.type === 'image' || sel.type === 'text')) {
            ev.preventDefault();
            deleteLayer(selId);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Paste image from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            addImageLayerFromFile(file, 'Imagem Colada');
            break;
          }
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // Mark performance-keep
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cleanup = markPerfKeep(root);
    return () => {
      try {
        cleanup();
      } catch {}
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.toggle('tool-draw', previewMode === 'edit' && tool === 'draw');
    root.classList.toggle('tool-erase', previewMode === 'edit' && tool === 'erase');
  }, [tool, previewMode]);

  // Insert SVG stamp layer
  const handleInsertStamp = async (stamp: UVStampDef, stampColor: string) => {
    try {
      const img = await loadStampImage(stamp, stampColor);
      const cssW = cssWidthRef.current || 800;
      const cssH = cssHeightRef.current || 600;
      const targetMax = Math.min(cssW, cssH) * 0.36;
      const baseScale = Math.min(1, targetMax / Math.max(img.naturalWidth || stamp.width, img.naturalHeight || stamp.height));

      const id = `layer-stamp-${Date.now()}`;
      const newLayer: Layer = {
        id,
        type: 'image',
        name: `Carimbo: ${stamp.name}`,
        visible: true,
        opacity: drawOpacity,
        locked: false,
        x: cssW / 2,
        y: cssH / 2,
        rotation: 0,
        scale: Math.max(0.2, baseScale),
        width: img.naturalWidth || stamp.width,
        height: img.naturalHeight || stamp.height,
        img,
        isStamp: true,
        stampId: stamp.id,
        stampColor,
        bloom: neonBloom,
        preview: img.src,
      };

      setPreviewMode('edit');
      setLayers((prev) => [...prev, newLayer]);
      setSelectedLayer(id);
      setTool('select');
      setMobilePanelOpen(false);
      redrawAll();
      setTimeout(() => pushHistory(), 0);
      toast.success(`Carimbo "${stamp.name}" inserido!`);
    } catch {
      toast.error('Erro ao carregar carimbo SVG.');
    }
  };

  // Add image layer from File (Import Image / Camera)
  const addImageLayerFromFile = (file: File, customName?: string) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const cssW = cssWidthRef.current || 800;
      const cssH = cssHeightRef.current || 600;
      const natW = img.naturalWidth || img.width || 300;
      const natH = img.naturalHeight || img.height || 300;
      const fitScale = Math.min(1, (cssW * 0.65) / natW, (cssH * 0.65) / natH);

      let previewData: string | undefined;
      try {
        const thumbW = 64;
        const thumbH = Math.max(1, Math.round(natH * (thumbW / natW)));
        const c = document.createElement('canvas');
        c.width = thumbW;
        c.height = thumbH;
        const tctx = c.getContext('2d');
        if (tctx) {
          tctx.drawImage(img, 0, 0, thumbW, thumbH);
          previewData = c.toDataURL();
        }
      } catch {}

      const id = `layer-img-${Date.now()}`;
      const newLayer: Layer = {
        id,
        type: 'image',
        name: customName || file.name.replace(/\.[^/.]+$/, '') || 'Imagem UV',
        visible: true,
        opacity: drawOpacity,
        locked: false,
        x: cssW / 2,
        y: cssH / 2,
        rotation: 0,
        scale: fitScale,
        width: natW,
        height: natH,
        img,
        bloom: Math.round(neonBloom * 0.5),
        blendMode: 'normal',
        preview: previewData,
      };

      setPreviewMode('edit');
      setLayers((prev) => [...prev, newLayer]);
      setSelectedLayer(id);
      setTool('select');
      setMobilePanelOpen(false);
      redrawAll();
      setTimeout(() => pushHistory(), 0);
      toast.success('Imagem adicionada! Arraste para posicionar.');
    };
    img.src = url;
  };

  // Start freehand brush/eraser stroke
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (tool !== 'draw' && tool !== 'erase') return;

    const activeLayer = ensureDrawingLayer();
    if (!activeLayer) return;

    let targetCanvas: HTMLCanvasElement | null = null;
    if (activeLayer.isEditingMask) {
      const dpr = dprRef.current || 1;
      const cssW = cssWidthRef.current || canvas.width / dpr;
      const cssH = cssHeightRef.current || canvas.height / dpr;
      if (!activeLayer.mask) {
        const m = document.createElement('canvas');
        m.width = Math.round(cssW * dpr);
        m.height = Math.round(cssH * dpr);
        const mctx = m.getContext('2d');
        if (mctx) {
          mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          mctx.fillStyle = '#ffffff';
          mctx.fillRect(0, 0, cssW, cssH);
        }
        setLayers((prev) => prev.map((l) => (l.id === activeLayer.id ? { ...l, mask: m } : l)));
        activeLayer.mask = m;
      }
      targetCanvas = activeLayer.mask || null;
    } else if (activeLayer.type === 'drawing' && activeLayer.drawingCanvas) {
      targetCanvas = activeLayer.drawingCanvas;
    }

    if (!targetCanvas) return;
    const octx = targetCanvas.getContext('2d');
    if (!octx) return;

    const { x, y } = getCanvasCoordinates(e);

    // Save pre-stroke snapshot in case a 2nd finger lands for pinch-zoom
    try {
      preStrokeImageDataRef.current = {
        canvas: targetCanvas,
        data: octx.getImageData(0, 0, targetCanvas.width, targetCanvas.height),
      };
    } catch {
      preStrokeImageDataRef.current = null;
    }

    strokeStartRef.current = { x, y };
    strokePointsRef.current = [{ x, y }];
    drawingTargetCanvasRef.current = targetCanvas;
    drawingMaskRef.current = !!activeLayer.isEditingMask;

    if (activeLayer.isEditingMask) {
      const paintHide = maskPaintMode === 'hide';
      const colorForMask =
        tool === 'erase' ? (paintHide ? '#ffffff' : '#000000') : paintHide ? '#000000' : '#ffffff';
      drawSoftStroke(octx, x, y, x, y, brushSize, colorForMask, maskBrushSoftness, maskBrushOpacity);
    } else if (tool === 'erase') {
      octx.save();
      octx.globalCompositeOperation = 'destination-out';
      octx.globalAlpha = 1;
      octx.shadowBlur = 0;
      octx.beginPath();
      octx.arc(x, y, Math.max(1, brushSize / 2), 0, Math.PI * 2);
      octx.fill();
      octx.restore();
    } else if (brushStyle === 'fluorescent' && !censorMode) {
      drawFluorescentSegment(octx, x, y, x, y, brushSize, color, drawOpacity, neonBloom);
    } else {
      octx.save();
      octx.globalCompositeOperation = 'source-over';
      octx.globalAlpha = Math.max(0.02, drawOpacity / 100);
      octx.fillStyle = censorMode ? '#000000' : color;
      octx.shadowColor = censorMode ? 'transparent' : color;
      octx.shadowBlur = censorMode ? 0 : (neonBloom / 100) * 24;
      octx.beginPath();
      octx.arc(x, y, Math.max(1, brushSize / 2), 0, Math.PI * 2);
      octx.fill();
      octx.restore();
    }

    setIsDrawing(true);
    try {
      canvas.setPointerCapture?.(e.pointerId);
      activePointerIdRef.current = e.pointerId;
    } catch {}
    redrawAll();
  };

  // Abort accidental 1-finger stroke when 2nd finger touches for pinch/pan
  const cancelActiveStrokeForPinch = () => {
    if (isDrawing && preStrokeImageDataRef.current) {
      try {
        const { canvas: tc, data } = preStrokeImageDataRef.current;
        const tctx = tc.getContext('2d');
        if (tctx) tctx.putImageData(data, 0, 0);
      } catch {}
    }
    preStrokeImageDataRef.current = null;
    setIsDrawing(false);
    isDrawingShapeRef.current = false;
    shapeStartRef.current = null;
    shapeCurrentRef.current = null;
    drawingTargetCanvasRef.current = null;
    setIsDraggingLayer(false);
    setIsResizing(false);
    setIsRotating(false);
    redrawAll();
  };

  // Handle canvas click (selection, handles, text placement)
  const handleCanvasClick = (e: React.PointerEvent<HTMLCanvasElement>): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const { x, y } = getCanvasCoordinates(e);

    if (tool === 'placeText') {
      const content = textValue.trim() || 'TEXTO UV';
      const id = `layer-txt-${Date.now()}`;
      const newLayer: Layer = {
        id,
        type: 'text',
        name: content.substring(0, 20),
        visible: true,
        opacity: drawOpacity,
        locked: false,
        x,
        y,
        rotation: 0,
        text: content,
        size: textSize,
        color,
        fontStyle,
        bloom: neonBloom,
      };
      setLayers((prev) => [...prev, newLayer]);
      setSelectedLayer(id);
      setTool('select');
      setTextValue('');
      redrawAll();
      setTimeout(() => pushHistory(), 0);
      return true;
    }

    if (tool === 'draw' || tool === 'erase' || isShapeTool(tool)) {
      return false;
    }

    // Check resize / rotation handles of currently selected layer
    const curSelId = selectedLayerRef.current;
    if (curSelId) {
      const s = layersRef.current.find((l) => l.id === curSelId);
      if (s && !s.locked && (s.type === 'image' || s.type === 'text')) {
        const bounds = getLayerBounds(s, ctx);
        if (bounds) {
          const rotation = s.rotation || 0;
          const layerCenterX = bounds.x + bounds.w / 2;
          const layerCenterY = bounds.y + bounds.h / 2;
          const dx = x - layerCenterX;
          const dy = y - layerCenterY;
          const cosR = Math.cos(-rotation);
          const sinR = Math.sin(-rotation);
          const localX = layerCenterX + (dx * cosR - dy * sinR);
          const localY = layerCenterY + (dx * sinR + dy * cosR);

          const zoom = scaleRef.current || 1;
          const hitR = Math.max(16, 22 / zoom);
          const rotOffset = Math.max(24, 28 / zoom);

          const rotHandle = { x: bounds.x + bounds.w / 2, y: bounds.y - rotOffset };
          if (Math.hypot(localX - rotHandle.x, localY - rotHandle.y) <= hitR) {
            setIsRotating(true);
            try {
              canvas.setPointerCapture?.(e.pointerId);
              activePointerIdRef.current = e.pointerId;
            } catch {}
            return true;
          }

          const corners = [
            { x: bounds.x, y: bounds.y, pos: 'nw' },
            { x: bounds.x + bounds.w, y: bounds.y, pos: 'ne' },
            { x: bounds.x, y: bounds.y + bounds.h, pos: 'sw' },
            { x: bounds.x + bounds.w, y: bounds.y + bounds.h, pos: 'se' },
          ];
          for (const h of corners) {
            if (Math.hypot(localX - h.x, localY - h.y) <= hitR) {
              setIsResizing(true);
              setResizeHandle(h.pos);
              if (s.type === 'image' && s.img) {
                resizeStartRef.current = {
                  x: s.x || 0,
                  y: s.y || 0,
                  width: (s.img.naturalWidth || s.width || 100) * (s.scale || 1),
                  height: (s.img.naturalHeight || s.height || 100) * (s.scale || 1),
                  scale: s.scale || 1,
                };
              } else {
                resizeStartRef.current = {
                  x: s.x || 0,
                  y: s.y || 0,
                  width: bounds.w,
                  height: bounds.h,
                  scale: s.size || textSize,
                };
              }
              try {
                canvas.setPointerCapture?.(e.pointerId);
                activePointerIdRef.current = e.pointerId;
              } catch {}
              return true;
            }
          }
        }
      }
    }

    // Hit-test layers from top to bottom (rotation-aware for images/stamps/text)
    const curLayers = layersRef.current;
    for (let i = curLayers.length - 1; i >= 0; i--) {
      const layer = curLayers[i];
      if (!layer.visible || layer.locked) continue;
      if (layer.type === 'image' || layer.type === 'text') {
        const bounds = getLayerBounds(layer, ctx);
        if (!bounds) continue;
        const rot = layer.rotation || 0;
        const cx = bounds.x + bounds.w / 2;
        const cy = bounds.y + bounds.h / 2;
        const dx = x - cx;
        const dy = y - cy;
        const localX = cx + (dx * Math.cos(-rot) - dy * Math.sin(-rot));
        const localY = cy + (dx * Math.sin(-rot) + dy * Math.cos(-rot));

        if (
          localX >= bounds.x - 6 &&
          localX <= bounds.x + bounds.w + 6 &&
          localY >= bounds.y - 6 &&
          localY <= bounds.y + bounds.h + 6
        ) {
          setSelectedLayer(layer.id);
          dragOffsetRef.current = { ox: x - (layer.x || 0), oy: y - (layer.y || 0) };
          setIsDraggingLayer(true);
          try {
            canvas.setPointerCapture?.(e.pointerId);
            activePointerIdRef.current = e.pointerId;
          } catch {}
          return true;
        }
      }
    }

    setSelectedLayer(null);
    return false;
  };

  // Pointer handlers on canvas
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const prevScale = scaleRef.current || 1;
    const factor = Math.exp(-e.deltaY * 0.0012);
    const newScale = Math.min(4, Math.max(0.4, prevScale * factor));

    const worldX = (mouseX - panRef.current.x) / prevScale;
    const worldY = (mouseY - panRef.current.y) / prevScale;

    scaleRef.current = newScale;
    panRef.current.x = mouseX - worldX * newScale;
    panRef.current.y = mouseY - worldY * newScale;
    clampPan();
    redrawAll();
  };

  const handlePointerDownGeneric = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // If 2nd finger lands -> abort any accidental stroke and start pinch/pan
    if (pointerMapRef.current.size >= 2) {
      cancelActiveStrokeForPinch();
      return;
    }

    // Middle or right button -> pan
    if (e.button === 1 || e.button === 2) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        activePointerIdRef.current = e.pointerId;
      } catch {}
      return;
    }

    // Preview mode interactions
    if (previewModeRef.current === 'naked') {
      return;
    }
    if (previewModeRef.current === 'flashlight') {
      flashlightPosRef.current = getCanvasCoordinates(e);
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        activePointerIdRef.current = e.pointerId;
      } catch {}
      redrawAll();
      return;
    }

    // Shape tool start
    if (isShapeTool(tool)) {
      const pos = getCanvasCoordinates(e);
      shapeStartRef.current = pos;
      shapeCurrentRef.current = { ...pos, shiftKey: e.shiftKey };
      isDrawingShapeRef.current = true;
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        activePointerIdRef.current = e.pointerId;
      } catch {}
      redrawAll();
      return;
    }

    const handled = handleCanvasClick(e);
    if (!handled && (tool === 'draw' || tool === 'erase')) {
      startDrawing(e);
    }
  };

  const handlePointerMoveGeneric = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerMapRef.current.has(e.pointerId)) {
      pointerMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // 2-finger pinch-zoom + pan
    if (pointerMapRef.current.size >= 2) {
      const pts = Array.from(pointerMapRef.current.values());
      const a = pts[0];
      const b = pts[1];
      const dist = Math.max(10, Math.hypot(b.x - a.x, b.y - a.y));
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

      if (!pinchStartRef.current) {
        pinchStartRef.current = {
          distance: dist,
          center,
          startScale: scaleRef.current || 1,
          startPan: { ...panRef.current },
        };
      } else {
        const ps = pinchStartRef.current;
        const ratio = dist / ps.distance;
        const newScale = Math.max(0.4, Math.min(4, ps.startScale * ratio));
        const dx = center.x - ps.center.x;
        const dy = center.y - ps.center.y;
        scaleRef.current = newScale;
        panRef.current = {
          x: ps.startPan.x + dx,
          y: ps.startPan.y + dy,
        };
        clampPan();
        redrawAll();
      }
      return;
    }

    latestMoveRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      pointerId: e.pointerId,
      buttons: e.buttons,
      shiftKey: e.shiftKey,
    };

    if (moveScheduledRef.current) return;
    moveScheduledRef.current = true;

    requestAnimationFrame(() => {
      moveScheduledRef.current = false;
      const m = latestMoveRef.current;
      if (!m) return;

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

      // Flashlight tracking (mouse hover or touch drag)
      if (previewModeRef.current === 'flashlight') {
        flashlightPosRef.current = getCanvasCoordinates(m);
        redrawAll();
        return;
      }

      if (previewModeRef.current === 'naked') return;

      // Update brush cursor overlay
      try {
        const canvasEl = canvasRef.current;
        const containerEl = canvasContainerRef.current;
        const rect = canvasEl?.getBoundingClientRect();
        const containerRect = containerEl?.getBoundingClientRect();
        if (rect && canvasEl && containerRect) {
          const bufferWidth = canvasEl.width / (dprRef.current || 1);
          const bufferHeight = canvasEl.height / (dprRef.current || 1);
          const canvasAspect = bufferWidth / bufferHeight;
          const displayAspect = rect.width / rect.height;
          const renderedWidth =
            canvasAspect < displayAspect ? rect.height * canvasAspect : rect.width;
          const objectFitScale = renderedWidth / bufferWidth;
          const visualSize = Math.max(6, brushSize * objectFitScale * (scaleRef.current || 1));
          setMaskCursor({
            x: m.clientX - containerRect.left,
            y: m.clientY - containerRect.top,
            size: visualSize,
            visible: true,
          });
        }
      } catch {}

      // Shape drag update
      if (isDrawingShapeRef.current && shapeStartRef.current) {
        const pos = getCanvasCoordinates(m);
        shapeCurrentRef.current = { ...pos, shiftKey: m.shiftKey };
        redrawAll();
        return;
      }

      draw(m);
    });
  };

  const handlePointerUpGeneric = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerMapRef.current.delete(e.pointerId);
    if (pointerMapRef.current.size < 2) {
      pinchStartRef.current = null;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch {}
      return;
    }

    // Commit shape to drawing layer
    if (isDrawingShapeRef.current && shapeStartRef.current && shapeCurrentRef.current) {
      const start = shapeStartRef.current;
      const end = shapeCurrentRef.current;
      isDrawingShapeRef.current = false;
      shapeStartRef.current = null;
      shapeCurrentRef.current = null;

      if (Math.hypot(end.x - start.x, end.y - start.y) >= 2) {
        const activeLayer = ensureDrawingLayer();
        const targetCanvas = activeLayer?.drawingCanvas;
        const octx = targetCanvas?.getContext('2d');
        if (octx) {
          drawShapeOnContext(octx, tool, start.x, start.y, end.x, end.y, {
            color,
            lineWidth: brushSize,
            opacity: drawOpacity,
            bloom: neonBloom,
            brushStyle,
            shiftKey: end.shiftKey,
          });
          setTimeout(() => pushHistory(), 0);
        }
      }
      redrawAll();
      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch {}
      return;
    }

    stopDrawing();
  };

  const draw = (mouseEvent: any) => {
    lastMouseEventRef.current = mouseEvent;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoordinates(mouseEvent);

    // Handle resizing selected image/stamp/text
    if (isResizing && selectedLayerRef.current && resizeHandle && resizeStartRef.current) {
      const selId = selectedLayerRef.current;
      const s = layersRef.current.find((l) => l.id === selId);
      if (s) {
        const startData = resizeStartRef.current;
        const dxRaw = resizeHandle.includes('e') ? x - startData.x : startData.x - x;
        const dyRaw = resizeHandle.includes('s') ? y - startData.y : startData.y - y;
        const delta = Math.max(dxRaw, dyRaw);

        if (s.type === 'image' && s.img) {
          const baseDim = Math.max(40, s.img.naturalWidth || s.width || 100);
          const newScale = Math.max(0.08, Math.min(5, startData.scale + delta / baseDim));
          setLayers((prev) => prev.map((l) => (l.id === selId ? { ...l, scale: newScale } : l)));
        } else if (s.type === 'text') {
          const newSize = Math.max(10, Math.min(240, Math.round(startData.scale + delta / 2)));
          setLayers((prev) => prev.map((l) => (l.id === selId ? { ...l, size: newSize } : l)));
        }
        redrawAll();
      }
      return;
    }

    // Handle active freehand drawing
    if (isDrawing) {
      const targetCanvas = drawingTargetCanvasRef.current;
      if (!targetCanvas) return;
      const ctx = targetCanvas.getContext('2d');
      if (!ctx) return;

      const last = strokePointsRef.current[strokePointsRef.current.length - 1] || { x, y };

      if (drawingMaskRef.current) {
        const paintHide = maskPaintMode === 'hide';
        const colorForMask = maskUseEraser
          ? paintHide
            ? '#ffffff'
            : '#000000'
          : paintHide
          ? '#000000'
          : '#ffffff';
        drawSoftStroke(ctx, last.x, last.y, x, y, brushSize, colorForMask, maskBrushSoftness, maskBrushOpacity);
      } else if (tool === 'erase') {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
      } else if (brushStyle === 'fluorescent' && !censorMode) {
        drawFluorescentSegment(ctx, last.x, last.y, x, y, brushSize, color, drawOpacity, neonBloom);
      } else {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = Math.max(0.02, drawOpacity / 100);
        ctx.strokeStyle = censorMode ? '#000000' : color;
        ctx.shadowColor = censorMode ? 'transparent' : color;
        ctx.shadowBlur = censorMode ? 0 : (neonBloom / 100) * 24;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
      }

      strokePointsRef.current.push({ x, y });
      redrawAll();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    drawingTargetCanvasRef.current = null;
    strokeStartRef.current = null;
    strokePointsRef.current = [];
    preStrokeImageDataRef.current = null;
    setTimeout(() => pushHistory(), 0);
  };

  // Window-level pointer move/up for smooth layer dragging & rotation
  useEffect(() => {
    const handleMove = (ev: PointerEvent) => {
      if (pointerMapRef.current.size >= 2) return;
      if (!isDraggingLayer && !isRotating) return;

      const selId = selectedLayerRef.current;
      if (!selId) return;
      const { x, y } = getCanvasCoordinates(ev);

      if (isDraggingLayer) {
        let nextX = x - (dragOffsetRef.current?.ox || 0);
        let nextY = y - (dragOffsetRef.current?.oy || 0);
        const cssW = cssWidthRef.current || 800;
        const cssH = cssHeightRef.current || 600;
        const ctx = canvasRef.current?.getContext('2d') || null;
        const curLayer = layersRef.current.find((l) => l.id === selId);
        let snapX = false;
        let snapY = false;
        if (curLayer) {
          const previewLayer = { ...curLayer, x: nextX, y: nextY };
          const bounds = getLayerBounds(previewLayer, ctx);
          if (bounds) {
            const cx = bounds.x + bounds.w / 2;
            const cy = bounds.y + bounds.h / 2;
            const threshold = 8 / (scaleRef.current || 1);
            if (Math.abs(cx - cssW / 2) <= threshold) {
              nextX += cssW / 2 - cx;
              snapX = true;
            }
            if (Math.abs(cy - cssH / 2) <= threshold) {
              nextY += cssH / 2 - cy;
              snapY = true;
            }
          }
        }
        snapGuidesRef.current = { x: snapX, y: snapY };
        setLayers((prev) =>
          prev.map((l) =>
            l.id !== selId
              ? l
              : {
                  ...l,
                  x: nextX,
                  y: nextY,
                }
          )
        );
        redrawAll();
      } else if (isRotating) {
        const s = layersRef.current.find((l) => l.id === selId);
        const ctx = canvasRef.current?.getContext('2d') || null;
        if (s) {
          const bounds = getLayerBounds(s, ctx);
          const cx = bounds ? bounds.x + bounds.w / 2 : s.x || 0;
          const cy = bounds ? bounds.y + bounds.h / 2 : s.y || 0;
          // Offset by +PI/2 because rotation handle is at the top (-PI/2)
          const newRotation = Math.atan2(y - cy, x - cx) + Math.PI / 2;
          setLayers((prev) =>
            prev.map((l) => (l.id === selId ? { ...l, rotation: newRotation } : l))
          );
          redrawAll();
        }
      }
    };

    const handleUp = (ev: PointerEvent) => {
      pointerMapRef.current.delete(ev.pointerId);
      if (pointerMapRef.current.size < 2) pinchStartRef.current = null;

      let changed = false;
      if (isDraggingLayer) {
        setIsDraggingLayer(false);
        snapGuidesRef.current = { x: false, y: false };
        redrawAll();
        changed = true;
      }
      if (isResizing) {
        setIsResizing(false);
        setResizeHandle(null);
        resizeStartRef.current = null;
        changed = true;
      }
      if (isRotating) {
        setIsRotating(false);
        changed = true;
      }
      if (changed) {
        setTimeout(() => pushHistory(), 0);
      }
      try {
        const pid = activePointerIdRef.current;
        if (canvasRef.current && pid != null) {
          canvasRef.current.releasePointerCapture?.(pid);
        }
        activePointerIdRef.current = null;
      } catch {}
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isDraggingLayer, isResizing, isRotating, redrawAll]);

  // Double-click text layer to edit inline
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (previewModeRef.current !== 'edit') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { x, y } = getCanvasCoordinates(e);

    for (let i = layersRef.current.length - 1; i >= 0; i--) {
      const layer = layersRef.current[i];
      if (!layer.visible || layer.locked || layer.type !== 'text') continue;
      const bounds = getLayerBounds(layer, ctx);
      if (
        bounds &&
        x >= bounds.x &&
        x <= bounds.x + bounds.w &&
        y >= bounds.y &&
        y <= bounds.y + bounds.h
      ) {
        const s = scaleRef.current || 1;
        const p = panRef.current || { x: 0, y: 0 };
        setInlineTextEdit({
          id: layer.id,
          value: layer.text || '',
          cssX: (layer.x || 0) * s + p.x,
          cssY: (layer.y || 0) * s + p.y,
          fontSize: (layer.size || textSize) * s,
        });
        return;
      }
    }
  };

  // Clean PNG export (NO handles, NO flashlight mask, NO zoom/pan distortion)
  const handleFinish = () => {
    const dpr = dprRef.current || 1;
    const cssW = cssWidthRef.current || 800;
    const cssH = cssHeightRef.current || 600;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Math.round(cssW * dpr);
    exportCanvas.height = Math.round(cssH * dpr);
    const ectx = exportCanvas.getContext('2d');
    if (!ectx) return;

    ectx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ectx.clearRect(0, 0, cssW, cssH);

    // Render all visible layers cleanly (base image + drawings + shapes + texts + stamps + images)
    renderLayersList(ectx, layersRef.current, cssW, cssH, dpr, false);

    // Forensic RGB channel merge (100% backwards-compatible)
    if (mode === 'rgb' && targetChannel) {
      try {
        const imgData = ectx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
        const data = imgData.data;

        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = exportCanvas.width;
        baseCanvas.height = exportCanvas.height;
        const baseCtx = baseCanvas.getContext('2d');
        const baseLayer = layersRef.current.find((l) => l.id === '__base_image');
        if (baseCtx && baseLayer) {
          baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawLayerToContext(baseCtx, baseLayer, cssW, cssH);
          const bData = baseCtx.getImageData(0, 0, exportCanvas.width, exportCanvas.height).data;
          for (let i = 0; i < data.length; i += 4) {
            if (targetChannel === 'R') {
              data[i + 1] = bData[i + 1];
              data[i + 2] = bData[i + 2];
            } else if (targetChannel === 'G') {
              data[i] = bData[i];
              data[i + 2] = bData[i + 2];
            } else if (targetChannel === 'B') {
              data[i] = bData[i];
              data[i + 1] = bData[i + 1];
            }
            data[i + 3] = bData[i + 3];
          }
          ectx.putImageData(imgData, 0, 0);
        }
      } catch (err) {
        console.error('Error applying forensic RGB merge', err);
      }
    }

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const timestamp = Date.now();
      const prefix =
        mode === 'rgb'
          ? 'forensic_rgb'
          : mode === 'filter'
          ? 'filter'
          : mode === 'thermal'
          ? 'thermal'
          : 'uv';
      const suffix = mode === 'rgb' && targetChannel ? `_${targetChannel}` : '';
      const filename = `${prefix}_layer${suffix}_${timestamp}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      const uvAuthoringState = serializeLayersToAuthoringState(
        layersRef.current,
        cssW,
        cssH
      );
      const meta: { targetChannel?: 'R' | 'G' | 'B'; uvAuthoringState?: UVAuthoringState } = {
        uvAuthoringState,
      };
      if (mode === 'rgb' && targetChannel) {
        meta.targetChannel = targetChannel;
      }

      baselineFingerprintRef.current = dirtyFingerprint;
      try {
        onSave(file, meta);
      } catch {
        onSave(file);
      }
    }, 'image/png');
  };

  const handleFitToBaseProportion = () => {
    resetView();
    const cssW = cssWidthRef.current || 800;
    const cssH = cssHeightRef.current || 600;
    const selId = selectedLayerRef.current;
    if (!selId || selId === '__base_image') return;

    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== selId) return l;
        if (l.type === 'image') {
          const baseW = l.width || l.img?.naturalWidth || 160;
          const baseH = l.height || l.img?.naturalHeight || 160;
          const targetRatio = Math.min((cssW * 0.72) / baseW, (cssH * 0.72) / baseH);
          const nextScale = Math.max(0.1, Math.min(3, Number(targetRatio.toFixed(2))));
          return {
            ...l,
            x: (cssW - baseW * nextScale) / 2,
            y: (cssH - baseH * nextScale) / 2,
            scale: nextScale,
            rotation: 0,
          };
        }
        if (l.type === 'text') {
          return {
            ...l,
            x: cssW / 2,
            y: cssH / 2,
            rotation: 0,
          };
        }
        return l;
      })
    );
    setTimeout(() => pushHistory(), 0);
  };

  const applyUVPreset = (preset: UVStylePreset) => {
    setColor(preset.color);
    setBrushStyle(preset.brushStyle);
    setNeonBloom(preset.neonBloom);
    setDrawOpacity(preset.drawOpacity);
    setFontStyle(preset.fontStyle);
    if (selectedLayer && selectedLayer !== '__base_image') {
      setLayers((prev) =>
        prev.map((l) =>
          l.id === selectedLayer
            ? {
                ...l,
                color: preset.color,
                stampColor: l.isStamp ? preset.color : l.stampColor,
                bloom: preset.neonBloom,
                opacity: preset.drawOpacity,
                fontStyle: l.type === 'text' ? preset.fontStyle : l.fontStyle,
              }
            : l
        )
      );
    }
  };

  const handleSaveCustomUVPreset = () => {
    const name = window.prompt('Nome do preset UV:');
    if (!name || !name.trim()) return;
    const nextPreset: UVStylePreset = {
      id: `custom-uv-${Date.now()}`,
      label: name.trim(),
      color,
      brushStyle,
      neonBloom,
      drawOpacity,
      fontStyle,
      custom: true,
    };
    const updated = [...customPresets, nextPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem(UV_PRESETS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteCustomUVPreset = (id: string) => {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    try {
      localStorage.setItem(UV_PRESETS_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Layer management actions
  const deleteLayer = (id: string) => {
    if (id === '__base_image') return;
    setLayers((prev) => {
      const removed = prev.find((l) => l.id === id);
      if (removed) {
        if (removed.type === 'drawing' && removed.drawingCanvas) {
          removed.drawingCanvas.width = 0;
          removed.drawingCanvas.height = 0;
        }
        return prev.filter((l) => l.id !== id);
      }
      return prev.map((l) =>
        l.type === 'group' && l.childrenData
          ? { ...l, childrenData: l.childrenData.filter((c) => c.id !== id) }
          : l
      );
    });
    setSelectedLayer((prev) => (prev === id ? null : prev));
    setTimeout(() => pushHistory(), 0);
  };

  const selectLayer = (id: string) => {
    setSelectedLayer(id);
    const found = layersRef.current.find((l) => l.id === id);
    if (found && (found.type === 'image' || found.type === 'text')) {
      setTool('select');
    } else if (found && found.type === 'drawing' && !found.locked) {
      setTool('draw');
    }
    redrawAll();
  };

  const addEmptyTextLayer = () => {
    const cssW = cssWidthRef.current || 800;
    const cssH = cssHeightRef.current || 600;
    const id = `layer-txt-${Date.now()}`;
    const newLayer: Layer = {
      id,
      type: 'text',
      name: textValue.trim() || 'Texto UV',
      visible: true,
      opacity: drawOpacity,
      locked: false,
      x: cssW * 0.35,
      y: cssH * 0.45,
      rotation: 0,
      text: textValue.trim() || 'Pista Oculta',
      size: textSize,
      color,
      fontStyle,
      bloom: neonBloom,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayer(id);
    setTool('select');
    redrawAll();
    setTimeout(() => pushHistory(), 0);
  };

  const addEmptyDrawingLayer = () => {
    const dpr = dprRef.current || 1;
    const cssW = cssWidthRef.current || 800;
    const cssH = cssHeightRef.current || 600;
    const drawCanvas = document.createElement('canvas');
    drawCanvas.width = Math.round(cssW * dpr);
    drawCanvas.height = Math.round(cssH * dpr);
    const drawCtx = drawCanvas.getContext('2d');
    if (drawCtx) drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const id = `layer-draw-${Date.now()}`;
    const newLayer: Layer = {
      id,
      type: 'drawing',
      name: `Camada UV ${layers.filter((l) => l.type === 'drawing' && l.id !== '__base_image').length + 1}`,
      visible: true,
      opacity: 100,
      locked: false,
      drawingCanvas: drawCanvas,
      x: 0,
      y: 0,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayer(id);
    setTool('draw');
    redrawAll();
    setTimeout(() => pushHistory(), 0);
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
    setTimeout(() => pushHistory(), 0);
  };

  const toggleLayerLock = (id: string) => {
    if (id === '__base_image') return;
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)));
    setTimeout(() => pushHistory(), 0);
  };

  const updateLayerOpacity = (id: string, opacity: number) => {
    const clamped = Math.max(0, Math.min(100, opacity));
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, opacity: clamped } : l)));
    setTimeout(() => pushHistory(), 0);
  };

  const renameLayer = (id: string, newName: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, name: newName } : l)));
    setEditingLayerName(null);
    setTimeout(() => pushHistory(), 0);
  };

  const duplicateLayer = (id: string) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx < 0 || id === '__base_image') return;
    const layer = layers[idx];
    const newId = `layer-${Date.now()}`;
    const dup: Layer = {
      ...layer,
      id: newId,
      name: `${layer.name} (cópia)`,
      x: (layer.x || 0) + 20,
      y: (layer.y || 0) + 20,
    };
    setLayers((prev) => [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)]);
    setSelectedLayer(newId);
    setTimeout(() => pushHistory(), 0);
  };

  const rasterizeLayer = (id: string) => {
    const layerIndex = layers.findIndex((l) => l.id === id);
    if (layerIndex === -1) return;
    const l = layers[layerIndex];
    if (l.type === 'drawing' || l.type === 'group') {
      toast.error('Apenas camadas de Imagem, Carimbo ou Texto podem ser rasterizadas.');
      return;
    }
    const dpr = dprRef.current || 1;
    const cssW = cssWidthRef.current || 800;
    const cssH = cssHeightRef.current || 600;
    const cvs = document.createElement('canvas');
    cvs.width = Math.round(cssW * dpr);
    cvs.height = Math.round(cssH * dpr);
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLayerToContext(ctx, l, cssW, cssH);

    const newLayer: Layer = {
      ...l,
      type: 'drawing',
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      drawingCanvas: cvs,
      img: undefined,
      text: undefined,
      size: undefined,
    };
    setLayers((prev) => {
      const next = [...prev];
      next[layerIndex] = newLayer;
      return next;
    });
    toast.success(`Camada "${l.name}" rasterizada.`);
    setTimeout(() => pushHistory(), 0);
  };

  const createGroup = (checkedIds: string[]) => {
    const valid = checkedIds.filter((id) => id !== '__base_image');
    if (valid.length < 2) return;
    const selected = layers.filter((l) => valid.includes(l.id));
    if (selected.length < 2) return;
    const cx = selected.reduce((sum, l) => sum + (l.x || 0), 0) / selected.length;
    const cy = selected.reduce((sum, l) => sum + (l.y || 0), 0) / selected.length;
    const childrenData = selected.map((l) => ({
      ...l,
      x: (l.x || 0) - cx,
      y: (l.y || 0) - cy,
    }));
    const remaining = layers.filter((l) => !valid.includes(l.id));
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
      childrenData,
    };
    setLayers([...remaining, groupLayer]);
    setSelectedLayer(groupLayer.id);
    setTimeout(() => pushHistory(), 0);
  };

  const moveLayer = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...layers];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setLayers(next);
    setTimeout(() => pushHistory(), 0);
  };

  const batchDelete = (ids: string[]) => {
    const safeIds = ids.filter((id) => id !== '__base_image');
    setLayers((prev) => prev.filter((l) => !safeIds.includes(l.id)));
    setSelectedLayer((prev) => (prev && safeIds.includes(prev) ? null : prev));
    setTimeout(() => pushHistory(), 0);
  };

  const batchLock = (ids: string[]) => {
    setLayers((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, locked: true } : l)));
  };

  const batchUnlock = (ids: string[]) => {
    setLayers((prev) =>
      prev.map((l) => (ids.includes(l.id) && l.id !== '__base_image' ? { ...l, locked: false } : l))
    );
  };

  const addMaskToLayer = (id: string, mask: HTMLCanvasElement) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, mask } : l)));
    setTimeout(() => pushHistory(), 0);
  };

  const setLayerBlendMode = (id: string, blendMode: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, blendMode } : l)));
    setTimeout(() => pushHistory(), 0);
  };

  const toggleEditMask = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isEditingMask: !l.isEditingMask } : l))
    );
  };

  const invertMask = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer || !layer.mask) return;
    const mctx = layer.mask.getContext('2d');
    if (!mctx) return;
    const img = mctx.getImageData(0, 0, layer.mask.width, layer.mask.height);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = 255 - img.data[i];
      img.data[i + 1] = 255 - img.data[i + 1];
      img.data[i + 2] = 255 - img.data[i + 2];
    }
    mctx.putImageData(img, 0, 0);
    redrawAll();
  };

  const clearMask = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer || !layer.mask) return;
    const mctx = layer.mask.getContext('2d');
    if (!mctx) return;
    mctx.fillStyle = '#ffffff';
    mctx.fillRect(0, 0, layer.mask.width, layer.mask.height);
    redrawAll();
  };

  const handleReorder = (
    source: { droppableId: string; index: number },
    destination: { droppableId: string; index: number }
  ) => {
    if (source.droppableId === 'layers-list' && destination.droppableId === 'layers-list') {
      moveLayer(source.index, destination.index);
    }
  };

  const activeLayerObj = layers.find((l) => l.id === selectedLayer) || null;
  const isTransformableSelected =
    activeLayerObj &&
    !activeLayerObj.locked &&
    (activeLayerObj.type === 'image' || activeLayerObj.type === 'text');

  return (
    <div className={`uv-editor-panel uv-mode-${previewMode}`} ref={rootRef}>
      {/* HEADER WITH 3-MODE LIVE SIMULATOR */}
      <div className="uv-editor-header">
        <div className="uv-header-title">
          {mode === 'rgb' ? (
            <>
              <Radio size={17} className="header-icon icon-rgb" /> <span>Editor RGB Forense</span>
            </>
          ) : mode === 'filter' ? (
            <>
              <Palette size={17} className="header-icon icon-filter" /> <span>Editor de Filtros</span>
            </>
          ) : mode === 'thermal' ? (
            <>
              <Sparkles size={17} className="header-icon icon-thermal" /> <span>Editor Termal</span>
            </>
          ) : (
            <>
              <Eye size={17} className="header-icon icon-uv" /> <span>Editor UV // C.R.I.S.</span>
            </>
          )}
        </div>

        {/* 3-Mode Live Simulator Toggle */}
        <div className="uv-preview-switcher" role="tablist" aria-label="Simulador Ao Vivo">
          <button
            type="button"
            role="tab"
            aria-selected={previewMode === 'edit'}
            className={`uv-preview-btn ${previewMode === 'edit' ? 'active' : ''}`}
            onClick={() => setPreviewMode('edit')}
            title="Visão de autoria com camadas, seleção e ferramentas ativas"
          >
            <PenTool size={14} />
            <span>Edição Mestre</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={previewMode === 'naked'}
            className={`uv-preview-btn ${previewMode === 'naked' ? 'active' : ''}`}
            onClick={() => setPreviewMode('naked')}
            title="Exibe apenas a imagem base sem a camada UV (visão do jogador sem lanterna)"
          >
            <EyeOff size={14} />
            <span>Olho Nu / Sem UV</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={previewMode === 'flashlight'}
            className={`uv-preview-btn uv-preview-btn--uv ${previewMode === 'flashlight' ? 'active' : ''}`}
            onClick={() => {
              if (!flashlightPosRef.current) {
                flashlightPosRef.current = {
                  x: (cssWidthRef.current || 800) / 2,
                  y: (cssHeightRef.current || 600) / 2,
                };
              }
              setPreviewMode('flashlight');
            }}
            title="Arraste o cursor ou o dedo para testar a lanterna UV em tempo real"
          >
            <Flashlight size={14} />
            <span>Testar Lanterna UV</span>
          </button>
        </div>

        <div className="uv-header-actions">
          <button
            type="button"
            className="uv-mobile-panel-toggle"
            onClick={() => setMobilePanelOpen((v) => !v)}
            aria-label="Alternar painel de propriedades e carimbos"
          >
            <SlidersHorizontal size={15} />
            <span>{mobilePanelOpen ? 'Canvas' : 'Painel'}</span>
          </button>
          <button
            type="button"
            onClick={handleFitToBaseProportion}
            className="uv-preview-btn"
            title="Centralizar e encaixar na proporção da imagem base"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Target size={14} /> Encaixar na Proporção da Base</span>
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="uv-action-save"
            title="Salvar camada UV"
          >
            <Save size={14} /> <span>Salvar</span>
          </button>
          <button
            type="button"
            onClick={() => guardClose()}
            className="uv-action-close"
            title="Fechar editor"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* LEFT / TOP TOOLBAR */}
      <UVToolbar
        onAddImageLayer={(f) => addImageLayerFromFile(f)}
        onUndo={undo}
        onRedo={redo}
        undoAvailable={undoAvailable}
        redoAvailable={redoAvailable}
        onResetView={resetView}
        onOpenStamps={() => {
          setActiveRightTab('stamps');
          setMobilePanelOpen(true);
        }}
        stampsActive={activeRightTab === 'stamps'}
      />

      {/* CENTER VIEWPORT */}
      <div className="uv-editor-viewport">
        {previewMode === 'naked' && (
          <div className="uv-sim-banner uv-sim-banner--naked">
            <EyeOff size={14} /> Modo Olho Nu — Simulando visão do agente sem lanterna UV
          </div>
        )}
        {previewMode === 'flashlight' && (
          <div className="uv-sim-banner uv-sim-banner--uv">
            <Flashlight size={14} />
            <span>Arraste o cursor ou o dedo sobre a imagem</span>
            <label className="uv-sim-radius">
              <span>Raio</span>
              <input
                type="range"
                min={50}
                max={280}
                value={flashlightRadius}
                onChange={(e) => setFlashlightRadius(Number(e.target.value))}
              />
            </label>
          </div>
        )}

        <div ref={canvasContainerRef} className="viewport-canvas" style={{ touchAction: 'none' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onPointerDown={handlePointerDownGeneric}
            onPointerMove={handlePointerMoveGeneric}
            onPointerUp={handlePointerUpGeneric}
            onPointerCancel={handlePointerUpGeneric}
            onPointerLeave={() => setMaskCursor((prev) => ({ ...prev, visible: false }))}
            onWheel={handleWheel}
            onDoubleClick={handleCanvasDoubleClick}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              touchAction: 'none',
              cursor:
                previewMode === 'flashlight'
                  ? 'none'
                  : previewMode === 'naked'
                  ? 'default'
                  : tool === 'select'
                  ? 'default'
                  : 'crosshair',
              display: 'block',
            }}
          />

          {inlineTextEdit && (
            <textarea
              autoFocus
              defaultValue={inlineTextEdit.value}
              onBlur={(ev) => {
                const newText = ev.target.value;
                setLayers((prev) =>
                  prev.map((l) => (l.id === inlineTextEdit.id ? { ...l, text: newText } : l))
                );
                setInlineTextEdit(null);
                redrawAll();
                setTimeout(() => pushHistory(), 0);
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
                left: `${inlineTextEdit.cssX}px`,
                top: `${inlineTextEdit.cssY}px`,
                fontSize: `${inlineTextEdit.fontSize}px`,
                background: 'rgba(11, 12, 16, 0.85)',
                color: '#fff',
                border: '1px solid #a855f7',
                padding: 6,
                minWidth: 120,
                maxWidth: 460,
                outline: 'none',
                zIndex: 1300,
              }}
            />
          )}

          {previewMode === 'edit' &&
            maskCursor.visible &&
            (tool === 'draw' || tool === 'erase') && (
              <div
                className="mask-cursor"
                style={{
                  left: `${maskCursor.x}px`,
                  top: `${maskCursor.y}px`,
                  width: `${maskCursor.size}px`,
                  height: `${maskCursor.size}px`,
                }}
              />
            )}
        </div>
      </div>

      {/* RIGHT PANEL: PROPERTIES / STAMPS / LAYERS */}
      <div className={`uv-right-panel ${mobilePanelOpen ? 'mobile-open' : ''}`}>
        <div className="uv-right-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeRightTab === 'properties'}
            className={`tab ${activeRightTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveRightTab('properties')}
          >
            <SlidersHorizontal size={13} /> Propriedades
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeRightTab === 'stamps'}
            className={`tab ${activeRightTab === 'stamps' ? 'active' : ''}`}
            onClick={() => setActiveRightTab('stamps')}
          >
            <Stamp size={13} /> Carimbos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeRightTab === 'layers'}
            className={`tab ${activeRightTab === 'layers' ? 'active' : ''}`}
            onClick={() => setActiveRightTab('layers')}
          >
            <LayersIcon size={13} /> Camadas ({layers.length})
          </button>
        </div>

        {activeRightTab === 'stamps' && (
          <div className="properties-panel uv-panel-scroll">
            <UVStampsPanel onInsertStamp={handleInsertStamp} />
          </div>
        )}

        {activeRightTab === 'properties' && (
          <div className="properties-panel uv-panel-scroll">
            {/* Explicit Import Image / Camera CTA */}
            <div className="uv-prop-card">
              <button
                type="button"
                className="uv-import-cta"
                onClick={() => importInputRef.current?.click()}
              >
                <Upload size={15} />
                <span>Importar Imagem / Câmera</span>
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) addImageLayerFromFile(f);
                  if (importInputRef.current) importInputRef.current.value = '';
                }}
              />
            </div>

            {/* UV Style Presets */}
            <div className="uv-prop-card">
              <div className="uv-prop-label-row">
                <label>
                  <Sparkles size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Presets de Estilo
                </label>
                <button
                  type="button"
                  className="uv-seg-btn"
                  style={{ flex: '0 0 auto', padding: '2px 8px', fontSize: 11 }}
                  onClick={handleSaveCustomUVPreset}
                  title="Salvar estilo atual no navegador"
                >
                  <BookmarkPlus size={11} /> Salvar
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {[...BUILTIN_UV_PRESETS, ...customPresets].map((preset) => (
                  <span key={preset.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    <button
                      type="button"
                      className="uv-seg-btn"
                      style={{ flex: '0 0 auto', padding: '4px 8px', fontSize: 11 }}
                      onClick={() => applyUVPreset(preset)}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: preset.color,
                          display: 'inline-block',
                          marginRight: 4,
                        }}
                      />
                      {preset.label}
                    </button>
                    {preset.custom && (
                      <button
                        type="button"
                        className="uv-seg-btn"
                        style={{ flex: '0 0 auto', padding: '4px 5px', fontSize: 10 }}
                        onClick={() => handleDeleteCustomUVPreset(preset.id)}
                        title="Excluir preset"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div className="uv-prop-card">
              <div className="uv-prop-label-row">
                <label>Cor Fluorescente / Tinta</label>
                <span className="uv-prop-value">{color.toUpperCase()}</span>
              </div>
              <div className="uv-swatches-grid">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    className={`uv-swatch-btn ${color.toLowerCase() === c.hex.toLowerCase() ? 'active' : ''}`}
                    style={{ backgroundColor: c.hex, boxShadow: c.glow }}
                    onClick={() => handleColorChange(c.hex)}
                    title={c.label}
                    aria-label={c.label}
                  />
                ))}
                <label className="uv-swatch-picker" title="Cor personalizada">
                  <input
                    type="color"
                    value={color.startsWith('#') ? color : '#b366ff'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    aria-label="Cor personalizada"
                  />
                  <span>+</span>
                </label>
              </div>
            </div>

            {/* RGB Forensic Channel Selector */}
            {mode === 'rgb' && (
              <div className="rgb-channel-container">
                <label className="rgb-channel-title">
                  <Target size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Canal Alvo RGB
                </label>
                <div className="rgb-channel-group">
                  {(['R', 'G', 'B'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => handleTargetChannelChange(ch)}
                      className={`rgb-channel-btn rgb-channel-btn--${ch.toLowerCase()} ${targetChannel === ch ? 'active' : ''}`}
                      aria-pressed={targetChannel === ch}
                    >
                      <span className={`channel-dot channel-dot--${ch.toLowerCase()}`} /> {ch}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brush Style & Size */}
            <div className="uv-prop-card">
              <div className="uv-prop-label-row">
                <label>Tipo de Pincel</label>
              </div>
              <div className="uv-segmented-row">
                <button
                  type="button"
                  className={`uv-seg-btn ${brushStyle === 'fluorescent' ? 'active' : ''}`}
                  onClick={() => setBrushStyle('fluorescent')}
                >
                  <Sparkles size={13} /> Suave Fluorescente
                </button>
                <button
                  type="button"
                  className={`uv-seg-btn ${brushStyle === 'solid' ? 'active' : ''}`}
                  onClick={() => setBrushStyle('solid')}
                >
                  <PenTool size={13} /> Sólido Clássico
                </button>
              </div>

              <div className="uv-slider-block">
                <div className="uv-prop-label-row">
                  <label>Espessura / Pincel</label>
                  <span className="uv-prop-value">{brushSize}px</span>
                </div>
                <input
                  className="uv-range"
                  type="range"
                  min={1}
                  max={120}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
              </div>

              <div className="uv-slider-block">
                <div className="uv-prop-label-row">
                  <label>Opacidade</label>
                  <span className="uv-prop-value">{drawOpacity}%</span>
                </div>
                <input
                  className="uv-range"
                  type="range"
                  min={0}
                  max={100}
                  value={drawOpacity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDrawOpacity(val);
                    if (isTransformableSelected && activeLayerObj) {
                      setLayers((prev) =>
                        prev.map((l) => (l.id === activeLayerObj.id ? { ...l, opacity: val } : l))
                      );
                    }
                  }}
                />
              </div>

              <div className="uv-slider-block">
                <div className="uv-prop-label-row">
                  <label>
                    <Sun size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    Intensidade Neon / Bloom
                  </label>
                  <span className="uv-prop-value">{neonBloom}%</span>
                </div>
                <input
                  className="uv-range"
                  type="range"
                  min={0}
                  max={100}
                  value={neonBloom}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNeonBloom(val);
                    if (isTransformableSelected && activeLayerObj) {
                      setLayers((prev) =>
                        prev.map((l) => (l.id === activeLayerObj.id ? { ...l, bloom: val } : l))
                      );
                    }
                  }}
                />
              </div>
            </div>

            {/* Diegetic Text Controls (shown for placeText tool OR selected text layer) */}
            {(tool === 'placeText' || activeLayerObj?.type === 'text') && (
              <div className="uv-prop-card">
                <div className="uv-prop-label-row">
                  <label>Texto UV &amp; Fonte Diegética</label>
                </div>

                {tool === 'placeText' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      type="text"
                      className="uv-text-input"
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      placeholder="Digite o texto e clique no canvas..."
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="uv-seg-btn active" onClick={addEmptyTextLayer}>
                        Inserir no Centro
                      </button>
                      <button
                        type="button"
                        className="uv-seg-btn"
                        onClick={() => {
                          setTextValue('');
                          setTool('select');
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="uv-font-grid">
                  {UV_FONT_STYLES.map((opt) => {
                    const currentFont: UVFontStyle =
                      activeLayerObj?.type === 'text'
                        ? activeLayerObj.fontStyle || 'mono'
                        : fontStyle;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`uv-font-btn ${currentFont === opt.id ? 'active' : ''}`}
                        onClick={() => {
                          setFontStyle(opt.id);
                          if (activeLayerObj?.type === 'text') {
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === activeLayerObj.id ? { ...l, fontStyle: opt.id } : l
                              )
                            );
                          }
                        }}
                      >
                        <span className="uv-font-title">{opt.label}</span>
                        <span
                          className="uv-font-sample"
                          style={{
                            fontFamily: opt.fontFamily,
                            fontStyle: opt.fontStyleCss || 'normal',
                            letterSpacing: `${opt.letterSpacing || 0}px`,
                          }}
                        >
                          {opt.sample}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="uv-slider-block">
                  <div className="uv-prop-label-row">
                    <label>Tamanho da Fonte</label>
                    <span className="uv-prop-value">
                      {activeLayerObj?.type === 'text' ? activeLayerObj.size || textSize : textSize}px
                    </span>
                  </div>
                  <input
                    className="uv-range"
                    type="range"
                    min={12}
                    max={160}
                    value={activeLayerObj?.type === 'text' ? activeLayerObj.size || textSize : textSize}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTextSize(val);
                      if (activeLayerObj?.type === 'text') {
                        setLayers((prev) =>
                          prev.map((l) => (l.id === activeLayerObj.id ? { ...l, size: val } : l))
                        );
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Transform Controls for Selected Stamp / Image / Text */}
            {isTransformableSelected && activeLayerObj && (
              <div className="uv-prop-card">
                <div className="uv-prop-label-row">
                  <label>Objeto Selecionado: {activeLayerObj.name}</label>
                </div>

                {activeLayerObj.type === 'image' && (
                  <div className="uv-slider-block">
                    <div className="uv-prop-label-row">
                      <label>Escala</label>
                      <span className="uv-prop-value">
                        {Math.round((activeLayerObj.scale || 1) * 100)}%
                      </span>
                    </div>
                    <input
                      className="uv-range"
                      type="range"
                      min={0.1}
                      max={3}
                      step={0.05}
                      value={activeLayerObj.scale || 1}
                      onChange={(e) => {
                        const s = Number(e.target.value);
                        setLayers((prev) =>
                          prev.map((l) => (l.id === activeLayerObj.id ? { ...l, scale: s } : l))
                        );
                      }}
                    />
                  </div>
                )}

                <div className="uv-slider-block">
                  <div className="uv-prop-label-row">
                    <label>
                      <RotateCw size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      Rotação
                    </label>
                    <span className="uv-prop-value">
                      {Math.round(((activeLayerObj.rotation || 0) * 180) / Math.PI)}°
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      className="uv-range"
                      type="range"
                      min={-180}
                      max={180}
                      value={Math.round(((activeLayerObj.rotation || 0) * 180) / Math.PI)}
                      onChange={(e) => {
                        const rad = (Number(e.target.value) * Math.PI) / 180;
                        setLayers((prev) =>
                          prev.map((l) =>
                            l.id === activeLayerObj.id ? { ...l, rotation: rad } : l
                          )
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="uv-seg-btn"
                      style={{ flex: '0 0 auto', padding: '4px 7px', fontSize: 11 }}
                      onClick={() =>
                        setLayers((prev) =>
                          prev.map((l) =>
                            l.id === activeLayerObj.id
                              ? { ...l, rotation: (l.rotation || 0) - Math.PI / 2 }
                              : l
                          )
                        )
                      }
                      title="Rotacionar -90°"
                    >
                      -90°
                    </button>
                    <button
                      type="button"
                      className="uv-seg-btn"
                      style={{ flex: '0 0 auto', padding: '4px 8px', fontSize: 11 }}
                      onClick={() =>
                        setLayers((prev) =>
                          prev.map((l) => (l.id === activeLayerObj.id ? { ...l, rotation: 0 } : l))
                        )
                      }
                    >
                      0°
                    </button>
                    <button
                      type="button"
                      className="uv-seg-btn"
                      style={{ flex: '0 0 auto', padding: '4px 7px', fontSize: 11 }}
                      onClick={() =>
                        setLayers((prev) =>
                          prev.map((l) =>
                            l.id === activeLayerObj.id
                              ? { ...l, rotation: (l.rotation || 0) + Math.PI / 2 }
                              : l
                          )
                        )
                      }
                      title="Rotacionar +90°"
                    >
                      +90°
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'filter' && (
              <div className="uv-prop-card">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={censorMode}
                    onChange={(e) => setCensorMode(e.target.checked)}
                  />
                  <span>Modo Censura (Preto Sólido)</span>
                </label>
              </div>
            )}
          </div>
        )}

        {activeRightTab === 'layers' && (
          <div className="properties-panel uv-panel-scroll">
            <LayersPanel
              layers={layers}
              selectedLayer={selectedLayer}
              editingLayerName={editingLayerName}
              onSelectLayer={(id) => selectLayer(id)}
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
              onAddImageLayer={(f) => addImageLayerFromFile(f)}
              onBatchDelete={batchDelete}
              onBatchLock={batchLock}
              onBatchUnlock={batchUnlock}
              onAddMaskToLayer={addMaskToLayer}
              onSetLayerBlendMode={setLayerBlendMode}
              onToggleMaskEdit={toggleEditMask}
              onRasterizeLayer={rasterizeLayer}
              onReorder={handleReorder}
            />

            {activeLayerObj?.isEditingMask && (
              <div className="uv-prop-card" style={{ marginTop: 8 }}>
                <div className="uv-prop-label-row">
                  <strong>Editar Máscara</strong>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="uv-seg-btn" onClick={() => invertMask(activeLayerObj.id)}>
                      Inverter
                    </button>
                    <button type="button" className="uv-seg-btn" onClick={() => clearMask(activeLayerObj.id)}>
                      Limpar
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    type="button"
                    className={`uv-seg-btn ${maskPaintMode === 'hide' ? 'active' : ''}`}
                    onClick={() => setMaskPaintMode('hide')}
                  >
                    Esconder
                  </button>
                  <button
                    type="button"
                    className={`uv-seg-btn ${maskPaintMode === 'reveal' ? 'active' : ''}`}
                    onClick={() => setMaskPaintMode('reveal')}
                  >
                    Revelar
                  </button>
                  <button
                    type="button"
                    className={`uv-seg-btn ${maskUseEraser ? 'active' : ''}`}
                    onClick={() => {
                      if (!maskUseEraser) {
                        prevToolRef.current = tool;
                        setTool('erase');
                        setMaskUseEraser(true);
                      } else {
                        setMaskUseEraser(false);
                        if (prevToolRef.current) setTool(prevToolRef.current);
                        prevToolRef.current = null;
                      }
                    }}
                  >
                    Borracha
                  </button>
                </div>
                <div className="uv-slider-block">
                  <div className="uv-prop-label-row">
                    <label>Suavidade Máscara</label>
                    <span className="uv-prop-value">{Math.round(maskBrushSoftness * 100)}%</span>
                  </div>
                  <input
                    className="uv-range"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={maskBrushSoftness}
                    onChange={(e) => setMaskBrushSoftness(Number(e.target.value))}
                  />
                </div>
                <div className="uv-slider-block">
                  <div className="uv-prop-label-row">
                    <label>Opacidade Máscara</label>
                    <span className="uv-prop-value">{Math.round(maskBrushOpacity * 100)}%</span>
                  </div>
                  <input
                    className="uv-range"
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={maskBrushOpacity}
                    onChange={(e) => setMaskBrushOpacity(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
