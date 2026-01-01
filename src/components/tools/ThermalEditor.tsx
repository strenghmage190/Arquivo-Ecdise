import React, { useState, useRef, useEffect } from 'react';
import './ThermalEditor.css';

interface ThermalEditorProps {
  baseImageUrl: string;
  thermalText: string;
  onSave: (config: { text: string; fontSize: number; positionY: number }) => void;
  onClose: () => void;
  initialFontSize?: number;
  initialPositionY?: number;
}

export default function ThermalEditor({
  baseImageUrl,
  thermalText,
  onSave,
  onClose,
  initialFontSize = 100,
  initialPositionY = 50,
}: ThermalEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [positionY, setPositionY] = useState(initialPositionY);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Apply thermal effect and render text
  const renderThermalPreview = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImageUrl;
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.naturalWidth || img.width || 1024;
      canvas.height = img.naturalHeight || img.height || 768;

      // Draw and apply thermal effect
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // IRONBOW mapping
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        const val = (r + g + b) / 3;

        let red = 0,
          green = 0,
          blue = 0;

        if (val < 85) {
          const t = val / 85;
          red = Math.round(t * 70);
          green = 0;
          blue = Math.round(t * 100);
        } else if (val < 170) {
          const t = (val - 85) / 85;
          red = Math.round(70 + t * (255 - 70));
          green = 0;
          blue = Math.round(100 - t * 100);
        } else {
          const t = (val - 170) / 85;
          red = 255;
          green = Math.round(t * 255);
          blue = Math.round(t * 255);
        }

        data[i] = Math.max(0, Math.min(255, red));
        data[i + 1] = Math.max(0, Math.min(255, green));
        data[i + 2] = Math.max(0, Math.min(255, blue));
      }

      ctx.putImageData(imageData, 0, 0);

      // Render text
      if (thermalText && thermalText.trim()) {
        let baseFontSize = Math.max(48, Math.min(canvas.width, canvas.height) / 12);
        const fontSizeMultiplier = fontSize / 100;
        baseFontSize = baseFontSize * fontSizeMultiplier;

        ctx.font = `bold ${Math.round(baseFontSize)}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Split into lines
        const maxLineLength = 40;
        const lines: string[] = [];
        const paragraphs = thermalText.split('\n');

        paragraphs.forEach((paragraph) => {
          if (paragraph.length <= maxLineLength) {
            lines.push(paragraph);
          } else {
            const words = paragraph.split(' ');
            let currentLine = '';
            words.forEach((word) => {
              if ((currentLine + ' ' + word).length <= maxLineLength) {
                currentLine += (currentLine ? ' ' : '') + word;
              } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
              }
            });
            if (currentLine) lines.push(currentLine);
          }
        });

        // Position based on slider
        const lineHeight = baseFontSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        const posYPercent = (positionY + dragOffset) / 100;
        const startY = canvas.height * posYPercent - totalHeight / 2 + lineHeight / 2;
        const centerX = canvas.width / 2;

        // Draw text with thermal glow
        lines.forEach((line, index) => {
          const y = startY + index * lineHeight;

          // Outer glow
          ctx.shadowBlur = 30;
          ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
          ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
          ctx.fillText(line, centerX, y);

          // Mid glow
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(255, 200, 0, 1)';
          ctx.fillStyle = 'rgba(255, 220, 0, 0.6)';
          ctx.fillText(line, centerX, y);

          // Core text
          ctx.shadowBlur = 5;
          ctx.shadowColor = 'rgba(255, 255, 255, 1)';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fillText(line, centerX, y);
        });

        ctx.shadowBlur = 0;
      }
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      renderThermalPreview(canvas);
    }
  }, [baseImageUrl, thermalText, fontSize, positionY, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const deltaY = e.clientY - (rect.top + rect.height / 2);
    const newOffset = (deltaY / rect.height) * 100;
    const clamped = Math.max(-50, Math.min(50, newOffset));
    setDragOffset(clamped);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveClick = () => {
    onSave({
      text: thermalText,
      fontSize: fontSize,
      positionY: positionY + dragOffset,
    });
  };

  return (
    <div className="thermal-editor-modal">
      <div className="thermal-editor-content">
        <div className="thermal-editor-header">
          <h2>🌡️ EDITOR DE TEXTO TERMAL</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="thermal-editor-body">
          {/* Preview */}
          <div className="thermal-preview-section">
            <h3>PREVIEW (Arraste para mover)</h3>
            <canvas
              ref={canvasRef}
              className="thermal-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <p className="preview-hint">💡 Arraste verticalmente no canvas para mover o texto</p>
          </div>

          {/* Controls */}
          <div className="thermal-controls-section">
            {/* Text Input */}
            <div className="control-group">
              <label className="control-label">TEXTO SECRETO</label>
              <textarea
                value={thermalText}
                readOnly
                placeholder="Não editável aqui. Use o campo anterior."
                rows={4}
                className="control-textarea"
              />
            </div>

            {/* Font Size */}
            <div className="control-group">
              <label className="control-label">TAMANHO DA FONTE: {fontSize}%</label>
              <input
                type="range"
                min="50"
                max="200"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="control-slider"
              />
              <div className="slider-labels">
                <span>50%</span>
                <span>100%</span>
                <span>150%</span>
                <span>200%</span>
              </div>
            </div>

            {/* Position Y */}
            <div className="control-group">
              <label className="control-label">POSIÇÃO VERTICAL (Base): {positionY}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={positionY}
                onChange={(e) => setPositionY(Number(e.target.value))}
                className="control-slider"
              />
              <div className="slider-labels">
                <span>0% (Topo)</span>
                <span>50% (Meio)</span>
                <span>100% (Fundo)</span>
              </div>
            </div>

            {/* Drag Info */}
            {dragOffset !== 0 && (
              <div className="drag-info">
                <span>Ajuste de arrasto: {dragOffset > 0 ? '+' : ''}{dragOffset.toFixed(1)}%</span>
              </div>
            )}

            {/* Buttons */}
            <div className="control-buttons">
              <button className="btn-cancel" onClick={onClose}>
                CANCELAR
              </button>
              <button className="btn-save" onClick={handleSaveClick}>
                ✓ APLICAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
