import React, { useRef } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Info, Image as ImageIcon } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabVisual() {
  const { mediaState, setMediaState, setEditorState } = useClueModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uvInputRef = useRef<HTMLInputElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaState(s => ({ ...s, imgFile: file, previewUrl: url }));
    }
  };

  const handleUvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
       setMediaState(s => ({ ...s, uvFile: file }));
       setEditorState(s => ({ ...s, editorMode: 'uv' }));
    }
  };

  const handleFilterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
       setEditorState(s => ({ ...s, editorMode: 'filter', filterInitialImage: file }));
    }
  };

  return (
    <div className="cc-tab-content">
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          IMAGEM BASE
          <span data-tooltip-id="base-image-tip" style={{ cursor: 'help' }}>
            <Info size={16} color="var(--nexus-text-muted, #666)" />
          </span>
        </h3>
        <Tooltip id="base-image-tip" className="cyber-tooltip">
          A imagem principal exibida ao clicar na pista. Ela será carregada no visualizador da Lousa.
        </Tooltip>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={handleImageSelect}
        />
        <button
          className="cc-btn cc-btn-save"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={16} /> Selecionar Imagem Base
        </button>
      </div>

      {mediaState.previewUrl && (
        <div className="cc-media-grid">
          <img src={mediaState.previewUrl} alt="Base" />
        </div>
      )}

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Modo Fake Phone
          <span data-tooltip-id="fake-phone-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="var(--nexus-neon, #00ffff)" />
          </span>
        </h3>
        <Tooltip id="fake-phone-tip" className="cyber-tooltip">
          <span className="cyber-tooltip-title">[ PROTOCOLO FAKE PHONE ]</span>
          Oculta a barra de status e o fundo da janela, exibindo o conteúdo da imagem como se fosse um aplicativo de celular nativo.
        </Tooltip>
      </div>
      <p style={{ fontSize: 13, color: 'var(--cc-text-muted)' }}>
        (Configuração do PhoneViewer)
      </p>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Camada UV / Luz Negra
          <span data-tooltip-id="uv-light-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="var(--nexus-neon, #00ffff)" />
          </span>
        </h3>
        <Tooltip id="uv-light-tip" className="cyber-tooltip">
          <span className="cyber-tooltip-title">[ LUZ NEGRA ]</span>
          Permite revelar uma camada oculta ao arrastar o mouse/dedo sobre a imagem, simulando uma lanterna de luz negra.
        </Tooltip>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <input
          type="file"
          accept="image/*"
          hidden
          ref={uvInputRef}
          onChange={handleUvSelect}
        />
        <button
          className={mediaState.uvPreviewUrl ? "cc-btn cc-btn-save" : "cc-btn cc-btn-cancel"}
          style={{ width: '100%', justifyContent: 'center', opacity: mediaState.previewUrl ? 1 : 0.5 }}
          disabled={!mediaState.previewUrl}
          onClick={() => {
            if (mediaState.uvPreviewUrl) {
               setEditorState(s => ({ ...s, editorMode: 'uv' }));
            } else {
               uvInputRef.current?.click();
            }
          }}
        >
          <ImageIcon size={16} /> {mediaState.uvPreviewUrl ? 'Editar Camada UV' : 'Selecionar Camada UV (Oculta)'}
        </button>
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Camada Forense (Filtros RGB)
        </h3>
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: '10px' }}>
        <input
          type="file"
          accept="image/*"
          hidden
          ref={filterInputRef}
          onChange={handleFilterSelect}
        />
        <button
          className="cc-btn cc-btn-cancel"
          style={{ flex: 1, justifyContent: 'center', opacity: mediaState.previewUrl ? 1 : 0.5 }}
          disabled={!mediaState.previewUrl}
          onClick={() => filterInputRef.current?.click()}
        >
          <ImageIcon size={16} /> Aplicar Filtro de Overlay
        </button>
        <button
          className="cc-btn cc-btn-cancel"
          style={{ flex: 1, justifyContent: 'center', opacity: mediaState.previewUrl ? 1 : 0.5 }}
          disabled={!mediaState.previewUrl}
          onClick={() => setEditorState(s => ({ ...s, showForensicEditor: true }))}
        >
          <ImageIcon size={16} /> Steganografia RGB (Forense)
        </button>
      </div>
    </div>
  );
}
