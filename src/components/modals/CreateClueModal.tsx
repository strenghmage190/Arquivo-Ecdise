

import React, { useState, useEffect } from 'react';
import { createInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage, uploadInvestigationFile } from '../../utils/storage';
import UVEditor from '../tools/UVEditor';
import ThermalEditor from '../tools/ThermalEditor';
import { bufferToWav } from '../../utils/audioGenerator';
import AdvancedAudioLab from '../tools/AdvancedAudioLab';
import UrlRealTimeSpectrogram from '../tools/UrlRealTimeSpectrogram';

import PhoneViewer from '../tools/PhoneViewer';
import SpectrogramCreator from '../tools/SpectrogramCreator';
import ProfessionalSpectrogram from '../tools/ProfessionalSpectrogram';
import './CreateClueModal.css';
import DiegeticWindow from '../ui/DiegeticWindow';

import { supabase } from '../../supabaseClient';
import AudioForge from '../tools/AudioForge';
import GlitchImageEngine from '../tools/GlitchImageEngine';

const LOCKED_PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAwEB/aurbZkAAAAASUVORK5CYII=';

async function uploadAudio(file: File, investigationId: string): Promise<string | null> {
  const path = `${investigationId}/audio_${Date.now()}_${file.name}`;
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
}

type ChatSender = 'me' | 'them' | 'system' | string;
interface EditingChatMessage {
   sender: ChatSender;
   type: string;
   text: string;
}

export default function CreateClueModal({ isOpen, onClose, investigationId, initialX, initialY, onSaved }: Props) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [descPublic, setDescPublic] = useState('');
  const [descHidden, setDescHidden] = useState('');
  const [tags, setTags] = useState('');

  const [imgFile, setImgFile] = useState<File | null>(null);
   const [videoFile, setVideoFile] = useState<File | null>(null);
   const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
   const [videoUrl, setVideoUrl] = useState<string | null>(null);
   const [videoUploading, setVideoUploading] = useState<boolean>(false);
   const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [uvFile, setUvFile] = useState<File | null>(null);
   const [filterFile, setFilterFile] = useState<File | null>(null);
      const [previewUrl, setPreviewUrl] = useState<string | null>(null);
      const [filterPreviewUrl, setFilterPreviewUrl] = useState<string | null>(null);
      const [filterTransform, setFilterTransform] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
      const [filterInitialImage, setFilterInitialImage] = useState<File | null>(null);
   const [editorMode, setEditorMode] = useState<'uv' | 'filter' | null>(null);

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
      if (audioBasePreview) {
         try { URL.revokeObjectURL(audioBasePreview); } catch (err) {}
      }
      const url = URL.createObjectURL(file);
      setAudioBase(file);
      setAudioBasePreview(url);
   };

   const handleAudioHiddenSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (audioHiddenPreview) {
         try { URL.revokeObjectURL(audioHiddenPreview); } catch (err) {}
      }
      const url = URL.createObjectURL(file);
      setAudioHidden(file);
      setAudioHiddenPreview(url);
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
           const [activeTab, setActiveTab] = useState<'geral' | 'visual' | 'audio' | 'cifra' | 'glitch' | 'mega'>('geral');

           // Chat / Phone viewer states
           const [showChatEditor, setShowChatEditor] = useState(false);
           const [chatJson, setChatJson] = useState<string>('');
           const [chatData, setChatData] = useState<EditingChatMessage[] | null>(null);
           const [chatContactName, setChatContactName] = useState<string>('Desconhecido');
            const [editingChatList, setEditingChatList] = useState<EditingChatMessage[]>([]);

            useEffect(() => {
               if (showChatEditor) {
                  if (chatData && Array.isArray(chatData)) {
                     setEditingChatList(chatData.map((m: any) => ({ sender: (m.sender || 'me') as ChatSender, type: m.type || 'text', text: m.text || '' })));
                  } else {
                     setEditingChatList([{ sender: 'me', type: 'text', text: '' }]);
                  }
               }
            }, [showChatEditor]);

           // Person dossier fields
           const [isPerson, setIsPerson] = useState(false);
           const [personName, setPersonName] = useState('');
           const [personDob, setPersonDob] = useState('');
           const [personStatus, setPersonStatus] = useState<'ALIVE'|'MIA'|'DEAD'|'UNKNOWN'>('UNKNOWN');
           const [personOccupation, setPersonOccupation] = useState('');

   const [isLocked, setIsLocked] = useState(false);
   const [lockPass, setLockPass] = useState('');
   const [filterRevealBrightness, setFilterRevealBrightness] = useState(150);
   const [filterRevealContrast, setFilterRevealContrast] = useState(150);
   const [filterRevealSaturate, setFilterRevealSaturate] = useState(100);
   const [showAdvancedFilterSettings, setShowAdvancedFilterSettings] = useState(false);
   // Thermal flag: whether this evidence should show a thermal overlay in inspection
   const [thermalEnabled, setThermalEnabled] = useState(false);
   const [thermalSecretText, setThermalSecretText] = useState('');
   const [thermalKeyword, setThermalKeyword] = useState('');
   const [thermalFontSize, setThermalFontSize] = useState(100);
   const [thermalPositionY, setThermalPositionY] = useState(50);
   const [showThermalEditor, setShowThermalEditor] = useState(false);

  const [loading, setLoading] = useState(false);
   const [isShredded, setIsShredded] = useState(false);
   const [shredRows, setShredRows] = useState(1);
   const [shredCols, setShredCols] = useState(8);
   const [realText, setRealText] = useState('');
   const [cipherText, setCipherText] = useState('');

   // EVIDÊNCIA TYPE SELECTOR
   const [evidenceType, setEvidenceType] = useState<'document' | 'glitch_puzzle' | 'mega_clue'>('document');

   // GLITCH PUZZLE STATES
   const [glitchCorrectFrequency, setGlitchCorrectFrequency] = useState(17);
   const [glitchCorrectShift, setGlitchCorrectShift] = useState(33);
   const [glitchCorrectChromatic, setGlitchCorrectChromatic] = useState(12);
   const [glitchRewardCode, setGlitchRewardCode] = useState('ALPHA-01');
   const [glitchKeyword, setGlitchKeyword] = useState('');
   const [glitchRequireKeyword, setGlitchRequireKeyword] = useState(false);
   const [glitchUnlockMode, setGlitchUnlockMode] = useState<'code' | 'code_plus_keyword' | 'media' | 'media_and_code'>('code');
   const [glitchToleranceFreq, setGlitchToleranceFreq] = useState(1);
   const [glitchToleranceShift, setGlitchToleranceShift] = useState(2);
   const [glitchToleranceChroma, setGlitchToleranceChroma] = useState(2);
   const [glitchFocusedImageFile, setGlitchFocusedImageFile] = useState<File | null>(null);
   const [glitchFocusedImagePreview, setGlitchFocusedImagePreview] = useState<string | null>(null);
   const [showGlitchDesigner, setShowGlitchDesigner] = useState(false);
   const [glitchHiddenAudioUrl, setGlitchHiddenAudioUrl] = useState('');
   const [glitchHiddenVideoUrl, setGlitchHiddenVideoUrl] = useState('');
   const [glitchHint, setGlitchHint] = useState('');
   const [glitchAccessInstructions, setGlitchAccessInstructions] = useState('');
   const [glitchStartFrequency, setGlitchStartFrequency] = useState(12);
   const [glitchStartShift, setGlitchStartShift] = useState(20);
   const [glitchStartChromatic, setGlitchStartChromatic] = useState(8);

   // MEGA CLUE STATES
   const [megaFinalTruthText, setMegaFinalTruthText] = useState('');
   const [megaImageFile, setMegaImageFile] = useState<File | null>(null);
   const [megaImagePreview, setMegaImagePreview] = useState<string | null>(null);
   const [megaRequiredPuzzleIds, setMegaRequiredPuzzleIds] = useState<string[]>([]);
   const [availablePuzzles, setAvailablePuzzles] = useState<Array<{ id: string; title: string }>>([]);
   const [megaSelectedPuzzle, setMegaSelectedPuzzle] = useState<string>('');

   // Reset form fields when opening the modal to avoid reusing previous values
   const resetForm = () => {
      // basic fields
      setTitle('');
      setDescPublic('');
      setDescHidden('');
      setTags('');

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

      // basic flags
      setIsLocked(false);
      setLockPass('');
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

      // evidence type and puzzle-specific fields
      setEvidenceType('document');
      setGlitchCorrectFrequency(17);
      setGlitchCorrectShift(33);
      setGlitchCorrectChromatic(12);
      setGlitchRewardCode('ALPHA-01');
      setGlitchKeyword('');
      setGlitchRequireKeyword(false);
      setGlitchUnlockMode('code');
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
   };

   // Fetch available glitch puzzles when modal opens or evidenceType changes
   useEffect(() => {
      if (isOpen && evidenceType === 'mega_clue') {
         fetchAvailablePuzzles();
      }
   }, [isOpen, evidenceType]);

   useEffect(() => {
      if (isOpen) resetForm();
   }, [isOpen]);

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

   // Fetch available glitch puzzles from the database
   const fetchAvailablePuzzles = async () => {
      try {
         const { data, error } = await supabase
            .from('investigation_cards')
            .select('id, title, metadata')
            .eq('investigation_id', investigationId)
            .eq('type', 'glitch_puzzle');
         
         if (error) {
            console.error('Erro ao buscar puzzles:', error);
            return;
         }

         const puzzles = (data || []).map(card => ({ id: card.id, title: card.title }));
         setAvailablePuzzles(puzzles);
      } catch (err) {
         console.error('fetchAvailablePuzzles error:', err);
      }
   };

      // Hooks that must always be declared in the same order.
      // Move interactive hooks here (before any early returns) so React's
      // hook ordering is preserved and we avoid "Rendered more hooks" errors.

      // when a filterFile is set, create a preview URL and set a default transform
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

      useEffect(() => {
         const onMove = (e: MouseEvent) => {
            if (!draggingRef.current || !filterTransform || !previewUrl) return;
            const rect = document.querySelector('.image-edit-canvas') as HTMLElement | null;
            if (!rect) return;
            const bounds = rect.getBoundingClientRect();
            const start = draggingRef.current;
            if (start.mode === 'move') {
               const dx = e.clientX - start.startX;
               const dy = e.clientY - start.startY;
               const newLeft = ((start.startTransform.left / 100) * bounds.width + dx) / bounds.width * 100;
               const newTop = ((start.startTransform.top / 100) * bounds.height + dy) / bounds.height * 100;
               setFilterTransform({ ...filterTransform, left: Math.max(0, Math.min(100 - filterTransform.width, newLeft)), top: Math.max(0, Math.min(100 - filterTransform.height, newTop)) });
            } else if (start.mode === 'resize') {
               const dx = e.clientX - start.startX;
               const dy = e.clientY - start.startY;
               const deltaPctW = (dx / bounds.width) * 100;
               const deltaPctH = (dy / bounds.height) * 100;
               const newW = Math.max(5, Math.min(100 - start.startTransform.left, start.startTransform.width + deltaPctW));
               const newH = Math.max(5, Math.min(100 - start.startTransform.top, start.startTransform.height + deltaPctH));
               setFilterTransform({ ...filterTransform, width: newW, height: newH });
            }
         };
         const onUp = () => { draggingRef.current = null; };
         window.addEventListener('mousemove', onMove);
         window.addEventListener('mouseup', onUp);
         return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
      }, [filterPreviewUrl, filterTransform, previewUrl]);

   const handleSave = async () => {
    if (!title) return alert("A pista precisa de um Título/Código.");

    const wantsSecurityLayer = securityLayerEnabled || evidenceType === 'glitch_puzzle';

    // Validate based on evidence type
    if (wantsSecurityLayer) {
       const hasAnyMedia = imgFile || videoFile || videoUrlInput || videoUrl || audioBase;
       if (!hasAnyMedia) {
          return alert('Envie uma imagem, vídeo ou áudio na aba Visual/Áudio para aplicar a camada de segurança.');
       }
    }
    if (evidenceType === 'mega_clue') {
       if (!megaFinalTruthText.trim()) {
          return alert('Defina o texto da verdade final para a mega-pista');
       }
       if (megaRequiredPuzzleIds.length === 0) {
          return alert('Selecione pelo menos um quebra-cabeça de glitch necessário para desbloquear esta mega-pista');
       }
    }

    setLoading(true);

    try {
      let imgUrl = null;
      let uvUrl = null;
         let filterUrl = null;
      if (imgFile) imgUrl = await uploadInvestigationImage(imgFile, investigationId);
         if (uvFile) uvUrl = await uploadInvestigationImage(uvFile, investigationId);
         if (filterFile) filterUrl = await uploadInvestigationImage(filterFile, investigationId);
             // Prefer video URL input if provided, otherwise use uploaded video URL (uploaded on select). If user selected but upload didn't complete,
             // attempt a fallback upload here.
                   let finalVideoUrl: string | null = videoUrlInput || videoUrl || null;
                   if (!finalVideoUrl && videoFile) {
                      try {
                         finalVideoUrl = await uploadInvestigationFile(videoFile, investigationId, videoFile.name.split('.').pop() || 'mp4');
                      } catch (e) {
                         console.error('Video upload failed on save', e);
                         finalVideoUrl = null;
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
           if (wantsSecurityLayer) {
              if (finalVideoUrl) return 'encrypted_video';
              if (audUrl || audioBase) return 'locked_audio';
              if (imgUrl) return 'glitch_puzzle';
           }
           return evidenceType === 'document' ? null : evidenceType;
         })();

             const metadata: Record<string, any> = {};
             metadata.image_filter_reveal = {
                  brightness: filterRevealBrightness,
                  contrast: filterRevealContrast,
                  saturate: filterRevealSaturate
             };
             // attach fake metadata fields if provided (prefer explicit fields, fallback to fakeMeta map)
             if (fakeDate) metadata.date_created = fakeDate;
             if (fakeLocation) metadata.gps_coords = fakeLocation;
             if (technicalNote) {
                metadata.technical_note = technicalNote;
                metadata.hex_comment = technicalNote;
             }
             if (fakeMeta) {
                if (fakeMeta.date) metadata.date_created = fakeMeta.date;
                if (fakeMeta.gps) metadata.gps_coords = fakeMeta.gps;
                if (fakeMeta.owner) metadata.device_owner = fakeMeta.owner;
             }
            // spectrograms are stored via `audio_hidden_url` only; do not add to metadata
             // optional external link + qr
             if (externalLink) metadata.external_link = externalLink;
            // thermal metadata flag
            if (thermalEnabled) {
               metadata.thermal = true;
               if (thermalSecretText) metadata.thermal_secret_text = thermalSecretText;
               if (thermalKeyword) metadata.thermal_keyword = thermalKeyword;
               metadata.thermal_font_size = thermalFontSize;
               metadata.thermal_position_y = thermalPositionY;
            }
            // audio playback config: time (seconds) when hidden track should be triggered
            if (typeof triggerTime !== 'undefined') {
               metadata.audio_config = { trigger_time: Number(triggerTime) || 0 };
            }

            if (wantsSecurityLayer) {
               metadata.unified_media = {
                  base_media_type: baseMediaType,
                  base_media_url: baseMediaUrl,
                  uv_layer_url: uvUrl || null,
                  filter_layer_url: filterUrl || null,
                  hidden_layer_url: glitchFocusedUrl || null,
                  video_url: finalVideoUrl || null,
                  audio_base_url: audUrl || null,
                  audio_hidden_url: audHidUrl || null,
                  hide_preview_on_board: hidePreviewOnBoard,
               };

               metadata.masked_preview = hidePreviewOnBoard;

               metadata.security_layer = {
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

               metadata.card_type = resolvedCardType;
               metadata.media_type = baseMediaType;
               metadata.reward_code = glitchRewardCode || null;

               metadata.logic = 'glitch_sequential';
               metadata.sequence = {
                  step_1: 'unlock_boot',
                  step_2: 'align_signal',
                  step_3: revealRequiresKeyword ? 'keyword_verification' : 'reveal',
               };

               metadata.media_visibility = {
                  audio_base: mediaVisibility.audioBase,
                  audio_hidden: mediaVisibility.audioHidden,
                  uv_layer: mediaVisibility.uvLayer,
                  visual: mediaVisibility.visual,
               };
               metadata.audio_static_sync = audioStaticSync;
               metadata.narrative_hints = {
                  audio_guides_visual: narrativeLinks.audioHintsVisual,
                  visual_guides_code: narrativeLinks.visualHintsCode,
                  hint_note: narrativeLinks.hintNote || null,
               };
            }

            // Add glitch puzzle metadata if needed
            if (wantsSecurityLayer) {
               metadata.glitch_puzzle = {
                  original_image_url: baseMediaUrl || imgUrl || null,
                  correct_frequency: glitchCorrectFrequency,
                  correct_shift: glitchCorrectShift,
                  correct_chromatic: glitchCorrectChromatic,
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
                  hidden_uv_url: uvUrl || null,
                  hidden_audio_url: glitchHiddenAudioUrl || null,
                  hidden_video_url: glitchHiddenVideoUrl || null,
                  focused_image_url: glitchFocusedUrl || null,
                  solved: false,
               };
               metadata.media_visibility = {
                  audio_base: mediaVisibility.audioBase,
                  audio_hidden: mediaVisibility.audioHidden,
                  uv_layer: mediaVisibility.uvLayer,
                  visual: mediaVisibility.visual,
               };
               metadata.audio_static_sync = audioStaticSync;
               metadata.narrative_hints = {
                  audio_guides_visual: narrativeLinks.audioHintsVisual,
                  visual_guides_code: narrativeLinks.visualHintsCode,
                  hint_note: narrativeLinks.hintNote || null,
               };
            }

            // Add mega clue metadata if needed
            if (evidenceType === 'mega_clue') {
               metadata.mega_clue = {
                  final_truth_text: megaFinalTruthText,
                  required_puzzle_ids: megaRequiredPuzzleIds,
                  collected_codes: [],
               };
            }

         // sanitize metadata to avoid sending unserializable objects
         const cleanMetadata = sanitizeForMetadata(metadata);

            const boardImageUrl = (wantsSecurityLayer || hidePreviewOnBoard) ? LOCKED_PLACEHOLDER_IMG : (imgUrl || null);

         const payload: Record<string, any> = {
        investigation_id: investigationId,
        title,
            type: resolvedCardType,
        description_public: descPublic || null,
        description_hidden: descHidden || null,
        x: initialX ?? 100,
        y: initialY ?? 100,
                  image_url: boardImageUrl,
        image_uv_url: uvUrl,
            image_filter_layer: filterUrl,
            image_filter_layer_transform: filterTransform || null,
            is_locked: isLocked,
            lock_password: isLocked ? lockPass : null,
            metadata: cleanMetadata,
        audio_hidden_url: audHidUrl,
            video_url: finalVideoUrl,
        audio_target_freq: freq
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

         // attach person dossier metadata
          if (isPerson) {
             payload.metadata = payload.metadata || {};
             payload.metadata.person = sanitizeForMetadata({
               name: personName || title,
               dob: personDob || null,
               status: personStatus || 'UNKNOWN',
               occupation: personOccupation || null,
             });
          }
            // shredded document fields
            if (isShredded) {
               payload.is_shredded = true;
               payload.shred_rows = shredRows;
               payload.shred_cols = shredCols;
            }
            if (realText) payload.real_text = realText;
            if (cipherText) payload.cipher_text = cipherText;
         // optional stamp text column (if DB has column 'stamp_text')
         if (stamp) payload.stamp_text = stamp;

         // debug: log payload to help diagnose missing chat_data in DB
         try {
            // eslint-disable-next-line no-console
            console.debug('CreateClueModal: sending payload', { chat_data: payload.chat_data, chat_contact_name: payload.chat_contact_name, metadata_sample: payload.metadata ? Object.keys(payload.metadata).slice(0,6) : null });
         } catch (e) {}
         const newCard = await createInvestigationCard(payload as any);
      onSaved(newCard);
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
      setImgFile(e.target.files[0]);
         setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleMegaImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     try { if (megaImagePreview) URL.revokeObjectURL(megaImagePreview); } catch(e){}
     const url = URL.createObjectURL(file);
     setMegaImageFile(file);
     setMegaImagePreview(url);
  };

   const onOverlayMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!filterTransform) return;
      // draggingRef is defined above (hook order preserved)
      draggingRef.current = { mode: 'move', startX: e.clientX, startY: e.clientY, startTransform: { ...filterTransform } };
   };

   const onHandleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!filterTransform) return;
      draggingRef.current = { mode: 'resize', startX: e.clientX, startY: e.clientY, startTransform: { ...filterTransform } };
   };

   const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] || null;
      if (!f) return;
      setVideoFile(f);
      try { if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl); } catch(e){}
      const localUrl = URL.createObjectURL(f);
      setVideoPreviewUrl(localUrl);

      // Upload immediately
      (async () => {
         try {
            setVideoUploading(true);
            const ext = f.name.split('.').pop() || 'mp4';
            const publicUrl = await uploadInvestigationFile(f, investigationId, ext);
            if (publicUrl) {
               setVideoUrl(publicUrl);
            } else {
               alert('Falha ao enviar vídeo');
            }
         } catch (err) {
            console.error('Video upload failed', err);
            alert('Falha ao enviar vídeo');
         } finally {
            setVideoUploading(false);
         }
      })();
   };

   return (
    <div className="modal-overlay">
      <DiegeticWindow title="REGISTRO DE EVIDÊNCIA" onClose={onClose}>
        <div className="dossier-body" style={{ padding: 0 }}>

          <div className="tabs-header">
            <button className={`tab-btn ${activeTab==='geral'?'active':''}`} onClick={()=>setActiveTab('geral')}>📄 GERAL & DADOS</button>
            <button className={`tab-btn ${activeTab==='visual'?'active':''}`} onClick={()=>setActiveTab('visual')}>👁️ VISUAL / UV / FX</button>
            <button className={`tab-btn ${activeTab==='audio'?'active':''}`} onClick={()=>setActiveTab('audio')}>🔊 ÁUDIO & EVP</button>
            <button className={`tab-btn ${activeTab==='cifra'?'active':''}`} onClick={()=>setActiveTab('cifra')}>🧩 CIFRAS & PUZZLES</button>
                  {(securityLayerEnabled || evidenceType === 'glitch_puzzle') && <button className={`tab-btn ${activeTab==='glitch'?'active':''}`} onClick={()=>setActiveTab('glitch' as any)}>🧩 CONFIG. GLITCH</button>}
            {evidenceType === 'mega_clue' && <button className={`tab-btn ${activeTab==='mega'?'active':''}`} onClick={()=>setActiveTab('mega' as any)}>🔐 CONFIG. MEGA-PISTA</button>}
          </div>

          <div className="tab-content">

            {activeTab === 'geral' && (
              <>
                <div className="field-block">
                   <span className="field-title">📋 SUBTIPO DE EVIDÊNCIA</span>
                   <div style={{display:'flex', gap:10, marginBottom:15}}>
                      <button 
                         className={`upload-btn ${evidenceType === 'document' ? 'active' : ''}`}
                         onClick={() => setEvidenceType('document')}
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
                      Use a aba "CONFIG. GLITCH" para definir valores alvo. A imagem enviada aqui será mantida limpa e o motor aplicará a distorção para o jogador.
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
                   <div style={{display:'flex', gap:15, marginBottom:10}}>
                      <div style={{flex:2}}>
                         <label>TÍTULO DO ARQUIVO</label>
                         <input autoFocus value={title} onChange={e=>setTitle(e.target.value)} />
                      </div>
                      <div style={{flex:1}}>
                         <label>TAGS</label>
                         <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Sangue, Oculto..." />
                      </div>
                   </div>
                   <label>DESCRIÇÃO PÚBLICA</label>
                   <textarea rows={3} value={descPublic} onChange={e=>setDescPublic(e.target.value)} />
                   <div style={{marginTop:15}}>
                      <label className="field-title" style={{display:'block', marginBottom:6}}>OBSERVAÇÕES DO MESTRE (Oculto)</label>
                      <textarea rows={2} value={descHidden} onChange={e=>setDescHidden(e.target.value)} style={{borderColor:'#c6a45f', background:'#1a1710'}} />
                   </div>
                </div>

                <div className="field-block">
                   <span className="field-title">🔒 CAMADA DE SEGURANÇA UNIVERSAL</span>
                   <p style={{fontSize:11, color:'#888', marginBottom:10}}>
                      Transforme qualquer mídia (imagem, vídeo ou áudio) em um artefato com camada de sinal/glitch e senha. Use os sliders na aba Glitch para calibrar quando ativado.
                   </p>
                   <div style={{display:'flex', flexWrap:'wrap', gap:12}}>
                      <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                         <input type="checkbox" checked={securityLayerEnabled || evidenceType === 'glitch_puzzle'} onChange={e => setSecurityLayerEnabled(e.target.checked)} disabled={evidenceType === 'glitch_puzzle'} />
                         <span style={{fontWeight:700, color:'#c6a45f'}}>Ativar criptografia de sinal</span>
                      </label>
                      <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                         <input type="checkbox" checked={hidePreviewOnBoard} onChange={e => setHidePreviewOnBoard(e.target.checked)} />
                         <span style={{color:'#bbb'}}>Ocultar prévia no tabuleiro (mostrar ícone bloqueado)</span>
                      </label>
                   </div>

                   <div style={{marginTop:12, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:10}}>
                      <label style={{display:'flex', flexDirection:'column', gap:6}}>
                         Lógica de revelação
                         <select value={revealLogicMode} onChange={e => setRevealLogicMode(e.target.value as any)}>
                            <option value="always_visible">Sempre visível (pista de percepção)</option>
                            <option value="aligned_only">Apenas ao alinhar sliders</option>
                            <option value="aligned_keyword">Sliders + senha manual</option>
                         </select>
                      </label>
                      <div style={{display:'flex', flexDirection:'column', gap:6}}>
                         <span style={{fontSize:11, color:'#ccc'}}>Sliders controlam</span>
                         <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                            <label style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer'}}>
                               <input type="checkbox" checked={signalTargets.visual} onChange={e => setSignalTargets(v => ({ ...v, visual: e.target.checked }))} />
                               <span style={{fontSize:12}}>Imagem/Vídeo</span>
                            </label>
                            <label style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer'}}>
                               <input type="checkbox" checked={signalTargets.audio} onChange={e => setSignalTargets(v => ({ ...v, audio: e.target.checked }))} />
                               <span style={{fontSize:12}}>Áudio</span>
                            </label>
                         </div>
                      </div>
                      <label style={{display:'flex', flexDirection:'column', gap:6}}>
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
                   </div>
                </div>

                <div style={{display:'flex', gap:15}}>
                   <div className="field-block" style={{flex:1}}>
                      <span className="field-title">🔐 CRIPTOGRAFIA / BLOQUEIO</span>
                      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
                         <input type="checkbox" checked={isLocked} onChange={e=>setIsLocked(e.target.checked)} />
                         <label>ATIVAR SENHA DE ACESSO</label>
                      </div>
                      <div style={{marginTop:12, display:'flex', gap:10, alignItems:'center'}}>
                         <label style={{display:'flex', alignItems:'center', gap:8}}>
                            <input type="checkbox" checked={isPerson} onChange={e=>setIsPerson(e.target.checked)} />
                            <span>Tipo: Dossiê de Pessoa</span>
                         </label>
                         <button className="upload-btn" onClick={() => setShowChatEditor(!showChatEditor)}>💬 Gerar Chat Falso</button>
                      </div>

                      {showChatEditor && (
                         <div style={{marginTop:10}}>
                            <label>Contato (nome)</label>
                            <input value={chatContactName} onChange={e=>setChatContactName(e.target.value)} placeholder="Nome do contato" />

                            <div style={{marginTop:8}}>
                               <label>Mensagens</label>
                               {editingChatList.map((m, idx) => (
                                  <div key={idx} style={{display:'grid', gridTemplateColumns:'120px 1fr 72px', gap:8, marginBottom:8, alignItems:'start'}}>
                                     <select value={m.sender} onChange={e => { const copy = [...editingChatList]; copy[idx] = { ...copy[idx], sender: e.target.value }; setEditingChatList(copy); }}>
                                        <option value="me">Eu</option>
                                        <option value="them">Contato</option>
                                        <option value="system">Sistema</option>
                                     </select>
                                     <textarea rows={2} value={m.text} onChange={e => { const copy = [...editingChatList]; copy[idx] = { ...copy[idx], text: e.target.value }; setEditingChatList(copy); }} />
                                     <div style={{display:'flex', flexDirection:'column', gap:6}}>
                                        <button className="upload-btn" onClick={() => { const copy = [...editingChatList]; copy.splice(idx,1); setEditingChatList(copy); }}>Remover</button>
                                        <button className="upload-btn" onClick={() => { const copy = [...editingChatList]; copy.splice(idx+1,0,{ sender:'me', type:'text', text:'' }); setEditingChatList(copy); }}>Adicionar</button>
                                     </div>
                                  </div>
                               ))}

                               <div style={{display:'flex', gap:8, marginTop:6, alignItems:'center'}}>
                                  <button className="upload-btn" onClick={() => { setChatData(editingChatList); setShowChatEditor(false); }}>Salvar Chat</button>
                                  <button className="upload-btn" onClick={() => { setChatJson(''); setShowChatEditor(false); }}>Cancelar</button>
                                  <button className="upload-btn" onClick={() => {
                                     try {
                                        const parsed = JSON.parse(chatJson || '[]');
                                        if (Array.isArray(parsed)) {
                                           setEditingChatList(parsed.map((m: any) => ({ sender: m.sender || 'me', type: m.type || 'text', text: m.text || '' })));
                                        } else alert('JSON inválido');
                                     } catch (e) { alert('JSON inválido'); }
                                  }}>Importar JSON</button>
                                  <input placeholder='Colar JSON aqui' value={chatJson} onChange={e=>setChatJson(e.target.value)} style={{flex:1}} />
                               </div>

                               {editingChatList && editingChatList.length > 0 && (
                                  <div style={{marginTop:8}}><small style={{color:'#ccc'}}>Pré-visualização:</small><div style={{marginTop:8}}><PhoneViewer chatData={editingChatList} contactName={chatContactName} /></div></div>
                               )}
                            </div>
                         </div>
                      )}

                      {isPerson && (
                         <div style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
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
                      {isLocked && (
                         <input placeholder="SENHA (Ex: KIAN)" value={lockPass} onChange={e=>setLockPass(e.target.value)} style={{borderColor:'red', color:'red', fontWeight:'bold'}} />
                      )}
                   </div>

                      <div className="field-block" style={{flex:1}}>
                      <span className="field-title">🗃️ METADADOS FALSOS (HACKING)</span>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:5}}>
                         <input placeholder="Data Fake" value={fakeMeta.date} onChange={e=>setFakeMeta({...fakeMeta, date:e.target.value})} />
                         <input placeholder="GPS Coords" value={fakeMeta.gps} onChange={e=>setFakeMeta({...fakeMeta, gps:e.target.value})} />
                         <input placeholder="Device Owner" value={fakeMeta.owner} onChange={e=>setFakeMeta({...fakeMeta, owner:e.target.value})} style={{gridColumn:'span 2'}} />
                      </div>
                      <div style={{ marginTop: 8 }}>
                         <label style={{ display: 'block', marginBottom: 6 }}>Nota Técnica / Comentário HEX (visível em INSPECIONAR CÓDIGO)</label>
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
                      <div style={{display:'flex', gap:8, alignItems:'center'}}>
                         <label className="upload-btn">📷 SELECIONAR FOTO<input type="file" accept="image/*" hidden onChange={handleImgSelect} /></label>
                         <label className="upload-btn">🎬 SELECIONAR VÍDEO<input type="file" accept="video/*" hidden onChange={handleVideoSelect} /></label>
                         {videoUploading && <span style={{color:'#c6a45f', fontSize:12}}>Enviando vídeo...</span>}
                      </div>
                      <div style={{marginTop:8}}>
                         <label>OU URL DO VÍDEO (YouTube, Vimeo, etc.)</label>
                         <input value={videoUrlInput} onChange={e=>setVideoUrlInput(e.target.value)} placeholder="https://..." />
                      </div>
                            <div className="image-preview-box" style={{backgroundImage: previewUrl ? `url(${previewUrl})` : 'none'}}>
                                 {!previewUrl && <span style={{fontSize:10, opacity:0.3}}>SEM IMAGEM</span>}
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
                                             <div style={{position:'absolute', right:6, top:6, zIndex:40, display:'flex', gap:6}}>
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
                         <div style={{marginTop:8}}>
                            <small style={{color:'#c6a45f'}}>Pré-visualização de vídeo:</small>
                            <div style={{marginTop:6}}>
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
                     <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:10}}>
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
                        A imagem acima é a base limpa. Ajuste os sliders na aba Glitch para calibrar a dificuldade enquanto vê o efeito aqui.
                     </small>
                  </div>
                )}

                {imgFile && (
                  <div style={{display:'flex', gap:15}}>
                     <div className="field-block" style={{flex:1, borderColor:'#b366ff'}}>
                        <span className="field-title" style={{color:'#b366ff'}}>2. LUZ NEGRA (UV)</span>
                        <p style={{fontSize:10, color:'#aaa'}}>Desenhe segredos visíveis apenas com lanterna.</p>
                        <div style={{display:'flex', flexDirection:'column', gap:10}}>
                           <button onClick={()=>setEditorMode('uv')} className="upload-btn">🖌️ DESENHAR EFEITO</button>
                           <label className="upload-btn">📂 UPLOAD PNG<input type="file" accept="image/png" hidden onChange={e => setUvFile(e.target.files?.[0] || null)} /></label>
                        </div>
                     </div>
                     <div className="field-block" style={{flex:1, borderColor:'#3498db'}}>
                        <span className="field-title" style={{color:'#3498db'}}>3. CAMADAS SECRETAS</span>
                        <p style={{fontSize:10, color:'#aaa'}}>Diferentes técnicas para esconder informações.</p>
                        
                        {/* FILTRO DE REVELAÇÃO */}
                        <div style={{marginBottom:15, padding:12, background:'rgba(52,152,219,0.05)', borderRadius:6, border:'1px solid rgba(52,152,219,0.2)'}}>
                           <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
                              <span style={{fontSize:11, fontWeight:'bold', color:'#3498db'}}>🔍 FILTRO DE REVELAÇÃO</span>
                           </div>
                           <p style={{fontSize:9, color:'#777', marginBottom:8}}>Desenhe segredos que aparecem ao ajustar brilho/contraste</p>
                           <button onClick={()=>setEditorMode('filter')} className="upload-btn" style={{fontSize:11, padding:'8px 12px'}}>
                              🖌️ DESENHAR CAMADA OCULTA
                           </button>
                           
                           {/* Advanced settings */}
                           <div style={{marginTop:8}}>
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
                                 <span style={{fontSize:'12px'}}>{showAdvancedFilterSettings ? '▼' : '▶'}</span>
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
                                    <div style={{display:'flex', gap:5, marginBottom:8}}>
                                       <div style={{flex:1}}>
                                          <label style={{fontSize:8, color:'#666', display:'block'}}>BRILHO</label>
                                          <input 
                                             type="number" 
                                             placeholder="150" 
                                             value={filterRevealBrightness} 
                                             onChange={e=>setFilterRevealBrightness(Number(e.target.value))}
                                             style={{width:'100%', fontSize:'11px'}}
                                          />
                                       </div>
                                       <div style={{flex:1}}>
                                          <label style={{fontSize:8, color:'#666', display:'block'}}>CONTRASTE</label>
                                          <input 
                                             type="number" 
                                             placeholder="150" 
                                             value={filterRevealContrast} 
                                             onChange={e=>setFilterRevealContrast(Number(e.target.value))}
                                             style={{width:'100%', fontSize:'11px'}}
                                          />
                                       </div>
                                       <div style={{flex:1}}>
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
                           <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
                              <span style={{fontSize:11, fontWeight:'bold', color:'#ff6400'}}>🌡️ VISÃO TÉRMICA</span>
                           </div>
                           <p style={{fontSize:9, color:'#777', marginBottom:8}}>Simula câmera termográfica ao inspecionar</p>
                           <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px', background:'rgba(0,0,0,0.3)', borderRadius:4, marginBottom:8}}>
                              <input 
                                 type="checkbox" 
                                 checked={thermalEnabled} 
                                 onChange={e => setThermalEnabled(e.target.checked)}
                                 style={{cursor:'pointer'}}
                              />
                              <span style={{fontSize:11, color:'#ccc'}}>Ativar modo termal na inspeção</span>
                           </label>
                           
                           {thermalEnabled && (
                              <div style={{marginTop:12, padding:10, background:'rgba(0,0,0,0.4)', borderRadius:4, border:'1px solid rgba(255,100,0,0.3)'}}>
                                 <div style={{marginBottom:8}}>
                                    <label style={{fontSize:10, color:'#ff9', display:'block', marginBottom:4}}>TEXTO SECRETO (visível apenas no modo termal)</label>
                                    <textarea 
                                       value={thermalSecretText}
                                       onChange={e => setThermalSecretText(e.target.value)}
                                       placeholder="Digite o texto que só aparece com visão térmica..."
                                       rows={3}
                                       style={{width:'100%', background:'#111', border:'1px solid #444', color:'#ff6400', padding:8, fontSize:11, borderRadius:4, fontFamily:'monospace'}}
                                    />
                                 </div>
                                 <div style={{marginBottom:8}}>
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
                                 <div style={{marginBottom:8}}>
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
                                 {imgFile && (
                                    <div style={{marginBottom:8}}>
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
                              <div style={{display:'flex', gap:10, marginBottom:12, flexWrap:'wrap'}}>
                                 <label className="upload-btn" style={{flex:1, minWidth:'180px'}}>
                                    📂 Selecionar Áudio
                                    <input type="file" accept="audio/*" hidden onChange={handleAudioBaseSelect} />
                                 </label>
                                 <button className="upload-btn" onClick={() => setShowMixer(true)} style={{minWidth:'180px'}}>
                                    🎛️ Estação de Mixagem
                                 </button>
                              </div>
                              {audioBase && (
                                 <div style={{padding:'10px', background:'rgba(0,243,255,0.05)', borderRadius:'6px', border:'1px solid rgba(0,243,255,0.15)'}}>
                                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                                       <span style={{fontSize:18}}>✓</span>
                                       <span className="file-status" style={{margin:0}}>{audioBase.name}</span>
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
                              <div style={{display:'flex', gap:10, flexWrap:'wrap', marginBottom:12}}>
                                 <label className="upload-btn" style={{flex:1, minWidth:'180px', borderColor:'rgba(198,164,95,0.3)', color:'#c6a45f'}}>
                                    📂 Upload de Áudio
                                    <input type="file" accept="audio/*" hidden onChange={handleAudioHiddenSelect} />
                                 </label>
                                 <button 
                                    className="upload-btn" 
                                    onClick={() => setShowAudioForgeFor('hidden')}
                                    style={{minWidth:'180px', borderColor:'rgba(198,164,95,0.3)', color:'#c6a45f'}}
                                 >
                                    🛠️ Forja de FX
                                 </button>
                              </div>
                              {audioHidden && (
                                 <div style={{padding:'10px', background:'rgba(198,164,95,0.08)', borderRadius:'6px', border:'1px solid rgba(198,164,95,0.2)'}}>
                                    <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                                       <span style={{fontSize:18}}>✓</span>
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
                                   
                                   {/* Advanced Audio Lab */}
                                   <div className="flex-1">
                                      <AdvancedAudioLab 
                                        baseSrc={audioBasePreview} 
                                        hiddenSrc={audioHiddenPreview} 
                                        targetFreq={freq} 
                                        triggerTime={triggerTime} 
                                        onTriggerChange={setTriggerTime} 
                                      />
                                   </div>

                                   {/* Spectrogram Creator */}
                                   <div style={{marginTop:12, padding:'12px', background:'rgba(0,0,0,0.3)', borderRadius:'6px', border:'1px solid rgba(0,243,255,0.1)'}}>
                                      <SpectrogramCreator onGenerated={async (wavBlob, buffer) => {
                                          try {
                                             if (audioHiddenPreview) { try { URL.revokeObjectURL(audioHiddenPreview); } catch (e) {} }
                                             const file = new File([wavBlob], `spectrogram_${Date.now()}.wav`, { type: 'audio/wav' });
                                             setAudioHidden(file);
                                             const localUrl = URL.createObjectURL(file);
                                             setAudioHiddenPreview(localUrl);
                                             setAudioHiddenUploadedUrl(null);

                                             setAudioHiddenUploading(true);
                                             try {
                                                const publicUrl = await uploadAudio(file, investigationId);
                                                if (publicUrl) {
                                                   setAudioHiddenUploadedUrl(publicUrl);
                                                   try { URL.revokeObjectURL(localUrl); } catch (e) {}
                                                   setAudioHiddenPreview(publicUrl);
                                                } else {
                                                   console.warn('Upload returned no publicUrl');
                                                }
                                             } catch (uploadErr) {
                                                console.error('Upload failed', uploadErr);
                                                alert('Falha ao enviar áudio gerado.');
                                             } finally {
                                                setAudioHiddenUploading(false);
                                             }
                                          } catch (e) {
                                             console.error('Failed to process generated audio', e);
                                          }
                                      }} />
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
                                       <div style={{fontSize:48, marginBottom:16, opacity:0.3}}>🎵</div>
                                       <p style={{fontSize:13, color:'#666', lineHeight:1.6}}>
                                          Selecione um áudio ambiente<br/>
                                          <span style={{fontSize:11}}>(Camada A) para iniciar o teste</span>
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
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <input type="checkbox" id="shred-check" checked={isShredded} onChange={e => setIsShredded(e.target.checked)} />
                    <label htmlFor="shred-check" style={{ margin: 0, cursor: 'pointer' }}>Documento Triturado (Puzzle)</label>
                 </div>
                 {isShredded && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                       <div style={{ flex: 1 }}>
                          <label>Formato</label>
                          <div style={{ display: 'flex', gap: 6 }}>
                             <button className={shredRows === 1 && shredCols === 8 ? 'btn-stamp active' : 'btn-stamp'} onClick={() => { setShredRows(1); setShredCols(8); }}>Tiras</button>
                             <button className={shredRows === 4 && shredCols === 4 ? 'btn-stamp active' : 'btn-stamp'} onClick={() => { setShredRows(4); setShredCols(4); }}>Grid 4x4</button>
                          </div>
                       </div>
                    </div>
                 )}
                 <div style={{ marginTop: 8 }}>
                    <label>TEXTO REAL (opcional)</label>
                    <textarea rows={2} value={realText} onChange={e => setRealText(e.target.value)} placeholder="Texto em Português que aparecerá com a lente." />
                 </div>
                 <div style={{ marginTop: 8 }}>
                    <label>TEXTO CIFRADO (opcional)</label>
                    <input value={cipherText} onChange={e => setCipherText(e.target.value)} placeholder="Deixe vazio para gerar símbolos automáticos" />
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
                        <span style={{fontSize:11, color:'#9fb9ff'}}>Mídia conectada. Ajuste os sliders abaixo para definir o quebra-cabeça.</span>
                        {glitchFocusedImagePreview && (
                          <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                             <span style={{fontSize:18}}>✓</span>
                             <span style={{fontSize:11, color:'#7bd7ff'}}>Camada de foco pronta — criada no Designer da aba Visual.</span>
                          </div>
                        )}
                      </div>
                    )}
                 </div>

                 {/* Seção de Parâmetros */}
                 <div style={{marginBottom:20}}>
                    <h4 style={{color:'#64b5ff', marginTop:0}}>⚙️ PARÂMETROS CORRETOS PARA RESOLVER</h4>
                    
                    <div style={{marginBottom:12}}>
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

                    <div style={{marginBottom:12}}>
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

                    <div style={{marginBottom:12}}>
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

                    <div style={{padding:10, background:'rgba(100,150,255,0.1)', borderRadius:6, border:'1px solid rgba(100,150,255,0.2)', fontSize:11, color:'#888'}}>
                       💡 <strong style={{color:'#64b5ff'}}>Memorize ou anote estes valores!</strong> Você precisará deles para verificar a solução.
                    </div>

                              <div style={{marginTop:12, padding:'10px', background:'rgba(100,150,255,0.05)', border:'1px solid rgba(100,150,255,0.15)', borderRadius:6}}>
                                 <h5 style={{margin:'0 0 8px 0', color:'#64b5ff'}}>Tolerância de acerto (sliders)</h5>
                                 <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:8}}>
                                     <label style={{fontSize:12, color:'#ccc'}}>Freq. (±)
                                        <input type="number" value={glitchToleranceFreq} onChange={e => setGlitchToleranceFreq(Math.max(0, parseInt(e.target.value) || 0))} min={0} max={10} style={{width:'100%', marginTop:4}} />
                                     </label>
                                     <label style={{fontSize:12, color:'#ccc'}}>Shift (±)
                                        <input type="number" value={glitchToleranceShift} onChange={e => setGlitchToleranceShift(Math.max(0, parseInt(e.target.value) || 0))} min={0} max={20} style={{width:'100%', marginTop:4}} />
                                     </label>
                                     <label style={{fontSize:12, color:'#ccc'}}>Chroma (±)
                                        <input type="number" value={glitchToleranceChroma} onChange={e => setGlitchToleranceChroma(Math.max(0, parseInt(e.target.value) || 0))} min={0} max={20} style={{width:'100%', marginTop:4}} />
                                     </label>
                                 </div>
                                 <small style={{display:'block', marginTop:6, color:'#777'}}>Valores menores deixam o puzzle mais preciso; maiores permitem folga ao alinhar.</small>
                              </div>
                 </div>

                {/* Briefing e dica rápida */}
                <div style={{marginBottom:20}}>
                   <h4 style={{color:'#64b5ff', marginTop:0}}>🧭 BRIEFING DO PUZZLE</h4>
                   <label>Como o jogador encontra/ativa este puzzle?</label>
                   <textarea
                      value={glitchAccessInstructions}
                      onChange={e => setGlitchAccessInstructions(e.target.value)}
                      rows={3}
                      placeholder="Ex: Precisam abrir este card e usar o painel de decodificação para alinhar as barras..."
                      style={{width:'100%', marginTop:4}}
                   />

                   <label style={{display:'block', marginTop:12}}>Dica curta (opcional)</label>
                   <textarea
                      value={glitchHint}
                      onChange={e => setGlitchHint(e.target.value)}
                      rows={2}
                      placeholder="Ex: Frequência baixa, deslocamento no terço inferior, cromática baixa."
                      style={{width:'100%', marginTop:4}}
                   />
                </div>

                {/* Valores iniciais para os sliders do jogador */}
                <div style={{marginBottom:24}}>
                   <h4 style={{color:'#64b5ff', marginTop:0}}>🎛️ PONTOS DE PARTIDA PARA O JOGADOR</h4>
                   <p style={{fontSize:11, color:'#888', marginBottom:8}}>Defina de onde os controles começam para não entregar a resposta de imediato.</p>
                   <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12}}>
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
                   <div style={{display:'flex', flexDirection:'column', gap:10}}>
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
                      <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
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
                 <div style={{marginBottom:20}}>
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
                 <div style={{marginBottom:20}}>
                    <h4 style={{color:'#ff6400', marginTop:0}}>🖼 IMAGEM DA VERDADE (opcional)</h4>
                    <label>Upload da imagem final:</label>
                    <div style={{display:'flex', gap:8, alignItems:'center', marginTop:8}}>
                       <label className="upload-btn" style={{flex:1}}>📂 SELECIONAR<input type="file" accept="image/*" hidden onChange={handleMegaImageSelect} disabled={loading} /></label>
                    </div>
                    {megaImagePreview && (
                       <div style={{marginTop:8, padding:10, background:'rgba(0,0,0,0.3)', borderRadius:6, border:'1px solid rgba(255,100,0,0.2)'}}>
                          <div style={{display:'flex', alignItems:'center', gap:8}}>
                             <span style={{fontSize:18}}>✓</span>
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
                       <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:12}}>
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
                            className="upload-btn"
                            onClick={() => {
                              if (megaSelectedPuzzle && !megaRequiredPuzzleIds.includes(megaSelectedPuzzle)) {
                                setMegaRequiredPuzzleIds([...megaRequiredPuzzleIds, megaSelectedPuzzle]);
                                setMegaSelectedPuzzle('');
                              }
                            }}
                            disabled={!megaSelectedPuzzle}
                            style={{minWidth:160}}
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
                       <div style={{display:'flex', flexDirection:'column', gap:8}}>
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
                                   style={{cursor:'pointer'}}
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

          </div>

      </div>

      <div className="dossier-footer">
           <button className="btn-cancel" onClick={onClose}>CANCELAR</button>
           <button className="btn-save" onClick={handleSave} disabled={loading}>
              {loading ? 'ARQUIVANDO...' : 'REGISTRAR EVIDÊNCIA'}
           </button>
        </div>

      {showMixer && (
         <div style={{ position: 'fixed', inset: 0, zIndex: 16000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: 'min(1000px,96%)', background: '#0b0b0b', borderRadius: 8, padding: 12 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ color: '#fff' }}>Estação de Mixagem — Visualizador de Espectrograma</strong>
                  <button className="btn-cancel" onClick={() => setShowMixer(false)}>Fechar</button>
               </div>
               <div style={{background: '#000', padding: 8, borderRadius: 6 }}>
                  <UrlRealTimeSpectrogram audioUrl={audioBasePreview} />
               </div>
            </div>
         </div>
      )}

      {editorMode && previewUrl && (
         <div style={{position:'fixed', inset:0, zIndex:16000, display:'flex', alignItems:'center', justifyContent:'center', padding:24}}>
            <div style={{width:'min(1200px,96%)'}}>
              <UVEditor 
                 baseImageUrl={previewUrl}
                 mode={editorMode || 'uv'}
                 initialImageFile={editorMode === 'filter' ? filterInitialImage : undefined}
                 onSave={(file) => { 
                    if (editorMode === 'uv') setUvFile(file);
                    if (editorMode === 'filter') setFilterFile(file);
                    setEditorMode(null);
                    setFilterInitialImage(null);
                 }}
                 onClose={() => { setEditorMode(null); setFilterInitialImage(null); }}
              />
            </div>
         </div>
      )}

             {showGlitchDesigner && previewUrl && (
            <div style={{position:'fixed', inset:0, zIndex:16000, display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'rgba(0,0,0,0.85)'}}>
               <div style={{width:'min(1200px,96%)'}}>
                 <UVEditor
                            baseImageUrl={previewUrl}
                   mode="uv"
                   onSave={(file) => {
                     if (glitchFocusedImagePreview) { try { URL.revokeObjectURL(glitchFocusedImagePreview); } catch(e){} }
                     setGlitchFocusedImageFile(file);
                     setGlitchFocusedImagePreview(URL.createObjectURL(file));
                     setShowGlitchDesigner(false);
                   }}
                   onClose={() => setShowGlitchDesigner(false)}
                 />
               </div>
            </div>
         )}
      
      {showAudioForgeFor && (
         <div style={{ position: 'fixed', inset: 0, zIndex: 16000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
            <div style={{ width: 'min(940px,96%)' }}>
               <AudioForge
                  spectrogramUrl={audioHiddenPreview}
                  triggerTime={triggerTime}
                  onClose={() => setShowAudioForgeFor(null)}
                  onSave={(file) => {
                     if (showAudioForgeFor === 'hidden') {
                        setAudioHidden(file);
                        try { if (audioHiddenPreview) URL.revokeObjectURL(audioHiddenPreview); } catch(e){}
                        setAudioHiddenPreview(URL.createObjectURL(file));
                     } else {
                        setAudioBase(file);
                        try { if (audioBasePreview) URL.revokeObjectURL(audioBasePreview); } catch(e){}
                        setAudioBasePreview(URL.createObjectURL(file));
                     }
                     setShowAudioForgeFor(null);
                  }}
               />
            </div>
         </div>
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

      </DiegeticWindow>
    </div>
  );
}
