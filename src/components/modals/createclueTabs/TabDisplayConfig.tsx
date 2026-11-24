import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Info, Monitor, Eye, Cpu, FileText, Film, AlertTriangle } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabDisplayConfig() {
  const { displayConfig, setDisplayConfig, mediaVisibility, setMediaVisibility } = useClueModal();

  const handleMediaVisibilityChange = (field: keyof typeof mediaVisibility, value: string) => {
    setMediaVisibility((prev) => ({ ...prev, [field]: value }));
  };

  const handlePuzzleToggle = (field: keyof typeof displayConfig.puzzle) => {
    setDisplayConfig((prev) => ({
      ...prev,
      puzzle: { ...prev.puzzle, [field]: !prev.puzzle[field] },
    }));
  };

  const handleFilePropsToggle = (field: keyof typeof displayConfig.fileProperties) => {
    setDisplayConfig((prev) => ({
      ...prev,
      fileProperties: { ...prev.fileProperties, [field]: !prev.fileProperties[field] },
    }));
  };

  const handleMediaDisplayToggle = (field: keyof typeof displayConfig.media) => {
    setDisplayConfig((prev) => ({
      ...prev,
      media: { ...prev.media, [field]: !prev.media[field] },
    }));
  };

  const handleCipherToggle = (field: keyof typeof displayConfig.cipher) => {
    setDisplayConfig((prev) => ({
      ...prev,
      cipher: { ...prev.cipher, [field]: !prev.cipher[field] },
    }));
  };

  const handleMegaClueToggle = (field: keyof typeof displayConfig.megaClue) => {
    setDisplayConfig((prev) => ({
      ...prev,
      megaClue: { ...prev.megaClue, [field]: !prev.megaClue[field] },
    }));
  };

  return (
    <div className="cc-tab-content">
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Monitor size={18} /> COMPORTAMENTO DE MÍDIA
        </h3>
      </div>

      <div className="cc-field" style={{ marginTop: '0.5rem' }}>
        <label className="cc-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          Áudio Base
          <span data-tooltip-id="audio-base-tip" style={{ cursor: 'help' }}><Info size={14} color="#888" /></span>
        </label>
        <Tooltip id="audio-base-tip" className="cyber-tooltip">Quando o áudio principal (fundo) será tocado na lousa.</Tooltip>
        <select
          className="cc-input"
          value={mediaVisibility.audioBase}
          onChange={(e) => handleMediaVisibilityChange('audioBase', e.target.value)}
        >
          <option value="always">Tocar Sempre (Visível imediatamente)</option>
          <option value="glitch_only">Apenas durante o Quebra-Cabeça (Glitch)</option>
          <option value="post_solve">Apenas após Resolver a pista</option>
        </select>
      </div>

      <div className="cc-field">
        <label className="cc-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          Áudio Escondido (Oculto)
          <span data-tooltip-id="audio-hidden-tip" style={{ cursor: 'help' }}><Info size={14} color="#888" /></span>
        </label>
        <Tooltip id="audio-hidden-tip" className="cyber-tooltip">Quando a faixa de áudio secreta será liberada.</Tooltip>
        <select
          className="cc-input"
          value={mediaVisibility.audioHidden}
          onChange={(e) => handleMediaVisibilityChange('audioHidden', e.target.value)}
        >
          <option value="post_solve">Liberar após Resolver a pista</option>
          <option value="post_keyword">Liberar usando Palavra-Chave (Keyword)</option>
          <option value="always">Liberar Sempre</option>
        </select>
      </div>

      <div className="cc-field">
        <label className="cc-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          Camada UV (Luz Negra)
          <span data-tooltip-id="uv-layer-tip" style={{ cursor: 'help' }}><Info size={14} color="#888" /></span>
        </label>
        <Tooltip id="uv-layer-tip" className="cyber-tooltip">Quando a lanterna UV ficará disponível para raspar a imagem.</Tooltip>
        <select
          className="cc-input"
          value={mediaVisibility.uvLayer}
          onChange={(e) => handleMediaVisibilityChange('uvLayer', e.target.value)}
        >
          <option value="post_keyword">Após usar Palavra-Chave (Keyword)</option>
          <option value="always">Sempre Disponível</option>
          <option value="post_solve">Apenas após Resolver</option>
        </select>
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} /> 1. GLITCH PUZZLE
        </h3>
      </div>
      <div className="cc-checkbox-group">
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.puzzle.showAccessInstructions} onChange={() => handlePuzzleToggle('showAccessInstructions')} />
          <span className="cc-checkbox-label">Mostrar "COMO ACESSAR" (Instruções)</span>
        </label>
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.puzzle.showHint} onChange={() => handlePuzzleToggle('showHint')} />
          <span className="cc-checkbox-label">Mostrar Dica</span>
        </label>
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.puzzle.showCorrectAnswerWhenSolved} onChange={() => handlePuzzleToggle('showCorrectAnswerWhenSolved')} />
          <span className="cc-checkbox-label" style={{ color: displayConfig.puzzle.showCorrectAnswerWhenSolved ? '#ffaa00' : undefined }}>
            <AlertTriangle size={13} style={{ display: 'inline', marginRight: 4 }} />
            Mostrar parâmetros corretos quando resolvido (Spoiler)
          </span>
        </label>
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.puzzle.showRewardCode} onChange={() => handlePuzzleToggle('showRewardCode')} />
          <span className="cc-checkbox-label">Mostrar Código de Recompensa</span>
        </label>
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.puzzle.showLogs} onChange={() => handlePuzzleToggle('showLogs')} />
          <span className="cc-checkbox-label">Mostrar Terminal de Logs</span>
        </label>
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} /> 2. PROPRIEDADES DO ARQUIVO (EXIF)
        </h3>
      </div>
      <div className="cc-checkbox-group">
        {[
          { key: 'showFileType', label: 'Mostrar Tipo de Arquivo' },
          { key: 'showSize', label: 'Mostrar Tamanho' },
          { key: 'showCameraModel', label: 'Mostrar Câmera' },
          { key: 'showDate', label: 'Mostrar Data' },
          { key: 'showGPS', label: 'Mostrar Coordenadas GPS' },
          { key: 'showOwner', label: 'Mostrar Proprietário' },
          { key: 'showHexComment', label: 'Mostrar Comentário Hex / Nota Técnica' },
          { key: 'showStamp', label: 'Mostrar Carimbo (Stamp)' },
          { key: 'showExternalLink', label: 'Mostrar Link Externo' },
          { key: 'showLockStatus', label: 'Mostrar Status de Bloqueio' },
          { key: 'showPersonInfo', label: 'Mostrar Dossiê de Pessoa' },
        ].map((item) => (
          <label key={item.key} className="cc-checkbox">
            <input
              type="checkbox"
              checked={displayConfig.fileProperties[item.key as keyof typeof displayConfig.fileProperties]}
              onChange={() => handleFilePropsToggle(item.key as keyof typeof displayConfig.fileProperties)}
            />
            <span className="cc-checkbox-label">{item.label}</span>
          </label>
        ))}
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Film size={18} /> 3. VISUAL & MÍDIA NA INSPEÇÃO
        </h3>
      </div>
      <div className="cc-checkbox-group">
        {[
          { key: 'showThermalData', label: 'Mostrar Dados Térmicos' },
          { key: 'showUVLayer', label: 'Mostrar Camada UV' },
          { key: 'showFilterOverlay', label: 'Mostrar Overlay de Filtro' },
          { key: 'showVideoPlayer', label: 'Mostrar Player de Vídeo' },
          { key: 'showAudioPlayer', label: 'Mostrar Player de Áudio' },
          { key: 'showHiddenAudio', label: 'Mostrar Áudio Oculto' },
          { key: 'showChatData', label: 'Mostrar Conversas de Chat' },
        ].map((item) => (
          <label key={item.key} className="cc-checkbox">
            <input
              type="checkbox"
              checked={displayConfig.media[item.key as keyof typeof displayConfig.media]}
              onChange={() => handleMediaDisplayToggle(item.key as keyof typeof displayConfig.media)}
            />
            <span className="cc-checkbox-label">{item.label}</span>
          </label>
        ))}
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={18} /> 4. CIFRAS & FRAGMENTOS
        </h3>
      </div>
      <div className="cc-checkbox-group">
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.cipher.showShredded} onChange={() => handleCipherToggle('showShredded')} />
          <span className="cc-checkbox-label">Mostrar Imagem Picotada (Shredder)</span>
        </label>
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.cipher.showCipherText} onChange={() => handleCipherToggle('showCipherText')} />
          <span className="cc-checkbox-label">Mostrar Texto Criptografado</span>
        </label>
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.cipher.showRealText} onChange={() => handleCipherToggle('showRealText')} />
          <span className="cc-checkbox-label" style={{ color: displayConfig.cipher.showRealText ? '#ffaa00' : undefined }}>
            Revelar Texto Real (Pós-Solução / Spoiler)
          </span>
        </label>
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.cipher.showShredConfig} onChange={() => handleCipherToggle('showShredConfig')} />
          <span className="cc-checkbox-label">Mostrar Configuração do Shredder na interface</span>
        </label>
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          5. MEGA-PISTA FINAL
        </h3>
      </div>
      <div className="cc-checkbox-group">
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.megaClue.showHints} onChange={() => handleMegaClueToggle('showHints')} />
          <span className="cc-checkbox-label">Mostrar Dicas da Mega Clue</span>
        </label>
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.megaClue.showAnswer} onChange={() => handleMegaClueToggle('showAnswer')} />
          <span className="cc-checkbox-label" style={{ color: displayConfig.megaClue.showAnswer ? '#ffaa00' : undefined }}>
            Mostrar Resposta Final Imediatamente (Spoiler)
          </span>
        </label>
        <label className="cc-checkbox">
          <input type="checkbox" checked={displayConfig.megaClue.showProgress} onChange={() => handleMegaClueToggle('showProgress')} />
          <span className="cc-checkbox-label">Exibir Barra de Progresso (Checklist)</span>
        </label>
      </div>
    </div>
  );
}
