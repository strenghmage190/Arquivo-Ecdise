import React from 'react';
import { Palette, ChevronDown, ChevronRight } from 'lucide-react';
import { useUVEditor } from './UVEditorContext';

export const COLOR_PALETTES = {
  uv: [
    { label: 'Magenta', hex: '#b366ff', glow: '0 0 10px #b366ff' },
    { label: 'Ciano', hex: '#00ffff', glow: '0 0 10px #00ffff' },
    { label: 'Vermelho', hex: '#ff0033', glow: '0 0 10px #ff0033' },
    { label: 'Verde Neon', hex: '#39ff14', glow: '0 0 10px #39ff14' },
    { label: 'Rosa Quente', hex: '#ff10f0', glow: '0 0 10px #ff10f0' },
    { label: 'Azul Elétrico', hex: '#0080ff', glow: '0 0 10px #0080ff' },
    { label: 'Amarelo Neon', hex: '#ffff00', glow: '0 0 10px #ffff00' },
    { label: 'Laranja Neon', hex: '#ff6600', glow: '0 0 10px #ff6600' },
  ],
  filter: [
    { label: 'Branco', hex: '#ffffff', glow: '0 0 10px #fff' },
    { label: 'Cinza', hex: '#cccccc', glow: '0 0 8px #ccc' },
    { label: 'Branco Transparente', hex: 'rgba(255,255,255,0.5)', glow: '0 0 5px rgba(255,255,255,0.5)' },
    { label: 'Cinza Escuro', hex: '#888888', glow: '0 0 5px #888' },
  ],
};

interface UVColorPaletteProps {
  expanded: boolean;
  onToggle: () => void;
}

export function UVColorPalette({ expanded, onToggle }: UVColorPaletteProps) {
  const { mode, color, setColor } = useUVEditor();
  const colors = COLOR_PALETTES[mode === 'uv' ? 'uv' : 'filter'];

  if (mode === 'rgb') {
    return null; // RGB mode doesn't use the neon color palette, it extracts channels
  }

  return (
    <div className="uv-sidebar-section flex flex-col border border-cyan-500/20 bg-slate-900/80 rounded mb-4 overflow-hidden">
      <div 
        className="section-header flex items-center p-2 bg-slate-800 cursor-pointer hover:bg-slate-700"
        onClick={onToggle}
      >
        <Palette size={16} className="mr-2 text-cyan-400" />
        <h4 className="flex-1 m-0 text-sm font-semibold text-slate-200">Cores</h4>
        <button className="text-slate-400">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="color-palette p-3 grid grid-cols-4 gap-2">
          {colors.map((c) => (
            <button
              key={c.hex}
              className={`color-btn w-8 h-8 rounded-full border-2 transition-transform ${color === c.hex ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: c.hex, boxShadow: c.glow }}
              onClick={() => setColor(c.hex)}
              title={c.label}
              aria-label={`Selecionar cor ${c.label}`}
            />
          ))}
          <div className="col-span-4 mt-2">
            <input
              type="color"
              value={color.startsWith('rgba') ? '#ffffff' : color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-8 cursor-pointer rounded bg-slate-800 border border-slate-600"
              title="Cor Personalizada"
            />
          </div>
        </div>
      )}
    </div>
  );
}
