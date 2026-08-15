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

export type UVTool = 'select' | 'draw' | 'erase' | 'placeImage' | 'placeText';
export type UVMaskMode = 'hide' | 'reveal';
export type UVMode = 'uv' | 'filter' | 'rgb';
