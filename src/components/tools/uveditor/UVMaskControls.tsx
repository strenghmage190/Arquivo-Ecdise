import React from 'react';
import { Target, Layers, EyeOff } from 'lucide-react';
import { useUVEditor } from './UVEditorContext';

export function UVMaskControls() {
  const { 
    mode, 
    selectedLayer, 
    layers,
    setLayers,
    maskPaintMode, 
    setMaskPaintMode,
    maskUseEraser,
    setMaskUseEraser
  } = useUVEditor();

  if (mode !== 'rgb') return null;

  const currentLayer = layers.find(l => l.id === selectedLayer);
  const isEditingMask = currentLayer?.isEditingMask;

  const toggleMaskEdit = () => {
    if (!currentLayer) return;
    
    // Auto-create mask if entering mask mode and none exists
    let maskCanvas = currentLayer.mask;
    if (!isEditingMask && !maskCanvas) {
      maskCanvas = document.createElement('canvas');
      maskCanvas.width = currentLayer.width || 800;
      maskCanvas.height = currentLayer.height || 600;
      const ctx = maskCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000'; // black = fully visible (no mask)
        ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      }
    }
    
    setLayers(prev => prev.map(l => 
      l.id === currentLayer.id ? { 
        ...l, 
        isEditingMask: !l.isEditingMask,
        mask: maskCanvas 
      } : { ...l, isEditingMask: false }
    ));
  };

  return (
    <div className="mask-controls mt-4 p-3 bg-slate-900 border border-slate-700 rounded-lg">
      <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
        <Target size={16} className="text-cyan-400" />
        Controles de Máscara Forense
      </h4>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400">Layer selecionada: {currentLayer?.name || 'Nenhuma'}</span>
        <button
          className={`px-3 py-1 text-xs rounded transition-colors ${isEditingMask ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'}`}
          onClick={toggleMaskEdit}
          disabled={!currentLayer || currentLayer.type === 'group'}
        >
          {isEditingMask ? 'Sair da Máscara' : 'Editar Máscara'}
        </button>
      </div>

      {isEditingMask && (
        <div className="mask-edit-tools flex flex-col gap-2 mt-2 pt-2 border-t border-slate-800">
          <div className="flex gap-2">
            <button
              className={`flex-1 py-1 px-2 rounded text-xs flex items-center justify-center gap-1 transition-colors ${!maskUseEraser && maskPaintMode === 'hide' ? 'bg-ordo-red/20 text-red-400 border border-red-500/50' : 'bg-slate-800 text-slate-400'}`}
              onClick={() => { setMaskPaintMode('hide'); setMaskUseEraser(false); }}
            >
              <EyeOff size={14} /> Esconder
            </button>
            <button
              className={`flex-1 py-1 px-2 rounded text-xs flex items-center justify-center gap-1 transition-colors ${!maskUseEraser && maskPaintMode === 'reveal' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-slate-800 text-slate-400'}`}
              onClick={() => { setMaskPaintMode('reveal'); setMaskUseEraser(false); }}
            >
              <Layers size={14} /> Revelar
            </button>
          </div>
          <button
            className={`w-full py-1 px-2 rounded text-xs transition-colors ${maskUseEraser ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400'}`}
            onClick={() => setMaskUseEraser(!maskUseEraser)}
          >
            Modo Borracha {maskUseEraser ? '(Ativo)' : ''}
          </button>
          <div className="text-xs text-slate-500 mt-1 italic">
            Dica: Esconder remove pixels isolando áreas não-alvo. Revelar restaura.
          </div>
        </div>
      )}
    </div>
  );
}
