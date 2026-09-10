import { Target, Save, X, Camera, Palette } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import './UVEditor.css';
import './ForensicChannelEditor.css';

interface ForensicChannelEditorProps {
  baseImageUrl: string;
  onSave: (compositeImageBlob: Blob, config: ForensicConfig) => void;
  onClose: () => void;
  initialConfig?: ForensicConfig;
}

export interface ForensicConfig {
  targetChannel: 'R' | 'G' | 'B';
  overlayType: 'text' | 'image' | 'none';
  text?: string;
  fontSize?: number;
  intensity: number;
  positionX: number;
  positionY: number;
  overlayImageUrl?: string;
}

export default function ForensicChannelEditor({
  baseImageUrl,
  onSave,
  onClose,
  initialConfig,
}: ForensicChannelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);

  // States
  const [targetChannel, setTargetChannel] = useState<'R' | 'G' | 'B'>(initialConfig?.targetChannel || 'R');
  const [overlayType, setOverlayType] = useState<'text' | 'image' | 'none'>(initialConfig?.overlayType || 'none');
  const [text, setText] = useState(initialConfig?.text || '');
  const [fontSize, setFontSize] = useState(initialConfig?.fontSize || 48);
  const [intensity, setIntensity] = useState(initialConfig?.intensity || 50);
  const [positionX, setPositionX] = useState(initialConfig?.positionX || 50);
  const [positionY, setPositionY] = useState(initialConfig?.positionY || 50);
  const [overlayImageFile, setOverlayImageFile] = useState<File | null>(null);
  const [overlayImageUrl, setOverlayImageUrl] = useState<string | null>(initialConfig?.overlayImageUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Zoom / Pan states
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Load base image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImageUrl;
    img.onload = () => {
      baseImageRef.current = img;
      renderPreview();
    };
  }, [baseImageUrl]);

  // Load overlay image when file changes
  useEffect(() => {
    if (overlayImageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setOverlayImageUrl(url);
        const img = new Image();
        img.src = url;
        img.onload = () => {
          overlayImageRef.current = img;
          renderPreview();
        };
      };
      reader.readAsDataURL(overlayImageFile);
    }
  }, [overlayImageFile]);

  // Render preview whenever settings change
  useEffect(() => {
    renderPreview();
  }, [targetChannel, overlayType, text, fontSize, intensity, positionX, positionY, overlayImageUrl]);

  const handleOverlayImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOverlayImageFile(e.target.files[0]);
    }
  };

  const renderPreview = () => {
    const canvas = canvasRef.current;
    const baseImage = baseImageRef.current;
    if (!canvas || !baseImage) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Use full intrinsic resolution
    const width = baseImage.naturalWidth || 800;
    const height = baseImage.naturalHeight || 600;

    canvas.width = width;
    canvas.height = height;

    // Clear and draw base image
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(baseImage, 0, 0, width, height);

    // Create overlay canvas with same backing store dimensions
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = width;
    overlayCanvas.height = height;
    const overlayCtx = overlayCanvas.getContext('2d', { willReadFrequently: true });
    if (!overlayCtx) return;

    if (overlayType === 'text' && text.trim()) {
      drawTextOverlay(overlayCtx, width, height);
    } else if (overlayType === 'image' && overlayImageRef.current) {
      drawImageOverlay(overlayCtx, width, height);
    }

    if (overlayType !== 'none') {
      mergeChannels(ctx, overlayCtx, width, height);
    }
  };

  const drawTextOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';

    const x = (positionX / 100) * width;
    const y = (positionY / 100) * height;
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = y - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, x, startY + index * lineHeight);
    });
  };

  const drawImageOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const overlayImg = overlayImageRef.current;
    if (!overlayImg) return;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    const maxSize = Math.min(width, height) * 0.5;
    const aspectRatio = overlayImg.width / overlayImg.height;
    let drawWidth = maxSize;
    let drawHeight = maxSize / aspectRatio;
    if (drawHeight > maxSize) {
      drawHeight = maxSize;
      drawWidth = maxSize * aspectRatio;
    }
    const x = (positionX / 100) * width - drawWidth / 2;
    const y = (positionY / 100) * height - drawHeight / 2;
    ctx.drawImage(overlayImg, x, y, drawWidth, drawHeight);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const mergeChannels = (baseCtx: CanvasRenderingContext2D, overlayCtx: CanvasRenderingContext2D, width: number, height: number) => {
    const baseData = baseCtx.getImageData(0, 0, width, height);
    const overlayData = overlayCtx.getImageData(0, 0, width, height);
    const base = baseData.data;
    const overlay = overlayData.data;
    const intensityFactor = intensity / 100;
    const channelIndex = targetChannel === 'R' ? 0 : targetChannel === 'G' ? 1 : 2;

    for (let i = 0; i < base.length; i += 4) {
      const overlayGray = (overlay[i] + overlay[i + 1] + overlay[i + 2]) / 3;
      const overlayValue = (overlayGray / 255) * intensityFactor;
      const currentValue = base[i + channelIndex];
      const newValue = Math.min(255, currentValue + overlayValue * 255);
      base[i + channelIndex] = Math.round(newValue);
    }
    baseCtx.putImageData(baseData, 0, 0);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2) {
      // Middle or right click for panning
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } else {
      // allow left click panning too? UVEditor generally uses wheel/middle
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = Math.exp(delta * 0.001);
    const newScale = Math.min(10, Math.max(0.1, scale * factor));
    
    // Zoom towards center
    setScale(newScale);
  };

  const handleSaveClick = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsProcessing(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => { if (b) resolve(b); else reject(new Error('Failed to generate blob')); }, 'image/png', 1.0);
      });
      const config: ForensicConfig = { targetChannel, overlayType, text, fontSize, intensity, positionX, positionY, overlayImageUrl };
      onSave(blob, config);
    } catch (error) {
      console.error('Error saving forensic image:', error);
      alert('Erro ao salvar imagem forense');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="uv-editor-panel">
      <div className="uv-editor-header">
        <div className="uv-header-title">
          <Palette size={18} className="header-icon" /> <span>Editor RGB Forense</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={handleSaveClick} className="btn-save" title="Salvar imagem" disabled={isProcessing}>
            <Save size={14} style={{ marginRight: 4 }} /> {isProcessing ? 'Processando...' : 'Salvar'}
          </button>
          <button onClick={onClose} className="btn-close" title="Fechar editor">
            <X size={14} style={{ marginRight: 4 }} /> Fechar
          </button>
        </div>
      </div>

      <div className="uv-editor-viewport" ref={containerRef} style={{ overflow: 'hidden', position: 'relative' }}>
        <div 
          className="viewport-canvas" 
          style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: `${scale * 100}%`,
              height: `${scale * 100}%`,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              objectFit: 'contain',
              cursor: isPanning ? 'grabbing' : 'grab',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out'
            }}
          />
        </div>
        <div style={{ position: 'absolute', bottom: 16, left: 16, color: 'rgba(255,255,255,0.5)', fontSize: 12, pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 4 }}>
          Arraste p/ mover | Scroll p/ zoom
        </div>
      </div>

      <div className="uv-right-panel" style={{ width: '300px', flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="uv-right-tabs">
          <div className="tab active">Isolamento & Espectro</div>
        </div>

        <div className="properties-panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', height: 'calc(100vh - 48px - 40px)' }}>
          
          <div className="rgb-channel-container">
            <label className="rgb-channel-title" style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              <Target size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> CANAL ALVO RGB
            </label>
            <div className="rgb-channel-group" style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 6 }}>
              <button
                type="button"
                onClick={() => setTargetChannel('R')}
                style={{ flex: 1, padding: '8px 0', border: 'none', background: targetChannel === 'R' ? 'rgba(255,50,50,0.2)' : 'transparent', color: targetChannel === 'R' ? '#ff8888' : '#888', borderRadius: 4, cursor: 'pointer', transition: '0.2s' }}
              >R</button>
              <button
                type="button"
                onClick={() => setTargetChannel('G')}
                style={{ flex: 1, padding: '8px 0', border: 'none', background: targetChannel === 'G' ? 'rgba(50,255,50,0.2)' : 'transparent', color: targetChannel === 'G' ? '#88ff88' : '#888', borderRadius: 4, cursor: 'pointer', transition: '0.2s' }}
              >G</button>
              <button
                type="button"
                onClick={() => setTargetChannel('B')}
                style={{ flex: 1, padding: '8px 0', border: 'none', background: targetChannel === 'B' ? 'rgba(50,150,255,0.2)' : 'transparent', color: targetChannel === 'B' ? '#88ccff' : '#888', borderRadius: 4, cursor: 'pointer', transition: '0.2s' }}
              >B</button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              TIPO DE SOBREPOSIÇÃO
            </label>
            <select 
              value={overlayType} 
              onChange={(e) => setOverlayType(e.target.value as any)}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6, outline: 'none' }}
            >
              <option value="none">Nenhum (Apenas visualizar)</option>
              <option value="text">Texto Secreto</option>
              <option value="image">Imagem/QR Code Secreto</option>
            </select>
          </div>

          {overlayType === 'text' && (
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>TEXTO SECRETO</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite o texto oculto..."
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6, padding: 8, outline: 'none', resize: 'vertical' }}
              />
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 6 }}>
                  <span>Tamanho da Fonte</span>
                  <span>{fontSize}px</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="300"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {overlayType === 'image' && (
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}><Camera size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> IMAGEM SECRETA</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleOverlayImageChange}
                style={{ width: '100%', fontSize: 12 }}
              />
            </div>
          )}

          {overlayType !== 'none' && (
            <>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 6 }}>
                  <span>Intensidade da Marca d'Água</span>
                  <span>{intensity}%</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.4 }}>
                  Valores baixos (10-30%) deixam a mensagem invisível a olho nu, revelada apenas via isolamento forense.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>POSIÇÃO</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 6 }}>
                      <span>Eixo X</span>
                      <span>{positionX}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={positionX} onChange={(e) => setPositionX(Number(e.target.value))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 6 }}>
                      <span>Eixo Y</span>
                      <span>{positionY}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={positionY} onChange={(e) => setPositionY(Number(e.target.value))} style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
