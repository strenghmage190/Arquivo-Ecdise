import React from 'react';
import { Eye, Settings, Shield, Zap } from 'lucide-react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { fieldVisibilityPresets, FieldVisibilityConfig } from '../../../config/fieldVisibilityConfig';

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
        <h3 className="cc-section-title">PRESETS DE VISIBILIDADE</h3>
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
        <h3 className="cc-section-title">FILE PROPERTIES</h3>
      </div>
      <div className="cc-checkbox-group">
        {['fileType', 'size', 'cameraModel', 'dateCreated', 'gpsCoords', 'ownerName', 'hexComment', 'technicalNote'].map(field => (
          <label key={field} className="cc-checkbox">
            <input 
              type="checkbox" 
              checked={fieldVisibilityConfig.fileProperties.visibleFields.includes(field as any)}
              onChange={() => handleFilePropertiesToggle(field)}
            />
            <span className="cc-checkbox-label">{field}</span>
          </label>
        ))}
      </div>

      <div className="cc-section-header" style={{marginTop: '1.5rem'}}>
        <h3 className="cc-section-title">GLITCH PUZZLE</h3>
      </div>
      <div className="cc-checkbox-group">
        {['accessInstructions', 'hint', 'calibrationControls', 'logs', 'rewardCode', 'correctAnswerWhenSolved'].map(field => (
          <label key={field} className="cc-checkbox">
            <input 
              type="checkbox" 
              checked={fieldVisibilityConfig.glitchPuzzle.visibleSections.includes(field as any)}
              onChange={() => handleGlitchPuzzleToggle(field)}
            />
            <span className="cc-checkbox-label">{field}</span>
          </label>
        ))}
      </div>

      <div className="cc-section-header" style={{marginTop: '1.5rem'}}>
        <h3 className="cc-section-title">MEGA CLUE</h3>
      </div>
      <div className="cc-checkbox-group">
        {['hints', 'progress', 'answer', 'requiredPuzzles'].map(field => (
          <label key={field} className="cc-checkbox">
            <input 
              type="checkbox" 
              checked={fieldVisibilityConfig.megaClue.visibleSections.includes(field as any)}
              onChange={() => handleMegaClueToggle(field)}
            />
            <span className="cc-checkbox-label">{field}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
