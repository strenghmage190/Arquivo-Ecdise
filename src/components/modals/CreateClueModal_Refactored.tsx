import React, { useState } from 'react';
import useCreateClueState from '../../hooks/useCreateClueState';
import { ClueBasicsTab, ClueMediaTab, ClueValidationTab, CluePreviewTab, ClueConfigTab, CluePublishTab } from './tabs';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  investigationId?: string;
  onSaved?: (payload?: unknown) => void;
};

export default function CreateClueModal_Refactored({ isOpen, onClose, investigationId, onSaved }: Props) {
  const { formState, actions, validation } = useCreateClueState(investigationId);
  const [tab, setTab] = useState<number>(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded shadow-lg">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex gap-2">
            <button className={`px-3 py-1 ${tab === 0 ? 'bg-gray-200' : ''}`} onClick={() => setTab(0)}>Básico</button>
            <button className={`px-3 py-1 ${tab === 1 ? 'bg-gray-200' : ''}`} onClick={() => setTab(1)}>Mídia</button>
            <button className={`px-3 py-1 ${tab === 2 ? 'bg-gray-200' : ''}`} onClick={() => setTab(2)}>Validação</button>
            <button className={`px-3 py-1 ${tab === 3 ? 'bg-gray-200' : ''}`} onClick={() => setTab(3)}>Preview</button>
            <button className={`px-3 py-1 ${tab === 4 ? 'bg-gray-200' : ''}`} onClick={() => setTab(4)}>Config</button>
            <button className={`px-3 py-1 ${tab === 5 ? 'bg-gray-200' : ''}`} onClick={() => setTab(5)}>Publicar</button>
          </div>
          <div>
            <button onClick={onClose} className="px-3 py-1">Fechar</button>
          </div>
        </div>

        <div className="p-4">
          {tab === 0 && <ClueBasicsTab formState={formState} actions={actions} validation={validation} />}
          {tab === 1 && <ClueMediaTab formState={formState} actions={actions} />}
          {tab === 2 && <ClueValidationTab validation={validation} />}
          {tab === 3 && <CluePreviewTab formState={formState} />}
          {tab === 4 && <ClueConfigTab formState={formState} actions={actions} />}
          {tab === 5 && <CluePublishTab formState={formState} validation={validation} onSave={async () => { validation.validate(); onSaved?.(); }} />}
        </div>
      </div>
    </div>
  );
}
/**
 * 🎯 CreateClueModal - Wrapper Refatorizado
 * 
 * Novos Componentes:
 * - ClueBasicsTab: Tipo, título, descrição, tags, templates
 * - ClueMediaTab: Upload de imagens, áudio, vídeo
 * - ClueValidationTab: Validação de campos
 * - CluePreviewTab: Preview de como o player vê
 * - ClueConfigTab: Display config e field visibility
 * - CluePublishTab: Resumo e botão de publicar
 */

import React, { useState, useEffect } from 'react';
import ClueBasicsTab from './tabs/ClueBasicsTab';
import ClueMediaTab from './tabs/ClueMediaTab';
import ClueValidationTab from './tabs/ClueValidationTab';
import CluePreviewTab from './tabs/CluePreviewTab';
import ClueConfigTab from './tabs/ClueConfigTab';
import CluePublishTab from './tabs/CluePublishTab';

// ⚠️ IMPORTANTE: Importar todo o state e lógica do CreateClueModal antigo
// Este é um wrapper que coordena os tabs.
// O estado real ainda está em CreateClueModal_Legacy.tsx

type TabType = 'basics' | 'media' | 'validation' | 'preview' | 'config' | 'publish';

interface CreateClueModalRefactorProps {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  initialX?: number;
  initialY?: number;
  onSaved: (card: Record<string, any>) => void;
  
  // State props (passed from parent / CreateClueModal_Legacy)
  title: string;
  descPublic: string;
  descHidden: string;
  tags: string;
  evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue';
  imgFile: File | null;
  uvFile: File | null;
  previewUrl: string | null;
  previewUrl2: string | null;
  thermalEnabled: boolean;
  thermalSecretText: string;
  filterFile: File | null;
  filterPreviewUrl: string | null;
  audioBase: File | null;
  audioBasePreview: string | null;
  audioHidden: File | null;
  audioHiddenPreview: string | null;
  videoFile: File | null;
  videoPreviewUrl: string | null;
  videoUrlInput: string;
  videoUploading: boolean;
  uploadProgress: Record<string, number>;
  megaFinalTruthText: string;
  megaRequiredPuzzleIds: string[];
  showMixer: boolean;
  loading: boolean;
  displayConfig: any;
  fieldVisibilityConfig: any;
  templates: any[];
  loadingTemplates: boolean;
  glitchAccessInstructions: string;
  glitchHint: string;
  isLocked: boolean;
  isPerson: boolean;
  personName: string;
  lockPass: string;

  // Callback props
  onTitleChange: (value: string) => void;
  onDescPublicChange: (value: string) => void;
  onDescHiddenChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onEvidenceTypeChange: (type: 'document' | 'glitch_puzzle' | 'mega_clue') => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUVSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThermalEnabledChange: (enabled: boolean) => void;
  onThermalSecretTextChange: (text: string) => void;
  onShowThermalEditorChange: (show: boolean) => void;
  onFilterSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioBaseSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioHiddenSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowMixerChange: (show: boolean) => void;
  onVideoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUrlInputChange: (url: string) => void;
  onMegaFinalTruthTextChange: (text: string) => void;
  onMegaRequiredPuzzleIdsChange: (ids: string[]) => void;
  onDisplayConfigChange: (config: any) => void;
  onFieldVisibilityConfigChange: (config: any) => void;
  onApplyTemplate: (template: any) => void;
  onSaveTemplate: (name: string) => void;
  onApplyPreset: (preset: 'MINIMAL' | 'DEFAULT' | 'FULL') => void;
  onValidate: () => { field: string; message: string; severity: 'error' | 'warning' | 'info' }[];
  onSave: () => Promise<void>;
  onShowTemplateDropdownChange: (show: boolean) => void;
  showTemplateDropdown: boolean;
  glitchFocusedImageFile: File | null;
}

export default function CreateClueModalRefactored({
  isOpen,
  onClose,
  // State
  title,
  descPublic,
  descHidden,
  tags,
  evidenceType,
  imgFile,
  uvFile,
  previewUrl,
  previewUrl2,
  thermalEnabled,
  thermalSecretText,
  filterFile,
  filterPreviewUrl,
  audioBase,
  audioBasePreview,
  audioHidden,
  audioHiddenPreview,
  videoFile,
  videoPreviewUrl,
  videoUrlInput,
  videoUploading,
  uploadProgress,
  megaFinalTruthText,
  megaRequiredPuzzleIds,
  loading,
  displayConfig,
  fieldVisibilityConfig,
  templates,
  loadingTemplates,
  glitchAccessInstructions,
  glitchHint,
  isLocked,
  isPerson,
  personName,
  lockPass,
  showMixer,
  showTemplateDropdown,
  glitchFocusedImageFile,
  // Callbacks
  onTitleChange,
  onDescPublicChange,
  onDescHiddenChange,
  onTagsChange,
  onEvidenceTypeChange,
  onImageSelect,
  onUVSelect,
  onThermalEnabledChange,
  onThermalSecretTextChange,
  onShowThermalEditorChange,
  onFilterSelect,
  onAudioBaseSelect,
  onAudioHiddenSelect,
  onShowMixerChange,
  onVideoSelect,
  onVideoUrlInputChange,
  onMegaFinalTruthTextChange,
  onMegaRequiredPuzzleIdsChange,
  onDisplayConfigChange,
  onFieldVisibilityConfigChange,
  onApplyTemplate,
  onSaveTemplate,
  onApplyPreset,
  onValidate,
  onSave,
  onShowTemplateDropdownChange,
}: CreateClueModalRefactorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basics');

  if (!isOpen) return null;

  const mediaCount = [imgFile, uvFile, filterFile, audioBase, audioHidden, videoFile].filter(
    (f) => f !== null
  ).length;

  const displayConfigsEnabled = (Object.values(displayConfig || {}) as any[]).reduce(
    (acc: number, section: any) => {
      if (typeof section === 'object' && section !== null) {
        return acc + Object.values(section).filter((v: any) => v === true).length;
      }
      return acc;
    },
    0
  ) as number;

  const totalDisplayConfigs = (Object.values(displayConfig || {}) as any[]).reduce(
    (acc: number, section: any) => {
      if (typeof section === 'object' && section !== null) {
        return acc + Object.keys(section).length;
      }
      return acc;
    },
    0
  ) as number;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0b0b0b',
          border: '2px solid #2c3e50',
          borderRadius: 8,
          width: '90%',
          maxWidth: 1000,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: 16,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2c3e50 100%)',
            borderBottom: '1px solid #444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, color: '#fff' }}>✨ CRIAR PISTA</h2>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              color: '#aaa',
              border: 'none',
              fontSize: 24,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: '8px 16px',
            background: '#1a1a1a',
            borderBottom: '1px solid #333',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'basics' as TabType, label: '📌 Básico', icon: '📋' },
            { id: 'media' as TabType, label: '🎬 Mídia', icon: '📸' },
            { id: 'validation' as TabType, label: '✓ Validação', icon: '✅' },
            { id: 'preview' as TabType, label: '👁️ Preview', icon: '👀' },
            { id: 'config' as TabType, label: '⚙️ Configuração', icon: '⚙️' },
            { id: 'publish' as TabType, label: '🚀 Publicar', icon: '🎯' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: activeTab === tab.id ? '#2c3e50' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#888',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'default' : 'pointer',
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                whiteSpace: 'nowrap',
              }}
              title={tab.label}
            >
              {tab.icon}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            background: '#0b0b0b',
          }}
        >
          {activeTab === 'basics' && (
            <ClueBasicsTab
              evidenceType={evidenceType}
              onEvidenceTypeChange={onEvidenceTypeChange}
              title={title}
              onTitleChange={onTitleChange}
              descPublic={descPublic}
              onDescPublicChange={onDescPublicChange}
              descHidden={descHidden}
              onDescHiddenChange={onDescHiddenChange}
              tags={tags}
              onTagsChange={onTagsChange}
              templates={templates}
              loadingTemplates={loadingTemplates}
              showTemplateDropdown={showTemplateDropdown}
              onShowTemplateDropdown={onShowTemplateDropdownChange}
              onApplyTemplate={onApplyTemplate}
              onSaveTemplate={onSaveTemplate}
              loading={loading}
            />
          )}

          {activeTab === 'media' && (
            <ClueMediaTab
              imgFile={imgFile}
              onImageSelect={onImageSelect}
              previewUrl={previewUrl}
              uvFile={uvFile}
              onUVSelect={onUVSelect}
              previewUrl2={previewUrl2}
              thermalEnabled={thermalEnabled}
              onThermalEnabledChange={onThermalEnabledChange}
              thermalSecretText={thermalSecretText}
              onThermalSecretTextChange={onThermalSecretTextChange}
              showThermalEditor={false} // Passar do estado se necessário
              onShowThermalEditorChange={onShowThermalEditorChange}
              filterFile={filterFile}
              onFilterSelect={onFilterSelect}
              filterPreviewUrl={filterPreviewUrl}
              audioBase={audioBase}
              onAudioBaseSelect={onAudioBaseSelect}
              audioBasePreview={audioBasePreview}
              audioHidden={audioHidden}
              onAudioHiddenSelect={onAudioHiddenSelect}
              audioHiddenPreview={audioHiddenPreview}
              showMixer={showMixer}
              onShowMixerChange={onShowMixerChange}
              videoFile={videoFile}
              onVideoSelect={onVideoSelect}
              videoPreviewUrl={videoPreviewUrl}
              videoUrlInput={videoUrlInput}
              onVideoUrlInputChange={onVideoUrlInputChange}
              videoUploading={videoUploading}
              uploadProgress={uploadProgress}
              loading={loading}
            />
          )}

          {activeTab === 'validation' && (
            <ClueValidationTab
              evidenceType={evidenceType}
              title={title}
              imgFile={imgFile}
              videoUrlInput={videoUrlInput}
              videoUrl={null} // Passar do estado se necessário
              audioBase={audioBase}
              securityLayerEnabled={false} // Passar do estado
              megaFinalTruthText={megaFinalTruthText}
              megaRequiredPuzzleIds={megaRequiredPuzzleIds}
              glitchFocusedImageFile={glitchFocusedImageFile}
              glitchAccessInstructions={glitchAccessInstructions}
              glitchHint={glitchHint}
              glitchKeyword={''} // Passar do estado
              isLocked={isLocked}
              lockPass={lockPass}
              onValidate={onValidate}
              loading={loading}
            />
          )}

          {activeTab === 'preview' && (
            <CluePreviewTab
              title={title}
              descPublic={descPublic}
              descHidden={descHidden}
              previewUrl={previewUrl}
              evidenceType={evidenceType}
              glitchAccessInstructions={glitchAccessInstructions}
              glitchHint={glitchHint}
              megaFinalTruthText={megaFinalTruthText}
              thermalEnabled={thermalEnabled}
              thermalSecretText={thermalSecretText}
              uvFile={uvFile}
              isLocked={isLocked}
              isPerson={isPerson}
              personName={personName}
              loading={loading}
            />
          )}

          {activeTab === 'config' && (
            <ClueConfigTab
              displayConfig={displayConfig}
              onDisplayConfigChange={onDisplayConfigChange}
              fieldVisibilityConfig={fieldVisibilityConfig}
              onFieldVisibilityConfigChange={onFieldVisibilityConfigChange}
              onApplyPreset={onApplyPreset}
              loading={loading}
            />
          )}

          {activeTab === 'publish' && (
            <CluePublishTab
              title={title}
              descPublic={descPublic}
              evidenceType={evidenceType}
              mediaCount={mediaCount}
              displayConfigsEnabled={displayConfigsEnabled}
              totalDisplayConfigs={totalDisplayConfigs}
              loading={loading}
              onSave={onSave}
              errors={onValidate().filter((e) => e.severity === 'error').map((e) => e.message)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
