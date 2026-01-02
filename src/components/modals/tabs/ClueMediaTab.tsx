/**
 * 🎨 ClueMediaTab.tsx
 * Tab para upload de mídia
 * - Imagem principal, UV, Thermal, Filter
 * - Áudio base e oculto
 * - Vídeo
 */

import React from 'react';

interface ClueMediaTabProps {
  // Image
  imgFile: File | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  previewUrl: string | null;

  // UV Layer
  uvFile: File | null;
  onUVSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  previewUrl2: string | null;

  // Thermal
  thermalEnabled: boolean;
  onThermalEnabledChange: (enabled: boolean) => void;
  thermalSecretText: string;
  onThermalSecretTextChange: (text: string) => void;
  showThermalEditor: boolean;
  onShowThermalEditorChange: (show: boolean) => void;

  // Filter
  filterFile: File | null;
  onFilterSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filterPreviewUrl: string | null;

  // Audio Base
  audioBase: File | null;
  onAudioBaseSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  audioBasePreview: string | null;

  // Audio Hidden
  audioHidden: File | null;
  onAudioHiddenSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  audioHiddenPreview: string | null;
  showMixer: boolean;
  onShowMixerChange: (show: boolean) => void;

  // Video
  videoFile: File | null;
  onVideoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  videoPreviewUrl: string | null;
  videoUrlInput: string;
  onVideoUrlInputChange: (url: string) => void;
  videoUploading: boolean;
  uploadProgress: Record<string, number>;

  // Loading
  loading: boolean;
}

export default function ClueMediaTab({
  imgFile,
  onImageSelect,
  previewUrl,
  uvFile,
  onUVSelect,
  previewUrl2,
  thermalEnabled,
  onThermalEnabledChange,
  thermalSecretText,
  onThermalSecretTextChange,
  showThermalEditor,
  onShowThermalEditorChange,
  filterFile,
  onFilterSelect,
  filterPreviewUrl,
  audioBase,
  onAudioBaseSelect,
  audioBasePreview,
  audioHidden,
  onAudioHiddenSelect,
  audioHiddenPreview,
  showMixer,
  onShowMixerChange,
  videoFile,
  onVideoSelect,
  videoPreviewUrl,
  videoUrlInput,
  onVideoUrlInputChange,
  videoUploading,
  uploadProgress,
  loading,
}: ClueMediaTabProps) {
  return (
    <div className="field-block">
      <span className="field-title">🎬 MÍDIA</span>

      {/* IMAGE */}
      <div className="field-block" style={{ background: 'rgba(52,152,219,0.05)', padding: 12, borderRadius: 6, border: '1px solid rgba(52,152,219,0.1)', marginBottom: 20 }}>
        <label>📷 IMAGEM PRINCIPAL</label>
        <label className="upload-btn" style={{ cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          SELECIONAR IMAGEM
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={onImageSelect}
            disabled={loading}
          />
        </label>
        {previewUrl && (
          <div style={{ marginTop: 8 }}>
            <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 6 }} />
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>✅ Imagem carregada</div>
          </div>
        )}
        {uploadProgress['image'] !== undefined && uploadProgress['image'] < 100 && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#aaa' }}>
            Upload: {uploadProgress['image']}%
          </div>
        )}
      </div>

      {/* UV LAYER */}
      <div className="field-block" style={{ background: 'rgba(155,89,182,0.05)', padding: 12, borderRadius: 6, border: '1px solid rgba(155,89,182,0.1)', marginBottom: 20 }}>
        <label>🟣 CAMADA ULTRAVIOLETA (UV)</label>
        <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Adicionar depois é possível (upload tardio)</p>
        <label className="upload-btn" style={{ cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          SELECIONAR UV
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={onUVSelect}
            disabled={loading}
          />
        </label>
        {previewUrl2 && (
          <div style={{ marginTop: 8 }}>
            <img src={previewUrl2} alt="uv" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 6 }} />
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>✅ UV carregado</div>
          </div>
        )}
        {uploadProgress['uv'] !== undefined && uploadProgress['uv'] < 100 && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#aaa' }}>
            Upload: {uploadProgress['uv']}%
          </div>
        )}
      </div>

      {/* THERMAL */}
      <div className="field-block" style={{ background: 'rgba(230,126,34,0.05)', padding: 12, borderRadius: 6, border: '1px solid rgba(230,126,34,0.1)', marginBottom: 20 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={thermalEnabled}
            onChange={(e) => onThermalEnabledChange(e.target.checked)}
            disabled={loading}
            style={{ cursor: 'pointer' }}
          />
          <span>🌡️ ATIVAR CAMADA TÉRMICA</span>
        </label>

        {thermalEnabled && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(230,126,34,0.2)' }}>
            <div className="field-block">
              <label>Texto Secreto (visível em infravermelho)</label>
              <input
                type="text"
                value={thermalSecretText}
                onChange={(e) => onThermalSecretTextChange(e.target.value)}
                disabled={loading}
                placeholder="Ex: CÓDIGO DE ACESSO"
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#1a1a1a',
                  border: '1px solid #444',
                  color: '#fff',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
            </div>
            <button
              onClick={() => onShowThermalEditorChange(true)}
              disabled={loading}
              style={{
                width: '100%',
                padding: 8,
                marginTop: 8,
                background: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: loading ? 'default' : 'pointer',
              }}
            >
              🎨 ABRIR EDITOR TÉRMICO
            </button>
          </div>
        )}
      </div>

      {/* FILTER */}
      <div className="field-block" style={{ background: 'rgba(46,204,113,0.05)', padding: 12, borderRadius: 6, border: '1px solid rgba(46,204,113,0.1)', marginBottom: 20 }}>
        <label>✨ CAMADA DE FILTRO (overlay revelador)</label>
        <label className="upload-btn" style={{ cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          SELECIONAR FILTRO
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={onFilterSelect}
            disabled={loading}
          />
        </label>
        {filterPreviewUrl && (
          <div style={{ marginTop: 8 }}>
            <img src={filterPreviewUrl} alt="filter" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 6 }} />
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>✅ Filtro carregado</div>
          </div>
        )}
      </div>

      {/* AUDIO BASE */}
      <div className="field-block" style={{ background: 'rgba(52,73,94,0.05)', padding: 12, borderRadius: 6, border: '1px solid rgba(52,73,94,0.1)', marginBottom: 20 }}>
        <label>🔊 ÁUDIO BASE (público/sempre visível)</label>
        <label className="upload-btn" style={{ cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          SELECIONAR ÁUDIO
          <input
            type="file"
            accept="audio/*"
            hidden
            onChange={onAudioBaseSelect}
            disabled={loading}
          />
        </label>
        {audioBasePreview && (
          <div style={{ marginTop: 8 }}>
            <audio controls style={{ width: '100%', borderRadius: 6 }}>
              <source src={audioBasePreview} />
            </audio>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>✅ Áudio carregado</div>
          </div>
        )}
      </div>

      {/* AUDIO HIDDEN */}
      <div className="field-block" style={{ background: 'rgba(155,89,182,0.05)', padding: 12, borderRadius: 6, border: '1px solid rgba(155,89,182,0.1)', marginBottom: 20 }}>
        <label>🔐 ÁUDIO OCULTO (espectrograma)</label>
        <label className="upload-btn" style={{ cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          SELECIONAR ÁUDIO OCULTO
          <input
            type="file"
            accept="audio/*"
            hidden
            onChange={onAudioHiddenSelect}
            disabled={loading}
          />
        </label>
        {audioHiddenPreview && (
          <div style={{ marginTop: 8 }}>
            <audio controls style={{ width: '100%', borderRadius: 6 }}>
              <source src={audioHiddenPreview} />
            </audio>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>✅ Áudio oculto carregado</div>
          </div>
        )}
        <button
          onClick={() => onShowMixerChange(true)}
          disabled={loading}
          style={{
            width: '100%',
            padding: 8,
            marginTop: 8,
            background: '#9b59b6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          🎚️ ABRIR MIXER
        </button>
      </div>

      {/* VIDEO */}
      <div className="field-block" style={{ background: 'rgba(231,76,60,0.05)', padding: 12, borderRadius: 6, border: '1px solid rgba(231,76,60,0.1)', marginBottom: 20 }}>
        <label>🎥 VÍDEO</label>
        
        {/* URL Input */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>
            URL do Vídeo (YouTube, Vimeo, etc)
          </label>
          <input
            type="text"
            value={videoUrlInput}
            onChange={(e) => onVideoUrlInputChange(e.target.value)}
            disabled={loading}
            placeholder="https://..."
            style={{
              width: '100%',
              padding: 8,
              background: '#1a1a1a',
              border: '1px solid #444',
              color: '#fff',
              borderRadius: 6,
              fontSize: 12,
            }}
          />
        </div>

        {/* File Upload */}
        <label className="upload-btn" style={{ cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          FAZER UPLOAD DE VÍDEO
          <input
            type="file"
            accept="video/*"
            hidden
            onChange={onVideoSelect}
            disabled={loading}
          />
        </label>

        {videoPreviewUrl && (
          <div style={{ marginTop: 8 }}>
            <video controls style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 6 }}>
              <source src={videoPreviewUrl} />
            </video>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>✅ Vídeo carregado</div>
          </div>
        )}

        {videoUploading && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#aaa' }}>
            Upload em progresso... {uploadProgress['video']}%
          </div>
        )}
      </div>
    </div>
  );
}
