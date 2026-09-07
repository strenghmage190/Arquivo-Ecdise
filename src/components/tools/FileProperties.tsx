import React from 'react';
import { useDisplayConfig } from '../../config/displayConfig';

interface FilePropertiesProps {
  metaData?: Record<string, any>;
  filename?: string;
}

export default function FileProperties({ metaData, filename }: FilePropertiesProps) {
  const displayConfig = useDisplayConfig();
  const gps = metaData?.gps_coords || metaData?.gps || '';
  const rows = [
    displayConfig.fileProperties.showFileType && ['TIPO', metaData?.file_type || 'IMAGE / JPEG'],
    displayConfig.fileProperties.showSize && ['TAMANHO', metaData?.size || '—'],
    displayConfig.fileProperties.showCameraModel && ['CÂMERA', metaData?.camera_model || 'NÃO IDENTIFICADA'],
    displayConfig.fileProperties.showDate && ['DATA', metaData?.date_created || metaData?.fake_date || 'NÃO REGISTRADA'],
    displayConfig.fileProperties.showGPS && ['LOCAL', gps],
    displayConfig.fileProperties.showOwner && ['RESPONSÁVEL', metaData?.owner_name || 'DESCONHECIDO'],
  ].filter(Boolean) as string[][];

  return (
    <aside className="file-properties" aria-label={`Propriedades de ${filename || 'arquivo'}`}>
      <div className="file-properties-header"><span>METADADOS</span><strong>{filename || 'ARQUIVO SEM NOME'}</strong></div>
      <dl>
        {rows.map(([label, value]) => (
          <div className="file-property-row" key={label}>
            <dt>{label}</dt>
            <dd>{label === 'LOCAL' && gps ? <a href={`https://maps.google.com/?q=${gps}`} target="_blank" rel="noreferrer">{value}</a> : value}</dd>
          </div>
        ))}
      </dl>
      {displayConfig.fileProperties.showHexComment && (
        <div className="file-properties-note">
          <span>NOTA TÉCNICA</span>
          <code>{metaData?.hex_comment || metaData?.technical_note || 'SEM NOTA REGISTRADA'}</code>
        </div>
      )}
    </aside>
  );
}
