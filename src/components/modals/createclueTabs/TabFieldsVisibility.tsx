import React from 'react';
import { Eye, Settings, Shield, Zap, Info, Layers, LayoutList } from 'lucide-react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { fieldVisibilityPresets, FieldVisibilityConfig } from '../../../config/fieldVisibilityConfig';
import { Tooltip } from 'react-tooltip';

// Detect active preset by comparing current config to each preset
function detectActivePreset(config: FieldVisibilityConfig): string | null {
  const currentStr = JSON.stringify(config);
  if (currentStr === JSON.stringify(fieldVisibilityPresets.MINIMAL)) return 'MINIMAL';
  if (currentStr === JSON.stringify(fieldVisibilityPresets.DEFAULT)) return 'DEFAULT';
  if (currentStr === JSON.stringify(fieldVisibilityPresets.FULL)) return 'FULL';
  if (currentStr === JSON.stringify(fieldVisibilityPresets.MYSTERY)) return 'MYSTERY';
  return null;
}

export default function TabFieldsVisibility() {
  const { fieldVisibilityConfig, setFieldVisibilityConfig } = useClueModal();
  const activePreset = detectActivePreset(fieldVisibilityConfig);

  const applyPreset = (presetKey: keyof typeof fieldVisibilityPresets) => {
    setFieldVisibilityConfig(fieldVisibilityPresets[presetKey]);
  };

  const handleFilePropertiesToggle = (field: string) => {
    const isVisible = fieldVisibilityConfig.fileProperties.visibleFields.includes(field as any);
    const newFields = isVisible
      ? fieldVisibilityConfig.fileProperties.visibleFields.filter(f => f !== field)
      : [...fieldVisibilityConfig.fileProperties.visibleFields, field];
      
    setFieldVisibilityConfig(prev => ({
      ...prev,
      fileProperties: { ...prev.fileProperties, visibleFields: newFields as any }
    }));
  };

  const handleGlitchPuzzleToggle = (field: string) => {
    const isVisible = fieldVisibilityConfig.glitchPuzzle.visibleSections.includes(field as any);
    const newFields = isVisible
      ? fieldVisibilityConfig.glitchPuzzle.visibleSections.filter(f => f !== field)
      : [...fieldVisibilityConfig.glitchPuzzle.visibleSections, field];
      
    setFieldVisibilityConfig(prev => ({
      ...prev,
      glitchPuzzle: { ...prev.glitchPuzzle, visibleSections: newFields as any }
    }));
  };

  const handleMegaClueToggle = (field: string) => {
    const isVisible = fieldVisibilityConfig.megaClue.visibleSections.includes(field as any);
    const newFields = isVisible
      ? fieldVisibilityConfig.megaClue.visibleSections.filter(f => f !== field)
      : [...fieldVisibilityConfig.megaClue.visibleSections, field];
      
    setFieldVisibilityConfig(prev => ({
      ...prev,
      megaClue: { ...prev.megaClue, visibleSections: newFields as any }
    }));
  };

  return (
    <div className="cc-tab-content">
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutList size={18} /> PRESETS RÁPIDOS
        </h3>
        <span data-tooltip-id="preset-tip" style={{ cursor: 'help', marginLeft: '10px' }}>
          [ ? ]
        </span>
        <Tooltip id="preset-tip" className="cyber-tooltip">
          Escolha um conjunto rápido de visibilidade ou ative/desative manualmente abaixo.
        </Tooltip>
      </div>
      <div className="cc-preset-buttons-grid">
        <button 
          className={`cc-preset-btn ${activePreset === 'MINIMAL' ? 'active' : ''}`}
          onClick={() => applyPreset('MINIMAL')}
        >
          <Shield size={16} /> MINIMAL
        </button>
        <button 
          className={`cc-preset-btn ${activePreset === 'DEFAULT' ? 'active' : ''}`}
          onClick={() => applyPreset('DEFAULT')}
        >
          <Settings size={16} /> DEFAULT
        </button>
        <button 
          className={`cc-preset-btn ${activePreset === 'FULL' ? 'active' : ''}`}
          onClick={() => applyPreset('FULL')}
        >
          <Eye size={16} /> FULL
        </button>
        <button 
          className={`cc-preset-btn ${activePreset === 'MYSTERY' ? 'active' : ''}`}
          onClick={() => applyPreset('MYSTERY')}
        >
          <Zap size={16} /> MYSTERY
        </button>
      </div>
      {!activePreset && <div className="cc-cyber-note" style={{marginTop: '0.5rem', marginBottom: '1rem'}}>Status: Custom configuration</div>}
      
      <div className="cc-section-header" style={{marginTop: '1.5rem'}}>
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} /> DADOS NO INSPECIONAR ARQUIVO
        </h3>
      </div>
      <div className="cc-checkbox-group">
        {[
          { id: 'fileType', label: 'Tipo de Arquivo (MIME)' },
          { id: 'size', label: 'Tamanho (KB/MB)' },
          { id: 'cameraModel', label: 'Modelo da Câmera (EXIF)' },
          { id: 'dateCreated', label: 'Data de Criação' },
          { id: 'gpsCoords', label: 'Coordenadas GPS' },
          { id: 'ownerName', label: 'Nome do Proprietário' },
          { id: 'hexComment', label: 'Comentário Oculto (Hex)' },
          { id: 'technicalNote', label: 'Nota Técnica do Sistema' }
        ].map(field => (
          <label key={field.id} className="cc-checkbox">
            <input 
              type="checkbox" 
              checked={fieldVisibilityConfig.fileProperties.visibleFields.includes(field.id as any)}
              onChange={() => handleFilePropertiesToggle(field.id)}
            />
            <span className="cc-checkbox-label">{field.label}</span>
          </label>
        ))}
      </div>

      <div className="cc-section-header" style={{marginTop: '1.5rem'}}>
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} /> INTERFACE DO GLITCH PUZZLE
        </h3>
      </div>
      <div className="cc-checkbox-group">
        {[
          { id: 'accessInstructions', label: 'Instruções de Acesso' },
          { id: 'hint', label: 'Dica do Puzzle' },
          { id: 'calibrationControls', label: 'Controles de Calibração (Barras)' },
          { id: 'logs', label: 'Terminal de Logs (Feedback)' },
          { id: 'rewardCode', label: 'Código de Recompensa Final' },
          { id: 'correctAnswerWhenSolved', label: 'Sinal de "RESOLVIDO"' }
        ].map(field => (
          <label key={field.id} className="cc-checkbox">
            <input 
              type="checkbox" 
              checked={fieldVisibilityConfig.glitchPuzzle.visibleSections.includes(field.id as any)}
              onChange={() => handleGlitchPuzzleToggle(field.id)}
            />
            <span className="cc-checkbox-label">{field.label}</span>
          </label>
        ))}
      </div>

      <div className="cc-section-header" style={{marginTop: '1.5rem'}}>
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} /> INTERFACE DA MEGA CLUE
        </h3>
      </div>
      <div className="cc-checkbox-group">
        {[
          { id: 'hints', label: 'Dicas Secundárias' },
          { id: 'progress', label: 'Barra de Progresso Global' },
          { id: 'answer', label: 'Campo da Resposta Final' },
          { id: 'requiredPuzzles', label: 'Lista de Pistas Necessárias' }
        ].map(field => (
          <label key={field.id} className="cc-checkbox">
            <input 
              type="checkbox" 
              checked={fieldVisibilityConfig.megaClue.visibleSections.includes(field.id as any)}
              onChange={() => handleMegaClueToggle(field.id)}
            />
            <span className="cc-checkbox-label">{field.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
