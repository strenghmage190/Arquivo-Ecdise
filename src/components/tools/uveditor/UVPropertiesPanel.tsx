import React from 'react';
import { Settings, ChevronDown, ChevronRight, EyeOff } from 'lucide-react';
import { useUVEditor } from './UVEditorContext';

interface UVPropertiesPanelProps {
  expanded: boolean;
  onToggle: () => void;
}

export function UVPropertiesPanel({ expanded, onToggle }: UVPropertiesPanelProps) {
  const { 
    tool, mode, 
    brushSize, setBrushSize,
    maskBrushSoftness, setMaskBrushSoftness,
    maskBrushOpacity, setMaskBrushOpacity,
    censorMode, setCensorMode
  } = useUVEditor();

  if (tool !== 'draw' && tool !== 'erase') return null;

  return (
    <div className="uv-sidebar-section flex flex-col border border-cyan-500/20 bg-slate-900/80 rounded mb-4 overflow-hidden">
      <div 
        className="section-header flex items-center p-2 bg-slate-800 cursor-pointer hover:bg-slate-700"
        onClick={onToggle}
      >
        <Settings size={16} className="mr-2 text-cyan-400" />
        <h4 className="flex-1 m-0 text-sm font-semibold text-slate-200">Propriedades do Pincel</h4>
        <button className="text-slate-400">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="properties-content p-3 flex flex-col gap-3">
          <div className="prop-group flex flex-col gap-1">
            <label className="text-xs text-slate-400 flex justify-between">
              Tamanho do Pincel <span>{brushSize}px</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div className="prop-group flex flex-col gap-1">
            <label className="text-xs text-slate-400 flex justify-between">
              Suavidade <span>{Math.round(maskBrushSoftness * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={maskBrushSoftness}
              onChange={(e) => setMaskBrushSoftness(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div className="prop-group flex flex-col gap-1">
            <label className="text-xs text-slate-400 flex justify-between">
              Opacidade <span>{Math.round(maskBrushOpacity * 100)}%</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={maskBrushOpacity}
              onChange={(e) => setMaskBrushOpacity(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {mode === 'filter' && tool === 'draw' && (
            <div className="prop-group flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="censorMode"
                checked={censorMode}
                onChange={(e) => setCensorMode(e.target.checked)}
                className="accent-cyan-500 w-4 h-4"
              />
              <label htmlFor="censorMode" className="text-sm text-slate-300 flex items-center gap-1 cursor-pointer">
                <EyeOff size={14} /> Modo Censura (Pixelizado)
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
