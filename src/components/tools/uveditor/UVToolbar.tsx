import React, { useRef } from 'react';
import { MousePointer, Pencil, Eraser, Image as ImageIcon, Type, Camera } from 'lucide-react';
import { useUVEditor } from './UVEditorContext';
import { Layer } from './types';

interface UVToolbarProps {
  onAddImageLayer: (file: File) => void;
}

export function UVToolbar({ onAddImageLayer }: UVToolbarProps) {
  const { tool, setTool } = useUVEditor();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <div className="uv-tools-dock flex flex-col gap-2 p-2 bg-slate-800 rounded-lg shadow-lg border border-cyan-500/30" role="toolbar" aria-label="Ferramentas de Edição">
        <button 
          className={`tool-button p-2 rounded transition-colors ${tool === 'select' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`} 
          onClick={() => setTool('select')} 
          title="Selecionar" aria-label="Selecionar"
        >
          <MousePointer size={18} />
        </button>
        <button 
          className={`tool-button p-2 rounded transition-colors ${tool === 'draw' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`} 
          onClick={() => setTool('draw')} 
          title="Desenhar" aria-label="Desenhar"
        >
          <Pencil size={18} />
        </button>
        <button 
          className={`tool-button p-2 rounded transition-colors ${tool === 'erase' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`} 
          onClick={() => setTool('erase')} 
          title="Borracha" aria-label="Borracha"
        >
          <Eraser size={18} />
        </button>
        <button 
          className={`tool-button p-2 rounded transition-colors ${tool === 'placeImage' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`} 
          onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }} 
          title="Importar Imagem" aria-label="Importar Imagem"
        >
          <ImageIcon size={18} />
        </button>
        <button 
          className="tool-button p-2 rounded transition-colors text-slate-400 hover:bg-slate-700 hover:text-slate-200" 
          onClick={() => { if (cameraInputRef.current) cameraInputRef.current.click(); }} 
          title="Importar Imagem / Câmera" aria-label="Importar Imagem / Câmera"
        >
          <Camera size={18} />
        </button>
        <button 
          className={`tool-button p-2 rounded transition-colors ${tool === 'placeText' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`} 
          onClick={() => setTool('placeText')} 
          title="Texto" aria-label="Texto"
        >
          <Type size={18} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = (e.target as HTMLInputElement).files ? (e.target as HTMLInputElement).files![0] : null;
          if (!f) return;
          onAddImageLayer(f);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => {
          const f = (e.target as HTMLInputElement).files ? (e.target as HTMLInputElement).files![0] : null;
          if (!f) return;
          onAddImageLayer(f);
          if (cameraInputRef.current) cameraInputRef.current.value = '';
        }}
      />
    </>
  );
}
