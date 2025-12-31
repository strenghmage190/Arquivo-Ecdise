import React, { useRef, useState, useEffect } from 'react';
import { imageToAudioBuffer } from '../../utils/audioGenerator';
import './SpectrogramCreator.css';

interface Props {
  // Retorna o buffer de áudio puro, sem arquivo
  onGenerateBuffer: (buffer: AudioBuffer) => void;
  onClose: () => void;
}

export default function SpectrogramCreator({ onGenerateBuffer, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [text, setText] = useState('SOCORRO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fontSize, setFontSize] = useState(60);
  const [duration, setDuration] = useState(3);
  const [minFreq, setMinFreq] = useState(4000);
  const [maxFreq, setMaxFreq] = useState(12000);
  const [generateQr, setGenerateQr] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Desenhar o texto (ou QR) no canvas escondido com pré-processamento para melhorar contraste/espessura
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    // Fundo preto
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    // Max Sharpening / pixel-art style
    ctx.imageSmoothingEnabled = false; // desliga suavização
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${fontSize}px "Lucida Console", "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (generateQr && qrCanvasRef.current && qrUrl) {
      // se QR for pedido, desenha o QR gerado no canvas (gerado separadamente)
      try {
        const qrC = qrCanvasRef.current;
        ctx.drawImage(qrC, 0, 0, cvs.width, cvs.height);
      } catch (e) {
        console.warn('QR draw failed', e);
      }
      return;
    }

    // A MÁGICA: desenha uma aura para engrossar bordas e depois o centro nítido
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 5;
    ctx.fillText(text.toUpperCase(), cvs.width / 2, cvs.height / 2);

    // Núcleo nítido
    ctx.shadowBlur = 0;
    ctx.fillText(text.toUpperCase(), cvs.width / 2, cvs.height / 2);
  }, [text, fontSize, generateQr, qrUrl]);

  const handleGenerate = async () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    setIsProcessing(true);

    try {
      // Caso o Mestre tenha escolhido gerar QR, tente gerar para o canvas oculto primeiro
      if (generateQr && qrUrl) {
        // try dynamic import of 'qrcode' to draw to qrCanvas
        try {
          const qrcodeMod: any = await import('qrcode');
          const qrC = qrCanvasRef.current;
          if (qrC) {
            await qrcodeMod.toCanvas(qrC, qrUrl, { margin: 1, width: Math.min(300, qrC.width) });
            // redraw main canvas draws qrCanvas in useEffect
          }
        } catch (e) {
          console.warn('QR generation failed - make sure `qrcode` is installed', e);
          alert('Não foi possível gerar o QR (dependência ausente). Instale `qrcode` para usar esta função.');
        }
      }

      // Passa frequências escolhidas pelo Mestre
      const audioBuffer = await imageToAudioBuffer(cvs, duration, minFreq, maxFreq);
      onGenerateBuffer(audioBuffer);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Erro na síntese do espectro.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="spectro-creator-overlay" onClick={onClose}>
      <div className="spectro-box" onClick={e => e.stopPropagation()}>
        <div className="sp-header">GERADOR DE SINAL OCULTO</div>
        
        <div className="sp-workspace">
           {/* Preview Visual do Texto */}
           <div className="text-preview" style={{ fontSize: `${fontSize * 0.5}px` }}>
              {text.toUpperCase()}
           </div>
           
           <label>MENSAGEM SECRETA (Máx 10 chars)</label>
           <input 
              value={text} 
              onChange={e => setText(e.target.value)} 
              maxLength={10} 
              autoFocus
           />

            <div className="sp-divider" />

            <div className="sp-row">
              <label>Tamanho da Fonte: {fontSize}px</label>
              <input type="range" min="20" max="80" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
            </div>

            <div className="sp-row">
              <label>Duração do Sinal: {duration}s</label>
              <input type="range" min="1" max="5" value={duration} onChange={e => setDuration(Number(e.target.value))} />
            </div>

            <div className="sp-divider" />

            <div className="sp-row">
              <label>FAIXA DE FREQUÊNCIA: {minFreq}Hz - {maxFreq}Hz</label>
              <div style={{display:'flex', gap:10}}>
                <input type="range" min="500" max="20000" value={minFreq} onChange={e => setMinFreq(Number(e.target.value))} />
                <input type="range" min="500" max="20000" value={maxFreq} onChange={e => setMaxFreq(Number(e.target.value))} />
              </div>
              <small style={{color:'#666'}}>Dica: use faixas altas (acima de 8000Hz) para esconder de vocais.</small>
            </div>

            <div className="sp-divider" />

            <div className="sp-row">
              <label><input type="checkbox" checked={generateQr} onChange={e => setGenerateQr(e.target.checked)} /> Gerar QR Code (transmídia)</label>
              {generateQr && (
               <div style={{display:'flex', flexDirection:'column', gap:6}}>
                <input placeholder="https://..." value={qrUrl} onChange={e => setQrUrl(e.target.value)} />
                <small style={{color:'#666'}}>O QR será renderizado em um canvas invisível e convertido em áudio.</small>
               </div>
              )}
            </div>
        </div>

        <div className="sp-footer">
           <button onClick={onClose} className="btn-cancel">CANCELAR</button>
           <button onClick={handleGenerate} className="btn-confirm" disabled={isProcessing}>
              {isProcessing ? 'SINTETIZANDO...' : '✔ INJETAR SINAL'}
           </button>
        </div>

        {/* O Canvas fica escondido, ele é só a "matriz" pro áudio */}
        <canvas ref={canvasRef} width="400" height="150" style={{ display: 'none' }} />
        {/* Canvas auxiliar para QR (invisível) */}
        <canvas ref={qrCanvasRef} width="400" height="400" style={{ display: 'none' }} />
      </div>
    </div>
  );
}
