import React, { useRef, useState } from 'react';

interface Props { onSave: (f: File) => void; onClose: () => void; }

export default function GlitchMaker({ onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImgUrl(url);
    setLoaded(false);
  };

  const drawImage = (img: HTMLImageElement) => {
    const c = canvasRef.current; if (!c) return;
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.drawImage(img, 0, 0);
  };

  const applyGlitch = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const w = c.width; const h = c.height;
    // slice shift
    for (let i = 0; i < 12; i++) {
      const sh = Math.max(4, Math.floor(Math.random() * (h * 0.12)));
      const y = Math.floor(Math.random() * (h - sh));
      const offset = Math.floor((Math.random() - 0.5) * (w * 0.2));
      const imageData = ctx.getImageData(0, y, w, sh);
      // clear area then put shifted
      ctx.clearRect(0, y, w, sh);
      ctx.putImageData(imageData, offset, y);
    }
    // color shift: simple RGB offset by copying channels
    const id = ctx.getImageData(0, 0, w, h);
    const data = id.data;
    for (let i = 0; i < 2000; i++) {
      const px = Math.floor(Math.random() * w);
      const py = Math.floor(Math.random() * h);
      const idx = (py * w + px) * 4;
      // swap R and B randomly
      const tmp = data[idx]; data[idx] = data[idx + 2]; data[idx + 2] = tmp;
    }
    ctx.putImageData(id, 0, 0);
  };

  const saveResult = async () => {
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
    <div style={{ background: '#111', padding: 12, borderRadius: 8 }}>
      <h3 style={{ color: '#c6a45f' }}>GLITCH MAKER</h3>
      <div style={{ margin: '8px 0' }}>
        <input type="file" accept="image/*" onChange={handleFile} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => {
          if (!imgUrl) return; const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => { drawImage(img); setLoaded(true); }; img.src = imgUrl;
        }}>Carregar</button>
        <button onClick={applyGlitch} disabled={!loaded}>Gerar Glitch</button>
        <button onClick={async () => { await saveResult(); }} disabled={!loaded}>Salvar e Usar</button>
        <button onClick={onClose} style={{ marginLeft: 'auto' }}>Fechar</button>
      </div>
      <div style={{ marginTop: 10 }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%', border: '1px solid #333' }} />
      </div>
    </div>
  );
}
