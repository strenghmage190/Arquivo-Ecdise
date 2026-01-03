import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CreateClueModal_Refactored.css';
import './createclueTabs/createclueTabs.css';
import DiegeticWindow from '../ui/DiegeticWindow';
import { createInvestigationCard } from '../../api/investigations';
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

type Props = {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  onSaved?: (card: Record<string, any>) => void;
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

export default function CreateClueModal_Refactored({ isOpen, onClose, investigationId, onSaved }: Props) {
  const mountedRef = React.useRef(true);

  // ===== BASIC INFO =====
  const [title, setTitle] = useState('');
  const [descPublic, setDescPublic] = useState('');
  const [descHidden, setDescHidden] = useState('');
  const [tags, setTags] = useState('');
  const [evidenceType, setEvidenceType] = useState<'document' | 'glitch_puzzle' | 'mega_clue'>('document');

  // ===== HIDDEN CLUES =====
  const [isHidden, setIsHidden] = useState(false);
  const [discoveryCode, setDiscoveryCode] = useState('');

  // ===== VISUAL/IMAGE =====
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uvFile, setUvFile] = useState<File | null>(null);
  const [uvFileUrl, setUvFileUrl] = useState<string | null>(null);
  const [thermalEnabled, setThermalEnabled] = useState(false);
  const [thermalSecretText, setThermalSecretText] = useState('');
  const [thermalFontSize, setThermalFontSize] = useState(14);
  const [thermalPositionY, setThermalPositionY] = useState(50);
  const [thermalKeyword, setThermalKeyword] = useState('');
  const [showThermalEditor, setShowThermalEditor] = useState(false);

  // ===== FILTER/SECURITY =====
  const [filterFile, setFilterFile] = useState<File | null>(null);
  const [filterPreviewUrl, setFilterPreviewUrl] = useState<string | null>(null);
  const [filterTransform, setFilterTransform] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [editorMode, setEditorMode] = useState<'uv' | 'filter' | null>(null);
  const [filterRevealBrightness, setFilterRevealBrightness] = useState(0);
  const [filterRevealContrast, setFilterRevealContrast] = useState(0);
  const [filterRevealSaturate, setFilterRevealSaturate] = useState(0);
  const [showAdvancedFilterSettings, setShowAdvancedFilterSettings] = useState(false);

  // ===== VIDEO =====
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // ===== AUDIO =====
  const [audioBase, setAudioBase] = useState<File | null>(null);
  const [audioBasePreview, setAudioBasePreview] = useState<string | null>(null);
  const [audioHidden, setAudioHidden] = useState<File | null>(null);
  const [audioHiddenPreview, setAudioHiddenPreview] = useState<string | null>(null);
  const [audioHiddenUploadedUrl, setAudioHiddenUploadedUrl] = useState<string | null>(null);
  const [audioHiddenUploading, setAudioHiddenUploading] = useState(false);
  const [freq, setFreq] = useState(50);
  const [showAudioForgeFor, setShowAudioForgeFor] = useState<null | 'hidden' | 'base'>(null);
  const [showMixer, setShowMixer] = useState(false);
  const [audioStaticSync, setAudioStaticSync] = useState(false);

  // ===== MEDIA VISIBILITY =====
  const [mediaVisibility, setMediaVisibility] = useState({
    audioBase: 'always' as 'always' | 'glitch_only' | 'post_solve',
    audioHidden: 'post_solve' as 'post_solve' | 'post_keyword',
    visual: 'glitch_active' as 'glitch_active' | 'post_keyword',
    uvLayer: 'post_keyword' as 'post_keyword' | 'always' | 'post_solve',
  });

  // ===== CIPHER/CRYPTO =====
  const [isShredded, setIsShredded] = useState(false);
  const [shredRows, setShredRows] = useState(4);
  const [shredCols, setShredCols] = useState(4);
  const [realText, setRealText] = useState('');
  const [cipherText, setCipherText] = useState('');
  const [hexCode, setHexCode] = useState('');

  // ===== FORENSIC =====
  const [forensicBaseImage, setForensicBaseImage] = useState<File | null>(null);
  const [forensicBasePreview, setForensicBasePreview] = useState<string | null>(null);
  const [forensicHiddenImage, setForensicHiddenImage] = useState<File | null>(null);
  const [forensicHiddenPreview, setForensicHiddenPreview] = useState<string | null>(null);
  const [forensicTargetChannel, setForensicTargetChannel] = useState<'R' | 'G' | 'B'>('R');
  const [forensicResultPreview, setForensicResultPreview] = useState<string | null>(null);
  const [forensicProcessing, setForensicProcessing] = useState(false);
  const [showForensicEditor, setShowForensicEditor] = useState(false);
  const [forensicConfig, setForensicConfig] = useState<ForensicConfig | null>(null);

  // ===== GLITCH PUZZLE =====
  const [securityLayerEnabled, setSecurityLayerEnabled] = useState(false);
  const [glitchFocusedImageFile, setGlitchFocusedImageFile] = useState<File | null>(null);
  const [glitchFocusedImagePreview, setGlitchFocusedImagePreview] = useState<string | null>(null);
  const [showGlitchDesigner, setShowGlitchDesigner] = useState(false);
  const [glitchStartFrequency, setGlitchStartFrequency] = useState(60);
  const [glitchStartShift, setGlitchStartShift] = useState(30);
  const [glitchStartChromatic, setGlitchStartChromatic] = useState(15);
  const [glitchCorrectFrequency, setGlitchCorrectFrequency] = useState(60);
  const [glitchCorrectShift, setGlitchCorrectShift] = useState(30);
  const [glitchCorrectChromatic, setGlitchCorrectChromatic] = useState(15);
  const [glitchDifficulty, setGlitchDifficulty] = useState<'easy' | 'normal' | 'hard' | 'custom'>('normal');
  const [glitchToleranceFreq, setGlitchToleranceFreq] = useState(5);
  const [glitchToleranceShift, setGlitchToleranceShift] = useState(5);
  const [glitchToleranceChroma, setGlitchToleranceChroma] = useState(5);
  const [glitchAccessInstructions, setGlitchAccessInstructions] = useState('');
  const [glitchHint, setGlitchHint] = useState('');
  const [glitchKeyword, setGlitchKeyword] = useState('');
  const [glitchRewardCode, setGlitchRewardCode] = useState('');

  // ===== MEGA CLUE =====
  const [megaFinalTruthText, setMegaFinalTruthText] = useState('');
  const [megaImageFile, setMegaImageFile] = useState<File | null>(null);
  const [megaImagePreview, setMegaImagePreview] = useState<string | null>(null);
  const [megaRequiredPuzzleIds, setMegaRequiredPuzzleIds] = useState<string[]>([]);
  const [availablePuzzles, setAvailablePuzzles] = useState<Array<{ id: string; title: string }>>([]);
  const [megaSelectedPuzzle, setMegaSelectedPuzzle] = useState('');

  // ===== LOCKED PHONE =====
  const [isLocked, setIsLocked] = useState(false);
  const [lockPass, setLockPass] = useState('');
  const [phoneHasKeypad, setPhoneHasKeypad] = useState(false);
  const [phonePassword, setPhonePassword] = useState('');
  const [showKeypadEditor, setShowKeypadEditor] = useState(false);

  // ===== PERSON INFO =====
  const [isPerson, setIsPerson] = useState(false);
  const [personName, setPersonName] = useState('');
  const [personDob, setPersonDob] = useState('');
  const [personStatus, setPersonStatus] = useState<'UNKNOWN' | 'ALIVE' | 'DEAD' | 'MISSING'>('UNKNOWN');
  const [personOccupation, setPersonOccupation] = useState('');

  // ===== FIELD VISIBILITY & DISPLAY CONFIG =====
  const [fieldVisibilityConfig, setFieldVisibilityConfig] = useState<FieldVisibilityConfig>(defaultFieldVisibility);
  const [displayConfig, setDisplayConfig] = useState({
    puzzle: { showProgress: true, showHints: true },
    fileProperties: { visibleFields: ['fileType', 'dateCreated'] },
    media: { showThumbnail: true },
    cipher: { showReal: false },
    megaClue: { showHints: true },
  });

  // ===== CHAT =====
  const [showChatEditor, setShowChatEditor] = useState(false);
  const [chatData, setChatData] = useState<EditingChatMessage[]>([]);
  const [chatContactName, setChatContactName] = useState('Desconhecido');

  // ===== TEMPLATES =====
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // ===== UI STATE =====
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(false);

  // ===== EFFECTS =====
  useEffect(() => {
    if (!isOpen) return;
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, [isOpen]);

  // ===== HANDLERS =====
  const handleSave = async () => {
    if (!investigationId || !title) {
      alert('Título é obrigatório');
      return;
    }
    if (isHidden && !discoveryCode.trim()) {
      alert('Código de descoberta é obrigatório para pistas ocultas');
      return;
    }
    setLoading(true);

    try {
      let imageUrl: string | null = null;
      let uvUrl: string | null = null;

      if (imgFile) {
        imageUrl = await uploadInvestigationImage(imgFile, investigationId);
      }
      if (uvFile) {
        uvUrl = await uploadInvestigationImage(uvFile, investigationId);
      }

      const metadata: Record<string, any> = {
        evidence_type: evidenceType,
        field_visibility: fieldVisibilityConfig,
        display_config: displayConfig,
      };

      if (thermalEnabled) {
        metadata.thermal_layer = {
          enabled: true,
          secretText: thermalSecretText,
          fontSize: thermalFontSize,
          positionY: thermalPositionY,
          keyword: thermalKeyword,
        };
      }

      if (securityLayerEnabled && evidenceType === 'glitch_puzzle') {
        metadata.glitch_puzzle = {
          focusedImage: glitchFocusedImageFile ? 'uploaded' : null,
          startFrequency: glitchStartFrequency,
          startShift: glitchStartShift,
          startChromatic: glitchStartChromatic,
          correctFrequency: glitchCorrectFrequency,
          correctShift: glitchCorrectShift,
          correctChromatic: glitchCorrectChromatic,
          difficulty: glitchDifficulty,
          toleranceFreq: glitchToleranceFreq,
          toleranceShift: glitchToleranceShift,
          toleranceChroma: glitchToleranceChroma,
          accessInstructions: glitchAccessInstructions,
          hint: glitchHint,
          keyword: glitchKeyword,
          rewardCode: glitchRewardCode,
        };
      }

      if (evidenceType === 'mega_clue') {
        metadata.mega_clue = {
          finalTruthText: megaFinalTruthText,
          requiredPuzzleIds: megaRequiredPuzzleIds,
        };
      }

      if (isLocked) {
        metadata.locked_phone = {
          password: lockPass,
          hasKeypad: phoneHasKeypad,
          keypadPassword: phonePassword,
        };
      }

      if (isPerson) {
        metadata.person_info = {
          name: personName,
          dob: personDob,
          status: personStatus,
          occupation: personOccupation,
        };
      }

      if (chatData.length > 0) {
        metadata.chat_data = chatData;
        metadata.chat_contact_name = chatContactName;
      }

      const card = await createInvestigationCard({
        investigation_id: investigationId,
        title,
        description_public: descPublic,
        description_hidden: descHidden,
        image_url: imageUrl,
        metadata,
        is_hidden: isHidden,
        discovery_code: isHidden ? discoveryCode.trim().toUpperCase() : null,
      });

      if (mountedRef.current) {
        onSaved?.(card);
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar evidência');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleImgSelect = async (file: File) => {
    setImgFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const visibleTabs = TABS.filter((tab) => {
    if (tab.key === 'glitch' && !securityLayerEnabled && evidenceType !== 'glitch_puzzle') return false;
    if (tab.key === 'mega' && evidenceType !== 'mega_clue') return false;
    return true;
  });

  if (!isOpen) return null;

  const modal = (
    <div className="createclue-modal-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <DiegeticWindow
          title={`${evidenceType === 'glitch_puzzle' ? '🎮' : evidenceType === 'mega_clue' ? '🔐' : '📋'} CRIAR EVIDÊNCIA`}
          onClose={onClose}
        >
          <div className="createclue-container">
          {/* Tabs Navigation */}
          <div className="createclue-tabs-header">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                className={`createclue-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="createclue-body">
            {activeTab === 'geral' && (
              <ClueGeneralTab
                title={title}
                setTitle={setTitle}
                descPublic={descPublic}
                setDescPublic={setDescPublic}
                descHidden={descHidden}
                setDescHidden={setDescHidden}
                tags={tags}
                setTags={setTags}
                evidenceType={evidenceType}
                setEvidenceType={setEvidenceType}
                templates={templates}
                loadingTemplates={loadingTemplates}
                showTemplateDropdown={showTemplateDropdown}
                setShowTemplateDropdown={setShowTemplateDropdown}
              />
            )}

            {activeTab === 'visual' && (
              <ClueVisualTab
                imgFile={imgFile}
                handleImgSelect={handleImgSelect}
                previewUrl={previewUrl}
                uvFile={uvFile}
                setUvFile={setUvFile}
                uvFileUrl={uvFileUrl}
                setUvFileUrl={setUvFileUrl}
                thermalEnabled={thermalEnabled}
                setThermalEnabled={setThermalEnabled}
                thermalSecretText={thermalSecretText}
                setThermalSecretText={setThermalSecretText}
                thermalFontSize={thermalFontSize}
                setThermalFontSize={setThermalFontSize}
                thermalPositionY={thermalPositionY}
                setThermalPositionY={setThermalPositionY}
                thermalKeyword={thermalKeyword}
                setThermalKeyword={setThermalKeyword}
                showThermalEditor={showThermalEditor}
                setShowThermalEditor={setShowThermalEditor}
                filterFile={filterFile}
                setFilterFile={setFilterFile}
                filterPreviewUrl={filterPreviewUrl}
                setFilterPreviewUrl={setFilterPreviewUrl}
                editorMode={editorMode}
                setEditorMode={setEditorMode}
                filterRevealBrightness={filterRevealBrightness}
                setFilterRevealBrightness={setFilterRevealBrightness}
                filterRevealContrast={filterRevealContrast}
                setFilterRevealContrast={setFilterRevealContrast}
                filterRevealSaturate={filterRevealSaturate}
                setFilterRevealSaturate={setFilterRevealSaturate}
                showAdvancedFilterSettings={showAdvancedFilterSettings}
                setShowAdvancedFilterSettings={setShowAdvancedFilterSettings}
                videoFile={videoFile}
                setVideoFile={setVideoFile}
                videoPreviewUrl={videoPreviewUrl}
                setVideoPreviewUrl={setVideoPreviewUrl}
                videoUrlInput={videoUrlInput}
                setVideoUrlInput={setVideoUrlInput}
                videoUploading={videoUploading}
                setVideoUploading={setVideoUploading}
                uploadProgress={uploadProgress}
                setUploadProgress={setUploadProgress}
              />
            )}

            {activeTab === 'audio' && (
              <ClueAudioTab
                audioBase={audioBase}
                setAudioBase={setAudioBase}
                audioBasePreview={audioBasePreview}
                setAudioBasePreview={setAudioBasePreview}
                audioHidden={audioHidden}
                setAudioHidden={setAudioHidden}
                audioHiddenPreview={audioHiddenPreview}
                setAudioHiddenPreview={setAudioHiddenPreview}
                audioHiddenUploading={audioHiddenUploading}
                setAudioHiddenUploading={setAudioHiddenUploading}
                freq={freq}
                setFreq={setFreq}
                showAudioForgeFor={showAudioForgeFor}
                setShowAudioForgeFor={setShowAudioForgeFor}
                showMixer={showMixer}
                setShowMixer={setShowMixer}
                audioStaticSync={audioStaticSync}
                setAudioStaticSync={setAudioStaticSync}
                mediaVisibility={mediaVisibility}
                setMediaVisibility={setMediaVisibility}
                investigationId={investigationId}
              />
            )}

            {activeTab === 'cifra' && (
              <ClueCipherTab
                isShredded={isShredded}
                setIsShredded={setIsShredded}
                shredRows={shredRows}
                setShredRows={setShredRows}
                shredCols={shredCols}
                setShredCols={setShredCols}
                realText={realText}
                setRealText={setRealText}
                cipherText={cipherText}
                setCipherText={setCipherText}
                hexCode={hexCode}
                setHexCode={setHexCode}
              />
            )}

            {activeTab === 'forense' && (
              <ClueForensicTab
                forensicBaseImage={forensicBaseImage}
                setForensicBaseImage={setForensicBaseImage}
                forensicBasePreview={forensicBasePreview}
                setForensicBasePreview={setForensicBasePreview}
                forensicHiddenImage={forensicHiddenImage}
                setForensicHiddenImage={setForensicHiddenImage}
                forensicHiddenPreview={forensicHiddenPreview}
                setForensicHiddenPreview={setForensicHiddenPreview}
                forensicTargetChannel={forensicTargetChannel}
                setForensicTargetChannel={setForensicTargetChannel}
                forensicResultPreview={forensicResultPreview}
                setForensicResultPreview={setForensicResultPreview}
                forensicProcessing={forensicProcessing}
                setForensicProcessing={setForensicProcessing}
                showForensicEditor={showForensicEditor}
                setShowForensicEditor={setShowForensicEditor}
                forensicConfig={forensicConfig}
                setForensicConfig={setForensicConfig}
              />
            )}

            {activeTab === 'campos' && (
              <ClueFieldsTab
                fieldVisibilityConfig={fieldVisibilityConfig}
                setFieldVisibilityConfig={setFieldVisibilityConfig}
              />
            )}

            {activeTab === 'display' && (
              <ClueDisplayTab
                displayConfig={displayConfig}
                setDisplayConfig={setDisplayConfig}
                showChatEditor={showChatEditor}
                setShowChatEditor={setShowChatEditor}
                chatData={chatData}
                setChatData={setChatData}
                chatContactName={chatContactName}
                setChatContactName={setChatContactName}
                isLocked={isLocked}
                setIsLocked={setIsLocked}
                lockPass={lockPass}
                setLockPass={setLockPass}
                phoneHasKeypad={phoneHasKeypad}
                setPhoneHasKeypad={setPhoneHasKeypad}
                phonePassword={phonePassword}
                setPhonePassword={setPhonePassword}
                showKeypadEditor={showKeypadEditor}
                setShowKeypadEditor={setShowKeypadEditor}
                isPerson={isPerson}
                setIsPerson={setIsPerson}
                personName={personName}
                setPersonName={setPersonName}
                personDob={personDob}
                setPersonDob={setPersonDob}
                personStatus={personStatus}
                setPersonStatus={setPersonStatus}
                personOccupation={personOccupation}
                setPersonOccupation={setPersonOccupation}
              />
            )}

            {activeTab === 'glitch' && securityLayerEnabled && (
              <ClueGlitchTab
                glitchFocusedImageFile={glitchFocusedImageFile}
                setGlitchFocusedImageFile={setGlitchFocusedImageFile}
                glitchFocusedImagePreview={glitchFocusedImagePreview}
                setGlitchFocusedImagePreview={setGlitchFocusedImagePreview}
                showGlitchDesigner={showGlitchDesigner}
                setShowGlitchDesigner={setShowGlitchDesigner}
                glitchStartFrequency={glitchStartFrequency}
                setGlitchStartFrequency={setGlitchStartFrequency}
                glitchStartShift={glitchStartShift}
                setGlitchStartShift={setGlitchStartShift}
                glitchStartChromatic={glitchStartChromatic}
                setGlitchStartChromatic={setGlitchStartChromatic}
                glitchCorrectFrequency={glitchCorrectFrequency}
                setGlitchCorrectFrequency={setGlitchCorrectFrequency}
                glitchCorrectShift={glitchCorrectShift}
                setGlitchCorrectShift={setGlitchCorrectShift}
                glitchCorrectChromatic={glitchCorrectChromatic}
                setGlitchCorrectChromatic={setGlitchCorrectChromatic}
                glitchDifficulty={glitchDifficulty}
                setGlitchDifficulty={setGlitchDifficulty}
                glitchToleranceFreq={glitchToleranceFreq}
                setGlitchToleranceFreq={setGlitchToleranceFreq}
                glitchToleranceShift={glitchToleranceShift}
                setGlitchToleranceShift={setGlitchToleranceShift}
                glitchToleranceChroma={glitchToleranceChroma}
                setGlitchToleranceChroma={setGlitchToleranceChroma}
                glitchAccessInstructions={glitchAccessInstructions}
                setGlitchAccessInstructions={setGlitchAccessInstructions}
                glitchHint={glitchHint}
                setGlitchHint={setGlitchHint}
                glitchKeyword={glitchKeyword}
                setGlitchKeyword={setGlitchKeyword}
                glitchRewardCode={glitchRewardCode}
                setGlitchRewardCode={setGlitchRewardCode}
              />
            )}

            {activeTab === 'mega' && evidenceType === 'mega_clue' && (
              <ClueMegaTab
                megaFinalTruthText={megaFinalTruthText}
                setMegaFinalTruthText={setMegaFinalTruthText}
                megaImageFile={megaImageFile}
                setMegaImageFile={setMegaImageFile}
                megaImagePreview={megaImagePreview}
                setMegaImagePreview={setMegaImagePreview}
                megaRequiredPuzzleIds={megaRequiredPuzzleIds}
                setMegaRequiredPuzzleIds={setMegaRequiredPuzzleIds}
                availablePuzzles={availablePuzzles}
                setAvailablePuzzles={setAvailablePuzzles}
                megaSelectedPuzzle={megaSelectedPuzzle}
                setMegaSelectedPuzzle={setMegaSelectedPuzzle}
              />
            )}
          </div>

          {/* Footer */}
          <div className="createclue-footer">
            <button className="createclue-btn-cancel" onClick={onClose}>
              ✕ CANCELAR
            </button>
            <button 
              className="createclue-btn-save" 
              onClick={handleSave}
              disabled={loading || !title}
            >
              {loading ? '⏳ SALVANDO...' : '✓ SALVAR EVIDÊNCIA'}
            </button>
          </div>
        </div>
      </DiegeticWindow>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
