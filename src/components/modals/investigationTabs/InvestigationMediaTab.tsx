import React from 'react';

interface InvestigationMediaTabProps {
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  selectedFileName: string | null;
  setSelectedFileName: (name: string | null) => void;
  imageDims: { w: number; h: number } | null;
  setImageDims: (dims: { w: number; h: number } | null) => void;
  uploading: boolean;
  setUploading: (loading: boolean) => void;
  uvUrl: string | null;
  setUvUrl: (url: string | null) => void;
  thermalUrl: string | null;
  setThermalUrl: (url: string | null) => void;
  layerUploading: 'uv' | 'thermal' | null;
  setLayerUploading: (layer: 'uv' | 'thermal' | null) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleLayerUpload: (layer: 'uv' | 'thermal', file: File) => Promise<void>;
  handleRemoveLayer: (layer: 'uv' | 'thermal') => Promise<void>;
  isGameMaster: boolean;
  cardType?: string;
}

export default function InvestigationMediaTab({
  imageUrl,
  selectedFileName,
  previewUrl,
  imageDims,
  uploading,
  uvUrl,
  thermalUrl,
  layerUploading,
  handleFileChange,
  handleLayerUpload,
  handleRemoveLayer,
  isGameMaster,
  cardType,
}: InvestigationMediaTabProps) {
  return (
    <div style={{ width: 320 }}>
      {/* Main Image */}
      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #333' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
          📷 Imagem Principal
        </label>
        {isGameMaster ? (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ width: '100%', marginBottom: 8 }}
            />
            {selectedFileName && (
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
                ✓ {selectedFileName}
              </div>
            )}
            {uploading && (
              <div style={{ fontSize: 12, color: '#f1c40f' }}>⏳ Enviando imagem...</div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: '#ccc' }}>
            {imageUrl ? '✓ Imagem disponível' : 'Sem imagem'}
          </div>
        )}

        {previewUrl && (
          <div style={{ marginTop: 8 }}>
            <img
              src={previewUrl}
              alt="preview"
              style={{
                maxWidth: '100%',
                maxHeight: 160,
                borderRadius: 6,
                border: '1px solid #444',
              }}
            />
            {imageDims && (
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                Dimensões: {imageDims.w}×{imageDims.h}
              </div>
            )}
          </div>
        )}
      </div>

      {/* UV Layer - Only for GM with document-type cards */}
      {isGameMaster && (!cardType || cardType === 'document') && (
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #333' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            <span>📤 Camada UV</span>
            {uvUrl && (
              <button
                type="button"
                onClick={() => handleRemoveLayer('uv')}
                style={{
                  padding: '4px 8px',
                  fontSize: 12,
                  background: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                🗑️ Remover
              </button>
            )}
          </label>

          {uvUrl ? (
            <div style={{ fontSize: 12, color: '#aaa' }}>
              ✅ Camada UV carregada
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) handleLayerUpload('uv', file);
                  };
                  input.click();
                }}
                disabled={layerUploading === 'uv'}
                style={{
                  marginLeft: 8,
                  padding: '4px 8px',
                  fontSize: 11,
                  background: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                🔄 Substituir
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) handleLayerUpload('uv', file);
                };
                input.click();
              }}
              disabled={layerUploading === 'uv'}
              style={{
                width: '100%',
                padding: '8px',
                background: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {layerUploading === 'uv' ? '⏳ Enviando...' : '⬆️ Upload UV'}
            </button>
          )}
        </div>
      )}

      {/* Thermal Layer - Only for GM with document-type cards */}
      {isGameMaster && (!cardType || cardType === 'document') && (
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            <span>🌡️ Camada Térmica</span>
            {thermalUrl && (
              <button
                type="button"
                onClick={() => handleRemoveLayer('thermal')}
                style={{
                  padding: '4px 8px',
                  fontSize: 12,
                  background: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                🗑️ Remover
              </button>
            )}
          </label>

          {thermalUrl ? (
            <div style={{ fontSize: 12, color: '#aaa' }}>
              ✅ Camada Térmica carregada
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) handleLayerUpload('thermal', file);
                  };
                  input.click();
                }}
                disabled={layerUploading === 'thermal'}
                style={{
                  marginLeft: 8,
                  padding: '4px 8px',
                  fontSize: 11,
                  background: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                🔄 Substituir
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) handleLayerUpload('thermal', file);
                };
                input.click();
              }}
              disabled={layerUploading === 'thermal'}
              style={{
                width: '100%',
                padding: '8px',
                background: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {layerUploading === 'thermal' ? '⏳ Enviando...' : '⬆️ Upload Térmica'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
