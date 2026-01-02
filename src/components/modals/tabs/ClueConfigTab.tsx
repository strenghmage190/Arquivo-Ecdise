/**
 * 📊 ClueConfigTab.tsx
 * Tab para configurações avançadas
 * - Display Config (o que mostrar ao player)
 * - Field Visibility (visibilidade de campos)
 * - Presets rápidos
 */

import React from 'react';
import { FieldVisibilityConfig } from '../../../config/fieldVisibilityConfig';

interface DisplayConfig {
  puzzle: {
    showAccessInstructions: boolean;
    showHint: boolean;
    showCorrectAnswerWhenSolved: boolean;
    showRewardCode: boolean;
    showLogs: boolean;
  };
  fileProperties: {
    showFileType: boolean;
    showSize: boolean;
    showCameraModel: boolean;
    showDate: boolean;
    showGPS: boolean;
    showOwner: boolean;
    showHexComment: boolean;
    showStamp: boolean;
    showExternalLink: boolean;
    showLockStatus: boolean;
    showPersonInfo: boolean;
  };
  media: {
    showThermalData: boolean;
    showUVLayer: boolean;
    showFilterOverlay: boolean;
    showVideoPlayer: boolean;
    showAudioPlayer: boolean;
    showHiddenAudio: boolean;
    showChatData: boolean;
  };
  cipher: {
    showShredded: boolean;
    showCipherText: boolean;
    showRealText: boolean;
    showShredConfig: boolean;
  };
  megaClue: {
    showHints: boolean;
    showAnswer: boolean;
    showProgress: boolean;
  };
}

interface ClueConfigTabProps {
  displayConfig: DisplayConfig;
  onDisplayConfigChange: (config: DisplayConfig) => void;
  fieldVisibilityConfig: FieldVisibilityConfig;
  onFieldVisibilityConfigChange: (config: FieldVisibilityConfig) => void;
  onApplyPreset: (preset: 'MINIMAL' | 'DEFAULT' | 'FULL') => void;
  loading: boolean;
}

export default function ClueConfigTab({
  displayConfig,
  onDisplayConfigChange,
  fieldVisibilityConfig,
  onFieldVisibilityConfigChange,
  onApplyPreset,
  loading,
}: ClueConfigTabProps) {
  const handleToggleDisplayConfig = (section: string, field: string) => {
    const updated = JSON.parse(JSON.stringify(displayConfig));
    const parts = section.split('.');
    let obj: any = updated;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }
    obj[field] = !obj[field];
    onDisplayConfigChange(updated);
  };

  return (
    <div className="field-block">
      <span className="field-title">⚙️ CONFIGURAÇÃO AVANÇADA</span>

      {/* PRESETS RÁPIDOS */}
      <div style={{ marginBottom: 20 }}>
        <span className="field-title">🚀 PRESETS RÁPIDOS</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <button
            onClick={() => onApplyPreset('MINIMAL')}
            disabled={loading}
            style={{
              padding: 10,
              background: '#e74c3c',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'default' : 'pointer',
              fontSize: 11,
              fontWeight: 'bold',
            }}
          >
            🔒 MÍNIMO
          </button>
          <button
            onClick={() => onApplyPreset('DEFAULT')}
            disabled={loading}
            style={{
              padding: 10,
              background: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'default' : 'pointer',
              fontSize: 11,
              fontWeight: 'bold',
            }}
          >
            ✅ PADRÃO
          </button>
          <button
            onClick={() => onApplyPreset('FULL')}
            disabled={loading}
            style={{
              padding: 10,
              background: '#f39c12',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'default' : 'pointer',
              fontSize: 11,
              fontWeight: 'bold',
            }}
          >
            🔓 TUDO
          </button>
        </div>
      </div>

      {/* DISPLAY CONFIG TOGGLES */}
      <div style={{ marginBottom: 20 }}>
        <span className="field-title">📺 DISPLAY CONFIG</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* PUZZLE */}
          <div style={{ padding: 10, background: 'rgba(231,76,60,0.05)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#e74c3c' }}>
              🎮 Puzzle
            </div>
            {Object.entries(displayConfig.puzzle).map(([key, value]) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 10,
                  marginBottom: 6,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleToggleDisplayConfig('puzzle', key)}
                  disabled={loading}
                  style={{ cursor: 'pointer' }}
                />
                <span>{key.replace('show', '')}</span>
              </label>
            ))}
          </div>

          {/* MEDIA */}
          <div style={{ padding: 10, background: 'rgba(52,152,219,0.05)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#3498db' }}>
              🎬 Mídia
            </div>
            {Object.entries(displayConfig.media).map(([key, value]) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 10,
                  marginBottom: 6,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleToggleDisplayConfig('media', key)}
                  disabled={loading}
                  style={{ cursor: 'pointer' }}
                />
                <span>{key.replace('show', '')}</span>
              </label>
            ))}
          </div>

          {/* CIPHER */}
          <div style={{ padding: 10, background: 'rgba(155,89,182,0.05)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#9b59b6' }}>
              🔐 Cipher
            </div>
            {Object.entries(displayConfig.cipher).map(([key, value]) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 10,
                  marginBottom: 6,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleToggleDisplayConfig('cipher', key)}
                  disabled={loading}
                  style={{ cursor: 'pointer' }}
                />
                <span>{key.replace('show', '')}</span>
              </label>
            ))}
          </div>

          {/* MEGA CLUE */}
          <div style={{ padding: 10, background: 'rgba(241,196,15,0.05)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#f39c12' }}>
              💎 Mega-Pista
            </div>
            {Object.entries(displayConfig.megaClue).map(([key, value]) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 10,
                  marginBottom: 6,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleToggleDisplayConfig('megaClue', key)}
                  disabled={loading}
                  style={{ cursor: 'pointer' }}
                />
                <span>{key.replace('show', '')}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* INFO */}
      <div
        style={{
          padding: 12,
          background: 'rgba(52,152,219,0.05)',
          border: '1px solid rgba(52,152,219,0.1)',
          borderRadius: 6,
          fontSize: 11,
          color: '#888',
        }}
      >
        <strong>ℹ️ Dica:</strong> Use os presets rápidos para aplicar configurações padrão. Customize os toggles para controle fino.
      </div>
    </div>
  );
}
