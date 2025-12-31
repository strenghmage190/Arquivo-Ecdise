import React from 'react';

interface FilePropertiesProps {
  metaData?: Record<string, any>;
  filename?: string;
}

export default function FileProperties({ metaData, filename }: FilePropertiesProps) {
  const gps = metaData?.gps_coords || metaData?.gps || '';
  return (
    <div style={{ background: '#e0e0e0', color: '#000', padding: 10, fontFamily: 'Arial', fontSize: 12, width: 320, border: '1px solid #999', boxShadow: '5px 5px 15px rgba(0,0,0,0.5)' }}>
      <div style={{ background: '#000080', color: '#fff', padding: '2px 5px', fontWeight: 'bold', marginBottom: 10 }}>
        Propriedades: {filename}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 6 }}>
        <strong>Tipo:</strong><div>Image File (JPEG)</div>
        <strong>Tamanho:</strong><div>{metaData?.size || '—'}</div>
        <hr style={{ gridColumn: 'span 2', width: '100%', borderColor: '#999' }} />
        <strong>Câmera:</strong><div>{metaData?.camera_model || 'Device_Unknown_Ordo_Tech'}</div>
        <strong>Data:</strong><div>{metaData?.date_created || metaData?.fake_date || 'Corrompido'}</div>
        <strong>Local:</strong>
        <div>
          {gps ? <a href={`https://maps.google.com/?q=${gps}`} target="_blank" rel="noreferrer">{gps}</a> : '—'}
        </div>
        <strong>Owner:</strong><div style={{ color: 'red' }}>{metaData?.owner_name || 'Desconhecido'}</div>
      </div>

      <div style={{ marginTop: 12, border: '1px inset #fff', padding: 8, background: '#fff', minHeight: 60 }}>
        <em>Metadados HEX / Nota Técnica:</em>
        <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 11 }}>{metaData?.hex_comment || metaData?.technical_note || '00 4F 52 44 4F 00 00'}</div>
      </div>
    </div>
  );
}
