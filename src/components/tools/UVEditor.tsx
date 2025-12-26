import React, { useRef, useState, useEffect } from 'react';

interface UVEditorProps {
  baseImageUrl: string;
  onSave: (file: File) => void;
  onClose: () => void;
}

export default function UVEditor({ baseImageUrl, onSave, onClose }: UVEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#b366ff');
  const [brushSize, setBrushSize] = useState(6);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImageUrl;
    img.onload = () => {
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [baseImageUrl]);

  const getCtx = (): CanvasRenderingContext2D | null => canvasRef.current?.getContext('2d') || null;

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    if (mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.shadowBlur = 0;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
    }
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const ctx = getCtx();
    ctx?.closePath();
    setIsDrawing(false);
  };

  const handleFinish = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `uv_layer_${Date.now()}.png`, { type: 'image/png' });
      onSave(file);
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="uv-editor-overlay">
      <div className="uv-editor-panel">
        <div className="uv-header">
          <h3>Escrever Mensagem Oculta (Luz UV)</h3>
          <button onClick={onClose} className="btn-close">X</button>
        </div>
        <div className="editor-workspace">
          <div className="canvas-container" style={{ backgroundImage: `url(${baseImageUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ cursor: mode === 'erase' ? 'cell' : 'crosshair', display: 'block', maxWidth: '100%' }}
            />
          </div>
        </div>
        <div className="uv-toolbar">
          <div className="color-picker">
            <span className="label">Cor Neon:</span>
            <button style={{background:'#b366ff', boxShadow:'0 0 5px #b366ff'}} onClick={()=> { setColor('#b366ff'); setMode('draw'); }} />
            <button style={{background:'#00ffff', boxShadow:'0 0 5px #00ffff'}} onClick={()=> { setColor('#00ffff'); setMode('draw'); }} />
            <button style={{background:'#ff0033', boxShadow:'0 0 5px #ff0033'}} onClick={()=> { setColor('#ff0033'); setMode('draw'); }} />
            <button style={{background:'#39ff14', boxShadow:'0 0 5px #39ff14'}} onClick={()=> { setColor('#39ff14'); setMode('draw'); }} />
          </div>
          <div className="brush-size">
            <span className="label">Tamanho:</span>
            <input type="range" min="1" max="40" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
          </div>
          <div className="tools">
            <button onClick={() => setMode('erase')} className={mode === 'erase' ? 'active' : ''}>🗑️ Borracha</button>
            <button onClick={clearCanvas}>⚡ Limpar Tudo</button>
          </div>
          <button className="btn-save-uv" onClick={handleFinish}>CONFIRMAR ARTE SECRETA</button>
        </div>
      </div>
    </div>
  );
}
