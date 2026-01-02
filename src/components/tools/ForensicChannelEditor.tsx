import React, { useState, useRef, useEffect } from 'react';
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
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);

  // States
  const [targetChannel, setTargetChannel] = useState<'R' | 'G' | 'B'>(
    initialConfig?.targetChannel || 'R'
  );
  const [overlayType, setOverlayType] = useState<'text' | 'image' | 'none'>(
    initialConfig?.overlayType || 'none'
  );
  const [text, setText] = useState(initialConfig?.text || '');
  const [fontSize, setFontSize] = useState(initialConfig?.fontSize || 48);
  const [intensity, setIntensity] = useState(initialConfig?.intensity || 50);
  const [positionX, setPositionX] = useState(initialConfig?.positionX || 50);
  const [positionY, setPositionY] = useState(initialConfig?.positionY || 50);
  const [overlayImageFile, setOverlayImageFile] = useState<File | null>(null);
  const [overlayImageUrl, setOverlayImageUrl] = useState<string | null>(
    initialConfig?.overlayImageUrl || null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Load base image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImageUrl;
    img.onload = () => {
      baseImageRef.current = img;
      renderPreview();
    };
    img.onerror = () => {
      console.error('Failed to load base image');
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

  const renderPreview = () => {
    const canvas = canvasRef.current;
    const baseImage = baseImageRef.current;
    if (!canvas || !baseImage) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size to match base image
    canvas.width = baseImage.naturalWidth || baseImage.width;
    canvas.height = baseImage.naturalHeight || baseImage.height;

    // Draw base image
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // Create overlay canvas
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!overlayCtx) return;

    // Draw overlay based on type
    if (overlayType === 'text' && text.trim()) {
      drawTextOverlay(overlayCtx, canvas.width, canvas.height);
    } else if (overlayType === 'image' && overlayImageRef.current) {
      drawImageOverlay(overlayCtx, canvas.width, canvas.height);
    }

    // Process and merge channels
    if (overlayType !== 'none') {
      mergeChannels(ctx, overlayCtx, canvas.width, canvas.height);
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

    // Split text into lines
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

    // Fill with black
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Calculate overlay position and size
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

    // Draw image
    ctx.drawImage(overlayImg, x, y, drawWidth, drawHeight);

    // Convert to grayscale
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const mergeChannels = (
    baseCtx: CanvasRenderingContext2D,
    overlayCtx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const baseData = baseCtx.getImageData(0, 0, width, height);
    const overlayData = overlayCtx.getImageData(0, 0, width, height);
    const base = baseData.data;
    const overlay = overlayData.data;

    const intensityFactor = intensity / 100;
    const channelIndex = targetChannel === 'R' ? 0 : targetChannel === 'G' ? 1 : 2;

    for (let i = 0; i < base.length; i += 4) {
      const pixelIndex = i / 4;
      const overlayGray = (overlay[i] + overlay[i + 1] + overlay[i + 2]) / 3;
      const overlayValue = (overlayGray / 255) * intensityFactor;

      // Inject into target channel
      const currentValue = base[i + channelIndex];
      const newValue = Math.min(255, currentValue + overlayValue * 255);
      base[i + channelIndex] = Math.round(newValue);
    }

    baseCtx.putImageData(baseData, 0, 0);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDragging(true);
    setDragStart({ x: positionX - x, y: positionY - y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPositionX(Math.max(0, Math.min(100, x + dragStart.x)));
    setPositionY(Math.max(0, Math.min(100, y + dragStart.y)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleOverlayImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOverlayImageFile(file);
      setOverlayType('image');
    }
  };

  const handleSaveClick = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);

    try {
      // Generate final composite
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to generate blob'));
          },
          'image/png',
          1.0
        );
      });

      const config: ForensicConfig = {
        targetChannel,
        overlayType,
        text,
        fontSize,
        intensity,
        positionX,
        positionY,
        overlayImageUrl,
      };

      onSave(blob, config);
    } catch (error) {
      console.error('Error saving forensic image:', error);
      alert('Erro ao salvar imagem forense');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="forensic-editor-modal">
      <div className="forensic-editor-content">
        <div className="forensic-editor-header">
          <h2>🔬 FORENSIC RGB CHANNEL EDITOR</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="forensic-editor-body">
          {/* Preview Canvas */}
          <div className="forensic-preview-section">
            <h3>PREVIEW (Arraste para posicionar)</h3>
            <div className="canvas-container">
              <canvas
                ref={canvasRef}
                className="forensic-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
            <p className="info-text">
              Canal Alvo: <strong className={`channel-${targetChannel.toLowerCase()}`}>{targetChannel}</strong> | 
              Intensidade: <strong>{intensity}%</strong>
            </p>
          </div>

          {/* Controls */}
          <div className="forensic-controls-section">
            {/* Target Channel Selection */}
            <div className="control-group">
              <label>🎯 CANAL ALVO</label>
              <div className="channel-buttons">
                <button
                  className={`channel-btn channel-r ${targetChannel === 'R' ? 'active' : ''}`}
                  onClick={() => setTargetChannel('R')}
                >
                  RED (R)
                </button>
                <button
                  className={`channel-btn channel-g ${targetChannel === 'G' ? 'active' : ''}`}
                  onClick={() => setTargetChannel('G')}
                >
                  GREEN (G)
                </button>
                <button
                  className={`channel-btn channel-b ${targetChannel === 'B' ? 'active' : ''}`}
                  onClick={() => setTargetChannel('B')}
                >
                  BLUE (B)
                </button>
              </div>
            </div>

            {/* Overlay Type */}
            <div className="control-group">
              <label>🖼️ TIPO DE SOBREPOSIÇÃO</label>
              <div className="overlay-type-buttons">
                <button
                  className={`overlay-type-btn ${overlayType === 'none' ? 'active' : ''}`}
                  onClick={() => setOverlayType('none')}
                >
                  Nenhum
                </button>
                <button
                  className={`overlay-type-btn ${overlayType === 'text' ? 'active' : ''}`}
                  onClick={() => setOverlayType('text')}
                >
                  Texto
                </button>
                <button
                  className={`overlay-type-btn ${overlayType === 'image' ? 'active' : ''}`}
                  onClick={() => setOverlayType('image')}
                >
                  Imagem/QR
                </button>
              </div>
            </div>

            {/* Text Input */}
            {overlayType === 'text' && (
              <div className="control-group">
                <label>✍️ TEXTO SECRETO</label>
                <textarea
                  className="text-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Digite o texto a ser escondido..."
                  rows={4}
                />
                <div className="slider-control">
                  <label>Tamanho da Fonte: {fontSize}px</label>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Image Upload */}
            {overlayType === 'image' && (
              <div className="control-group">
                <label>📷 IMAGEM/STAMP SECRETO</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOverlayImageChange}
                  className="file-input"
                />
                {overlayImageUrl && (
                  <div className="overlay-preview">
                    <img src={overlayImageUrl} alt="Overlay" />
                  </div>
                )}
              </div>
            )}

            {/* Intensity Slider */}
            {overlayType !== 'none' && (
              <div className="control-group">
                <label>💪 INTENSIDADE: {intensity}%</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="intensity-slider"
                />
                <p className="hint-text">
                  Valores baixos (10-30%) tornam o sinal quase invisível. 
                  Valores altos (70-100%) deixam visível a olho nu.
                </p>
              </div>
            )}

            {/* Position Controls */}
            {overlayType !== 'none' && (
              <div className="control-group">
                <label>📍 POSIÇÃO</label>
                <div className="position-sliders">
                  <div className="slider-control">
                    <label>Horizontal (X): {positionX}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={positionX}
                      onChange={(e) => setPositionX(Number(e.target.value))}
                    />
                  </div>
                  <div className="slider-control">
                    <label>Vertical (Y): {positionY}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={positionY}
                      onChange={(e) => setPositionY(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="forensic-editor-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-save"
            onClick={handleSaveClick}
            disabled={isProcessing || overlayType === 'none'}
          >
            {isProcessing ? 'Processando...' : '💾 Salvar Imagem Forense'}
          </button>
        </div>
      </div>
    </div>
  );
}
