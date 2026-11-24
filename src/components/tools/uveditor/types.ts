export type UVFontStyle = 'handwritten' | 'typewriter' | 'mono' | 'runic';
export type UVBrushStyle = 'solid' | 'fluorescent';
export type UVPreviewMode = 'edit' | 'naked' | 'flashlight';

export interface Layer {
  id: string;
  type: 'text' | 'image' | 'drawing' | 'group';
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  blendMode?: string; // e.g. 'normal','multiply','screen','overlay','add'
  x?: number;
  y?: number;
  rotation?: number; // rotation in radians
  text?: string;
  size?: number;
  color?: string;
  fontStyle?: UVFontStyle;
  bloom?: number; // 0-100 neon bloom intensity
  isStamp?: boolean;
  stampId?: string;
  stampColor?: string;
  img?: HTMLImageElement;
  scale?: number;
  width?: number;
  height?: number;
  drawingCanvas?: HTMLCanvasElement; // For drawing layers
  children?: string[]; // IDs of child layers if type is 'group'
  childrenData?: Layer[]; // Inlined child layer objects when grouped
  parentId?: string | null; // ID of parent group, if any
  mask?: HTMLCanvasElement; // Optional mask for the layer
  isEditingMask?: boolean; // Indicates if the user is editing the mask
  preview?: string; // Optional preview property for layer thumbnails
}

export type UVTool =
  | 'select'
  | 'draw'
  | 'erase'
  | 'line'
  | 'arrow'
  | 'ellipse'
  | 'rect'
  | 'placeImage'
  | 'placeText';

export type UVMaskMode = 'hide' | 'reveal';
export type UVMode = 'uv' | 'filter' | 'rgb' | 'thermal';

export interface SerializedUVLayer {
  id: string;
  type: 'text' | 'image' | 'drawing';
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  blendMode?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  scale?: number;
  text?: string;
  size?: number;
  color?: string;
  fontStyle?: UVFontStyle;
  neonIntensity?: number;
  isStamp?: boolean;
  stampId?: string;
  stampColor?: string;
  drawingDataUrl?: string;
}

export interface UVAuthoringState {
  version: 1;
  baseWidth?: number;
  baseHeight?: number;
  layers: SerializedUVLayer[];
}

export interface UVFontStyleOption {
  id: UVFontStyle;
  label: string;
  shortLabel: string;
  fontFamily: string;
  fontWeight?: string;
  fontStyleCss?: string;
  letterSpacing?: number;
  sample: string;
}

export const UV_FONT_STYLES: UVFontStyleOption[] = [
  {
    id: 'handwritten',
    label: 'Manuscrita / Rabisco',
    shortLabel: 'Manuscrita',
    fontFamily: '"Caveat", "Segoe Script", "Bradley Hand", "Brush Script MT", cursive',
    fontWeight: '600',
    fontStyleCss: 'italic',
    letterSpacing: 0.5,
    sample: 'Não olhe para trás...',
  },
  {
    id: 'typewriter',
    label: 'Máquina de Escrever',
    shortLabel: 'Datilografia',
    fontFamily: '"Special Elite", "Courier New", "American Typewriter", Georgia, serif',
    fontWeight: '600',
    letterSpacing: 0.8,
    sample: 'ARQUIVO #042-B',
  },
  {
    id: 'mono',
    label: 'Monospace Terminal',
    shortLabel: 'Terminal C.R.I.S.',
    fontFamily: '"Share Tech Mono", "JetBrains Mono", "Consolas", monospace',
    fontWeight: '500',
    letterSpacing: 1.2,
    sample: 'SYS://UV_LOG_09',
  },
  {
    id: 'runic',
    label: 'Rúnica / Ocultista',
    shortLabel: 'Ocultista',
    fontFamily: '"Cinzel", "Palatino Linotype", "Book Antiqua", Georgia, serif',
    fontWeight: '700',
    letterSpacing: 2.6,
    sample: 'SIGILUM VERITAS',
  },
];

export function getCanvasFont(size: number, fontStyle: UVFontStyle = 'mono'): string {
  const safeSize = Math.max(8, size || 24);
  const opt = UV_FONT_STYLES.find((f) => f.id === fontStyle) || UV_FONT_STYLES[2];
  const stylePrefix = opt.fontStyleCss ? `${opt.fontStyleCss} ` : '';
  const weightPrefix = opt.fontWeight ? `${opt.fontWeight} ` : '';
  return `${stylePrefix}${weightPrefix}${safeSize}px ${opt.fontFamily}`;
}
