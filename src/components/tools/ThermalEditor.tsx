import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Thermometer,
  Flame,
  Snowflake,
  Eye,
  Scan,
  Type,
  Hand,
  Footprints,
  User,
  Circle,
  Ellipsis,
  Trash2,
  Copy,
  Check,
  X,
  RotateCw,
  Layers,
  Sparkles,
  BookmarkPlus,
  Brush,
  Eraser,
  MousePointer2,
  Undo2,
} from 'lucide-react';
import { useDirtyGuard } from '../../hooks/useDirtyGuard';
import './ThermalEditor.css';

export type ThermalPalette = 'ironbow' | 'white_hot' | 'arctic';
export type ThermalElementType =
  | 'text'
  | 'handprint'
  | 'footprints'
  | 'silhouette'
  | 'circle_blot'
  | 'heat_ellipse'
  | 'stroke';
export type ThermalPolarity = 'hot' | 'cold';

export interface ThermalPoint {
  x: number; // 0..100 %
  y: number; // 0..100 %
}

export interface ThermalElement {
  id: string;
  type: ThermalElementType;
  label: string;
  polarity: ThermalPolarity;
  x: number; // 0..100 %
  y: number; // 0..100 %
  size: number; // 20..250 % (or brush size 8..120 for stroke)
  rotation: number; // -180..180 deg
  blur: number; // 0..40 px
  intensity: number; // 10..100 %
  text?: string;
  points?: ThermalPoint[];
}

export interface ThermalSaveConfig {
  text: string;
  fontSize: number;
  positionY: number;
  palette: ThermalPalette;
  elements: ThermalElement[];
}

export interface ThermalEditorProps {
  baseImageUrl: string;
  thermalText?: string;
  initialFontSize?: number;
  initialPositionY?: number;
  initialPalette?: ThermalPalette;
  initialElements?: ThermalElement[];
  onSave: (file: File, config: ThermalSaveConfig) => void;
  onClose: () => void;
}

interface ThermalStylePreset {
  id: string;
  label: string;
  palette: ThermalPalette;
  polarity: ThermalPolarity;
  blur: number;
  intensity: number;
  custom?: boolean;
}

const BUILTIN_THERMAL_PRESETS: ThermalStylePreset[] = [
  { id: 'forensic-default', label: 'Padrão Forense', palette: 'ironbow', polarity: 'hot', blur: 8, intensity: 95 },
  { id: 'cold-anomaly', label: 'Anomalia Fria', palette: 'arctic', polarity: 'cold', blur: 12, intensity: 90 },
  { id: 'brazier', label: 'Braseiro', palette: 'white_hot', polarity: 'hot', blur: 16, intensity: 100 },
];

const THERMAL_PRESETS_KEY = 'ecdise_thermal_presets_v1';

const STAMP_PRESETS: {
  type: ThermalElementType;
  label: string;
  icon: React.ComponentType<{ size?: number | string }>;
  defaultSize: number;
  defaultBlur: number;
}[] = [
  { type: 'text', label: 'Texto Térmico', icon: Type, defaultSize: 100, defaultBlur: 6 },
  { type: 'handprint', label: 'Marca de Mão', icon: Hand, defaultSize: 90, defaultBlur: 10 },
  { type: 'footprints', label: 'Pegadas', icon: Footprints, defaultSize: 100, defaultBlur: 8 },
  { type: 'silhouette', label: 'Silhueta Humana', icon: User, defaultSize: 130, defaultBlur: 14 },
  { type: 'circle_blot', label: 'Mancha Circular', icon: Circle, defaultSize: 100, defaultBlur: 18 },
  { type: 'heat_ellipse', label: 'Elipse de Calor', icon: Ellipsis, defaultSize: 110, defaultBlur: 20 },
];

const PALETTE_OPTIONS: { id: ThermalPalette; label: string; gradient: string }[] = [
  {
    id: 'ironbow',
    label: 'IRONBOW',
    gradient: 'linear-gradient(90deg, #09001a, #460064, #ff2a00, #ffd000, #ffffff)',
  },
  {
    id: 'white_hot',
    label: 'White Hot',
    gradient: 'linear-gradient(90deg, #080808, #4a4a4a, #a0a0a0, #ffffff)',
  },
  {
    id: 'arctic',
    label: 'Arctic',
    gradient: 'linear-gradient(90deg, #001133, #0077cc, #00e5ff, #c8f7ff, #ffaa44, #ffffff)',
  },
];

function buildPaletteLUT(palette: ThermalPalette): { r: Uint8Array; g: Uint8Array; b: Uint8Array } {
  const r = new Uint8Array(256);
  const g = new Uint8Array(256);
  const b = new Uint8Array(256);

  for (let v = 0; v < 256; v++) {
    if (palette === 'white_hot') {
      r[v] = v;
      g[v] = v;
      b[v] = v;
    } else if (palette === 'arctic') {
      if (v < 64) {
        const t = v / 64;
        r[v] = Math.round(t * 10);
        g[v] = Math.round(15 + t * 85);
        b[v] = Math.round(45 + t * 145);
      } else if (v < 140) {
        const t = (v - 64) / 76;
        r[v] = Math.round(10 + t * 90);
        g[v] = Math.round(100 + t * 135);
        b[v] = Math.round(190 + t * 65);
      } else if (v < 205) {
        const t = (v - 140) / 65;
        r[v] = Math.round(100 + t * 155);
        g[v] = Math.round(235 - t * 65);
        b[v] = Math.round(255 - t * 185);
      } else {
        const t = (v - 205) / 50;
        r[v] = 255;
        g[v] = Math.round(170 + t * 85);
        b[v] = Math.round(70 + t * 185);
      }
    } else {
      // IRONBOW (matches InspectionModal LUT)
      if (v < 85) {
        const t = v / 85;
        r[v] = Math.round(t * 70);
        g[v] = 0;
        b[v] = Math.round(t * 100);
      } else if (v < 170) {
        const t = (v - 85) / 85;
        r[v] = Math.round(70 + t * (255 - 70));
        g[v] = 0;
        b[v] = Math.round(100 - t * 100);
      } else {
        const t = (v - 170) / 85;
        r[v] = 255;
        g[v] = Math.round(t * 255);
        b[v] = Math.round(t * 255);
      }
    }
  }
  return { r, g, b };
}

function getElementColors(polarity: ThermalPolarity, palette: ThermalPalette) {
  if (polarity === 'hot') {
    if (palette === 'white_hot') {
      return {
        outer: 'rgba(220, 220, 220, 0.55)',
        mid: 'rgba(245, 245, 245, 0.85)',
        core: 'rgba(255, 255, 255, 1)',
      };
    }
    if (palette === 'arctic') {
      return {
        outer: 'rgba(255, 120, 30, 0.55)',
        mid: 'rgba(255, 200, 90, 0.85)',
        core: 'rgba(255, 252, 235, 1)',
      };
    }
    return {
      outer: 'rgba(255, 60, 0, 0.55)',
      mid: 'rgba(255, 205, 0, 0.88)',
      core: 'rgba(255, 255, 240, 1)',
    };
  }
  // Cold anomaly (death / paranormal frost)
  if (palette === 'white_hot') {
    return {
      outer: 'rgba(15, 20, 30, 0.65)',
      mid: 'rgba(5, 10, 18, 0.88)',
      core: 'rgba(0, 0, 0, 0.98)',
    };
  }
  if (palette === 'arctic') {
    return {
      outer: 'rgba(0, 90, 255, 0.6)',
      mid: 'rgba(0, 220, 255, 0.85)',
      core: 'rgba(180, 250, 255, 0.95)',
    };
  }
  return {
    outer: 'rgba(25, 0, 110, 0.68)',
    mid: 'rgba(0, 140, 255, 0.85)',
    core: 'rgba(120, 230, 255, 0.95)',
  };
}

function drawStampGeometry(
  ctx: CanvasRenderingContext2D,
  type: ThermalElementType,
  unit: number
) {
  switch (type) {
    case 'handprint': {
      // Palm
      ctx.beginPath();
      ctx.ellipse(0, unit * 0.12, unit * 0.28, unit * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wrist
      ctx.beginPath();
      ctx.ellipse(0, unit * 0.42, unit * 0.16, unit * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      // 4 fingers
      const fingers = [
        { x: -0.22, y: -0.25, rx: 0.055, ry: 0.19, rot: -0.18 },
        { x: -0.08, y: -0.34, rx: 0.06, ry: 0.23, rot: -0.05 },
        { x: 0.07, y: -0.32, rx: 0.058, ry: 0.22, rot: 0.06 },
        { x: 0.21, y: -0.22, rx: 0.05, ry: 0.17, rot: 0.2 },
      ];
      fingers.forEach((f) => {
        ctx.save();
        ctx.translate(unit * f.x, unit * f.y);
        ctx.rotate(f.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, unit * f.rx, unit * f.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // Thumb
      ctx.save();
      ctx.translate(-unit * 0.34, unit * 0.1);
      ctx.rotate(-0.68);
      ctx.beginPath();
      ctx.ellipse(0, 0, unit * 0.068, unit * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'footprints': {
      const drawSingleFoot = (ox: number, oy: number, mirror: number) => {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(mirror, 1);
        // Forefoot
        ctx.beginPath();
        ctx.ellipse(0, -unit * 0.14, unit * 0.14, unit * 0.2, -0.08, 0, Math.PI * 2);
        ctx.fill();
        // Heel
        ctx.beginPath();
        ctx.ellipse(unit * 0.02, unit * 0.18, unit * 0.1, unit * 0.14, 0.05, 0, Math.PI * 2);
        ctx.fill();
        // Toes
        const toes = [
          { x: -0.09, y: -0.39, r: 0.042 },
          { x: -0.02, y: -0.42, r: 0.032 },
          { x: 0.04, y: -0.4, r: 0.028 },
          { x: 0.09, y: -0.36, r: 0.024 },
          { x: 0.13, y: -0.31, r: 0.02 },
        ];
        toes.forEach((t) => {
          ctx.beginPath();
          ctx.arc(unit * t.x, unit * t.y, unit * t.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      };
      drawSingleFoot(-unit * 0.24, -unit * 0.12, 1);
      drawSingleFoot(unit * 0.24, unit * 0.14, -1);
      break;
    }

    case 'silhouette': {
      // Head
      ctx.beginPath();
      ctx.ellipse(0, -unit * 0.44, unit * 0.13, unit * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Neck
      ctx.fillRect(-unit * 0.05, -unit * 0.3, unit * 0.1, unit * 0.08);
      // Torso & shoulders
      ctx.beginPath();
      ctx.moveTo(-unit * 0.32, -unit * 0.2);
      ctx.quadraticCurveTo(0, -unit * 0.26, unit * 0.32, -unit * 0.2);
      ctx.lineTo(unit * 0.24, unit * 0.24);
      ctx.quadraticCurveTo(0, unit * 0.28, -unit * 0.24, unit * 0.24);
      ctx.closePath();
      ctx.fill();
      // Arms
      ctx.beginPath();
      ctx.ellipse(-unit * 0.34, unit * 0.02, unit * 0.075, unit * 0.25, 0.12, 0, Math.PI * 2);
      ctx.ellipse(unit * 0.34, unit * 0.02, unit * 0.075, unit * 0.25, -0.12, 0, Math.PI * 2);
      ctx.fill();
      // Legs
      ctx.beginPath();
      ctx.ellipse(-unit * 0.12, unit * 0.45, unit * 0.085, unit * 0.26, 0.04, 0, Math.PI * 2);
      ctx.ellipse(unit * 0.12, unit * 0.45, unit * 0.085, unit * 0.26, -0.04, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'circle_blot': {
      const grad = ctx.createRadialGradient(0, 0, unit * 0.05, 0, 0, unit * 0.48);
      grad.addColorStop(0, ctx.fillStyle as string);
      grad.addColorStop(0.65, ctx.fillStyle as string);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, unit * 0.48, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'heat_ellipse': {
      ctx.beginPath();
      ctx.ellipse(0, 0, unit * 0.56, unit * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default:
      break;
  }
}

function drawThermalElement(
  ctx: CanvasRenderingContext2D,
  el: ThermalElement,
  canvasWidth: number,
  canvasHeight: number,
  palette: ThermalPalette
) {
  const cx = (el.x / 100) * canvasWidth;
  const cy = (el.y / 100) * canvasHeight;
  const baseUnit = Math.min(canvasWidth, canvasHeight) * 0.24 * (el.size / 100);
  const alpha = Math.max(0.1, Math.min(1, el.intensity / 100));
  const colors = getElementColors(el.polarity, palette);
  const blurScale = Math.max(1, Math.min(canvasWidth, canvasHeight) / 720);
  const effectiveBlur = el.blur * blurScale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.globalAlpha = alpha;

  if (el.type === 'text') {
    const content = (el.text || '').trim();
    if (!content) {
      ctx.restore();
      return;
    }
    const baseFontSize = Math.max(20, (Math.min(canvasWidth, canvasHeight) / 14) * (el.size / 100));
    ctx.font = `bold ${Math.round(baseFontSize)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = content.split('\n');
    const lineHeight = baseFontSize * 1.25;
    const startY = -((lines.length - 1) * lineHeight) / 2;

    if (effectiveBlur > 0) {
      ctx.filter = `blur(${Math.round(effectiveBlur * 0.45)}px)`;
    }

    lines.forEach((line, idx) => {
      const ly = startY + idx * lineHeight;
      ctx.shadowBlur = Math.max(8, effectiveBlur * 1.6);
      ctx.shadowColor = colors.outer;
      ctx.fillStyle = colors.outer;
      ctx.fillText(line, 0, ly);

      ctx.shadowBlur = Math.max(4, effectiveBlur * 0.7);
      ctx.shadowColor = colors.mid;
      ctx.fillStyle = colors.mid;
      ctx.fillText(line, 0, ly);

      ctx.shadowBlur = 3;
      ctx.shadowColor = colors.core;
      ctx.fillStyle = colors.core;
      ctx.fillText(line, 0, ly);
    });

    ctx.filter = 'none';
    ctx.shadowBlur = 0;
  } else if (el.type === 'stroke') {
    const pts = el.points || [];
    if (pts.length === 0) {
      ctx.restore();
      return;
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const strokeScale = Math.max(0.5, Math.min(canvasWidth, canvasHeight) / 720);
    const baseWidth = Math.max(4, el.size * strokeScale);

    const traceStroke = () => {
      ctx.beginPath();
      const p0x = (pts[0].x / 100) * canvasWidth;
      const p0y = (pts[0].y / 100) * canvasHeight;
      ctx.moveTo(p0x, p0y);
      if (pts.length === 1) {
        ctx.lineTo(p0x + 0.01, p0y + 0.01);
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (((pts[i].x + pts[i + 1].x) / 2) / 100) * canvasWidth;
          const yc = (((pts[i].y + pts[i + 1].y) / 2) / 100) * canvasHeight;
          ctx.quadraticCurveTo((pts[i].x / 100) * canvasWidth, (pts[i].y / 100) * canvasHeight, xc, yc);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo((last.x / 100) * canvasWidth, (last.y / 100) * canvasHeight);
      }
      ctx.stroke();
    };

    ctx.filter = `blur(${Math.max(2, Math.round(effectiveBlur * 1.15))}px)`;
    ctx.strokeStyle = colors.outer;
    ctx.lineWidth = baseWidth * 1.35;
    traceStroke();

    ctx.filter = `blur(${Math.max(1, Math.round(effectiveBlur * 0.55))}px)`;
    ctx.strokeStyle = colors.mid;
    ctx.lineWidth = baseWidth * 0.95;
    traceStroke();

    ctx.filter = `blur(${Math.round(effectiveBlur * 0.2)}px)`;
    ctx.strokeStyle = colors.core;
    ctx.lineWidth = baseWidth * 0.55;
    traceStroke();

    ctx.filter = 'none';
  } else {
    // 3-pass organic thermal diffusion for stamps / shapes
    ctx.filter = `blur(${Math.max(2, Math.round(effectiveBlur * 1.15))}px)`;
    ctx.fillStyle = colors.outer;
    drawStampGeometry(ctx, el.type, baseUnit * 1.12);

    ctx.filter = `blur(${Math.max(1, Math.round(effectiveBlur * 0.55))}px)`;
    ctx.fillStyle = colors.mid;
    drawStampGeometry(ctx, el.type, baseUnit * 0.94);

    ctx.filter = `blur(${Math.round(effectiveBlur * 0.22)}px)`;
    ctx.fillStyle = colors.core;
    drawStampGeometry(ctx, el.type, baseUnit * 0.7);

    ctx.filter = 'none';
  }

  ctx.restore();
}

function getElementBoundsPct(el: ThermalElement): { w: number; h: number } {
  if (el.type === 'stroke') {
    const pts = el.points || [];
    if (pts.length === 0) return { w: 8, h: 8 };
    let minX = 100, maxX = 0, minY = 100, maxY = 0;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      w: Math.max(6, maxX - minX + 4),
      h: Math.max(6, maxY - minY + 4),
    };
  }
  if (el.type === 'text') {
    const lines = (el.text || 'TEXTO').split('\n');
    const maxChars = Math.max(4, ...lines.map((l) => l.length));
    const scale = el.size / 100;
    return {
      w: Math.min(85, Math.max(14, maxChars * 2.3 * scale)),
      h: Math.min(70, Math.max(8, lines.length * 6.5 * scale)),
    };
  }
  const base = 22 * (el.size / 100);
  if (el.type === 'heat_ellipse') return { w: base * 1.2, h: base * 0.75 };
  if (el.type === 'silhouette') return { w: base * 0.9, h: base * 1.35 };
  return { w: base, h: base };
}

export default function ThermalEditor({
  baseImageUrl,
  thermalText = '',
  initialFontSize = 100,
  initialPositionY = 50,
  initialPalette = 'ironbow',
  initialElements,
  onSave,
  onClose,
}: ThermalEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [palette, setPalette] = useState<ThermalPalette>(initialPalette);
  const [viewMode, setViewMode] = useState<'thermal' | 'naked'>('thermal');
  const [toolMode, setToolMode] = useState<'select' | 'brush' | 'eraser'>('select');
  const [brushPolarity, setBrushPolarity] = useState<ThermalPolarity>('hot');
  const [brushSize, setBrushSize] = useState<number>(28);
  const [brushBlur, setBrushBlur] = useState<number>(8);
  const [brushIntensity, setBrushIntensity] = useState<number>(92);
  const [isExporting, setIsExporting] = useState(false);
  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [customPresets, setCustomPresets] = useState<ThermalStylePreset[]>(() => {
    try {
      const raw = localStorage.getItem(THERMAL_PRESETS_KEY);
      return raw ? (JSON.parse(raw) as ThermalStylePreset[]) : [];
    } catch {
      return [];
    }
  });

  const [elements, setElements] = useState<ThermalElement[]>(() => {
    if (Array.isArray(initialElements) && initialElements.length > 0) {
      return initialElements.map((el) => ({ ...el }));
    }
    const initial: ThermalElement[] = [];
    if (thermalText && thermalText.trim()) {
      initial.push({
        id: 'thermal-init-text',
        type: 'text',
        label: 'Texto Térmico #1',
        polarity: 'hot',
        x: 50,
        y: Math.max(5, Math.min(95, initialPositionY || 50)),
        size: Math.max(30, Math.min(220, initialFontSize || 100)),
        rotation: 0,
        blur: 6,
        intensity: 95,
        text: thermalText,
      });
    }
    return initial;
  });

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (Array.isArray(initialElements) && initialElements.length > 0) {
      return initialElements[0].id;
    }
    return thermalText && thermalText.trim() ? 'thermal-init-text' : null;
  });

  const dirtySnapshot = useMemo(
    () => JSON.stringify({ palette, elements }),
    [palette, elements]
  );
  const baselineSnapshotRef = useRef<string>(dirtySnapshot);
  const isDirty = dirtySnapshot !== baselineSnapshotRef.current;

  const { guardClose, handleBackdropClick } = useDirtyGuard({
    isDirty,
    onClose,
    message: 'Você tem alterações não salvas na camada térmica. Deseja descartar e fechar?',
  });

  // Unified pointer dragging & drawing state
  const dragRef = useRef<{
    elementId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const drawingIdRef = useRef<string | null>(null);
  const erasingRef = useRef<boolean>(false);

  const selectedElement = elements.find((e) => e.id === selectedId) || null;

  // Load base image once
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImageUrl;
    img.onload = () => {
      if (cancelled) return;
      baseImageRef.current = img;
      setImageLoaded(true);
    };
    return () => {
      cancelled = true;
    };
  }, [baseImageUrl]);

  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = baseImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const w = img.naturalWidth || img.width || 1024;
    const h = img.naturalHeight || img.height || 768;
    // Cap preview resolution for fluid 60fps dragging while keeping crisp detail
    const maxPreview = 1200;
    const scale = Math.min(1, maxPreview / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (viewMode === 'thermal') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const lut = buildPaletteLUT(palette);
      for (let i = 0; i < data.length; i += 4) {
        const lum = ~~(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        data[i] = lut.r[lum];
        data[i + 1] = lut.g[lum];
        data[i + 2] = lut.b[lum];
      }
      ctx.putImageData(imgData, 0, 0);

      // Draw all thermal elements
      elements.forEach((el) => {
        drawThermalElement(ctx, el, canvas.width, canvas.height, palette);
      });
    }

    // Draw selection handle indicator (preview only)
    if (selectedId && toolMode === 'select') {
      const sel = elements.find((e) => e.id === selectedId);
      if (sel && sel.type !== 'stroke') {
        const cx = (sel.x / 100) * canvas.width;
        const cy = (sel.y / 100) * canvas.height;
        const bounds = getElementBoundsPct(sel);
        const bw = (bounds.w / 100) * canvas.width;
        const bh = (bounds.h / 100) * canvas.height;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((sel.rotation * Math.PI) / 180);
        ctx.strokeStyle = sel.polarity === 'hot' ? '#ffae00' : '#00f3ff';
        ctx.lineWidth = Math.max(2, canvas.width / 450);
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);

        // Center crosshair
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.moveTo(0, -8);
        ctx.lineTo(0, 8);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw magnetic center guides when snapping
    if (snapGuides.x || snapGuides.y) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.85)';
      ctx.lineWidth = Math.max(1.5, canvas.width / 600);
      ctx.setLineDash([6, 4]);
      if (snapGuides.x) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
      }
      if (snapGuides.y) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [elements, palette, viewMode, selectedId, snapGuides, toolMode]);

  useEffect(() => {
    if (imageLoaded) {
      renderPreview();
    }
  }, [imageLoaded, renderPreview]);

  const addElement = (type: ThermalElementType) => {
    const preset = STAMP_PRESETS.find((p) => p.type === type)!;
    const count = elements.filter((e) => e.type === type).length + 1;
    const jitter = ((elements.length % 5) - 2) * 5;
    const newEl: ThermalElement = {
      id: `th-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      label: `${preset.label} #${count}`,
      polarity: 'hot',
      x: Math.max(15, Math.min(85, 50 + jitter)),
      y: Math.max(15, Math.min(85, 50 + jitter)),
      size: preset.defaultSize,
      rotation: 0,
      blur: preset.defaultBlur,
      intensity: 90,
      text: type === 'text' ? 'ASSINATURA TÉRMICA' : undefined,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setToolMode('select');
    if (viewMode === 'naked') setViewMode('thermal');
  };

  const undoLastStroke = () => {
    setElements((prev) => {
      const idx = [...prev].reverse().findIndex((el) => el.type === 'stroke');
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      const targetId = prev[realIdx].id;
      if (selectedId === targetId) setSelectedId(null);
      return prev.filter((_, i) => i !== realIdx);
    });
  };

  const updateSelected = (patch: Partial<ThermalElement>) => {
    if (!selectedId) return;
    setElements((prev) => prev.map((el) => (el.id === selectedId ? { ...el, ...patch } : el)));
  };

  const duplicateSelected = () => {
    if (!selectedElement) return;
    const copy: ThermalElement = {
      ...selectedElement,
      id: `th-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: `${selectedElement.label} (cópia)`,
      x: Math.min(92, selectedElement.x + 5),
      y: Math.min(92, selectedElement.y + 5),
    };
    setElements((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const deleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const getPointerPct = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 50, y: 50 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  const eraseAtPoint = (pt: ThermalPoint) => {
    const hitRadius = 4.2;
    setElements((prev) =>
      prev.filter((el) => {
        if (el.type === 'stroke' && el.points) {
          const hit = el.points.some(
            (p) => Math.hypot(p.x - pt.x, p.y - pt.y) <= Math.max(hitRadius, el.size / 14)
          );
          if (hit && selectedId === el.id) setSelectedId(null);
          return !hit;
        }
        const b = getElementBoundsPct(el);
        const hit =
          Math.abs(pt.x - el.x) <= Math.max(6, b.w / 2) &&
          Math.abs(pt.y - el.y) <= Math.max(6, b.h / 2);
        if (hit && selectedId === el.id) setSelectedId(null);
        return !hit;
      })
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pt = getPointerPct(e);

    if (toolMode === 'brush') {
      if (viewMode === 'naked') setViewMode('thermal');
      const strokeId = `th-stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const strokeCount = elements.filter((el) => el.type === 'stroke').length + 1;
      const newStroke: ThermalElement = {
        id: strokeId,
        type: 'stroke',
        label: `Traço Livre #${strokeCount}`,
        polarity: brushPolarity,
        x: pt.x,
        y: pt.y,
        size: brushSize,
        rotation: 0,
        blur: brushBlur,
        intensity: brushIntensity,
        points: [pt],
      };
      drawingIdRef.current = strokeId;
      setElements((prev) => [...prev, newStroke]);
      setSelectedId(strokeId);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      return;
    }

    if (toolMode === 'eraser') {
      erasingRef.current = true;
      eraseAtPoint(pt);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      return;
    }

    // Hit-test non-stroke elements from top to bottom
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === 'stroke') continue;
      const b = getElementBoundsPct(el);
      const halfW = Math.max(8, b.w / 2);
      const halfH = Math.max(8, b.h / 2);
      if (Math.abs(pt.x - el.x) <= halfW && Math.abs(pt.y - el.y) <= halfH) {
        setSelectedId(el.id);
        dragRef.current = {
          elementId: el.id,
          offsetX: pt.x - el.x,
          offsetY: pt.y - el.y,
        };
        e.currentTarget.setPointerCapture?.(e.pointerId);
        return;
      }
    }

    // If clicked empty space while a stamp/text element is selected, move selected element smoothly on drag
    if (selectedId && selectedElement?.type !== 'stroke') {
      dragRef.current = {
        elementId: selectedId,
        offsetX: 0,
        offsetY: 0,
      };
      setElements((prev) =>
        prev.map((el) => (el.id === selectedId ? { ...el, x: pt.x, y: pt.y } : el))
      );
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawingIdRef.current) {
      e.preventDefault();
      const pt = getPointerPct(e);
      const activeId = drawingIdRef.current;
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== activeId) return el;
          const pts = el.points || [];
          const last = pts[pts.length - 1];
          if (last && Math.hypot(pt.x - last.x, pt.y - last.y) < 0.25) return el;
          return { ...el, points: [...pts, pt] };
        })
      );
      return;
    }

    if (erasingRef.current) {
      e.preventDefault();
      eraseAtPoint(getPointerPct(e));
      return;
    }

    if (!dragRef.current) return;
    e.preventDefault();
    const pt = getPointerPct(e);
    const { elementId, offsetX, offsetY } = dragRef.current;
    let nx = Math.max(0, Math.min(100, pt.x - offsetX));
    let ny = Math.max(0, Math.min(100, pt.y - offsetY));
    const snapX = Math.abs(nx - 50) <= 2.2;
    const snapY = Math.abs(ny - 50) <= 2.2;
    if (snapX) nx = 50;
    if (snapY) ny = 50;
    setSnapGuides({ x: snapX, y: snapY });
    setElements((prev) =>
      prev.map((el) => (el.id === elementId ? { ...el, x: nx, y: ny } : el))
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawingIdRef.current) {
      drawingIdRef.current = null;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
    if (erasingRef.current) {
      erasingRef.current = false;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
    if (dragRef.current) {
      dragRef.current = null;
      setSnapGuides({ x: false, y: false });
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
  };

  const applyThermalPreset = (preset: ThermalStylePreset) => {
    setPalette(preset.palette);
    if (selectedId) {
      updateSelected({
        polarity: preset.polarity,
        blur: preset.blur,
        intensity: preset.intensity,
      });
    }
  };

  const handleSaveCustomPreset = () => {
    const name = window.prompt('Nome do preset térmico:');
    if (!name || !name.trim()) return;
    const nextPreset: ThermalStylePreset = {
      id: `custom-thermal-${Date.now()}`,
      label: name.trim(),
      palette,
      polarity: selectedElement?.polarity || 'hot',
      blur: selectedElement?.blur ?? 8,
      intensity: selectedElement?.intensity ?? 95,
      custom: true,
    };
    const updated = [...customPresets, nextPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem(THERMAL_PRESETS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteCustomPreset = (id: string) => {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    try {
      localStorage.setItem(THERMAL_PRESETS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleFitToBase = () => {
    if (selectedId) {
      updateSelected({ x: 50, y: 50, rotation: 0, size: 100 });
    } else if (elements.length > 0) {
      setElements((prev) =>
        prev.map((el) => ({ ...el, x: 50, y: 50, rotation: 0, size: 100 }))
      );
    }
  };

  const handleSaveClick = async () => {
    const img = baseImageRef.current;
    if (!img) return;
    setIsExporting(true);
    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = img.naturalWidth || img.width || 1024;
      exportCanvas.height = img.naturalHeight || img.height || 768;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Contexto 2D indisponível');

      // Export transparent PNG layer containing all thermal objects at native resolution
      ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
      elements.forEach((el) => {
        drawThermalElement(ctx, el, exportCanvas.width, exportCanvas.height, palette);
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Falha ao gerar PNG térmico'))),
          'image/png',
          1.0
        );
      });

      const file = new File([blob], `thermal-layer-${Date.now()}.png`, { type: 'image/png' });
      const textElements = elements.filter((e) => e.type === 'text' && e.text?.trim());
      const firstText = textElements[0];

      baselineSnapshotRef.current = dirtySnapshot;
      onSave(file, {
        text: textElements.map((t) => t.text?.trim()).join('\n'),
        fontSize: firstText ? Math.round(firstText.size) : initialFontSize,
        positionY: firstText ? Math.round(firstText.y) : initialPositionY,
        palette,
        elements: elements.map((el) => ({ ...el })),
      });
    } catch (err) {
      console.error('Erro ao exportar camada térmica:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="thermal-editor-modal" onClick={(e) => handleBackdropClick(e)}>
      <div className="thermal-editor-content">
        <header className="thermal-editor-header">
          <div className="thermal-header-title">
            <Thermometer size={18} />
            <span>EDITOR TÉRMICO C.R.I.S.</span>
            <span className="thermal-badge">{palette.toUpperCase()}</span>
          </div>

          <div className="thermal-view-toggle" role="group" aria-label="Modo de visualização">
            <button
              type="button"
              className={`thermal-toggle-btn ${viewMode === 'naked' ? 'active' : ''}`}
              onClick={() => setViewMode('naked')}
            >
              <Eye size={14} /> Olho Nu
            </button>
            <button
              type="button"
              className={`thermal-toggle-btn ${viewMode === 'thermal' ? 'active' : ''}`}
              onClick={() => setViewMode('thermal')}
            >
              <Scan size={14} /> Câmera Termal
            </button>
          </div>

          <div className="thermal-header-actions">
            <button
              type="button"
              className="thermal-btn-save"
              onClick={handleSaveClick}
              disabled={isExporting || !imageLoaded}
            >
              <Check size={15} /> {isExporting ? 'EXPORTANDO...' : 'APLICAR DIRETO NA PISTA'}
            </button>
            <button
              type="button"
              className="thermal-toggle-btn"
              onClick={handleFitToBase}
              title="Centralizar e ajustar escala à proporção da imagem base"
            >
              <Scan size={14} /> Encaixar na Proporção da Base
            </button>
            <button type="button" className="thermal-btn-close" onClick={() => guardClose()} title="Fechar">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="thermal-editor-body">
          {/* Canvas Viewport */}
          <div className="thermal-preview-section">
            <div className="thermal-palette-bar">
              <span className="thermal-mini-label">PALETA:</span>
              {PALETTE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`thermal-palette-pill ${palette === opt.id ? 'active' : ''}`}
                  onClick={() => setPalette(opt.id)}
                >
                  <span className="thermal-palette-swatch" style={{ background: opt.gradient }} />
                  <span>{opt.label}</span>
                </button>
              ))}
              <span className="thermal-mini-label" style={{ marginLeft: 8 }}>
                <Sparkles size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                PRESETS:
              </span>
              {[...BUILTIN_THERMAL_PRESETS, ...customPresets].map((preset) => (
                <span key={preset.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <button
                    type="button"
                    className="thermal-palette-pill"
                    onClick={() => applyThermalPreset(preset)}
                  >
                    <span>{preset.label}</span>
                  </button>
                  {preset.custom && (
                    <button
                      type="button"
                      className="thermal-layer-action"
                      onClick={() => handleDeleteCustomPreset(preset.id)}
                      title="Excluir preset customizado"
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
              <button
                type="button"
                className="thermal-palette-pill"
                onClick={handleSaveCustomPreset}
                title="Salvar estilo atual como preset"
              >
                <BookmarkPlus size={11} />
                <span>+ Preset</span>
              </button>
            </div>

            <div className="thermal-canvas-stage">
              <canvas
                ref={canvasRef}
                className="thermal-canvas"
                style={{
                  cursor:
                    toolMode === 'brush'
                      ? 'crosshair'
                      : toolMode === 'eraser'
                        ? 'cell'
                        : 'grab',
                  touchAction: 'none',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
              {elements.length === 0 && toolMode === 'select' && (
                <div className="thermal-empty-overlay">
                  Escolha o Pincel Térmico ou adicione um Carimbo/Texto ao lado.
                </div>
              )}
            </div>

            <p className="thermal-preview-hint">
              {toolMode === 'brush'
                ? 'Arraste no canvas para desenhar assinaturas térmicas livremente.'
                : toolMode === 'eraser'
                  ? 'Clique ou arraste sobre traços e carimbos para apagar.'
                  : 'Toque ou clique para selecionar e arrastar carimbos ou textos diretamente no canvas.'}
            </p>
          </div>

          {/* Right Controls Panel */}
          <aside className="thermal-controls-section">
            {/* Drawing & Interaction Tool Mode */}
            <div className="thermal-panel-card">
              <div className="thermal-card-title">FERRAMENTA DE DESENHO</div>
              <div className="thermal-stamp-grid">
                <button
                  type="button"
                  className={`thermal-stamp-btn ${toolMode === 'brush' ? 'active' : ''}`}
                  style={toolMode === 'brush' ? { borderColor: '#ff9500', color: '#ffb84d', background: 'rgba(255, 149, 0, 0.14)' } : undefined}
                  onClick={() => setToolMode('brush')}
                >
                  <Brush size={15} />
                  <span>Pincel Térmico</span>
                </button>
                <button
                  type="button"
                  className={`thermal-stamp-btn ${toolMode === 'eraser' ? 'active' : ''}`}
                  style={toolMode === 'eraser' ? { borderColor: '#f87171', color: '#fca5a5', background: 'rgba(248, 113, 113, 0.14)' } : undefined}
                  onClick={() => setToolMode('eraser')}
                >
                  <Eraser size={15} />
                  <span>Borracha</span>
                </button>
                <button
                  type="button"
                  className={`thermal-stamp-btn ${toolMode === 'select' ? 'active' : ''}`}
                  style={toolMode === 'select' ? { borderColor: '#00f3ff', color: '#67e8f9', background: 'rgba(0, 243, 255, 0.12)' } : undefined}
                  onClick={() => setToolMode('select')}
                >
                  <MousePointer2 size={15} />
                  <span>Mover / Selecionar</span>
                </button>
                <button
                  type="button"
                  className="thermal-stamp-btn"
                  disabled={!elements.some((el) => el.type === 'stroke')}
                  onClick={undoLastStroke}
                >
                  <Undo2 size={15} />
                  <span>Desfazer Traço</span>
                </button>
              </div>

              {toolMode === 'brush' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(148, 163, 184, 0.16)' }}>
                  <div className="thermal-polarity-row">
                    <button
                      type="button"
                      className={`thermal-polarity-btn hot ${brushPolarity === 'hot' ? 'active' : ''}`}
                      onClick={() => setBrushPolarity('hot')}
                    >
                      <Flame size={14} /> Quente (Calor)
                    </button>
                    <button
                      type="button"
                      className={`thermal-polarity-btn cold ${brushPolarity === 'cold' ? 'active' : ''}`}
                      onClick={() => setBrushPolarity('cold')}
                    >
                      <Snowflake size={14} /> Frio (Anomalia)
                    </button>
                  </div>

                  <div className="thermal-control-group">
                    <label className="thermal-control-label">
                      <span>ESPESSURA DO PINCEL</span>
                      <span>{brushSize}px</span>
                    </label>
                    <input
                      type="range"
                      min={8}
                      max={120}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="thermal-slider"
                    />
                  </div>

                  <div className="thermal-control-group">
                    <label className="thermal-control-label">
                      <span>DIFUSÃO TÉRMICA (BLUR)</span>
                      <span>{brushBlur}px</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={brushBlur}
                      onChange={(e) => setBrushBlur(Number(e.target.value))}
                      className="thermal-slider"
                    />
                  </div>

                  <div className="thermal-control-group">
                    <label className="thermal-control-label">
                      <span>INTENSIDADE</span>
                      <span>{brushIntensity}%</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={brushIntensity}
                      onChange={(e) => setBrushIntensity(Number(e.target.value))}
                      className="thermal-slider"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Add Elements / Stamps */}
            <div className="thermal-panel-card">
              <div className="thermal-card-title">ADICIONAR ELEMENTO / CARIMBO</div>
              <div className="thermal-stamp-grid">
                {STAMP_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.type}
                      type="button"
                      className="thermal-stamp-btn"
                      onClick={() => addElement(preset.type)}
                    >
                      <Icon size={15} />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Elements List */}
            <div className="thermal-panel-card">
              <div className="thermal-card-title">
                <Layers size={13} /> CAMADAS TÉRMICAS ({elements.length})
              </div>
              {elements.length === 0 ? (
                <div className="thermal-empty-list">Nenhuma assinatura térmica adicionada.</div>
              ) : (
                <div className="thermal-layers-list">
                  {elements.map((el) => (
                    <div
                      key={el.id}
                      className={`thermal-layer-item ${el.id === selectedId ? 'selected' : ''}`}
                      onClick={() => setSelectedId(el.id)}
                    >
                      <span className={`thermal-polarity-dot ${el.polarity}`}>
                        {el.polarity === 'hot' ? <Flame size={12} /> : <Snowflake size={12} />}
                      </span>
                      <span className="thermal-layer-name">
                        {el.type === 'text' && el.text ? `"${el.text.slice(0, 22)}"` : el.label}
                      </span>
                      <button
                        type="button"
                        className="thermal-icon-btn danger"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          deleteElement(el.id);
                        }}
                        title="Remover elemento"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Element Inspector */}
            {selectedElement && (
              <div className="thermal-panel-card thermal-inspector-card">
                <div className="thermal-inspector-head">
                  <span className="thermal-card-title">PROPRIEDADES DO ELEMENTO</span>
                  <div className="thermal-inspector-actions">
                    <button
                      type="button"
                      className="thermal-icon-btn"
                      onClick={duplicateSelected}
                      title="Duplicar elemento"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      className="thermal-icon-btn danger"
                      onClick={() => deleteElement(selectedElement.id)}
                      title="Excluir elemento"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Hot vs Cold polarity */}
                <div className="thermal-polarity-row">
                  <button
                    type="button"
                    className={`thermal-polarity-btn hot ${selectedElement.polarity === 'hot' ? 'active' : ''}`}
                    onClick={() => updateSelected({ polarity: 'hot' })}
                  >
                    <Flame size={14} /> Quente (Calor)
                  </button>
                  <button
                    type="button"
                    className={`thermal-polarity-btn cold ${selectedElement.polarity === 'cold' ? 'active' : ''}`}
                    onClick={() => updateSelected({ polarity: 'cold' })}
                  >
                    <Snowflake size={14} /> Frio (Anomalia / Morte)
                  </button>
                </div>

                {selectedElement.type === 'text' && (
                  <div className="thermal-control-group">
                    <label className="thermal-control-label">TEXTO TÉRMICO</label>
                    <textarea
                      className="thermal-textarea"
                      rows={3}
                      value={selectedElement.text || ''}
                      onChange={(e) => updateSelected({ text: e.target.value })}
                      placeholder="Digite a mensagem térmica..."
                    />
                  </div>
                )}

                <div className="thermal-control-group">
                  <label className="thermal-control-label">
                    <span>DIFUSÃO TÉRMICA (BLUR)</span>
                    <span>{selectedElement.blur}px</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={selectedElement.blur}
                    onChange={(e) => updateSelected({ blur: Number(e.target.value) })}
                    className="thermal-slider"
                  />
                </div>

                <div className="thermal-control-group">
                  <label className="thermal-control-label">
                    <span>INTENSIDADE</span>
                    <span>{selectedElement.intensity}%</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={selectedElement.intensity}
                    onChange={(e) => updateSelected({ intensity: Number(e.target.value) })}
                    className="thermal-slider"
                  />
                </div>

                <div className="thermal-control-group">
                  <label className="thermal-control-label">
                    <span>TAMANHO / ESCALA</span>
                    <span>{selectedElement.size}%</span>
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={250}
                    value={selectedElement.size}
                    onChange={(e) => updateSelected({ size: Number(e.target.value) })}
                    className="thermal-slider"
                  />
                </div>

                <div className="thermal-control-group">
                  <label className="thermal-control-label">
                    <span>
                      <RotateCw size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      ROTAÇÃO
                    </span>
                    <span>{selectedElement.rotation}°</span>
                  </label>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={selectedElement.rotation}
                    onChange={(e) => updateSelected({ rotation: Number(e.target.value) })}
                    className="thermal-slider"
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button
                      type="button"
                      className="thermal-toggle-btn"
                      style={{ flex: 1, justifyContent: 'center', padding: '4px 6px', fontSize: 11 }}
                      onClick={() => {
                        const next = ((selectedElement.rotation - 90 + 180) % 360) - 180;
                        updateSelected({ rotation: next });
                      }}
                    >
                      -90°
                    </button>
                    <button
                      type="button"
                      className="thermal-toggle-btn"
                      style={{ flex: 1, justifyContent: 'center', padding: '4px 6px', fontSize: 11 }}
                      onClick={() => updateSelected({ rotation: 0 })}
                    >
                      0°
                    </button>
                    <button
                      type="button"
                      className="thermal-toggle-btn"
                      style={{ flex: 1, justifyContent: 'center', padding: '4px 6px', fontSize: 11 }}
                      onClick={() => {
                        const next = ((selectedElement.rotation + 90 + 180) % 360) - 180;
                        updateSelected({ rotation: next });
                      }}
                    >
                      +90°
                    </button>
                  </div>
                </div>

                <div className="thermal-xy-grid">
                  <div className="thermal-control-group">
                    <label className="thermal-control-label">
                      <span>EIXO X</span>
                      <span>{Math.round(selectedElement.x)}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(selectedElement.x)}
                      onChange={(e) => updateSelected({ x: Number(e.target.value) })}
                      className="thermal-slider"
                    />
                  </div>
                  <div className="thermal-control-group">
                    <label className="thermal-control-label">
                      <span>EIXO Y</span>
                      <span>{Math.round(selectedElement.y)}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(selectedElement.y)}
                      onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                      className="thermal-slider"
                    />
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
