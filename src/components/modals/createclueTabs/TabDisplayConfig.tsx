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
    <div className="ccm-tab-stack">
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Monitor size={17} /> COMPORTAMENTO DE MÍDIA
          </h3>
        </div>

        <div className="ccm-grid-3">
          <div className="ccm-field">
            <label className="ccm-label">
              <span className="ccm-label-inline">
                Áudio Base
                <span data-tooltip-id="audio-base-tip" className="ccm-help-icon"><Info size={13} /></span>
              </span>
            </label>
            <Tooltip id="audio-base-tip" className="cyber-tooltip ccm-tooltip">
              Quando o áudio principal (fundo) será tocado na lousa.
            </Tooltip>
            <select
              className="ccm-input"
              value={mediaVisibility.audioBase}
              onChange={(e) => handleMediaVisibilityChange('audioBase', e.target.value)}
            >
              <option value="always">Tocar Sempre (Visível imediatamente)</option>
              <option value="glitch_only">Apenas durante o Glitch</option>
              <option value="post_solve">Apenas após Resolver a pista</option>
            </select>
          </div>

          <div className="ccm-field">
            <label className="ccm-label">
              <span className="ccm-label-inline">
                Áudio Escondido
                <span data-tooltip-id="audio-hidden-tip" className="ccm-help-icon"><Info size={13} /></span>
              </span>
            </label>
            <Tooltip id="audio-hidden-tip" className="cyber-tooltip ccm-tooltip">
              Quando a faixa de áudio secreta será liberada.
            </Tooltip>
            <select
              className="ccm-input"
              value={mediaVisibility.audioHidden}
              onChange={(e) => handleMediaVisibilityChange('audioHidden', e.target.value)}
            >
              <option value="post_solve">Liberar após Resolver</option>
              <option value="post_keyword">Liberar com Palavra-Chave</option>
              <option value="always">Liberar Sempre</option>
            </select>
          </div>

          <div className="ccm-field">
            <label className="ccm-label">
              <span className="ccm-label-inline">
                Camada UV (Luz Negra)
                <span data-tooltip-id="uv-layer-tip" className="ccm-help-icon"><Info size={13} /></span>
              </span>
            </label>
            <Tooltip id="uv-layer-tip" className="cyber-tooltip ccm-tooltip">
              Quando a lanterna UV ficará disponível para raspar a imagem.
            </Tooltip>
            <select
              className="ccm-input"
              value={mediaVisibility.uvLayer}
              onChange={(e) => handleMediaVisibilityChange('uvLayer', e.target.value)}
            >
              <option value="post_keyword">Após Palavra-Chave</option>
              <option value="always">Sempre Disponível</option>
              <option value="post_solve">Apenas após Resolver</option>
            </select>
          </div>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Cpu size={17} /> 1. GLITCH PUZZLE
          </h3>
        </div>
        <div className="ccm-checkbox-grid">
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Mostrar "COMO ACESSAR" (Instruções)</span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.puzzle.showAccessInstructions} onChange={() => handlePuzzleToggle('showAccessInstructions')} />
          </label>
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Mostrar Dica</span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.puzzle.showHint} onChange={() => handlePuzzleToggle('showHint')} />
          </label>
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className={`ccm-toggle-title ${displayConfig.puzzle.showCorrectAnswerWhenSolved ? 'is-warn' : ''}`}>
                <AlertTriangle size={14} /> Mostrar parâmetros corretos (Spoiler)
              </span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.puzzle.showCorrectAnswerWhenSolved} onChange={() => handlePuzzleToggle('showCorrectAnswerWhenSolved')} />
          </label>
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Mostrar Código de Recompensa</span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.puzzle.showRewardCode} onChange={() => handlePuzzleToggle('showRewardCode')} />
          </label>
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Mostrar Terminal de Logs</span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.puzzle.showLogs} onChange={() => handlePuzzleToggle('showLogs')} />
          </label>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <FileText size={17} /> 2. PROPRIEDADES DO ARQUIVO (EXIF)
          </h3>
        </div>
        <div className="ccm-checkbox-grid">
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
            <label key={item.key} className="ccm-toggle-row">
              <span className="ccm-toggle-text">
                <span className="ccm-toggle-title">{item.label}</span>
              </span>
              <input
                type="checkbox"
                className="ccm-checkbox-input"
                checked={displayConfig.fileProperties[item.key as keyof typeof displayConfig.fileProperties]}
                onChange={() => handleFilePropsToggle(item.key as keyof typeof displayConfig.fileProperties)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Film size={17} /> 3. VISUAL & MÍDIA NA INSPEÇÃO
          </h3>
        </div>
        <div className="ccm-checkbox-grid">
          {[
            { key: 'showThermalData', label: 'Mostrar Dados Térmicos' },
            { key: 'showUVLayer', label: 'Mostrar Camada UV' },
            { key: 'showFilterOverlay', label: 'Mostrar Overlay de Filtro' },
            { key: 'showVideoPlayer', label: 'Mostrar Player de Vídeo' },
            { key: 'showAudioPlayer', label: 'Mostrar Player de Áudio' },
            { key: 'showHiddenAudio', label: 'Mostrar Áudio Oculto' },
            { key: 'showChatData', label: 'Mostrar Conversas de Chat' },
          ].map((item) => (
            <label key={item.key} className="ccm-toggle-row">
              <span className="ccm-toggle-text">
                <span className="ccm-toggle-title">{item.label}</span>
              </span>
              <input
                type="checkbox"
                className="ccm-checkbox-input"
                checked={displayConfig.media[item.key as keyof typeof displayConfig.media]}
                onChange={() => handleMediaDisplayToggle(item.key as keyof typeof displayConfig.media)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Eye size={17} /> 4. CIFRAS & FRAGMENTOS
          </h3>
        </div>
        <div className="ccm-checkbox-grid">
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Mostrar Imagem Picotada (Shredder)</span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.cipher.showShredded} onChange={() => handleCipherToggle('showShredded')} />
          </label>
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Mostrar Texto Criptografado</span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.cipher.showCipherText} onChange={() => handleCipherToggle('showCipherText')} />
          </label>
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className={`ccm-toggle-title ${displayConfig.cipher.showRealText ? 'is-warn' : ''}`}>
                Revelar Texto Real (Pós-Solução / Spoiler)
              </span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.cipher.showRealText} onChange={() => handleCipherToggle('showRealText')} />
          </label>
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Mostrar Configuração do Shredder</span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.cipher.showShredConfig} onChange={() => handleCipherToggle('showShredConfig')} />
          </label>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">5. MEGA-PISTA FINAL</h3>
        </div>
        <div className="ccm-checkbox-grid">
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Mostrar Dicas da Mega Clue</span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.megaClue.showHints} onChange={() => handleMegaClueToggle('showHints')} />
          </label>
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className={`ccm-toggle-title ${displayConfig.megaClue.showAnswer ? 'is-warn' : ''}`}>
                Mostrar Resposta Final (Spoiler)
              </span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.megaClue.showAnswer} onChange={() => handleMegaClueToggle('showAnswer')} />
          </label>
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Exibir Barra de Progresso (Checklist)</span>
            </span>
            <input type="checkbox" className="ccm-checkbox-input" checked={displayConfig.megaClue.showProgress} onChange={() => handleMegaClueToggle('showProgress')} />
          </label>
        </div>
      </section>
    </div>
  );
}
