import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Layer, UVTool, UVMaskMode, UVMode } from './types';

export interface InlineTextEdit {
  id: string;
  value: string;
  cssX: number;
  cssY: number;
  fontSize: number;
}

export interface UVEditorContextType {
  mode: UVMode;
  targetChannel?: 'R' | 'G' | 'B';
  setTargetChannel: React.Dispatch<React.SetStateAction<'R' | 'G' | 'B' | undefined>>;
  
  tool: UVTool;
  setTool: React.Dispatch<React.SetStateAction<UVTool>>;
  
  color: string;
  setColor: React.Dispatch<React.SetStateAction<string>>;
  
  brushSize: number;
  setBrushSize: React.Dispatch<React.SetStateAction<number>>;
  
  maskBrushSoftness: number;
  setMaskBrushSoftness: React.Dispatch<React.SetStateAction<number>>;
  
  maskBrushOpacity: number;
  setMaskBrushOpacity: React.Dispatch<React.SetStateAction<number>>;
  
  textValue: string;
  setTextValue: React.Dispatch<React.SetStateAction<string>>;
  
  textSize: number;
  setTextSize: React.Dispatch<React.SetStateAction<number>>;
  
  censorMode: boolean;
  setCensorMode: React.Dispatch<React.SetStateAction<boolean>>;
  
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  
  selectedLayer: string | null;
  setSelectedLayer: React.Dispatch<React.SetStateAction<string | null>>;
  
  maskPaintMode: UVMaskMode;
  setMaskPaintMode: React.Dispatch<React.SetStateAction<UVMaskMode>>;
  
  maskUseEraser: boolean;
  setMaskUseEraser: React.Dispatch<React.SetStateAction<boolean>>;
  
  inlineTextEdit: InlineTextEdit | null;
  setInlineTextEdit: React.Dispatch<React.SetStateAction<InlineTextEdit | null>>;
  
  editingLayerName: string | null;
  setEditingLayerName: React.Dispatch<React.SetStateAction<string | null>>;
}

const UVEditorContext = createContext<UVEditorContextType | undefined>(undefined);

export function UVEditorProvider({ 
  children, 
  initialMode = 'rgb', 
  initialTargetChannel 
}: { 
  children: ReactNode, 
  initialMode?: UVMode, 
  initialTargetChannel?: 'R'|'G'|'B' 
}) {
  const [mode] = useState<UVMode>(initialMode);
  const [targetChannel, setTargetChannel] = useState<'R'|'G'|'B'|undefined>(initialTargetChannel);
  
  const [tool, setTool] = useState<UVTool>('draw');
  const [color, setColor] = useState(mode === 'filter' ? '#ffffff' : '#ff0000');
  const [brushSize, setBrushSize] = useState(mode === 'filter' ? 18 : 6);
  const [maskBrushSoftness, setMaskBrushSoftness] = useState(0.6);
  const [maskBrushOpacity, setMaskBrushOpacity] = useState(1);
  const [textValue, setTextValue] = useState('');
  const [textSize, setTextSize] = useState(24);
  const [censorMode, setCensorMode] = useState(false);
  
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  
  const [maskPaintMode, setMaskPaintMode] = useState<UVMaskMode>('hide');
  const [maskUseEraser, setMaskUseEraser] = useState(false);
  
  const [inlineTextEdit, setInlineTextEdit] = useState<InlineTextEdit | null>(null);
  const [editingLayerName, setEditingLayerName] = useState<string | null>(null);

  const value = {
    mode, targetChannel, setTargetChannel,
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    maskBrushSoftness, setMaskBrushSoftness,
    maskBrushOpacity, setMaskBrushOpacity,
    textValue, setTextValue,
    textSize, setTextSize,
    censorMode, setCensorMode,
    layers, setLayers,
    selectedLayer, setSelectedLayer,
    maskPaintMode, setMaskPaintMode,
    maskUseEraser, setMaskUseEraser,
    inlineTextEdit, setInlineTextEdit,
    editingLayerName, setEditingLayerName
  };

  return <UVEditorContext.Provider value={value}>{children}</UVEditorContext.Provider>;
}

export function useUVEditor() {
  const context = useContext(UVEditorContext);
  if (!context) throw new Error('useUVEditor must be used within UVEditorProvider');
  return context;
}
