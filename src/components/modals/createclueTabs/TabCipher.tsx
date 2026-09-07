import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { ShieldAlert, Info } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabCipher() {
  const { cipherState, setCipherState } = useClueModal();

  return (
    <div className="field-block">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className="field-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          SHREDDER & CIFRA
          <span data-tooltip-id="cipher-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="#00ffff" />
          </span>
        </span>
        <label className="cc-checkbox">
          <input
            type="checkbox"
            checked={cipherState.isShredded}
            onChange={(e) => setCipherState(s => ({ ...s, isShredded: e.target.checked }))}
          />
          <span className="checkmark"></span>
          Ativar Shredder
        </label>
      </div>
      <Tooltip id="cipher-tip" className="cyber-tooltip">
        <span className="cyber-tooltip-title">[ CIFRA SHREDDER ]</span>
        O Shredder destrói o texto real e o divide em pedaços criptografados.
      </Tooltip>

      {cipherState.isShredded && (
        <div className="neon-warning-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#ff4444' }}>
            <ShieldAlert size={18} />
            <strong>Aviso de Destruição</strong>
          </div>
          <p style={{ fontSize: 13, color: 'var(--cc-text)' }}>
            O texto real será fragmentado. Esta ação sobrescreve a visualização padrão.
          </p>
        </div>
      )}

      {cipherState.isShredded && (
        <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="field-title">Linhas do Shredder</label>
            <input
              type="number"
              className="cc-input"
              value={cipherState.shredRows}
              onChange={(e) => setCipherState(s => ({ ...s, shredRows: parseInt(e.target.value) || 1 }))}
              min={1}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-title">Colunas do Shredder</label>
            <input
              type="number"
              className="cc-input"
              value={cipherState.shredCols}
              onChange={(e) => setCipherState(s => ({ ...s, shredCols: parseInt(e.target.value) || 1 }))}
              min={1}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <label className="field-title">Texto Real (Decifrado)</label>
        <textarea
          className="cc-input"
          style={{ minHeight: 80, resize: 'vertical' }}
          value={cipherState.realText}
          onChange={(e) => setCipherState(s => ({ ...s, realText: e.target.value }))}
          placeholder="O texto quando o puzzle é resolvido..."
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="field-title">Texto Cifrado (Inicial)</label>
        <textarea
          className="cc-input"
          style={{ minHeight: 80, resize: 'vertical' }}
          value={cipherState.cipherText}
          onChange={(e) => setCipherState(s => ({ ...s, cipherText: e.target.value }))}
          placeholder="O texto embaralhado que o usuário vê..."
        />
      </div>
      <hr className="cc-divider" style={{ margin: '30px 0' }} />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          HEX VIEWER & ENCODING
          <span data-tooltip-id="hex-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="#00ffff" />
          </span>
        </h3>
        <Tooltip id="hex-tip" className="cyber-tooltip">
          Configura o código oculto no Inspecionar Arquivo.
        </Tooltip>
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="field-title">Comentário Oculto / Código Hex</label>
        <textarea
          className="cc-input"
          style={{ minHeight: 60, resize: 'vertical' }}
          value={cipherState.hexCode}
          onChange={(e) => setCipherState(s => ({ ...s, hexCode: e.target.value }))}
          placeholder="Ex: SECTOR_7G_COMPROMISED"
        />
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label className="field-title">Método de Encoding Hex</label>
          <select
            className="cc-input"
            value={cipherState.hexEncodingMethod}
            onChange={(e) => setCipherState(s => ({ ...s, hexEncodingMethod: e.target.value as any }))}
          >
            <option value="plain">Texto Puro (Plain)</option>
            <option value="utf8hex">UTF-8 para Hex (Padrão)</option>
            <option value="xor">Cifra XOR</option>
            <option value="enigma">Cifra Enigma Simples</option>
          </select>
        </div>
        
        {cipherState.hexEncodingMethod !== 'plain' && cipherState.hexEncodingMethod !== 'utf8hex' && (
          <div style={{ flex: 1 }}>
            <label className="field-title">Chave do Encoding</label>
            <input
              type="text"
              className="cc-input"
              value={cipherState.hexEncodingKey}
              onChange={(e) => setCipherState(s => ({ ...s, hexEncodingKey: e.target.value }))}
              placeholder="Ex: 42 ou CHAVE_SECRETA"
            />
          </div>
        )}
      </div>

    </div>
  );
}
