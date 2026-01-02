import React, { useState } from 'react';
import { DisplayConfig, useDisplayConfig, saveDisplayConfig } from '../../config/displayConfig';
import './DisplayConfigPanel.css';

interface Props {
  onClose?: () => void;
}

export default function DisplayConfigPanel({ onClose }: Props) {
  const [config, setConfig] = useState<DisplayConfig>(useDisplayConfig());
  const [savedMessage, setSavedMessage] = useState('');

  const handleToggle = (section: keyof DisplayConfig, key: string) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key as keyof DisplayConfig[keyof DisplayConfig]]
      }
    }));
  };

  const handleSave = () => {
    saveDisplayConfig(config);
    setSavedMessage('✅ Config salva!');
    setTimeout(() => setSavedMessage(''), 2000);
  };

  const handleReset = () => {
    if (confirm('Deseja resetar para as configurações padrão?')) {
      const defaultConfig: DisplayConfig = {
        puzzle: {
          showAccessInstructions: true,
          showHint: true,
          showCorrectAnswerWhenSolved: false,
          showRewardCode: true,
          showLogs: true,
        },
        fileProperties: {
          showFileType: true,
          showSize: true,
          showCameraModel: true,
          showDate: true,
          showGPS: true,
          showOwner: true,
          showHexComment: false,
          showStamp: true,
          showExternalLink: true,
          showLockStatus: true,
          showPersonInfo: true,
        },
        media: {
          showThermalData: false,
          showUVLayer: false,
          showFilterOverlay: true,
          showVideoPlayer: true,
          showAudioPlayer: true,
          showHiddenAudio: false,
          showChatData: true,
        },
        cipher: {
          showShredded: true,
          showCipherText: true,
          showRealText: false,
          showShredConfig: false,
        },
        megaClue: {
          showHints: true,
          showAnswer: false,
          showProgress: true,
        },
      };
      setConfig(defaultConfig);
      saveDisplayConfig(defaultConfig);
      setSavedMessage('🔄 Resetado para padrão!');
      setTimeout(() => setSavedMessage(''), 2000);
    }
  };

  return (
    <div className="display-config-panel">
      <div className="panel-header">
        <h2>⚙️ CONFIGURAÇÃO DE EXIBIÇÃO</h2>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      <div className="panel-content">
        {/* GLITCH PUZZLE */}
        <section className="config-section">
          <h3>🎮 GLITCH PUZZLE</h3>
          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.puzzle.showAccessInstructions}
                onChange={() => handleToggle('puzzle', 'showAccessInstructions')}
              />
              Mostra "COMO ACESSAR"
            </label>
            <small>Instruções para resolver o puzzle</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.puzzle.showHint}
                onChange={() => handleToggle('puzzle', 'showHint')}
              />
              Mostra DICA (💡)
            </label>
            <small>Dica para resolver o puzzle</small>
          </div>

          <div className="config-item warning">
            <label>
              <input
                type="checkbox"
                checked={config.puzzle.showCorrectAnswerWhenSolved}
                onChange={() => handleToggle('puzzle', 'showCorrectAnswerWhenSolved')}
              />
              Mostra PARÂMETROS CORRETOS ⚠️
            </label>
            <small style={{color:'#d32f2f'}}>⚠️ ATENÇÃO: Entrega a solução! Deixar DESLIGADO é mais seguro.</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.puzzle.showRewardCode}
                onChange={() => handleToggle('puzzle', 'showRewardCode')}
              />
              Mostra CÓDIGO DE RECOMPENSA
            </label>
            <small>Código que você ganha ao resolver</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.puzzle.showLogs}
                onChange={() => handleToggle('puzzle', 'showLogs')}
              />
              Mostra LOGS/TERMINAL
            </label>
            <small>Log de recuperação do decodificador</small>
          </div>
        </section>

        {/* FILE PROPERTIES */}
        <section className="config-section">
          <h3>📄 METADADOS DE ARQUIVO</h3>
          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.fileProperties.showFileType}
                onChange={() => handleToggle('fileProperties', 'showFileType')}
              />
              Tipo de arquivo
            </label>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.fileProperties.showSize}
                onChange={() => handleToggle('fileProperties', 'showSize')}
              />
              Tamanho
            </label>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.fileProperties.showCameraModel}
                onChange={() => handleToggle('fileProperties', 'showCameraModel')}
              />
              Câmera
            </label>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.fileProperties.showDate}
                onChange={() => handleToggle('fileProperties', 'showDate')}
              />
              Data
            </label>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.fileProperties.showGPS}
                onChange={() => handleToggle('fileProperties', 'showGPS')}
              />
              Coordenadas GPS
            </label>
            <small>Localização da foto</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.fileProperties.showOwner}
                onChange={() => handleToggle('fileProperties', 'showOwner')}
              />
              Dono/Owner
            </label>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.fileProperties.showHexComment}
                onChange={() => handleToggle('fileProperties', 'showHexComment')}
              />
              Metadados HEX / Nota Técnica
            </label>
            <small>Informações técnicas/hexadecimais</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.fileProperties.showStamp}
                onChange={() => handleToggle('fileProperties', 'showStamp')}
              />
              Carimbo (Stamp)
            </label>
            <small>Carimbo oficial no documento</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.fileProperties.showExternalLink}
                onChange={() => handleToggle('fileProperties', 'showExternalLink')}
              />
              Link Externo
            </label>
            <small>Link para recurso externo</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.fileProperties.showLockStatus}
                onChange={() => handleToggle('fileProperties', 'showLockStatus')}
              />
              Status de Bloqueio
            </label>
            <small>Se o documento está trancado</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.fileProperties.showPersonInfo}
                onChange={() => handleToggle('fileProperties', 'showPersonInfo')}
              />
              Informações de Pessoa (Dossiê)
            </label>
            <small>Nome, nascimento, status, ocupação</small>
          </div>
        </section>

        {/* VISUAL & MEDIA */}
        <section className="config-section">
          <h3>🎨 VISUAL & MÍDIA</h3>
          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.media.showThermalData}
                onChange={() => handleToggle('media', 'showThermalData')}
              />
              Dados Térmicos
            </label>
            <small>Camada térmica oculta</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.media.showUVLayer}
                onChange={() => handleToggle('media', 'showUVLayer')}
              />
              Camada UV (Ultravioleta)
            </label>
            <small>Camada ultravioleta oculta</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.media.showFilterOverlay}
                onChange={() => handleToggle('media', 'showFilterOverlay')}
              />
              Overlay de Filtro
            </label>
            <small>Camada de filtro reveladora</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.media.showVideoPlayer}
                onChange={() => handleToggle('media', 'showVideoPlayer')}
              />
              Player de Vídeo
            </label>
            <small>Exibir vídeos incorporados</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.media.showAudioPlayer}
                onChange={() => handleToggle('media', 'showAudioPlayer')}
              />
              Player de Áudio
            </label>
            <small>Exibir players de áudio</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.media.showHiddenAudio}
                onChange={() => handleToggle('media', 'showHiddenAudio')}
              />
              Áudio Oculto (após resolver)
            </label>
            <small>Áudio que aparece após resolução</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.media.showChatData}
                onChange={() => handleToggle('media', 'showChatData')}
              />
              Conversas de Chat
            </label>
            <small>Mensagens de telefone/chat</small>
          </div>
        </section>

        {/* CIPHER & SHREDDED */}
        <section className="config-section">
          <h3>🔐 CIFRAS & FRAGMENTOS</h3>
          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.cipher.showShredded}
                onChange={() => handleToggle('cipher', 'showShredded')}
              />
              Documentos Fragmentados
            </label>
            <small>Mostra documentos cortados/fragmentados</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.cipher.showCipherText}
                onChange={() => handleToggle('cipher', 'showCipherText')}
              />
              Texto Cifrado
            </label>
            <small>Mostra textos codificados</small>
          </div>

          <div className="config-item warning">
            <label>
              <input
                type="checkbox"
                checked={config.cipher.showRealText}
                onChange={() => handleToggle('cipher', 'showRealText')}
              />
              Texto Real (Decifrado) ⚠️
            </label>
            <small style={{color:'#d32f2f'}}>⚠️ CUIDADO: Mostra o texto verdadeiro!</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.cipher.showShredConfig}
                onChange={() => handleToggle('cipher', 'showShredConfig')}
              />
              Configuração de Fragmentação
            </label>
            <small>Linhas/colunas da fragmentação</small>
          </div>
        </section>

        {/* MEGA CLUE */}
        <section className="config-section">
          <h3>🔮 MEGA-PISTA</h3>
          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.megaClue.showHints}
                onChange={() => handleToggle('megaClue', 'showHints')}
              />
              Mostra DICAS
            </label>
          </div>

          <div className="config-item warning">
            <label>
              <input
                type="checkbox"
                checked={config.megaClue.showAnswer}
                onChange={() => handleToggle('megaClue', 'showAnswer')}
              />
              Mostra RESPOSTA ⚠️
            </label>
            <small style={{color:'#d32f2f'}}>⚠️ ATENÇÃO: Entrega o segredo final!</small>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.megaClue.showProgress}
                onChange={() => handleToggle('megaClue', 'showProgress')}
              />
              Mostra PROGRESSO
            </label>
            <small>Quantas pistas você já resolveu</small>
          </div>
        </section>
      </div>

      <div className="panel-footer">
        {savedMessage && <div className="saved-message">{savedMessage}</div>}
        <div className="button-group">
          <button className="btn btn-reset" onClick={handleReset}>
            🔄 RESETAR PADRÃO
          </button>
          <button className="btn btn-save" onClick={handleSave}>
            💾 SALVAR CONFIGURAÇÃO
          </button>
        </div>
      </div>
    </div>
  );
}
