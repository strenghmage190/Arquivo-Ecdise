import React, { useState } from 'react';
import {
  FieldVisibilityConfig,
  useFieldVisibility,
  saveFieldVisibility,
  fieldVisibilityPresets,
  applyFieldVisibilityPreset
} from '../../config/fieldVisibilityConfig';
import './FieldVisibilityEditor.css';

interface Props {
  onClose?: () => void;
}

export default function FieldVisibilityEditor({ onClose }: Props) {
  const [config, setConfig] = useState<FieldVisibilityConfig>(useFieldVisibility());
  const [savedMessage, setSavedMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'puzzle' | 'mega' | 'custom'>('files');

  const toggleField = (section: keyof FieldVisibilityConfig, fieldName: string) => {
    setConfig(prev => {
      if (section === 'fileProperties') {
        const fields = prev.fileProperties.visibleFields;
        const newFields = fields.includes(fieldName as any)
          ? fields.filter(f => f !== fieldName)
          : [...fields, fieldName as any];
        return {
          ...prev,
          fileProperties: { visibleFields: newFields }
        };
      }
      if (section === 'glitchPuzzle') {
        const sections = prev.glitchPuzzle.visibleSections;
        const newSections = sections.includes(fieldName as any)
          ? sections.filter(f => f !== fieldName)
          : [...sections, fieldName as any];
        return {
          ...prev,
          glitchPuzzle: { visibleSections: newSections }
        };
      }
      if (section === 'megaClue') {
        const sections = prev.megaClue.visibleSections;
        const newSections = sections.includes(fieldName as any)
          ? sections.filter(f => f !== fieldName)
          : [...sections, fieldName as any];
        return {
          ...prev,
          megaClue: { visibleSections: newSections }
        };
      }
      if (section === 'customMetadata') {
        const fields = prev.customMetadata.defaultVisibleCustomFields;
        const newFields = fields.includes(fieldName)
          ? fields.filter(f => f !== fieldName)
          : [...fields, fieldName];
        return {
          ...prev,
          customMetadata: { ...prev.customMetadata, defaultVisibleCustomFields: newFields }
        };
      }
      return prev;
    });
  };

  const handleSave = () => {
    saveFieldVisibility(config);
    setSavedMessage('✅ Configuração salva!');
    setTimeout(() => setSavedMessage(''), 2000);
  };

  const handlePreset = (preset: 'MINIMAL' | 'DEFAULT' | 'FULL' | 'MYSTERY') => {
    const newConfig = applyFieldVisibilityPreset(preset);
    setConfig(newConfig);
    setSavedMessage(`✅ Preset "${preset}" aplicado!`);
    setTimeout(() => setSavedMessage(''), 2000);
  };

  const validateFieldVisibility = (fieldId, value) => {
    if (fieldId === 'uv_layer' && !value) {
      console.warn('A camada UV foi desativada. Certifique-se de que isso é intencional.');
    }
    if (fieldId === 'lockPassword' && !value) {
      console.warn('A senha de desbloqueio está vazia.');
    }
  };

  const handleFieldChange = (fieldId, value) => {
    validateFieldVisibility(fieldId, value);
    setConfig(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const filePropertyOptions = [
    { id: 'fileType', label: '📄 Tipo de Arquivo', description: 'Tipo do arquivo (JPEG, PNG, etc)' },
    { id: 'size', label: '📊 Tamanho', description: 'Tamanho do arquivo em bytes' },
    { id: 'cameraModel', label: '📷 Câmera', description: 'Modelo da câmera' },
    { id: 'dateCreated', label: '📅 Data', description: 'Data de criação/fake date' },
    { id: 'gpsCoords', label: '🗺️ GPS', description: 'Coordenadas de localização' },
    { id: 'ownerName', label: '👤 Dono', description: 'Quem é o proprietário' },
    { id: 'hexComment', label: '🔧 HEX Comment', description: 'Dados hexadecimais' },
    { id: 'technicalNote', label: '📝 Nota Técnica', description: 'Anotações técnicas' },
    { id: 'stamp', label: '🔖 Carimbo/Stamp', description: 'Carimbo do documento' },
    { id: 'externalLink', label: '🔗 Link Externo', description: 'Link para recurso externo' },
    { id: 'fakeLocation', label: '📍 Localização Falsa', description: 'Localização fictícia do arquivo' },
    { id: 'isLocked', label: '🔒 Bloqueado', description: 'Se o documento está trancado' },
    { id: 'lockPassword', label: '🔑 Senha de Desbloqueio', description: 'Senha necessária', onChange: (value) => handleFieldChange('lockPassword', value) },
    { id: 'isPerson', label: '👤 Dossiê de Pessoa', description: 'Se é um perfil de pessoa' },
    { id: 'personName', label: '👤 Nome da Pessoa', description: 'Nome completo' },
    { id: 'personDob', label: '🎂 Data de Nascimento', description: 'Data de nascimento' },
    { id: 'personStatus', label: '💓 Status Vital', description: 'ALIVE/DEAD/MISSING/UNKNOWN' },
    { id: 'personOccupation', label: '💼 Ocupação', description: 'Profissão/ocupação' },
  ];

  const puzzleOptions = [
    { id: 'accessInstructions', label: '▶️ Como Acessar', description: 'Instruções para resolver' },
    { id: 'hint', label: '💡 Dica', description: 'Dica para ajudar' },
    { id: 'calibrationControls', label: '⚙️ Controles', description: 'Sliders de calibração' },
    { id: 'logs', label: '📜 Logs', description: 'Terminal/logs de recuperação' },
    { id: 'rewardCode', label: '🎁 Código', description: 'Código de recompensa' },
    { id: 'correctAnswerWhenSolved', label: '⚠️ Resposta Correta', description: 'Mostra valores corretos (entrega solução!)' },
    { id: 'keyword', label: '🔑 Palavra-chave', description: 'Palavra-chave para desbloquear' },
    { id: 'focusedImage', label: '🖼️ Imagem Focada', description: 'Imagem revelada ao resolver' },
    { id: 'hiddenAudioUrl', label: '🎵 Áudio Oculto', description: 'URL de áudio secreto' },
    { id: 'hiddenVideoUrl', label: '🎬 Vídeo Oculto', description: 'URL de vídeo secreto' },
    { id: 'unlockMode', label: '🔓 Modo de Desbloqueio', description: 'code / code_plus_keyword / media' },
    { id: 'difficulty', label: '🎯 Dificuldade', description: 'easy / normal / hard / custom' },
    { id: 'toleranceSettings', label: '📏 Tolerâncias', description: 'Tolerância de freq/shift/chroma' },
    { id: 'correctParameters', label: '🎛️ Parâmetros Corretos', description: 'Valores exatos (freq/shift/chroma)' },
    { id: 'startParameters', label: '🎬 Parâmetros Iniciais', description: 'Valores iniciais do puzzle' },
  ];

  const megaClueOptions = [
    { id: 'hints', label: '💡 Dicas', description: 'Dicas da mega-pista' },
    { id: 'progress', label: '📊 Progresso', description: 'Quantas pistas foram resolvidas' },
    { id: 'answer', label: '⚠️ Resposta Final', description: 'Mostra o segredo final (cuidado!)' },
    { id: 'requiredPuzzles', label: '🔗 Puzzles Obrigatórios', description: 'Lista de puzzles que precisam resolver' },
  ];

  const customFieldOptions = [
    { id: 'audio_config', label: '🔊 Config de Áudio', description: 'Configuração de áudio/triggers' },
    { id: 'thermal_keyword', label: '🔥 Palavra-chave Térmica', description: 'Palavra-chave para dados térmicos' },
    { id: 'thermal_secret_text', label: '🔥 Texto Secreto', description: 'Texto secreto em dados térmicos' },
    { id: 'thermal_enabled', label: '🔥 Térmica Ativada', description: 'Se dados térmicos estão habilitados' },
    { id: 'thermal_font_size', label: '🔤 Tamanho da Fonte', description: 'Tamanho da fonte térmica' },
    { id: 'thermal_position_y', label: '📍 Posição Y', description: 'Posição Y dos dados térmicos' },
    { id: 'device_owner', label: '👤 Proprietário do Dispositivo', description: 'Informação do dono do dispositivo' },
    { id: 'gps_coords', label: '🗺️ Coordenadas GPS', description: 'Coordenadas de localização' },
    { id: 'filter_transform', label: '🎨 Transformação do Filtro', description: 'Posição/tamanho do overlay de filtro' },
    { id: 'filter_reveal_settings', label: '🔍 Config de Revelação', description: 'Brilho/contraste/saturação' },
    { id: 'uv_layer', label: '💡 Camada UV', description: 'Camada ultravioleta oculta', onChange: (value) => handleFieldChange('uv_layer', value) },
    { id: 'is_shredded', label: '📃 Fragmentado', description: 'Se o documento está fragmentado' },
    { id: 'shred_config', label: '✂️ Config de Fragmentação', description: 'Linhas/colunas de fragmentação' },
    { id: 'real_text', label: '📝 Texto Real', description: 'Texto verdadeiro (fragmentado)' },
    { id: 'cipher_text', label: '🔐 Texto Cifrado', description: 'Texto codificado' },
    { id: 'chat_data', label: '💬 Dados de Chat', description: 'Conversas de mensagens' },
    { id: 'chat_contact_name', label: '👤 Nome do Contato', description: 'Nome do contato no chat' },
    { id: 'video_url', label: '🎬 URL de Vídeo', description: 'Link do vídeo' },
    { id: 'media_visibility', label: '👁️ Visibilidade de Mídia', description: 'Quando áudio/vídeo aparecem' },
    { id: 'security_layer', label: '🔒 Camada de Segurança', description: 'Proteção de mídia' },
    { id: 'reveal_logic', label: '🔓 Lógica de Revelação', description: 'always_visible/aligned_only/aligned_keyword' },
    { id: 'signal_targets', label: '📡 Alvos de Sinal', description: 'visual/audio sync' },
    { id: 'audio_static_sync', label: '📻 Sincronização Estática', description: 'Sincronizar áudio com estática visual' },
    { id: 'narrative_links', label: '📖 Links Narrativos', description: 'Conexões narrativas entre elementos' },
    { id: 'hide_preview_board', label: '🙈 Ocultar Preview', description: 'Ocultar preview no board' },
    { id: 'trigger_time', label: '⏱️ Tempo de Gatilho', description: 'Tempo de ativação do trigger' },
  ];

  return (
    <div className="field-visibility-editor">
      <div className="editor-header">
        <h2>👁️ EDITOR DE CAMPOS VISÍVEIS</h2>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      <div className="editor-tabs">
        <button
          className={`tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          📄 Arquivo
        </button>
        <button
          className={`tab ${activeTab === 'puzzle' ? 'active' : ''}`}
          onClick={() => setActiveTab('puzzle')}
        >
          🎮 Puzzle
        </button>
        <button
          className={`tab ${activeTab === 'mega' ? 'active' : ''}`}
          onClick={() => setActiveTab('mega')}
        >
          🔮 Mega-Pista
        </button>
        <button
          className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          ⚡ Customizado
        </button>
      </div>

      <div className="editor-content">
        {/* PRESETS - Sempre visível */}
        <div className="presets-bar">
          <span>📌 Presets rápidos:</span>
          <button
            className="preset-btn"
            onClick={() => handlePreset('MINIMAL')}
            title="Mostra o mínimo"
          >
            🔒 Mínimo
          </button>
          <button
            className="preset-btn"
            onClick={() => handlePreset('DEFAULT')}
            title="Padrão seguro"
          >
            ✅ Padrão
          </button>
          <button
            className="preset-btn"
            onClick={() => handlePreset('FULL')}
            title="Mostra tudo (cuidado!)"
          >
            🔓 Completo
          </button>
          <button
            className="preset-btn"
            onClick={() => handlePreset('MYSTERY')}
            title="Modo misterioso"
          >
            🎭 Mistério
          </button>
        </div>

        {/* ABA: ARQUIVO */}
        {activeTab === 'files' && (
          <div className="tab-content">
            <h3>📄 CAMPOS DE ARQUIVO (FileProperties)</h3>
            <p className="tab-description">
              Escolha quais informações do arquivo aparecerão quando inspecionar um documento.
            </p>
            <div className="fields-grid">
              {filePropertyOptions.map(option => (
                <label key={option.id} className="field-checkbox">
                  <input
                    type="checkbox"
                    checked={config.fileProperties.visibleFields.includes(option.id as any)}
                    onChange={() => toggleField('fileProperties', option.id)}
                  />
                  <span className="field-label">{option.label}</span>
                  <span className="field-description">{option.description}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ABA: PUZZLE */}
        {activeTab === 'puzzle' && (
          <div className="tab-content">
            <h3>🎮 SEÇÕES DO PUZZLE (Glitch Puzzle)</h3>
            <p className="tab-description">
              Escolha quais partes do puzzle aparecem para o jogador.
            </p>
            <div className="fields-grid">
              {puzzleOptions.map(option => (
                <label
                  key={option.id}
                  className={`field-checkbox ${option.id === 'correctAnswerWhenSolved' ? 'warning' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={config.glitchPuzzle.visibleSections.includes(option.id as any)}
                    onChange={() => toggleField('glitchPuzzle', option.id)}
                  />
                  <span className="field-label">{option.label}</span>
                  <span className="field-description">{option.description}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ABA: MEGA-PISTA */}
        {activeTab === 'mega' && (
          <div className="tab-content">
            <h3>🔮 SEÇÕES DA MEGA-PISTA</h3>
            <p className="tab-description">
              Escolha quais informações aparecem na mega-pista final.
            </p>
            <div className="fields-grid">
              {megaClueOptions.map(option => (
                <label
                  key={option.id}
                  className={`field-checkbox ${option.id === 'answer' ? 'warning' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={config.megaClue.visibleSections.includes(option.id as any)}
                    onChange={() => toggleField('megaClue', option.id)}
                  />
                  <span className="field-label">{option.label}</span>
                  <span className="field-description">{option.description}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ABA: CUSTOM */}
        {activeTab === 'custom' && (
          <div className="tab-content">
            <h3>⚡ CAMPOS CUSTOMIZADOS (JSON Metadata)</h3>
            <p className="tab-description">
              Escolha quais campos do JSON de metadados aparecem por padrão.
            </p>

            <div className="custom-settings">
              <label className="toggle-setting">
                <input
                  type="checkbox"
                  checked={config.customMetadata.enableCustomFields}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    customMetadata: {
                      ...prev.customMetadata,
                      enableCustomFields: e.target.checked
                    }
                  }))}
                />
                <span>✅ Ativar campos customizados</span>
              </label>
            </div>

            {config.customMetadata.enableCustomFields && (
              <div className="fields-grid">
                {customFieldOptions.map(option => (
                  <label key={option.id} className="field-checkbox">
                    <input
                      type="checkbox"
                      checked={config.customMetadata.defaultVisibleCustomFields.includes(option.id)}
                      onChange={() => toggleField('customMetadata', option.id)}
                    />
                    <span className="field-label">{option.label}</span>
                    <span className="field-description">{option.description}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="editor-footer">
        {savedMessage && <div className="saved-message">{savedMessage}</div>}
        <div className="button-group">
          <button className="btn btn-save" onClick={handleSave}>
            💾 SALVAR CONFIGURAÇÃO
          </button>
          {onClose && (
            <button className="btn btn-close" onClick={onClose}>
              ✖ FECHAR
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
