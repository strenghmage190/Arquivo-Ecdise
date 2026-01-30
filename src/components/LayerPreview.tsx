import React from 'react';
import { Layer } from './tools/UVEditor';

interface LayerPreviewProps {
  layer: Layer;
}

export function LayerPreview({ layer }: LayerPreviewProps) {
  return (
    <div className="layer-preview">
      {layer.preview ? (
        <img src={layer.preview} alt={`Preview of ${layer.name}`} loading="lazy" />
      ) : layer.img && (layer as any).img.src ? (
        <img src={(layer as any).img.src} alt={`Preview of ${layer.name}`} loading="lazy" />
      ) : layer.drawingCanvas ? (
        <img src={layer.drawingCanvas.toDataURL()} alt={`Preview of ${layer.name}`} loading="lazy" />
      ) : layer.mask ? (
        <img src={layer.mask.toDataURL()} alt={`Mask preview of ${layer.name}`} loading="lazy" />
      ) : (
        <div className="no-preview">No Preview Available</div>
      )}
    </div>
  );
}