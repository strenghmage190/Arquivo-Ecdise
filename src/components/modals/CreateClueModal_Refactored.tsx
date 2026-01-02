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
