import React, { useRef } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Info, Image as ImageIcon } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabVisual() {
  const { mediaState, setMediaState } = useClueModal();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaState(s => ({ ...s, imgFile: file, previewUrl: url }));
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
      <p style={{ fontSize: 13, color: 'var(--cc-text-muted)' }}>
        (Upload de imagem UV e configurações)
      </p>
    </div>
  );
}
