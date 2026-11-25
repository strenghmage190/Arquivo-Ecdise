import React from 'react';
import { Eye, Settings, Shield, Zap, Layers, LayoutList, Code2, Info } from 'lucide-react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { fieldVisibilityPresets, FieldVisibilityConfig } from '../../../config/fieldVisibilityConfig';
import { Tooltip } from 'react-tooltip';

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
      ? fieldVisibilityConfig.fileProperties.visibleFields.filter((f) => f !== field)
      : [...fieldVisibilityConfig.fileProperties.visibleFields, field];

    setFieldVisibilityConfig((prev) => ({
      ...prev,
      fileProperties: { ...prev.fileProperties, visibleFields: newFields as any },
    }));
  };

  const handleGlitchPuzzleToggle = (field: string) => {
    const isVisible = fieldVisibilityConfig.glitchPuzzle.visibleSections.includes(field as any);
    const newFields = isVisible
      ? fieldVisibilityConfig.glitchPuzzle.visibleSections.filter((f) => f !== field)
      : [...fieldVisibilityConfig.glitchPuzzle.visibleSections, field];

    setFieldVisibilityConfig((prev) => ({
      ...prev,
      glitchPuzzle: { ...prev.glitchPuzzle, visibleSections: newFields as any },
    }));
  };

  const handleMegaClueToggle = (field: string) => {
    const isVisible = fieldVisibilityConfig.megaClue.visibleSections.includes(field as any);
    const newFields = isVisible
      ? fieldVisibilityConfig.megaClue.visibleSections.filter((f) => f !== field)
      : [...fieldVisibilityConfig.megaClue.visibleSections, field];

    setFieldVisibilityConfig((prev) => ({
      ...prev,
      megaClue: { ...prev.megaClue, visibleSections: newFields as any },
    }));
  };

  const customMeta = fieldVisibilityConfig.customMetadata || {
    enableCustomFields: true,
    defaultVisibleCustomFields: [],
    hiddenByDefault: [],
  };

  return (
    <div className="ccm-tab-stack">
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <LayoutList size={17} /> PRESETS RÁPIDOS
            <span data-tooltip-id="preset-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="preset-tip" className="cyber-tooltip ccm-tooltip">
            Escolha um conjunto rápido de visibilidade ou ative/desative manualmente abaixo.
          </Tooltip>
        </div>

        <div className="ccm-preset-grid">
          <button
            type="button"
            className={`ccm-preset-btn ${activePreset === 'MINIMAL' ? 'active' : ''}`}
            onClick={() => applyPreset('MINIMAL')}
          >
            <Shield size={15} /> MINIMAL
          </button>
          <button
            type="button"
            className={`ccm-preset-btn ${activePreset === 'DEFAULT' ? 'active' : ''}`}
            onClick={() => applyPreset('DEFAULT')}
          >
            <Settings size={15} /> DEFAULT
          </button>
          <button
            type="button"
            className={`ccm-preset-btn ${activePreset === 'FULL' ? 'active' : ''}`}
            onClick={() => applyPreset('FULL')}
          >
            <Eye size={15} /> FULL
          </button>
          <button
            type="button"
            className={`ccm-preset-btn ${activePreset === 'MYSTERY' ? 'active' : ''}`}
            onClick={() => applyPreset('MYSTERY')}
          >
            <Zap size={15} /> MYSTERY
          </button>
        </div>

        {!activePreset && (
          <p className="ccm-note">Status: Configuração personalizada</p>
        )}
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Layers size={17} /> DADOS NO INSPECIONAR ARQUIVO
          </h3>
        </div>
        <div className="ccm-checkbox-grid">
          {[
            { id: 'fileType', label: 'Tipo de Arquivo (MIME)' },
            { id: 'size', label: 'Tamanho (KB/MB)' },
            { id: 'cameraModel', label: 'Modelo da Câmera (EXIF)' },
            { id: 'dateCreated', label: 'Data de Criação' },
            { id: 'gpsCoords', label: 'Coordenadas GPS' },
            { id: 'ownerName', label: 'Nome do Proprietário' },
            { id: 'hexComment', label: 'Comentário Oculto (Hex)' },
            { id: 'technicalNote', label: 'Nota Técnica do Sistema' },
          ].map((field) => (
            <label key={field.id} className="ccm-toggle-row">
              <span className="ccm-toggle-text">
                <span className="ccm-toggle-title">{field.label}</span>
              </span>
              <input
                type="checkbox"
                className="ccm-checkbox-input"
                checked={fieldVisibilityConfig.fileProperties.visibleFields.includes(field.id as any)}
                onChange={() => handleFilePropertiesToggle(field.id)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Zap size={17} /> INTERFACE DO GLITCH PUZZLE
          </h3>
        </div>
        <div className="ccm-checkbox-grid">
          {[
            { id: 'accessInstructions', label: 'Instruções de Acesso' },
            { id: 'hint', label: 'Dica do Puzzle' },
            { id: 'calibrationControls', label: 'Controles de Calibração (Barras)' },
            { id: 'logs', label: 'Terminal de Logs (Feedback)' },
            { id: 'rewardCode', label: 'Código de Recompensa Final' },
            { id: 'correctAnswerWhenSolved', label: 'Sinal de "RESOLVIDO"' },
          ].map((field) => (
            <label key={field.id} className="ccm-toggle-row">
              <span className="ccm-toggle-text">
                <span className="ccm-toggle-title">{field.label}</span>
              </span>
              <input
                type="checkbox"
                className="ccm-checkbox-input"
                checked={fieldVisibilityConfig.glitchPuzzle.visibleSections.includes(field.id as any)}
                onChange={() => handleGlitchPuzzleToggle(field.id)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Shield size={17} /> INTERFACE DA MEGA CLUE
          </h3>
        </div>
        <div className="ccm-checkbox-grid">
          {[
            { id: 'hints', label: 'Dicas Secundárias' },
            { id: 'progress', label: 'Barra de Progresso Global' },
            { id: 'answer', label: 'Campo da Resposta Final' },
            { id: 'requiredPuzzles', label: 'Lista de Pistas Necessárias' },
          ].map((field) => (
            <label key={field.id} className="ccm-toggle-row">
              <span className="ccm-toggle-text">
                <span className="ccm-toggle-title">{field.label}</span>
              </span>
              <input
                type="checkbox"
                className="ccm-checkbox-input"
                checked={fieldVisibilityConfig.megaClue.visibleSections.includes(field.id as any)}
                onChange={() => handleMegaClueToggle(field.id)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Code2 size={17} /> METADADOS CUSTOMIZADOS (JSON)
          </h3>
        </div>

        <label className="ccm-toggle-row">
          <span className="ccm-toggle-text">
            <span className="ccm-toggle-title">Habilitar exibição de campos JSON customizados</span>
          </span>
          <input
            type="checkbox"
            className="ccm-checkbox-input"
            checked={customMeta.enableCustomFields}
            onChange={(e) =>
              setFieldVisibilityConfig((prev) => ({
                ...prev,
                customMetadata: {
                  ...customMeta,
                  enableCustomFields: e.target.checked,
                },
              }))
            }
          />
        </label>

        <div className="ccm-grid-2">
          <div className="ccm-field">
            <label className="ccm-label">Campos Visíveis por Padrão (vírgula)</label>
            <input
              type="text"
              className="ccm-input"
              value={(customMeta.defaultVisibleCustomFields || []).join(', ')}
              onChange={(e) =>
                setFieldVisibilityConfig((prev) => ({
                  ...prev,
                  customMetadata: {
                    ...customMeta,
                    defaultVisibleCustomFields: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                }))
              }
              placeholder="Ex: audio_config, thermal_keyword"
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Campos Ocultos por Padrão (vírgula)</label>
            <input
              type="text"
              className="ccm-input"
              value={(customMeta.hiddenByDefault || []).join(', ')}
              onChange={(e) =>
                setFieldVisibilityConfig((prev) => ({
                  ...prev,
                  customMetadata: {
                    ...customMeta,
                    hiddenByDefault: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                }))
              }
              placeholder="Ex: internal_id, admin_notes"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
