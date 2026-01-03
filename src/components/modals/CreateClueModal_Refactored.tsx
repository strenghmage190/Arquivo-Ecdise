import React, { useState, useEffect } from 'react';
import './CreateClueModal_Refactored.css';
import './createclueTabs/createclueTabs.css';
import useCreateClueState from '../../hooks/useCreateClueState_v3';
import { ClueBasicsTab, ClueMediaTab, ClueValidationTab, CluePreviewTab, ClueConfigTab, CluePublishTab } from './tabs';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  investigationId?: string;
  onSaved?: (payload?: unknown) => void;
};

export default function CreateClueModal_Refactored({ isOpen, onClose, investigationId, onSaved }: Props) {
  let formState: any = {};
  let actions: any = {};
  let validation: any = { validate: async () => {}, errors: [] };
  try {
    const hook = useCreateClueState(investigationId);
    formState = hook.formState;
    actions = hook.actions;
    validation = hook.validation;
  } catch (err) {
    console.error('useCreateClueState error in CreateClueModal_Refactored:', err);
    // fail-safe: keep modal closed if hook crashes
    return null;
  }

  useEffect(() => {
    if (isOpen) console.debug('CreateClueModal_Refactored opened', { investigationId });
  }, [isOpen, investigationId]);
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
          {tab === 0 && (
            <ClueBasicsTab
              evidenceType={formState.evidenceType}
              onEvidenceTypeChange={actions.setEvidenceType}
              title={formState.title}
              onTitleChange={actions.setTitle}
              descPublic={formState.descPublic}
              onDescPublicChange={actions.setDescPublic}
              descHidden={formState.descHidden}
              onDescHiddenChange={actions.setDescHidden}
              tags={formState.tags}
              onTagsChange={actions.setTags}
              templates={formState.templates ?? []}
              loadingTemplates={formState.loadingTemplates ?? false}
              showTemplateDropdown={formState.showTemplateDropdown ?? false}
              onShowTemplateDropdown={actions.setShowTemplateDropdown ?? (() => {})}
              onApplyTemplate={actions.setTemplates ?? (() => {})}
              onSaveTemplate={(name: string) => { /* noop - implement when needed */ }}
              loading={formState.loading ?? false}
            />
          )}

          {tab === 1 && (
            <ClueMediaTab
              imgFile={formState.imgFile}
              onImageSelect={actions.handleImageSelect ?? (() => {})}
              previewUrl={formState.previewUrl}
              uvFile={formState.uvFile}
              onUVSelect={actions.handleUVSelect ?? (() => {})}
              previewUrl2={formState.previewUrl2}
              thermalEnabled={formState.thermalEnabled ?? false}
              onThermalEnabledChange={actions.setThermalEnabled ?? (() => {})}
              thermalSecretText={formState.thermalSecretText ?? ''}
              onThermalSecretTextChange={actions.setThermalSecretText ?? (() => {})}
              showThermalEditor={false}
              onShowThermalEditorChange={() => {}}
              filterFile={formState.filterFile}
              onFilterSelect={actions.handleFilterSelect ?? (() => {})}
              filterPreviewUrl={formState.filterPreviewUrl}
              audioBase={formState.audioBase}
              onAudioBaseSelect={actions.handleAudioBaseSelect ?? (() => {})}
              audioBasePreview={formState.audioBasePreview}
              audioHidden={formState.audioHidden}
              onAudioHiddenSelect={actions.handleAudioHiddenSelect ?? (() => {})}
              audioHiddenPreview={formState.audioHiddenPreview}
              showMixer={formState.showMixer ?? false}
              onShowMixerChange={actions.setShowMixer ?? (() => {})}
              videoFile={formState.videoFile}
              onVideoSelect={actions.handleVideoSelect ?? (() => {})}
              videoPreviewUrl={formState.videoPreviewUrl}
              videoUrlInput={formState.videoUrlInput}
              onVideoUrlInputChange={actions.setVideoUrlInput ?? (() => {})}
              videoUploading={formState.videoUploading ?? false}
              uploadProgress={formState.uploadProgress ?? {}}
              loading={formState.loading ?? false}
            />
          )}

          {tab === 2 && (
            <ClueValidationTab
              evidenceType={formState.evidenceType}
              title={formState.title}
              imgFile={formState.imgFile}
              videoUrlInput={formState.videoUrlInput}
              videoUrl={formState.videoPreviewUrl}
              audioBase={formState.audioBase}
              securityLayerEnabled={formState.thermalEnabled ?? false}
              megaFinalTruthText={formState.megaFinalTruthText ?? ''}
              megaRequiredPuzzleIds={formState.megaRequiredPuzzleIds ?? []}
              glitchFocusedImageFile={formState.glitchFocusedImageFile}
              glitchAccessInstructions={formState.glitchAccessInstructions ?? ''}
              glitchHint={formState.glitchHint ?? ''}
              glitchKeyword={formState.glitchKeyword ?? ''}
              isLocked={formState.isLocked ?? false}
              lockPass={formState.lockPass ?? ''}
              onValidate={validation.validate}
              loading={formState.loading ?? false}
            />
          )}

          {tab === 3 && (
            <CluePreviewTab
              title={formState.title}
              descPublic={formState.descPublic}
              descHidden={formState.descHidden}
              previewUrl={formState.previewUrl}
              evidenceType={formState.evidenceType}
              glitchAccessInstructions={formState.glitchAccessInstructions ?? ''}
              glitchHint={formState.glitchHint ?? ''}
              megaFinalTruthText={formState.megaFinalTruthText ?? ''}
              thermalEnabled={formState.thermalEnabled ?? false}
              thermalSecretText={formState.thermalSecretText ?? ''}
              uvFile={formState.uvFile}
              isLocked={formState.isLocked ?? false}
              isPerson={formState.isPerson ?? false}
              personName={formState.personName ?? ''}
              loading={formState.loading ?? false}
            />
          )}

          {tab === 4 && (
            <ClueConfigTab
              displayConfig={formState.displayConfig ?? ({} as any)}
              onDisplayConfigChange={actions.setDisplayConfig ?? (() => {})}
              fieldVisibilityConfig={formState.fieldVisibilityConfig ?? ({} as any)}
              onFieldVisibilityConfigChange={actions.setFieldVisibilityConfig ?? (() => {})}
              onApplyPreset={(preset) => {
                if (preset === 'MINIMAL') actions.setDisplayConfig?.({} as any);
                if (preset === 'DEFAULT') actions.setDisplayConfig?.({} as any);
                if (preset === 'FULL') actions.setDisplayConfig?.({} as any);
              }}
              loading={formState.loading ?? false}
            />
          )}

          {tab === 5 && (
            <CluePublishTab
              title={formState.title}
              descPublic={formState.descPublic}
              evidenceType={formState.evidenceType}
              mediaCount={
                [formState.imgFile, formState.videoFile, formState.filterFile, formState.audioBase].filter(Boolean).length
              }
              displayConfigsEnabled={Object.values(formState.displayConfig ?? {}).flatMap((s: any) => Object.values(s)).filter(Boolean).length}
              totalDisplayConfigs={Object.values(formState.displayConfig ?? {}).flatMap((s: any) => Object.keys(s)).length}
              loading={formState.loading ?? false}
              onSave={async () => { await validation.validate(); onSaved?.(); }}
              errors={(validation.errors ?? []).map((e: any) => e.message)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
