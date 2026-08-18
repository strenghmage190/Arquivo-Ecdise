import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Pencil, Type, Trash2, Eraser } from 'lucide-react';
import './AudioLab.css';

export interface SteganoInputPanelProps {
  onImageDataChange: (data: ImageData | null) => void;
  onTextChange?: (text: string) => void;
  stegoMethod?: 'spectrogram' | 'lsb';
}

type InputMode = 'image' | 'draw' | 'text';

const CANVAS_W = 480;
const CANVAS_H = 180;

// ---------------------------------------------------------------------------
// Tab: Image Upload
// ---------------------------------------------------------------------------
function ImageTab({ onData }: { onData: (d: ImageData | null) => void }) {
  const [thumb, setThumb] = useState<string | null>(null);

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = CANVAS_W; c.height = CANVAS_H;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Fit-contain
      const scale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (CANVAS_W - dw) / 2;
      const dy = (CANVAS_H - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      // Grayscale
      const raw = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
      for (let i = 0; i < raw.data.length; i += 4) {
        const g = Math.floor((raw.data[i] * 0.299 + raw.data[i + 1] * 0.587 + raw.data[i + 2] * 0.114));
        raw.data[i] = raw.data[i + 1] = raw.data[i + 2] = g;
      }
      ctx.putImageData(raw, 0, 0);
      setThumb(c.toDataURL('image/png'));
      onData(raw);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  return (
    <div className="al-input-tab">
      <div
        className="al-drop-zone"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('al-file-input')?.click()}
      >
        {thumb ? (
          <img src={thumb} alt="Preview" className="al-thumb" />
        ) : (
          <>
            <Upload size={28} className="al-drop-icon" />
            <span className="al-drop-label">Arraste uma imagem ou clique para abrir</span>
            <span className="al-drop-hint">JPG, PNG, GIF, WebP</span>
          </>
        )}
      </div>
      <input
        id="al-file-input"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onPick}
      />
      {thumb && (
        <button className="al-btn-ghost al-btn-sm" onClick={() => { setThumb(null); onData(null); }}>
          <Trash2 size={12} /> Remover
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Drawing Canvas
// ---------------------------------------------------------------------------
function DrawTab({ onData }: { onData: (d: ImageData | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const painting = useRef(false);
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);

  const initCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  };

  useEffect(() => { initCanvas(); }, []);

  const emitData = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    onData(c.getContext('2d')!.getImageData(0, 0, CANVAS_W, CANVAS_H));
  }, [onData]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startPaint = (e: React.MouseEvent) => {
    painting.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const paint = (e: React.MouseEvent) => {
    if (!painting.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : '#ffffff';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopPaint = () => {
    painting.current = false;
    emitData();
  };

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    onData(null);
  };

  return (
    <div className="al-input-tab">
      <div className="al-draw-toolbar">
        <label className="al-label-sm">Pincel: {brushSize}px</label>
        <input type="range" min={2} max={40} value={brushSize} onChange={(e) => setBrushSize(+e.target.value)} className="al-slider-sm" />
        <button className={`al-btn-tool ${!isEraser ? 'active' : ''}`} onClick={() => setIsEraser(false)} title="Pincel">
          <Pencil size={14} />
        </button>
        <button className={`al-btn-tool ${isEraser ? 'active' : ''}`} onClick={() => setIsEraser(true)} title="Borracha">
          <Eraser size={14} />
        </button>
        <button className="al-btn-ghost al-btn-sm" onClick={clear}>
          <Trash2 size={12} /> Limpar
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="al-draw-canvas"
        onMouseDown={startPaint}
        onMouseMove={paint}
        onMouseUp={stopPaint}
        onMouseLeave={stopPaint}
        style={{ cursor: isEraser ? 'cell' : 'crosshair' }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Text / Code
// ---------------------------------------------------------------------------
function TextTab({ onData, onTextChange, stegoMethod }: { onData: (d: ImageData | null) => void, onTextChange?: (text: string) => void, stegoMethod?: 'spectrogram' | 'lsb' }) {
  const [text, setText] = useState('');
  const [fontFamily, setFontFamily] = useState('monospace');
  const [fontSize, setFontSize] = useState(48);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (onTextChange) onTextChange(val);
  };

  const render = useCallback((t: string, ff: string, fs: number) => {
    if (!t.trim()) { onData(null); return; }
    const c = document.createElement('canvas');
    c.width = CANVAS_W; c.height = CANVAS_H;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;

    // Step 1: black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Step 2: disable ALL anti-aliasing and smoothing
    ctx.imageSmoothingEnabled = false;
    (ctx as any).textRenderingHint = 'pixelated'; // non-standard but helps in some browsers

    // Step 3: render white text
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${fs}px ${ff}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const lines = t.split('\n');
    let y = CANVAS_H / 2 - ((lines.length - 1) * fs * 0.6);
    for (const line of lines) {
      ctx.fillText(line, CANVAS_W / 2, y, CANVAS_W - 16);
      y += fs * 1.2;
    }

    // Step 4: BINARIZE — every pixel becomes pure black or pure white.
    // This eliminates grey anti-alias fringe that causes spectral smearing.
    const raw = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const THRESHOLD = 96; // tune: lower = fewer grey halos
    for (let i = 0; i < raw.data.length; i += 4) {
      const lum = (raw.data[i] * 0.299 + raw.data[i + 1] * 0.587 + raw.data[i + 2] * 0.114);
      const v = lum >= THRESHOLD ? 255 : 0;
      raw.data[i] = raw.data[i + 1] = raw.data[i + 2] = v;
      raw.data[i + 3] = 255;
    }
    ctx.putImageData(raw, 0, 0);
    onData(raw);
  }, [onData]);

  useEffect(() => { render(text, fontFamily, fontSize); }, [text, fontFamily, fontSize, render]);

  return (
    <div className="al-input-tab">
      {stegoMethod !== 'lsb' && (
        <div className="al-text-controls">
          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="al-select-sm">
            {/* Pixel/blocky fonts — best for spectrogram sharpness */}
            <option value="'Courier New', monospace">Courier New (recomendado)</option>
            <option value="monospace">Monospace</option>
            <option value="'Lucida Console', monospace">Lucida Console</option>
            {/* Below: google-font imports needed in index.html for full sharpness */}
            <option value="'Press Start 2P', monospace">Press Start 2P (pixel art)</option>
            <option value="sans-serif">Sans-serif</option>
            <option value="serif">Serif</option>
          </select>
          <label className="al-label-sm">Tamanho: {fontSize}px</label>
          <input type="range" min={12} max={96} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="al-slider-sm" />
        </div>
      )}
      <textarea
        className="al-textarea"
        rows={stegoMethod === 'lsb' ? 7 : 4}
        placeholder={stegoMethod === 'lsb' ? "Digite a mensagem secreta para ocultação LSB (100% inaudível)..." : "Digite o texto ou código que ficará oculto no espectrograma..."}
        value={text}
        onChange={handleTextChange}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main: SteganoInputPanel
// ---------------------------------------------------------------------------
const TABS: { id: InputMode; label: string; icon: React.ReactNode }[] = [
  { id: 'image', label: 'Imagem', icon: <Upload size={14} /> },
  { id: 'draw',  label: 'Desenho', icon: <Pencil size={14} /> },
  { id: 'text',  label: 'Texto',   icon: <Type size={14} /> },
];

export default function SteganoInputPanel({ onImageDataChange, onTextChange, stegoMethod }: SteganoInputPanelProps) {
  const [mode, setMode] = useState<InputMode>('text');

  // Forçar modo texto se for LSB
  useEffect(() => {
    if (stegoMethod === 'lsb') {
      setMode('text');
    }
  }, [stegoMethod]);

  return (
    <div className="al-input-panel">
      {stegoMethod !== 'lsb' && (
        <div className="al-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`al-tab ${mode === t.id ? 'active' : ''}`}
              onClick={() => setMode(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}
      <div className="al-tab-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {mode === 'image' && stegoMethod !== 'lsb' && <ImageTab onData={onImageDataChange} />}
        {mode === 'draw'  && stegoMethod !== 'lsb' && <DrawTab  onData={onImageDataChange} />}
        {mode === 'text'  && <TextTab  onData={onImageDataChange} onTextChange={onTextChange} stegoMethod={stegoMethod} />}
      </div>
    </div>
  );
}
