import React, { useReducer, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CreateClueModal_Refactored.css';
import './createclueTabs/createclueTabs.css';
import DiegeticWindow from '../ui/DiegeticWindow';
import UVEditor from '../tools/UVEditor';
import { createInvestigationCard, updateInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';
import { FieldVisibilityConfig, defaultFieldVisibility } from '../../config/fieldVisibilityConfig';
import {
  ClueGeneralTab,
  ClueVisualTab,
  ClueAudioTab,
  ClueCipherTab,
  ClueGlitchTab,
  ClueMegaTab,
  ClueFieldsTab,
  ClueDisplayTab,
  ClueForensicTab
} from './createclueTabs';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useBlobUrl } from '../../hooks/useBlobUrl';
import { validateClue } from '../../schemas/clueValidation';
import {
  basicReducer,
  glitchReducer,
  megaReducer,
  forensicReducer,
  initialBasicState,
  initialGlitchState,
  initialMegaState,
  initialForensicState,
} from '../../reducers/clueFormReducer';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  onSaved?: (card: Record<string, any>) => void;
  defaultHidden?: boolean;
  existingCard?: any;
};

type ChatSender = 'me' | 'them' | 'system' | string;
interface EditingChatMessage {
  sender: ChatSender;
  type: string;
  text: string;
}

interface ForensicConfig {
  baseChannel: 'R' | 'G' | 'B';
  hiddenChannel: 'R' | 'G' | 'B';
  blendMode: 'screen' | 'multiply' | 'overlay';
  opacity: number;
}

const TABS = [
  { key: 'geral', label: 'GERAL', icon: '📄' },
  { key: 'visual', label: 'VISUAL', icon: '👁️' },
  { key: 'audio', label: 'ÁUDIO', icon: '🔊' },
  { key: 'cifra', label: 'CIFRAS', icon: '🧩' },
  { key: 'forense', label: 'FORENSE', icon: '🔬' },
  { key: 'campos', label: 'CAMPOS', icon: '🎯' },
  { key: 'display', label: 'CONFIG', icon: '⚙️' },
];

export default function CreateClueModal_Refactored({ isOpen, onClose, investigationId, onSaved, defaultHidden = false, existingCard }: Props) {
  const mountedRef = React.useRef(true);
  const [activeTab, setActiveTab] = useState<string>(TABS[0].key);

  // ===== REDUCERS =====
  const [basicState, dispatchBasic] = useReducer(basicReducer, initialBasicState);
  const [glitchState, dispatchGlitch] = useReducer(glitchReducer, initialGlitchState);
  const [megaState, dispatchMega] = useReducer(megaReducer, initialMegaState);
  const [forensicState, dispatchForensic] = useReducer(forensicReducer, initialForensicState);

  // ===== HOOKS =====
  const { uploadFile, progress, errors, uploading, clearErrors, resetProgress } = useFileUpload();
  const previewUrl = useBlobUrl(basicState.imgFile);

  // ===== HANDLERS =====
  const handleSave = async () => {
    const validation = validateClue({
      ...basicState,
      ...glitchState,
      ...megaState,
      ...forensicState,
    });

    if (!validation.success) {
      console.error('Validation errors:', validation.errors);
      return;
    }

    try {
      // Example: Upload image file
      if (basicState.imgFile) {
        const { url, error } = await uploadFile(basicState.imgFile, 'image', { investigationId });
        if (error) throw error;
        console.log('Uploaded image URL:', url);
      }

      // Call onSaved callback
      if (onSaved) {
        onSaved({ ...basicState, ...glitchState, ...megaState, ...forensicState });
      }

      onClose();
    } catch (err) {
      console.error('Error saving clue:', err);
    }
  };
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (!isOpen) return null;

  const modal = (
    <div className="createclue-modal-overlay" onClick={onClose}>
      <div className="createclue-modal" onClick={e => e.stopPropagation()} role="dialog">
        <div className="createclue-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="createclue-title">Criar Pista</div>
              <div className="createclue-tabs">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    className={`createclue-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <button className="createclue-close" onClick={onClose}>Fechar</button>
          </div>
        </div>

        <div className="createclue-body">
          {/* Básicos mínimos para edição rápida */}
          <div className="field-block">
            <label className="field-title">Título</label>
            <input
              className="input"
              value={basicState.title}
              onChange={e => dispatchBasic({ type: 'SET_TITLE', payload: e.target.value })}
            />
          </div>

          <div className="field-block">
            <label className="field-title">Descrição pública</label>
            <textarea
              className="textarea"
              value={basicState.descPublic}
              onChange={e => dispatchBasic({ type: 'SET_DESC_PUBLIC', payload: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="primary-btn" onClick={handleSave}>Salvar</button>
            <button className="ghost-btn" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}
