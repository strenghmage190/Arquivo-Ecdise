import React from 'react';
import { Layer } from './tools/UVEditor';

interface LayerPreviewProps {
  layer: Layer;
}

export function LayerPreview({ layer }: LayerPreviewProps) {
  return (
    <div className="layer-preview">
      {layer.preview ? (
        <img src={layer.preview} alt={`Preview of ${layer.name}`} />
      ) : layer.img && (layer as any).img.src ? (
        <img src={(layer as any).img.src} alt={`Preview of ${layer.name}`} />
      ) : layer.drawingCanvas ? (
        <img src={layer.drawingCanvas.toDataURL()} alt={`Preview of ${layer.name}`} />
      ) : layer.mask ? (
        <img src={layer.mask.toDataURL()} alt={`Mask preview of ${layer.name}`} />
      ) : (
        <div className="no-preview">No Preview Available</div>
      )}
    </div>
  );
}