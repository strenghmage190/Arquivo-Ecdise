import React, { useRef, useState, useEffect } from 'react';
import './UVEditor.css';

interface UVEditorProps {
  baseImageUrl: string;
  onSave: (file: File) => void;
  onClose: () => void;
  mode?: 'uv' | 'filter';
}

export default function UVEditor({ baseImageUrl, onSave, onClose, mode = 'uv' }: UVEditorProps) {
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
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);
  const dragOffsetRef = useRef<{ox:number, oy:number} | null>(null);
  const drawingOffscreen = useRef<HTMLCanvasElement | null>(null);

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
      // initialize offscreen drawing canvas to capture brush strokes
      drawingOffscreen.current = document.createElement('canvas');
      drawingOffscreen.current.width = canvas.width;
      drawingOffscreen.current.height = canvas.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [baseImageUrl]);

  // redraw main canvas from offscreen drawing + layers
  const redrawAll = () => {
    const canvas = canvasRef.current;
    const off = drawingOffscreen.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // draw existing strokes from offscreen
    if (off) ctx.drawImage(off, 0, 0);
    // draw layers
    for (const layer of layers) {
      if (layer.type === 'text') {
        ctx.save();
        // draw subtle stroke for contrast then fill
        ctx.fillStyle = layer.color || color;
        ctx.font = `${Math.max(8, layer.size || textSize)}px serif`;
        ctx.textBaseline = 'top';
        ctx.lineWidth = Math.max(1, (layer.size || textSize) * 0.08);
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeText(layer.text || '', layer.x, layer.y);
        ctx.fillText(layer.text || '', layer.x, layer.y);
        ctx.restore();
      } else if (layer.type === 'image' && layer.img) {
        const w = layer.img.naturalWidth * (layer.scale || 1);
        const h = layer.img.naturalHeight * (layer.scale || 1);
        ctx.drawImage(layer.img, layer.x - w/2, layer.y - h/2, w, h);
      }
    }
    // draw selection outline
    if (selectedLayer) {
      const s = layers.find(l => l.id === selectedLayer);
      if (s) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.setLineDash([6,4]);
        ctx.lineWidth = 2;
        if (s.type === 'image' && s.img) {
          const w = s.img.naturalWidth * (s.scale || 1);
          const h = s.img.naturalHeight * (s.scale || 1);
          ctx.strokeRect(s.x - w/2 - 6, s.y - h/2 - 6, w + 12, h + 12);
        } else if (s.type === 'text') {
          ctx.font = `${Math.max(8, s.size || textSize)}px serif`;
          const measure = ctx.measureText(s.text || '');
          const w = measure.width;
          const h = (s.size || textSize) * 1.2;
          ctx.strokeRect(s.x - 6, s.y - 6, w + 12, h + 12);
        }
        ctx.restore();
      }
    }
  };

  useEffect(() => {
    if (!imageFile) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = URL.createObjectURL(imageFile);
    img.onload = () => setImageEl(img);
    return () => { try { URL.revokeObjectURL(img.src); } catch(e) {} };
  }, [imageFile]);

  // redraw when layers change
  useEffect(() => { redrawAll(); }, [layers]);

  const getCtx = (): CanvasRenderingContext2D | null => canvasRef.current?.getContext('2d') || null;

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (tool !== 'draw' && tool !== 'erase') return;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width || 1;
    const scaleY = canvas.height / rect.height || 1;
    const x = rawX * scaleX;
    const y = rawY * scaleY;
    // draw on offscreen canvas so we can re-render layers on top
    const off = drawingOffscreen.current;
    if (!off) return;
    const octx = off.getContext('2d');
    if (!octx) return;
    octx.beginPath();
    octx.moveTo(x, y);
    octx.lineCap = 'round';
    octx.lineJoin = 'round';
    octx.lineWidth = brushSize * ((scaleX + scaleY) / 2);
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
    // immediately reflect on main canvas
    redrawAll();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width || 1;
    const scaleY = canvas.height / rect.height || 1;
    const x = rawX * scaleX;
    const y = rawY * scaleY;
    // if clicking on an existing layer, select it
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
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
          return;
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
          return;
        }
      }
    }

    // placing new items
    if (tool === 'placeText' && textValue) {
      const id = `layer-${Date.now()}`;
      const newLayer = { id, type: 'text', x, y, text: textValue, size: textSize, color };
      setLayers(prev => [...prev, newLayer]);
      setTool('draw');
      setTextValue('');
      redrawAll();
      return;
    }

    if (tool === 'placeImage' && imageEl) {
      const id = `layer-${Date.now()}`;
      const newLayer = { id, type: 'image', x, y, img: imageEl, scale: imageScale };
      setLayers(prev => [...prev, newLayer]);
      setTool('draw');
      setImageFile(null);
      setImageEl(null);
      redrawAll();
      return;
    }
    // if clicked on empty space, clear selection
    setSelectedLayer(null);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const off = drawingOffscreen.current;
    if (!off) return;
    const ctx = off.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width || 1;
    const scaleY = canvas.height / rect.height || 1;
    const x = rawX * scaleX;
    const y = rawY * scaleY;
    ctx.lineTo(x, y);
    ctx.stroke();
    // reflect stroke on main canvas
    redrawAll();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const off = drawingOffscreen.current;
    const ctx = off?.getContext('2d') || null;
    ctx?.closePath();
    setIsDrawing(false);
  };

  // drag handling for selected layer
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDraggingLayer) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const scaleX = canvas.width / rect.width || 1;
      const scaleY = canvas.height / rect.height || 1;
      const x = rawX * scaleX;
      const y = rawY * scaleY;
      if (!selectedLayer) return;
      setLayers(prev => prev.map(l => l.id !== selectedLayer ? l : { ...l, x: x - (dragOffsetRef.current?.ox||0), y: y - (dragOffsetRef.current?.oy||0) }));
      redrawAll();
    };
    const handleUp = () => {
      if (isDraggingLayer) setIsDraggingLayer(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingLayer, selectedLayer]);

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
      octx?.clearRect(0,0,off.width, off.height);
    }
    setLayers([]);
    redrawAll();
  };

  return (
    <div className="uv-editor-overlay">
      <div className="uv-editor-panel">
        <div className="uv-header">
          <h3>{mode === 'filter' ? 'Desenhar Segredos (Camada de Tratamento)' : 'Escrever Mensagem Oculta (Luz UV)'}</h3>
          <button onClick={onClose} className="btn-close">X</button>
        </div>
        <div className="editor-workspace">
          <div className="canvas-container" style={{ backgroundImage: `url(${baseImageUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
            <canvas
              ref={canvasRef}
              onMouseDown={(e) => { if (tool === 'draw' || tool === 'erase') startDrawing(e); else handleCanvasClick(e); }}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ cursor: tool === 'erase' ? 'cell' : (tool === 'placeImage' || tool === 'placeText') ? 'pointer' : 'crosshair', display: 'block', maxWidth: '100%' }}
            />
          </div>
        </div>
        <div className="uv-toolbar">
          <div className="color-picker">
            <span className="label">Cor Neon:</span>
            {mode === 'filter' ? (
              <>
                <button style={{ background: '#ffffff', boxShadow: '0 0 8px #fff' }} onClick={() => { setColor('#ffffff'); setTool('draw'); }} />
                <button style={{ background: 'rgba(255,255,255,0.5)', boxShadow: '0 0 5px rgba(255,255,255,0.5)' }} onClick={() => { setColor('rgba(255,255,255,0.5)'); setTool('draw'); }} />
              </>
            ) : (
              <>
                <button style={{background:'#b366ff', boxShadow:'0 0 5px #b366ff'}} onClick={()=> { setColor('#b366ff'); setTool('draw'); }} />
                <button style={{background:'#00ffff', boxShadow:'0 0 5px #00ffff'}} onClick={()=> { setColor('#00ffff'); setTool('draw'); }} />
                <button style={{background:'#ff0033', boxShadow:'0 0 5px #ff0033'}} onClick={()=> { setColor('#ff0033'); setTool('draw'); }} />
                <button style={{background:'#39ff14', boxShadow:'0 0 5px #39ff14'}} onClick={()=> { setColor('#39ff14'); setTool('draw'); }} />
              </>
            )}
          </div>
          <div className="brush-size">
            <span className="label">Tamanho:</span>
            <input type="range" min="1" max="40" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
          </div>
          <div className="tools">
            <button onClick={() => setTool('erase')} className={tool === 'erase' ? 'active' : ''}>🗑️ Borracha</button>
            <button onClick={() => {
              // toggle censor mode
              const next = !censorMode;
              setCensorMode(next);
              if (next) {
                setColor('#000000');
                setTool('draw');
                setBrushSize(20);
              }
            }} className={censorMode ? 'active' : ''}>🟥 Modo Censura</button>
            <button onClick={() => { setTool('placeText'); }} className={tool === 'placeText' ? 'active' : ''}>🅰️ Inserir Texto</button>
            <button onClick={() => { fileInputRef.current?.click(); }} className={tool === 'placeImage' ? 'active' : ''}>🖼️ Inserir Imagem</button>
            <button onClick={clearCanvas}>⚡ Limpar Tudo</button>
          </div>
          <div className="place-controls">
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0] || null; setImageFile(f); if (f) setTool('placeImage'); }} />
            <div style={{ display: tool === 'placeText' ? 'flex' : 'none', gap: 8, alignItems: 'center' }}>
              <input placeholder="Texto oculto" value={textValue} onChange={e => setTextValue(e.target.value)} style={{ padding: '6px' }} />
              <input type="number" min={8} max={200} value={textSize} onChange={e => setTextSize(Number(e.target.value))} style={{ width: 80 }} />
            </div>
            <div style={{ display: tool === 'placeImage' ? 'flex' : 'none', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 12, color: '#ddd' }}>Escala</label>
              <input type="range" min={0.1} max={2} step={0.05} value={imageScale} onChange={e => setImageScale(Number(e.target.value))} />
            </div>
            {/* Selected layer controls */}
            <div style={{ marginLeft: 12, display: selectedLayer ? 'flex' : 'none', gap: 8, alignItems: 'center' }}>
              <button onClick={() => {
                if (!selectedLayer) return;
                setLayers(prev => prev.filter(l => l.id !== selectedLayer));
                setSelectedLayer(null);
                redrawAll();
              }}>🗑️ Remover</button>
              <button onClick={() => { if (selectedLayer) { dragOffsetRef.current = { ox: 0, oy: 0 }; setIsDraggingLayer(true); } }}>✋ Arrastar</button>
              <label style={{ color:'#ddd' }}>Escala</label>
              <input type="range" min={0.1} max={2} step={0.05} value={(layers.find(l=>l.id===selectedLayer)?.scale) || 1} onChange={e => {
                const v = Number(e.target.value);
                setLayers(prev => prev.map(l => l.id !== selectedLayer ? l : { ...l, scale: v }));
                redrawAll();
              }} />
            </div>
          </div>
          <button className="btn-save-uv" onClick={handleFinish}>CONFIRMAR ARTE SECRETA</button>
        </div>
      </div>
    </div>
  );
}
