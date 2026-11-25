import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Palette,
  Save,
  X,
  Type,
  Image as ImageIcon,
  Trash2,
  Copy,
  Eye,
  Shield,
  Layers,
  Target,
  Check,
  RotateCw,
  Sparkles,
  BookmarkPlus,
} from 'lucide-react';
import { useDirtyGuard } from '../../hooks/useDirtyGuard';
import './ForensicChannelEditor.css';

export type ForensicChannel = 'R' | 'G' | 'B';
export type PreviewFilterMode = 'all' | 'r' | 'g' | 'b';
export type ForensicApplyMode = 'layer' | 'composite';

export interface ForensicLayer {
  id: string;
  type: 'text' | 'image';
  label: string;
  channel: ForensicChannel;
  x: number; // 0..100 %
  y: number; // 0..100 %
  scale: number; // 20..250 % (or font size factor)
  intensity: number; // 5..100 %
  rotation: number; // -180..180 deg
  text?: string;
  imageUrl?: string;
}

export interface ForensicConfig {
  targetChannel: ForensicChannel;
  overlayType: 'text' | 'image' | 'none';
  text?: string;
  fontSize?: number;
  intensity: number;
  positionX: number;
  positionY: number;
  overlayImageUrl?: string;
  camouflageEnabled?: boolean;
  camouflageIntensity?: number;
  applyMode?: ForensicApplyMode;
}

export interface ForensicChannelEditorProps {
  baseImageUrl: string;
  onSave: (compositeImageBlob: Blob, config: ForensicConfig) => void;
  onClose: () => void;
  initialConfig?: Partial<ForensicConfig>;
}

interface ForensicStylePreset {
  id: string;
  label: string;
  targetChannel: ForensicChannel;
  camouflageEnabled: boolean;
  camouflageIntensity: number;
  intensity: number;
  custom?: boolean;
}

const BUILTIN_FORENSIC_PRESETS: ForensicStylePreset[] = [
  {
    id: 'disguised-text',
    label: 'Texto Disfarçado',
    targetChannel: 'R',
    camouflageEnabled: true,
    camouflageIntensity: 60,
    intensity: 35,
  },
  {
    id: 'camo-qr',
    label: 'QR Camuflado',
    targetChannel: 'B',
    camouflageEnabled: true,
    camouflageIntensity: 75,
    intensity: 50,
  },
];

const FORENSIC_PRESETS_KEY = 'ecdise_forensic_presets_v1';

// Fast deterministic hash for reproducible camouflage noise (no flicker while dragging)
function fastNoise(x: number, y: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295; // 0..1
}

function getLayerBoundsPct(layer: ForensicLayer): { w: number; h: number } {
  if (layer.type === 'text') {
    const lines = (layer.text || 'TEXTO').split('\n');
    const maxChars = Math.max(4, ...lines.map((l) => l.length));
    const s = layer.scale / 100;
    return {
      w: Math.min(88, Math.max(14, maxChars * 2.3 * s)),
      h: Math.min(70, Math.max(8, lines.length * 6.5 * s)),
    };
  }
  const size = Math.min(85, Math.max(14, 34 * (layer.scale / 100)));
  return { w: size, h: size };
}

export default function ForensicChannelEditor({
  baseImageUrl,
  onSave,
  onClose,
  initialConfig,
}: ForensicChannelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const layerImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageCacheVersion, setImageCacheVersion] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Global settings
  const [targetChannel, setTargetChannel] = useState<ForensicChannel>(
    initialConfig?.targetChannel || 'R'
  );
  const [previewFilter, setPreviewFilter] = useState<PreviewFilterMode>('all');
  const [camouflageEnabled, setCamouflageEnabled] = useState<boolean>(
    initialConfig?.camouflageEnabled ?? true
  );
  const [camouflageIntensity, setCamouflageIntensity] = useState<number>(
    initialConfig?.camouflageIntensity ?? 45
  );
  const [applyMode, setApplyMode] = useState<ForensicApplyMode>(
    initialConfig?.applyMode || 'layer'
  );

  // Multiple layers state
  const [layers, setLayers] = useState<ForensicLayer[]>(() => {
    const init: ForensicLayer[] = [];
    if (initialConfig?.overlayType === 'text' && initialConfig.text) {
      init.push({
        id: 'forensic-init-text',
        type: 'text',
        label: 'Texto Oculto #1',
        channel: initialConfig.targetChannel || 'R',
        x: initialConfig.positionX ?? 50,
        y: initialConfig.positionY ?? 50,
        scale: initialConfig.fontSize ? Math.round((initialConfig.fontSize / 48) * 100) : 100,
        intensity: initialConfig.intensity ?? 45,
        rotation: 0,
        text: initialConfig.text,
      });
    } else if (initialConfig?.overlayType === 'image' && initialConfig.overlayImageUrl) {
      init.push({
        id: 'forensic-init-img',
        type: 'image',
        label: 'Imagem Oculta #1',
        channel: initialConfig.targetChannel || 'R',
        x: initialConfig.positionX ?? 50,
        y: initialConfig.positionY ?? 50,
        scale: 100,
        intensity: initialConfig.intensity ?? 55,
        rotation: 0,
        imageUrl: initialConfig.overlayImageUrl,
      });
    }
    return init;
  });

  const [selectedId, setSelectedId] = useState<string | null>(layers[0]?.id ?? null);
  const selectedLayer = layers.find((l) => l.id === selectedId) || null;
  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [customPresets, setCustomPresets] = useState<ForensicStylePreset[]>(() => {
    try {
      const raw = localStorage.getItem(FORENSIC_PRESETS_KEY);
      return raw ? (JSON.parse(raw) as ForensicStylePreset[]) : [];
    } catch {
      return [];
    }
  });

  const dirtySnapshot = useMemo(
    () =>
      JSON.stringify({
        targetChannel,
        camouflageEnabled,
        camouflageIntensity,
        applyMode,
        layers,
      }),
    [targetChannel, camouflageEnabled, camouflageIntensity, applyMode, layers]
  );
  const baselineSnapshotRef = useRef<string>(dirtySnapshot);
  const isDirty = dirtySnapshot !== baselineSnapshotRef.current;

  const { guardClose, handleBackdropClick } = useDirtyGuard({
    isDirty,
    onClose,
    message: 'Você tem alterações não salvas no Editor Forense RGB. Deseja descartar e fechar?',
  });

  const dragRef = useRef<{
    layerId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Load base image
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

  // Preload layer images
  useEffect(() => {
    layers.forEach((layer) => {
      if (layer.type === 'image' && layer.imageUrl && !layerImagesRef.current.has(layer.imageUrl)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = layer.imageUrl;
        img.onload = () => {
          layerImagesRef.current.set(layer.imageUrl!, img);
          setImageCacheVersion((v) => v + 1);
        };
      }
    });
  }, [layers]);

  // Core renderer used both for live preview (capped for 60fps) and full-res PNG export
  const renderCompositeToCanvas = useCallback(
    (
      targetCanvas: HTMLCanvasElement,
      fullResolution: boolean,
      filterMode: PreviewFilterMode,
      drawSelection: boolean
    ) => {
      const baseImg = baseImageRef.current;
      if (!baseImg) return;
      const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const natW = baseImg.naturalWidth || baseImg.width || 1024;
      const natH = baseImg.naturalHeight || baseImg.height || 768;
      const maxDim = fullResolution ? Math.max(natW, natH) : 1100;
      const ratio = Math.min(1, maxDim / Math.max(natW, natH));
      const width = Math.max(1, Math.round(natW * ratio));
      const height = Math.max(1, Math.round(natH * ratio));

      targetCanvas.width = width;
      targetCanvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(baseImg, 0, 0, width, height);

      if (layers.length > 0) {
        const baseImageData = ctx.getImageData(0, 0, width, height);
        const base = baseImageData.data;

        // Reusable offscreen canvas for rasterizing each layer's mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });

        if (maskCtx) {
          const camFactor = camouflageEnabled ? camouflageIntensity / 100 : 0;

          layers.forEach((layer) => {
            maskCtx.clearRect(0, 0, width, height);
            maskCtx.save();
            const cx = (layer.x / 100) * width;
            const cy = (layer.y / 100) * height;
            maskCtx.translate(cx, cy);
            maskCtx.rotate((layer.rotation * Math.PI) / 180);

            if (layer.type === 'text') {
              const content = (layer.text || '').trim();
              if (!content) {
                maskCtx.restore();
                return;
              }
              const fontSize = Math.max(16, (Math.min(width, height) / 15) * (layer.scale / 100));
              maskCtx.font = `bold ${Math.round(fontSize)}px 'Courier New', monospace`;
              maskCtx.textAlign = 'center';
              maskCtx.textBaseline = 'middle';
              maskCtx.fillStyle = '#ffffff';
              const lines = content.split('\n');
              const lineHeight = fontSize * 1.2;
              const startY = -((lines.length - 1) * lineHeight) / 2;
              lines.forEach((line, idx) => {
                maskCtx.fillText(line, 0, startY + idx * lineHeight);
              });
            } else if (layer.type === 'image' && layer.imageUrl) {
              const img = layerImagesRef.current.get(layer.imageUrl);
              if (!img) {
                maskCtx.restore();
                return;
              }
              const maxSize = Math.min(width, height) * 0.4 * (layer.scale / 100);
              const aspect = (img.naturalWidth || img.width || 1) / (img.naturalHeight || img.height || 1);
              let drawW = maxSize;
              let drawH = maxSize / aspect;
              if (drawH > maxSize) {
                drawH = maxSize;
                drawW = maxSize * aspect;
              }
              maskCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            }

            maskCtx.restore();

            const maskData = maskCtx.getImageData(0, 0, width, height).data;
            const chIdx = layer.channel === 'R' ? 0 : layer.channel === 'G' ? 1 : 2;
            const other1 = (chIdx + 1) % 3;
            const other2 = (chIdx + 2) % 3;
            const intensityFactor = layer.intensity / 100;

            for (let p = 0, i = 0; i < base.length; p++, i += 4) {
              const alpha = maskData[i + 3] / 255;
              if (alpha <= 0.01) continue;
              const gray = (maskData[i] + maskData[i + 1] + maskData[i + 2]) / 3;
              const strength = (gray / 255) * alpha * intensityFactor;
              if (strength <= 0.004) continue;

              // Inject signal into target channel
              const boost = strength * 255;
              base[i + chIdx] = Math.min(255, Math.round(base[i + chIdx] + boost));

              // Camouflage / counter-compensation + structured noise in non-target channels
              if (camFactor > 0) {
                const px = p % width;
                const py = (p - px) / width;
                const n1 = (fastNoise(px, py) - 0.5) * 2; // -1..1
                const n2 = (fastNoise(px + 9173, py + 4129) - 0.5) * 2;
                const counterDrop = boost * 0.35 * camFactor;
                const noiseAmp = 55 * camFactor * Math.min(1, strength + 0.35);

                base[i + other1] = Math.max(
                  0,
                  Math.min(255, Math.round(base[i + other1] - counterDrop + n1 * noiseAmp))
                );
                base[i + other2] = Math.max(
                  0,
                  Math.min(255, Math.round(base[i + other2] - counterDrop + n2 * noiseAmp))
                );
              }
            }
          });

          // Subtle full-frame camouflage grain in non-target channels so local mask edges disappear
          if (camFactor > 0) {
            const globalChIdx = targetChannel === 'R' ? 0 : targetChannel === 'G' ? 1 : 2;
            const gOther1 = (globalChIdx + 1) % 3;
            const gOther2 = (globalChIdx + 2) % 3;
            const grainAmp = 28 * camFactor;

            for (let p = 0, i = 0; i < base.length; p++, i += 4) {
              const px = p % width;
              const py = (p - px) / width;
              const n1 = (fastNoise(px * 2, py * 2) - 0.5) * grainAmp;
              const n2 = (fastNoise(px * 2 + 131, py * 2 + 733) - 0.5) * grainAmp;
              base[i + gOther1] = Math.max(0, Math.min(255, Math.round(base[i + gOther1] + n1)));
              base[i + gOther2] = Math.max(0, Math.min(255, Math.round(base[i + gOther2] + n2)));
            }
          }
        }

        // Apply live R / G / B isolation filter (exact match to ChannelIsolator.tsx)
        if (filterMode !== 'all') {
          for (let i = 0; i < base.length; i += 4) {
            if (filterMode === 'r') {
              base[i + 1] = 0;
              base[i + 2] = 0;
            } else if (filterMode === 'g') {
              base[i] = 0;
              base[i + 2] = 0;
            } else if (filterMode === 'b') {
              base[i] = 0;
              base[i + 1] = 0;
            }
          }
        }

        ctx.putImageData(baseImageData, 0, 0);
      } else if (filterMode !== 'all') {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (filterMode === 'r') {
            data[i + 1] = 0;
            data[i + 2] = 0;
          } else if (filterMode === 'g') {
            data[i] = 0;
            data[i + 2] = 0;
          } else if (filterMode === 'b') {
            data[i] = 0;
            data[i + 1] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      // Selection bounding box (preview only)
      if (drawSelection && selectedId) {
        const sel = layers.find((l) => l.id === selectedId);
        if (sel) {
          const cx = (sel.x / 100) * width;
          const cy = (sel.y / 100) * height;
          const bounds = getLayerBoundsPct(sel);
          const bw = (bounds.w / 100) * width;
          const bh = (bounds.h / 100) * height;
          const strokeColor =
            sel.channel === 'R' ? '#ff5555' : sel.channel === 'G' ? '#4dff88' : '#55aaff';

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((sel.rotation * Math.PI) / 180);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(2, width / 450);
          ctx.setLineDash([8, 6]);
          ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
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

      if (drawSelection && (snapGuides.x || snapGuides.y)) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.85)';
        ctx.lineWidth = Math.max(1.5, width / 600);
        ctx.setLineDash([6, 4]);
        if (snapGuides.x) {
          ctx.beginPath();
          ctx.moveTo(width / 2, 0);
          ctx.lineTo(width / 2, height);
          ctx.stroke();
        }
        if (snapGuides.y) {
          ctx.beginPath();
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    },
    [layers, camouflageEnabled, camouflageIntensity, targetChannel, selectedId, snapGuides]
  );

  useEffect(() => {
    if (!imageLoaded || !canvasRef.current) return;
    renderCompositeToCanvas(canvasRef.current, false, previewFilter, true);
  }, [imageLoaded, imageCacheVersion, previewFilter, renderCompositeToCanvas]);

  const addTextLayer = () => {
    const count = layers.filter((l) => l.type === 'text').length + 1;
    const jitter = ((layers.length % 5) - 2) * 5;
    const newLayer: ForensicLayer = {
      id: `rgb-txt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: 'text',
      label: `Texto Oculto #${count}`,
      channel: targetChannel,
      x: Math.max(15, Math.min(85, 50 + jitter)),
      y: Math.max(15, Math.min(85, 50 + jitter)),
      scale: 100,
      intensity: 40,
      rotation: 0,
      text: 'MENSAGEM FORENSE',
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedId(newLayer.id);
  };

  const handleAddImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (!url) return;
      const count = layers.filter((l) => l.type === 'image').length + 1;
      const newLayer: ForensicLayer = {
        id: `rgb-img-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        type: 'image',
        label: file.name.slice(0, 18) || `Imagem #${count}`,
        channel: targetChannel,
        x: 50,
        y: 50,
        scale: 100,
        intensity: 50,
        rotation: 0,
        imageUrl: url,
      };
      setLayers((prev) => [...prev, newLayer]);
      setSelectedId(newLayer.id);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateSelected = (patch: Partial<ForensicLayer>) => {
    if (!selectedId) return;
    setLayers((prev) => prev.map((l) => (l.id === selectedId ? { ...l, ...patch } : l)));
  };

  const duplicateSelected = () => {
    if (!selectedLayer) return;
    const copy: ForensicLayer = {
      ...selectedLayer,
      id: `rgb-cp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      label: `${selectedLayer.label} (cópia)`,
      x: Math.min(92, selectedLayer.x + 5),
      y: Math.min(92, selectedLayer.y + 5),
    };
    setLayers((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const deleteLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleGlobalChannelChange = (ch: ForensicChannel) => {
    setTargetChannel(ch);
    if (selectedId) {
      updateSelected({ channel: ch });
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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pt = getPointerPct(e);

    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      const b = getLayerBoundsPct(l);
      const halfW = Math.max(8, b.w / 2);
      const halfH = Math.max(8, b.h / 2);
      if (Math.abs(pt.x - l.x) <= halfW && Math.abs(pt.y - l.y) <= halfH) {
        setSelectedId(l.id);
        dragRef.current = {
          layerId: l.id,
          offsetX: pt.x - l.x,
          offsetY: pt.y - l.y,
        };
        e.currentTarget.setPointerCapture?.(e.pointerId);
        return;
      }
    }

    if (selectedId) {
      dragRef.current = {
        layerId: selectedId,
        offsetX: 0,
        offsetY: 0,
      };
      setLayers((prev) =>
        prev.map((l) => (l.id === selectedId ? { ...l, x: pt.x, y: pt.y } : l))
      );
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const pt = getPointerPct(e);
    const { layerId, offsetX, offsetY } = dragRef.current;
    let nx = Math.max(0, Math.min(100, pt.x - offsetX));
    let ny = Math.max(0, Math.min(100, pt.y - offsetY));
    const snapX = Math.abs(nx - 50) <= 2.2;
    const snapY = Math.abs(ny - 50) <= 2.2;
    if (snapX) nx = 50;
    if (snapY) ny = 50;
    setSnapGuides({ x: snapX, y: snapY });
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, x: nx, y: ny } : l)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      setSnapGuides({ x: false, y: false });
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
  };

  const applyForensicPreset = (preset: ForensicStylePreset) => {
    setTargetChannel(preset.targetChannel);
    setCamouflageEnabled(preset.camouflageEnabled);
    setCamouflageIntensity(preset.camouflageIntensity);
    if (selectedId) {
      updateSelected({
        channel: preset.targetChannel,
        intensity: preset.intensity,
      });
    }
  };

  const handleSaveCustomPreset = () => {
    const name = window.prompt('Nome do preset forense:');
    if (!name || !name.trim()) return;
    const nextPreset: ForensicStylePreset = {
      id: `custom-forensic-${Date.now()}`,
      label: name.trim(),
      targetChannel,
      camouflageEnabled,
      camouflageIntensity,
      intensity: selectedLayer?.intensity ?? 45,
      custom: true,
    };
    const updated = [...customPresets, nextPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem(FORENSIC_PRESETS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteCustomPreset = (id: string) => {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    try {
      localStorage.setItem(FORENSIC_PRESETS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleFitToBase = () => {
    if (selectedId) {
      updateSelected({ x: 50, y: 50, rotation: 0, scale: 100 });
    } else if (layers.length > 0) {
      setLayers((prev) =>
        prev.map((l) => ({ ...l, x: 50, y: 50, rotation: 0, scale: 100 }))
      );
    }
  };

  const handleSaveClick = async () => {
    if (!baseImageRef.current) return;
    setIsProcessing(true);
    try {
      // Export full-resolution composite RGB PNG (always unfiltered 'all', no selection box)
      const exportCanvas = document.createElement('canvas');
      renderCompositeToCanvas(exportCanvas, true, 'all', false);

      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Falha ao gerar PNG forense'))),
          'image/png',
          1.0
        );
      });

      const primaryLayer = selectedLayer || layers[0];
      const config: ForensicConfig = {
        targetChannel: primaryLayer?.channel || targetChannel,
        overlayType: primaryLayer ? primaryLayer.type : 'none',
        text: layers
          .filter((l) => l.type === 'text' && l.text?.trim())
          .map((l) => l.text?.trim())
          .join('\n'),
        fontSize: primaryLayer ? Math.round((primaryLayer.scale / 100) * 48) : 48,
        intensity: primaryLayer?.intensity ?? 45,
        positionX: Math.round(primaryLayer?.x ?? 50),
        positionY: Math.round(primaryLayer?.y ?? 50),
        overlayImageUrl: primaryLayer?.imageUrl,
        camouflageEnabled,
        camouflageIntensity,
        applyMode,
      };

      baselineSnapshotRef.current = dirtySnapshot;
      onSave(blob, config);
    } catch (error) {
      console.error('Erro ao salvar imagem forense:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="forensic-editor-modal" onClick={(e) => handleBackdropClick(e)}>
      <div className="forensic-editor-content">
        <header className="forensic-editor-header">
          <div className="forensic-header-title">
            <Palette size={18} />
            <span>EDITOR FORENSE RGB C.R.I.S.</span>
            <span className={`forensic-channel-pill ch-${targetChannel.toLowerCase()}`}>
              CANAL {targetChannel}
            </span>
          </div>

          <div className="forensic-header-actions">
            <button
              type="button"
              className="forensic-btn-save"
              onClick={handleSaveClick}
              disabled={isProcessing || !imageLoaded}
            >
              <Check size={15} />{' '}
              {isProcessing ? 'PROCESSANDO...' : 'APLICAR DIRETO NA PISTA'}
            </button>
            <button
              type="button"
              className="forensic-sim-btn"
              onClick={handleFitToBase}
              title="Centralizar e ajustar escala à proporção da imagem base"
            >
              <Target size={14} /> Encaixar na Proporção da Base
            </button>
            <button
              type="button"
              className="forensic-btn-close"
              onClick={() => guardClose()}
              title="Fechar editor"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="forensic-editor-body">
          {/* Left: Live RGB Filter Simulator + Canvas */}
          <div className="forensic-preview-section">
            <div className="forensic-filter-bar" role="group" aria-label="Simulador de Filtro RGB">
              <span className="forensic-bar-label">
                <Eye size={13} /> SIMULADOR:
              </span>
              <button
                type="button"
                className={`forensic-sim-btn sim-all ${previewFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPreviewFilter('all')}
              >
                Normal (RGB)
              </button>
              <button
                type="button"
                className={`forensic-sim-btn sim-r ${previewFilter === 'r' ? 'active' : ''}`}
                onClick={() => setPreviewFilter('r')}
              >
                Filtro Vermelho (R)
              </button>
              <button
                type="button"
                className={`forensic-sim-btn sim-g ${previewFilter === 'g' ? 'active' : ''}`}
                onClick={() => setPreviewFilter('g')}
              >
                Filtro Verde (G)
              </button>
              <button
                type="button"
                className={`forensic-sim-btn sim-b ${previewFilter === 'b' ? 'active' : ''}`}
                onClick={() => setPreviewFilter('b')}
              >
                Filtro Azul (B)
              </button>
              <span className="forensic-bar-label" style={{ marginLeft: 8 }}>
                <Sparkles size={12} /> PRESETS:
              </span>
              {[...BUILTIN_FORENSIC_PRESETS, ...customPresets].map((preset) => (
                <span key={preset.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <button
                    type="button"
                    className="forensic-sim-btn"
                    onClick={() => applyForensicPreset(preset)}
                  >
                    {preset.label}
                  </button>
                  {preset.custom && (
                    <button
                      type="button"
                      className="forensic-layer-action"
                      onClick={() => handleDeleteCustomPreset(preset.id)}
                      title="Excluir preset"
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
              <button
                type="button"
                className="forensic-sim-btn"
                onClick={handleSaveCustomPreset}
                title="Salvar estilo atual como preset"
              >
                <BookmarkPlus size={12} /> + Preset
              </button>
            </div>

            <div className="forensic-canvas-stage">
              <canvas
                ref={canvasRef}
                className="forensic-canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
              {layers.length === 0 && (
                <div className="forensic-empty-overlay">
                  Adicione um Texto Oculto ou Imagem/QR ao lado e teste no Simulador R/G/B acima.
                </div>
              )}
            </div>

            <p className="forensic-preview-hint">
              Arraste diretamente no canvas (mouse ou toque) para posicionar a camada selecionada. Alterne entre Normal (RGB) e os filtros R/G/B para calibrar o disfarce.
            </p>
          </div>

          {/* Right: Controls */}
          <aside className="forensic-controls-section">
            {/* Target Channel + Add Layers */}
            <div className="forensic-panel-card">
              <div className="forensic-card-title">
                <Target size={13} /> CANAL ALVO & ADICIONAR CAMADAS
              </div>

              <div className="forensic-channel-group">
                {(['R', 'G', 'B'] as ForensicChannel[]).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    className={`forensic-ch-btn ch-${ch.toLowerCase()} ${
                      targetChannel === ch ? 'active' : ''
                    }`}
                    onClick={() => handleGlobalChannelChange(ch)}
                  >
                    Canal {ch}
                  </button>
                ))}
              </div>

              <div className="forensic-add-row">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAddImageFile}
                />
                <button type="button" className="forensic-add-btn" onClick={addTextLayer}>
                  <Type size={14} /> + Texto Oculto
                </button>
                <button
                  type="button"
                  className="forensic-add-btn"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImageIcon size={14} /> + Imagem / QR
                </button>
              </div>
            </div>

            {/* Camouflage / Noise in other channels */}
            <div className="forensic-panel-card">
              <div className="forensic-camouflage-head">
                <span className="forensic-card-title">
                  <Shield size={13} /> CAMUFLAGEM / RUÍDO
                </span>
                <label className="forensic-switch">
                  <input
                    type="checkbox"
                    checked={camouflageEnabled}
                    onChange={(e) => setCamouflageEnabled(e.target.checked)}
                  />
                  <span>{camouflageEnabled ? 'ATIVO' : 'OFF'}</span>
                </label>
              </div>
              {camouflageEnabled && (
                <div className="forensic-control-group">
                  <label className="forensic-control-label">
                    <span>INTENSIDADE NOS OUTROS CANAIS</span>
                    <span>{camouflageIntensity}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={camouflageIntensity}
                    onChange={(e) => setCamouflageIntensity(Number(e.target.value))}
                    className="forensic-slider"
                  />
                  <span className="forensic-micro-hint">
                    Disfarça a silhueta a olho nu injetando contrapeso e ruído nos canais não-alvo.
                  </span>
                </div>
              )}
            </div>

            {/* Active Layers List */}
            <div className="forensic-panel-card">
              <div className="forensic-card-title">
                <Layers size={13} /> CAMADAS ATIVAS ({layers.length})
              </div>
              {layers.length === 0 ? (
                <div className="forensic-empty-list">Nenhuma camada secreta adicionada.</div>
              ) : (
                <div className="forensic-layers-list">
                  {layers.map((l) => (
                    <div
                      key={l.id}
                      className={`forensic-layer-item ${l.id === selectedId ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedId(l.id);
                        setTargetChannel(l.channel);
                      }}
                    >
                      <span className={`forensic-layer-badge ch-${l.channel.toLowerCase()}`}>
                        {l.channel}
                      </span>
                      <span className="forensic-layer-name">
                        {l.type === 'text' && l.text ? `"${l.text.slice(0, 20)}"` : l.label}
                      </span>
                      <button
                        type="button"
                        className="forensic-icon-btn danger"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          deleteLayer(l.id);
                        }}
                        title="Remover camada"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Layer Inspector */}
            {selectedLayer && (
              <div className="forensic-panel-card forensic-inspector-card">
                <div className="forensic-inspector-head">
                  <span className="forensic-card-title">PROPRIEDADES DA CAMADA</span>
                  <div className="forensic-inspector-actions">
                    <button
                      type="button"
                      className="forensic-icon-btn"
                      onClick={duplicateSelected}
                      title="Duplicar camada"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      className="forensic-icon-btn danger"
                      onClick={() => deleteLayer(selectedLayer.id)}
                      title="Excluir camada"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {selectedLayer.type === 'text' && (
                  <div className="forensic-control-group">
                    <label className="forensic-control-label">TEXTO SECRETO</label>
                    <textarea
                      className="forensic-textarea"
                      rows={3}
                      value={selectedLayer.text || ''}
                      onChange={(e) => updateSelected({ text: e.target.value })}
                      placeholder="Digite o texto oculto..."
                    />
                  </div>
                )}

                <div className="forensic-control-group">
                  <label className="forensic-control-label">
                    <span>INTENSIDADE NO CANAL {selectedLayer.channel}</span>
                    <span>{selectedLayer.intensity}%</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={selectedLayer.intensity}
                    onChange={(e) => updateSelected({ intensity: Number(e.target.value) })}
                    className="forensic-slider"
                  />
                </div>

                <div className="forensic-control-group">
                  <label className="forensic-control-label">
                    <span>ESCALA / TAMANHO</span>
                    <span>{selectedLayer.scale}%</span>
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={250}
                    value={selectedLayer.scale}
                    onChange={(e) => updateSelected({ scale: Number(e.target.value) })}
                    className="forensic-slider"
                  />
                </div>

                <div className="forensic-control-group">
                  <label className="forensic-control-label">
                    <span>
                      <RotateCw size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      ROTAÇÃO
                    </span>
                    <span>{selectedLayer.rotation}°</span>
                  </label>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={selectedLayer.rotation}
                    onChange={(e) => updateSelected({ rotation: Number(e.target.value) })}
                    className="forensic-slider"
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button
                      type="button"
                      className="forensic-sim-btn"
                      style={{ flex: 1, justifyContent: 'center', padding: '4px 6px', fontSize: 11 }}
                      onClick={() => {
                        const next = ((selectedLayer.rotation - 90 + 180) % 360) - 180;
                        updateSelected({ rotation: next });
                      }}
                    >
                      -90°
                    </button>
                    <button
                      type="button"
                      className="forensic-sim-btn"
                      style={{ flex: 1, justifyContent: 'center', padding: '4px 6px', fontSize: 11 }}
                      onClick={() => updateSelected({ rotation: 0 })}
                    >
                      0°
                    </button>
                    <button
                      type="button"
                      className="forensic-sim-btn"
                      style={{ flex: 1, justifyContent: 'center', padding: '4px 6px', fontSize: 11 }}
                      onClick={() => {
                        const next = ((selectedLayer.rotation + 90 + 180) % 360) - 180;
                        updateSelected({ rotation: next });
                      }}
                    >
                      +90°
                    </button>
                  </div>
                </div>

                <div className="forensic-xy-grid">
                  <div className="forensic-control-group">
                    <label className="forensic-control-label">
                      <span>EIXO X</span>
                      <span>{Math.round(selectedLayer.x)}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(selectedLayer.x)}
                      onChange={(e) => updateSelected({ x: Number(e.target.value) })}
                      className="forensic-slider"
                    />
                  </div>
                  <div className="forensic-control-group">
                    <label className="forensic-control-label">
                      <span>EIXO Y</span>
                      <span>{Math.round(selectedLayer.y)}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(selectedLayer.y)}
                      onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                      className="forensic-slider"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Apply Mode Selector */}
            <div className="forensic-panel-card">
              <div className="forensic-card-title">
                <Save size={13} /> DESTINO AO APLICAR
              </div>
              <div className="forensic-apply-mode">
                <button
                  type="button"
                  className={`forensic-apply-btn ${applyMode === 'layer' ? 'active' : ''}`}
                  onClick={() => setApplyMode('layer')}
                >
                  Camada Forense RGB
                </button>
                <button
                  type="button"
                  className={`forensic-apply-btn ${applyMode === 'composite' ? 'active' : ''}`}
                  onClick={() => setApplyMode('composite')}
                >
                  Substituir Imagem Base
                </button>
              </div>
              <span className="forensic-micro-hint">
                {applyMode === 'layer'
                  ? 'Salva como camada forense dedicada na pista (mantém a base original intacta).'
                  : 'Grava o resultado composto direto na imagem principal da pista + registra o canal.'}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
