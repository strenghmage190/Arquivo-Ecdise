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
