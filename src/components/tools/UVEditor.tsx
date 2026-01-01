import React, { useRef, useState, useEffect } from 'react';
import './UVEditor.css';
import './UVEditor.animations.css';

interface UVEditorProps {
  baseImageUrl: string;
  onSave: (file: File) => void;
  onClose: () => void;
  mode?: 'uv' | 'filter';
  initialImageFile?: File | null;
}

interface Layer {
  id: string;
  type: 'text' | 'image' | 'drawing' | 'group';
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  x?: number;
  y?: number;
  text?: string;
  size?: number;
  color?: string;
  img?: HTMLImageElement;
  scale?: number;
  drawingCanvas?: HTMLCanvasElement; // For drawing layers
  children?: string[]; // IDs of child layers if type is 'group'
  parentId?: string | null; // ID of parent group, if any
}

const COLOR_PALETTES = {
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

export default function UVEditor({ baseImageUrl, onSave, onClose, mode = 'uv', initialImageFile }: UVEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(mode === 'filter' ? '#ffffff' : '#b366ff');
  const [brushSize, setBrushSize] = useState(mode === 'filter' ? 18 : 6);
  const [tool, setTool] = useState<'draw' | 'erase' | 'placeImage' | 'placeText'>('draw');
  const [textValue, setTextValue] = useState('');
  const [textSize, setTextSize] = useState(24);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [censorMode, setCensorMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Layers support: placed texts/images (editable)
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ox:number, oy:number} | null>(null);
  const resizeStartRef = useRef<{x:number, y:number, width:number, height:number, scale:number} | null>(null);
  const drawingOffscreen = useRef<HTMLCanvasElement | null>(null);
  const [editingLayerName, setEditingLayerName] = useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAddLayerMenu, setShowAddLayerMenu] = useState(false);

  const colors = COLOR_PALETTES[mode];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImageUrl;
    img.onload = () => {
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      // initialize offscreen drawing canvas to capture brush strokes
      drawingOffscreen.current = document.createElement('canvas');
      drawingOffscreen.current.width = canvas.width;
      drawingOffscreen.current.height = canvas.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      // if an initial image file (e.g. glitch) was provided, add it as an image layer centered
      if (initialImageFile) {
        const url = URL.createObjectURL(initialImageFile);
        const img2 = new Image();
        img2.crossOrigin = 'anonymous';
        img2.src = url;
        img2.onload = () => {
          try {
            const id = `layer-${Date.now()}`;
            const naturalW = img2.naturalWidth || img2.width || 100;
            const scaleToFit = Math.min(1, canvas.width / naturalW, canvas.height / (img2.naturalHeight || img2.height || 100));
            setLayers(prev => [...prev, { 
              id, 
              type: 'image', 
              name: 'Imagem Inicial',
              visible: true,
              opacity: 100,
              locked: false,
              x: canvas.width / 2, 
              y: canvas.height / 2, 
              img: img2, 
              scale: scaleToFit 
            }]);
            setSelectedLayer(id);
            redrawAll();
          } catch (e) {
            // ignore
          }
        };
        // cleanup object url when component unmounts
        const cleanup = () => { try { URL.revokeObjectURL(url); } catch (e) {} };
        // schedule cleanup on unmount
        (canvas as any).__initialImageCleanup = cleanup;
      }
    };
    return () => {
      // revoke any initial image url
      const cleanup = (canvasRef.current as any)?.__initialImageCleanup;
      if (cleanup && typeof cleanup === 'function') cleanup();
    };
  }, [baseImageUrl, initialImageFile]);

  // redraw main canvas from offscreen drawing + layers
  const redrawAll = () => {
    const canvas = canvasRef.current;
    const off = drawingOffscreen.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // draw existing strokes from offscreen
    if (off) ctx.drawImage(off, 0, 0);
    // draw layers (respecting visibility and opacity)
    for (const layer of layers) {
      if (!layer.visible) continue; // skip invisible layers
      
      ctx.save();
      ctx.globalAlpha = (layer.opacity || 100) / 100;
      
      if (layer.type === 'text') {
        // draw subtle stroke for contrast then fill
        ctx.fillStyle = layer.color || color;
        ctx.font = `${Math.max(8, layer.size || textSize)}px serif`;
        ctx.textBaseline = 'top';
        ctx.lineWidth = Math.max(1, (layer.size || textSize) * 0.08);
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeText(layer.text || '', layer.x || 0, layer.y || 0);
        ctx.fillText(layer.text || '', layer.x || 0, layer.y || 0);
      } else if (layer.type === 'image' && layer.img) {
        const w = layer.img.naturalWidth * (layer.scale || 1);
        const h = layer.img.naturalHeight * (layer.scale || 1);
        ctx.drawImage(layer.img, (layer.x || 0) - w/2, (layer.y || 0) - h/2, w, h);
      } else if (layer.type === 'drawing' && layer.drawingCanvas) {
        // Draw the drawing layer canvas
        ctx.drawImage(layer.drawingCanvas, 0, 0);
      }
      
      ctx.restore();
    }
    // draw selection outline with resize handles
    if (selectedLayer) {
      const s = layers.find(l => l.id === selectedLayer);
      if (s) {
        ctx.save();
        ctx.strokeStyle = '#00ffff';
        ctx.setLineDash([6,4]);
        ctx.lineWidth = 2;
        
        let bounds = { x: 0, y: 0, w: 0, h: 0 };
        
        if (s.type === 'image' && s.img) {
          const w = s.img.naturalWidth * (s.scale || 1);
          const h = s.img.naturalHeight * (s.scale || 1);
          bounds = { x: s.x - w/2, y: s.y - h/2, w, h };
        } else if (s.type === 'text') {
          ctx.font = `${Math.max(8, s.size || textSize)}px serif`;
          const measure = ctx.measureText(s.text || '');
          const w = measure.width;
          const h = (s.size || textSize) * 1.2;
          bounds = { x: s.x, y: s.y, w, h };
        }
        
        // Draw bounding box
        ctx.strokeRect(bounds.x - 6, bounds.y - 6, bounds.w + 12, bounds.h + 12);
        
        // Draw resize handles (corner circles)
        const handleSize = 10;
        ctx.fillStyle = '#00ffff';
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        
        const handles = [
          { x: bounds.x - 6, y: bounds.y - 6, pos: 'nw' }, // top-left
          { x: bounds.x + bounds.w + 6, y: bounds.y - 6, pos: 'ne' }, // top-right
          { x: bounds.x - 6, y: bounds.y + bounds.h + 6, pos: 'sw' }, // bottom-left
          { x: bounds.x + bounds.w + 6, y: bounds.y + bounds.h + 6, pos: 'se' }, // bottom-right
        ];
        
        handles.forEach(handle => {
          ctx.beginPath();
          ctx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
        
        ctx.restore();
      }
    }
  };

  useEffect(() => {
    if (!imageFile) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = URL.createObjectURL(imageFile);
    img.onload = () => setImageEl(img);
    return () => { try { URL.revokeObjectURL(img.src); } catch(e) {} };
  }, [imageFile]);

  // redraw when layers change
  useEffect(() => { redrawAll(); }, [layers]);

  const getCtx = (): CanvasRenderingContext2D | null => canvasRef.current?.getContext('2d') || null;

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (tool !== 'draw' && tool !== 'erase') return;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width || 1;
    const scaleY = canvas.height / rect.height || 1;
    const x = rawX * scaleX;
    const y = rawY * scaleY;
    
    // Check if we should draw on a selected drawing layer
    let targetCanvas = drawingOffscreen.current;
    if (selectedLayer) {
      const layer = layers.find(l => l.id === selectedLayer);
      if (layer && layer.type === 'drawing' && layer.drawingCanvas) {
        targetCanvas = layer.drawingCanvas;
      }
    }
    
    // draw on offscreen canvas or layer canvas
    const off = targetCanvas;
    if (!off) return;
    const octx = off.getContext('2d');
    if (!octx) return;
    octx.beginPath();
    octx.moveTo(x, y);
    octx.lineCap = 'round';
    octx.lineJoin = 'round';
    octx.lineWidth = brushSize * ((scaleX + scaleY) / 2);
    if (tool === 'erase') {
      octx.globalCompositeOperation = 'destination-out';
      octx.shadowBlur = 0;
    } else {
      octx.globalCompositeOperation = 'source-over';
      // if censor mode is active, draw flat black with no blur for redaction bars
      if (censorMode) {
        octx.strokeStyle = '#000000';
        octx.shadowBlur = 0;
      } else {
        octx.strokeStyle = color;
        octx.shadowColor = mode === 'filter' ? 'rgba(255,255,255,0.9)' : color;
        octx.shadowBlur = mode === 'filter' ? 8 : 15;
      }
    }
    setIsDrawing(true);
    // immediately reflect on main canvas
    redrawAll();
  };

  const handleCanvasClick = (e: React.MouseEvent): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = getCtx();
    if (!ctx) return false;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width || 1;
    const scaleY = canvas.height / rect.height || 1;
    const x = rawX * scaleX;
    const y = rawY * scaleY;
    
    // Check if clicking on resize handle of selected layer
    if (selectedLayer) {
      const s = layers.find(l => l.id === selectedLayer);
      if (s) {
        let bounds = { x: 0, y: 0, w: 0, h: 0 };
        
        if (s.type === 'image' && s.img) {
          const w = s.img.naturalWidth * (s.scale || 1);
          const h = s.img.naturalHeight * (s.scale || 1);
          bounds = { x: s.x - w/2, y: s.y - h/2, w, h };
        } else if (s.type === 'text') {
          ctx.font = `${Math.max(8, s.size || textSize)}px serif`;
          const measure = ctx.measureText(s.text || '');
          const w = measure.width;
          const h = (s.size || textSize) * 1.2;
          bounds = { x: s.x, y: s.y, w, h };
        }
        
        const handleSize = 10;
        const handles = [
          { x: bounds.x - 6, y: bounds.y - 6, pos: 'nw' },
          { x: bounds.x + bounds.w + 6, y: bounds.y - 6, pos: 'ne' },
          { x: bounds.x - 6, y: bounds.y + bounds.h + 6, pos: 'sw' },
          { x: bounds.x + bounds.w + 6, y: bounds.y + bounds.h + 6, pos: 'se' },
        ];
        
        for (const handle of handles) {
          const dist = Math.sqrt(Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2));
          if (dist <= handleSize) {
            // Start resizing
            setIsResizing(true);
            setResizeHandle(handle.pos);
            if (s.type === 'image' && s.img) {
              resizeStartRef.current = {
                x: s.x,
                y: s.y,
                width: s.img.naturalWidth * (s.scale || 1),
                height: s.img.naturalHeight * (s.scale || 1),
                scale: s.scale || 1
              };
            } else if (s.type === 'text') {
              resizeStartRef.current = {
                x: s.x,
                y: s.y,
                width: 0,
                height: 0,
                scale: s.size || textSize
              };
            }
            return true;
          }
        }
      }
    }
    
    // if clicking on an existing layer, select it (unless locked)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue; // skip invisible layers
      if (layer.type === 'image' && layer.img) {
        const w = layer.img.naturalWidth * (layer.scale || 1);
        const h = layer.img.naturalHeight * (layer.scale || 1);
        const left = layer.x - w/2;
        const top = layer.y - h/2;
        if (x >= left && x <= left + w && y >= top && y <= top + h) {
          setSelectedLayer(layer.id);
          // prepare drag offset and start dragging immediately
          dragOffsetRef.current = { ox: x - layer.x, oy: y - layer.y };
          setIsDraggingLayer(true);
          return true;
        }
      } else if (layer.type === 'text') {
        const size = layer.size || textSize;
        const measure = ctx.measureText(layer.text || '');
        const w = measure.width;
        const h = size * 1.2;
        const left = layer.x;
        const top = layer.y;
        if (x >= left && x <= left + w && y >= top && y <= top + h) {
          setSelectedLayer(layer.id);
          dragOffsetRef.current = { ox: x - layer.x, oy: y - layer.y };
          setIsDraggingLayer(true);
          return true;
        }
      }
    }

    // placing new items
    if (tool === 'placeText' && textValue) {
      const id = `layer-${Date.now()}`;
      const newLayer: Layer = { 
        id, 
        type: 'text', 
        name: textValue.substring(0, 20) || 'Texto',
        visible: true,
        opacity: 100,
        locked: false,
        x, 
        y, 
        text: textValue, 
        size: textSize, 
        color 
      };
      setLayers(prev => [...prev, newLayer]);
      setTool('draw');
      setTextValue('');
      redrawAll();
      return true;
    }

    if (tool === 'placeImage' && imageEl) {
      const id = `layer-${Date.now()}`;
      const newLayer: Layer = { 
        id, 
        type: 'image', 
        name: 'Imagem ' + (layers.filter(l => l.type === 'image').length + 1),
        visible: true,
        opacity: 100,
        locked: false,
        x, 
        y, 
        img: imageEl, 
        scale: imageScale 
      };
      setLayers(prev => [...prev, newLayer]);
      setTool('draw');
      setImageFile(null);
      setImageEl(null);
      redrawAll();
      return true;
    }
    // if clicked on empty space, clear selection and indicate we did not handle placement
    setSelectedLayer(null);
    return false;
  };

  const draw = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width || 1;
    const scaleY = canvas.height / rect.height || 1;
    const x = rawX * scaleX;
    const y = rawY * scaleY;
    
    // Handle resizing
    if (isResizing && selectedLayer && resizeHandle && resizeStartRef.current) {
      const s = layers.find(l => l.id === selectedLayer);
      if (s) {
        const startData = resizeStartRef.current;
        
        if (s.type === 'image' && s.img) {
          // Calculate new scale based on handle movement
          const dx = resizeHandle.includes('e') ? (x - startData.x) : (startData.x - x);
          const dy = resizeHandle.includes('s') ? (y - startData.y) : (startData.y - y);
          const delta = Math.max(dx, dy);
          const newScale = Math.max(0.1, startData.scale + (delta / s.img.naturalWidth));
          
          setLayers(prev => prev.map(l => 
            l.id === selectedLayer ? { ...l, scale: newScale } : l
          ));
        } else if (s.type === 'text') {
          // For text, resize means changing font size
          const dx = resizeHandle.includes('e') ? (x - startData.x) : (startData.x - x);
          const dy = resizeHandle.includes('s') ? (y - startData.y) : (startData.y - y);
          const delta = Math.max(dx, dy);
          const newSize = Math.max(8, Math.min(200, startData.scale + delta / 2));
          
          setLayers(prev => prev.map(l => 
            l.id === selectedLayer ? { ...l, size: Math.round(newSize) } : l
          ));
        }
        
        redrawAll();
      }
      return;
    }
    
    // Handle drawing
    if (isDrawing) {
      // Check if we should draw on a selected drawing layer
      let targetCanvas = drawingOffscreen.current;
      if (selectedLayer) {
        const layer = layers.find(l => l.id === selectedLayer);
        if (layer && layer.type === 'drawing' && layer.drawingCanvas) {
          targetCanvas = layer.drawingCanvas;
        }
      }
      
      const off = targetCanvas;
      if (!off) return;
      const ctx = off.getContext('2d');
      if (!ctx) return;
      ctx.lineTo(x, y);
      ctx.stroke();
      redrawAll();
      return;
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const off = drawingOffscreen.current;
    const ctx = off?.getContext('2d') || null;
    ctx?.closePath();
    setIsDrawing(false);
  };

  // drag handling for selected layer
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDraggingLayer && !isResizing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const scaleX = canvas.width / rect.width || 1;
      const scaleY = canvas.height / rect.height || 1;
      const x = rawX * scaleX;
      const y = rawY * scaleY;
      
      if (isDraggingLayer && selectedLayer) {
        setLayers(prev => prev.map(l => l.id !== selectedLayer ? l : { ...l, x: x - (dragOffsetRef.current?.ox||0), y: y - (dragOffsetRef.current?.oy||0) }));
        redrawAll();
      }
    };
    const handleUp = () => {
      if (isDraggingLayer) setIsDraggingLayer(false);
      if (isResizing) {
        setIsResizing(false);
        setResizeHandle(null);
        resizeStartRef.current = null;
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingLayer, isResizing, selectedLayer]);

  const handleFinish = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // ensure latest drawing + layers are rendered
    redrawAll();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `uv_layer_${Date.now()}.png`, { type: 'image/png' });
      onSave(file);
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const off = drawingOffscreen.current;
    if (off) {
      const octx = off.getContext('2d');
      octx?.clearRect(0,0,off.width, off.height);
    }
    setLayers([]);
    redrawAll();
  };

  const deleteLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayer === id) setSelectedLayer(null);
    redrawAll();
  };

  const selectLayer = (id: string) => {
    setSelectedLayer(id);
    setTool('draw');
    redrawAll();
  };

  const addEmptyTextLayer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const id = `layer-${Date.now()}`;
    const newLayer: Layer = { 
      id, 
      type: 'text',
      name: 'Novo Texto',
      visible: true,
      opacity: 100,
      locked: false,
      x: canvas.width / 2, 
      y: canvas.height / 2, 
      text: 'Novo Texto', 
      size: textSize, 
      color 
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayer(id);
    setShowAddLayerMenu(false);
    redrawAll();
  };

  const addEmptyDrawingLayer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const id = `layer-${Date.now()}`;
    
    // Create an offscreen canvas for this drawing layer
    const drawCanvas = document.createElement('canvas');
    drawCanvas.width = canvas.width;
    drawCanvas.height = canvas.height;
    
    const newLayer: Layer = { 
      id, 
      type: 'drawing',
      name: 'Desenho ' + (layers.filter(l => l.type === 'drawing').length + 1),
      visible: true,
      opacity: 100,
      locked: false,
      drawingCanvas: drawCanvas,
      x: 0,
      y: 0
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayer(id);
    setShowAddLayerMenu(false);
    setTool('draw');
    redrawAll();
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
    redrawAll();
  };

  const toggleLayerLock = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  };

  const updateLayerOpacity = (id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity: Math.max(0, Math.min(100, opacity)) } : l));
    redrawAll();
  };

  const renameLayer = (id: string, newName: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));
    setEditingLayerName(null);
  };

  const duplicateLayer = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;
    const newId = `layer-${Date.now()}`;
    const duplicated: Layer = {
      ...layer,
      id: newId,
      name: layer.name + ' (cópia)',
      x: (layer.x || 0) + 20,
      y: (layer.y || 0) + 20
    };
    const index = layers.findIndex(l => l.id === id);
    setLayers(prev => [...prev.slice(0, index + 1), duplicated, ...prev.slice(index + 1)]);
    setSelectedLayer(newId);
    redrawAll();
  };

  const mergeDown = (id: string) => {
    const index = layers.findIndex(l => l.id === id);
    if (index <= 0) return; // can't merge if it's the bottom layer
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create temporary canvas to merge layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    const lowerLayer = layers[index - 1];
    const upperLayer = layers[index];
    
    // Draw lower layer
    tempCtx.globalAlpha = (lowerLayer.opacity || 100) / 100;
    if (lowerLayer.type === 'image' && lowerLayer.img) {
      const w = lowerLayer.img.naturalWidth * (lowerLayer.scale || 1);
      const h = lowerLayer.img.naturalHeight * (lowerLayer.scale || 1);
      tempCtx.drawImage(lowerLayer.img, (lowerLayer.x || 0) - w/2, (lowerLayer.y || 0) - h/2, w, h);
    }
    
    // Draw upper layer on top
    tempCtx.globalAlpha = (upperLayer.opacity || 100) / 100;
    if (upperLayer.type === 'image' && upperLayer.img) {
      const w = upperLayer.img.naturalWidth * (upperLayer.scale || 1);
      const h = upperLayer.img.naturalHeight * (upperLayer.scale || 1);
      tempCtx.drawImage(upperLayer.img, (upperLayer.x || 0) - w/2, (upperLayer.y || 0) - h/2, w, h);
    }
    
    // Create merged image
    const mergedImg = new Image();
    mergedImg.src = tempCanvas.toDataURL();
    mergedImg.onload = () => {
      const mergedLayer: Layer = {
        id: `layer-${Date.now()}`,
        type: 'image',
        name: `${lowerLayer.name} + ${upperLayer.name}`,
        visible: true,
        opacity: 100,
        locked: false,
        x: canvas.width / 2,
        y: canvas.height / 2,
        img: mergedImg,
        scale: 1
      };
      
      setLayers(prev => [
        ...prev.slice(0, index - 1),
        mergedLayer,
        ...prev.slice(index + 1)
      ]);
      setSelectedLayer(mergedLayer.id);
      redrawAll();
    };
  };

  const mergeVisible = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Draw all visible layers
    for (const layer of layers) {
      if (!layer.visible) continue;
      
      tempCtx.globalAlpha = (layer.opacity || 100) / 100;
      
      if (layer.type === 'text') {
        tempCtx.fillStyle = layer.color || color;
        tempCtx.font = `${Math.max(8, layer.size || textSize)}px serif`;
        tempCtx.textBaseline = 'top';
        tempCtx.fillText(layer.text || '', layer.x || 0, layer.y || 0);
      } else if (layer.type === 'image' && layer.img) {
        const w = layer.img.naturalWidth * (layer.scale || 1);
        const h = layer.img.naturalHeight * (layer.scale || 1);
        tempCtx.drawImage(layer.img, (layer.x || 0) - w/2, (layer.y || 0) - h/2, w, h);
      }
    }
    
    const mergedImg = new Image();
    mergedImg.src = tempCanvas.toDataURL();
    mergedImg.onload = () => {
      const mergedLayer: Layer = {
        id: `layer-${Date.now()}`,
        type: 'image',
        name: 'Camadas Mescladas',
        visible: true,
        opacity: 100,
        locked: false,
        x: canvas.width / 2,
        y: canvas.height / 2,
        img: mergedImg,
        scale: 1
      };
      
      setLayers([mergedLayer]);
      setSelectedLayer(mergedLayer.id);
      redrawAll();
    };
  };

  const moveLayer = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newLayers = [...layers];
    const [movedLayer] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, movedLayer);
    setLayers(newLayers);
    redrawAll();
  };

  const getToolInstructions = () => {
    switch (tool) {
      case 'draw':
        return {
          title: '✏️ Modo Desenho',
          description: 'Desenhe livremente no canvas',
          steps: [
            ['1', 'Escolha uma cor na seção acima'],
            ['2', 'Ajuste o tamanho do pincel'],
            ['3', 'Clique e arraste no canvas para desenhar'],
          ],
        };
      case 'erase':
        return {
          title: '🗑️ Borracha',
          description: 'Apague partes do desenho',
          steps: [
            ['1', 'Use o tamanho para controlar a força de apagamento'],
            ['2', 'Clique e arraste para apagar'],
            ['3', 'Maior tamanho = área maior apagada'],
          ],
        };
      case 'placeText':
        return {
          title: '🅰️ Inserir Texto',
          description: 'Adicione textos à sua arte',
          steps: [
            ['1', 'Digite o texto na caixa abaixo'],
            ['2', 'Defina o tamanho (8-200px)'],
            ['3', 'Clique no canvas para colocar'],
            ['4', 'Pressione ENTER ou clique para confirmar'],
          ],
        };
      case 'placeImage':
        return {
          title: '🖼️ Inserir Imagem',
          description: 'Coloque imagens do seu computador',
          steps: [
            ['1', 'Clique no botão "Imagem" para selecionar'],
            ['2', 'Escolha uma imagem do seu PC'],
            ['3', 'Ajuste a escala (10%-200%)'],
            ['4', 'Clique no canvas para colocar'],
          ],
        };
      default:
        return null;
    }
  };

  return (
    <div className="uv-editor-overlay">
      <div className="uv-editor-panel">
        <div className="uv-header">
          <h3>{mode === 'filter' ? '🔍 Desenhar Segredos' : '💎 Luz UV'}</h3>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>

        <div className="uv-editor-main">
          <div className="editor-workspace">
            <div className="canvas-container" style={{ backgroundImage: `url(${baseImageUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={(e) => { const handled = handleCanvasClick(e); if (!handled && (tool === 'draw' || tool === 'erase')) startDrawing(e); }}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className={isResizing ? 'resizing' : isDraggingLayer ? 'dragging' : ''}
                style={{ display: 'block', maxWidth: '100%' }}
              />
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="uv-sidebar">
            <div className="uv-sidebar-scroll">
            
            {/* TOOLS */}
            <div className="uv-sidebar-section" style={{ minHeight: '200px' }}>
              <h4>🛠️ Ferramentas</h4>
              <div className="tools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button
                  className={`tool-btn ${tool === 'draw' ? 'active' : ''}`}
                  onClick={() => setTool('draw')}
                  title="Desenhar"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  ✏️ Desenhar
                </button>
                <button
                  className={`tool-btn ${tool === 'erase' ? 'active' : ''}`}
                  onClick={() => setTool('erase')}
                  title="Apagar"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  🗑️ Borracha
                </button>
                <button
                  className={`tool-btn ${censorMode ? 'active' : ''}`}
                  onClick={() => {
                    const next = !censorMode;
                    setCensorMode(next);
                    if (next) {
                      setColor('#000000');
                      setTool('draw');
                      setBrushSize(20);
                    }
                  }}
                  title="Censura"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  🟥 Censura
                </button>
                <button
                  className={`tool-btn ${tool === 'placeText' ? 'active' : ''}`}
                  onClick={() => setTool('placeText')}
                  title="Texto"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  🅰️ Texto
                </button>
                <button
                  className={`tool-btn ${tool === 'placeImage' ? 'active' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  title="Imagem"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  🖼️ Imagem
                </button>
                <button
                  className="tool-btn"
                  onClick={clearCanvas}
                  title="Limpar"
                  style={{ display: 'block', minHeight: '36px' }}
                >
                  ⚡ Limpar
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0] || null; setImageFile(f); if (f) setTool('placeImage'); }} />
            </div>

            {/* COLORS */}
            <div className="uv-sidebar-section">
              <h4>🎨 Cor</h4>
              <div className="color-grid">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    className={`color-btn ${color === c.hex ? 'active' : ''}`}
                    style={{ background: c.hex, boxShadow: color === c.hex ? `${c.glow}, inset 0 0 10px rgba(255,255,255,0.3)` : `0 0 0 1px rgba(0,0,0,0.5)` }}
                    onClick={() => { setColor(c.hex); setTool('draw'); }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* SIZE */}
            <div className="uv-sidebar-section">
              <h4>📏 Tamanho</h4>
              <div className="size-control">
                <div className="size-input-group">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Math.max(1, Math.min(100, Number(e.target.value))))}
                  />
                  <span style={{color:'#aaa', fontSize:'11px', minWidth:'20px'}}>px</span>
                </div>
                <div className="size-preview">
                  <div className="size-preview-dot" style={{ width: `${Math.min(brushSize, 40)}px`, height: `${Math.min(brushSize, 40)}px` }} />
                </div>
              </div>
            </div>

            {/* LAYERS */}
            <div className="uv-sidebar-section layers-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0 }}>📦 Camadas ({layers.length})</h4>
                <div style={{ display: 'flex', gap: '6px', position: 'relative' }}>
                  <button 
                    onClick={mergeVisible}
                    className="layer-action-btn"
                    title="Mesclar Visíveis"
                    disabled={layers.filter(l => l.visible).length < 2}
                  >
                    🔗
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setShowAddLayerMenu(!showAddLayerMenu)}
                      className="add-layer-btn"
                      title="Adicionar nova camada"
                    >
                      ➕
                    </button>
                    
                    {showAddLayerMenu && (
                      <>
                        <div 
                          style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 999
                          }}
                          onClick={() => setShowAddLayerMenu(false)}
                        />
                        <div 
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            background: 'rgba(20, 20, 20, 0.98)',
                            border: '1px solid #b366ff',
                            borderRadius: '6px',
                            padding: '6px',
                            minWidth: '160px',
                            boxShadow: '0 0 20px rgba(179, 102, 255, 0.4)',
                            zIndex: 1000
                          }}
                        >
                          <button
                            onClick={addEmptyDrawingLayer}
                            style={{
                              width: '100%',
                              background: 'rgba(100, 100, 100, 0.3)',
                              border: '1px solid rgba(180, 180, 180, 0.3)',
                              color: '#ddd',
                              padding: '8px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              textAlign: 'left',
                              marginBottom: '4px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(150, 150, 150, 0.5)';
                              e.currentTarget.style.borderColor = '#00ffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(100, 100, 100, 0.3)';
                              e.currentTarget.style.borderColor = 'rgba(180, 180, 180, 0.3)';
                            }}
                          >
                            🎨 Camada de Desenho
                          </button>
                          <button
                            onClick={addEmptyTextLayer}
                            style={{
                              width: '100%',
                              background: 'rgba(100, 100, 100, 0.3)',
                              border: '1px solid rgba(180, 180, 180, 0.3)',
                              color: '#ddd',
                              padding: '8px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              textAlign: 'left',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(150, 150, 150, 0.5)';
                              e.currentTarget.style.borderColor = '#00ffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(100, 100, 100, 0.3)';
                              e.currentTarget.style.borderColor = 'rgba(180, 180, 180, 0.3)';
                            }}
                          >
                            🅰️ Camada de Texto
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="layers-list">
                {layers.length === 0 ? (
                  <div className="no-layers">
                    Nenhuma camada ainda.
                    <br />
                    <small>Clique no "➕" acima para adicionar</small>
                  </div>
                ) : (
                  [...layers].reverse().map((layer, reverseIndex) => {
                    const actualIndex = layers.length - 1 - reverseIndex;
                    return (
                      <div
                        key={layer.id}
                        className={`layer-item ${selectedLayer === layer.id ? 'active' : ''} ${layer.locked ? 'locked' : ''}`}
                        draggable={!layer.locked}
                        onDragStart={(e) => {
                          if (layer.locked) {
                            e.preventDefault();
                            return;
                          }
                          setDraggedLayerId(layer.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverLayerId(layer.id);
                        }}
                        onDragLeave={() => {
                          setDragOverLayerId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedLayerId && draggedLayerId !== layer.id) {
                            const fromIndex = layers.findIndex(l => l.id === draggedLayerId);
                            const toIndex = actualIndex;
                            moveLayer(fromIndex, toIndex);
                          }
                          setDraggedLayerId(null);
                          setDragOverLayerId(null);
                        }}
                        onDragEnd={() => {
                          setDraggedLayerId(null);
                          setDragOverLayerId(null);
                        }}
                        style={{
                          borderColor: dragOverLayerId === layer.id ? '#b366ff' : undefined,
                          borderWidth: dragOverLayerId === layer.id ? '2px' : '1px',
                          opacity: draggedLayerId === layer.id ? 0.5 : 1,
                        }}
                      >
                        <div className="layer-controls">
                          <button
                            className={`layer-visibility-btn ${layer.visible ? 'visible' : 'hidden'}`}
                            onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                            title={layer.visible ? 'Ocultar camada' : 'Mostrar camada'}
                          >
                            {layer.visible ? '👁️' : '🚫'}
                          </button>
                          <button
                            className={`layer-lock-btn ${layer.locked ? 'locked' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                            title={layer.locked ? 'Desbloquear camada' : 'Bloquear camada'}
                          >
                            {layer.locked ? '🔒' : '🔓'}
                          </button>
                        </div>
                        <div className="layer-item-info" onClick={() => !layer.locked && selectLayer(layer.id)}>
                          {editingLayerName === layer.id ? (
                            <input
                              type="text"
                              className="layer-name-input"
                              value={layer.name}
                              onChange={(e) => setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, name: e.target.value } : l))}
                              onBlur={() => setEditingLayerName(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingLayerName(null);
                                if (e.key === 'Escape') {
                                  setEditingLayerName(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="layer-item-title"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                if (!layer.locked) setEditingLayerName(layer.id);
                              }}
                              title="Clique duplo para renomear"
                            >
                              {layer.name}
                            </div>
                          )}
                          <div className="layer-item-type">
                            {layer.type === 'text' ? `Texto ${layer.size}px` : 
                             layer.type === 'image' ? `Escala ${((layer.scale || 1) * 100).toFixed(0)}%` : 
                             layer.type === 'drawing' ? 'Desenho livre' : 
                             layer.type}
                          </div>
                        </div>
                        <div className="layer-item-actions">
                          <button 
                            onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }} 
                            title="Duplicar"
                            disabled={layer.locked}
                          >
                            📑
                          </button>
                          {actualIndex > 0 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); mergeDown(layer.id); }} 
                              title="Mesclar para baixo"
                              disabled={layer.locked}
                            >
                              ⬇️
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} 
                            className="delete" 
                            title="Deletar"
                            disabled={layer.locked}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* LAYER CONTROLS - OUTSIDE SCROLLABLE AREA */}
            {selectedLayer && layers.find(l => l.id === selectedLayer) && (() => {
              const layer = layers.find(l => l.id === selectedLayer);
              if (!layer) return null;
              return (
                <div className="uv-sidebar-section" style={{ borderTop: '2px solid #b366ff', paddingTop: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#00ffff' }}>⚙️ Controles da Camada</h4>
                  
                  {/* OPACITY */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', color: '#aaa' }}>Opacidade</label>
                      <span style={{ fontSize: '11px', color: '#00ffff', fontWeight: 'bold' }}>{layer.opacity || 100}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={layer.opacity || 100}
                      onChange={(e) => updateLayerOpacity(selectedLayer, Number(e.target.value))}
                      disabled={layer.locked}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  {/* SCALE - Only for images */}
                  {layer.type === 'image' && layer.img && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', color: '#aaa' }}>Escala</label>
                        <span style={{ fontSize: '11px', color: '#00ffff', fontWeight: 'bold' }}>{((layer.scale || 1) * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={300}
                        step={5}
                        value={(layer.scale || 1) * 100}
                        onChange={(e) => {
                          const newScale = Number(e.target.value) / 100;
                          setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, scale: newScale } : l));
                          redrawAll();
                        }}
                        disabled={layer.locked}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                        <button 
                          onClick={() => {
                            setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, scale: 0.5 } : l));
                            redrawAll();
                          }}
                          disabled={layer.locked}
                          style={{ flex: 1, padding: '4px', fontSize: '10px', background: 'rgba(100,100,100,0.3)', border: '1px solid #555', color: '#ddd', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          50%
                        </button>
                        <button 
                          onClick={() => {
                            setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, scale: 1 } : l));
                            redrawAll();
                          }}
                          disabled={layer.locked}
                          style={{ flex: 1, padding: '4px', fontSize: '10px', background: 'rgba(100,100,100,0.3)', border: '1px solid #555', color: '#ddd', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          100%
                        </button>
                        <button 
                          onClick={() => {
                            setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, scale: 2 } : l));
                            redrawAll();
                          }}
                          disabled={layer.locked}
                          style={{ flex: 1, padding: '4px', fontSize: '10px', background: 'rgba(100,100,100,0.3)', border: '1px solid #555', color: '#ddd', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          200%
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* FONT SIZE - Only for text */}
                  {layer.type === 'text' && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', color: '#aaa' }}>Tamanho</label>
                        <span style={{ fontSize: '11px', color: '#00ffff', fontWeight: 'bold' }}>{layer.size || textSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={8}
                        max={200}
                        value={layer.size || textSize}
                        onChange={(e) => {
                          const newSize = Number(e.target.value);
                          setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, size: newSize } : l));
                          redrawAll();
                        }}
                        disabled={layer.locked}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
          </div>
        </div>

        {/* FLOATING CONTROLS */}
        {tool === 'placeText' && (
          <div className="floating-control">
            <input
              placeholder="Texto..."
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && textValue) { handleCanvasClick(e as any); } }}
              autoFocus
            />
            <label>Tam:</label>
            <input
              type="number"
              min={8}
              max={200}
              value={textSize}
              onChange={e => setTextSize(Number(e.target.value))}
              style={{ width: 60 }}
            />
            <span style={{color:'#aaa', fontSize:'10px'}}>Clique no canvas</span>
          </div>
        )}

        {tool === 'placeImage' && imageFile && (
          <div className="floating-control">
            <label>Escala:</label>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.05}
              value={imageScale}
              onChange={e => setImageScale(Number(e.target.value))}
              style={{ width: 100 }}
            />
            <span style={{color:'#aaa', fontSize:'10px'}}>{(imageScale * 100).toFixed(0)}%</span>
            <span style={{color:'#aaa', fontSize:'10px'}}>Clique no canvas</span>
          </div>
        )}

        {/* RESIZE INDICATOR */}
        {isResizing && selectedLayer && (() => {
          const s = layers.find(l => l.id === selectedLayer);
          if (!s) return null;
          
          let sizeText = '';
          if (s.type === 'image' && s.img) {
            const w = Math.round(s.img.naturalWidth * (s.scale || 1));
            const h = Math.round(s.img.naturalHeight * (s.scale || 1));
            sizeText = `${w}×${h}px (${((s.scale || 1) * 100).toFixed(0)}%)`;
          } else if (s.type === 'text') {
            sizeText = `${s.size || textSize}px`;
          }
          
          return (
            <div className="resize-indicator">
              📏 {sizeText}
            </div>
          );
        })()}

        {/* INSTRUCTIONS PANEL - OPTIONAL */}
        {showInstructions && (() => {
          const instructions = getToolInstructions();
          if (!instructions) return null;
          return (
            <div className="instructions-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h5 style={{ margin: 0 }}>{instructions.title}</h5>
                <button 
                  onClick={() => setShowInstructions(false)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', padding: '0 4px' }}
                  title="Fechar ajuda"
                >
                  ✕
                </button>
              </div>
              <p>{instructions.description}</p>
              {instructions.steps.map((step, i) => (
                <div key={i} className="instruction-step">
                  <strong>{step[0]}</strong>
                  <span>{step[1]}</span>
                </div>
              ))}
            </div>
          );
        })()}

        <div className="uv-toolbar">
          <button 
            className="btn-help"
            onClick={() => setShowInstructions(!showInstructions)}
            title={showInstructions ? 'Ocultar ajuda' : 'Mostrar ajuda'}
          >
            {showInstructions ? '📖' : '❓'}
          </button>
          <button className="btn-save-uv" onClick={handleFinish}>✓ Confirmar</button>
        </div>
      </div>
    </div>
  );
}
