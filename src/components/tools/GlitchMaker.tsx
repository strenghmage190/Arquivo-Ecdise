import React, { useRef, useState } from 'react';
import './GlitchMaker.css';

interface GlitchMakerProps { onSave: (f: File) => void; onClose: () => void; }

export default function GlitchMaker({ onSave, onClose }: GlitchMakerProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const maxCanvasWidth = 600;
  const maxCanvasHeight = 500;
  
  // Parâmetros controláveis do glitch (chaves de decodificação)
  const [sliceCount, setSliceCount] = useState<number>(12);
  const [shiftAmount, setShiftAmount] = useState<number>(20); // % do deslocamento
  const [colorCorruption, setColorCorruption] = useState<number>(10); // % de pixels afetados

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImgUrl(url);
    setLoaded(false);
  };

  const drawImage = (img: HTMLImageElement): void => {
    const c = canvasRef.current; if (!c) return;
    // Redimensiona a imagem se estiver muito grande
    let width = img.width;
    let height = img.height;
    const aspectRatio = width / height;
    
    if (width > maxCanvasWidth) {
      width = maxCanvasWidth;
      height = width / aspectRatio;
    }
    if (height > maxCanvasHeight) {
      height = maxCanvasHeight;
      width = height * aspectRatio;
    }
    
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.drawImage(img, 0, 0, width, height);
  };

  const applyGlitch = (): void => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const w = c.width; const h = c.height;
    
    // 1. Slice Shift usando parâmetros controláveis
    for (let i = 0; i < sliceCount; i++) {
      const sh = Math.max(4, Math.floor(Math.random() * (h * 0.12)));
      const y = Math.floor(Math.random() * (h - sh));
      // Usa shiftAmount para controlar o deslocamento máximo
      const offset = Math.floor((Math.random() - 0.5) * (w * (shiftAmount / 100)));
      const imageData = ctx.getImageData(0, y, w, sh);
      // clear area then put shifted
      ctx.clearRect(0, y, w, sh);
      ctx.putImageData(imageData, offset, y);
    }
    
    // 2. Color Shift usando parâmetros controláveis
    const id = ctx.getImageData(0, 0, w, h);
    const data = id.data;
    // Calcula quantos pixels corromper baseado na porcentagem
    const numPixelsToCorrupt = Math.floor((w * h) * (colorCorruption / 100));
    for (let i = 0; i < numPixelsToCorrupt; i++) {
      // Pega um pixel aleatório
      const idx = Math.floor(Math.random() * (w * h)) * 4;
      // swap R and B
      const tmp = data[idx]; 
      data[idx] = data[idx + 2]; 
      data[idx + 2] = tmp;
    }
    ctx.putImageData(id, 0, 0);
  };

  const saveResult = async (): Promise<void> => {
    const c = canvasRef.current; if (!c) return;
    return new Promise<void>((resolve) => {
      c.toBlob((blob) => {
        if (!blob) return resolve();
        const f = new File([blob], `glitch_${Date.now()}.png`, { type: 'image/png' });
        onSave(f);
        resolve();
      });
    });
  };

  return (
    <div className="glitch-maker-container">
      <h3>⚠ DECODIFICADOR DE ANOMALIAS v1.7</h3>
      <div className="glitch-maker-input-group">
        <input type="file" accept="image/*" onChange={handleFile} />
      </div>
      
      <div className="glitch-maker-sliders">
        <div className="slider-control">
          <label>Frequência de Fatias: <span className="param-value">{sliceCount}</span></label>
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={sliceCount} 
            onChange={e => setSliceCount(Number(e.target.value))} 
            disabled={!loaded}
          />
        </div>
        
        <div className="slider-control">
          <label>Intensidade do Deslocamento: <span className="param-value">{shiftAmount}%</span></label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={shiftAmount} 
            onChange={e => setShiftAmount(Number(e.target.value))} 
            disabled={!loaded}
          />
        </div>
        
        <div className="slider-control">
          <label>Corrupção Cromática: <span className="param-value">{colorCorruption}%</span></label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={colorCorruption} 
            onChange={e => setColorCorruption(Number(e.target.value))} 
            disabled={!loaded}
          />
        </div>
      </div>
      
      <div className="glitch-maker-controls">
        <button onClick={() => {
          if (!imgUrl) return; const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => { drawImage(img); setLoaded(true); }; img.src = imgUrl;
        }}>Carregar Amostra</button>
        <button onClick={applyGlitch} disabled={!loaded}>Executar Análise</button>
        <button onClick={async () => { await saveResult(); }} disabled={!loaded}>Extrair Artefato</button>
        <button onClick={onClose}>Fechar</button>
      </div>
      <div className="glitch-maker-preview">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
