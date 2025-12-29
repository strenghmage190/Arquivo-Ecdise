import React, { useRef, useState, useEffect } from 'react';
import { imageToAudioBuffer, bufferToWav } from '../../utils/audioGenerator';
import { uploadInvestigationFile } from '../../utils/storage';
import './SpectrogramCreator.css';

interface Props {
  onSave: (audioFile: File) => void;
  onClose: () => void;
  investigationId?: string;
  onUploadComplete?: (publicUrl: string) => void;
}

export default function SpectrogramCreator({ onSave, onClose, investigationId, onUploadComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectroRef = useRef<HTMLCanvasElement | null>(null);
  const [text, setText] = useState('MEDO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState<number>(3);
  const [resolutionStep, setResolutionStep] = useState<number>(2); // 1 = best, higher = lower res

  useEffect(() => { drawCanvas(); }, [text]);
  useEffect(() => { drawSpectrogramPreview(); }, [text, resolutionStep]);

  const drawCanvas = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), cvs.width / 2, cvs.height / 2);
  };

  const drawSpectrogramPreview = () => {
    const cvs = canvasRef.current;
    const sp = spectroRef.current;
    if (!cvs || !sp) return;
    const w = cvs.width;
    const h = cvs.height;
    const ctx = cvs.getContext('2d');
    const sctx = sp.getContext('2d');
    if (!ctx || !sctx) return;
    const img = ctx.getImageData(0,0,w,h);
    const cols = Math.ceil(w / resolutionStep);
    const rows = Math.ceil(h / resolutionStep);
    sctx.fillStyle = '#000'; sctx.fillRect(0,0,sp.width, sp.height);
    const cellW = sp.width / cols;
    const cellH = sp.height / rows;
    for (let cx=0; cx<cols; cx++){
      for (let ry=0; ry<rows; ry++){
        const sx = Math.min(w-1, cx*resolutionStep);
        const sy = Math.min(h-1, ry*resolutionStep);
        const i = (sy * w + sx) * 4;
        const intensity = (img.data[i] + img.data[i+1] + img.data[i+2]) / (3*255);
        const v = Math.round(intensity * 255);
        sctx.fillStyle = `rgb(${v},${v},${v})`;
        // draw with flipped vertical so high freq is top
        sctx.fillRect(cx*cellW, ry*cellH, Math.max(1, Math.ceil(cellW)), Math.max(1, Math.ceil(cellH)));
      }
    }
  };

  const handleGenerate = async (): Promise<Blob | null> => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    setIsProcessing(true);
    try {
      const horiz = resolutionStep;
      const vert = resolutionStep;
      const audioBuffer = await imageToAudioBuffer(cvs, duration, 500, 15000, horiz, vert);
      const wavBlob = bufferToWav(audioBuffer, audioBuffer.length);
      const url = URL.createObjectURL(wavBlob);
      setPreviewUrl(url);
      setGeneratedBlob(wavBlob);
      return wavBlob;
    } catch (e) {
      console.error(e);
      alert('Erro na síntese espectral');
    } finally { setIsProcessing(false); }
    return null;
  };

  const handleGenerateAndUpload = async () => {
    const blob = await handleGenerate();
    if (!blob) return;
    if (!investigationId) return alert('Investigation ID not provided for upload');
    try {
      setIsProcessing(true);
      const publicUrl = await uploadInvestigationFile(blob, investigationId, 'wav');
      if (!publicUrl) throw new Error('Upload failed');
      setPreviewUrl(publicUrl);
      if (onUploadComplete) onUploadComplete(publicUrl);
      alert('Upload concluído');
    } catch (err) {
      console.error('Upload failed', err);
      alert('Falha no upload');
    } finally { setIsProcessing(false); }
  };

  const handleConfirm = () => {
    if (!generatedBlob) return;
    const file = new File([generatedBlob], `espectro_${Date.now()}.wav`, { type: 'audio/wav' });
    onSave(file);
  };

  return (
    <div className="spectro-creator-overlay">
      <div className="spectro-box">
        <div className="sp-header">SINTETIZADOR DE ESPECTROGRAMA</div>
        <div className="sp-workspace">
          <canvas ref={canvasRef as any} width={400} height={120} style={{ width: '100%', background:'#000', border:'1px solid #333' }} />
          <input value={text} onChange={e => setText(e.target.value)} placeholder="DIGITE A MENSAGEM OCULTA..." maxLength={12} style={{ marginTop:10, padding:8, width:'100%', background:'#0b0b0b', border:'1px solid #222', color:'#fff' }} />
          <div style={{display:'flex', gap:8, marginTop:8, alignItems:'center'}}>
            <label style={{fontSize:12, color:'#ccc'}}>Duração: {duration}s</label>
            <input type="range" min={1} max={6} value={duration} onChange={e=>setDuration(Number(e.target.value))} />
            <label style={{fontSize:12, color:'#ccc'}}>Resolução:</label>
            <input type="range" min={1} max={8} value={resolutionStep} onChange={e=>setResolutionStep(Number(e.target.value))} />
          </div>
          <div style={{display:'flex', gap:12, marginTop:8, alignItems:'flex-start'}}>
            <div style={{flex:1}}>
              <small style={{color:'#888'}}>Preview do Espectrograma (resolução reduzida)</small>
              <canvas ref={spectroRef as any} width={300} height={120} style={{ width:'100%', height:80, background:'#000', border:'1px solid #222', marginTop:6 }} />
            </div>
          </div>
        </div>

        <div className="sp-controls">
          <div style={{display:'flex', gap:8, alignItems:'center', width:'100%'}}>
            <button className="btn-retro" disabled={isProcessing} onClick={handleGenerate}>{isProcessing ? 'COMPILANDO...' : '🔊 GERAR ÁUDIO'}</button>
            <button className="btn-retro" disabled={isProcessing || !investigationId} onClick={handleGenerateAndUpload} style={{borderColor: investigationId ? '#2a9' : '#444'}}>{isProcessing ? 'ENVIANDO...' : '⬆️ GERAR E UPLOAD'}</button>
          </div>
          {previewUrl && (
            <div className="preview-player">
              <audio src={previewUrl} controls style={{ width: '100%' }} />
              <small style={{ color:'#888' }}>*Reproduza e confirme*</small>
            </div>
          )}
        </div>

        <div className="sp-footer">
          <button onClick={onClose} className="btn-cancel">CANCELAR</button>
          {generatedBlob && <button onClick={handleConfirm} className="btn-confirm">USAR ESTE ÁUDIO</button>}
        </div>
      </div>
    </div>
  );
}
