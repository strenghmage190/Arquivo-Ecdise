import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { createInvestigationCard, updateInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage, uploadInvestigationFile } from '../../utils/storage';
import UVEditor from '../tools/UVEditor';
import ThermalEditor from '../tools/ThermalEditor';
import { bufferToWav } from '../../utils/audioGenerator';
import { 
  fetchClueTemplates, 
  createClueTemplate, 
  deleteClueTemplate, 
  sanitizeTemplateData,
  ClueTemplate 
} from '../../api/templates';

import PhoneViewer from '../tools/PhoneViewer';
import NumericKeypad from '../tools/NumericKeypad';
import PatternLock from '../tools/PatternLock';
import SpectrogramCreator from '../tools/SpectrogramCreator';
import ProfessionalSpectrogram from '../tools/ProfessionalSpectrogram';
import './CreateClueModal.css';
import DiegeticWindow from '../ui/DiegeticWindow';
import GlitchImageEngine from '../tools/GlitchImageEngine';
import AudioForge from '../tools/AudioForge';
const AudioLab = React.lazy(() => import('../tools/audiolab/AudioLab'));
import ForensicChannelEditor, { ForensicConfig } from '../tools/ForensicChannelEditor';
import { supabase } from '../../supabaseClient';
import { FieldVisibilityConfig, defaultFieldVisibility, fieldVisibilityPresets } from '../../config/fieldVisibilityConfig';
import { validateCreateClue } from '../../utils/validateClue';
const LOCKED_PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAwEB/aurbZkAAAAASUVORK5CYII=';

// Presets de Visibilidade de Campos (importado de config)
const VISIBILITY_PRESETS = fieldVisibilityPresets;

async function uploadAudio(file: File, investigationId: string): Promise<string | null> {
   // Sanitize filename: remove diacritics, replace disallowed chars with underscore
   const originalName = file.name || 'audio';
   const ext = originalName.split('.').pop() || '';
   const base = originalName.replace(/\.[^/.]+$/, '')
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 120);
   const safeName = `audio_${Date.now()}_${base}${ext ? '.' + ext : ''}`;
   const path = `${investigationId}/${safeName}`;
   const { data, error } = await supabase.storage.from('investigation-assets').upload(path, file);
  if (error) throw error;
  const { data: publicData } = await supabase.storage.from('investigation-assets').getPublicUrl(path);
  return (publicData as any)?.publicUrl || null;
}

interface Props {
   isOpen: boolean;
   onClose: () => void;
   investigationId: string;
   initialX?: number;
   initialY?: number;
   onSaved: (card: Record<string, any>) => void;
   existingCard?: any;
}

type ChatSender = 'me' | 'them' | 'system' | string;
interface EditingChatMessage {
   sender: ChatSender;
   type: string;
   text: string;
   image_url?: string | null;
   media?: any;
}

export default function CreateClueModal({ isOpen, onClose, investigationId, initialX, initialY, onSaved, existingCard }: Props) {
  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS

  // ✅ MOUNTED FLAG: prevent setState calls after unmount
  const mountedRef = React.useRef(true);

  const [title, setTitle] = useState('');
  const [descPublic, setDescPublic] = useState('');
  const [descHidden, setDescHidden] = useState('');
  const [tags, setTags] = useState('');
  const [discoveryCode, setDiscoveryCode] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [imgFile, setImgFile] = useState<File | null>(null);
   const [videoFile, setVideoFile] = useState<File | null>(null);
   const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
   const [videoUrl, setVideoUrl] = useState<string | null>(null);
   const [videoUploading, setVideoUploading] = useState<boolean>(false);
   const [videoUrlInput, setVideoUrlInput] = useState<string>('');
   const [videoUploadPromise, setVideoUploadPromise] = useState<Promise<string | null> | null>(null);
   const [uploadErrors, setUploadErrors] = useState<string[]>([]);
   const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uvFile, setUvFile] = useState<File | null>(null);
   const [filterFile, setFilterFile] = useState<File | null>(null);
      const [previewUrl, setPreviewUrl] = useState<string | null>(null);
   const [uvPreviewUrl, setUvPreviewUrl] = useState<string | null>(null);
   const [replaceUv, setReplaceUv] = useState(false);
      const [filterPreviewUrl, setFilterPreviewUrl] = useState<string | null>(null);
      const [filterTransform, setFilterTransform] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
      const [filterInitialImage, setFilterInitialImage] = useState<File | null>(null);
   const [editorMode, setEditorMode] = useState<'uv' | 'filter' | 'rgb' | null>(null);
   const [uvEditorBaseUrl, setUvEditorBaseUrl] = useState<string | null>(null);
   const [uvEditorPurpose, setUvEditorPurpose] = useState<'forensic' | null>(null);

   const [audioBase, setAudioBase] = useState<File | null>(null);
  const [audioHidden, setAudioHidden] = useState<File | null>(null);
   const [audioBasePreview, setAudioBasePreview] = useState<string | null>(null);
   const [audioHiddenPreview, setAudioHiddenPreview] = useState<string | null>(null);
   
   const [audioHiddenUploadedUrl, setAudioHiddenUploadedUrl] = useState<string | null>(null);
   const [audioHiddenUploading, setAudioHiddenUploading] = useState<boolean>(false);
  const [freq, setFreq] = useState(50);
   const [triggerTime, setTriggerTime] = useState<number>(0);
   const [mediaVisibility, setMediaVisibility] = useState({
      audioBase: 'always' as 'always' | 'glitch_only' | 'post_solve',
      audioHidden: 'post_solve' as 'post_solve' | 'post_keyword',
      visual: 'glitch_active' as 'glitch_active' | 'post_keyword',
      uvLayer: 'post_keyword' as 'post_keyword' | 'always' | 'post_solve'
   });
   const [securityLayerEnabled, setSecurityLayerEnabled] = useState(false);
   const [revealLogicMode, setRevealLogicMode] = useState<'always_visible' | 'aligned_only' | 'aligned_keyword'>('aligned_only');
   const [signalTargets, setSignalTargets] = useState({ visual: true, audio: false });
   const [hidePreviewOnBoard, setHidePreviewOnBoard] = useState(false);
   const [audioStaticSync, setAudioStaticSync] = useState(false);
   const [narrativeLinks, setNarrativeLinks] = useState({
      audioHintsVisual: false,
      visualHintsCode: false,
      hintNote: ''
   });

   const handleAudioBaseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      
      // Revoke previous URL
      revokeUrl(audioBasePreview);
      
      // Create and register new URL
      const url = createAndRegisterBlobUrl(file);
      if (url) {
         setAudioBase(file);
         setAudioBasePreview(url);
      }
   };

   const handleAudioHiddenSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      
      // Revoke previous URL
      revokeUrl(audioHiddenPreview);
      
      // Create and register new URL
      const url = createAndRegisterBlobUrl(file);
      if (url) {
         setAudioHidden(file);
         setAudioHiddenPreview(url);
      }
   };
   const [stamp, setStamp] = useState('');
   const [externalLink, setExternalLink] = useState('');

   // Fake metadata fields for FileProperties / EXIF viewer
   const [fakeDate, setFakeDate] = useState('');
   const [fakeLocation, setFakeLocation] = useState('');
   const [technicalNote, setTechnicalNote] = useState('');
   const [fakeMeta, setFakeMeta] = useState<{ date?: string; cam?: string; gps?: string; owner?: string }>({});

   const [showAudioForgeFor, setShowAudioForgeFor] = useState<null | 'hidden' | 'base'>(null);
   const [showMixer, setShowMixer] = useState(false);

   // Chat / Phone viewer states
   const [showChatEditor, setShowChatEditor] = useState(false);
   const [chatJson, setChatJson] = useState<string>('');
   const [chatData, setChatData] = useState<EditingChatMessage[] | null>(null);
   const [chatContactName, setChatContactName] = useState<string>('Desconhecido');
   const [editingChatList, setEditingChatList] = useState<EditingChatMessage[]>([]);
   const fileInputsRef = React.useRef<Record<number, HTMLInputElement | null>>({});
   const [chatUploadProgress, setChatUploadProgress] = useState<Record<number, number>>({});
   const [quickChatText, setQuickChatText] = useState('');
   const [quickChatSender, setQuickChatSender] = useState<ChatSender>('them');
   const [activeTab, setActiveTab] = useState<'geral' | 'visual' | 'audio' | 'cifra' | 'glitch' | 'mega' | 'campos' | 'display'>('geral');
   const [glitchStartShift, setGlitchStartShift] = useState(20);
   const [glitchStartChromatic, setGlitchStartChromatic] = useState(8);

   // FORENSE STATES (RGB Channel Steganography)
   const [forensicBaseImage, setForensicBaseImage] = useState<File | null>(null);
   const [forensicHiddenImage, setForensicHiddenImage] = useState<File | null>(null);
   const [forensicBasePreview, setForensicBasePreview] = useState<string | null>(null);
   const [forensicHiddenPreview, setForensicHiddenPreview] = useState<string | null>(null);
   const [forensicTargetChannel, setForensicTargetChannel] = useState<'R' | 'G' | 'B'>('R');
   const [forensicResultPreview, setForensicResultPreview] = useState<string | null>(null);
   const [forensicProcessing, setForensicProcessing] = useState(false);
   const [showForensicEditor, setShowForensicEditor] = useState(false);
   const [forensicConfig, setForensicConfig] = useState<ForensicConfig | null>(null);
   const [forensicAlwaysOverlay, setForensicAlwaysOverlay] = useState(true);

   // MEGA CLUE STATES
   const [megaFinalTruthText, setMegaFinalTruthText] = useState('');
   const [megaImageFile, setMegaImageFile] = useState<File | null>(null);
   const [megaImagePreview, setMegaImagePreview] = useState<string | null>(null);
   const [megaRequiredPuzzleIds, setMegaRequiredPuzzleIds] = useState<string[]>([]);
   const [availablePuzzles, setAvailablePuzzles] = useState<Array<{ id: string; title: string }>>([]);
   const [megaSelectedPuzzle, setMegaSelectedPuzzle] = useState<string>('');

   // FIELD VISIBILITY CONFIG
   const [fieldVisibilityConfig, setFieldVisibilityConfig] = useState<FieldVisibilityConfig>(defaultFieldVisibility);

   // DISPLAY CONFIG (DisplayConfigPanel options)
   const [displayConfig, setDisplayConfig] = useState({
      puzzle: { showAccessInstructions: true, showHint: true, showCorrectAnswerWhenSolved: false, showRewardCode: true, showLogs: true },
      fileProperties: { showFileType: true, showSize: true, showCameraModel: true, showDate: true, showGPS: true, showOwner: true, showHexComment: false, showStamp: true, showExternalLink: true, showLockStatus: true, showPersonInfo: true },
      media: { showThermalData: false, showUVLayer: false, showFilterOverlay: true, showVideoPlayer: true, showAudioPlayer: true, showHiddenAudio: false, showChatData: true },
      cipher: { showShredded: true, showCipherText: true, showRealText: false, showShredConfig: false },
      megaClue: { showHints: true, showAnswer: false, showProgress: true },
   });

   // LOADING STATE
   const [loading, setLoading] = useState(false);

   // GLITCH PUZZLE - CORRECT SETTINGS
   const [glitchCorrectFrequency, setGlitchCorrectFrequency] = useState(17);
   const [glitchCorrectShift, setGlitchCorrectShift] = useState(33);
   const [glitchCorrectChromatic, setGlitchCorrectChromatic] = useState(12);

   // GLITCH PUZZLE - DIFFICULTY AND TOLERANCE
   const [glitchDifficulty, setGlitchDifficulty] = useState<'easy' | 'normal' | 'hard' | 'custom'>('hard');
   const [glitchToleranceFreq, setGlitchToleranceFreq] = useState(1);
   const [glitchToleranceShift, setGlitchToleranceShift] = useState(2);
   const [glitchToleranceChroma, setGlitchToleranceChroma] = useState(2);

   // GLITCH PUZZLE - FOCUSED IMAGE / DESIGNER
   const [glitchFocusedImageFile, setGlitchFocusedImageFile] = useState<File | null>(null);
   const [glitchFocusedImagePreview, setGlitchFocusedImagePreview] = useState<string | null>(null);
   const [showGlitchDesigner, setShowGlitchDesigner] = useState(false);

   // GLITCH PUZZLE - HIDDEN MEDIA
   const [glitchHiddenAudioUrl, setGlitchHiddenAudioUrl] = useState('');
   const [glitchHiddenVideoUrl, setGlitchHiddenVideoUrl] = useState('');

   // GLITCH PUZZLE - TEXT AND HINT
   const [glitchAccessInstructions, setGlitchAccessInstructions] = useState('');
   const [glitchHint, setGlitchHint] = useState('');
   const [glitchKeyword, setGlitchKeyword] = useState('');

   // GLITCH PUZZLE - UNLOCK MODE AND REWARD
   const [glitchUnlockMode, setGlitchUnlockMode] = useState<'code' | 'code_plus_keyword' | 'media' | 'media_and_code'>('code');
   const [glitchRequireKeyword, setGlitchRequireKeyword] = useState(false);
   const [glitchRewardCode, setGlitchRewardCode] = useState('ALPHA-01');
   const [glitchStartFrequency, setGlitchStartFrequency] = useState(12);

   // FILTER - REVEAL SETTINGS
   const [filterRevealBrightness, setFilterRevealBrightness] = useState(150);
   const [filterRevealContrast, setFilterRevealContrast] = useState(150);
   const [filterRevealSaturate, setFilterRevealSaturate] = useState(100);
   const [showAdvancedFilterSettings, setShowAdvancedFilterSettings] = useState(false);

   // THERMAL EDITOR
   const [thermalEnabled, setThermalEnabled] = useState(false);
   const [thermalSecretText, setThermalSecretText] = useState('');
   const [thermalFontSize, setThermalFontSize] = useState(100);
   const [thermalPositionY, setThermalPositionY] = useState(50);
   const [thermalKeyword, setThermalKeyword] = useState('');
   const [showThermalEditor, setShowThermalEditor] = useState(false);

   // SHREDDED / CIPHER
   const [isShredded, setIsShredded] = useState(false);
   const [shredRows, setShredRows] = useState(1);
   const [shredCols, setShredCols] = useState(8);
   const [realText, setRealText] = useState('');
   const [cipherText, setCipherText] = useState('');

   // HEX VIEWER
   const [hexCode, setHexCode] = useState('');
   // HEX ENCODING OPTIONS
   const [hexEncodingMethod, setHexEncodingMethod] = useState<'plain' | 'utf8hex' | 'xor' | 'enigma'>('plain');
   const [hexEncodingKey, setHexEncodingKey] = useState('');

   // PERSON / DOSSIER
   const [isPerson, setIsPerson] = useState(false);
   const [personName, setPersonName] = useState('');
   const [personDob, setPersonDob] = useState('');
   const [personStatus, setPersonStatus] = useState<'UNKNOWN' | 'ALIVE' | 'DEAD' | 'MISSING'>('UNKNOWN');
   const [personOccupation, setPersonOccupation] = useState('');

   // LOCK / SECURITY (da pista)
   const [isLocked, setIsLocked] = useState(false);
   const [lockPass, setLockPass] = useState('');
   const [lockPasses, setLockPasses] = useState<string[]>([]);

   // PHONE KEYPAD (do celular/PhoneViewer)
   const [phoneHasKeypad, setPhoneHasKeypad] = useState(false);
   const [phonePassword, setPhonePassword] = useState('');
   const [showKeypadEditor, setShowKeypadEditor] = useState(false);
   const [phoneLockType, setPhoneLockType] = useState<'pin' | 'pattern'>('pin');

   // EVIDENCE TYPE
   const [evidenceType, setEvidenceType] = useState<'document' | 'glitch_puzzle' | 'mega_clue'>('document');

   // ========== TEMPLATE SYSTEM ==========
   const [templates, setTemplates] = useState<ClueTemplate[]>([]);
   const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
   const [loadingTemplates, setLoadingTemplates] = useState(false);

   // ✅ MOVE HOOKS BEFORE CONDITIONAL RETURN - MUST BE BEFORE if (!isOpen)
   // Fetch available glitch puzzles when modal opens or evidenceType changes
   useEffect(() => {
      if (isOpen && evidenceType === 'mega_clue') {
         fetchAvailablePuzzles();
      }
   }, [isOpen, evidenceType]);

   useEffect(() => {
      if (!isOpen) return;
      // If an existing card is provided, prefill fields for editing
      if (existingCard) {
         console.debug('CreateClueModal: Loading existing card for edit', existingCard);
         setTitle(existingCard.title || '');
         setDescPublic(existingCard.description_public || '');
         setDescHidden(existingCard.description_hidden || '');
         setTags(existingCard.tags || '');
         setDiscoveryCode(existingCard.discovery_code || '');
         setIsHidden(existingCard.is_hidden || false);
         setIsLocked(existingCard.is_locked || false);
         setLockPass(existingCard.lock_password || '');
         try { setEvidenceType((existingCard.type as any) || 'document'); } catch (e) {}

         // Parse metadata safely
         let parsedMeta: any = {};
         try {
            parsedMeta = typeof existingCard.metadata === 'object' 
               ? existingCard.metadata 
               : (typeof existingCard.metadata === 'string' ? JSON.parse(existingCard.metadata) : {});
         } catch (e) {
            parsedMeta = {};
         }

         // Load security layer settings if glitch puzzle
         if (parsedMeta.glitch_puzzle || parsedMeta.security_layer) {
            setSecurityLayerEnabled(true);
            const glitch = parsedMeta.glitch_puzzle || {};
            if (glitch.unlock_keyword) {
               setGlitchKeyword(glitch.unlock_keyword);
            }
         }

         // Load audio settings from metadata
         if (parsedMeta.audio_target_freq) {
            setFreq(parsedMeta.audio_target_freq);
         }

         // Load shredder configuration from metadata (com fallback robusto)
         const cardIsShredded = existingCard.is_shredded || 
                               parsedMeta?.is_shredded || 
                               (parsedMeta?.shred_rows && parsedMeta?.shred_cols);
         if (cardIsShredded) {
            setIsShredded(true);
            setShredRows(parsedMeta?.shred_rows || 1);
            setShredCols(parsedMeta?.shred_cols || 8);
            console.log('🧩 [Shredder] Carregando configuração:', { 
              is_shredded: true, 
              shred_rows: parsedMeta?.shred_rows || 1, 
              shred_cols: parsedMeta?.shred_cols || 8,
              source: existingCard.is_shredded ? 'column' : 'metadata'
            });
         }

         // previews (we keep URLs, not Files) — register them so revokeUrl won't remove remote URLs
         const imgUrl = existingCard.image_url || (parsedMeta && (parsedMeta.original_image_url || parsedMeta.base_media_url));
         if (imgUrl && imgUrl !== LOCKED_PLACEHOLDER_IMG) {
            setPreviewUrl(imgUrl);
            registerUrl(imgUrl);
         }
         const uvUrl = existingCard.image_uv_url || (parsedMeta && (parsedMeta.uv_layer_url || parsedMeta.hidden_uv_url));
         if (uvUrl) {
            // use forensicHiddenPreview as a place to show existing UV thumbnail in the UI
            setForensicHiddenPreview(uvUrl);
            registerUrl(uvUrl);
         }
         const vidUrl = existingCard.video_url;
         if (vidUrl) {
            setVideoUrl(vidUrl);
            setVideoPreviewUrl(vidUrl);
            registerUrl(vidUrl);
         }
         const audUrl = existingCard.audio_url;
         if (audUrl) {
            setAudioBasePreview(audUrl);
            registerUrl(audUrl);
         }
      } else {
         resetForm();
      }
   }, [isOpen, existingCard]);

   // ✅ CLEANUP AND URL MANAGEMENT
   const urlsRef = React.useRef<Set<string>>(new Set());
   
   /**
    * Helper: Cria um URL de blob, registra no rastreador e retorna a string.
    * Garante limpeza automática em caso de mudanças ou desmontagem.
    */
   const createAndRegisterBlobUrl = (file: File | null): string | null => {
      if (!file) return null;
      try {
         const url = URL.createObjectURL(file);
         urlsRef.current.add(url);
         return url;
      } catch (err) {
         console.error('Failed to create blob URL:', err);
         return null;
      }
   };
   
   const revokeUrl = (url: string | null | undefined) => {
      if (url && urlsRef.current.has(url)) {
         try { URL.revokeObjectURL(url); } catch (err) {}
         urlsRef.current.delete(url);
      }
   };
   
   const registerUrl = (url: string | null | undefined) => {
      if (url) urlsRef.current.add(url);
   };
   
   useEffect(() => {
      if (previewUrl) registerUrl(previewUrl);
      return () => revokeUrl(previewUrl);
   }, [previewUrl]);
   
   useEffect(() => {
      if (videoPreviewUrl) registerUrl(videoPreviewUrl);
      return () => revokeUrl(videoPreviewUrl);
   }, [videoPreviewUrl]);
   
   useEffect(() => {
      if (audioBasePreview) registerUrl(audioBasePreview);
      if (audioHiddenPreview) registerUrl(audioHiddenPreview);
      return () => { revokeUrl(audioBasePreview); revokeUrl(audioHiddenPreview); };
   }, [audioBasePreview, audioHiddenPreview]);
   
   useEffect(() => {
      if (glitchFocusedImagePreview) registerUrl(glitchFocusedImagePreview);
      if (megaImagePreview) registerUrl(megaImagePreview);
         if (filterPreviewUrl) registerUrl(filterPreviewUrl);
         if (uvPreviewUrl) registerUrl(uvPreviewUrl);
         if (forensicHiddenPreview) registerUrl(forensicHiddenPreview);
         return () => { revokeUrl(glitchFocusedImagePreview); revokeUrl(megaImagePreview); revokeUrl(filterPreviewUrl); revokeUrl(uvPreviewUrl); revokeUrl(forensicHiddenPreview); };
   }, [glitchFocusedImagePreview, megaImagePreview, filterPreviewUrl, uvPreviewUrl, forensicHiddenPreview]);
   
   useEffect(() => {
      mountedRef.current = true;
      return () => {
         mountedRef.current = false;
         urlsRef.current.forEach((u) => { 
            try { 
               URL.revokeObjectURL(u); 
            } catch (err) {
               console.warn('URL revoke error on unmount:', err);
            }
         });
         urlsRef.current.clear();
      };
   }, []);

   useEffect(() => {
      if (!isOpen) {
         urlsRef.current.forEach((u) => {
            try {
               URL.revokeObjectURL(u);
            } catch (err) {
               console.warn('URL revoke error on modal close:', err);
            }
         });
         urlsRef.current.clear();
      }
   }, [isOpen]);

   // Filter/overlay interactive hooks - must be before any conditional returns
   useEffect(() => {
      if (!filterFile) return;
      try { if (filterPreviewUrl) URL.revokeObjectURL(filterPreviewUrl); } catch (e) {}
      const url = URL.createObjectURL(filterFile);
      setFilterPreviewUrl(url);
      // default: center overlay covering 50% width/height
      setFilterTransform({ left: 25, top: 25, width: 50, height: 50 });
      return () => { try { URL.revokeObjectURL(url); } catch (e) {} };
   }, [filterFile]);

   // drag / resize refs (must be a hook)
   const draggingRef = React.useRef<{ mode: 'move' | 'resize' | null; startX: number; startY: number; startTransform?: any } | null>(null);
   const filterTransformRef = React.useRef(filterTransform);
   
   // Sync ref com state
   React.useEffect(() => {
      filterTransformRef.current = filterTransform;
   }, [filterTransform]);

   useEffect(() => {
      if (uvFile && uvEditorPurpose === 'forensic') {
         try { revokeUrl(forensicHiddenPreview); } catch (e) {}
         const url = createAndRegisterBlobUrl(uvFile);
         if (url) {
            setForensicHiddenImage(uvFile);
            setForensicHiddenPreview(url);
         }
         setUvEditorPurpose(null);
         // clear uvFile since we've consumed it for forensic
         setUvFile(null);
      }
   }, [uvFile, uvEditorPurpose]);

   useEffect(() => {
      const onMove = (e: MouseEvent) => {
         if (!draggingRef.current || !filterTransformRef.current || !previewUrl) return;
         const rect = document.querySelector('.image-edit-canvas') as HTMLElement | null;
         if (!rect) return;
         const bounds = rect.getBoundingClientRect();
         const start = draggingRef.current;
         const current = filterTransformRef.current;
         
         if (start.mode === 'move') {
            const dx = e.clientX - start.startX;
            const dy = e.clientY - start.startY;
            const newLeft = ((start.startTransform.left / 100) * bounds.width + dx) / bounds.width * 100;
            const newTop = ((start.startTransform.top / 100) * bounds.height + dy) / bounds.height * 100;
            setFilterTransform({ ...current, left: Math.max(0, Math.min(100 - current.width, newLeft)), top: Math.max(0, Math.min(100 - current.height, newTop)) });
         } else if (start.mode === 'resize') {
            const dx = e.clientX - start.startX;
            const dy = e.clientY - start.startY;
            const deltaPctW = (dx / bounds.width) * 100;
            const deltaPctH = (dy / bounds.height) * 100;
            const newW = Math.max(5, Math.min(100 - start.startTransform.left, start.startTransform.width + deltaPctW));
            const newH = Math.max(5, Math.min(100 - start.startTransform.top, start.startTransform.height + deltaPctH));
            setFilterTransform({ ...current, width: newW, height: newH });
         }
      };
      const onUp = () => { draggingRef.current = null; };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
   }, [previewUrl]);

   // Reset form fields when opening the modal to avoid reusing previous values
   const resetForm = () => {
      // basic fields
      setTitle('');
      setDescPublic('');
      setDescHidden('');
      setTags('');
      setDiscoveryCode('');
      setIsHidden(false);

      // files / previews
      setImgFile(null);
      setVideoFile(null);
      try { if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl); } catch(e){}
      setVideoPreviewUrl(null);
      setVideoUrl(null);
      setVideoUploading(false);
      setVideoUrlInput('');
      setUvFile(null);
      setFilterFile(null);
      try { if (filterPreviewUrl) URL.revokeObjectURL(filterPreviewUrl); } catch (e) {}
      setFilterPreviewUrl(null);
      setFilterTransform(null);
      setFilterInitialImage(null);
      setPreviewUrl(null);
      setEditorMode(null);

      // audio
      setAudioBase(null);
      if (audioBasePreview) { try { URL.revokeObjectURL(audioBasePreview); } catch(e){} }
      setAudioHidden(null);
      if (audioHiddenPreview) { try { URL.revokeObjectURL(audioHiddenPreview); } catch(e){} }
      setAudioHiddenUploadedUrl(null);
      setFreq(50);
      setAudioBasePreview(null);
      setAudioHiddenPreview(null);
      setMediaVisibility({ audioBase: 'always', audioHidden: 'post_solve', visual: 'glitch_active', uvLayer: 'post_keyword' });
      setSecurityLayerEnabled(false);
      setRevealLogicMode('aligned_only');
      setSignalTargets({ visual: true, audio: false });
      setHidePreviewOnBoard(false);
      setAudioStaticSync(false);
      setNarrativeLinks({ audioHintsVisual: false, visualHintsCode: false, hintNote: '' });

      // basic flags (pista)
      setIsLocked(false);
      setLockPass('');
      setLockPasses([]);
      
      // phone keypad
      setPhoneHasKeypad(false);
      setPhonePassword('');
      setShowKeypadEditor(false);
      
      setFilterRevealBrightness(150);
      setFilterRevealContrast(150);
      setFilterRevealSaturate(100);
      setShowAdvancedFilterSettings(false);
      setThermalEnabled(false);
      setThermalSecretText('');
      setThermalKeyword('');
      setThermalFontSize(100);
      setThermalPositionY(50);
      setShowThermalEditor(false);

      // stamp / external
      setStamp('');
      setExternalLink('');

      // fake metadata
      setFakeDate('');
      setFakeLocation('');
      setTechnicalNote('');
      setFakeMeta({});

      // audio/tools states
      setShowAudioForgeFor(null);
      setActiveTab('geral');

      // chat / phone states
      setShowChatEditor(false);
      setChatJson('');
      setChatData(null);
      setChatContactName('Desconhecido');
      setEditingChatList([]);
      setQuickChatText('');
      setQuickChatSender('them');

      // person dossier
      setIsPerson(false);
      setPersonName('');
      setPersonDob('');
      setPersonStatus('UNKNOWN');
      setPersonOccupation('');

      // shredded / cipher
      setIsShredded(false);
      setShredRows(1);
      setShredCols(8);
      setRealText('');
      setCipherText('');

      // hex viewer
      setHexCode('');

      // evidence type and puzzle-specific fields
      setEvidenceType('document');
      setGlitchCorrectFrequency(17);
      setGlitchCorrectShift(33);
      setGlitchCorrectChromatic(12);
      setGlitchRewardCode('ALPHA-01');
      setGlitchKeyword('');
      setGlitchRequireKeyword(false);
      setGlitchUnlockMode('code');
      setGlitchDifficulty('hard');
      setGlitchToleranceFreq(1);
      setGlitchToleranceShift(2);
      setGlitchToleranceChroma(2);
      setGlitchFocusedImageFile(null);
      if (glitchFocusedImagePreview) { try { URL.revokeObjectURL(glitchFocusedImagePreview); } catch(e){} }
      setGlitchFocusedImagePreview(null);
      setShowGlitchDesigner(false);
      setGlitchHiddenAudioUrl('');
      setGlitchHiddenVideoUrl('');
      setGlitchHint('');
      setGlitchAccessInstructions('');
      setGlitchStartFrequency(12);
      setGlitchStartShift(20);
      setGlitchStartChromatic(8);

      setMegaFinalTruthText('');
      setMegaImageFile(null);
      if (megaImagePreview) { try { URL.revokeObjectURL(megaImagePreview); } catch(e){} }
      setMegaImagePreview(null);
      setMegaRequiredPuzzleIds([]);

      // Reset field visibility config to default
      setFieldVisibilityConfig(defaultFieldVisibility);
      
      // Reset display config to default
      setDisplayConfig({
         puzzle: { showAccessInstructions: true, showHint: true, showCorrectAnswerWhenSolved: false, showRewardCode: true, showLogs: true },
         fileProperties: { showFileType: true, showSize: true, showCameraModel: true, showDate: true, showGPS: true, showOwner: true, showHexComment: false, showStamp: true, showExternalLink: true, showLockStatus: true, showPersonInfo: true },
         media: { showThermalData: false, showUVLayer: false, showFilterOverlay: true, showVideoPlayer: true, showAudioPlayer: true, showHiddenAudio: false, showChatData: true },
         cipher: { showShredded: true, showCipherText: true, showRealText: false, showShredConfig: false },
         megaClue: { showHints: true, showAnswer: false, showProgress: true },
      });
   };

      const composeVisibleOverlay = async (baseImage: File, hiddenImage: File): Promise<Blob | null> => {
         return new Promise((resolve) => {
            const baseImg = new Image();
            const hiddenImg = new Image();
            let loaded = 0;
            const tryResolve = () => {
               try {
                  const canvas = document.createElement('canvas');
                  canvas.width = baseImg.width;
                  canvas.height = baseImg.height;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) { resolve(null); return; }

                  // Draw base
                  ctx.drawImage(baseImg, 0, 0);

                  // Draw hidden resized to base, using a blend so it's visible (RGB output)
                  const tmp = document.createElement('canvas');
                  tmp.width = baseImg.width;
                  tmp.height = baseImg.height;
                  const tctx = tmp.getContext('2d');
                  if (!tctx) { resolve(null); return; }
                  tctx.drawImage(hiddenImg, 0, 0, baseImg.width, baseImg.height);

                  // Draw the hidden image over the base with a blend to guarantee visibility
                  ctx.globalCompositeOperation = 'screen';
                  ctx.drawImage(tmp, 0, 0);
                  ctx.globalCompositeOperation = 'source-over';

                  canvas.toBlob((blob) => resolve(blob), 'image/png');
               } catch (err) {
                  console.error('Erro ao compor overlay visível:', err);
                  resolve(null);
               }
            };

            baseImg.onload = () => { loaded++; if (loaded === 2) tryResolve(); };
            hiddenImg.onload = () => { loaded++; if (loaded === 2) tryResolve(); };
            baseImg.onerror = () => resolve(null);
            hiddenImg.onerror = () => resolve(null);

            baseImg.src = URL.createObjectURL(baseImage);
            hiddenImg.src = URL.createObjectURL(hiddenImage);
         });
      };

   /**
    * Processa duas imagens para realizar steganografia em canal RGB
    * A imagem oculta (em escala de cinza) é escrita no canal alvo (R, G ou B)
    * mantendo os outros dois canais da imagem base intactos
    */
   const processRGBMerge = async (baseImage: File, hiddenImage: File, targetChannel: 'R' | 'G' | 'B'): Promise<Blob | null> => {
      return new Promise((resolve) => {
         const baseImg = new Image();
         const hiddenImg = new Image();
         let loadedCount = 0;

         const onBothLoaded = () => {
            try {
               // Criar canvas com dimensões da imagem base
               const canvas = document.createElement('canvas');
               canvas.width = baseImg.width;
               canvas.height = baseImg.height;
               const ctx = canvas.getContext('2d');
               if (!ctx) { resolve(null); return; }

               // Desenhar imagem base
               ctx.drawImage(baseImg, 0, 0);
               const baseData = ctx.getImageData(0, 0, baseImg.width, baseImg.height);

               // Criar canvas temporário para escala de cinza da imagem oculta
               const tempCanvas = document.createElement('canvas');
               tempCanvas.width = hiddenImg.width;
               tempCanvas.height = hiddenImg.height;
               const tempCtx = tempCanvas.getContext('2d');
               if (!tempCtx) { resolve(null); return; }
               tempCtx.drawImage(hiddenImg, 0, 0);
               const hiddenData = tempCtx.getImageData(0, 0, hiddenImg.width, hiddenImg.height);

               // Converter imagem oculta para escala de cinza
               for (let i = 0; i < hiddenData.data.length; i += 4) {
                  const r = hiddenData.data[i];
                  const g = hiddenData.data[i + 1];
                  const b = hiddenData.data[i + 2];
                  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                  hiddenData.data[i] = gray;
                  hiddenData.data[i + 1] = gray;
                  hiddenData.data[i + 2] = gray;
               }

               // Redimensionar imagem oculta para caber na base se necessário
               let finalHiddenData = hiddenData;
               if (hiddenImg.width !== baseImg.width || hiddenImg.height !== baseImg.height) {
                  const resizeCanvas = document.createElement('canvas');
                  resizeCanvas.width = baseImg.width;
                  resizeCanvas.height = baseImg.height;
                  const resizeCtx = resizeCanvas.getContext('2d');
                  if (!resizeCtx) { resolve(null); return; }
                  resizeCtx.drawImage(hiddenImg, 0, 0, baseImg.width, baseImg.height);
                  const resized = resizeCtx.getImageData(0, 0, baseImg.width, baseImg.height);
                  // Converter para cinza
                  for (let i = 0; i < resized.data.length; i += 4) {
                     const r = resized.data[i];
                     const g = resized.data[i + 1];
                     const b = resized.data[i + 2];
                     const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                     resized.data[i] = gray;
                     resized.data[i + 1] = gray;
                     resized.data[i + 2] = gray;
                  }
                  finalHiddenData = resized;
               }

               // Mesclar: colocar dados de cinza no canal alvo
               const channelIndex = targetChannel === 'R' ? 0 : targetChannel === 'G' ? 1 : 2;
               for (let i = 0; i < baseData.data.length; i += 4) {
                  baseData.data[i + channelIndex] = finalHiddenData.data[i]; // Usar valor de cinza
               }

               // Atualizar canvas com dados mesclados
               ctx.putImageData(baseData, 0, 0);

               // Converter canvas para blob
               canvas.toBlob((blob) => {
                  resolve(blob);
               }, 'image/png');
            } catch (err) {
               console.error('Erro ao processar RGB merge:', err);
               resolve(null);
            }
         };

         baseImg.onload = () => {
            loadedCount++;
            if (loadedCount === 2) onBothLoaded();
         };

         hiddenImg.onload = () => {
            loadedCount++;
            if (loadedCount === 2) onBothLoaded();
         };

         baseImg.onerror = () => resolve(null);
         hiddenImg.onerror = () => resolve(null);

         baseImg.src = URL.createObjectURL(baseImage);
         hiddenImg.src = URL.createObjectURL(hiddenImage);
      });
   };

   // ========== TEMPLATE MANAGEMENT FUNCTIONS ==========
   
   /**
    * Fetch available templates when the modal opens
    */
   const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
         const data = await fetchClueTemplates();
         setTemplates(data);
      } catch (error) {
         console.error('Error loading templates:', error);
         alert('Erro ao carregar templates. Veja o console para detalhes.');
      } finally {
         setLoadingTemplates(false);
      }
   };

   /**
    * Capture current form state and save as template
    */
   const handleSaveAsTemplate = async () => {
      const templateName = window.prompt('Digite um nome para este template:');
      if (!templateName || templateName.trim() === '') {
         return;
      }

      const description = window.prompt('(Opcional) Digite uma descrição:');

      // Capture current form state
      const currentState = {
         // Basic fields
         title,
         descPublic,
         descHidden,
         tags,
         
         // Evidence type
         evidenceType,
         
         // Metadata fields
         fakeDate,
         fakeLocation,
         technicalNote,
         fakeMeta,
         stamp,
         externalLink,
         
         // Media visibility
         mediaVisibility,
         securityLayerEnabled,
         revealLogicMode,
         signalTargets,
         hidePreviewOnBoard,
         audioStaticSync,
         narrativeLinks,
         
         // Audio settings
         freq,
         triggerTime,
         
         // Lock settings
         isLocked,
         lockPass,
         
         // Phone settings
         phoneHasKeypad,
         phonePassword,
         phoneLockType,
         
         // Chat data
         chatContactName,
         chatData,
         editingChatList,
         
         // Thermal
         thermalEnabled,
         thermalSecretText,
         thermalFontSize,
         thermalPositionY,
         thermalKeyword,
         
         // Cipher/Shred
         isShredded,
         shredRows,
         shredCols,
         realText,
         cipherText,
         
         // Person/Dossier
         isPerson,
         personName,
         personDob,
         personStatus,
         personOccupation,
         
         // Glitch Puzzle settings
         glitchStartFrequency,
         glitchStartShift,
         glitchStartChromatic,
         glitchCorrectFrequency,
         glitchCorrectShift,
         glitchCorrectChromatic,
         glitchDifficulty,
         glitchToleranceFreq,
         glitchToleranceShift,
         glitchToleranceChroma,
         glitchAccessInstructions,
         glitchHint,
         glitchKeyword,
         glitchUnlockMode,
         glitchRequireKeyword,
         glitchRewardCode,
         glitchHiddenAudioUrl,
         glitchHiddenVideoUrl,
         
         // Filter settings
         filterRevealBrightness,
         filterRevealContrast,
         filterRevealSaturate,
         filterTransform,
         
         // Forensic
         forensicTargetChannel,
         
         // Mega Clue
         megaFinalTruthText,
         megaRequiredPuzzleIds,
         
         // Field visibility config
         fieldVisibilityConfig,
         
         // Display config
         displayConfig,
      };

      // Sanitize to remove Files, Blobs, and blob URLs
      const sanitizedData = sanitizeTemplateData(currentState);

      try {
         const newTemplate = await createClueTemplate({
            name: templateName.trim(),
            description: description?.trim() || undefined,
            template_data: sanitizedData,
            is_public: false,
         });

         // Refresh template list
         await loadTemplates();
         
         alert(`✅ Template "${templateName}" salvo com sucesso!`);
      } catch (error) {
         console.error('Error saving template:', error);
         alert('❌ Erro ao salvar template. Veja o console para detalhes.');
      }
   };

   /**
    * Load a template and populate the form
    */
   const handleLoadTemplate = (template: ClueTemplate) => {
      const confirmed = window.confirm(
         `Carregar o template "${template.name}" substituirá todos os campos atuais do formulário.\n\nDeseja continuar?`
      );
      
      if (!confirmed) {
         return;
      }

      const data = template.template_data;

      // Apply all saved values to form state
      if (data.title !== undefined) setTitle(data.title);
      if (data.descPublic !== undefined) setDescPublic(data.descPublic);
      if (data.descHidden !== undefined) setDescHidden(data.descHidden);
      if (data.tags !== undefined) setTags(data.tags);
      
      if (data.evidenceType !== undefined) setEvidenceType(data.evidenceType);
      
      if (data.fakeDate !== undefined) setFakeDate(data.fakeDate);
      if (data.fakeLocation !== undefined) setFakeLocation(data.fakeLocation);
      if (data.technicalNote !== undefined) setTechnicalNote(data.technicalNote);
      if (data.fakeMeta !== undefined) setFakeMeta(data.fakeMeta);
      if (data.stamp !== undefined) setStamp(data.stamp);
      if (data.externalLink !== undefined) setExternalLink(data.externalLink);
      
      if (data.mediaVisibility !== undefined) setMediaVisibility(data.mediaVisibility);
      if (data.securityLayerEnabled !== undefined) setSecurityLayerEnabled(data.securityLayerEnabled);
      if (data.revealLogicMode !== undefined) setRevealLogicMode(data.revealLogicMode);
      if (data.signalTargets !== undefined) setSignalTargets(data.signalTargets);
      if (data.hidePreviewOnBoard !== undefined) setHidePreviewOnBoard(data.hidePreviewOnBoard);
      if (data.audioStaticSync !== undefined) setAudioStaticSync(data.audioStaticSync);
      if (data.narrativeLinks !== undefined) setNarrativeLinks(data.narrativeLinks);
      
      if (data.freq !== undefined) setFreq(data.freq);
      if (data.triggerTime !== undefined) setTriggerTime(data.triggerTime);
      
      if (data.isLocked !== undefined) setIsLocked(data.isLocked);
      if (data.lockPass !== undefined) setLockPass(data.lockPass);
      if (data.lockPasses !== undefined) setLockPasses(data.lockPasses);
      if (!data.lockPasses && data.metadata && data.metadata.mega_clue && data.metadata.mega_clue.required_codes) setLockPasses(data.metadata.mega_clue.required_codes || []);
      
      if (data.phoneHasKeypad !== undefined) setPhoneHasKeypad(data.phoneHasKeypad);
      if (data.phonePassword !== undefined) setPhonePassword(data.phonePassword);
      if (data.phoneLockType !== undefined) setPhoneLockType(data.phoneLockType);
      
      if (data.chatContactName !== undefined) setChatContactName(data.chatContactName);
      if (data.chatData !== undefined) setChatData(data.chatData);
      if (data.editingChatList !== undefined) setEditingChatList(data.editingChatList);
      
      if (data.thermalEnabled !== undefined) setThermalEnabled(data.thermalEnabled);
      if (data.thermalSecretText !== undefined) setThermalSecretText(data.thermalSecretText);
      if (data.thermalFontSize !== undefined) setThermalFontSize(data.thermalFontSize);
      if (data.thermalPositionY !== undefined) setThermalPositionY(data.thermalPositionY);
      if (data.thermalKeyword !== undefined) setThermalKeyword(data.thermalKeyword);
      
      if (data.isShredded !== undefined) setIsShredded(data.isShredded);
      if (data.shredRows !== undefined) setShredRows(data.shredRows);
      if (data.shredCols !== undefined) setShredCols(data.shredCols);
      if (data.realText !== undefined) setRealText(data.realText);
      if (data.cipherText !== undefined) setCipherText(data.cipherText);
      
      if (data.isPerson !== undefined) setIsPerson(data.isPerson);
      if (data.personName !== undefined) setPersonName(data.personName);
      if (data.personDob !== undefined) setPersonDob(data.personDob);
      if (data.personStatus !== undefined) setPersonStatus(data.personStatus);
      if (data.personOccupation !== undefined) setPersonOccupation(data.personOccupation);
      
      if (data.glitchStartFrequency !== undefined) setGlitchStartFrequency(data.glitchStartFrequency);
      if (data.glitchStartShift !== undefined) setGlitchStartShift(data.glitchStartShift);
      if (data.glitchStartChromatic !== undefined) setGlitchStartChromatic(data.glitchStartChromatic);
      if (data.glitchCorrectFrequency !== undefined) setGlitchCorrectFrequency(data.glitchCorrectFrequency);
      if (data.glitchCorrectShift !== undefined) setGlitchCorrectShift(data.glitchCorrectShift);
      if (data.glitchCorrectChromatic !== undefined) setGlitchCorrectChromatic(data.glitchCorrectChromatic);
      if (data.glitchDifficulty !== undefined) setGlitchDifficulty(data.glitchDifficulty);
      if (data.glitchToleranceFreq !== undefined) setGlitchToleranceFreq(data.glitchToleranceFreq);
      if (data.glitchToleranceShift !== undefined) setGlitchToleranceShift(data.glitchToleranceShift);
      if (data.glitchToleranceChroma !== undefined) setGlitchToleranceChroma(data.glitchToleranceChroma);
      if (data.glitchAccessInstructions !== undefined) setGlitchAccessInstructions(data.glitchAccessInstructions);
      if (data.glitchHint !== undefined) setGlitchHint(data.glitchHint);
      if (data.glitchKeyword !== undefined) setGlitchKeyword(data.glitchKeyword);
      if (data.glitchUnlockMode !== undefined) setGlitchUnlockMode(data.glitchUnlockMode);
      if (data.glitchRequireKeyword !== undefined) setGlitchRequireKeyword(data.glitchRequireKeyword);
      if (data.glitchRewardCode !== undefined) setGlitchRewardCode(data.glitchRewardCode);
      if (data.glitchHiddenAudioUrl !== undefined) setGlitchHiddenAudioUrl(data.glitchHiddenAudioUrl);
      if (data.glitchHiddenVideoUrl !== undefined) setGlitchHiddenVideoUrl(data.glitchHiddenVideoUrl);
      
      if (data.filterRevealBrightness !== undefined) setFilterRevealBrightness(data.filterRevealBrightness);
      if (data.filterRevealContrast !== undefined) setFilterRevealContrast(data.filterRevealContrast);
      if (data.filterRevealSaturate !== undefined) setFilterRevealSaturate(data.filterRevealSaturate);
      if (data.filterTransform !== undefined) setFilterTransform(data.filterTransform);
      
      if (data.forensicTargetChannel !== undefined) setForensicTargetChannel(data.forensicTargetChannel);
      
      if (data.megaFinalTruthText !== undefined) setMegaFinalTruthText(data.megaFinalTruthText);
      if (data.megaRequiredPuzzleIds !== undefined) setMegaRequiredPuzzleIds(data.megaRequiredPuzzleIds);
      
      if (data.fieldVisibilityConfig !== undefined) setFieldVisibilityConfig(data.fieldVisibilityConfig);
      if (data.displayConfig !== undefined) setDisplayConfig(data.displayConfig);

      setShowTemplateDropdown(false);
      alert(`✅ Template "${template.name}" carregado com sucesso!`);
   };

   /**
    * Delete a template
    */
   const handleDeleteTemplate = async (templateId: string, templateName: string) => {
      const confirmed = window.confirm(
         `Tem certeza que deseja deletar o template "${templateName}"?\n\nEsta ação não pode ser desfeita.`
      );
      
      if (!confirmed) {
         return;
      }

      try {
         await deleteClueTemplate(templateId);
         await loadTemplates();
         alert(`✅ Template "${templateName}" deletado com sucesso!`);
      } catch (error) {
         console.error('Error deleting template:', error);
         alert('❌ Erro ao deletar template. Veja o console para detalhes.');
      }
   };

   // Load templates when modal opens
   useEffect(() => {
      if (isOpen) {
         loadTemplates();
      }
   }, [isOpen]);

   // CONDITIONAL RETURN AFTER ALL HOOKS
   if (!isOpen) return null;

   const applyGlitchDifficulty = (level: 'easy' | 'normal' | 'hard' | 'custom') => {
      setGlitchDifficulty(level);
      if (level === 'easy') {
         setGlitchToleranceFreq(5);
         setGlitchToleranceShift(5);
         setGlitchToleranceChroma(5);
      } else if (level === 'normal') {
         setGlitchToleranceFreq(3);
         setGlitchToleranceShift(3);
         setGlitchToleranceChroma(3);
      } else if (level === 'hard') {
         setGlitchToleranceFreq(1);
         setGlitchToleranceShift(2);
         setGlitchToleranceChroma(2);
      }
   };

   // Helper: sanitize metadata to ensure it's JSON-serializable before sending to server
   const sanitizeForMetadata = (input: any, maxDepth = 6) => {
      const seen = new WeakSet();
      const sanitize = (val: any, depth: number): any => {
         if (depth <= 0) return null;
         if (val === null || val === undefined) return null;
         if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
         if (val instanceof Date) return val.toISOString();
         if (val instanceof File || (typeof File !== 'undefined' && val && val.constructor && val.constructor.name === 'File')) {
            return { __file: true, name: val.name, size: val.size, type: val.type };
         }
         if (Array.isArray(val)) return val.map(v => sanitize(v, depth - 1));
         if (typeof val === 'object') {
            if (seen.has(val)) return null; // circular
            seen.add(val);
            const out: any = {};
            for (const k of Object.keys(val)) {
               try {
                  out[k] = sanitize((val as any)[k], depth - 1);
               } catch (e) {
                  out[k] = null;
               }
            }
            return out;
         }
         // fallback: stringify small values
         try { return String(val); } catch { return null; }
      };
      return sanitize(input, maxDepth);
   };

      // --- Hex encoding helpers ---
      const bytesToHex = (bytes: Uint8Array) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const textToUtf8Bytes = (s: string) => {
         try { return new TextEncoder().encode(s); } catch { return new Uint8Array([]); }
      };

      const textToHex = (s: string) => bytesToHex(textToUtf8Bytes(s));

      const xorEncode = (text: string, key: string) => {
         if (!key) return textToHex(text);
         const data = textToUtf8Bytes(text);
         const k = textToUtf8Bytes(key);
         if (k.length === 0) return textToHex(text);
         const out = new Uint8Array(data.length);
         for (let i = 0; i < data.length; i++) out[i] = data[i] ^ k[i % k.length];
         return bytesToHex(out);
      };

      // Simple Enigma-like implementation over A-Z (non-letters are passed through)
      const simpleEnigmaTransform = (text: string, key: string) => {
         const A = 65;
         // basic rotor wirings (as offsets)
         const rotorWires = [
            'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
            'AJDKSIRUXBLHWTMCQGZNPYFVOE',
            'BDFHJLCPRTXVZNYEIWGAKMUSQO'
         ];
         const reflector = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';

         // initialize rotor positions from key bytes (sum modulo 26)
         const keyBytes = textToUtf8Bytes(key || '');
         const pos = [0,0,0];
         for (let i = 0; i < keyBytes.length; i++) {
            pos[i % 3] = (pos[i % 3] + keyBytes[i]) % 26;
         }

         const encodeChar = (ch: string) => {
            const code = ch.charCodeAt(0);
            const isUpper = code >= 65 && code <= 90;
            const isLower = code >= 97 && code <= 122;
            if (!isUpper && !isLower) return ch;
            const base = isUpper ? 65 : 97;
            let c = code - base;

            // forward through rotors
            for (let r = 0; r < 3; r++) {
               const wiring = rotorWires[r];
               const idx = (c + pos[r]) % 26;
               const mapped = wiring.charCodeAt(idx) - A;
               c = (mapped - pos[r] + 26) % 26;
            }

            // reflector
            c = reflector.charCodeAt(c) - A;

            // back through rotors (inverse)
            for (let r = 2; r >= 0; r--) {
               const wiring = rotorWires[r];
               // find index where wiring[index] === char
               const letter = String.fromCharCode(A + c);
               const idx = wiring.indexOf(letter);
               c = (idx - pos[r] + 26) % 26;
            }

            // step rotors (simple stepping)
            pos[0] = (pos[0] + 1) % 26;
            if (pos[0] === 0) { pos[1] = (pos[1] + 1) % 26; if (pos[1] === 0) pos[2] = (pos[2] + 1) % 26; }

            return String.fromCharCode(base + c);
         };

         let out = '';
         for (const ch of text) out += encodeChar(ch);
         return out;
      };

      const encodeHexForMetadata = (text: string, method: 'plain' | 'utf8hex' | 'xor' | 'enigma', key: string) => {
         if (!text) return '';
         switch (method) {
            case 'plain':
               return text;
            case 'utf8hex':
               return textToHex(text);
            case 'xor':
               return xorEncode(text, key || 'key');
            case 'enigma': {
               const transformed = simpleEnigmaTransform(text, key || '');
               return textToHex(transformed);
            }
            default:
               return text;
         }
      };

   // HANDLERS FORENSE (RGB Channel Steganography)
   const handleForensicBaseImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      revokeUrl(forensicBasePreview);
      const url = createAndRegisterBlobUrl(file);
      if (url) {
         setForensicBaseImage(file);
         setForensicBasePreview(url);
      }
   };

   const handleForensicHiddenImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      revokeUrl(forensicHiddenPreview);
      const url = createAndRegisterBlobUrl(file);
      if (url) {
         setForensicHiddenImage(file);
         setForensicHiddenPreview(url);
      }
   };

   const handleProcessForensicMerge = async () => {
      if (!forensicBaseImage || !forensicHiddenImage) {
         alert('Por favor, selecione ambas as imagens (Base e Oculta)');
         return;
      }
      
      setForensicProcessing(true);
      try {
         const resultBlob = forensicAlwaysOverlay
            ? await composeVisibleOverlay(forensicBaseImage, forensicHiddenImage)
            : await processRGBMerge(forensicBaseImage, forensicHiddenImage, forensicTargetChannel);
         if (resultBlob) {
            const resultUrl = createAndRegisterBlobUrl(resultBlob as any);
            if (resultUrl) {
               revokeUrl(forensicResultPreview);
               setForensicResultPreview(resultUrl);
            }
         } else {
            alert('Erro ao processar imagens. Verifique se são PNG ou JPEG válidas.');
         }
      } catch (err) {
         console.error('Erro ao processar merge RGB:', err);
         alert('Erro ao processar. Veja o console para detalhes.');
      } finally {
         setForensicProcessing(false);
      }
   };

   const handleUseForensicImage = async () => {
      if (!forensicResultPreview) {
         alert('Processe as imagens primeiro');
         return;
      }

      try {
         // Converter data URL para blob
         const response = await fetch(forensicResultPreview);
         const blob = await response.blob();
         
         // Criar um File a partir do blob
         const timestamp = Date.now();
         const newFile = new File([blob], `forensic_${forensicTargetChannel}_${timestamp}.png`, { type: 'image/png' });
         
         // Atualizar estado principal e preview
         setImgFile(newFile);
         const previewUrl = createAndRegisterBlobUrl(newFile);
         if (previewUrl) {
            revokeUrl(previewUrl);
            setPreviewUrl(previewUrl);
         }
         
         alert('✅ Imagem forense usada como imagem principal!');
         setActiveTab('visual'); // Voltar para aba visual
      } catch (err) {
         console.error('Erro ao usar imagem forense:', err);
         alert('Erro ao integrar imagem. Veja o console.');
      }
   };

   // Fetch available glitch puzzles from the database
   const fetchAvailablePuzzles = async () => {
      try {
         const { data, error } = await supabase
            .from('investigation_cards')
            .select('id, title, metadata')
            .eq('investigation_id', investigationId)
            .eq('type', 'glitch_puzzle') as any;
         
         if (error) {
            console.error('Erro ao buscar puzzles:', error);
            return;
         }

         const puzzles = (data || []).map((card: any) => ({ id: card.id, title: card.title }));
         setAvailablePuzzles(puzzles);
      } catch (err) {
         console.error('fetchAvailablePuzzles error:', err);
      }
   };



   const handleSave = async () => {
       // Centralized validation
          const validationErrors = validateCreateClue({
             title,
             isHidden,
             discoveryCode,
             securityLayerEnabled,
             evidenceType,
             megaFinalTruthText,
             megaRequiredPuzzleIds,
             imgFile,
             previewUrl,
             videoFile,
             videoUrlInput: videoUrlInput || videoUrl,
             audioBase,
          });

       if (validationErrors.length > 0) {
         setFormErrors(validationErrors);
         return;
       }
       setFormErrors([]);
      
          // Determine whether security layer behavior applies
          const wantsSecurityLayer = Boolean(securityLayerEnabled) || evidenceType === 'glitch_puzzle';

          setLoading(true);
    const errors: string[] = [];

    try {
      // Aguardar upload de vídeo em andamento
      if (videoUploadPromise) {
         try {
            await videoUploadPromise;
         } catch (e) {
            errors.push(`Upload de vídeo falhou: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
         }
      }

      let imgUrl = null;
      let uvUrl = null;
      let filterUrl = null;
      
      try {
         if (imgFile) {
            imgUrl = await uploadInvestigationImage(imgFile, investigationId, (progress) => {
               if (mountedRef.current) {
                  setUploadProgress(prev => ({ ...prev, image: progress }));
               }
            });
         }
      } catch (e) {
         errors.push(`Imagem principal: ${e instanceof Error ? e.message : 'Falha no upload'}`);
      }

      // Preserve existing image URL when editing and no new imgFile was uploaded
      if (!imgUrl && existingCard) {
         imgUrl = existingCard.image_url || existingCard.metadata?.original_image_url || existingCard.metadata?.base_media_url || null;
      }
      
      try {
         if (uvFile) {
            uvUrl = await uploadInvestigationImage(uvFile, investigationId, (progress) => {
               if (mountedRef.current) {
                  setUploadProgress(prev => ({ ...prev, uv: progress }));
               }
            });
         }
      } catch (e) {
         errors.push(`Camada UV: ${e instanceof Error ? e.message : 'Falha no upload'}`);
      }
      
      try {
         if (filterFile) {
            filterUrl = await uploadInvestigationImage(filterFile, investigationId, (progress) => {
               if (mountedRef.current) {
                  setUploadProgress(prev => ({ ...prev, filter: progress }));
               }
            });
         }
      } catch (e) {
         errors.push(`Camada de filtro: ${e instanceof Error ? e.message : 'Falha no upload'}`);
      }
      
      // Prefer video URL input if provided, otherwise use uploaded video URL
      let finalVideoUrl: string | null = videoUrlInput || videoUrl || null;
      if (!finalVideoUrl && videoFile) {
         try {
            finalVideoUrl = await uploadInvestigationFile(videoFile, investigationId, videoFile.name.split('.').pop() || 'mp4');
         } catch (e) {
            errors.push(`Vídeo (fallback): ${e instanceof Error ? e.message : 'Falha no upload'}`);
            finalVideoUrl = null;
         }
      }

      // Verificar se há erros críticos
      if (errors.length > 0) {
         const errorMsg = `⚠️ Erros durante upload:\n${errors.join('\n')}\n\nDeseja continuar mesmo assim?`;
         const shouldContinue = window.confirm(errorMsg);
         if (!shouldContinue) {
            setLoading(false);
            return;
         }
      }

         let audUrl = null;
         let audHidUrl = null;
         if (audioBase) audUrl = await uploadAudio(audioBase, investigationId);
         // if we already uploaded hidden audio via SpectrogramCreator, use that URL
         if (audioHiddenUploadedUrl) {
            audHidUrl = audioHiddenUploadedUrl;
         } else if (audioHidden) {
            audHidUrl = await uploadAudio(audioHidden, investigationId);
         }

         // Upload glitch puzzle focused/hidden layer if provided
         let glitchFocusedUrl = null;
         if (glitchFocusedImageFile) {
            glitchFocusedUrl = await uploadInvestigationImage(glitchFocusedImageFile, investigationId);
         }

         // Upload mega clue image if needed
         let megaImageUrl = null;
         if (evidenceType === 'mega_clue' && megaImageFile) {
            megaImageUrl = await uploadInvestigationImage(megaImageFile, investigationId);
         }

         const revealRequiresKeyword = revealLogicMode === 'aligned_keyword' || glitchRequireKeyword;
         const baseMediaType = finalVideoUrl ? 'video' : audUrl ? 'audio' : imgUrl ? 'image' : 'unknown';
         const baseMediaUrl = finalVideoUrl || audUrl || imgUrl || null;
         const resolvedUnlockMode = revealLogicMode === 'aligned_keyword'
            ? 'code_plus_keyword'
            : revealLogicMode === 'always_visible'
               ? 'media'
               : glitchUnlockMode;
          const resolvedCardType = (() => {
           if (evidenceType === 'mega_clue') return 'mega_clue';
           if (evidenceType === 'glitch_puzzle') return 'glitch_puzzle';
           if (wantsSecurityLayer) {
              if (finalVideoUrl) return 'encrypted_video';
              if (audUrl || audioBase) return 'locked_audio';
              // consider existing image URL as valid base media for glitch puzzles
              if (imgUrl) return 'glitch_puzzle';
           }
           return evidenceType === 'document' ? null : evidenceType;
         })();

         // ✅ FIX: Glitch puzzles need the real image URL, not a placeholder
         // The glitch effect is applied in the frontend when viewing, not when saving
         const boardImageUrl = (wantsSecurityLayer || hidePreviewOnBoard) && evidenceType !== 'glitch_puzzle' 
           ? LOCKED_PLACEHOLDER_IMG 
           : (imgUrl || (existingCard ? (existingCard.image_url || existingCard.metadata?.original_image_url || null) : null));

         const metadata: Record<string, any> = {};
         metadata.image_filter_reveal = {
              brightness: filterRevealBrightness,
              contrast: filterRevealContrast,
              saturate: filterRevealSaturate
         };
         // NOTE: Field values (date, location, owner, etc.) are now stored in metadata.field_values below
         // Do NOT add them here - they should only appear in field_values
         
         // optional external link + qr
         if (externalLink) metadata.external_link = externalLink;
        // hex code for HexViewer (encoded according to selection)
        if (hexCode) {
           try {
              metadata.hex_code = encodeHexForMetadata(hexCode, hexEncodingMethod, hexEncodingKey);
           } catch (err) {
              metadata.hex_code = hexCode;
           }
        }
        // thermal metadata flag
        if (thermalEnabled) {
           metadata.thermal = true;
           if (thermalSecretText) metadata.thermal_secret_text = thermalSecretText;
           if (thermalKeyword) metadata.thermal_keyword = thermalKeyword;
           metadata.thermal_font_size = thermalFontSize;
           metadata.thermal_position_y = thermalPositionY;
        }

        const mediaVisibilityConfig = {
           audio_base: mediaVisibility.audioBase,
           audio_hidden: mediaVisibility.audioHidden,
           uv_layer: mediaVisibility.uvLayer,
           visual: mediaVisibility.visual,
        };

        if (wantsSecurityLayer) {
           const securityLayer = {
              enabled: true,
              reveal_logic: revealLogicMode,
              require_keyword: revealRequiresKeyword,
              keyword: revealRequiresKeyword ? (glitchKeyword || null) : null,
              reward_code: glitchRewardCode || null,
              signal_targets: signalTargets,
              slider_config: {
                 target_frequency: glitchCorrectFrequency,
                 target_shift: glitchCorrectShift,
                 target_chromatic: glitchCorrectChromatic,
                 tolerance_frequency: glitchToleranceFreq,
                 tolerance_shift: glitchToleranceShift,
                 tolerance_chromatic: glitchToleranceChroma,
              },
              start_values: {
                 frequency: glitchStartFrequency,
                 shift: glitchStartShift,
                 chromatic: glitchStartChromatic,
              },
           };

           // determine final UV url: prefer newly uploaded, otherwise preserve existingCard UV when editing
           const finalUvUrl = uvUrl ?? (existingCard ? (existingCard.image_uv_url || existingCard.hidden_uv_url || existingCard.metadata?.uv_layer_url || existingCard.metadata?.hidden_uv_url) : null);

           const glitchPuzzleMeta = {
              original_image_url: baseMediaUrl || imgUrl || null,
              corrupted_image_url: imgUrl || null,
              correct_frequency: glitchCorrectFrequency,
              correct_shift: glitchCorrectShift,
              correct_chromatic: glitchCorrectChromatic,
              difficulty: glitchDifficulty,
              tolerance_frequency: glitchToleranceFreq,
              tolerance_shift: glitchToleranceShift,
              tolerance_chromatic: glitchToleranceChroma,
              start_frequency: glitchStartFrequency,
              start_shift: glitchStartShift,
              start_chromatic: glitchStartChromatic,
              access_instructions: glitchAccessInstructions || undefined,
              hint: glitchHint || undefined,
              reward_code: glitchRewardCode,
              correct_keyword: revealRequiresKeyword ? (glitchKeyword || null) : null,
              require_keyword_validation: revealRequiresKeyword,
              unlock_mode: resolvedUnlockMode,
              variant: revealRequiresKeyword ? 'advanced_glitch' : 'standard_glitch',
              manual_unlock_required: revealRequiresKeyword,
              hidden_uv_url: finalUvUrl || null,
              hidden_audio_url: glitchHiddenAudioUrl || null,
              hidden_video_url: glitchHiddenVideoUrl || null,
              focused_image_url: glitchFocusedUrl || null,
              image_uv_url: finalUvUrl || null,
              media_visibility: mediaVisibilityConfig,
              audio_static_sync: audioStaticSync,
              narrative_hints: {
                 audio_guides_visual: narrativeLinks.audioHintsVisual,
                 visual_guides_code: narrativeLinks.visualHintsCode,
                 hint_note: narrativeLinks.hintNote || null,
              },
              security_layer: securityLayer,
              solved: false,
           };

           metadata.unified_media = {
              base_media_type: baseMediaType,
              base_media_url: baseMediaUrl,
              uv_layer_url: finalUvUrl || null,
              filter_layer_url: filterUrl || null,
              hidden_layer_url: glitchFocusedUrl || null,
              video_url: finalVideoUrl || null,
              audio_base_url: audUrl || null,
              audio_hidden_url: audHidUrl || null,
              hide_preview_on_board: hidePreviewOnBoard,
           };

           metadata.masked_preview = hidePreviewOnBoard;
           metadata.security_layer = securityLayer;
           metadata.glitch_puzzle = glitchPuzzleMeta;
           metadata.card_type = resolvedCardType;
           metadata.media_type = baseMediaType;
           metadata.reward_code = glitchRewardCode || null;
           metadata.media_visibility = mediaVisibilityConfig;
           metadata.audio_static_sync = audioStaticSync;
           metadata.narrative_hints = {
              audio_guides_visual: narrativeLinks.audioHintsVisual,
              visual_guides_code: narrativeLinks.visualHintsCode,
              hint_note: narrativeLinks.hintNote || null,
           };
           metadata.logic = 'glitch_sequential';
           metadata.sequence = {
              step_1: 'unlock_boot',
              step_2: 'align_signal',
              step_3: revealRequiresKeyword ? 'keyword_verification' : 'reveal',
           };
        }

        // Add mega clue metadata if needed
        if (evidenceType === 'mega_clue') {
           metadata.mega_clue = {
              final_truth_text: megaFinalTruthText,
              required_puzzle_ids: megaRequiredPuzzleIds,
              required_code_count: megaRequiredPuzzleIds.length,
              solved_puzzle_ids: [],
              collected_codes: [],
              unlocked: false,
           };
        }

        // Add actual field values to metadata (not visibility config)
        // This stores the real data that was entered in the form
        const fieldValues = {
          // Fake EXIF metadata fields
          date_created: fakeDate || fakeMeta.date || null,
          gps_coords: fakeLocation || fakeMeta.gps || null,
          device_owner: fakeMeta.owner || null,
          camera_model: fakeMeta.cam || null,
          technical_note: technicalNote || null,
          // Chat/Phone data
          chat_contact_name: chatContactName || null,
          // Stamps and external info
          stamp: stamp || null,
          external_link: externalLink || null,
        };
        metadata.field_values = fieldValues;

         // Add filter transform to metadata (not a DB column)
         if (filterTransform) {
            metadata.image_filter_layer_transform = filterTransform;
         }

         // Add audio metadata (fields that don't exist as DB columns)
         if (audHidUrl) {
            metadata.audio_hidden_url = audHidUrl;
         }
         if (freq && freq !== 50) {
            metadata.audio_target_freq = freq;
         }

         // sanitize metadata to avoid sending unserializable objects
          const cleanMetadata = sanitizeForMetadata(metadata);

          // Preserve existing UV URL when editing if no new uvFile was provided
          const finalUvUrl = uvUrl ?? (existingCard ? (existingCard.image_uv_url || existingCard.hidden_uv_url || existingCard.metadata?.uv_layer_url || existingCard.metadata?.hidden_uv_url) : null);

          const payload: Record<string, any> = {
        investigation_id: investigationId,
        title,
            type: resolvedCardType,
        description_public: descPublic || null,
        description_hidden: descHidden || null,
        x: existingCard ? existingCard.x : (initialX ?? 100),
        y: existingCard ? existingCard.y : (initialY ?? 100),
                 image_url: boardImageUrl,
         image_uv_url: finalUvUrl,
            image_filter_layer: filterUrl,
            is_locked: isLocked,
            lock_password: (isLocked && evidenceType !== 'mega_clue') ? lockPass : null,
            is_hidden: isHidden,
            discovery_code: isHidden ? discoveryCode.trim().toUpperCase() : null,
            metadata: cleanMetadata,
        audio_url: audUrl,
            video_url: finalVideoUrl
      };

               // attach chat data if present. If user edited messages but didn't click "Salvar Chat",
                // prefer the transient editing list so creations don't lose messages.
                const finalChatData: EditingChatMessage[] | null = chatData ?? (editingChatList && editingChatList.length > 0 ? editingChatList : null);
                const finalChatContact: string | null = chatContactName || (personName || null);
                if (finalChatData) {
                   payload.chat_data = finalChatData;
                   // save contact name alongside chat for preview in card
                   if (finalChatContact) payload.chat_contact_name = finalChatContact;
                   // also store into metadata for backwards-compatibility
                   payload.metadata = payload.metadata || {};
                   payload.metadata.chat_data = sanitizeForMetadata(finalChatData);
                   payload.metadata.chat_contact_name = finalChatContact || null;
                }
                
                // Phone keypad configuration (separate from pista lock)
                // Save even if no chat data yet (user might add it later)
                if (phoneHasKeypad && phonePassword) {
                   payload.metadata = payload.metadata || {};
                   payload.metadata.phone_locked = true;
                   payload.metadata.phone_password = phonePassword;
                   payload.metadata.phone_lock_type = phoneLockType || 'pin';
                }

                // For mega-clue, if multiple lock passwords were set, store them under metadata.mega_clue.required_codes
                if (evidenceType === 'mega_clue' && isLocked) {
                   payload.metadata = payload.metadata || {};
                   payload.metadata.mega_clue = payload.metadata.mega_clue || {};
                   // normalize to array of strings
                   payload.metadata.mega_clue.required_codes = Array.isArray(lockPasses) ? lockPasses : [];
                }

         // attach person dossier metadata only for document evidence
         if (evidenceType === 'document' && isPerson) {
            payload.metadata = payload.metadata || {};
            payload.metadata.person = sanitizeForMetadata({
              name: personName || title,
              dob: personDob || null,
              status: personStatus || 'UNKNOWN',
              occupation: personOccupation || null,
            });
         }

         // shredded document fields only apply to document evidence
         if (evidenceType === 'document' && isShredded) {
            // Salva tanto na coluna direta quanto no metadata (backup)
            payload.is_shredded = true;
            payload.metadata = payload.metadata || {};
            payload.metadata.is_shredded = true;  // 🔥 BACKUP no metadata
            payload.metadata.shred_rows = shredRows;
            payload.metadata.shred_cols = shredCols;
            console.log('🧩 [Shredder] ✅ Salvando configuração:', { 
              is_shredded: true, 
              shred_rows: shredRows, 
              shred_cols: shredCols,
              payload_preview: {
                is_shredded: payload.is_shredded,
                metadata: payload.metadata
              }
            });
         } else if (isShredded) {
            console.warn('⚠️ [Shredder] Puzzle marcado mas evidenceType não é "document":', evidenceType);
         }

         if (evidenceType === 'document') {
            if (realText) payload.real_text = realText;
            if (cipherText) payload.cipher_text = cipherText;
         }
         // optional stamp text column (if DB has column 'stamp_text')
         if (stamp) payload.stamp_text = stamp;

         // debug: log payload to help diagnose missing chat_data or missing image URLs
         try {
            console.log('📦 [CreateClueModal] Criando/atualizando card:', {
               title: payload.title,
               type: payload.type,
               evidenceType,
               image_url: payload.image_url,
               image_uv_url: payload.image_uv_url,
               image_filter_layer: payload.image_filter_layer,
               hasGlitchPuzzle: !!payload.metadata?.glitch_puzzle,
               glitchPuzzle: payload.metadata?.glitch_puzzle ? {
                  original_image_url: payload.metadata.glitch_puzzle.original_image_url,
                  reward_code: payload.metadata.glitch_puzzle.reward_code,
                  correct_frequency: payload.metadata.glitch_puzzle.correct_frequency
               } : null
            });
         } catch (e) {}
         let resultCard: any = null;
         if (existingCard && existingCard.id) {
            // If turning off security layer, explicitly clear glitch metadata to avoid server-side merge keeping old state
            if (!wantsSecurityLayer) {
               payload.metadata = payload.metadata || {};
               payload.metadata.glitch_puzzle = null;
               payload.metadata.security_layer = null;
            }
            resultCard = await updateInvestigationCard(existingCard.id, payload as any);
            console.log('✅ [CreateClueModal] Card atualizado:', {
              id: resultCard?.id,
              is_shredded: resultCard?.is_shredded,
              metadata: resultCard?.metadata
            });
         } else {
            resultCard = await createInvestigationCard(payload as any);
            console.log('✅ [CreateClueModal] Card criado:', {
               id: resultCard?.id,
               title: resultCard?.title,
               type: resultCard?.type,
               is_shredded: resultCard?.is_shredded,
               metadata: resultCard?.metadata
            });
         }
      onSaved(resultCard);
      
      // 🎉 Confirmação visual para puzzles triturados
      if (resultCard?.is_shredded) {
        console.log('%c🎉 PUZZLE TRITURADO CRIADO COM SUCESSO! 🎉', 'background: #4a4; color: #fff; font-size: 14px; padding: 8px; border-radius: 4px;');
        console.log('%c📋 Próximos Passos:', 'color: #aaf; font-weight: bold; font-size: 12px;');
        console.log('  1️⃣ Feche este modal');
        console.log('  2️⃣ Clique na evidência no tabuleiro para abrir o InspectionModal');
        console.log('  3️⃣ Você verá a imagem QUEBRADA em tiras/grade');
        console.log('  4️⃣ Use o botão "🔓 Controle de Revelação" para revelar peças');
        console.log('  5️⃣ Ctrl+Click em peças individuais para revelar/ocultar');
        console.log(`%c🎮 Formato: ${shredRows}x${shredCols} (${shredRows * shredCols} peças)`, 'color: #8f8; font-weight: bold;');
      }
      
      onClose();
    } catch (error) {
      console.error(error);
      alert("Falha ao registrar evidência. Verifique conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleImgSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
         const file = e.target.files[0];
         
         // Validar arquivo
         const maxSize = 10 * 1024 * 1024; // 10MB
         if (file.size > maxSize) {
            alert(`Imagem muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
            return;
         }
         
         if (!file.type.startsWith('image/')) {
            alert('Apenas arquivos de imagem são permitidos');
            return;
         }
         
         // Revoke previous URL
         revokeUrl(previewUrl);
         
         // Create and register new URL
         const newUrl = createAndRegisterBlobUrl(file);
         if (newUrl) {
            setImgFile(file);
            setPreviewUrl(newUrl);
         }
    }
  };

  const handleMegaImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
      
      // Revoke previous URL
      revokeUrl(megaImagePreview);
      
      // Create and register new URL
      const url = createAndRegisterBlobUrl(file);
      if (url) {
         setMegaImageFile(file);
         setMegaImagePreview(url);
      }
   };

   const handleQuickAddMessage = () => {
      const text = (quickChatText || '').trim();
      if (!text) return;
      setEditingChatList((list) => [...list, { sender: quickChatSender, type: 'text', text }]);
      setQuickChatText('');
   };

     const handleChatImageSelected = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
           setChatUploadProgress(p => ({ ...(p||{}), [idx]: 5 }));
           const publicUrl = await uploadInvestigationImage(file, investigationId, (progress) => {
              setChatUploadProgress(p => ({ ...(p||{}), [idx]: progress }));
           });
           setEditingChatList(prev => {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], image_url: publicUrl, type: 'image', text: copy[idx].text || '' } as any;
              return copy;
           });
        } catch (err: any) {
           console.error('Erro upload chat image', err);
           alert('Falha ao enviar imagem: ' + (err?.message || String(err)));
        } finally {
           setTimeout(() => setChatUploadProgress(p => { const c = { ...(p||{}) }; delete c[idx]; return c; }), 800);
        }
     };

   const lockPreviewEnabled = phoneHasKeypad && Boolean(phonePassword);

   const onOverlayMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!filterTransform) return;
      // draggingRef is defined above (hook order preserved)
      draggingRef.current = { mode: 'move', startX: e.clientX, startY: e.clientY, startTransform: { ...filterTransform } };
   };

   const onHandleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      if (!filterTransform) return;
      draggingRef.current = { mode: 'resize', startX: e.clientX, startY: e.clientY, startTransform: { ...filterTransform } };
   };

   const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] || null;
      if (!f) return;
      
      // Validar arquivo
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (f.size > maxSize) {
         alert(`Vídeo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
         return;
      }
      
      if (!f.type.startsWith('video/')) {
         alert('Apenas arquivos de vídeo são permitidos');
         return;
      }
      
      // Revoke previous URL
      revokeUrl(videoPreviewUrl);
      
      // Create and register new URL
      const localUrl = createAndRegisterBlobUrl(f);
      if (localUrl) {
         setVideoFile(f);
         setVideoPreviewUrl(localUrl);

         // Upload immediately and track promise
         const uploadPromise = (async () => {
            try {
               if (mountedRef.current) setVideoUploading(true);
               const ext = f.name.split('.').pop() || 'mp4';
               const publicUrl = await uploadInvestigationFile(f, investigationId, ext, (progress) => {
                  if (mountedRef.current) {
                     setUploadProgress(prev => ({ ...prev, video: progress }));
                  }
               });
               if (publicUrl) {
                  if (mountedRef.current) setVideoUrl(publicUrl);
                  return publicUrl;
               } else {
                  throw new Error('Upload retornou URL vazia');
               }
            } catch (err) {
               console.error('Video upload failed', err);
               if (mountedRef.current) {
                  setUploadErrors(prev => [...prev, `Vídeo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`]);
               }
               throw err;
            } finally {
               if (mountedRef.current) {
                  setVideoUploading(false);
                  setUploadProgress(prev => ({ ...prev, video: 100 }));
               }
            }
         })();
         
         setVideoUploadPromise(uploadPromise);
      }
   };

   const overlayActive = showMixer || !!editorMode || showGlitchDesigner || !!showAudioForgeFor || showThermalEditor;

   return (
    <div className="modal-overlay">
         <DiegeticWindow 
            title={existingCard ? `✏️ EDITAR EVIDÊNCIA` : `REGISTRO DE EVIDÊNCIA`} 
        onClose={onClose}
        extraHeaderContent={
          <div className="flex gap-2 items-center">
            {existingCard && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                color: '#a78bfa',
                padding: '4px 10px',
                fontSize: '10px',
                borderRadius: '4px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>✏️</span> Modo Edição
              </div>
            )}
            <div className="relative">
              <button
                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                style={{
                  background: 'rgba(100,150,255,0.15)',
                  border: '1px solid rgba(100,150,255,0.3)',
                  color: '#64b5ff',
                  padding: '4px 8px',
                  fontSize: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                📂 {loadingTemplates ? '⏳' : ''}
              </button>
              {showTemplateDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: 'rgba(10,15,25,0.98)',
                  border: '1px solid rgba(0,243,255,0.3)',
                  borderRadius: '6px',
                  minWidth: '280px',
                  maxHeight: '350px',
                  overflowY: 'auto',
                  zIndex: 10000,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
                }}>
                  {templates.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#666', fontSize: '11px' }}>
                      Nenhum template salvo
                    </div>
                  ) : (
                    templates.map((template) => (
                      <div key={template.id} style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <div className="flex-1 cursor-pointer" onClick={() => handleLoadTemplate(template)}>
                          <div style={{ color: '#00f3ff', fontSize: '11px', fontWeight: 500 }}>
                            {template.name}
                          </div>
                          {template.description && (
                            <div style={{ color: '#888', fontSize: '9px', marginTop: '2px' }}>
                              {template.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          style={{
                            background: 'rgba(255,50,50,0.2)',
                            border: '1px solid rgba(255,50,50,0.4)',
                            color: '#ff6666',
                            padding: '3px 6px',
                            fontSize: '9px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleSaveAsTemplate}
              style={{
                background: 'rgba(100,200,100,0.15)',
                border: '1px solid rgba(100,200,100,0.3)',
                color: '#64c864',
                padding: '4px 8px',
                fontSize: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              💾
            </button>
          </div>
        }
      >
            <div className="dossier-body" style={{ padding: 0, pointerEvents: overlayActive ? 'none' : 'auto' }}>

          <div className="tabs-header">
            <button className={`tab-btn ${activeTab==='geral'?'active':''}`} onClick={()=>setActiveTab('geral')}>📄 GERAL</button>
            <button className={`tab-btn ${activeTab==='visual'?'active':''}`} onClick={()=>setActiveTab('visual')}>👁️ VISUAL</button>
            <button className={`tab-btn ${activeTab==='audio'?'active':''}`} onClick={()=>setActiveTab('audio')}>🔊 ÁUDIO</button>
            <button className={`tab-btn ${activeTab==='cifra'?'active':''}`} onClick={()=>setActiveTab('cifra')}>🧩 CIFRAS</button>
            <button className={`tab-btn ${activeTab==='campos'?'active':''}`} onClick={()=>setActiveTab('campos')}>👁️ CAMPOS</button>
            <button className={`tab-btn ${activeTab==='display'?'active':''}`} onClick={()=>setActiveTab('display')}>⚙️ CONFIG</button>
                  {(securityLayerEnabled || evidenceType === 'glitch_puzzle') && <button className={`tab-btn ${activeTab==='glitch'?'active':''}`} onClick={()=>setActiveTab('glitch' as any)}>🎮 GLITCH</button>}
            {evidenceType === 'mega_clue' && <button className={`tab-btn ${activeTab==='mega'?'active':''}`} onClick={()=>setActiveTab('mega' as any)}>🔐 MEGA</button>}
          </div>

          <div className="tab-content">

            {activeTab === 'geral' && (
              <>
                <div className="field-block">
                   <span className="field-title">📋 SUBTIPO DE EVIDÊNCIA</span>
                   <div className="auto-style-1 auto-style-2 auto-style-3">
                      <button 
                         className={`upload-btn ${evidenceType === 'document' ? 'active' : ''}`}
                         onClick={() => {
                            setEvidenceType('document');
                            // Limpar mídias incompatíveis ao mudar tipo
                            if (evidenceType !== 'document') {
                               setVideoFile(null);
                               setVideoUrl(null);
                               setVideoUrlInput('');
                               if (videoPreviewUrl) {
                                  try { URL.revokeObjectURL(videoPreviewUrl); } catch(e){}
                               }
                               setVideoPreviewUrl(null);
                            }
                         }}
                         style={{flex:1, background: evidenceType === 'document' ? 'rgba(198,164,95,0.3)' : 'rgba(100,100,100,0.1)', color: evidenceType === 'document' ? '#c6a45f' : '#888'}}
                      >
                         📄 Documento Padrão
                      </button>
                      <button 
                         className={`upload-btn ${evidenceType === 'glitch_puzzle' ? 'active' : ''}`}
                         onClick={() => setEvidenceType('glitch_puzzle')}
                         style={{flex:1, background: evidenceType === 'glitch_puzzle' ? 'rgba(100,150,255,0.3)' : 'rgba(100,100,100,0.1)', color: evidenceType === 'glitch_puzzle' ? '#64b5ff' : '#888'}}
                      >
                         🧩 Quebra-cabeça de Glitch
                      </button>
                      <button 
                         className={`upload-btn ${evidenceType === 'mega_clue' ? 'active' : ''}`}
                         onClick={() => setEvidenceType('mega_clue')}
                         style={{flex:1, background: evidenceType === 'mega_clue' ? 'rgba(255,100,0,0.3)' : 'rgba(100,100,100,0.1)', color: evidenceType === 'mega_clue' ? '#ff6400' : '#888'}}
                      >
                         🔐 Mega-Pista Final
                      </button>
                   </div>
                </div>

                {evidenceType === 'glitch_puzzle' && (
                  <div className="field-block" style={{background:'linear-gradient(135deg, rgba(18,24,40,0.8), rgba(0,0,0,0.7))', border:'1px solid rgba(100,150,255,0.3)', borderRadius:8}}>
                    <span className="field-title" style={{color:'#64b5ff'}}>🧩 HUB GLITCH</span>
                    <p style={{fontSize:12, color:'#9fb9ff', marginTop:6, lineHeight:1.5}}>
                                 Use os controles na aba Visual para definir os valores alvo do glitch. A imagem enviada aqui será mantida limpa e o motor aplicará a distorção para o jogador.
                    </p>
                              {previewUrl ? (
                      <GlitchImageEngine
                                    imageUrl={previewUrl}
                        targetFrequency={glitchCorrectFrequency}
                        targetShift={glitchCorrectShift}
                        targetChromatic={glitchCorrectChromatic}
                        playerFrequency={glitchStartFrequency}
                        playerShift={glitchStartShift}
                        playerChromatic={glitchStartChromatic}
                        height={200}
                      />
                    ) : (
                      <div style={{marginTop:10, padding:12, border:'1px dashed rgba(100,150,255,0.3)', color:'#8096c8', fontSize:12}}>
                                    Envie a imagem na aba Visual para visualizar o efeito de glitch aqui.
                      </div>
                    )}
                  </div>
                )}

                <div className="field-block">
                   <span className="field-title">IDENTIFICAÇÃO</span>
                   <div className="auto-style-4 auto-style-5 auto-style-6">
                      <div className="auto-style-7">
                         <label>IDENTIFICADOR DA EVIDÊNCIA</label>
                         <input autoFocus value={title} onChange={e=>setTitle(e.target.value)} placeholder="Aguardando input..." />
                         {formErrors.some(e => e.startsWith('Título')) && (
                           <span style={{ color: '#ff003c', fontSize: '11px', textShadow: '0 0 5px #ff003c', marginTop: '4px', display: 'block' }}>ALERTA: Input Necessário</span>
                         )}
                      </div>
                      <div className="auto-style-8">
                         <label>TAGS</label>
                         <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Sangue, Oculto..." />
                      </div>
                   </div>
                   <div className="auto-style-9 auto-style-10 auto-style-11 auto-style-12">
                      <label className="auto-style-13 auto-style-14 auto-style-15 auto-style-16">
                         <input type="checkbox" checked={isHidden} onChange={e => setIsHidden(e.target.checked)} />
                         <span>Pista oculta (descoberta por código)</span>
                      </label>
                      {isHidden && (
                         <div className="auto-style-17">
                             <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                               CHAVE DE DESCRIPTOGRAFIA
                               <Info size={16} data-tooltip-id="tt-discovery-code" data-tooltip-content="Código necessário para os jogadores desbloquearem esta pista" style={{ cursor: 'help', opacity: 0.7 }} />
                             </label>
                             <Tooltip id="tt-discovery-code" />
                             <input value={discoveryCode} onChange={e=>setDiscoveryCode(e.target.value.toUpperCase())} placeholder="EX: ALPHA-01" />
                             {formErrors.some(e => e.includes('código de descoberta')) && (
                               <span style={{ color: '#ff003c', fontSize: '11px', textShadow: '0 0 5px #ff003c', marginTop: '4px', display: 'block' }}>ALERTA: Input Necessário</span>
                             )}
                         </div>
                      )}
                   </div>
                   <label>RELATÓRIO OFICIAL (VISÍVEL)</label>
                   <textarea rows={3} value={descPublic} onChange={e=>setDescPublic(e.target.value)} placeholder="Aguardando input..." />
                   <div className="auto-style-18">
                      <label className="field-title auto-style-19 auto-style-20">ARQUIVO CONFIDENCIAL (APENAS GM)</label>
                      <textarea rows={2} value={descHidden} onChange={e=>setDescHidden(e.target.value)} placeholder="Aguardando input..." style={{borderColor:'#c6a45f', background:'#1a1710'}} />
                   </div>
                </div>

                <div className="field-block">
                   <span className="field-title">🔒 CAMADA DE SEGURANÇA UNIVERSAL</span>
                   <p style={{fontSize:11, color:'#888', marginBottom:10}}>
                      Transforme qualquer mídia (imagem, vídeo ou áudio) em um artefato com camada de sinal/glitch e senha. Use os sliders na aba Glitch para calibrar quando ativado.
                   </p>
                   <div className="auto-style-21 auto-style-22 auto-style-23">
                      <label className="auto-style-24 auto-style-25 auto-style-26 auto-style-27">
                         <input type="checkbox" checked={securityLayerEnabled || evidenceType === 'glitch_puzzle'} onChange={e => setSecurityLayerEnabled(e.target.checked)} disabled={evidenceType === 'glitch_puzzle'} />
                         <span style={{fontWeight:700, color:'#c6a45f'}}>Ativar criptografia de sinal</span>
                      </label>
                      <label className="auto-style-28 auto-style-29 auto-style-30 auto-style-31">
                         <input type="checkbox" checked={hidePreviewOnBoard} onChange={e => setHidePreviewOnBoard(e.target.checked)} />
                         <span style={{color:'#bbb'}}>Ocultar prévia no tabuleiro (mostrar ícone bloqueado)</span>
                      </label>
                   </div>

                   <div style={{marginTop:12, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:10}}>
                      <label className="auto-style-32 auto-style-33 auto-style-34">
                         Lógica de revelação
                         <select value={revealLogicMode} onChange={e => setRevealLogicMode(e.target.value as any)}>
                            <option value="always_visible">Sempre visível (pista de percepção)</option>
                            <option value="aligned_only">Apenas ao alinhar sliders</option>
                            <option value="aligned_keyword">Sliders + senha manual</option>
                         </select>
                      </label>
                      <div className="auto-style-35 auto-style-36 auto-style-37">
                         <span style={{fontSize:11, color:'#ccc'}}>Sliders controlam</span>
                         <div className="auto-style-38 auto-style-39 auto-style-40">
                            <label className="auto-style-41 auto-style-42 auto-style-43 auto-style-44">
                               <input type="checkbox" checked={signalTargets.visual} onChange={e => setSignalTargets(v => ({ ...v, visual: e.target.checked }))} />
                               <span className="auto-style-45">Imagem/Vídeo</span>
                            </label>
                            <label className="auto-style-46 auto-style-47 auto-style-48 auto-style-49">
                               <input type="checkbox" checked={signalTargets.audio} onChange={e => setSignalTargets(v => ({ ...v, audio: e.target.checked }))} />
                               <span className="auto-style-50">Áudio</span>
                            </label>
                         </div>
                      </div>
                      <label className="auto-style-51 auto-style-52 auto-style-53">
                         Código final / cofre
                         <input value={glitchRewardCode} onChange={e => setGlitchRewardCode(e.target.value.toUpperCase())} placeholder="ALPHA-01" />
                      </label>
                   </div>

                   <div style={{marginTop:12, fontSize:11, color:'#888', display:'flex', gap:10, flexWrap:'wrap'}}>
                      <span>Mídia atual: {(() => {
                        if (videoPreviewUrl || videoUrlInput || videoUrl) return 'Vídeo';
                        if (audioBase) return 'Áudio';
                        if (imgFile) return 'Imagem';
                        return 'Nenhuma';
                      })()}</span>
                      <span style={{color:'#64b5ff'}}>Aba Glitch continua sendo usada para calibrar sliders.</span>
                                 <span style={{color:'#64b5ff'}}>Use a seção de calibração na aba Visual para ajustar os sliders.</span>
                   </div>
                </div>

                <div className="auto-style-54 auto-style-55">
                   <div className="field-block auto-style-56">
                      <span className="field-title">🔐 CRIPTOGRAFIA / BLOQUEIO</span>
                      
                      {/* SENHA DA PISTA */}
                      <div style={{marginBottom: 15, paddingBottom: 15, borderBottom: '1px solid #333'}}>
                         <div className="auto-style-57 auto-style-58 auto-style-59 auto-style-60">
                            <input type="checkbox" checked={isLocked} onChange={e=>setIsLocked(e.target.checked)} />
                            <label className="font-bold">🔒 ATIVAR SENHA DE ACESSO (Pista)</label>
                         </div>
                         {isLocked && (
                            evidenceType === 'mega_clue' ? (
                              <div className="auto-style-61 auto-style-62 auto-style-63">
                                 {megaRequiredPuzzleIds.length === 0 ? (
                                    <div style={{fontSize:12, color:'#f2b775'}}>Selecione os quebra-cabeças necessários na aba "MEGA" para definir quantas senhas serão solicitadas.</div>
                                 ) : (
                                    megaRequiredPuzzleIds.map((id, idx) => (
                                       <input
                                          key={id || idx}
                                          placeholder={`Senha ${idx + 1} (Ex: KIAN)`}
                                          value={lockPasses[idx] || ''}
                                          onChange={e => {
                                             const next = [...lockPasses];
                                             next[idx] = e.target.value;
                                             setLockPasses(next);
                                          }}
                                          style={{borderColor:'red', color:'red', fontWeight:'bold', padding:'8px 12px', width: '100%'}}
                                       />
                                    ))
                                 )}
                              </div>
                            ) : (
                              <input 
                                 placeholder="Senha da pista (Ex: KIAN)" 
                                 value={lockPass} 
                                 onChange={e=>setLockPass(e.target.value)} 
                                 style={{borderColor:'red', color:'red', fontWeight:'bold', padding:'8px 12px', width: '100%'}} 
                              />
                            )
                         )}
                      </div>
                      
                      {/* OUTROS CONTROLES */}
                      <div className="auto-style-64 auto-style-65 auto-style-66 auto-style-67 auto-style-68">
                         <label className="auto-style-69 auto-style-70 auto-style-71">
                            <input type="checkbox" checked={isPerson} onChange={e=>setIsPerson(e.target.checked)} />
                            <span>Tipo: Dossiê de Pessoa</span>
                         </label>
                         <button className="upload-btn" onClick={() => setShowChatEditor(!showChatEditor)}>💬 Gerar Chat Falso</button>
                      </div>

                      {showChatEditor && (
                         <div className="chat-editor-container">
                            {/* LADO ESQUERDO: INPUTS */}
                            <div className="chat-inputs">
                               <div>
                                  <label>Nome do Contato</label>
                                  <input value={chatContactName} onChange={e=>setChatContactName(e.target.value)} placeholder="Nome do contato" />
                               </div>

                               <label>Mensagens</label>
                               {editingChatList.length === 0 ? (
                                  <div style={{padding:12, background:'rgba(0,0,0,0.3)', borderRadius:6, border:'1px dashed rgba(100,150,255,0.3)', color:'#888', fontSize:11, textAlign:'center', marginBottom:10}}>
                                     Nenhuma mensagem ainda. Clique em "➕ Adicionar" para começar!
                                  </div>
                               ) : (
                                  editingChatList.map((m, idx) => (
                                     <div key={idx} className="chat-message-row">
                                        <select value={m.sender} onChange={e => { const copy = [...editingChatList]; copy[idx] = { ...copy[idx], sender: e.target.value }; setEditingChatList(copy); }}>
                                           <option value="me">Eu</option>
                                           <option value="them">Contato</option>
                                           <option value="system">Sistema</option>
                                        </select>
                                        <textarea rows={2} value={m.text} onChange={e => { const copy = [...editingChatList]; copy[idx] = { ...copy[idx], text: e.target.value }; setEditingChatList(copy); }} />
                                        <div className="auto-style-72 auto-style-73 auto-style-74">
                                           {m.image_url && <img src={m.image_url} alt="preview" className="auto-style-75 auto-style-76" />}
                                           {chatUploadProgress[idx] ? (
                                              <div style={{fontSize:12, color:'#9cc'}}>{`Enviando imagem: ${chatUploadProgress[idx]}%`}</div>
                                           ) : null}
                                        </div>
                                        <div className="chat-buttons auto-style-77 auto-style-78 auto-style-79">
                                           <button className="upload-btn" onClick={() => { const copy = [...editingChatList]; copy.splice(idx,1); setEditingChatList(copy); }}>✖</button>
                                           <button className="upload-btn" onClick={() => { const copy = [...editingChatList]; copy.splice(idx+1,0,{ sender:'me', type:'text', text:'' }); setEditingChatList(copy); }}>+</button>
                                           <input ref={el => fileInputsRef.current[idx] = el} type="file" accept="image/*" className="auto-style-80" onChange={(e) => handleChatImageSelected(idx, e)} />
                                           <button className="upload-btn" onClick={() => { fileInputsRef.current[idx]?.click(); }}>📎 Anexar Imagem</button>
                                        </div>
                                     </div>
                                  ))
                               )}
                               
                               <button className="upload-btn" onClick={() => { setEditingChatList([...editingChatList, { sender:'me', type:'text', text:'' }]); }} style={{marginTop:10, width:'100%', background:'rgba(100,150,255,0.2)', border:'1px solid rgba(100,150,255,0.5)'}}>➕ Adicionar Mensagem</button>

                               <div className="auto-style-81 auto-style-82 auto-style-83">
                                  <button className="btn-save" onClick={() => { setChatData(editingChatList); setShowChatEditor(false); }}>✅ Salvar</button>
                                  <button className="btn-cancel" onClick={() => { setChatJson(''); setShowChatEditor(false); }}>Cancelar</button>
                               </div>

                               <div className="auto-style-84">
                                  <label>Importar JSON</label>
                                  <div className="auto-style-85 auto-style-86">
                                     <input placeholder='Colar JSON aqui' value={chatJson} onChange={e=>setChatJson(e.target.value)} className="auto-style-87" />
                                     <button className="upload-btn" onClick={() => {
                                        try {
                                           const parsed = JSON.parse(chatJson || '[]');
                                           if (Array.isArray(parsed)) {
                                              setEditingChatList(parsed.map((m: any) => ({ sender: m.sender || 'me', type: m.type || 'text', text: m.text || '' })));
                                           } else alert('JSON inválido');
                                        } catch (e) { alert('JSON inválido'); }
                                     }}>Importar</button>
                                  </div>
                               </div>
                            </div>

                            {/* LADO DIREITO: PREVIEW DO CELULAR */}
                            <div className="chat-phone-preview">
                               <div className="chat-phone-inner">
                                  <PhoneViewer 
                                     chatData={editingChatList} 
                                     contactName={chatContactName} 
                                     isLocked={lockPreviewEnabled}
                                    password={lockPreviewEnabled ? phonePassword : undefined}
                                    passwordType={phoneLockType}
                                  />
                               </div>
                               <div className="chat-preview-label">Preview do Dispositivo</div>

                               <div style={{marginTop:10, width:'100%', display:'flex', flexDirection:'column', gap:8, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(100,150,255,0.25)', borderRadius:8, padding:10}}>
                                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', color:'#9ac4ff', fontSize:11, textTransform:'uppercase', letterSpacing:0.5}}>
                                     <span>Adicionar mensagem pelo preview</span>
                                     <button className="btn-save auto-style-88 auto-style-89" onClick={handleQuickAddMessage}>Adicionar</button>
                                  </div>
                                  <div className="auto-style-90 auto-style-91 auto-style-92 auto-style-93">
                                     <select value={quickChatSender} onChange={e => setQuickChatSender(e.target.value as ChatSender)} className="auto-style-94">
                                        <option value="them">Contato</option>
                                        <option value="me">Eu</option>
                                        <option value="system">Sistema</option>
                                     </select>
                                     <textarea 
                                        rows={2} 
                                        value={quickChatText} 
                                        onChange={e => setQuickChatText(e.target.value)}
                                        onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleQuickAddMessage(); } }}
                                        placeholder="Digite a mensagem e clique em Adicionar"
                                        className="auto-style-95 auto-style-96"
                                     />
                                  </div>
                               </div>
                               
                               {/* CONTROLE DO KEYPAD DO TELEFONE (SEPARADO DA SENHA DA PISTA) */}
                               <div style={{marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(100,100,100,0.3)', width: '100%'}}>
                                  <div className="auto-style-97 auto-style-98 auto-style-99 auto-style-100">
                                     <input 
                                        type="checkbox" 
                                        checked={phoneHasKeypad} 
                                        onChange={e=>setPhoneHasKeypad(e.target.checked)} 
                                     />
                                     <label className="font-bold auto-style-101">📱 Telefone com Keypad</label>
                                  </div>
                                  
                                  {phoneHasKeypad && (
                                     <div>
                                        <div className="auto-style-102 auto-style-103 auto-style-104 auto-style-105">
                                           <input 
                                              placeholder="Senha do telefone (apenas números)" 
                                              value={phonePassword} 
                                              onChange={e=>setPhonePassword(e.target.value.replace(/\D/g, ''))}
                                              maxLength={6}
                                              style={{flex: 1, borderColor:'#00b894', color:'#00b894', fontWeight:'bold', padding:'6px 10px'}} 
                                           />
                                           <div className="auto-style-106 auto-style-107 auto-style-108">
                                              <select value={phoneLockType} onChange={e => setPhoneLockType(e.target.value as any)} className="auto-style-109">
                                                 <option value="pin">PIN (numérico)</option>
                                                 <option value="pattern">Padrão (3×3)</option>
                                              </select>

                                              <button 
                                                 className="upload-btn"
                                                 onClick={() => setShowKeypadEditor(!showKeypadEditor)}
                                                 style={{background: showKeypadEditor ? '#333' : '#00b894', color: '#fff', padding: '6px 12px'}}
                                              >
                                                 {showKeypadEditor ? '⌨️' : '🔢'}
                                              </button>
                                           </div>
                                        </div>
                                        
                                        {showKeypadEditor && (
                                           <div style={{padding: 20, background: '#0a0a0a', borderRadius: 8}}>
                                              <div style={{fontSize: 11, marginBottom: 10, color: '#888'}}>Preview do Keypad:</div>
                                              {phoneLockType === 'pattern' ? (
                                                 <div>
                                                    <div style={{fontSize:11, color:'#bbb', marginBottom:8}}>Modo editor de Padrão — clique nos pontos e pressione <strong>OK</strong></div>
                                                    <PatternLock
                                                       code={phonePassword || null}
                                                       allowEdit={true}
                                                       onInput={(value) => setPhonePassword(String(value || ''))}
                                                       onUnlock={() => { setShowKeypadEditor(false); }}
                                                    />
                                                    <div className="auto-style-110 auto-style-111 auto-style-112">
                                                       <button className="upload-btn" onClick={() => setPhonePassword('')}>Limpar Padrão</button>
                                                       <button className="btn-save" onClick={() => setShowKeypadEditor(false)}>Salvar</button>
                                                    </div>
                                                 </div>
                                              ) : (
                                                 phonePassword !== undefined && (
                                                    <NumericKeypad 
                                                       code={phonePassword} 
                                                       onInput={(value) => setPhonePassword(value)}
                                                       onUnlock={() => { setShowKeypadEditor(false); }} 
                                                    />
                                                 )
                                              )}
                                           </div>
                                        )}
                                     </div>
                                  )}
                               </div>
                            </div>
                         </div>
                      )}

                      {isPerson && (
                         <div className="auto-style-113 auto-style-114 auto-style-115 auto-style-116">
                            <div>
                               <label>Nome Completo</label>
                               <input value={personName} onChange={e=>setPersonName(e.target.value)} />
                            </div>
                            <div>
                               <label>Data Nasc</label>
                               <input value={personDob} onChange={e=>setPersonDob(e.target.value)} placeholder="YYYY-MM-DD" />
                            </div>
                            <div>
                               <label>Status</label>
                               <select value={personStatus} onChange={e=>setPersonStatus(e.target.value as any)}>
                                 <option value="UNKNOWN">DESCONHECIDO</option>
                                 <option value="ALIVE">VIVO</option>
                                 <option value="MIA">DESAPARECIDO</option>
                                 <option value="DEAD">MORTO</option>
                               </select>
                            </div>
                            <div>
                               <label>Ocupação</label>
                               <input value={personOccupation} onChange={e=>setPersonOccupation(e.target.value)} />
                            </div>
                         </div>
                      )}
                   </div>

                      <div className="field-block auto-style-117">
                      <span className="field-title">🗃️ METADADOS FALSOS (HACKING)</span>
                      <div className="auto-style-118 auto-style-119 auto-style-120">
                         <input placeholder="Data Fake" value={fakeMeta.date} onChange={e=>setFakeMeta({...fakeMeta, date:e.target.value})} />
                         <input placeholder="GPS Coords" value={fakeMeta.gps} onChange={e=>setFakeMeta({...fakeMeta, gps:e.target.value})} />
                         <input placeholder="Device Owner" value={fakeMeta.owner} onChange={e=>setFakeMeta({...fakeMeta, owner:e.target.value})} className="auto-style-121" />
                      </div>
                      <div className="auto-style-122">
                         <label className="auto-style-123 auto-style-124">Nota Técnica / Comentário HEX (visível em INSPECIONAR CÓDIGO)</label>
                         <textarea rows={3} value={technicalNote} onChange={e => setTechnicalNote(e.target.value)} placeholder="Ex: 00 4F 52 44 4F 00 00 ou anotações técnicas" style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, padding: 8 }} />
                      </div>
                   </div>
                </div>
              </>
            )}

            {activeTab === 'visual' && (
              <>
                <div className="field-block">
                   <span className="field-title">1. IMAGEM PRINCIPAL</span>
                      <div className="auto-style-125 auto-style-126 auto-style-127">
                         <label className="upload-btn">📷 SELECIONAR FOTO<input type="file" accept="image/*" hidden onChange={handleImgSelect} /></label>
                         <label className="upload-btn">🎬 SELECIONAR VÍDEO<input type="file" accept="video/*" hidden onChange={handleVideoSelect} /></label>
                         {videoUploading && <span style={{color:'#c6a45f', fontSize:12}}>Enviando vídeo...</span>}
                      </div>
                      <div className="auto-style-128">
                         <label>OU URL DO VÍDEO (YouTube, Vimeo, etc.)</label>
                         <input value={videoUrlInput} onChange={e=>setVideoUrlInput(e.target.value)} placeholder="https://..." />
                      </div>
                            <div className="image-preview-box" style={{backgroundImage: previewUrl ? `url(${previewUrl})` : 'none'}}>
                                 {!previewUrl && <span className="auto-style-129 auto-style-130">SEM IMAGEM</span>}
                                 {previewUrl && (
                                    <div className="image-edit-canvas" style={{position:'relative', width:'100%', height:'100%', backgroundImage: `url(${previewUrl})`, backgroundSize:'contain', backgroundPosition:'center', backgroundRepeat:'no-repeat'}}>
                                       {filterPreviewUrl && filterTransform && (
                                          <div
                                             className="filter-overlay"
                                             onMouseDown={onOverlayMouseDown}
                                             style={{
                                                position:'absolute',
                                                left:`${filterTransform.left}%`,
                                                top:`${filterTransform.top}%`,
                                                width:`${filterTransform.width}%`,
                                                height:`${filterTransform.height}%`,
                                                  backgroundImage:`url(${filterPreviewUrl})`,
                                                backgroundSize:'cover',
                                                backgroundPosition:'center',
                                                border:'2px dashed rgba(198,164,95,0.9)',
                                                boxSizing:'border-box',
                                                cursor:'move',
                                                zIndex: 30,
                                                pointerEvents: 'auto'
                                             }}
                                          >
                                             <div className="auto-style-131 auto-style-132 auto-style-133 auto-style-134 auto-style-135 auto-style-136">
                                                 <button className="upload-btn" onClick={(e)=>{ e.stopPropagation(); try { URL.revokeObjectURL(filterPreviewUrl); } catch(e){} setFilterPreviewUrl(null); setFilterFile(null); setFilterTransform(null); }}>Remover</button>
                                             </div>
                                             <div
                                                onMouseDown={onHandleMouseDown}
                                                style={{position:'absolute', right:4, bottom:4, width:18, height:18, background:'rgba(0,0,0,0.4)', borderRadius:3, cursor:'nwse-resize', zIndex:40}}
                                             />
                                          </div>
                                       )}
                                    </div>
                                 )}
                            </div>
                      {videoPreviewUrl && (
                         <div className="auto-style-137">
                            <small style={{color:'#c6a45f'}}>Pré-visualização de vídeo:</small>
                            <div className="auto-style-138">
                              <video src={videoPreviewUrl} controls style={{maxWidth:'100%', maxHeight:160, display:'block', background:'#000'}} />
                            </div>
                         </div>
                      )}
                </div>

                {imgFile && evidenceType === 'glitch_puzzle' && previewUrl && (
                  <div className="field-block" style={{borderColor:'rgba(100,150,255,0.3)'}}>
                     <span className="field-title" style={{color:'#64b5ff'}}>🧩 DESIGNER DA CAMADA FOCO</span>
                     <p style={{fontSize:11, color:'#9fb9ff', marginBottom:10}}>
                        Use a imagem base para desenhar pistas que só aparecem quando o glitch é resolvido. O preview abaixo já aplica os sliders atuais.
                     </p>
                     <div className="auto-style-139 auto-style-140 auto-style-141 auto-style-142 auto-style-143">
                        <button className="upload-btn" onClick={() => setShowGlitchDesigner(true)}>
                           🎨 DESIGNER DA CAMADA FOCO
                        </button>
                        {glitchFocusedImagePreview && (
                           <span style={{fontSize:11, color:'#7bd7ff'}}>Camada salva — será exibida após alinhar.</span>
                        )}
                     </div>
                     <GlitchImageEngine
                        imageUrl={previewUrl}
                        targetFrequency={glitchCorrectFrequency}
                        targetShift={glitchCorrectShift}
                        targetChromatic={glitchCorrectChromatic}
                        playerFrequency={glitchStartFrequency}
                        playerShift={glitchStartShift}
                        playerChromatic={glitchStartChromatic}
                        height={240}
                     />
                     <small style={{display:'block', marginTop:8, color:'#888'}}>
                        A imagem acima é a base limpa. Ajuste os sliders na seção de calibração logo abaixo para calibrar a dificuldade enquanto vê o efeito aqui.
                     </small>
                  </div>
                )}

                {(securityLayerEnabled || evidenceType === 'glitch_puzzle') && (
                  <div className="field-block" style={{borderColor:'rgba(100,150,255,0.25)'}}>
                    <span className="field-title" style={{color:'#64b5ff'}}>🎛️ CALIBRAÇÃO DO GLITCH NO VISUAL</span>
                    <p style={{fontSize:11, color:'#9fb9ff', marginBottom:12}}>
                      Ajuste os valores alvo enquanto vê a prévia. Os controles são os mesmos da aba Glitch, mas ficam aqui para facilitar durante a criação.
                    </p>

                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:14, alignItems:'start'}}>
                      <div>
                        <div className="auto-style-144">
                           <label>Frequência de Fatias: <strong style={{color:'#64b5ff'}}>{glitchCorrectFrequency}</strong></label>
                           <input
                              type="range"
                              min="1"
                              max="50"
                              value={glitchCorrectFrequency}
                              onChange={e => setGlitchCorrectFrequency(parseInt(e.target.value))}
                              disabled={loading}
                              style={{width:'100%', accentColor:'#64b5ff'}}
                           />
                        </div>

                        <div className="auto-style-145">
                           <label>Intensidade de Deslocamento: <strong style={{color:'#64b5ff'}}>{glitchCorrectShift}%</strong></label>
                           <input
                              type="range"
                              min="0"
                              max="100"
                              value={glitchCorrectShift}
                              onChange={e => setGlitchCorrectShift(parseInt(e.target.value))}
                              disabled={loading}
                              style={{width:'100%', accentColor:'#64b5ff'}}
                           />
                        </div>

                        <div className="auto-style-146">
                           <label>Corrupção Cromática: <strong style={{color:'#64b5ff'}}>{glitchCorrectChromatic}%</strong></label>
                           <input
                              type="range"
                              min="0"
                              max="100"
                              value={glitchCorrectChromatic}
                              onChange={e => setGlitchCorrectChromatic(parseInt(e.target.value))}
                              disabled={loading}
                              style={{width:'100%', accentColor:'#64b5ff'}}
                           />
                        </div>
                      </div>

                      <div>
                        <div style={{padding:10, background:'rgba(100,150,255,0.08)', border:'1px solid rgba(100,150,255,0.2)', borderRadius:6, color:'#9fb9ff', fontSize:11}}>
                           💡 <strong style={{color:'#64b5ff'}}>Memorize ou anote estes valores!</strong> Você precisará deles para verificar a solução.
                        </div>

                        <div style={{marginTop:12, padding:'10px', background:'rgba(100,150,255,0.05)', border:'1px solid rgba(100,150,255,0.15)', borderRadius:6}}>
                           <h5 style={{margin:'0 0 8px 0', color:'#64b5ff'}}>Tolerância de acerto (sliders)</h5>
                           <div className="auto-style-147 auto-style-148 auto-style-149 auto-style-150 auto-style-151">
                              <span style={{fontSize:12, color:'#9fb9ff'}}>Dificuldade:</span>
                              <button
                                 className={`upload-btn auto-style-152 ${glitchDifficulty === 'easy' ? 'active' : ''}`}
                                 onClick={() => applyGlitchDifficulty('easy')}
                              >Fácil</button>
                              <button
                                 className={`upload-btn auto-style-153 ${glitchDifficulty === 'normal' ? 'active' : ''}`}
                                 onClick={() => applyGlitchDifficulty('normal')}
                              >Normal</button>
                              <button
                                 className={`upload-btn auto-style-154 ${glitchDifficulty === 'hard' ? 'active' : ''}`}
                                 onClick={() => applyGlitchDifficulty('hard')}
                              >Difícil</button>
                              {glitchDifficulty === 'custom' && <span style={{fontSize:11, color:'#c6a45f'}}>Personalizado</span>}
                           </div>
                           <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:8}}>
                               <label style={{fontSize:12, color:'#ccc'}}>Freq. (±)
                                  <input type="number" value={glitchToleranceFreq} onChange={e => { setGlitchDifficulty('custom'); setGlitchToleranceFreq(Math.max(0, parseInt(e.target.value) || 0)); }} min={0} max={10} style={{width:'100%', marginTop:4}} />
                               </label>
                               <label style={{fontSize:12, color:'#ccc'}}>Shift (±)
                                  <input type="number" value={glitchToleranceShift} onChange={e => { setGlitchDifficulty('custom'); setGlitchToleranceShift(Math.max(0, parseInt(e.target.value) || 0)); }} min={0} max={20} style={{width:'100%', marginTop:4}} />
                               </label>
                               <label style={{fontSize:12, color:'#ccc'}}>Chroma (±)
                                  <input type="number" value={glitchToleranceChroma} onChange={e => { setGlitchDifficulty('custom'); setGlitchToleranceChroma(Math.max(0, parseInt(e.target.value) || 0)); }} min={0} max={20} style={{width:'100%', marginTop:4}} />
                               </label>
                           </div>
                           <small style={{display:'block', marginTop:6, color:'#777'}}>Valores menores deixam o puzzle mais preciso; maiores permitem folga ao alinhar.</small>
                        </div>

                        <div className="auto-style-155">
                           <h5 style={{margin:'0 0 8px 0', color:'#64b5ff'}}>Pontos de partida para o jogador</h5>
                           <p style={{fontSize:11, color:'#888', marginBottom:8}}>Defina de onde os controles começam para não entregar a resposta de imediato.</p>
                           <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:10}}>
                              <label style={{display:'block', fontSize:12, color:'#ccc'}}>
                                 Frequência inicial
                                 <input type="number" value={glitchStartFrequency} onChange={e => setGlitchStartFrequency(parseInt(e.target.value) || 0)} min={1} max={50} style={{width:'100%', marginTop:4}} />
                              </label>
                              <label style={{display:'block', fontSize:12, color:'#ccc'}}>
                                 Deslocamento inicial (%)
                                 <input type="number" value={glitchStartShift} onChange={e => setGlitchStartShift(parseInt(e.target.value) || 0)} min={0} max={100} style={{width:'100%', marginTop:4}} />
                              </label>
                              <label style={{display:'block', fontSize:12, color:'#ccc'}}>
                                 Cromática inicial (%)
                                 <input type="number" value={glitchStartChromatic} onChange={e => setGlitchStartChromatic(parseInt(e.target.value) || 0)} min={0} max={100} style={{width:'100%', marginTop:4}} />
                              </label>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(imgFile || previewUrl) && (
                  <div className="auto-style-156 auto-style-157">
                     <div className="field-block" style={{flex:1, borderColor:'#b366ff'}}>
                        <span className="field-title" style={{color:'#b366ff'}}>2. LUZ NEGRA (UV)</span>
                        <p style={{fontSize:10, color:'#aaa'}}>Desenhe segredos visíveis apenas com lanterna.</p>
                           <div className="auto-style-158 auto-style-159 auto-style-160">
                           <button onClick={()=>setEditorMode('uv')} className="upload-btn">🖌️ DESENHAR EFEITO</button>
                           <button
                              onClick={() => {
                                 // Open UVEditor in RGB forensic mode
                                 try { setUvEditorBaseUrl(previewUrl); } catch (e) {}
                                 setUvEditorPurpose('forensic');
                                 setEditorMode('rgb');
                              }}
                              className="upload-btn"
                              title="Abrir UV Editor e salvar saída como camada forense"
                           >
                              🧪 ABRIR EDITOR (FORENSE)
                           </button>
                             {(forensicHiddenPreview || uvPreviewUrl) && (
                                <div className="auto-style-161 auto-style-162 auto-style-163">
                                   <img src={uvPreviewUrl || forensicHiddenPreview || ''} alt="UV preview" style={{width:88, height:64, objectFit:'cover', borderRadius:4, border:'1px solid rgba(255,255,255,0.06)'}} />
                                   <div className="auto-style-164 auto-style-165 auto-style-166">
                                      <button className="upload-btn" onClick={() => { 
                                        try { setUvEditorBaseUrl(uvPreviewUrl || forensicHiddenPreview || previewUrl); } catch(e){}; 
                                        if (forensicHiddenPreview) {
                                          setUvEditorPurpose('forensic');
                                          setEditorMode('rgb');
                                        } else {
                                          setEditorMode('uv');
                                        }
                                      }}>✏️ EDITAR {forensicHiddenPreview ? 'FORENSE (RGB)' : 'UV'}</button>
                                      <button className="upload-btn" onClick={() => { try { revokeUrl(uvPreviewUrl || forensicHiddenPreview); } catch(e){}; setUvPreviewUrl(null); setForensicHiddenPreview(null); setUvFile(null); setReplaceUv(true); }}>🗑️ REMOVER {forensicHiddenPreview ? 'FORENSE' : 'UV'}</button>
                                   </div>
                                </div>
                             )}
                           <label className="upload-btn">📂 UPLOAD PNG<input type="file" accept="image/png" hidden onChange={e => setUvFile(e.target.files?.[0] || null)} /></label>
                        </div>
                     </div>
                     <div className="field-block" style={{flex:1, borderColor:'#3498db'}}>
                        <span className="field-title" style={{color:'#3498db'}}>3. CAMADAS SECRETAS</span>
                        <p style={{fontSize:10, color:'#aaa'}}>Diferentes técnicas para esconder informações.</p>
                        
                        {/* FILTRO DE REVELAÇÃO */}
                        <div style={{marginBottom:15, padding:12, background:'rgba(52,152,219,0.05)', borderRadius:6, border:'1px solid rgba(52,152,219,0.2)'}}>
                           <div className="auto-style-167 auto-style-168 auto-style-169 auto-style-170">
                              <span style={{fontSize:11, fontWeight:'bold', color:'#3498db'}}>🔍 FILTRO DE REVELAÇÃO</span>
                           </div>
                           <p style={{fontSize:9, color:'#777', marginBottom:8}}>Desenhe segredos que aparecem ao ajustar brilho/contraste</p>
                           <button onClick={()=>setEditorMode('filter')} className="upload-btn auto-style-171 auto-style-172">
                              🖌️ DESENHAR CAMADA OCULTA
                           </button>
                           
                           {/* Advanced settings */}
                           <div className="auto-style-173">
                              <button 
                                 onClick={() => setShowAdvancedFilterSettings(!showAdvancedFilterSettings)}
                                 style={{
                                    background: showAdvancedFilterSettings ? 'rgba(52, 152, 219, 0.2)' : 'rgba(50,50,50,0.3)',
                                    border: '1px solid rgba(100,100,100,0.5)',
                                    color: '#888',
                                    padding: '6px 10px',
                                    fontSize: '9px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    width: '100%',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                 }}
                              >
                                 <span>⚙️ Configurações Avançadas</span>
                                 <span className="auto-style-174">{showAdvancedFilterSettings ? '▼' : '▶'}</span>
                              </button>
                              
                              {showAdvancedFilterSettings && (
                                 <div style={{
                                    marginTop:8, 
                                    background:'rgba(0,0,0,0.6)', 
                                    padding:10,
                                    borderRadius: '4px',
                                    border: '1px solid rgba(52, 152, 219, 0.3)'
                                 }}>
                                    <label style={{fontSize:9, color:'#888', display:'block', marginBottom:6}}>
                                       GATILHOS DE REVELAÇÃO (BRILHO / CONTRASTE / SATURAÇÃO)
                                    </label>
                                    <div className="auto-style-175 auto-style-176 auto-style-177">
                                       <div className="auto-style-178">
                                          <label style={{fontSize:8, color:'#666', display:'block'}}>BRILHO</label>
                                          <input 
                                             type="number" 
                                             placeholder="150" 
                                             value={filterRevealBrightness} 
                                             onChange={e=>setFilterRevealBrightness(Number(e.target.value))}
                                             style={{width:'100%', fontSize:'11px'}}
                                          />
                                       </div>
                                       <div className="auto-style-179">
                                          <label style={{fontSize:8, color:'#666', display:'block'}}>CONTRASTE</label>
                                          <input 
                                             type="number" 
                                             placeholder="150" 
                                             value={filterRevealContrast} 
                                             onChange={e=>setFilterRevealContrast(Number(e.target.value))}
                                             style={{width:'100%', fontSize:'11px'}}
                                          />
                                       </div>
                                       <div className="auto-style-180">
                                          <label style={{fontSize:8, color:'#666', display:'block'}}>SAT</label>
                                          <input 
                                             type="number" 
                                             placeholder="100" 
                                             value={filterRevealSaturate} 
                                             onChange={e=>setFilterRevealSaturate(Number(e.target.value))}
                                             style={{width:'100%', fontSize:'11px'}}
                                          />
                                       </div>
                                    </div>
                                    <div style={{fontSize:8, color:'#555', fontStyle:'italic'}}>
                                       💡 Valores mais altos = mais difícil revelar
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                        
                        {/* TERMAL */}
                        <div style={{marginBottom:0, padding:12, background:'rgba(255,100,0,0.05)', borderRadius:6, border:'1px solid rgba(255,100,0,0.2)'}}>
                           <div className="auto-style-181 auto-style-182 auto-style-183 auto-style-184">
                              <span style={{fontSize:11, fontWeight:'bold', color:'#ff6400'}}>🌡️ VISÃO TÉRMICA</span>
                           </div>
                           <p style={{fontSize:9, color:'#777', marginBottom:8}}>Simula câmera termográfica ao inspecionar</p>
                           <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px', background:'rgba(0,0,0,0.3)', borderRadius:4, marginBottom:8}}>
                              <input 
                                 type="checkbox" 
                                 checked={thermalEnabled} 
                                 onChange={e => setThermalEnabled(e.target.checked)}
                                 className="auto-style-185"
                              />
                              <span style={{fontSize:11, color:'#ccc'}}>Ativar modo termal na inspeção</span>
                           </label>
                           
                           {thermalEnabled && (
                              <div style={{marginTop:12, padding:10, background:'rgba(0,0,0,0.4)', borderRadius:4, border:'1px solid rgba(255,100,0,0.3)'}}>
                                 <div className="auto-style-186">
                                    <label style={{fontSize:10, color:'#ff9', display:'block', marginBottom:4}}>TEXTO SECRETO (visível apenas no modo termal)</label>
                                    <textarea 
                                       value={thermalSecretText}
                                       onChange={e => setThermalSecretText(e.target.value)}
                                       placeholder="Digite o texto que só aparece com visão térmica..."
                                       rows={3}
                                       style={{width:'100%', background:'#111', border:'1px solid #444', color:'#ff6400', padding:8, fontSize:11, borderRadius:4, fontFamily:'monospace'}}
                                    />
                                 </div>
                                 <div className="auto-style-187">
                                    <label style={{fontSize:10, color:'#ff9', display:'block', marginBottom:4}}>TAMANHO DA FONTE: {thermalFontSize}%</label>
                                    <input 
                                       type="range"
                                       min="50"
                                       max="200"
                                       value={thermalFontSize}
                                       onChange={e => setThermalFontSize(Number(e.target.value))}
                                       style={{width:'100%', accentColor:'#ff6400'}}
                                    />
                                    <p style={{fontSize:9, color:'#666', marginTop:2}}>50% = Pequeno | 100% = Normal | 200% = Gigante</p>
                                 </div>
                                 <div className="auto-style-188">
                                    <label style={{fontSize:10, color:'#ff9', display:'block', marginBottom:4}}>POSIÇÃO VERTICAL: {thermalPositionY}%</label>
                                    <input 
                                       type="range"
                                       min="0"
                                       max="100"
                                       value={thermalPositionY}
                                       onChange={e => setThermalPositionY(Number(e.target.value))}
                                       style={{width:'100%', accentColor:'#ff6400'}}
                                    />
                                    <p style={{fontSize:9, color:'#666', marginTop:2}}>0% = Topo | 50% = Meio | 100% = Fundo</p>
                                 </div>
                                 {(imgFile || previewUrl) && (
                                    <div className="auto-style-189">
                                       <button 
                                          onClick={() => setShowThermalEditor(true)}
                                          style={{width:'100%', padding:'10px', background:'linear-gradient(135deg, #ff6400, #ff9500)', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:'bold', transition:'all 0.2s'}}
                                          onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(255,100,0,0.6)'}
                                          onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                                       >
                                          🎨 ABRIR EDITOR DE POSIÇÃO
                                       </button>
                                    </div>
                                 )}
                                 <div>
                                    <label style={{fontSize:10, color:'#ff9', display:'block', marginBottom:4}}>PALAVRA-CHAVE PARA ATIVAR (opcional)</label>
                                    <input 
                                       type="text"
                                       value={thermalKeyword}
                                       onChange={e => setThermalKeyword(e.target.value)}
                                       placeholder="Ex: CALOR, TERMOGRAFIA, etc."
                                       style={{width:'100%', background:'#111', border:'1px solid #444', color:'#ff6400', padding:8, fontSize:11, borderRadius:4, fontFamily:'monospace'}}
                                    />
                                    <p style={{fontSize:9, color:'#666', marginTop:4, fontStyle:'italic'}}>Se definida, o jogador precisará digitar esta palavra no Terminal C.R.I.S. para desbloquear o modo termal.</p>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
                )}
              </>
            )}

                  {activeTab === 'audio' && (
                     <div className="form-row">
                        <div className="col">
                           {/* CAMADA A - ÁUDIO AMBIENTE */}
                           <div className="evidence-group" style={{borderColor: audioBase ? 'rgba(0,243,255,0.3)' : 'rgba(0,243,255,0.08)'}}>
                              <span className="group-title">🎵 CAMADA A: ÁUDIO AMBIENTE</span>
                              <p style={{fontSize:11, color:'#888', marginBottom:12, lineHeight:1.5}}>
                                 Som principal que o jogador ouve ao reproduzir a evidência (ex: música, conversa, ruído branco).
                              </p>
                              <div className="auto-style-190 auto-style-191 auto-style-192 auto-style-193">
                                 <label className="upload-btn auto-style-194 auto-style-195">
                                    📂 Selecionar Áudio
                                    <input type="file" accept="audio/*" hidden onChange={handleAudioBaseSelect} />
                                 </label>
                                 {/* [OUTDATED] - Antiga Estação de Mixagem removida a favor do AudioLab */}
                                 <button className="upload-btn auto-style-196" style={{opacity: 0.3, cursor: 'not-allowed'}} disabled title="Função absorvida pelo AudioLab">
                                    🎛️ <s>Estação de Mixagem</s> (Outdated)
                                 </button>
                              </div>
                              {audioBase && (
                                 <div style={{padding:'10px', background:'rgba(0,243,255,0.05)', borderRadius:'6px', border:'1px solid rgba(0,243,255,0.15)'}}>
                                    <div className="auto-style-197 auto-style-198 auto-style-199">
                                       <span className="auto-style-200">✓</span>
                                       <span className="file-status auto-style-201">{audioBase.name}</span>
                                    </div>
                                 </div>
                              )}
                           </div>

                           {/* CAMADA B - SINAL OCULTO */}
                           <div className="evidence-group" style={{borderColor: audioHidden ? 'rgba(198,164,95,0.4)' : 'rgba(198,164,95,0.1)', background: audioHidden ? 'linear-gradient(145deg, rgba(198,164,95,0.05), rgba(0,0,0,0.3))' : undefined}}>
                              <span className="group-title" style={{color:'#c6a45f'}}>👻 CAMADA B: SINAL OCULTO (EVP)</span>
                              <p style={{fontSize:11, color:'#888', marginBottom:12, lineHeight:1.5}}>
                                 Informação secreta escondida no áudio. Pode ser voz reversa, espectrograma com imagem, ou sinal codificado.
                              </p>
                              <div className="auto-style-202 auto-style-203 auto-style-204 auto-style-205">
                                 <label className="upload-btn" style={{flex:1, minWidth:'180px', borderColor:'rgba(198,164,95,0.3)', color:'#c6a45f'}}>
                                    📂 Upload de Áudio
                                    <input type="file" accept="audio/*" hidden onChange={handleAudioHiddenSelect} />
                                 </label>
                                 {/* [OUTDATED] - Antiga Forja de FX removida a favor do AudioLab */}
                                 <button 
                                    className="upload-btn" 
                                    disabled
                                    style={{minWidth:'180px', borderColor:'rgba(198,164,95,0.1)', color:'rgba(198,164,95,0.3)', cursor: 'not-allowed'}}
                                    title="Função absorvida pelo AudioLab"
                                 >
                                    🛠️ Forja de FX
                                 </button>
                              </div>
                              {audioHidden && (
                                 <div style={{padding:'10px', background:'rgba(198,164,95,0.08)', borderRadius:'6px', border:'1px solid rgba(198,164,95,0.2)'}}>
                                    <div className="auto-style-206 auto-style-207 auto-style-208 auto-style-209">
                                       <span className="auto-style-210">✓</span>
                                       <span className="file-status" style={{margin:0, background:'rgba(198,164,95,0.15)', color:'#c6a45f'}}>{audioHidden.name}</span>
                                       {audioHiddenUploading && (
                                          <span style={{fontSize:11, color:'#c6a45f', padding:'4px 8px', background:'rgba(198,164,95,0.1)', borderRadius:'4px'}}>
                                             ⏳ Enviando...
                                          </span>
                                       )}
                                       {audioHiddenUploadedUrl && !audioHiddenUploading && (
                                          <a 
                                             href={audioHiddenUploadedUrl} 
                                             target="_blank" 
                                             rel="noreferrer" 
                                             style={{fontSize:11, color:'#9cf', textDecoration:'underline'}}
                                          >
                                             🔗 Ver arquivo enviado
                                          </a>
                                       )}
                                    </div>
                                 </div>
                              )}
                           </div>

                           {/* CONFIGURAÇÃO DO ENIGMA */}
                           {audioBase && audioHidden && (
                              <div className="evidence-group" style={{borderColor:'rgba(179,51,51,0.4)', background:'linear-gradient(145deg, rgba(179,51,51,0.05), rgba(0,0,0,0.3))'}}>
                                 <span className="group-title" style={{color:'#ff003c'}}>⚙️ CONFIGURAÇÃO DO ENIGMA</span>
                                 <p style={{fontSize:11, color:'#888', marginBottom:12, lineHeight:1.5}}>
                                    Defina a frequência que o jogador precisa sintonizar para revelar o sinal oculto.
                                 </p>
                                 <div className="evp-config-row">
                                    <label>FREQUÊNCIA ALVO</label>
                                    <input 
                                       type="range" 
                                       min="0" 
                                       max="100" 
                                       value={freq} 
                                       onChange={e => setFreq(Number(e.target.value))} 
                                       style={{accentColor:'#ff003c', flex:1}} 
                                    />
                                    <span>{freq} Hz</span>
                                 </div>
                                 <div style={{marginTop:10, padding:'10px', background:'rgba(0,0,0,0.3)', borderRadius:'6px', border:'1px solid rgba(179,51,51,0.2)'}}>
                                    <small style={{fontSize:10, color:'#888', display:'block', lineHeight:1.4}}>
                                       💡 <strong style={{color:'#ff003c'}}>Dica:</strong> O jogador precisará mover o dial de sintonia até <strong>{freq} Hz</strong> para ouvir/visualizar o Sinal Oculto. Valores mais altos = mais difícil de encontrar.
                                    </small>
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* PAINEL DE TESTE */}
                        <div className="col">
                           <div className="evidence-group" style={{minHeight: '600px', display: 'flex', flexDirection: 'column', borderColor:'rgba(0,243,255,0.15)'}}>
                              <span className="group-title">🎧 PAINEL DE TESTE E PREVIEW</span>
                              {audioBasePreview ? (
                                 <div className="flex-1 flex flex-col gap-3">
                                   <p style={{fontSize:11, color:'#888', marginBottom:8, lineHeight:1.5}}>
                                      Use as ferramentas abaixo para testar como o áudio ficará no jogo.
                                   </p>
                                   
                                   {/* AudioLab — unified steganography studio */}
                                   <div style={{marginTop:12}}>
                                      <button
                                        style={{
                                          display:'flex', alignItems:'center', gap:8,
                                          padding:'10px 18px', borderRadius:6, cursor:'pointer',
                                          background:'linear-gradient(135deg,#00c3cc,#0066ff)',
                                          border:'none', color:'#fff', fontWeight:700, fontSize:13,
                                          letterSpacing:'0.5px', boxShadow:'0 0 16px #00f3ff44'
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setShowAudioForgeFor('hidden');
                                        }}
                                      >
                                        🎛 Abrir AudioLab
                                      </button>
                                      {audioHidden && (
                                        <span style={{display:'block',marginTop:6,fontSize:11,color:'#00f3ffaa'}}>
                                          ✓ {audioHidden.name} carregado
                                        </span>
                                      )}
                                   </div>
                                 </div>
                              ) : (
                                 <div style={{
                                    flex:1, 
                                    display:'flex', 
                                    alignItems:'center', 
                                    justifyContent:'center', 
                                    textAlign:'center',
                                    padding:'40px',
                                    background:'rgba(0,0,0,0.2)',
                                    borderRadius:'8px',
                                    border:'1px dashed rgba(255,255,255,0.05)'
                                 }}>
                                    <div>
                                       <div className="auto-style-211 auto-style-212 auto-style-213">🎵</div>
                                       <p style={{fontSize:13, color:'#666', lineHeight:1.6}}>
                                          Selecione um áudio ambiente<br/>
                                          <span className="auto-style-214">(Camada A) para iniciar o teste</span>
                                       </p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  )}

            {activeTab === 'cifra' && (
              <div className="field-block">
                 <span className="field-title">DOCUMENTO / TRADUÇÃO</span>
                 
                 {/* Shredder Puzzle Configuration */}
                 
                 {/* ⚠️ Aviso se evidenceType não for 'document' */}
                 {isShredded && evidenceType !== 'document' && (
                   <div style={{
                     padding: '10px 14px',
                     background: 'rgba(255, 100, 50, 0.15)',
                     border: '2px solid rgba(255, 100, 50, 0.5)',
                     borderRadius: 6,
                     marginBottom: 12,
                     fontSize: 12,
                     color: '#faa',
                     fontWeight: 'bold'
                   }}>
                     ⚠️ <strong>ATENÇÃO:</strong> O puzzle triturado só funciona com evidências do tipo "document". 
                     Atualmente o tipo está como "{evidenceType}". 
                     <button 
                       onClick={() => setEvidenceType('document')}
                       style={{
                         marginLeft: 10,
                         padding: '4px 8px',
                         background: '#252',
                         color: '#8f8',
                         border: '1px solid #373',
                         borderRadius: 4,
                         cursor: 'pointer',
                         fontSize: 11
                       }}
                     >
                       ✓ Corrigir para "document"
                     </button>
                   </div>
                 )}
                 
                 <div 
                   className={isShredded ? 'shredder-config-active' : ''}
                   style={{ 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: 10, 
                     marginBottom: 10,
                     padding: isShredded ? '10px' : '0',
                     background: isShredded ? 'rgba(100, 150, 255, 0.1)' : 'transparent',
                     border: isShredded ? '2px solid rgba(100, 150, 255, 0.3)' : 'none',
                     borderRadius: 6,
                     transition: 'all 0.2s ease',
                     opacity: (!previewUrl && !imgFile && !existingCard?.image_url) ? 0.5 : 1
                   }}
                 >
                    <input 
                      type="checkbox" 
                      id="shred-check" 
                      checked={isShredded} 
                      onChange={e => {
                        if (!previewUrl && !imgFile && !existingCard?.image_url) {
                          alert('❌ Por favor, envie uma imagem na aba 👁️ VISUAL antes de ativar o puzzle triturado.');
                          return;
                        }
                        setIsShredded(e.target.checked);
                      }}
                      disabled={!previewUrl && !imgFile && !existingCard?.image_url}
                    />
                    <label 
                      htmlFor="shred-check" 
                      style={{ 
                        margin: 0, 
                        cursor: (!previewUrl && !imgFile && !existingCard?.image_url) ? 'not-allowed' : 'pointer', 
                        fontWeight: isShredded ? 'bold' : 'normal' 
                      }}
                    >
                      📄 Documento Triturado (Puzzle)
                    </label>
                    {(!previewUrl && !imgFile && !existingCard?.image_url) && (
                      <span className="shredder-warning">
                        ⚠️ Envie uma imagem primeiro
                      </span>
                    )}
                 </div>
                 {isShredded && (
                    <>
                      <div className="flex auto-style-215 items-start auto-style-216 flex-col">
                         <div style={{ width: '100%' }}>
                            <label className="auto-style-217 auto-style-218">Formato do Puzzle</label>
                            <div className="flex auto-style-219 auto-style-220">
                               <button 
                                 className={`btn-stamp shredder-format-btn ${shredRows === 1 && shredCols === 8 ? 'active' : ''}`} 
                                 onClick={() => { setShredRows(1); setShredCols(8); }}
                               >
                                 📋 Tiras (1x8)
                               </button>
                               <button 
                                 className={`btn-stamp shredder-format-btn ${shredRows === 4 && shredCols === 4 ? 'active' : ''}`} 
                                 onClick={() => { setShredRows(4); setShredCols(4); }}
                               >
                                 🔲 Grade (4x4)
                               </button>
                               <button 
                                 className={`btn-stamp shredder-format-btn ${shredRows === 8 && shredCols === 1 ? 'active' : ''}`} 
                                 onClick={() => { setShredRows(8); setShredCols(1); }}
                               >
                                 📑 Tiras Verticais (8x1)
                               </button>
                            </div>
                            
                            {/* Configuração personalizada */}
                            <div style={{ 
                              display: 'flex', 
                              gap: 12, 
                              alignItems: 'flex-end',
                              padding: '10px',
                              background: 'rgba(0, 243, 255, 0.05)',
                              border: '1px solid rgba(0, 243, 255, 0.15)',
                              borderRadius: 6
                            }}>
                              <div className="flex-1">
                                <label style={{ fontSize: 11, color: '#8fa', marginBottom: 4, display: 'block' }}>
                                  📏 Linhas (Rows)
                                </label>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="10"
                                  value={shredRows} 
                                  onChange={e => setShredRows(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                  }}
                                />
                              </div>
                              
                              <div style={{ 
                                fontSize: 20, 
                                color: 'var(--nexus-blue)', 
                                fontWeight: 'bold',
                                paddingBottom: 6
                              }}>×</div>
                              
                              <div className="flex-1">
                                <label style={{ fontSize: 11, color: '#8fa', marginBottom: 4, display: 'block' }}>
                                  📐 Colunas (Cols)
                                </label>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="10"
                                  value={shredCols} 
                                  onChange={e => setShredCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                  }}
                                />
                              </div>
                              
                              <div style={{ 
                                flex: 1,
                                padding: '8px 12px',
                                background: 'rgba(0, 243, 255, 0.1)',
                                border: '1px solid rgba(0, 243, 255, 0.25)',
                                borderRadius: 4,
                                textAlign: 'center'
                              }}>
                                <div style={{ fontSize: 10, color: '#8fa', marginBottom: 2 }}>Total de Peças</div>
                                <div style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--nexus-blue)' }}>
                                  {shredRows * shredCols}
                                </div>
                              </div>
                            </div>
                         </div>
                      </div>
                      <div className="shredder-confirmation">
                        ✓ <strong>Configurado!</strong> Quando você abrir esta evidência como Game Master, 
                        aparecerão os controles de revelação de peças no modal de inspeção.
                        <div style={{ 
                          marginTop: 8, 
                          padding: '6px 10px', 
                          background: 'rgba(100, 150, 255, 0.1)', 
                          borderRadius: 4,
                          fontSize: 10,
                          color: '#aaf',
                          borderLeft: '2px solid rgba(100, 150, 255, 0.4)'
                        }}>
                          <strong>📋 Formato:</strong> {shredRows === 1 ? `Tiras horizontais (${shredCols} peças)` : shredCols === 1 ? `Tiras verticais (${shredRows} peças)` : `Grade ${shredRows}x${shredCols} (${shredRows * shredCols} peças)`}<br />
                          <strong>🎮 GM Controles:</strong> Revelar gradualmente, Ctrl+Click individual, Preview da imagem<br />
                          <strong>👥 Jogadores:</strong> Só veem e manipulam peças reveladas pelo GM
                        </div>
                      </div>
                    </>
                 )}
                 
                 {!isShredded && (previewUrl || imgFile || existingCard?.image_url) && (
                   <div className="shredder-hint">
                     💡 <strong>Dica:</strong> Marque a opção acima para transformar a imagem em um puzzle triturado. 
                     Os jogadores precisarão reconstruir o documento conforme você revela as peças.
                   </div>
                 )}
                 
                 <div className="auto-style-221">
                    <label>TEXTO REAL (opcional)</label>
                    <textarea rows={2} value={realText} onChange={e => setRealText(e.target.value)} placeholder="Texto em Português que aparecerá com a lente." />
                 </div>
                 <div className="auto-style-222">
                    <label>TEXTO CIFRADO (opcional)</label>
                    <input value={cipherText} onChange={e => setCipherText(e.target.value)} placeholder="Deixe vazio para gerar símbolos automáticos" />
                 </div>

                 <div style={{ marginTop: 16, padding: '10px', background: 'rgba(100,100,255,0.08)', border: '1px solid rgba(100,100,255,0.2)', borderRadius: 6 }}>
                    <label className="flex items-center auto-style-223">
                       <span className="auto-style-224">⌨️ CÓDIGO HEXADECIMAL</span>
                    </label>
                    <small style={{ display: 'block', marginTop: 6, color: '#888' }}>Mensagem que aparecerá no Inspetor Hexadecimal dentro do código aleatório.</small>
                    <textarea 
                       rows={2} 
                       value={hexCode} 
                       onChange={e => setHexCode(e.target.value)} 
                       placeholder="Ex: SAFE_ROOM_LEVEL_7 ou CLASSIFIED_DATA_2025"
                       style={{ width: '100%', marginTop: 6, background: '#0a0a1a', border: '1px solid rgba(100,100,255,0.3)', color: '#8fb', fontFamily: 'monospace', fontSize: 11 }}
                    />
                   <div className="flex auto-style-225 auto-style-226 items-center">
                      <label className="auto-style-227">Método:</label>
                      <select value={hexEncodingMethod} onChange={e => setHexEncodingMethod(e.target.value as any)}>
                         <option value="plain">Texto (padrão)</option>
                         <option value="utf8hex">Hex (UTF-8)</option>
                         <option value="xor">XOR + Hex</option>
                         <option value="enigma">Enigma-simples + Hex</option>
                      </select>
                      {(hexEncodingMethod === 'xor' || hexEncodingMethod === 'enigma') && (
                        <input placeholder="Chave" value={hexEncodingKey} onChange={e => setHexEncodingKey(e.target.value)} className="auto-style-228" />
                      )}
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'glitch' && (
              <div className="field-block">
                 <span className="field-title">🧩 CONFIGURAÇÃO DO QUEBRA-CABEÇA DE GLITCH</span>
                 <div style={{marginBottom:20, padding:'12px', background:'rgba(12,16,28,0.65)', border:'1px solid rgba(100,150,255,0.3)', borderRadius:8}}>
                    <h4 style={{color:'#64b5ff', marginTop:0}}>📸 BASE VISUAL</h4>
                    <p style={{fontSize:11, color:'#9fb9ff', marginBottom:8}}>
                      Use apenas a aba Visual & Mídia para enviar imagem ou vídeo. Esta aba define apenas a lógica de destravamento.
                    </p>
                    {!previewUrl && (
                      <div style={{padding:10, border:'1px dashed rgba(100,150,255,0.4)', borderRadius:6, color:'#8096c8', fontSize:11}}>
                        Selecione a mídia na aba Visual para habilitar os controles de glitch.
                      </div>
                    )}
                    {previewUrl && (
                      <div style={{padding:10, background:'rgba(0,0,0,0.3)', borderRadius:6, border:'1px solid rgba(100,150,255,0.2)', display:'flex', flexDirection:'column', gap:8}}>
                                    <span style={{fontSize:11, color:'#9fb9ff'}}>Mídia conectada. Ajuste os sliders na aba Visual para definir o quebra-cabeça.</span>
                        {glitchFocusedImagePreview && (
                          <div className="auto-style-229 auto-style-230 auto-style-231 auto-style-232">
                             <span className="auto-style-233">✓</span>
                             <span style={{fontSize:11, color:'#7bd7ff'}}>Camada de foco pronta — criada no Designer da aba Visual.</span>
                          </div>
                        )}
                      </div>
                    )}
                 </div>

                {/* Briefing e dica rápida */}
                <div className="auto-style-234">
                   <h4 style={{color:'#64b5ff', marginTop:0}}>🧭 BRIEFING DO PUZZLE</h4>
                   <label>Como o jogador encontra/ativa este puzzle?</label>
                   <textarea
                      value={glitchAccessInstructions}
                      onChange={e => setGlitchAccessInstructions(e.target.value)}
                      rows={3}
                      placeholder="Ex: Precisam abrir este card e usar o painel de decodificação para alinhar as barras..."
                      style={{width:'100%', marginTop:4}}
                   />

                   <label className="auto-style-235 auto-style-236">Dica curta (opcional)</label>
                   <textarea
                      value={glitchHint}
                      onChange={e => setGlitchHint(e.target.value)}
                      rows={2}
                      placeholder="Ex: Frequência baixa, deslocamento no terço inferior, cromática baixa."
                      style={{width:'100%', marginTop:4}}
                   />
                </div>

                <div style={{marginBottom:20, padding:'12px', background:'rgba(18,24,40,0.7)', border:'1px solid rgba(100,150,255,0.25)', borderRadius:8}}>
                   <h4 style={{color:'#64b5ff', marginTop:0}}>🔒 CONTROLE DE LIBERAÇÃO</h4>
                   <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:10}}>
                      <label style={{fontSize:12, color:'#ccc', display:'flex', flexDirection:'column', gap:6}}>
                         Áudio base
                         <select value={mediaVisibility.audioBase} onChange={e => setMediaVisibility(v => ({ ...v, audioBase: e.target.value as any }))}>
                            <option value="always">Sempre disponível</option>
                            <option value="glitch_only">Apenas durante o glitch</option>
                            <option value="post_solve">Só após resolver</option>
                         </select>
                      </label>
                      <label style={{fontSize:12, color:'#ccc', display:'flex', flexDirection:'column', gap:6}}>
                         Áudio secreto (EVP)
                         <select value={mediaVisibility.audioHidden} onChange={e => setMediaVisibility(v => ({ ...v, audioHidden: e.target.value as any }))}>
                            <option value="post_solve">Após estabilizar o sinal</option>
                            <option value="post_keyword">Após senha/palavra-chave</option>
                         </select>
                      </label>
                      <label style={{fontSize:12, color:'#ccc', display:'flex', flexDirection:'column', gap:6}}>
                         Visual / Vídeo
                         <select value={mediaVisibility.visual} onChange={e => setMediaVisibility(v => ({ ...v, visual: e.target.value as any }))}>
                            <option value="glitch_active">Glitch ativo desde o início</option>
                            <option value="post_keyword">Revelado por senha</option>
                         </select>
                      </label>
                      <label style={{fontSize:12, color:'#ccc', display:'flex', flexDirection:'column', gap:6}}>
                         Camada UV / Segredo
                         <select value={mediaVisibility.uvLayer} onChange={e => setMediaVisibility(v => ({ ...v, uvLayer: e.target.value as any }))}>
                            <option value="post_keyword">Só após assinatura</option>
                            <option value="post_solve">Após alinhar sliders</option>
                            <option value="always">Sempre visível</option>
                         </select>
                      </label>
                   </div>
                </div>

                <div style={{marginBottom:20, padding:'12px', background:'rgba(15,20,30,0.7)', border:'1px solid rgba(100,150,255,0.2)', borderRadius:8}}>
                   <h4 style={{color:'#64b5ff', marginTop:0}}>🎧 LÓGICA DE PISTA SONORA</h4>
                   <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#ccc', cursor:'pointer'}}>
                      <input type="checkbox" checked={audioStaticSync} onChange={e => setAudioStaticSync(e.target.checked)} />
                      <span>Sincronizar ruído/estática com os sliders (mais chiado longe da solução)</span>
                   </label>
                </div>

                <div style={{marginBottom:20, padding:'12px', background:'rgba(12,12,18,0.7)', border:'1px solid rgba(100,150,255,0.15)', borderRadius:8}}>
                   <h4 style={{color:'#64b5ff', marginTop:0}}>🧠 CONEXÕES NARRATIVAS</h4>
                   <div className="auto-style-237 auto-style-238 auto-style-239">
                      <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#ccc'}}>
                         <input type="checkbox" checked={narrativeLinks.audioHintsVisual} onChange={e => setNarrativeLinks(v => ({ ...v, audioHintsVisual: e.target.checked }))} />
                         O áudio contém a dica para o ajuste visual
                      </label>
                      <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#ccc'}}>
                         <input type="checkbox" checked={narrativeLinks.visualHintsCode} onChange={e => setNarrativeLinks(v => ({ ...v, visualHintsCode: e.target.checked }))} />
                         A camada focada traz a senha/código final
                      </label>
                      <textarea
                         rows={3}
                         placeholder="Observação narrativa opcional (ex: A frequência está no chiado)"
                         value={narrativeLinks.hintNote}
                         onChange={e => setNarrativeLinks(v => ({ ...v, hintNote: e.target.value }))}
                         style={{width:'100%', background:'rgba(0,0,0,0.45)', border:'1px solid rgba(100,150,255,0.2)', color:'#cde', fontSize:12}}
                      />
                   </div>
                </div>

                 {/* Seção de Recompensa */}
                 <div>
                    <h4 style={{color:'#64b5ff', marginTop:0}}>🎁 RECOMPENSA AO RESOLVER</h4>
                   <label>Modo de desbloqueio:</label>
                   <select
                      value={glitchUnlockMode}
                      onChange={e => {
                        const val = e.target.value as any;
                        setGlitchUnlockMode(val);
                        if (val === 'code') setGlitchRequireKeyword(false);
                        if (val === 'code_plus_keyword') setGlitchRequireKeyword(true);
                        if (val === 'media') setGlitchRequireKeyword(false);
                        if (val === 'media_and_code') setGlitchRequireKeyword(true);
                      }}
                      disabled={loading}
                      style={{width:'100%', marginTop:4, marginBottom:12}}
                   >
                      <option value="code">Código direto (após alinhar)</option>
                      <option value="code_plus_keyword">Código + assinatura digitada</option>
                      <option value="media">Só mídia oculta (sem código)</option>
                      <option value="media_and_code">Mídia + código (exige assinatura)</option>
                   </select>

                   <div style={{marginBottom:12, padding:'10px', background:'rgba(100,150,255,0.08)', border:'1px solid rgba(100,150,255,0.2)', borderRadius:6}}>
                      <label className="auto-style-240 auto-style-241 auto-style-242 auto-style-243">
                        <input type="checkbox" checked={glitchRequireKeyword} onChange={e => setGlitchRequireKeyword(e.target.checked)} disabled={loading} />
                        <span>Exigir digitação pós-ajuste (assinatura digital)</span>
                      </label>
                      <small style={{display:'block', marginTop:6, color:'#888'}}>Se marcado, alinhar os sliders apenas revela a imagem; o jogador precisa digitar a palavra/número escondido para liberar o código final.</small>
                   </div>

                   <label>Senha da Imagem (Input Key):</label>
                   <input
                      type="text"
                      value={glitchKeyword}
                      onChange={e => setGlitchKeyword(e.target.value)}
                      disabled={loading}
                      maxLength={120}
                      placeholder="Ex: SALA 104, GATEWAY, PHOENIX"
                      style={{width:'100%', marginTop:4, marginBottom:8}}
                   />
                   <small style={{display:'block', marginTop:2, color:'#777'}}>Palavra/número que o jogador deve extrair da imagem limpa (ou camada UV).</small>

                   <div style={{marginTop:16, padding:'10px', background:'rgba(100,150,255,0.05)', border:'1px solid rgba(100,150,255,0.15)', borderRadius:6}}>
                     <h5 style={{margin:'0 0 8px 0', color:'#64b5ff'}}>Mídia Oculta (opcional)</h5>
                     <label>URL de Áudio Secreto:</label>
                     <input
                        type="text"
                        value={glitchHiddenAudioUrl}
                        onChange={e => setGlitchHiddenAudioUrl(e.target.value)}
                        disabled={loading}
                        placeholder="https://.../secreto.mp3"
                        style={{width:'100%', marginTop:4, marginBottom:8}}
                     />
                     <label>URL de Vídeo Secreto:</label>
                     <input
                        type="text"
                        value={glitchHiddenVideoUrl}
                        onChange={e => setGlitchHiddenVideoUrl(e.target.value)}
                        disabled={loading}
                        placeholder="https://.../secreto.mp4"
                        style={{width:'100%', marginTop:4}}
                     />
                     <small style={{display:'block', marginTop:6, color:'#777'}}>Você também pode enviar uma camada UV na aba geral; ela será usada como pista oculta.</small>
                   </div>
                    
                    <label>Código de Recompensa (ex: ALPHA-01, BETA-02):</label>
                    <input
                       type="text"
                       value={glitchRewardCode}
                       onChange={e => setGlitchRewardCode(e.target.value.toUpperCase())}
                       disabled={loading}
                       maxLength={20}
                       placeholder="ALPHA-01"
                       style={{width:'100%', marginTop:4}}
                    />
                    <small style={{display:'block', marginTop:6, color:'#666'}}>
                       Este código será revelado quando o jogador resolver corretamente o quebra-cabeça
                    </small>
                 </div>
              </div>
            )}

            {activeTab === 'mega' && (
              <div className="field-block">
                 <span className="field-title">🔐 CONFIGURAÇÃO DA MEGA-PISTA (VERDADE FINAL)</span>
                 
                 {/* Seção: Verdade Final */}
                 <div className="auto-style-244">
                    <h4 style={{color:'#ff6400', marginTop:0}}>🌟 A VERDADE FINAL</h4>
                    <label>Texto da Verdade (será revelado ao desbloquear):</label>
                    <textarea
                       value={megaFinalTruthText}
                       onChange={e => setMegaFinalTruthText(e.target.value)}
                       disabled={loading}
                       rows={6}
                       maxLength={2000}
                       placeholder="Insira aqui o texto completo da verdade que será revelada quando todos os códigos forem coletados..."
                       style={{width:'100%', marginTop:4}}
                    />
                    <small style={{display:'block', marginTop:6, color:'#666'}}>Caracteres: {megaFinalTruthText.length}/2000</small>
                 </div>

                 {/* Seção: Imagem */}
                 <div className="auto-style-245">
                    <h4 style={{color:'#ff6400', marginTop:0}}>🖼 IMAGEM DA VERDADE (opcional)</h4>
                    <label>Upload da imagem final:</label>
                    <div className="auto-style-246 auto-style-247 auto-style-248 auto-style-249">
                       <label className="upload-btn auto-style-250">📂 SELECIONAR<input type="file" accept="image/*" hidden onChange={handleMegaImageSelect} disabled={loading} /></label>
                    </div>
                    {megaImagePreview && (
                       <div style={{marginTop:8, padding:10, background:'rgba(0,0,0,0.3)', borderRadius:6, border:'1px solid rgba(255,100,0,0.2)'}}>
                          <div className="auto-style-251 auto-style-252 auto-style-253">
                             <span className="auto-style-254">✓</span>
                             <span style={{color:'#888', fontSize:11}}>{megaImageFile?.name}</span>
                          </div>
                          <img src={megaImagePreview} alt="Imagem Final" style={{maxWidth:'100%', maxHeight:150, marginTop:8, borderRadius:4}} />
                       </div>
                    )}
                 </div>

                 {/* Seção: Seleção de Puzzles Necessários */}
                 <div>
                    <h4 style={{color:'#ff6400', marginTop:0}}>🧩 QUEBRA-CABEÇAS NECESSÁRIOS PARA DESBLOQUEAR</h4>
                    <p style={{fontSize:11, color:'#888', marginBottom:12}}>Selecione quais Glitch Puzzles são necessários para desbloquear esta mega-pista.</p>

                    {availablePuzzles.length > 0 && (
                       <div className="auto-style-255 auto-style-256 auto-style-257 auto-style-258">
                          <select
                            value={megaSelectedPuzzle}
                            onChange={e => setMegaSelectedPuzzle(e.target.value)}
                            style={{flex:1, padding:'8px', background:'#120c08', color:'#fff', border:'1px solid rgba(255,100,0,0.4)', borderRadius:4}}
                          >
                            <option value="">Escolha uma pista para vincular</option>
                            {availablePuzzles.map(p => (
                              <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                          <button
                            className="upload-btn auto-style-259"
                            onClick={() => {
                              if (megaSelectedPuzzle && !megaRequiredPuzzleIds.includes(megaSelectedPuzzle)) {
                                setMegaRequiredPuzzleIds([...megaRequiredPuzzleIds, megaSelectedPuzzle]);
                                setMegaSelectedPuzzle('');
                              }
                            }}
                            disabled={!megaSelectedPuzzle}
                          >
                            Adicionar
                          </button>
                       </div>
                    )}
                    
                    {availablePuzzles.length === 0 ? (
                       <div style={{padding:12, background:'rgba(0,0,0,0.3)', borderRadius:6, border:'1px dashed rgba(255,100,0,0.3)', color:'#888', fontSize:11, textAlign:'center'}}>
                          Nenhum quebra-cabeça de glitch encontrado nesta investigação. Crie pelo menos um para criar uma mega-pista.
                       </div>
                    ) : (
                       <div className="auto-style-260 auto-style-261 auto-style-262">
                          {availablePuzzles.map(puzzle => (
                             <label key={puzzle.id} style={{display:'flex', alignItems:'center', gap:8, padding:8, background:'rgba(0,0,0,0.2)', borderRadius:4, cursor:'pointer'}}>
                                <input
                                   type="checkbox"
                                   checked={megaRequiredPuzzleIds.includes(puzzle.id)}
                                   onChange={e => {
                                      if (e.target.checked) {
                                         setMegaRequiredPuzzleIds([...megaRequiredPuzzleIds, puzzle.id]);
                                      } else {
                                         setMegaRequiredPuzzleIds(megaRequiredPuzzleIds.filter(id => id !== puzzle.id));
                                      }
                                   }}
                                   disabled={loading}
                                   className="auto-style-263"
                                />
                                <span style={{color:'#ccc', fontSize:12}}>{puzzle.title}</span>
                             </label>
                          ))}
                       </div>
                    )}
                    
                    {megaRequiredPuzzleIds.length > 0 && (
                       <div style={{marginTop:12, padding:10, background:'rgba(255,100,0,0.1)', borderRadius:6, border:'1px solid rgba(255,100,0,0.2)', fontSize:10, color:'#aaa'}}>
                          ✓ {megaRequiredPuzzleIds.length} quebra-cabeça{megaRequiredPuzzleIds.length !== 1 ? 's' : ''} selecionado{megaRequiredPuzzleIds.length !== 1 ? 's' : ''}
                       </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'campos' && (
              <div className="field-block config-visibility-tab">
                <span className="field-title">👁️ CONFIGURAÇÃO DE PRIVACIDADE DA EVIDÊNCIA</span>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 15 }}>
                  Determine quais informações o C.R.I.S. revelará ao jogador quando ele inspecionar esta pista.
                </p>

                {/* SEÇÃO DE PRESETS RÁPIDOS */}
                <div className="presets-row" style={{ display: 'flex', gap: 8, marginBottom: 20, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                  <span style={{ fontSize: 10, color: '#aaa', alignSelf: 'center', marginRight: 5 }}>🚀 PRESETS:</span>
                  <button className="upload-btn" onClick={() => setFieldVisibilityConfig(VISIBILITY_PRESETS.MINIMAL as any)}>🔒 MÍNIMO</button>
                  <button className="upload-btn" onClick={() => setFieldVisibilityConfig(VISIBILITY_PRESETS.DEFAULT as any)}>✅ PADRÃO</button>
                  <button className="upload-btn" onClick={() => setFieldVisibilityConfig(VISIBILITY_PRESETS.FULL as any)} style={{ color: '#ff6464' }}>🔓 TUDO (CUIDADO)</button>
                </div>

                {/* GRID DE CONFIGURAÇÕES */}
                <div className="auto-style-264 auto-style-265 auto-style-266">
                  
                  {/* COLUNA 1: PROPRIEDADES DO ARQUIVO */}
                  <div className="config-group">
                    <h4 style={{ fontSize: 12, color: '#c6a45f', marginBottom: 10, borderBottom: '1px solid #333' }}>📄 PROPRIEDADES DO ARQUIVO</h4>
                    <div className="flex flex-col auto-style-267">
                      {[
                        { id: 'fileType', label: '📄 Tipo de Arquivo' },
                        { id: 'size', label: '📊 Tamanho (Bytes)' },
                        { id: 'cameraModel', label: '📷 Modelo da Câmera' },
                        { id: 'dateCreated', label: '📅 Data de Criação' },
                        { id: 'gpsCoords', label: '🗺️ Coordenadas GPS' },
                        { id: 'ownerName', label: '👤 Proprietário do Arquivo' },
                        { id: 'hexComment', label: '🔧 Comentários HEX' },
                        { id: 'technicalNote', label: '📝 Notas Técnicas' },
                        { id: 'stamp', label: '🔖 Carimbo/Stamp' },
                        { id: 'externalLink', label: '🔗 Link Externo' },
                        { id: 'fakeLocation', label: '📍 Localização Falsa' },
                        { id: 'isLocked', label: '🔒 Bloqueado' },
                        { id: 'lockPassword', label: '🔑 Senha de Desbloqueio' },
                        { id: 'isPerson', label: '👤 Dossiê de Pessoa' },
                        { id: 'personName', label: '📛 Nome da Pessoa' },
                        { id: 'personDob', label: '🎂 Data de Nascimento' },
                        { id: 'personStatus', label: '💓 Status Vital' },
                        { id: 'personOccupation', label: '💼 Ocupação' },
                      ].map(f => (
                        <label key={f.id} className="checkbox-label flex items-center auto-style-268 auto-style-269 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={fieldVisibilityConfig.fileProperties.visibleFields.includes(f.id as any)}
                            onChange={(e) => {
                              const current = fieldVisibilityConfig.fileProperties.visibleFields;
                              const next = e.target.checked ? [...current, f.id] : current.filter(x => x !== f.id);
                              setFieldVisibilityConfig({ ...fieldVisibilityConfig, fileProperties: { visibleFields: next as any } });
                            }}
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* COLUNA 2: PUZZLES E MEGA-PISTAS */}
                  <div className="config-group">
                    {evidenceType === 'glitch_puzzle' && (
                      <>
                        <h4 style={{ fontSize: 12, color: '#64b5ff', marginBottom: 10, borderBottom: '1px solid #333' }}>🎮 ELEMENTOS DO PUZZLE</h4>
                        <div className="flex flex-col auto-style-270 auto-style-271">
                          {[
                            { id: 'accessInstructions', label: '▶️ Instruções de Acesso' },
                            { id: 'hint', label: '💡 Dica do Enigma' },
                            { id: 'calibrationControls', label: '⚙️ Controles de Calibração' },
                            { id: 'logs', label: '📜 Terminal de Logs' },
                            { id: 'rewardCode', label: '🎁 Código de Recompensa' },
                            { id: 'correctAnswerWhenSolved', label: '⚠️ Resposta Correta', warn: true },
                            { id: 'keyword', label: '🔑 Palavra-chave' },
                            { id: 'focusedImage', label: '🖼️ Imagem Focada' },
                            { id: 'hiddenAudioUrl', label: '🎵 Áudio Oculto' },
                            { id: 'hiddenVideoUrl', label: '🎬 Vídeo Oculto' },
                            { id: 'unlockMode', label: '🔓 Modo de Desbloqueio' },
                            { id: 'difficulty', label: '🎯 Dificuldade' },
                            { id: 'toleranceSettings', label: '📏 Tolerâncias' },
                            { id: 'correctParameters', label: '🎛️ Parâmetros Corretos', warn: true },
                            { id: 'startParameters', label: '🎬 Parâmetros Iniciais' },
                          ].map(f => (
                            <label key={f.id} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: 'pointer', color: f.warn ? '#ff6464' : 'inherit' }}>
                              <input 
                                type="checkbox" 
                                checked={fieldVisibilityConfig.glitchPuzzle.visibleSections.includes(f.id as any)}
                                onChange={(e) => {
                                  const current = fieldVisibilityConfig.glitchPuzzle.visibleSections;
                                  const next = e.target.checked ? [...current, f.id] : current.filter(x => x !== f.id);
                                  setFieldVisibilityConfig({ ...fieldVisibilityConfig, glitchPuzzle: { visibleSections: next as any } });
                                }}
                              />
                              {f.label}
                            </label>
                          ))}
                        </div>
                      </>
                    )}

                    {evidenceType === 'mega_clue' && (
                      <>
                        <h4 style={{ fontSize: 12, color: '#ff6400', marginBottom: 10, borderBottom: '1px solid #333' }}>🔐 SEÇÕES DA MEGA-PISTA</h4>
                        <div className="flex flex-col auto-style-272">
                          {[
                            { id: 'hints', label: 'Lista de Dicas' },
                            { id: 'progress', label: 'Barra de Progresso' },
                            { id: 'answer', label: '⚠️ Resposta Final (Verdade)', warn: true },
                            { id: 'requiredPuzzles', label: 'Puzzles Obrigatórios' },
                          ].map(f => (
                            <label key={f.id} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: f.warn ? '#ff6464' : 'inherit' }}>
                              <input 
                                type="checkbox" 
                                checked={fieldVisibilityConfig.megaClue.visibleSections.includes(f.id as any)}
                                onChange={(e) => {
                                  const current = fieldVisibilityConfig.megaClue.visibleSections;
                                  const next = e.target.checked ? [...current, f.id] : current.filter(x => x !== f.id);
                                  setFieldVisibilityConfig({ ...fieldVisibilityConfig, megaClue: { visibleSections: next as any } });
                                }}
                              />
                              {f.label}
                            </label>
                          ))}
                        </div>
                      </>
                    )}

                    {/* METADADOS CUSTOMIZADOS */}
                    <h4 style={{ fontSize: 12, color: '#b366ff', marginTop: 15, marginBottom: 10, borderBottom: '1px solid #333' }}>🧪 DADOS DO SISTEMA (JSON)</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: 'pointer', marginBottom: 10, padding: 8, background: 'rgba(179, 102, 255, 0.1)', borderRadius: 4 }}>
                      <input 
                        type="checkbox" 
                        checked={fieldVisibilityConfig.customMetadata.enableCustomFields}
                        onChange={(e) => setFieldVisibilityConfig({
                          ...fieldVisibilityConfig,
                          customMetadata: { ...fieldVisibilityConfig.customMetadata, enableCustomFields: e.target.checked }
                        })}
                      />
                      <strong>✅ Ativar Metadados Customizados</strong>
                    </label>

                    {fieldVisibilityConfig.customMetadata.enableCustomFields && (
                      <div className="flex flex-col auto-style-273 auto-style-274 auto-style-275 auto-style-276">
                        {[
                          { id: 'audio_config', label: '🔊 Config de Áudio' },
                          { id: 'thermal_keyword', label: '🔥 Palavra-chave Térmica' },
                          { id: 'thermal_secret_text', label: '🔥 Texto Secreto' },
                          { id: 'thermal_enabled', label: '🔥 Térmica Ativada' },
                          { id: 'thermal_font_size', label: '🔤 Tamanho da Fonte' },
                          { id: 'thermal_position_y', label: '📍 Posição Y' },
                          { id: 'device_owner', label: '👤 Proprietário do Dispositivo' },
                          { id: 'gps_coords', label: '🗺️ Coordenadas GPS' },
                          { id: 'filter_transform', label: '🎨 Transformação do Filtro' },
                          { id: 'filter_reveal_settings', label: '🔍 Config de Revelação' },
                          { id: 'uv_layer', label: '💡 Camada UV' },
                          { id: 'is_shredded', label: '📃 Fragmentado' },
                          { id: 'shred_config', label: '✂️ Config de Fragmentação' },
                          { id: 'real_text', label: '📝 Texto Real' },
                          { id: 'cipher_text', label: '🔐 Texto Cifrado' },
                          { id: 'chat_data', label: '💬 Dados de Chat' },
                          { id: 'chat_contact_name', label: '👤 Nome do Contato' },
                          { id: 'video_url', label: '🎬 URL de Vídeo' },
                          { id: 'media_visibility', label: '👁️ Visibilidade de Mídia' },
                          { id: 'security_layer', label: '🔒 Camada de Segurança' },
                          { id: 'reveal_logic', label: '🔓 Lógica de Revelação' },
                          { id: 'signal_targets', label: '📡 Alvos de Sinal' },
                          { id: 'audio_static_sync', label: '📻 Sincronização Estática' },
                          { id: 'narrative_links', label: '📖 Links Narrativos' },
                          { id: 'hide_preview_board', label: '🙈 Ocultar Preview' },
                          { id: 'trigger_time', label: '⏱️ Tempo de Gatilho' },
                        ].map(f => (
                          <label key={f.id} className="checkbox-label flex items-center auto-style-277 auto-style-278 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={fieldVisibilityConfig.customMetadata.defaultVisibleCustomFields.includes(f.id)}
                              onChange={(e) => {
                                const current = fieldVisibilityConfig.customMetadata.defaultVisibleCustomFields;
                                const next = e.target.checked ? [...current, f.id] : current.filter(x => x !== f.id);
                                setFieldVisibilityConfig({
                                  ...fieldVisibilityConfig,
                                  customMetadata: { ...fieldVisibilityConfig.customMetadata, defaultVisibleCustomFields: next }
                                });
                              }}
                            />
                            {f.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="field-block config-display-tab">
                <span className="field-title">⚙️ CONFIGURAÇÃO DE EXIBIÇÃO</span>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 15 }}>
                  Controla O QUE É VISÍVEL quando o jogador inspecionar esta pista. Similar aos campos visíveis, mas com foco em ELEMENTOS DE UI.
                </p>

                {/* GRID 3 COLUNAS */}
                <div className="auto-style-279 auto-style-280 auto-style-281">
                  
                  {/* COLUNA 1: PUZZLE */}
                  {evidenceType === 'glitch_puzzle' && (
                    <div className="config-group">
                      <h4 style={{ fontSize: 12, color: '#64b5ff', marginBottom: 10, borderBottom: '1px solid #333' }}>🎮 GLITCH PUZZLE</h4>
                      <div className="flex flex-col auto-style-282">
                        {[
                          { id: 'showAccessInstructions', label: '▶️ Como Acessar' },
                          { id: 'showHint', label: '💡 Dica' },
                          { id: 'showCorrectAnswerWhenSolved', label: '⚠️ Parâmetros Corretos', warn: true },
                          { id: 'showRewardCode', label: '🎁 Código de Recompensa' },
                          { id: 'showLogs', label: '📜 Logs/Terminal' },
                        ].map(f => (
                          <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: 'pointer', color: f.warn ? '#ff6464' : 'inherit' }}>
                            <input 
                              type="checkbox" 
                              checked={displayConfig.puzzle[f.id as keyof typeof displayConfig.puzzle]}
                              onChange={(e) => setDisplayConfig({
                                ...displayConfig,
                                puzzle: { ...displayConfig.puzzle, [f.id]: e.target.checked }
                              })}
                            />
                            {f.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* COLUNA 1/2: FILE PROPERTIES */}
                  <div className="config-group">
                    <h4 style={{ fontSize: 12, color: '#c6a45f', marginBottom: 10, borderBottom: '1px solid #333' }}>📄 METADADOS DE ARQUIVO</h4>
                    <div className="flex flex-col auto-style-283">
                      {[
                        { id: 'showFileType', label: '📄 Tipo de arquivo' },
                        { id: 'showSize', label: '📊 Tamanho' },
                        { id: 'showCameraModel', label: '📷 Modelo da Câmera' },
                        { id: 'showDate', label: '📅 Data' },
                        { id: 'showGPS', label: '🗺️ GPS' },
                        { id: 'showOwner', label: '👤 Dono' },
                        { id: 'showHexComment', label: '🔧 HEX/Nota Técnica' },
                        { id: 'showStamp', label: '🔖 Carimbo' },
                        { id: 'showExternalLink', label: '🔗 Link Externo' },
                        { id: 'showLockStatus', label: '🔒 Status de Bloqueio' },
                        { id: 'showPersonInfo', label: '👤 Info de Pessoa' },
                      ].map(f => (
                        <label key={f.id} className="flex items-center auto-style-284 auto-style-285 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={displayConfig.fileProperties[f.id as keyof typeof displayConfig.fileProperties]}
                            onChange={(e) => setDisplayConfig({
                              ...displayConfig,
                              fileProperties: { ...displayConfig.fileProperties, [f.id]: e.target.checked }
                            })}
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* COLUNA 2: VISUAL & MÍDIA */}
                  <div className="config-group">
                    <h4 style={{ fontSize: 12, color: '#ff6db3', marginBottom: 10, borderBottom: '1px solid #333' }}>🎨 VISUAL & MÍDIA</h4>
                    <div className="flex flex-col auto-style-286">
                      {[
                        { id: 'showThermalData', label: '🔥 Dados Térmicos' },
                        { id: 'showUVLayer', label: '💡 Camada UV' },
                        { id: 'showFilterOverlay', label: '🎨 Overlay de Filtro' },
                        { id: 'showVideoPlayer', label: '🎬 Player de Vídeo' },
                        { id: 'showAudioPlayer', label: '🔊 Player de Áudio' },
                        { id: 'showHiddenAudio', label: '🎵 Áudio Oculto' },
                        { id: 'showChatData', label: '💬 Conversas de Chat' },
                      ].map(f => (
                        <label key={f.id} className="flex items-center auto-style-287 auto-style-288 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={displayConfig.media[f.id as keyof typeof displayConfig.media]}
                            onChange={(e) => setDisplayConfig({
                              ...displayConfig,
                              media: { ...displayConfig.media, [f.id]: e.target.checked }
                            })}
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>

                    {/* CIFRAS & FRAGMENTOS */}
                    <h4 style={{ fontSize: 12, color: '#a366ff', marginTop: 15, marginBottom: 10, borderBottom: '1px solid #333' }}>🔐 CIFRAS & FRAGMENTOS</h4>
                    <div className="flex flex-col auto-style-289">
                      {[
                        { id: 'showShredded', label: '📃 Documentos Fragmentados' },
                        { id: 'showCipherText', label: '🔐 Texto Cifrado' },
                        { id: 'showRealText', label: '⚠️ Texto Real', warn: true },
                        { id: 'showShredConfig', label: '✂️ Config de Fragmentação' },
                      ].map(f => (
                        <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: 'pointer', color: f.warn ? '#ff6464' : 'inherit' }}>
                          <input 
                            type="checkbox" 
                            checked={displayConfig.cipher[f.id as keyof typeof displayConfig.cipher]}
                            onChange={(e) => setDisplayConfig({
                              ...displayConfig,
                              cipher: { ...displayConfig.cipher, [f.id]: e.target.checked }
                            })}
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* COLUNA 3: MEGA CLUE */}
                  {evidenceType === 'mega_clue' && (
                    <div className="config-group">
                      <h4 style={{ fontSize: 12, color: '#ff6400', marginBottom: 10, borderBottom: '1px solid #333' }}>🔮 MEGA-PISTA</h4>
                      <div className="flex flex-col auto-style-290">
                        {[
                          { id: 'showHints', label: '💡 Dicas' },
                          { id: 'showAnswer', label: '⚠️ Resposta', warn: true },
                          { id: 'showProgress', label: '📊 Progresso' },
                        ].map(f => (
                          <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: 'pointer', color: f.warn ? '#ff6464' : 'inherit' }}>
                            <input 
                              type="checkbox" 
                              checked={displayConfig.megaClue[f.id as keyof typeof displayConfig.megaClue]}
                              onChange={(e) => setDisplayConfig({
                                ...displayConfig,
                                megaClue: { ...displayConfig.megaClue, [f.id]: e.target.checked }
                              })}
                            />
                            {f.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

      </div>

      <div className="dossier-footer" style={{ pointerEvents: overlayActive ? 'none' : 'auto' }}>
           <button className="btn-cancel" onClick={onClose}>CANCELAR</button>
           <button 
              className="btn-save" 
              onClick={handleSave} 
              disabled={loading || videoUploading || audioHiddenUploading}
              style={existingCard ? {
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(167, 139, 250, 0.2))',
                borderColor: 'rgba(139, 92, 246, 0.5)',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
              } : undefined}
           >
              {videoUploading ? '⏳ Aguardando upload de vídeo...' : loading ? '💾 Salvando...' : (existingCard ? '✏️ Salvar Alterações' : '📝 REGISTRAR EVIDÊNCIA')}
           </button>
        </div>
        
        {/* Progress bars */}
        {(loading || videoUploading) && Object.keys(uploadProgress).length > 0 && (
           <div style={{padding: '12px 20px', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(100,150,255,0.2)'}}>
              {Object.entries(uploadProgress).map(([key, value]) => (
                 <div key={key} className="auto-style-291">
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 4}}>
                       <span>{key === 'image' ? 'Imagem' : key === 'video' ? 'Vídeo' : key === 'uv' ? 'UV' : key === 'filter' ? 'Filtro' : key}</span>
                       <span>{value}%</span>
                    </div>
                    <div style={{height: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 2, overflow: 'hidden'}}>
                       <div style={{height: '100%', width: `${value}%`, background: 'linear-gradient(90deg, #64b5ff, #00ffaa)', transition: 'width 0.3s'}} />
                    </div>
                 </div>
              ))}
           </div>
        )}

      {editorMode && (previewUrl || uvEditorBaseUrl) && createPortal(
         <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 2147483647, backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
              <UVEditor 
                 baseImageUrl={uvEditorBaseUrl || previewUrl}
                 mode={editorMode || 'uv'}
                 initialImageFile={editorMode === 'filter' ? filterInitialImage : undefined}
                 showForensicControls={uvEditorPurpose === 'forensic'}
                 onSave={(file, meta) => { 
                    // LÓGICA CORRIGIDA: aplicar diretamente na imagem principal quando for forense
                    if (uvEditorPurpose === 'forensic') {
                       setImgFile(file);

                       // Atualiza o preview para o usuário
                       const newUrl = createAndRegisterBlobUrl(file);
                       if (newUrl) {
                          try { revokeUrl(previewUrl); } catch (e) {}
                          setPreviewUrl(newUrl);
                       }

                       if (meta && (meta as any).targetChannel) {
                          setForensicTargetChannel((meta as any).targetChannel);
                       }

                       alert('✅ Camada forense aplicada na imagem principal!');
                    } else if (editorMode === 'uv') {
                       setUvFile(file);
                       // create preview blob url for the new UV and mark replacement
                       try {
                          const newUvUrl = createAndRegisterBlobUrl(file);
                          if (newUvUrl) {
                             // revoke previous uv preview if any
                             try { revokeUrl(uvPreviewUrl || forensicHiddenPreview); } catch (e) {}
                             setUvPreviewUrl(newUvUrl);
                             setForensicHiddenPreview(newUvUrl);
                             setReplaceUv(true);
                          }
                       } catch (e) {}
                    } else if (editorMode === 'filter') {
                       setFilterFile(file);
                    }

                    // Limpeza de estados do editor
                    setEditorMode(null);
                    setFilterInitialImage(null);
                    setUvEditorPurpose(null);
                 }}
                 onClose={() => { setEditorMode(null); setFilterInitialImage(null); setUvEditorBaseUrl(null); setUvEditorPurpose(null); }}
              />
            </div>
         </div>, document.body
      )}

             {showGlitchDesigner && previewUrl && createPortal(
            <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 2147483647, backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
               <div style={{width:'100vw', height:'100vh', display:'flex', flexDirection:'column'}}>
                 <UVEditor
                            baseImageUrl={previewUrl}
                   mode="uv"
                   showForensicControls={false}
                   onSave={(file, meta) => {
                     // Revoke previous URL
                     revokeUrl(glitchFocusedImagePreview);
                     
                     // Create and register new URL
                     const newUrl = createAndRegisterBlobUrl(file);
                     if (newUrl) {
                        setGlitchFocusedImageFile(file);
                        setGlitchFocusedImagePreview(newUrl);
                     }
                               setShowGlitchDesigner(false);
                   }}
                   onClose={() => setShowGlitchDesigner(false)}
                 />
               </div>
            </div>, document.body
         )}
      
      {showAudioForgeFor && (
         <React.Suspense fallback={
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', color: '#00f3ff', zIndex: 9999 }}>
               Carregando Laboratório de Áudio...
            </div>
         }>
            <AudioLab
               isOpen={!!showAudioForgeFor}
               onClose={() => setShowAudioForgeFor(null)}
               initialBaseAudio={audioBase}
               onSave={async (file) => {
                  const currentForgeFor = showAudioForgeFor;
                  setShowAudioForgeFor(null); // Fecha o modal imediatamente
                  
                  if (currentForgeFor === 'hidden') {
                     revokeUrl(audioHiddenPreview);
                     const newUrl = createAndRegisterBlobUrl(file);
                     if (newUrl) {
                        setAudioHidden(file);
                        setAudioHiddenPreview(newUrl);
                        setAudioHiddenUploadedUrl(null);
                        setAudioHiddenUploading(true);
                        try {
                           const publicUrl = await uploadAudio(file, investigationId);
                           if (publicUrl) { setAudioHiddenUploadedUrl(publicUrl); revokeUrl(newUrl); setAudioHiddenPreview(publicUrl); }
                        } catch (e) { console.error('AudioLab upload failed', e); }
                        finally { setAudioHiddenUploading(false); }
                     }
                  } else {
                     revokeUrl(audioBasePreview);
                     const newUrl = createAndRegisterBlobUrl(file);
                     if (newUrl) { setAudioBase(file); setAudioBasePreview(newUrl); }
                  }
               }}
            />
         </React.Suspense>
      )}

      {showThermalEditor && imgFile && (
         <ThermalEditor
            baseImageUrl={previewUrl}
            thermalText={thermalSecretText}
            initialFontSize={thermalFontSize}
            initialPositionY={thermalPositionY}
            onSave={(config) => {
               setThermalFontSize(config.fontSize);
               setThermalPositionY(config.positionY);
               setShowThermalEditor(false);
            }}
            onClose={() => setShowThermalEditor(false)}
         />
      )}

      {showForensicEditor && (imgFile || forensicBaseImage) && (
         <ForensicChannelEditor
            baseImageUrl={forensicBasePreview || previewUrl}
            initialConfig={forensicConfig || undefined}
            onSave={async (compositeBlob, config) => {
               // Save the composite image
               const file = new File([compositeBlob], 'forensic_composite.png', { type: 'image/png' });
               
               // Revoke previous URLs
               revokeUrl(previewUrl);
               revokeUrl(forensicResultPreview);
               
               // Create new preview URLs
               const newPreviewUrl = createAndRegisterBlobUrl(file);
               const newResultUrl = createAndRegisterBlobUrl(compositeBlob as any);
               
               if (newPreviewUrl && newResultUrl) {
                  // Update image file
                  setImgFile(file);
                  setPreviewUrl(newPreviewUrl);
                  
                  // Update forensic result
                  setForensicResultPreview(newResultUrl);
                  setForensicConfig(config);
                  setForensicTargetChannel(config.targetChannel);
               }
               
               setShowForensicEditor(false);
            }}
            onClose={() => setShowForensicEditor(false)}
         />
      )}

      </DiegeticWindow>
    </div>
  );
}
