import React from 'react';
import { useDisplayConfig } from '../../config/displayConfig';

interface FilePropertiesProps {
  metaData?: Record<string, any>;
  filename?: string;
}

export default function FileProperties({ metaData, filename }: FilePropertiesProps) {
  const displayConfig = useDisplayConfig();
  const gps = metaData?.gps_coords || metaData?.gps || '';
  return (
    <div style={{
      background: '#e0e0e0',
      color: '#000',
      padding: 10,
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      width: '100%',
      maxWidth: 340,
      boxSizing: 'border-box',
      border: '1px solid #999',
      boxShadow: '5px 5px 15px rgba(0,0,0,0.5)',
      touchAction: 'manipulation'
    }}>
      <div style={{
        background: '#000080',
        color: '#fff',
        padding: '4px 8px',
        fontWeight: 'bold',
        marginBottom: 10,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minWidth: 0
      }}>
        Propriedades: {filename}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 6, minWidth: 0 }}>
        {displayConfig.fileProperties.showFileType && (
          <>
            <strong>Tipo:</strong><div style={{ wordBreak: 'break-word', minWidth: 0 }}>Image File (JPEG)</div>
          </>
        )}
        {displayConfig.fileProperties.showSize && (
          <>
            <strong>Tamanho:</strong><div style={{ wordBreak: 'break-word', minWidth: 0 }}>{metaData?.size || '—'}</div>
          </>
        )}
        {(displayConfig.fileProperties.showFileType || displayConfig.fileProperties.showSize) && (
          <hr style={{ gridColumn: 'span 2', width: '100%', borderColor: '#999' }} />
        )}
        {displayConfig.fileProperties.showCameraModel && (
          <>
            <strong>Câmera:</strong><div style={{ wordBreak: 'break-word', minWidth: 0 }}>{metaData?.camera_model || 'Device_Unknown_Ordo_Tech'}</div>
          </>
        )}
        {displayConfig.fileProperties.showDate && (
          <>
            <strong>Data:</strong><div style={{ wordBreak: 'break-word', minWidth: 0 }}>{metaData?.date_created || metaData?.fake_date || 'Corrompido'}</div>
          </>
        )}
        {displayConfig.fileProperties.showGPS && (
          <>
            <strong>Local:</strong>
            <div style={{ wordBreak: 'break-word', minWidth: 0 }}>
              {gps ? <a href={`https://maps.google.com/?q=${gps}`} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>{gps}</a> : '—'}
            </div>
          </>
        )}
        {displayConfig.fileProperties.showOwner && (
          <>
            <strong>Owner:</strong><div style={{ color: 'red', wordBreak: 'break-word', minWidth: 0 }}>{metaData?.owner_name || 'Desconhecido'}</div>
          </>
        )}
      </div>

      {displayConfig.fileProperties.showHexComment && (
        <div style={{ marginTop: 12, border: '1px inset #fff', padding: 8, background: '#fff', minHeight: 60, minWidth: 0 }}>
          <em>Metadados HEX / Nota Técnica:</em>
          <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', minWidth: 0 }}>
            {metaData?.hex_comment || metaData?.technical_note || '00 4F 52 44 4F 00 00'}
          </div>
        </div>
      )}
    </div>
  );
}
