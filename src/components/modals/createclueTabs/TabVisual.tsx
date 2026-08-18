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
    <div className="field-block">
      <span className="field-title">
        IMAGEM BASE
        <Info size={16} color="#666" style={{ marginLeft: 8 }} />
      </span>

      <div style={{ marginBottom: 16 }}>
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={handleImageSelect}
        />
        <button
          className="cc-btn cc-btn-cancel"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={16} /> Selecionar Imagem Base
        </button>
      </div>

      {mediaState.previewUrl && (
        <div style={{ padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 6, border: '1px solid var(--cc-border)' }}>
          <img src={mediaState.previewUrl} alt="Base" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }} />
        </div>
      )}

      {/* CyberTooltips e ícones de info adicionais: */}
      <div style={{ marginTop: 24 }}>
        <h4 style={{ color: 'var(--cc-text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          Modo Fake Phone
          <Info data-tooltip-id="fake-phone-tip" size={16} color="var(--cc-neon)" style={{ cursor: 'help' }} />
        </h4>
        <Tooltip id="fake-phone-tip" className="cyber-tooltip">
          <span className="cyber-tooltip-title">[ PROTOCOLO FAKE PHONE ]</span>
          Oculta a barra de status e o fundo da janela, exibindo o conteúdo da imagem como se fosse um aplicativo de celular nativo do dispositivo do jogador.
        </Tooltip>
        <p style={{ fontSize: 13, color: 'var(--cc-text-muted)' }}>
          (Configuração do PhoneViewer aqui)
        </p>
      </div>

      <div style={{ marginTop: 24 }}>
        <h4 style={{ color: 'var(--cc-text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          Camada UV / Luz Negra
          <Info data-tooltip-id="uv-light-tip" size={16} color="var(--cc-neon)" style={{ cursor: 'help' }} />
        </h4>
        <Tooltip id="uv-light-tip" className="cyber-tooltip">
          <span className="cyber-tooltip-title">[ LUZ NEGRA ]</span>
          Permite revelar uma camada oculta ao arrastar o mouse/dedo sobre a imagem, simulando uma lanterna de luz negra.
        </Tooltip>
        <p style={{ fontSize: 13, color: 'var(--cc-text-muted)' }}>
          (Upload de imagem UV e configurações aqui)
        </p>
      </div>
    </div>
  );
}
