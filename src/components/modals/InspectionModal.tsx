import { Search, Gamepad2, Music, X, Lock, User, Camera, Thermometer, Volume2, VolumeX, Maximize2, ShieldCheck, Eye, EyeOff, ArrowUp, ArrowDown, ArrowLeft, FolderOpen, Microscope, Keyboard, Languages, FileText, Video, MessageSquare, SlidersHorizontal, Flashlight, Puzzle, Pencil, Clock, CheckCircle2, XCircle, KeyRound, Smartphone, Play, Pause, Layers, Pin, PanelRightClose, PanelRightOpen, Repeat, RotateCcw, RotateCw, Download, Activity } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import MysteryImage from '../board/MysteryImage';
import HackingTerminal from '../tools/HackingTerminal';
import ChannelIsolator from '../tools/ChannelIsolator';
import HexViewer from '../tools/HexViewer';
import PhoneViewer from '../tools/PhoneViewer';
import CCTVPlayer from '../tools/CCTVPlayer';
import DecipherLens from '../tools/DecipherLens';
import ShredderPuzzle from '../tools/ShredderPuzzle';
import ShredderPuzzleModal from './ShredderPuzzleModal';
import UniversalDecoder from '../tools/UniversalDecoder';
import NumericKeypad from '../tools/NumericKeypad';
import PatternLock from '../tools/PatternLock';
import AudioViewerModal from './AudioViewerModal';
import PhysicalDocumentTable from '../tools/PhysicalDocumentTable';
import AcousticWorkbench from '../tools/AcousticWorkbench';
import OrdoFieldManualModal from './OrdoFieldManualModal';
import PinListBar from '../collaboration/PinListBar';
import { CasePin, PhonePinAnchor } from '../../types/collaboration';
import { useForensicDispatch } from '../../contexts/ForensicDispatchContext';
import { useCollaboration } from '../../contexts/CollaborationContext';
import WaveSurfer from 'wavesurfer.js';
import useEscapeClose from './useEscapeClose';
import './InspectionModal.css';
import { markPerfKeep } from '../../utils/performance';
import usePerformanceMode from '../../utils/usePerformanceMode';
import { markCardSeen, recordUnlockedCode } from '../../utils/playerTracking';
import { unlockAudio } from '../../utils/audio';
import { supabase } from '../../supabaseClient';
import { uploadInvestigationFile } from '../../utils/storage';
import { updateInvestigationCard } from '../../api/investigations';
import { verifyClueSolution, triggerGmOverride } from '../../api/clueSecurity';
import {
  DEFAULT_IMAGE_FILTERS,
  IMAGE_FILTER_LIMITS,
  clampImageFilterValue,
  normalizeImageFilterValues,
} from '../../config/imageFilter';

const GlitchPuzzleSolverLazy = React.lazy(() => import('../tools/GlitchPuzzleSolver'));

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: any;
  onEdit?: () => void;
  isGameMaster: boolean;
  playerView?: boolean;
  performanceMode?: boolean;
  initialForensicMode?: 'none' | 'channel' | 'hex' | 'lens' | 'decoder';
  onSendToDecoder?: (text: string, mode?: string) => void;
  externalBaseId?: string;
  externalHiddenId?: string;
}

export default function InspectionModal({
  isOpen,
  onClose,
  card,
  onEdit,
  isGameMaster,
  playerView,
  performanceMode: performanceModeProp,
  initialForensicMode = 'none',
  onSendToDecoder,
  externalBaseId,
  externalHiddenId,
}: Props) {
  const { enabled: perfModeFromHook } = usePerformanceMode();
  const { activeDispatch, clearDispatch, manualOpen, manualInitialTab, closeFieldManual } = useForensicDispatch();
  const { investigationId: collabInvestigationId, pinsByCardId, requestAnchorJump } = useCollaboration();
  const effectivePerformanceMode = performanceModeProp ?? perfModeFromHook;
  const effectivePlayerView = playerView ?? !isGameMaster;
  const isCardLocked = (c: any) => {
    const v = c?.is_locked;
    if (v === true || v === 1) return true;
    if (typeof v === 'string') {
      const s = v.toLowerCase();
      return s === 'true' || s === 't' || s === '1';
    }
    // If a lock_password exists, treat the card as locked for safety
    if (c?.lock_password) return true;
    return false;
  };

  useEscapeClose(isOpen, onClose);
  const initialLocked = isCardLocked(card);
  const [isUnlocked, setIsUnlocked] = useState(!initialLocked);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [gmActiveTab, setGmActiveTab] = useState<'public' | 'hidden'>('public');
  const [audioIsMuted, setAudioIsMuted] = useState(false);

  const isMounted = React.useRef(true);
  React.useEffect(() => { return () => { isMounted.current = false; }; }, []);

  React.useEffect(() => {
    setIsUnlocked(!isCardLocked(card));
    setShowGlitchSolver(false);
    setPasswordInput('');
    setPasswordError(false);
  }, [card, isGameMaster]);

  const [localUV, setLocalUV] = useState(false);
  const [uvLensLocked, setUvLensLocked] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenOnlyTreatment, setFullscreenOnlyTreatment] = useState(false);
  const [showGlitchSolver, setShowGlitchSolver] = useState(false);
  // audio handled as a visual mode tab now
  const [localThermal, setLocalThermal] = useState(false);
  const [filters, setFilters] = useState<{
    brightness: number;
    contrast: number;
    saturation: number;
  }>({
    brightness: DEFAULT_IMAGE_FILTERS.brightness,
    contrast: DEFAULT_IMAGE_FILTERS.contrast,
    saturation: DEFAULT_IMAGE_FILTERS.saturate,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [forensicMode, setForensicMode] = useState<'none' | 'channel' | 'hex' | 'lens' | 'decoder'>(initialForensicMode || 'none');
  const [decoderPayloadOverride, setDecoderPayloadOverride] = useState<string | undefined>(undefined);
  const [forensicChannel, setForensicChannel] = useState<'all' | 'r' | 'g' | 'b'>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleUpdateStatus = async (newStatus: 'pending' | 'confirmed' | 'debunked') => {
    const cardObj = serverCard || card;
    if (!cardObj?.id) return;
    try {
      const updated = await updateInvestigationCard(cardObj.id, {
        status: newStatus,
        metadata: { ...(cardObj.metadata || {}), status: newStatus }
      } as any);
      if (isMounted.current) setServerCard(updated);
    } catch (err) {
      console.error('Falha ao atualizar status da pista:', err);
    }
  };

  const handleUpdateZIndex = async (delta: number) => {
    const cardObj = serverCard || card;
    if (!cardObj?.id) return;
    const currentZ = Number(cardObj.z_index ?? 1);
    const newZ = Math.max(0, currentZ + delta);
    try {
      const updated = await updateInvestigationCard(cardObj.id, { z_index: newZ } as any);
      if (isMounted.current) setServerCard(updated);
    } catch (err) {
      console.error('Falha ao atualizar z_index da pista:', err);
    }
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (fileRef.current?.requestFullscreen) {
          await fileRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      // Fallback handled by internal fullscreenOpen state
    }
    setFullscreenOpen(prev => !prev);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cardObj = serverCard || card;
    const lockPass = String(cardObj?.lock_password || '').trim();
    const entered = passwordInput.trim();
    if (entered && lockPass && entered.toLowerCase() === lockPass.toLowerCase()) {
      persistUnlockForCard();
      setPasswordError(false);
      setPasswordInput('');
    } else {
      setPasswordError(true);
    }
  };

  const handleToggleAudioMute = () => {
    const nextMuted = !audioIsMuted;
    setAudioIsMuted(nextMuted);
    if (audioElementRef.current) {
      audioElementRef.current.muted = nextMuted;
    }
    if (waveSurferRef.current) {
      waveSurferRef.current.setMuted(nextMuted);
    }
  };

  const handleEvidencePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (uvLensLocked) {
      e.currentTarget.style.setProperty('--uv-radius', '1200px');
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // Mobile-safe: offset beam above finger so the player's thumb doesn't cover the clue
    const touchOffsetY = e.pointerType === 'touch' ? -68 : 0;
    const y = Math.max(24, e.clientY - rect.top + touchOffsetY);
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    e.currentTarget.style.setProperty('--uv-radius', '145px');
  };

  const handleEvidenceTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (uvLensLocked) {
      e.currentTarget.style.setProperty('--uv-radius', '1200px');
      return;
    }
    if (e.touches.length >= 1) {
      const t = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = t.clientX - rect.left;
      const y = Math.max(24, t.clientY - rect.top - 68);
      e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
      e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
      e.currentTarget.style.setProperty('--uv-radius', '145px');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setForensicMode(initialForensicMode || 'none');
      setDecoderPayloadOverride(undefined);
    }
  }, [isOpen, initialForensicMode, card?.id]);

  // Marca pista como vista para o jogador ao abrir o InspectionModal (quando não está bloqueada)
  useEffect(() => {
    if (!isOpen || !card?.id || !card?.investigation_id) return;
    if (isCardLocked(card) && !isUnlocked && !isGameMaster) return;
    markCardSeen(String(card.investigation_id), String(card.id), {
      isGameMaster,
      playerView: effectivePlayerView,
    });
  }, [isOpen, card, isUnlocked, isGameMaster, effectivePlayerView]);

  const disableAllBut = React.useCallback((mode: string) => {
    // filters
    if (mode === 'filters') setShowFilters(prev => !prev);
    else setShowFilters(false);

    // forensic submodes: channel / hex / lens
    if (mode === 'forense') {
      setForensicMode(prev => prev === 'channel' ? 'none' : 'channel');
    } else if (mode === 'hex') {
      setForensicMode(prev => prev === 'hex' ? 'none' : 'hex');
    } else if (mode === 'decoder') {
      setForensicMode(prev => prev === 'decoder' ? 'none' : 'decoder');
    } else if (mode === 'lens') {
      setForensicMode(prev => prev === 'lens' ? 'none' : 'lens');
    } else {
      // if selecting another mode, close forensic panel
      if (forensicMode !== 'none') setForensicMode('none');
    }
  }, [forensicMode]);
  const [puzzleSolved, setPuzzleSolved] = useState(() => {
    if (card?.investigation_id && card?.id) {
      const saved = localStorage.getItem(`shredder_solved_${card.investigation_id}_${card.id}`);
      return saved === 'true';
    }
    return false;
  });
  const [shredderModalOpen, setShredderModalOpen] = useState(false);

  // Salvar estado de puzzle resolvido no localStorage
  useEffect(() => {
    if (card?.investigation_id && card?.id) {
      const solvedKey = `shredder_solved_${card.investigation_id}_${card.id}`;
      localStorage.setItem(solvedKey, String(puzzleSolved));
    }
  }, [puzzleSolved, card?.investigation_id, card?.id]);
  const fileRef = React.useRef<HTMLDivElement | null>(null);
  const backdropRef = React.useRef<HTMLDivElement | null>(null);
  const thermalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mark modal root as a performance exception so filters/animations remain functional
  useEffect(() => {
    const el = fileRef.current;
    const cleans: Array<() => void> = [];
    try {
      if (backdropRef.current) cleans.push(markPerfKeep(backdropRef.current));
    } catch { }
    try {
      if (el) cleans.push(markPerfKeep(el));
    } catch { }
    return () => cleans.forEach((c) => { try { c(); } catch { } });
  }, []);
  const [phoneSidebarOpen, setPhoneSidebarOpen] = useState(true);
  const [mobilePhoneDrawerOpen, setMobilePhoneDrawerOpen] = useState(false);
  const [phoneForensicTab, setPhoneForensicTab] = useState<'markers' | 'metadata'>(
    collabInvestigationId ? 'markers' : 'metadata'
  );
  const [showPhonePins, setShowPhonePins] = useState(true);
  const [serverCard, setServerCard] = useState<any | null>(null);

  useEffect(() => {
    setMobilePhoneDrawerOpen(false);
    setPhoneForensicTab(collabInvestigationId ? 'markers' : 'metadata');
  }, [card?.id, collabInvestigationId]);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const moreToolsBtnRef = useRef<HTMLButtonElement | null>(null);
  const [moreToolsPos, setMoreToolsPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const moreToolsDropdownRef = useRef<HTMLDivElement | null>(null);
  const [menuView, setMenuView] = useState<'tools' | 'media'>('tools');
  const DROPDOWN_VERTICAL_OFFSET = 55; // increased offset so dropdown doesn't overlap the trigger

  useEffect(() => {
    if (!showMoreTools) return;
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (moreToolsDropdownRef.current && moreToolsDropdownRef.current.contains(target)) return;
      if (moreToolsBtnRef.current && moreToolsBtnRef.current.contains(target)) return;
      setShowMoreTools(false);
    };

    const handleReposition = () => {
      requestAnimationFrame(() => {
        const btn = moreToolsBtnRef.current;
        const modalEl = fileRef.current;
        if (!btn || !modalEl) return;
        const btnRect = btn.getBoundingClientRect();
        const modalRect = modalEl.getBoundingClientRect();
        setMoreToolsPos({
          left: Math.max(8, (btnRect.left - (modalRect.left || 0))),
          top: Math.max(8, (btnRect.bottom - (modalRect.top || 0)) + DROPDOWN_VERTICAL_OFFSET),
          width: btnRect.width,
        });
      });
    };

    document.addEventListener('mousedown', handleDocClick);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    // initial reposition
    handleReposition();

    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [showMoreTools]);
  const [videoUploadingInspection, setVideoUploadingInspection] = useState(false);
  // Novo estado: modal de áudio em tela cheia
  const [audioExpanderOpen, setAudioExpanderOpen] = useState(false);
  const [expanderAudioSrc, setExpanderAudioSrc] = useState<string>('');
  // Flag para evitar múltiplos cliques simultâneos
  const audioExpanderLockRef = useRef(false);

  // Player compacto (modal principal)
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState<0.5 | 1 | 1.5>(1);
  const [audioLoop, setAudioLoop] = useState(false);
  const audioLoopRef = useRef(false);
  const [waveformZoomLevel, setWaveformZoomLevel] = useState(1);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<any | null>(null);

  useEffect(() => {
    audioLoopRef.current = audioLoop;
    if (audioElementRef.current) {
      audioElementRef.current.loop = audioLoop;
    }
  }, [audioLoop]);

  useEffect(() => {
    if (waveSurferRef.current) {
      try { waveSurferRef.current.setPlaybackRate(audioPlaybackRate); } catch { }
    }
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = audioPlaybackRate;
    }
  }, [audioPlaybackRate]);

  useEffect(() => {
    if (waveSurferRef.current) {
      try { waveSurferRef.current.setVolume(audioVolume); } catch { }
    }
    if (audioElementRef.current) {
      audioElementRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  const resolveUnifiedMedia = (cardObj: any, metadataObj: any) => {
    const unified = metadataObj?.unified_media || {};
    const baseType = unified.base_media_type || metadataObj?.media_type || cardObj?.base_media_type || null;
    const baseUrl = unified.base_media_url || cardObj?.base_media_url || null;
    const maskedPreview = metadataObj?.masked_preview === true || (metadataObj?.security_layer?.enabled && baseUrl);

    const imageUrl = (() => {
      const baseImage = cardObj?.image_url || baseUrl || unified.image_url || null;
      return baseImage;
    })();

    const videoUrl = (() => {
      if (baseType === 'video' && baseUrl) return baseUrl;
      return cardObj?.video_url || unified.video_url || null;
    })();

    const audioUrl = (() => {
      if (baseType === 'audio' && baseUrl) return baseUrl;
      // Check all possible audio URL locations
      return cardObj?.audio_url ||
        unified.audio_base_url ||
        unified.audio_url ||
        metadataObj?.audio_url ||
        metadataObj?.audio ||
        null;
    })();

    const audioHiddenUrl = cardObj?.audio_hidden_url ||
      unified.audio_hidden_url ||
      metadataObj?.audio_hidden_url ||
      metadataObj?.audio_hidden ||
      null;
    return { baseType, baseUrl, imageUrl, videoUrl, audioUrl, audioHiddenUrl, maskedPreview };
  };

  const handleSecuritySolved = () => {
    (async () => {
      setPuzzleSolved(true);
      setShowGlitchSolver(false);

      const cardObj = serverCard || card;
      if (!cardObj) return;

      let meta: any = {};
      try {
        meta = cardObj.metadata && typeof cardObj.metadata === 'object' ? cardObj.metadata : (typeof cardObj.metadata === 'string' ? JSON.parse(cardObj.metadata) : {});
      } catch (e) { meta = {}; }

      const nextGlitch = { ...(meta.glitch_puzzle || {}), solved: true, solved_at: new Date().toISOString() };
      const nextMetadata = { ...meta, glitch_puzzle: nextGlitch };
      const focused = nextGlitch.focused_image_url || nextGlitch.original_image_url || null;

      const updates: any = { metadata: nextMetadata };
      if (focused) updates.image_url = focused;

      try {
        // Persist change on server and use returned card as canonical
        const updated = await updateInvestigationCard(cardObj.id, updates as any);
        if (isMounted.current) setServerCard(updated);
      } catch (err) {
        console.error('Falha ao persistir solução do puzzle no servidor:', err);
        // fallback: optimistic local update so UI reflects solved state
        const updatedCard: any = { ...cardObj, metadata: nextMetadata };
        if (focused) updatedCard.image_url = focused;
        if (isMounted.current) setServerCard(updatedCard);
        alert('Solução aplicada localmente, mas falha ao salvar no servidor. Tente novamente ou verifique a conexão.');
      }
    })();
  };

  const [gmOverrideBusy, setGmOverrideBusy] = useState(false);
  const [gmOverrideStatus, setGmOverrideStatus] = useState<string | null>(null);

  const handleVerifyLockedCard = async (attempt: string): Promise<boolean> => {
    const cardObj = serverCard || card;
    if (!cardObj?.id) return false;
    const res = await verifyClueSolution(
      String(cardObj.id),
      attempt,
      'Agente',
      cardObj?.lock_password || null
    );
    if (res.unlocked) {
      setIsUnlocked(true);
      if (isMounted.current) {
        setServerCard((prev: any) => ({
          ...(prev || cardObj),
          is_locked: false,
          lock_password: null,
        }));
      }
      return true;
    }
    return false;
  };

  const handleGmSkillOverride = async (mode: 'assist_hint' | 'override_unlock') => {
    const cardObj = serverCard || card;
    if (!cardObj?.id || gmOverrideBusy) return;
    setGmOverrideBusy(true);
    setGmOverrideStatus(null);
    try {
      const res = await triggerGmOverride(String(cardObj.id), mode);
      if (res.ok) {
        if (mode === 'override_unlock') {
          setIsUnlocked(true);
          if (isMounted.current) {
            setServerCard((prev: any) => ({
              ...(prev || cardObj),
              is_locked: false,
              lock_password: null,
            }));
            setGmOverrideStatus(
              res.unlocked_reward_ids && res.unlocked_reward_ids.length > 0
                ? `Override aplicado! ${res.unlocked_reward_ids.length} recompensa(s) revelada(s).`
                : 'Override aplicado! Pista destravada ao vivo.'
            );
          }
        } else {
          if (isMounted.current) {
            setServerCard((prev: any) => ({
              ...(prev || cardObj),
              metadata: {
                ...((prev || cardObj)?.metadata || {}),
                cris_assist_revealed: true,
                cris_assist_hint: res.hint,
              },
            }));
            setGmOverrideStatus('Calibração Assistida da C.R.I.S. enviada aos agentes.');
          }
        }
      } else {
        // Fallback if Phase 5 SQL migration isn't applied yet
        if (mode === 'override_unlock') {
          await persistUnlockForCard('', 'terminal');
          if (isMounted.current) setGmOverrideStatus('Override local aplicado (pista destravada).');
        } else if (isMounted.current) {
          setGmOverrideStatus('Aplique a migração SQL Fase 5 para usar Calibração Assistida.');
        }
      }
    } finally {
      if (isMounted.current) setGmOverrideBusy(false);
    }
  };

  // Persist unlock to server so the card remains unlocked permanently
  const persistUnlockForCard = async (unlockedCode?: string, lockType: 'keypad' | 'terminal' = 'keypad') => {
    setIsUnlocked(true);
    const cardObj = serverCard || card;
    if (cardObj?.investigation_id && cardObj?.id && unlockedCode) {
      recordUnlockedCode(
        String(cardObj.investigation_id),
        {
          cardId: String(cardObj.id),
          cardTitle: cardObj.title || 'Evidência Protegida',
          code: String(unlockedCode),
          lockType,
        },
        { isGameMaster, playerView: effectivePlayerView }
      );
    }
    if (!cardObj || !cardObj.id) return;
    try {
      const updates: any = { is_locked: false, lock_password: null };
      const updated = await updateInvestigationCard(cardObj.id, updates as any);
      if (isMounted.current) setServerCard(updated);
    } catch (err) {
      console.error('Falha ao persistir desbloqueio no servidor:', err);
      // optimistic update already applied via setIsUnlocked(true)
    }
  };

  // Controle de qual ferramenta visual está ativa
  // 'image' | 'phone' | 'forense' | ...
  const [visualMode, setVisualMode] = useState<string>('image');

  // Atualiza o modo visual quando o cartão muda (garante que PhoneViewer apareça se houver chat)
  React.useEffect(() => {
    try {
      const unifiedMediaData = resolveUnifiedMedia(card, card?.metadata);
      if (card?.metadata?.type === 'phone' || card?.metadata?.chat_data || card?.metadata?.device_extraction) setVisualMode('phone');
      else if (card?.video_url) setVisualMode('video');
      else if ((card?.audio_url || unifiedMediaData.audioUrl || (card?.metadata && (card.metadata.audio || card.metadata.audio_url))) && !card?.image_url) setVisualMode('audio');
      else setVisualMode('image');
    } catch (e) { setVisualMode('image'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

  // initialize localThermal from card metadata when card changes
  React.useEffect(() => {
    try {
      const meta = card?.metadata;
      const hasThermal = Boolean(meta && (meta.thermal === true || meta.thermal_enabled === true || meta.thermal_overlay === true));
      // Check if thermal is unlocked (no keyword or already unlocked)
      const thermalKeyword = meta?.thermal_keyword;
      const thermalUnlocked = meta?.thermal_unlocked === true;
      setLocalThermal(false);
    } catch (e) { }
  }, [card]);

  React.useEffect(() => {
    if (isOpen) {
      // Modal opened
      // ensure the page and modal scroll positions are reset so content is visible and centered
      setTimeout(() => {
        try {
          window.scrollTo(0, 0);
          fileRef.current?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
          const visual = fileRef.current?.querySelector('.inspect-visual-area') as HTMLElement | null;
          visual?.scrollTo?.(0, 0);
        } catch (e) {
          // ignore
        }
      }, 0);
    }
  }, [isOpen]);

  // Render thermal canvas when enabled (OTIMIZADO COM LUT E DOWNSCALE)
  React.useEffect(() => {
    const canvas = thermalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (!localThermal) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const imgSrc = (card && (card.image_url || card.image_uv_url)) || null;
    if (!imgSrc) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;

    img.onload = () => {
      if (cancelled) return;
      try {
        // 1. DOWNSCALE INTELIGENTE: Limitar tamanho máximo para processamento rápido
        const MAX_SIZE = 1200; // Câmeras termais são low-res, não precisamos de 4K
        let calcWidth = img.naturalWidth || img.width || 1024;
        let calcHeight = img.naturalHeight || img.height || 768;
        
        if (calcWidth > MAX_SIZE || calcHeight > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / calcWidth, MAX_SIZE / calcHeight);
          calcWidth = Math.round(calcWidth * ratio);
          calcHeight = Math.round(calcHeight * ratio);
        }

        canvas.width = Math.max(1, calcWidth);
        canvas.height = Math.max(1, calcHeight);
        
        // Estilo CSS para expandir o canvas reduzido pela tela
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';
        canvas.style.width = 'auto';
        canvas.style.height = '100%';
        canvas.style.left = '50%';
        canvas.style.top = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desligar suavização (smoothing) para dar um ar mais digital/termal
        ctx.imageSmoothingEnabled = false; 
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 2. LOOKUP TABLE (LUT) DE CORES IRONBOW (Pré-cálculo)
        // Evita fazer if/else e multiplicações matemáticas milhões de vezes
        const lutR = new Uint8Array(256);
        const lutG = new Uint8Array(256);
        const lutB = new Uint8Array(256);

        for (let v = 0; v < 256; v++) {
          if (v < 85) {
            const t = v / 85;
            lutR[v] = Math.round(t * 70);
            lutG[v] = 0;
            lutB[v] = Math.round(t * 100);
          } else if (v < 170) {
            const t = (v - 85) / 85;
            lutR[v] = Math.round(70 + (t * (255 - 70)));
            lutG[v] = 0;
            lutB[v] = Math.round(100 - (t * 100));
          } else {
            const t = (v - 170) / 85;
            lutR[v] = 255;
            lutG[v] = Math.round(t * 255);
            lutB[v] = Math.round(t * 255);
          }
        }

        // 3. APLICAÇÃO OTIMIZADA NOS PIXELS
        for (let i = 0; i < data.length; i += 4) {
          // Usando fórmula de Luminância correta em vez de média simples,
          // gera mapas de calor muito mais precisos. Bitwise (~~) arredonda super rápido.
          const val = ~~((data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114));
          
          data[i]     = lutR[val];
          data[i + 1] = lutG[val];
          data[i + 2] = lutB[val];
          // Alpha data[i+3] continua intacto
        }

        ctx.putImageData(imageData, 0, 0);

        // Overlay Gradiente
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, 'rgba(255,80,20,0.06)');
        grad.addColorStop(1, 'rgba(255,255,255,0.02)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';

        // Render Secret Thermal Text
        try {
          const thermalText = card?.metadata?.thermal_secret_text;
          if (thermalText && typeof thermalText === 'string' && thermalText.trim()) {
            let baseFontSize = Math.max(24, Math.min(canvas.width, canvas.height) / 12); // Reduzido baseado no novo tamanho max
            const fontSizeMultiplier = (card?.metadata?.thermal_font_size || 100) / 100;
            baseFontSize = baseFontSize * fontSizeMultiplier;

            ctx.font = `bold ${Math.round(baseFontSize)}px 'Courier New', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxLineLength = 40;
            const lines: string[] = [];
            thermalText.split('\n').forEach(paragraph => {
              if (paragraph.length <= maxLineLength) {
                lines.push(paragraph);
              } else {
                const words = paragraph.split(' ');
                let currentLine = '';
                words.forEach(word => {
                  if ((currentLine + ' ' + word).length <= maxLineLength) {
                    currentLine += (currentLine ? ' ' : '') + word;
                  } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                  }
                });
                if (currentLine) lines.push(currentLine);
              }
            });

            const lineHeight = baseFontSize * 1.3;
            const totalHeight = lines.length * lineHeight;
            const positionYPercent = (card?.metadata?.thermal_position_y || 50) / 100;
            const startY = (canvas.height * positionYPercent) - (totalHeight / 2) + (lineHeight / 2);
            const centerX = canvas.width / 2;

            lines.forEach((line, index) => {
              const y = startY + (index * lineHeight);
              
              // Simplificado o Blur de sombra para 2 passos em vez de 3. (shadowBlur pesa mt na GPU)
              ctx.shadowBlur = 20;
              ctx.shadowColor = 'rgba(255, 200, 0, 1)';
              ctx.fillStyle = 'rgba(255, 220, 0, 0.8)';
              ctx.fillText(line, centerX, y);

              ctx.shadowBlur = 5;
              ctx.shadowColor = 'rgba(255, 255, 255, 1)';
              ctx.fillStyle = 'rgba(255, 255, 255, 1)';
              ctx.fillText(line, centerX, y);
            });
            ctx.shadowBlur = 0;
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {
        console.error("Erro no processamento termal:", e);
      }
    };
    
    return () => { cancelled = true; };
  }, [localThermal, card]);

  // Lock body scroll while the modal is open and focus the modal for accessibility
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('inspection-modal-open');
      // focus the modal container so screen readers and keyboard users land inside it
      setTimeout(() => { fileRef.current?.focus(); }, 0);
    } else {
      document.body.classList.remove('inspection-modal-open');
    }
    return () => { document.body.classList.remove('inspection-modal-open'); };
  }, [isOpen]);

  const activeCardForPins = serverCard || card;
  const phonePins = React.useMemo(() => {
    if (!activeCardForPins?.id) return [];
    return (pinsByCardId[activeCardForPins.id] || []).filter((p) => p.tool_type === 'phone');
  }, [pinsByCardId, activeCardForPins?.id]);
  const activePhonePinsCount = React.useMemo(
    () => phonePins.filter((p) => !p.is_resolved).length,
    [phonePins]
  );

  if (!isOpen || !(card || serverCard)) return null;

  const currentCard = serverCard || card;

  // Metadata pré-calculado para reuso
  const parsedMetadata = React.useMemo(() => {
    if (!currentCard?.metadata) return {};
    if (typeof currentCard.metadata === 'object') return currentCard.metadata;
    try {
      return JSON.parse(currentCard.metadata);
    } catch {
      return {};
    }
  }, [currentCard?.metadata]);
  const isGlitchPuzzleGlobal = currentCard?.type === 'glitch_puzzle' || parsedMetadata?.type === 'glitch_puzzle' || parsedMetadata?.card_type === 'glitch_puzzle' || Boolean(parsedMetadata?.glitch_puzzle);
  const unifiedMedia = React.useMemo(() => {
    return resolveUnifiedMedia(currentCard, parsedMetadata);
  }, [currentCard, parsedMetadata]);

  // Camada de tratamento: aceita tanto a coluna top-level quanto o metadata
  // legado (image_filter_layer / unified_media.filter_layer_url).
  const filterLayerSrc = React.useMemo(() => {
    return (
      currentCard?.image_filter_layer ||
      parsedMetadata?.image_filter_layer ||
      parsedMetadata?.unified_media?.filter_layer_url ||
      null
    );
  }, [currentCard?.image_filter_layer, parsedMetadata]);

  const filterRevealSettings = React.useMemo(() => {
    const raw = parsedMetadata?.image_filter_reveal;
    if (!raw) return null;
    let parsed: any = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        return null;
      }
    }
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeImageFilterValues(parsed);
  }, [parsedMetadata]);

  const filterLayerTransform = React.useMemo(() => {
    const raw = parsedMetadata?.image_filter_layer_transform;
    if (!raw) return null;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return typeof raw === 'object' ? raw : null;
  }, [parsedMetadata]);

  // Mega-clue metadata (compat: mega_clue or megaClue)
  const megaClueMeta = parsedMetadata?.mega_clue || parsedMetadata?.megaClue || null;

  // Phone keypad configuration (separate from card lock)
  const phoneIsLocked = Boolean(parsedMetadata?.phone_locked);
  const phonePassword = parsedMetadata?.phone_password || null;

  const securityLayer = parsedMetadata?.security_layer || null;
  const securityRevealLogic = securityLayer?.reveal_logic || 'aligned_only';
  const securityAlwaysVisible = securityRevealLogic === 'always_visible';
  const securityLocked = Boolean(securityLayer?.enabled && !isGameMaster && !puzzleSolved && !securityAlwaysVisible);

  const cardLocked = isCardLocked(currentCard);
  const hasRecord = Boolean(currentCard?.metadata && (currentCard.metadata.type === 'person' || currentCard.metadata.person || currentCard.metadata.person_meta));

  const audioSources = React.useMemo(() => {
    const meta = parsedMetadata;
    const src = unifiedMedia.audioUrl || currentCard.audio_url || meta?.audio_url || meta?.audio || meta?.audioUrl || null;
    const hidden = unifiedMedia.audioHiddenUrl || currentCard.audio_hidden_url || meta?.audio_hidden_url || meta?.audio_hidden || null;
    const targetFreq = currentCard.audio_target_freq || meta?.audio_target_freq || meta?.audio_target_freq_hz || 50;
    return { src, hidden, targetFreq };
  }, [currentCard, parsedMetadata, unifiedMedia]);

  React.useEffect(() => {
    const el = audioElementRef.current;
    if (!el) return;

    if (!audioSources.src) {
      el.pause();
      setAudioIsPlaying(false);
      setAudioPosition(0);
      setAudioDuration(0);
      return;
    }

    el.pause();
    setAudioIsPlaying(false);
    setAudioPosition(0);
    setAudioDuration(0);
    setWaveformZoomLevel(1);
    el.src = audioSources.src;
    el.load();
  }, [audioSources.src]);

  React.useEffect(() => {
    if (visualMode !== 'audio') {
      const el = audioElementRef.current;
      if (el) {
        el.pause();
        setAudioIsPlaying(false);
      }
    }
  }, [visualMode]);

  // Waveform mini-visualização
  React.useEffect(() => {
    if (visualMode !== 'audio') {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
      }
      return;
    }

    if (!waveformRef.current || !audioSources.src) return;

    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(45, 212, 191, 0.36)',
      progressColor: '#2dd4bf',
      cursorColor: '#f43f5e',
      cursorWidth: 2,
      height: 88,
      normalize: true,
      interact: true,
      dragToSeek: true,
    });

    waveSurferRef.current = ws;
    ws.load(audioSources.src);

    ws.on('ready', () => {
      const dur = ws.getDuration() || 0;
      setAudioDuration(dur);
      try {
        ws.setPlaybackRate(audioPlaybackRate);
        ws.setVolume(audioVolume);
        ws.setMuted(audioIsMuted);
      } catch { }
    });

    ws.on('timeupdate', (time: number) => {
      setAudioPosition(time || 0);
    });

    ws.on('seeking', (time: number) => {
      setAudioPosition(time || 0);
    });

    ws.on('play', () => {
      setAudioIsPlaying(true);
      window.dispatchEvent(new CustomEvent('ordo:card-audio-state', { detail: { cardId: currentCard?.id, playing: true } }));
    });
    ws.on('pause', () => {
      setAudioIsPlaying(false);
      window.dispatchEvent(new CustomEvent('ordo:card-audio-state', { detail: { cardId: currentCard?.id, playing: false } }));
    });
    ws.on('finish', () => {
      if (audioLoopRef.current) {
        ws.setTime(0);
        ws.play().catch(() => setAudioIsPlaying(false));
        return;
      }
      setAudioIsPlaying(false);
      setAudioPosition(0);
      window.dispatchEvent(new CustomEvent('ordo:card-audio-state', { detail: { cardId: currentCard?.id, playing: false } }));
    });

    return () => {
      ws.destroy();
      waveSurferRef.current = null;
    };
  }, [visualMode, audioSources.src]);

  // Waveform zoom controls
  const setWaveformZoom = (target: number, originPercent = 50) => {
    const clamped = Math.max(1, Math.min(3, Number(target.toFixed(1))));
    setWaveformZoomLevel(clamped);
    const container = waveformRef.current;
    if (!container) return;
    container.style.transformOrigin = `${originPercent}% 50%`;
    container.style.transition = 'transform 220ms ease';
    container.style.transform = `scale(${clamped})`;
    container.dataset.waveformZoom = String(clamped);
  };

  const handleWaveformDblClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = waveformRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const percent = Math.max(0, Math.min(100, (x / Math.max(1, rect.width)) * 100));
    const current = parseFloat(container.dataset.waveformZoom || '1');
    const target = current === 1 ? 1.6 : 1;
    setWaveformZoom(target, percent);
  };

  const handleWaveformZoomIn = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = parseFloat(waveformRef.current?.dataset.waveformZoom || String(waveformZoomLevel) || '1');
    setWaveformZoom(Math.min(3, current + 0.2));
  };

  const handleWaveformZoomOut = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = parseFloat(waveformRef.current?.dataset.waveformZoom || String(waveformZoomLevel) || '1');
    setWaveformZoom(Math.max(1, current - 0.2));
  };


  // Lógica de Zoom Otimizada (Sincroniza UV e Filtros)
  React.useEffect(() => {
    const cleanupResidualControls = () => {
      try {
        fileRef.current?.querySelectorAll('.image-controls').forEach((el) => el.remove());
        document.querySelectorAll('.fullscreen-stage .image-controls').forEach((el) => el.remove());
      } catch { }
    };

    // Só roda se for modo imagem ou vídeo (se quiser zoom em vídeo)
    if (visualMode !== 'image' && visualMode !== 'video') {
      cleanupResidualControls();
      return;
    }

    // Procura o elemento correto dependendo se estamos no Fullscreen ou no Modal normal
    const context = fullscreenOpen ? document.body : fileRef.current;
    if (!context) return;

    // O alvo é o WRAPPER que segura a imagem base e a camada UV
    // Procuramos classes comuns de containers de imagem misteriosa
    const container = context.querySelector('.evidence-display-area, .fullscreen-stage') as HTMLElement | null;
    if (!container) return;

    // O elemento que será transformado (Escalado/Movido)
    // Tenta achar o container interno do MysteryImage (.uv-container ou .large-evidence-img)
    // Se não achar, usa o próprio container.
    const transformTarget = (container.querySelector('.image-zoom-wrapper, .uv-container, .large-evidence-img') as HTMLElement | null) ||
      (container.querySelector('img') as HTMLElement | null);

    if (!transformTarget) return;

    // Prepara o elemento para aceleração de hardware.
    // Nota: ativamos o modo de performance apenas durante o arraste (will-change = 'transform').
    // Aqui deixamos em 'auto' para que o navegador redesenhe em alta qualidade quando não estiver arrastando.
    transformTarget.style.willChange = 'auto';
    transformTarget.style.transformOrigin = 'center center';

    // Adiciona controles visuais se não existirem
    if (!container.querySelector('.image-controls')) {
      const controls = document.createElement('div');
      controls.className = 'image-controls';
      controls.innerHTML = '<button type="button" class="img-zoom-btn" title="Aumentar zoom" aria-label="Aumentar zoom">+</button><span class="image-zoom-badge zoom-level-badge">100%</span><button type="button" class="img-zoom-btn" title="Diminuir zoom" aria-label="Diminuir zoom">−</button><button type="button" class="img-zoom-btn btn-zoom-reset" title="Recentralizar zoom" aria-label="Recentralizar zoom">↺</button>';
      container.appendChild(controls);
    }

    // Estado local do Zoom (Mutable para performance)
    let state = {
      scale: 1,
      panning: false,
      pointX: 0,
      pointY: 0,
      startX: 0,
      startY: 0
    };

    const updateTransform = (animate = false) => {
      if (animate && !effectivePerformanceMode) {
        transformTarget.style.transition = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)';
      } else {
        transformTarget.style.transition = 'none';
      }
      transformTarget.style.width = '100%';
      transformTarget.style.height = '100%';
      transformTarget.style.transform = `translate3d(${state.pointX}px, ${state.pointY}px, 0) scale(${state.scale})`;
      transformTarget.style.cursor = state.scale > 1 ? (state.panning ? 'grabbing' : 'grab') : 'default';
      const badge = container.querySelector('.image-zoom-badge');
      if (badge) badge.textContent = `${Math.round(state.scale * 100)}%`;
    };

    // --- HANDLERS DE MOUSE/TOUCH ---

    const onMouseDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.image-controls, .img-zoom-btn')) return;
      if ('button' in e && e.button !== 0) return;
      if (e.cancelable) e.preventDefault();
      try { window.getSelection()?.removeAllRanges(); } catch {}
      if (state.scale <= 1) return; // Só arrasta se tiver zoom
      state.panning = true;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      state.startX = clientX - state.pointX;
      state.startY = clientY - state.pointY;

      // ATIVA modo performance durante o movimento
      try {
        transformTarget.style.willChange = 'transform';
      } catch (err) { }

      updateTransform();
    };

    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!state.panning) return;
      if (e.cancelable) e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      state.pointX = clientX - state.startX;
      state.pointY = clientY - state.startY;

      updateTransform();
    };

    const onMouseUp = () => {
      state.panning = false;
      // DESATIVA modo performance para forçar redesenho em alta qualidade
      try { transformTarget.style.willChange = 'auto'; } catch (err) { }
      updateTransform();
    };

    // Zoom via Botões ou Roda do Mouse
    const zoom = (delta: number, clientX?: number, clientY?: number) => {
      const oldScale = state.scale;
      const newScale = Math.max(1, Math.min(10, state.scale + delta));

      if (newScale === 1) {
        state.scale = 1;
        state.pointX = 0;
        state.pointY = 0;
      } else {
        const rect = container.getBoundingClientRect();
        let cx, cy;
        if (clientX !== undefined && clientY !== undefined) {
          cx = clientX - rect.left;
          cy = clientY - rect.top;
        } else {
          cx = rect.width / 2;
          cy = rect.height / 2;
        }

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const mouseOffsetX = cx - centerX;
        const mouseOffsetY = cy - centerY;

        state.pointX -= (mouseOffsetX - state.pointX) * (newScale - oldScale) / oldScale;
        state.pointY -= (mouseOffsetY - state.pointY) * (newScale - oldScale) / oldScale;
        state.scale = newScale;
      }
      updateTransform();
    };

    // Listeners
    const btns = container.querySelectorAll('.img-zoom-btn');
    const btnIn = btns[0];
    const btnOut = btns[1];
    const btnReset = btns[2];

    const handleIn = (e: Event) => { e.stopPropagation(); zoom(0.5); };
    const handleOut = (e: Event) => { e.stopPropagation(); zoom(-0.5); };
    const handleReset = (e: Event) => {
      e.stopPropagation();
      state.scale = 1;
      state.pointX = 0;
      state.pointY = 0;
      transformTarget.style.transformOrigin = 'center center';
      updateTransform(true);
    };

    if (btnIn) btnIn.addEventListener('click', handleIn);
    if (btnOut) btnOut.addEventListener('click', handleOut);
    if (btnReset) btnReset.addEventListener('click', handleReset);

    // Adiciona eventos ao container (para pegar o click em qualquer lugar)
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);

    // Touch events (Mobile)
    container.addEventListener('touchstart', onMouseDown, { passive: false });
    container.addEventListener('touchmove', onMouseMove, { passive: false });
    container.addEventListener('touchend', onMouseUp);

    // Wheel Zoom (Mouse)
    const onWheel = (e: WheelEvent) => {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch (err) { }
      const rawDy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;
      const dy = Math.max(-120, Math.min(120, rawDy));
      if (dy === 0) return;
      const targetScale = Math.max(1, Math.min(10, state.scale * Math.exp(-dy * 0.0022)));
      zoom(targetScale - state.scale, e.clientX, e.clientY);
    };
    container.addEventListener('wheel', onWheel, { passive: false });

    // Double Tap / Double Click Toggle: Fit (100%) <-> Zoom 200% centrado no ponto clicado/tocado
    const onDblClick = (clientX: number, clientY: number) => {
      if (state.scale > 1) {
        state.scale = 1;
        state.pointX = 0;
        state.pointY = 0;
        transformTarget.style.transformOrigin = 'center center';
        updateTransform(true);
      } else {
        const containerRect = container.getBoundingClientRect();
        const targetRect = transformTarget.getBoundingClientRect();
        const originXPct = targetRect.width > 0
          ? Math.max(0, Math.min(100, ((clientX - targetRect.left) / targetRect.width) * 100))
          : 50;
        const originYPct = targetRect.height > 0
          ? Math.max(0, Math.min(100, ((clientY - targetRect.top) / targetRect.height) * 100))
          : 50;
        transformTarget.style.transformOrigin = `${originXPct.toFixed(1)}% ${originYPct.toFixed(1)}%`;

        const cx = clientX - containerRect.left;
        const cy = clientY - containerRect.top;
        const mouseOffsetX = cx - containerRect.width / 2;
        const mouseOffsetY = cy - containerRect.height / 2;

        state.scale = 2;
        state.pointX = -mouseOffsetX;
        state.pointY = -mouseOffsetY;
        updateTransform(true);
      }
    };
    const onDblClickWrapper = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.image-controls, .img-zoom-btn')) return;
      if (e.cancelable) e.preventDefault();
      try { window.getSelection()?.removeAllRanges(); } catch {}
      onDblClick(e.clientX, e.clientY);
    };
    container.addEventListener('dblclick', onDblClickWrapper);

    let lastTap = 0;
    const onTouchStartDouble = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('.image-controls, .img-zoom-btn')) return;
      const currentTime = Date.now();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        if (e.cancelable) e.preventDefault();
        try { window.getSelection()?.removeAllRanges(); } catch {}
        onDblClick(e.touches[0].clientX, e.touches[0].clientY);
        lastTap = 0;
        return;
      }
      lastTap = currentTime;
    };
    container.addEventListener('touchstart', onTouchStartDouble, { passive: false });

    return () => {
      if (btnIn) btnIn.removeEventListener('click', handleIn);
      if (btnOut) btnOut.removeEventListener('click', handleOut);
      if (btnReset) btnReset.removeEventListener('click', handleReset);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
      container.removeEventListener('touchstart', onMouseDown);
      container.removeEventListener('touchmove', onMouseMove);
      container.removeEventListener('touchend', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('dblclick', onDblClickWrapper);
      container.removeEventListener('touchstart', onTouchStartDouble);

      // Remove injected zoom controls so they never leak into PhoneViewer or other tabs
      try {
        container.querySelectorAll('.image-controls').forEach((el) => el.remove());
      } catch (err) { }

      // Cleanup transform and reset will-change so browser may re-render in full quality
      try { transformTarget.style.willChange = 'auto'; } catch (err) { }
      transformTarget.style.transform = '';
      transformTarget.style.transformOrigin = 'center center';
      transformTarget.style.transition = '';
      transformTarget.style.width = '100%';
      transformTarget.style.height = '100%';
    };
  }, [visualMode, fullscreenOpen, currentCard, localUV, localThermal, forensicChannel, effectivePerformanceMode]);

  const handleOpenAudioExpander = () => {
    if (audioExpanderLockRef.current) {
      console.warn('[InspectionModal] Clique bloqueado - já em processamento');
      return;
    }

    audioExpanderLockRef.current = true;
    const meta = parsedMetadata;
    const audioSrc = unifiedMedia.audioUrl || currentCard.audio_url || meta?.audio_url || meta?.audio || meta?.audioUrl || null;
    console.log('[InspectionModal] Audio expand - audioSrc:', audioSrc);

    if (audioSrc) {
      if (waveSurferRef.current && audioIsPlaying) {
        try { waveSurferRef.current.pause(); } catch { }
      }
      if (audioElementRef.current && !audioElementRef.current.paused) {
        try { audioElementRef.current.pause(); } catch { }
      }
      setExpanderAudioSrc(String(audioSrc));

      setTimeout(() => {
        if (isMounted.current) setAudioExpanderOpen(true);
        console.log('[InspectionModal] Audio modal opened');
        audioExpanderLockRef.current = false;
      }, 50);
    } else {
      console.warn('[InspectionModal] No audio source found');
      audioExpanderLockRef.current = false;
    }
  };

  // Renderizador inteligente da Área Visual
  const renderVisualContent = () => {
    // Metadata seguro para detectar subtipos (ex: glitch_puzzle)
    const metadataObj = parsedMetadata;
    const isGlitchPuzzle = isGlitchPuzzleGlobal;

    // <Search className="lucide-icon inline-icon" size={16} /> DEBUG: Log completo da evidência para diagnóstico
    console.log('🔍 [InspectionModal] Card Debug:', {
      id: currentCard.id,
      title: currentCard.title,
      is_shredded: currentCard.is_shredded,
      type: currentCard.type,
      metadata: metadataObj,
      shred_rows: metadataObj?.shred_rows,
      shred_cols: metadataObj?.shred_cols,
      all_keys: Object.keys(currentCard)
    });

    if (visualMode === 'phone') {
      return (
        <PhoneViewer
          chatData={headerChatList}
          contactName={currentCard.title}
          isLocked={phoneIsLocked}
          password={phonePassword}
          passwordType={parsedMetadata?.phone_lock_type || (typeof phonePassword === 'string' && phonePassword.includes('-') ? 'pattern' : 'pin')}
          deviceData={parsedMetadata?.device_extraction || null}
          cardId={currentCard.id}
          hideInlinePinList={true}
          showPins={showPhonePins}
          onToggleShowPins={() => setShowPhonePins((s) => !s)}
        />
      );
    }

    if (parsedMetadata?.physical_document) {
      return (
        <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: 12 }}>
          <PhysicalDocumentTable
            documentData={parsedMetadata.physical_document}
            title={currentCard.title}
            cardId={currentCard.id}
          />
        </div>
      );
    }

    // If shredded, show puzzle
    // <Search className="lucide-icon inline-icon" size={16} /> Verificação robusta de is_shredded (aceita boolean, number, string)
    // 🔥 FALLBACK: Se não existir a coluna is_shredded, usa metadata.is_shredded
    const isShredded = Boolean(
      currentCard.is_shredded === true ||
      currentCard.is_shredded === 1 ||
      currentCard.is_shredded === '1' ||
      currentCard.is_shredded === 'true' ||
      metadataObj?.is_shredded === true ||
      // 🔥 Se tem shred_rows/cols no metadata, assume que é triturado
      (metadataObj?.shred_rows && metadataObj?.shred_cols)
    );

    console.log('🧩 [Shredder] Check:', {
      raw_value: currentCard.is_shredded,
      type: typeof currentCard.is_shredded,
      metadata_is_shredded: metadataObj?.is_shredded,
      has_shred_config: !!(metadataObj?.shred_rows && metadataObj?.shred_cols),
      isShredded,
      rows: metadataObj?.shred_rows || 1,
      cols: metadataObj?.shred_cols || 8
    });

    // Se o puzzle foi resolvido, mostra a imagem normal
    if (isShredded && !puzzleSolved) {
      console.log('%c🧩 SHREDDER PUZZLE ATIVADO!', 'background: #4a4; color: #fff; font-size: 14px; padding: 8px; border-radius: 4px;');
      console.log(`📐 Configuração: ${parsedMetadata?.shred_rows || 1}x${parsedMetadata?.shred_cols || 8} = ${(parsedMetadata?.shred_rows || 1) * (parsedMetadata?.shred_cols || 8)} peças`);
      console.log(`🎮 isGameMaster: ${isGameMaster}`);
      console.log(`🖼️ imgSrc: ${unifiedMedia.imageUrl || currentCard.image_url}`);

      return (
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          gap: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: 'linear-gradient(160deg, rgba(0, 243, 255, 0.08), rgba(0, 243, 255, 0.02))',
            border: '1px solid rgba(0, 243, 255, 0.25)',
            borderRadius: '12px',
            maxWidth: '500px'
          }}>
            <div style={{ marginBottom: '12px', color: '#00f3ff', display: 'flex', justifyContent: 'center' }}><Layers size={44} /></div>
            <h3 style={{
              margin: '0 0 8px',
              color: '#e9fcff',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>DOCUMENTO TRITURADO DETECTADO</h3>
            <p style={{
              margin: '0 0 16px',
              color: '#9fc7d0',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              Este documento foi fragmentado em <strong style={{ color: '#aef6ff' }}>{(parsedMetadata?.shred_rows || 1) * (parsedMetadata?.shred_cols || 8)} peças</strong>.<br />
              Configure: <strong style={{ color: '#aef6ff' }}>{parsedMetadata?.shred_rows || 1}×{parsedMetadata?.shred_cols || 8}</strong> {parsedMetadata?.shred_rows === 1 ? 'tiras horizontais' : parsedMetadata?.shred_cols === 1 ? 'tiras verticais' : 'grade'}
            </p>
            {isGameMaster && (
              <div style={{
                padding: '12px',
                background: 'rgba(100, 150, 255, 0.12)',
                border: '1px solid rgba(100, 150, 255, 0.3)',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#aaf'
              }}>
                <Gamepad2 className="lucide-icon inline-icon" size={16} /> <strong>MODO GM ATIVO</strong><br />
                Você terá controle total sobre as peças reveladas
              </div>
            )}
            <button
              onClick={() => setShredderModalOpen(true)}
              className="btn-reconstructor"
            >
              <Puzzle className="lucide-icon inline-icon" size={16} /> ABRIR RECONSTRUTOR
            </button>
          </div>
        </div>
      );
    }

    // visualMode === 'image'
    if (visualMode === 'video' && (unifiedMedia.videoUrl || currentCard.video_url)) {
      // Handlers to replace/remove video attached to this card
      const handleReplaceVideo = async (file: File) => {
        try {
          if (!currentCard || !currentCard.investigation_id) return alert('Investigation id ausente');
          setVideoUploadingInspection(true);
          const ext = file.name.split('.').pop() || 'mp4';
          const publicUrl = await uploadInvestigationFile(file, currentCard.investigation_id, ext);
          if (!publicUrl) throw new Error('Falha ao enviar vídeo');
          const updated = await updateInvestigationCard(currentCard.id, { video_url: publicUrl });
          if (isMounted.current) setServerCard(updated);
        } catch (err) {
          console.error('Erro substituindo vídeo', err);
          alert('Falha ao substituir vídeo');
        } finally {
          setVideoUploadingInspection(false);
        }
      };

      const handleRemoveVideo = async () => {
        try {
          if (!currentCard) return;
          if (!confirm('Remover vídeo anexado deste cartão?')) return;
          setVideoUploadingInspection(true);
          const updated = await updateInvestigationCard(currentCard.id, { video_url: null });
          if (isMounted.current) setServerCard(updated);
        } catch (err) {
          console.error('Erro removendo vídeo', err);
          alert('Falha ao remover vídeo');
        } finally {
          setVideoUploadingInspection(false);
        }
      };

      const videoSrc = unifiedMedia.videoUrl || currentCard.video_url;
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          <CCTVPlayer
            src={videoSrc || ''}
            cameraName={parsedMetadata?.cctv_camera_name || currentCard.title || 'CAM-04 [SETOR C]'}
            thermalSecretText={parsedMetadata?.thermal_secret_text}
            cardId={currentCard.id}
            allowManage={isGameMaster}
            onReplace={handleReplaceVideo}
            onRemove={handleRemoveVideo}
          />
        </div>
      );
    }

    // audio visual mode (Console Acústico C.R.I.S.)
    if (visualMode === 'audio') {
      const audioSrc = audioSources.src;

      if (!audioSrc) {
        return (
          <div className="im-audio-empty">
            Nenhum arquivo de áudio encontrado para esta evidência.
          </div>
        );
      }

      const formatTime = (seconds: number) => {
        if (!Number.isFinite(seconds)) return '00:00';
        const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
        const ss = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mm}:${ss}`;
      };

      const handleTogglePlay = () => {
        void unlockAudio();
        if (waveSurferRef.current) {
          waveSurferRef.current.playPause();
          return;
        }
        const el = audioElementRef.current;
        if (!el) return;
        if (audioIsPlaying) {
          el.pause();
          setAudioIsPlaying(false);
        } else {
          el.play().then(() => setAudioIsPlaying(true)).catch(err => console.warn('Audio play failed', err));
        }
      };

      const handleSeek = (value: number) => {
        if (waveSurferRef.current && (audioDuration || 0) > 0) {
          const ratio = Math.min(Math.max(value / (audioDuration || 1), 0), 1);
          waveSurferRef.current.seekTo(ratio);
          setAudioPosition(value);
          return;
        }
        const el = audioElementRef.current;
        if (!el) return;
        el.currentTime = value;
        setAudioPosition(value);
      };

      const handleSkip = (deltaSeconds: number) => {
        const dur = audioDuration || waveSurferRef.current?.getDuration?.() || audioElementRef.current?.duration || 0;
        const curr = waveSurferRef.current
          ? (waveSurferRef.current.getCurrentTime?.() ?? audioPosition)
          : (audioElementRef.current?.currentTime ?? audioPosition);
        const next = Math.max(0, Math.min(dur || 0, curr + deltaSeconds));
        if (waveSurferRef.current) {
          waveSurferRef.current.setTime(next);
          setAudioPosition(next);
          return;
        }
        const el = audioElementRef.current;
        if (!el) return;
        el.currentTime = next;
        setAudioPosition(next);
      };

      const handleVolumeChange = (nextVol: number) => {
        const clamped = Math.max(0, Math.min(1, nextVol));
        setAudioVolume(clamped);
        if (clamped > 0 && audioIsMuted) {
          setAudioIsMuted(false);
          if (audioElementRef.current) audioElementRef.current.muted = false;
          if (waveSurferRef.current) waveSurferRef.current.setMuted(false);
        }
      };

      const rawFileName = (() => {
        try {
          const clean = String(audioSrc).split('?')[0];
          const seg = clean.split('/').pop();
          return seg ? decodeURIComponent(seg) : 'AUDIO_EVIDENCE.wav';
        } catch {
          return 'AUDIO_EVIDENCE.wav';
        }
      })();
      const displayAudioName = currentCard?.title || rawFileName;
      const progressPercent = audioDuration > 0 ? Math.min(100, Math.max(0, (audioPosition / audioDuration) * 100)) : 0;

      return (
        <div className="im-audio-deck">
          <audio
            ref={audioElementRef}
            src={audioSrc || undefined}
            preload="metadata"
            style={{ display: 'none' }}
            onPlay={() => window.dispatchEvent(new CustomEvent('ordo:card-audio-state', { detail: { cardId: currentCard.id, playing: true } }))}
            onPause={() => window.dispatchEvent(new CustomEvent('ordo:card-audio-state', { detail: { cardId: currentCard.id, playing: false } }))}
            onEnded={() => {
              setAudioIsPlaying(false);
              window.dispatchEvent(new CustomEvent('ordo:card-audio-state', { detail: { cardId: currentCard.id, playing: false } }));
            }}
            onTimeUpdate={(e) => setAudioPosition((e.target as HTMLAudioElement).currentTime || 0)}
            onLoadedMetadata={(e) => setAudioDuration((e.target as HTMLAudioElement).duration || 0)}
          />

          {/* Topo do Deck: Barra de Telemetria */}
          <div className="im-audio-telemetry">
            <div className="im-audio-telemetry-left">
              <span className={`im-audio-status-pill ${audioIsPlaying ? 'playing' : ''}`}>
                <span className={`im-audio-led ${audioIsPlaying ? 'im-audio-led--playing' : ''}`} aria-hidden="true" />
                {audioIsPlaying ? 'REPRODUZINDO' : 'STANDBY'}
              </span>
              <span className="im-audio-filename" title={displayAudioName}>
                {displayAudioName}
              </span>
              <a
                href={audioSrc}
                target="_blank"
                rel="noreferrer"
                className="im-audio-download"
                title="Baixar arquivo de áudio"
              >
                <Download size={12} />
                <span>baixar</span>
              </a>
            </div>

            <div className="im-audio-zoom-toolbar" aria-label="Zoom da forma de onda">
              <button
                type="button"
                aria-label="Zoom out"
                className="im-audio-zoom-btn"
                onClick={handleWaveformZoomOut}
                disabled={waveformZoomLevel <= 1}
                title="Reduzir zoom da onda"
              >
                −
              </button>
              <button
                type="button"
                className="im-audio-zoom-readout"
                onClick={() => setWaveformZoom(1, 50)}
                title="Redefinir zoom para 1x"
              >
                {waveformZoomLevel.toFixed(1).replace(/\.0$/, '')}x
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                className="im-audio-zoom-btn"
                onClick={handleWaveformZoomIn}
                disabled={waveformZoomLevel >= 3}
                title="Aumentar zoom da onda"
              >
                +
              </button>
            </div>
          </div>

          {/* Visor da Waveform (Osciloscópio) */}
          <div className="im-audio-scope">
            <div className="im-audio-scope-grid" aria-hidden="true" />
            <div className="im-audio-scope-axis" aria-hidden="true" />
            <div
              ref={waveformRef}
              onDoubleClick={handleWaveformDblClick}
              className="waveform-zoomable im-audio-waveform"
            />
          </div>

          {/* Barra de Transporte Customizada */}
          <div className="im-audio-transport">
            <div className="im-audio-progress-wrap">
              <div className="im-audio-progress-track">
                <div className="im-audio-progress-fill" style={{ width: `${progressPercent}%` }} />
                <div className="im-audio-progress-thumb" style={{ left: `${progressPercent}%` }} />
              </div>
              <input
                type="range"
                min={0}
                max={audioDuration || 0}
                step={0.05}
                value={Math.min(audioPosition, audioDuration || 0)}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="im-audio-range-input"
                aria-label="Linha do tempo do áudio"
              />
            </div>

            <div className="im-audio-controls-row">
              <div className="im-audio-controls-left">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`im-audio-play-btn ${audioIsPlaying ? 'playing' : ''}`}
                >
                  {audioIsPlaying ? <><Pause size={15} /> Pausar</> : <><Play size={15} /> Reproduzir</>}
                </button>

                <div className="im-audio-step-group">
                  <button
                    type="button"
                    onClick={() => handleSkip(-5)}
                    className="im-audio-step-btn"
                    title="Voltar 5 segundos"
                    aria-label="Voltar 5 segundos"
                  >
                    <RotateCcw size={13} />
                    <span>5s</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSkip(5)}
                    className="im-audio-step-btn"
                    title="Avançar 5 segundos"
                    aria-label="Avançar 5 segundos"
                  >
                    <span>5s</span>
                    <RotateCw size={13} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setAudioLoop((prev) => !prev)}
                  className={`im-audio-icon-btn ${audioLoop ? 'active' : ''}`}
                  title={audioLoop ? 'Desativar repetição em loop' : 'Ativar repetição em loop'}
                  aria-label="Alternar repetição em loop"
                  aria-pressed={audioLoop}
                >
                  <Repeat size={14} />
                </button>

                <div className="im-audio-speed-group" role="group" aria-label="Velocidade de reprodução">
                  {([0.5, 1, 1.5] as const).map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setAudioPlaybackRate(rate)}
                      className={`im-audio-speed-btn ${audioPlaybackRate === rate ? 'active' : ''}`}
                      title={`Velocidade ${rate}x`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="im-audio-controls-right">
                <div className="im-audio-volume-wrap">
                  <button
                    type="button"
                    onClick={handleToggleAudioMute}
                    className={`im-audio-icon-btn ${audioIsMuted ? 'muted' : ''}`}
                    title={audioIsMuted ? 'Desmutar som' : 'Mutar som'}
                    aria-label={audioIsMuted ? 'Desmutar som' : 'Mutar som'}
                  >
                    {audioIsMuted || audioVolume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={audioIsMuted ? 0 : audioVolume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="im-audio-volume-slider"
                    aria-label="Volume do áudio"
                  />
                </div>

                <div className="im-audio-timecode" aria-label="Tempo do áudio">
                  <span>{formatTime(audioPosition)}</span>
                  <span className="im-audio-timecode-sep">/</span>
                  <span>{formatTime(audioDuration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé do Deck */}
          <div className="im-audio-footer">
            <span className="im-audio-engine-tag">
              <Activity size={13} />
              MÓDULO DE ESCUTA RÁPIDA • C.R.I.S. AUDIO ENGINE
            </span>
            <button
              type="button"
              onClick={handleOpenAudioExpander}
              className="im-audio-cta-btn"
            >
              <Music size={14} />
              Abrir Console Avançado &amp; Espectrograma
            </button>
          </div>
        </div>
      );
    }

    // INTERCEPTAR GLITCH PUZZLE - antes de renderizar imagem normal
    if (unifiedMedia.imageUrl || currentCard.image_url) {
      const baseImage = unifiedMedia.imageUrl || currentCard.image_url || null;

      const renderSecurityLocked = () => {
        return (
          <div className={`evidence-display-area ${localThermal ? 'termal-mode' : ''}`}>
            <div className="grid-overlay" aria-hidden />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, color: '#d5d5d5', textAlign: 'center', height: '100%' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 640, aspectRatio: '16/9', border: '1px dashed rgba(255,255,255,0.08)', overflow: 'hidden', borderRadius: 8, background: '#050505' }}>
                {baseImage ? (
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${baseImage})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', filter: 'blur(14px) brightness(0.5)', transform: 'scale(1.02)' }} aria-hidden />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777', fontSize: 13 }}>Pré-visualização mascarada</div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,255,255,0.06), rgba(255,0,150,0.08))' }} aria-hidden />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>CAMADA CRIPTOGRAFADA</div>
                  <div style={{ fontSize: 13, maxWidth: 400, color: '#c8f7ff' }}>
                    Resolva o painel de sincronização antes de revelar a imagem limpa.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#9ac4ff' }}>Lógica: {securityRevealLogic === 'aligned_keyword' ? 'Alinhar sinal + validar assinatura' : securityRevealLogic === 'always_visible' ? 'Sempre visível' : 'Alinhar sinal'}</span>
                {securityLayer?.require_keyword && (
                  <span style={{ fontSize: 12, color: '#ffc78b' }}>Assinatura digital exigida</span>
                )}
                <button
                  className="btn-tool-tab"
                  onClick={() => {
                    // At click time we may or may not have a glitch config available.
                    // If none, surface a useful message instead of doing nothing.
                    if (!glitchSolverConfig) {
                      console.error('[InspectionModal] Glitch puzzle sem configuração válida. Card:', {
                        id: currentCard?.id,
                        type: currentCard?.type,
                        hasMetadata: !!currentCard?.metadata,
                        metadataGlitchPuzzle: !!parsedMetadata?.glitch_puzzle
                      });
                      alert('❌ Este quebra-cabeça não tem configuração válida.\n\nVerifique:\n• Se a pista foi criada como "Quebra-cabeça de Glitch"\n• Se a imagem foi enviada corretamente\n• Se os metadados foram salvos');
                      return;
                    }
                    console.log('[InspectionModal] Abrindo GlitchPuzzleSolver com config:', glitchSolverConfig);
                    setShowGlitchSolver(true);
                  }}
                  style={{ marginTop: 6 }}
                >
                  <Puzzle className="lucide-icon inline-icon" size={15} /> ABRIR DECODIFICADOR
                </button>
              </div>
            </div>
          </div>
        );
      };

      if (securityLocked) return renderSecurityLocked();
      return (
        <div
          className={`evidence-display-area ${localThermal ? 'termal-mode' : ''}`}
          onPointerDown={handleEvidencePointerMove}
          onPointerMove={handleEvidencePointerMove}
          onTouchStart={handleEvidenceTouchMove}
          onTouchMove={handleEvidenceTouchMove}
          style={{ touchAction: 'none' }}
        >
          <div className="grid-overlay" aria-hidden />

          {(() => {
            // safe-parse metadata.image_filter_reveal which may be stored as object or JSON string
            let reveal: any = null;
            try {
              const m = currentCard.metadata && typeof currentCard.metadata === 'object'
                ? currentCard.metadata
                : (typeof currentCard.metadata === 'string' ? JSON.parse(currentCard.metadata) : {});
              reveal = m?.image_filter_reveal ?? null;
            } catch (e) { reveal = null; }
            return (
              <>
                <div className="image-zoom-viewport">
                  <div className="image-zoom-wrapper" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MysteryImage
                      baseSrc={unifiedMedia.imageUrl || currentCard.image_url}
                      hiddenSrc={currentCard.image_uv_url}
                      filterLayerSrc={filterLayerSrc}
                      filterLayerTransform={filterLayerTransform}
                      filters={{ brightness: filters.brightness, contrast: filters.contrast, saturate: filters.saturation }}
                      revealSettings={fullscreenOnlyTreatment ? null : (filterRevealSettings || reveal)}
                      isUVMode={localUV}
                      fit="contain"
                      className="large-evidence-img"
                      style={{ height: '100%', width: '100%' }}
                      forensicChannel={forensicChannel}
                      allowImageUVControl={false}
                    />
                    {localThermal && !fullscreenOpen && (
                      <div className="thermal-overlay" aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
                        <canvas className="thermal-canvas" ref={thermalCanvasRef} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}

          <div className="ui-corners" aria-hidden />

          {localThermal && (
            <div className="thermal-scale" aria-hidden="true">
              <span className="temp-high">42°C</span>
              <div className="gradient-bar"></div>
              <span className="temp-low">12°C</span>
            </div>
          )}
        </div>
      );
    }

    // Fallback: if no image but have chat, show phone
    if (headerChatList && headerChatList.length > 0) {
      return (
        <PhoneViewer
          chatData={headerChatList}
          contactName={currentCard.title}
          isLocked={phoneIsLocked}
          password={phonePassword}
          passwordType={parsedMetadata?.phone_lock_type || (typeof phonePassword === 'string' && phonePassword.includes('-') ? 'pattern' : 'pin')}
          deviceData={parsedMetadata?.device_extraction || null}
          cardId={currentCard.id}
          hideInlinePinList={true}
          showPins={showPhonePins}
          onToggleShowPins={() => setShowPhonePins((s) => !s)}
        />
      );
    }

    // Nothing to show
    return <div style={{ color: '#888', padding: 20 }}>Nenhuma mídia disponível.</div>;
  };

  // If modal is open but card is missing, show a helpful placeholder to aid debugging
  if (!card) {
    const placeholder = (
      <div className="inspect-backdrop" onClick={onClose}>
        <div className="inspect-file" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="inspect-header">
            <div className="meta-info"><span className="case-stamp">EVIDÊNCIA — N/D</span></div>
            <div className="actions"><button className="btn-close-modal btn-close" onClick={onClose} aria-label="Fechar modal" title="Fechar modal"><X size={18} /></button></div>
          </div>
          <div style={{ padding: 20, color: '#ccc' }}>
            <h3>Sem dados do cartão</h3>
            <p>O modal foi aberto, mas o objeto <strong>card</strong> está ausente ou indefinido.</p>
            <p>Verifique o fluxo que chama <strong>InspectionModal</strong> e confirme que está passando um objeto válido.</p>
          </div>
        </div>
      </div>
    );
    // modal opened without card — silently return placeholder
    return createPortal(placeholder, document.body);
  }

  // Pre-parse metadata and chat so header can show a toggle when both image+chat exist
  const headerChatList = React.useMemo(() => {
    const rawChat = currentCard?.chat_data ?? parsedMetadata?.chat_data ?? parsedMetadata?.chat ?? null;
    if (!rawChat) return null;
    
    let parsed = rawChat;
    if (typeof rawChat === 'string') {
      try { parsed = JSON.parse(rawChat); } catch { return null; }
    }
    
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.messages)) return parsed.messages;
      if (Array.isArray(parsed.chat)) return parsed.chat;
      if (Array.isArray(parsed.data)) return parsed.data;
      for (const k of Object.keys(parsed)) {
        if (Array.isArray(parsed[k])) return parsed[k];
      }
    }
    return null;
  }, [currentCard?.chat_data, parsedMetadata]);

  // Robust check for presence of chat content in various shapes
  const hasChatContent = (c: any) => {
    try {
      const raw = c?.chat_data ?? c?.metadata?.chat_data ?? c?.metadata?.chat ?? c?.chat ?? null;
      if (!raw) return false;
      if (Array.isArray(raw)) return raw.length > 0;
      if (typeof raw === 'string') {
        // try parse JSON
        try {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) return p.length > 0;
          if (p && typeof p === 'object') return Object.keys(p).length > 0;
          return String(raw).trim().length > 0;
        } catch {
          return String(raw).trim().length > 0;
        }
      }
      if (typeof raw === 'object') return Object.keys(raw).length > 0;
      return Boolean(raw);
    } catch (e) {
      return false;
    }
  };
  const effectiveHasChat = hasChatContent(currentCard);

  // Auto-switch visual mode when image/chat availability changes
  React.useEffect(() => {
    const hasValidImage = currentCard?.image_url || unifiedMedia?.imageUrl;
    
    // if currently showing image but image was removed and chat exists, switch to phone
    if (visualMode === 'image' && !hasValidImage && effectiveHasChat) {
      setVisualMode('phone');
    }
    // if currently showing phone but there's no chat data, and an image exists, switch to image
    if (visualMode === 'phone' && !effectiveHasChat && hasValidImage) {
      setVisualMode('image');
    }
    // only run when these change
  }, [visualMode, currentCard?.image_url, unifiedMedia?.imageUrl, effectiveHasChat]);

  // Listen for mobile "inspection:select-tool" events dispatched by the BottomNavigationBar
  React.useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as any;
        const tool = detail?.tool;
        const action = detail?.action as string | undefined;
        if (!tool) return;

        // Support press-and-hold actions for tools (action: 'start' | 'end')
        if (tool === 'uv' && action) {
          if (action === 'start') {
            setLocalUV(true);
            return;
          }
          if (action === 'end') {
            setLocalUV(false);
            return;
          }
        }

        switch (tool) {
          case 'image':
          case 'video':
          case 'audio':
          case 'phone':
            setVisualMode(tool as any);
            break;
          case 'filters':
            disableAllBut('filters');
            break;
          case 'forense':
            disableAllBut('forense');
            break;
          case 'hex':
            disableAllBut('hex');
            break;
          case 'decoder':
            disableAllBut('decoder');
            break;
          case 'lens':
            disableAllBut('lens');
            break;
          case 'thermal':
            setLocalThermal((v: boolean) => !v);
            break;
          case 'uv':
            setLocalUV((v: boolean) => !v);
            break;
          case 'glitch':
            setShowGlitchSolver(true);
            break;
          case 'expand':
            setFullscreenOpen(true);
            break;
          default:
            break;
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('inspection:select-tool', handler as EventListener);
    return () => window.removeEventListener('inspection:select-tool', handler as EventListener);
  }, [setVisualMode, disableAllBut, setLocalThermal, setLocalUV, setShowGlitchSolver, setFullscreenOpen]);

  // derive contact name for header/meta display (prefer explicit column, then metadata, then chat payload)
  const contactNameFromPayload = currentCard.chat_contact_name ?? parsedMetadata?.chat_contact_name ?? null;
  let contactNameInferred: string | null = contactNameFromPayload;
  if (!contactNameInferred && headerChatList && headerChatList.length > 0) {
    const first = headerChatList[0];
    contactNameInferred = first?.contact || first?.name || first?.sender || null;
  }

  // Media availability helpers for dropdown menu
  const hasImage = !!currentCard.image_url;
  const hasVideo = !!currentCard.video_url || !!unifiedMedia.videoUrl;
  const hasAudio = !!audioSources.src;
  const hasChat = !!headerChatList?.length;
  const mediaCount = [hasImage, hasVideo, hasAudio, hasChat].filter(Boolean).length;

  const renderPhoneAnchorSummary = (pin: CasePin) => {
    const a = pin.anchor_data as PhonePinAnchor;
    const appNames: Record<string, string> = {
      messages: 'Msg',
      gallery: 'Foto',
      notes: 'Nota',
      voicemails: 'Áudio',
      trash: 'Lixeira',
    };
    return a.label ? `[${appNames[a.app] || a.app}] ${a.label}` : `[${appNames[a.app] || a.app}]`;
  };

  const renderForensicHudOverlays = () => (
    <>
      {forensicMode === 'channel' && (
        <div className="tools-hud-panel">
          <div className="hud-title">ISOLAMENTO DE ESPECTRO</div>
          <div className="forensic-controls">
            <button
              className={`btn-channel ${forensicChannel === 'all' ? 'active' : ''}`}
              onClick={() => setForensicChannel('all')}
            >RGB</button>
            <button
              className={`btn-channel red ${forensicChannel === 'r' ? 'active' : ''}`}
              onClick={() => setForensicChannel('r')}
            >RED</button>
            <button
              className={`btn-channel green ${forensicChannel === 'g' ? 'active' : ''}`}
              onClick={() => setForensicChannel('g')}
            >GRN</button>
            <button
              className={`btn-channel blue ${forensicChannel === 'b' ? 'active' : ''}`}
              onClick={() => setForensicChannel('b')}
            >BLU</button>
          </div>
          <p style={{ fontSize: 9, color: '#666', marginTop: 10 }}>
            Análise espectral isolada. Útil para encontrar escritas ocultas em cores específicas.
          </p>
        </div>
      )}

      {forensicMode === 'decoder' && (
        <div className="tools-hud-panel">
          <div className="hud-title">ESTAÇÃO DE DECIFRAGEM</div>
          <div style={{ width: '100%' }}>
            <UniversalDecoder
              initialInput={
                decoderPayloadOverride !== undefined
                  ? decoderPayloadOverride
                  : (currentCard.metadata?.cipher_text || currentCard.description_public || '')
              }
              investigationId={currentCard?.investigation_id ? String(currentCard.investigation_id) : undefined}
            />
          </div>
        </div>
      )}

      {forensicMode === 'lens' && (
        <div className="tools-hud-panel">
          <div className="hud-title"><Languages className="lucide-icon inline-icon" size={15} /> TRADUZIR</div>
          <div style={{ width: '100%' }}>
            <DecipherLens realText={currentCard.metadata?.real_text} cipherText={currentCard.metadata?.cipher_text} />
          </div>
        </div>
      )}

      {forensicMode === 'hex' && (
        <div className="tools-hud-panel">
          <div className="hud-title"><Keyboard className="lucide-icon inline-icon" size={15} /> INSPETOR HEXADECIMAL</div>
          <div style={{ width: '100%' }}>
            <HexViewer
              hiddenMessage={
                currentCard.metadata?.hex_code ||
                currentCard.metadata?.hex_hidden_message ||
                currentCard.metadata?.technical_note ||
                ''
              }
              xorKey={currentCard.metadata?.hex_xor_key}
              focused={true}
            />
          </div>
        </div>
      )}
    </>
  );

  const renderPhoneForensicPanelContent = () => {
    const fieldValues = card.metadata?.field_values || {};
    const fieldValueEntries = Object.entries(fieldValues).filter(([, val]) => Boolean(val) || val === 0);
    const extraMetaEntries = Object.entries(card.metadata || {}).filter(([key, val]) => {
      if (['excalidraw_data', 'chat_data', 'device_extraction', 'type', 'status', 'image_filter_reveal', 'image_filter_layer', 'image_filter', 'phone_password', 'phone_locked', 'phone_lock_type', 'field_values'].includes(key)) return false;
      return Boolean(val) || val === 0;
    });

    const labelMap: Record<string, string> = {
      date_created: 'Data',
      gps_coords: 'Localização',
      device_owner: 'Proprietário',
      camera_model: 'Câmera',
      technical_note: 'Nota Técnica',
      chat_contact_name: 'Contato',
      stamp: 'Carimbo',
      external_link: 'Link Externo',
    };

    return (
      <div className="im-phone-panel-body">
        <div className="im-phone-tabs">
          <button
            type="button"
            onClick={() => setPhoneForensicTab('markers')}
            className={`phone-compact-btn im-phone-tab ${
              phoneForensicTab === 'markers' ? 'im-phone-tab--active' : ''
            }`}
          >
            <Pin size={13} style={phoneForensicTab === 'markers' ? { color: '#fbbf24' } : undefined} />
            <span>Marcadores</span>
            {activePhonePinsCount > 0 && (
              <span className="im-phone-badge">
                {activePhonePinsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setPhoneForensicTab('metadata')}
            className={`phone-compact-btn im-phone-tab ${
              phoneForensicTab === 'metadata' ? 'im-phone-tab--active' : ''
            }`}
          >
            <FileText size={13} />
            <span>Metadados</span>
          </button>
        </div>

        <div className="im-phone-scroll-area phone-scroll">
          {phoneForensicTab === 'markers' ? (
            currentCard.id && collabInvestigationId ? (
              <PinListBar
                variant="sidebar"
                pins={phonePins}
                showPins={showPhonePins}
                onToggleShowPins={() => setShowPhonePins((s) => !s)}
                onSelectPin={(pin: CasePin) => {
                  requestAnchorJump(currentCard.id, 'phone', pin.anchor_data);
                  setMobilePhoneDrawerOpen(false);
                }}
                renderAnchorSummary={renderPhoneAnchorSummary}
              />
            ) : (
              <div className="im-phone-empty-box">
                Os marcadores colaborativos da equipe ficam disponíveis quando a evidência está vinculada a uma investigação ativa.
              </div>
            )
          ) : (
            <div className="im-phone-meta-stack">
              <div>
                <h2 className="im-phone-meta-title">
                  {card.title}
                </h2>

                {isGameMaster && (
                  <div className="gm-mode-toggle" style={{ marginBottom: 12 }}>
                    <button
                      type="button"
                      className={`gm-toggle-tab ${gmActiveTab === 'public' ? 'active' : ''}`}
                      onClick={() => setGmActiveTab('public')}
                    >
                      <Eye size={14} /> PÚBLICO
                    </button>
                    <button
                      type="button"
                      className={`gm-toggle-tab ${gmActiveTab === 'hidden' ? 'active' : ''}`}
                      onClick={() => setGmActiveTab('hidden')}
                    >
                      <Lock size={14} /> OCULTO
                    </button>
                  </div>
                )}

                {(!isGameMaster || gmActiveTab === 'public') ? (
                  <div className="im-phone-meta-card">
                    <span className="im-phone-meta-label">
                      Descrição
                    </span>
                    <p className="im-phone-meta-text">
                      {card.description_public || 'Nenhuma descrição fornecida.'}
                    </p>
                  </div>
                ) : (
                  isGameMaster && gmActiveTab === 'hidden' && (
                    <div className="gm-hidden-section">
                      <span className="desc-title" style={{ color: '#c6a45f' }}>
                        <Lock className="lucide-icon inline-icon" size={14} /> NOTAS DO MESTRE:
                      </span>
                      <div className="gm-note" style={{ marginTop: 6 }}>
                        {card.description_hidden || 'Nenhuma descrição oculta registrada.'}
                      </div>
                      {card.lock_password && (
                        <div className="gm-secret-password" style={{ marginTop: 8, fontSize: 13, color: '#f39c12' }}>
                          <strong><KeyRound className="lucide-icon inline-icon" size={14} /> Senha configurada:</strong> <code>{card.lock_password}</code>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="im-phone-action-row">
                <button
                  type="button"
                  className="phone-compact-btn im-phone-action-btn"
                  onClick={() => {
                    const safeText = currentCard.metadata?.cipher_text || currentCard.description_public || '';
                    if (onSendToDecoder) {
                      onSendToDecoder(safeText);
                    } else {
                      setDecoderPayloadOverride(safeText);
                      setForensicMode('decoder');
                    }
                  }}
                  title="Enviar texto público/cifrado para o Decoder"
                >
                  <KeyRound size={13} /> Decoder
                </button>
                <button
                  type="button"
                  className="phone-compact-btn im-phone-action-btn"
                  onClick={() => setForensicMode((prev) => (prev === 'hex' ? 'none' : 'hex'))}
                  title="Abrir conteúdo técnico/hex no Inspetor Hexadecimal"
                >
                  <Keyboard size={13} /> Inspetor Hex
                </button>
              </div>

              {megaClueMeta && (
                <div className="im-phone-meta-card">
                  <h4 className="im-phone-meta-label" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 }}>
                    VERDADE FINAL
                  </h4>
                  {(megaClueMeta.unlocked === true || isGameMaster) ? (
                    <div className="im-phone-meta-text">
                      {megaClueMeta.final_truth_text ? (
                        <div style={{ marginBottom: 8 }}>{megaClueMeta.final_truth_text}</div>
                      ) : (
                        <div style={{ color: '#71717a' }}>Nenhuma verdade final fornecida.</div>
                      )}
                      {megaClueMeta.image_url && (
                        <img src={megaClueMeta.image_url} alt="Verdade final" loading="lazy" style={{ maxWidth: '100%', borderRadius: 6, marginTop: 8 }} />
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#71717a' }}>Verdade final bloqueada — colecione os códigos para desbloquear.</div>
                  )}
                </div>
              )}

              {(fieldValueEntries.length > 0 || extraMetaEntries.length > 0) && (
                <div className="im-phone-meta-card">
                  <h4 className="im-phone-meta-label" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 }}>
                    METADADOS TÉCNICOS
                  </h4>

                  {fieldValueEntries.length > 0 && (
                    <div className="im-phone-meta-list">
                      {fieldValueEntries.map(([key, val]: any) => {
                        const label = labelMap[key] || key;
                        return (
                          <div key={key} className="im-phone-meta-row">
                            <span className="im-phone-meta-key">{label}</span>
                            <div className="im-phone-meta-val">
                              {key === 'gps_coords' && typeof val === 'string' ? (
                                <a href={`https://maps.google.com/?q=${val}`} target="_blank" rel="noreferrer" className="im-meta-link">
                                  {val}
                                </a>
                              ) : key === 'external_link' && typeof val === 'string' && /^https?:\/\//i.test(val) ? (
                                <a href={val} target="_blank" rel="noreferrer" className="im-meta-link">
                                  {val}
                                </a>
                              ) : (
                                String(val)
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {extraMetaEntries.length > 0 && (
                    <div className="im-phone-meta-list" style={fieldValueEntries.length > 0 ? { marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' } : undefined}>
                      {extraMetaEntries.map(([key, val]: any) => {
                        let displayVal: any = val;
                        if (typeof val === 'object') {
                          if (key === 'person' || key === 'person_meta') {
                            displayVal = (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}>
                                <div><b>Nome:</b> {val.name || '—'}</div>
                                <div><b>Profissão:</b> {val.occupation || '—'}</div>
                                <div>
                                  <b>Estado:</b>{' '}
                                  <span style={{ color: val.status && String(val.status).toLowerCase().includes('dead') ? '#f87171' : '#34d399' }}>
                                    {val.status || '—'}
                                  </span>
                                </div>
                              </div>
                            );
                          } else {
                            displayVal = JSON.stringify(val, null, 2);
                          }
                        }
                        return (
                          <div key={key} className="im-phone-meta-row">
                            <span className="im-phone-meta-label" style={{ marginBottom: 2 }}>{key}</span>
                            <div className="im-phone-meta-val" style={{ fontFamily: 'var(--font-system, monospace)', fontSize: 11.5, whiteSpace: 'pre-wrap' }}>
                              {displayVal}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {card.metadata && (card.metadata.person || card.metadata.person_meta) && (
                <div className="im-phone-meta-card">
                  <h4 className="im-phone-meta-label" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 }}>
                    PERFIL DE PESSOA
                  </h4>
                  {(() => {
                    const personData = card.metadata.person || card.metadata.person_meta;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#e4e4e7' }}>
                        <div><strong>Nome:</strong> {personData.name || '—'}</div>
                        <div><strong>Profissão:</strong> {personData.occupation || '—'}</div>
                        <div>
                          <strong>Status:</strong>{' '}
                          <span style={{ color: personData.status && String(personData.status).toLowerCase().includes('dead') ? '#f87171' : '#34d399' }}>
                            {personData.status || '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="im-phone-controls-divider">
                {isGameMaster && (
                  <button
                    type="button"
                    className="btn-edit-ref"
                    style={{ width: '100%' }}
                    onClick={() => {
                      onClose();
                      onEdit?.();
                    }}
                  >
                    <Pencil className="lucide-icon inline-icon" size={14} /> EDITAR DADOS
                  </button>
                )}

                <div className="clue-status-control">
                  <span className="control-label" style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600 }}>STATUS DA PISTA:</span>
                  <div className="status-button-group">
                    <button
                      type="button"
                      className={`btn-status pending ${(currentCard.status === 'pending' || !currentCard.status) ? 'active' : ''}`}
                      onClick={() => handleUpdateStatus('pending')}
                      title="Marcar como pendente"
                    >
                      <Clock className="lucide-icon inline-icon" size={13} /> PENDENTE
                    </button>
                    <button
                      type="button"
                      className={`btn-status confirmed ${currentCard.status === 'confirmed' ? 'active' : ''}`}
                      onClick={() => handleUpdateStatus('confirmed')}
                      title="Marcar como confirmada"
                    >
                      <CheckCircle2 className="lucide-icon inline-icon" size={13} /> CONFIRMADA
                    </button>
                    <button
                      type="button"
                      className={`btn-status debunked ${currentCard.status === 'debunked' ? 'active' : ''}`}
                      onClick={() => handleUpdateStatus('debunked')}
                      title="Marcar como descartada"
                    >
                      <XCircle className="lucide-icon inline-icon" size={13} /> DESCARTADA
                    </button>
                  </div>
                </div>

                <div className="z-order-controls">
                  <span className="control-label text-[11px] text-zinc-400 font-mono font-semibold">ORDEM Z:</span>
                  <div className="z-button-group">
                    <button
                      type="button"
                      className="btn-z-order"
                      onClick={() => handleUpdateZIndex(1)}
                      title="Trazer para frente"
                    >
                      <ArrowUp size={14} /> ELEVAR (Z: {currentCard.z_index ?? 1})
                    </button>
                    <button
                      type="button"
                      className="btn-z-order"
                      onClick={() => handleUpdateZIndex(-1)}
                      title="Enviar para trás"
                    >
                      <ArrowDown size={14} /> REBAIXAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const modal = (
    <div className="inspect-backdrop" ref={backdropRef} onClick={onClose}>
      {/* Dropdown portal for the 'MAIS' menu - positioned relative to modal */}
      {showMoreTools && moreToolsPos && (
        <div
          ref={moreToolsDropdownRef}
          className="more-tools-dropdown"
          style={{
            position: 'absolute',
            left: `${moreToolsPos.left}px`,
            top: `${moreToolsPos.top}px`,
            background: '#111',
            border: '1px solid #222',

            /* --- adjusted: remove inner padding and gap, hide overflow */
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            overflow: 'hidden',

            zIndex: 400,
            minWidth: 200,
            borderRadius: 6,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
          }}
          onClick={e => e.stopPropagation()}
        >
          {(() => {
            const isMobile = (typeof window !== 'undefined' && window.innerWidth <= 768);
            return (menuView === 'media' && isMobile) ? (
              <>
                <button type="button" className="btn-tool-tab" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => setMenuView('tools')}><ArrowLeft className="lucide-icon inline-icon" size={14} /> VOLTAR</button>
                <hr className="divider" />
                {hasImage && (
                  <button type="button" className={`btn-tool-tab ${visualMode === 'image' ? 'active-green' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { setVisualMode('image'); setShowMoreTools(false); }}><Camera className="lucide-icon inline-icon" size={15} /> FOTO</button>
                )}
                {hasVideo && (
                  <button type="button" className={`btn-tool-tab ${visualMode === 'video' ? 'active-green' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { setVisualMode('video'); setShowMoreTools(false); }}><Video className="lucide-icon inline-icon" size={15} /> VÍDEO</button>
                )}
                {hasAudio && (
                  <button type="button" className={`btn-tool-tab ${visualMode === 'audio' ? 'active-green' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { setVisualMode('audio'); setShowMoreTools(false); }}><Music className="lucide-icon inline-icon" size={16} /> ÁUDIO</button>
                )}
                {hasChat && (
                  <button type="button" className={`btn-tool-tab ${visualMode === 'phone' ? 'active-green' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { setVisualMode('phone'); setShowMoreTools(false); }}><MessageSquare className="lucide-icon inline-icon" size={15} /> CHATS</button>
                )}
              </>
            ) : (
              <>
                <button type="button" className="btn-tool-tab btn-highlight" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => setMenuView('media')}>
                  <FolderOpen className="lucide-icon inline-icon" size={15} /> MÍDIA ({mediaCount}) ▸
                </button>
                <hr className="divider" />
                {visualMode !== 'audio' && (() => {
                  const meta = currentCard?.metadata;
                  const hasThermal = Boolean(meta && (meta.thermal === true || meta.thermal_enabled === true || meta.thermal_overlay === true));
                  const thermalKeyword = meta?.thermal_keyword;
                  const thermalUnlocked = meta?.thermal_unlocked === true;
                  const canUseThermal = hasThermal && (!thermalKeyword || thermalUnlocked);
                  const isLocked = hasThermal && thermalKeyword && !thermalUnlocked;

                  return (
                    <button
                      type="button"
                      className={`btn-tool-tab ${localThermal ? 'active-blue' : ''}`}
                      style={{ display: 'block', width: '100%', textAlign: 'left', opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                      onClick={() => {
                        if (isLocked) { alert(`🔒 Modo Termal bloqueado. Use o Terminal de Busca para encontrar a palavra-chave.`); return; }
                        setLocalThermal(!localThermal);
                        setShowMoreTools(false);
                      }}
                      title={isLocked ? 'Use o Terminal de Busca para desbloquear' : 'Ativar visão termográfica'}
                    >
                      <Thermometer className="lucide-icon inline-icon" size={16} /> TERMAL {isLocked ? <Lock className="lucide-icon inline-icon" size={13} /> : null}
                    </button>
                  );
                })()}

                <button type="button" className={`btn-tool-tab ${forensicMode === 'channel' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('forense'); setShowMoreTools(false); }}><Microscope className="lucide-icon inline-icon" size={15} /> FORENSE</button>
                <button type="button" className={`btn-tool-tab ${forensicMode === 'hex' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('hex'); setShowMoreTools(false); }}><Keyboard className="lucide-icon inline-icon" size={15} /> INSPECIONAR CÓDIGO</button>
                <button type="button" className={`btn-tool-tab ${forensicMode === 'decoder' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('decoder'); setShowMoreTools(false); }}><Lock className="lucide-icon inline-icon" size={16} /> DECODIFICADOR</button>
                <button type="button" className={`btn-tool-tab ${forensicMode === 'lens' ? 'active-purple' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('lens'); setShowMoreTools(false); }}><Languages className="lucide-icon inline-icon" size={15} /> TRADUZIR</button>
              </>
            )
          })()}
        </div>
      )}
      <div
        className="inspect-file"
        ref={fileRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspection-title"
        tabIndex={-1}
      >
        {/* Header: hide metadata and action buttons when locked; keep only close button so user can exit */}
        <div className="inspect-header shrink-0 z-20">
          {(!isCardLocked(card) || isUnlocked || isGameMaster) ? (
            <>
              <div className="meta-info">
                <span className="case-stamp">EVIDÊNCIA #{String(currentCard.id || '').slice(0, 4)}</span>
                {cardLocked && (
                  <span title="Evidência protegida" style={{ marginLeft: 8, color: '#f39c12', fontWeight: 700 }}><Lock className="lucide-icon inline-icon" size={16} /></span>
                )}
                {hasRecord && (
                  <span title="Prontuário disponível" style={{ marginLeft: 8, color: '#9ee7c8', fontWeight: 700 }}><FileText className="lucide-icon inline-icon" size={15} /></span>
                )}
                {currentCard.metadata?.type && <span className="type-tag">{currentCard.metadata.type}</span>}
                {contactNameInferred && (
                  <span className="chat-contact">{contactNameInferred}</span>
                )}

                {/* Toggle buttons for available media types (desktop only) */}
                <div className="media-toggle" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  {hasImage && (
                    <button
                      type="button"
                      className={`btn-tool-tab ${visualMode === 'image' ? 'active-green' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setVisualMode('image'); }}
                    >
                      <Camera className="lucide-icon inline-icon" size={15} /> FOTO
                    </button>
                  )}
                  {hasVideo && (
                    <button
                      type="button"
                      className={`btn-tool-tab ${visualMode === 'video' ? 'active-green' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setVisualMode('video'); }}
                    >
                      <Video className="lucide-icon inline-icon" size={15} /> VÍDEO
                    </button>
                  )}
                  {hasAudio && (
                    <button
                      type="button"
                      className={`btn-tool-tab ${visualMode === 'audio' ? 'active-green' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setVisualMode('audio'); }}
                    >
                      <Music className="lucide-icon inline-icon" size={16} /> ÁUDIO
                    </button>
                  )}
                  {hasChat && (
                    <button
                      type="button"
                      className={`btn-tool-tab ${visualMode === 'phone' ? 'active-green' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setVisualMode('phone'); }}
                    >
                      <MessageSquare className="lucide-icon inline-icon" size={15} /> CHATS
                    </button>
                  )}
                </div>
              </div>
              <div className="actions">
                <span className="hidden md:inline-block w-px h-5 bg-white/10 shrink-0 mx-0.5" aria-hidden="true" />
                <button
                  className="btn-tool-tab btn-expand"
                  title={visualMode === 'audio' ? 'Abrir Console Avançado & Espectrograma' : visualMode === 'phone' ? 'Expandir celular' : 'Expandir imagem'}
                  onClick={(e) => {
                    e.stopPropagation();

                    if (visualMode === 'audio') {
                      handleOpenAudioExpander();
                    } else {
                      if (audioExpanderLockRef.current) return;
                      console.log('[InspectionModal] Opening fullscreen for visualMode:', visualMode);
                      setFullscreenOpen(true);
                    }
                  }}
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                >
                  {visualMode === 'audio' ? <><Music className="lucide-icon inline-icon" size={15} /> EXPANDIR</> : visualMode === 'phone' ? <><Smartphone className="lucide-icon inline-icon" size={15} /> EXPANDIR</> : <><Search className="lucide-icon inline-icon" size={15} /> EXPANDIR</>}
                </button>

                <button
                  type="button"
                  className="btn-tool-tab btn-fullscreen"
                  title="Alternar Tela Cheia"
                  onClick={handleToggleFullscreen}
                >
                  <Maximize2 className="lucide-icon inline-icon" size={16} /> TELA CHEIA
                </button>

                {visualMode === 'phone' ? (
                  <>
                    <button
                      type="button"
                      className={`btn-tool-tab im-phone-btn-desktop ${phoneSidebarOpen ? 'active-blue' : ''}`}
                      onClick={() => setPhoneSidebarOpen((s) => !s)}
                      title={phoneSidebarOpen ? 'Recolher painel forense' : 'Mostrar painel forense'}
                    >
                      {phoneSidebarOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                      <span>PAINEL</span>
                      {activePhonePinsCount > 0 && (
                        <span className="im-phone-badge">
                          {activePhonePinsCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className={`btn-tool-tab im-phone-btn-mobile ${mobilePhoneDrawerOpen ? 'active-blue' : ''}`}
                      onClick={() => setMobilePhoneDrawerOpen((s) => !s)}
                      title="Abrir marcadores e metadados"
                    >
                      <Pin size={14} />
                      <span>DADOS</span>
                      {activePhonePinsCount > 0 && (
                        <span className="im-phone-badge">
                          {activePhonePinsCount}
                        </span>
                      )}
                    </button>
                  </>
                ) : visualMode === 'audio' ? (
                  <button
                    type="button"
                    className={`btn-tool-tab im-audio-sidebar-btn ${!sidebarCollapsed ? 'active-blue' : ''}`}
                    onClick={() => setSidebarCollapsed((prev) => !prev)}
                    title={sidebarCollapsed ? 'Expandir painel de metadados' : 'Recolher painel de metadados'}
                    aria-label={sidebarCollapsed ? 'Expandir painel lateral' : 'Recolher painel lateral'}
                  >
                    {sidebarCollapsed ? <PanelRightOpen size={15} /> : <PanelRightClose size={15} />}
                    <span>{sidebarCollapsed ? 'DETALHES' : 'RECOLHER'}</span>
                  </button>
                ) : (
                  <>
                    <button className={`btn-tool-tab ${showFilters ? 'active-green' : ''}`} onClick={() => disableAllBut('filters')}><SlidersHorizontal className="lucide-icon inline-icon" size={15} /> TRATAMENTO</button>

                    <button
                      className={`btn-tool-tab ${localUV ? 'active-purple' : ''}`}
                      onClick={() => {
                        const next = !localUV;
                        setLocalUV(next);
                        if (!next) setUvLensLocked(false);
                      }}
                    >
                      <Flashlight className="lucide-icon inline-icon" size={15} /> LUZ UV
                    </button>
                    {localUV && (
                      <button
                        className={`btn-tool-tab ${uvLensLocked ? 'active-green' : ''}`}
                        onClick={() => setUvLensLocked((v) => !v)}
                        title="Fixar lente / Raio-X completo (ideal para ler com calma no celular e tablet)"
                      >
                        {uvLensLocked ? 'RAIO-X FIXO' : 'FIXAR LENTE'}
                      </button>
                    )}

                    {isGlitchPuzzleGlobal && (
                      <button
                        className={`btn-tool-tab ${showGlitchSolver ? 'active-green' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setShowGlitchSolver(true); }}
                      >
                        <Puzzle className="lucide-icon inline-icon" size={15} /> DECODIFICAR
                      </button>
                    )}
                  </>
                )}

                {/* Group less-used tools under "Mais" */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    className="btn-tool-tab"
                    ref={moreToolsBtnRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      const btn = moreToolsBtnRef.current;
                      if (!btn) { setShowMoreTools(s => !s); return; }
                      const modalEl = fileRef.current;
                      const btnRect = btn.getBoundingClientRect();
                      const modalRect = modalEl?.getBoundingClientRect();
                      setMoreToolsPos({
                        left: Math.max(8, (btnRect.left - (modalRect?.left || 0))),
                        top: Math.max(8, (btnRect.bottom - (modalRect?.top || 0)) + DROPDOWN_VERTICAL_OFFSET),
                        width: btnRect.width,
                      });
                      setShowMoreTools(s => !s);
                    }}
                    aria-expanded={showMoreTools}
                  >
                    MAIS ▾
                  </button>
                </div>

                {/* Phone open/close button removed per request */}

                {/* Expandir button moved to main toolbar as contextual control */}

                <button className="btn-close-modal btn-close" onClick={onClose} aria-label="Fechar modal" title="Fechar modal"><X size={18} /></button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button className="btn-close-modal btn-close" onClick={onClose} aria-label="Fechar modal" title="Fechar modal"><X size={18} /></button>
            </div>
          )}
        </div>

        {/* debug overlay removed */}

        {/* --- CONTEÚDO PRINCIPAL --- */}
        {(() => {
          const activeCardObj = serverCard || card;
          const paceMode = activeCardObj?.pace_mode === 'between_sessions' ? 'between_sessions' : 'in_session';
          const assistRevealed = Boolean(activeCardObj?.metadata?.cris_assist_revealed);
          const assistHintText = activeCardObj?.metadata?.cris_assist_hint;
          const cardStillLocked = Boolean(activeCardObj?.is_locked || activeCardObj?.lock_password);

          return (
            <>
              {(paceMode === 'between_sessions' || (isGameMaster && !effectivePlayerView && cardStillLocked) || assistRevealed) && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '6px 14px',
                    background: 'rgba(10, 16, 26, 0.92)',
                    borderBottom: '1px solid rgba(56, 189, 248, 0.18)',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontFamily: 'var(--font-system, monospace)',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        background:
                          paceMode === 'between_sessions'
                            ? 'rgba(168, 85, 247, 0.22)'
                            : 'rgba(16, 185, 129, 0.2)',
                        color: paceMode === 'between_sessions' ? '#d8b4fe' : '#6ee7b7',
                        border:
                          paceMode === 'between_sessions'
                            ? '1px solid rgba(168, 85, 247, 0.45)'
                            : '1px solid rgba(16, 185, 129, 0.35)',
                      }}
                    >
                      {paceMode === 'between_sessions' ? 'QUARENTENA · ENTRE SESSÕES' : 'EM CENA · RITMO RÁPIDO'}
                    </span>
                    {assistRevealed && assistHintText && (
                      <span style={{ color: '#fde68a' }}>
                        <strong>[C.R.I.S. ASSIST]</strong> {assistHintText}
                      </span>
                    )}
                    {gmOverrideStatus && (
                      <span style={{ color: '#6ee7b7' }}>{gmOverrideStatus}</span>
                    )}
                  </div>

                  {isGameMaster && !effectivePlayerView && cardStillLocked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={gmOverrideBusy}
                        onClick={() => handleGmSkillOverride('assist_hint')}
                        style={{
                          padding: '3px 9px',
                          fontSize: 11,
                          borderRadius: 6,
                          border: '1px solid rgba(251, 191, 36, 0.45)',
                          background: 'rgba(251, 191, 36, 0.14)',
                          color: '#fde68a',
                          cursor: 'pointer',
                        }}
                        title="Teste de Perícia parcial: revela a dica orgânica da C.R.I.S."
                      >
                        Calibração Assistida (Perícia)
                      </button>
                      <button
                        type="button"
                        disabled={gmOverrideBusy}
                        onClick={() => handleGmSkillOverride('override_unlock')}
                        style={{
                          padding: '3px 9px',
                          fontSize: 11,
                          borderRadius: 6,
                          border: '1px solid rgba(16, 185, 129, 0.5)',
                          background: 'rgba(16, 185, 129, 0.18)',
                          color: '#a7f3d0',
                          cursor: 'pointer',
                        }}
                        title="Override ao vivo: destrava a pista e libera recompensas imediatamente"
                      >
                        Override Total (Destravar)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}

        {!(isUnlocked || isGameMaster) ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            {(() => {
              const activeCardObj = serverCard || card;
              const lockPass = activeCardObj?.lock_password;
              const lockType =
                activeCardObj?.lock_type ||
                (lockPass && /^\d+$/.test(String(lockPass))
                  ? 'keypad'
                  : lockPass && /^[1-9](-[1-9]){2,8}$/.test(String(lockPass))
                  ? 'pattern'
                  : 'terminal');

              if (lockType === 'keypad') {
                return (
                  <NumericKeypad
                    onVerify={handleVerifyLockedCard}
                    onUnlock={(unlockedCode) => persistUnlockForCard(unlockedCode || '', 'keypad')}
                  />
                );
              }
              if (lockType === 'pattern') {
                return (
                  <PatternLock
                    onVerify={handleVerifyLockedCard}
                    onUnlock={(unlockedPattern) => persistUnlockForCard(unlockedPattern || '', 'keypad')}
                  />
                );
              }
              return (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <HackingTerminal
                    onVerify={handleVerifyLockedCard}
                    onUnlock={(unlockedCode) => persistUnlockForCard(unlockedCode || '', 'terminal')}
                    hint={activeCardObj?.metadata?.cris_assist_hint || activeCardObj?.description_public}
                  />
                </div>
              );
            })()}
          </div>
        ) : visualMode === 'phone' ? (
          <div className="inspect-phone-layout im-phone-layout">
            <div className="inspect-phone-stage im-phone-stage">
              {renderVisualContent()}
              {renderForensicHudOverlays()}
            </div>

            {phoneSidebarOpen && (
              <aside
                className="im-phone-sidebar"
                aria-label="Painel forense do celular"
              >
                {renderPhoneForensicPanelContent()}
              </aside>
            )}

            {mobilePhoneDrawerOpen && (
              <div className="im-phone-drawer-root">
                <div
                  className="im-phone-drawer-backdrop"
                  onClick={() => setMobilePhoneDrawerOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="dialog"
                  aria-label="Painel forense do celular"
                  className="im-phone-drawer-sheet"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="im-phone-drawer-header">
                    <div className="im-phone-drawer-title">
                      <span className="im-phone-drawer-handle" aria-hidden="true" />
                      <span>Painel Forense</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobilePhoneDrawerOpen(false)}
                      aria-label="Fechar painel forense"
                      className="phone-compact-btn im-phone-drawer-close"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {renderPhoneForensicPanelContent()}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`inspect-body-split ${visualMode === 'audio' ? 'im-audio-split' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <div className={`inspect-visual-area ${visualMode === 'audio' ? 'im-audio-stage' : ''} ${isGlitchPuzzleGlobal && showGlitchSolver ? 'is-glitching glitch-mode' : ''}`} style={{ position: 'relative' }}>
              {visualMode !== 'audio' && (
                <button
                  type="button"
                  className="btn-toggle-sidebar"
                  onClick={() => setSidebarCollapsed(prev => !prev)}
                  title={sidebarCollapsed ? "Expandir painel de informações" : "Recolher painel de informações (Foco total)"}
                  aria-label={sidebarCollapsed ? "Expandir painel lateral" : "Recolher painel lateral"}
                >
                  {sidebarCollapsed ? '◀ DETALHES' : 'RECOLHER ▶'}
                </button>
              )}
              {renderVisualContent()}

              {showFilters && (
                <div className="filters-overlay-panel">
                  <div className="filter-row">
                    <label>BRILHO {filters.brightness}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min={IMAGE_FILTER_LIMITS.brightness.min} max={IMAGE_FILTER_LIMITS.brightness.max} value={filters.brightness} onChange={e => setFilters(prev => ({ ...prev, brightness: clampImageFilterValue('brightness', Number(e.target.value)) }))} />
                      <input className="filter-number" type="number" min={IMAGE_FILTER_LIMITS.brightness.min} max={IMAGE_FILTER_LIMITS.brightness.max} value={filters.brightness} onChange={e => setFilters(prev => ({ ...prev, brightness: clampImageFilterValue('brightness', Number(e.target.value)) }))} />
                    </div>
                  </div>
                  <div className="filter-row">
                    <label>CONTRASTE {filters.contrast}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min={IMAGE_FILTER_LIMITS.contrast.min} max={IMAGE_FILTER_LIMITS.contrast.max} value={filters.contrast} onChange={e => setFilters(prev => ({ ...prev, contrast: clampImageFilterValue('contrast', Number(e.target.value)) }))} />
                      <input className="filter-number" type="number" min={IMAGE_FILTER_LIMITS.contrast.min} max={IMAGE_FILTER_LIMITS.contrast.max} value={filters.contrast} onChange={e => setFilters(prev => ({ ...prev, contrast: clampImageFilterValue('contrast', Number(e.target.value)) }))} />
                    </div>
                  </div>
                  <div className="filter-row">
                    <label>SATURAÇÃO {filters.saturation}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min={IMAGE_FILTER_LIMITS.saturate.min} max={IMAGE_FILTER_LIMITS.saturate.max} value={filters.saturation} onChange={e => setFilters(prev => ({ ...prev, saturation: clampImageFilterValue('saturate', Number(e.target.value)) }))} />
                      <input className="filter-number" type="number" min={IMAGE_FILTER_LIMITS.saturate.min} max={IMAGE_FILTER_LIMITS.saturate.max} value={filters.saturation} onChange={e => setFilters(prev => ({ ...prev, saturation: clampImageFilterValue('saturate', Number(e.target.value)) }))} />
                    </div>
                  </div>
                  <button className="btn-reset-filters" onClick={() => { setFilters({ brightness: DEFAULT_IMAGE_FILTERS.brightness, contrast: DEFAULT_IMAGE_FILTERS.contrast, saturation: DEFAULT_IMAGE_FILTERS.saturate }); }}>RESET</button>
                </div>
              )}

              {renderForensicHudOverlays()}

              {/* audio is displayed via the 'audio' visual mode/tab now */}
            </div>

            {!sidebarCollapsed && (
              <aside className="inspect-details" aria-label="Detalhes da evidência">

                {/* Coluna com SCROLL automático */}
                <div className="text-col">
                  <h2>{card.title}</h2>

                  {/* Toggle Mestre: Público vs Oculto */}
                  {isGameMaster && (
                    <div className="gm-mode-toggle">
                      <button
                        type="button"
                        className={`gm-toggle-tab gm-toggle-tab--public ${gmActiveTab === 'public' ? 'active' : ''}`}
                        onClick={() => setGmActiveTab('public')}
                      >
                        <Eye size={15} /> MODO PÚBLICO
                      </button>
                      <button
                        type="button"
                        className={`gm-toggle-tab gm-toggle-tab--hidden ${gmActiveTab === 'hidden' ? 'active' : ''}`}
                        onClick={() => setGmActiveTab('hidden')}
                      >
                        <Lock size={15} /> MODO OCULTO (MESTRE)
                      </button>
                    </div>
                  )}

                  {(!isGameMaster || gmActiveTab === 'public') ? (
                    <>
                      <span className="desc-title">DESCRIÇÃO:</span>
                      <p className="public-desc">
                        {card.description_public || "Nenhuma descrição fornecida."}
                      </p>
                    </>
                  ) : (
                    isGameMaster && gmActiveTab === 'hidden' && (
                      <div className="gm-hidden-section">
                        <span className="desc-title" style={{ color: '#c6a45f' }}>
                          <Lock className="lucide-icon inline-icon" size={16} /> DESCRIÇÃO OCULTA (CONFIDENCIAL):
                        </span>
                        <div className="gm-note" style={{ marginTop: 6 }}>
                          {card.description_hidden || "Nenhuma descrição oculta registrada."}
                        </div>
                        {card.lock_password && (
                          <div className="gm-secret-password" style={{ marginTop: 8, fontSize: 13, color: '#f39c12' }}>
                            <strong><KeyRound className="lucide-icon inline-icon" size={14} /> Senha configurada:</strong> <code>{card.lock_password}</code>
                          </div>
                        )}
                      </div>
                    )
                  )}
                  {/* Ações Rápidas: Enviar para Decoder / Abrir no Hex (seguro: apenas conteúdo público/cifrado, nunca description_hidden) */}
                  <div className="inspect-quick-forensics">
                    <button
                      type="button"
                      className="im-sidebar-action-btn"
                      onClick={() => {
                        const safeText = currentCard.metadata?.cipher_text || currentCard.description_public || '';
                        if (onSendToDecoder) {
                          onSendToDecoder(safeText);
                        } else {
                          setDecoderPayloadOverride(safeText);
                          setForensicMode('decoder');
                        }
                      }}
                      title="Enviar texto público/cifrado para o Decoder"
                    >
                      <KeyRound className="lucide-icon inline-icon" size={14} />
                      <span>Enviar para Decoder</span>
                    </button>
                    <button
                      type="button"
                      className="im-sidebar-action-btn"
                      onClick={() => setForensicMode(prev => prev === 'hex' ? 'none' : 'hex')}
                      title="Abrir conteúdo técnico/hex no Inspetor Hexadecimal"
                    >
                      <Keyboard className="lucide-icon inline-icon" size={14} />
                      <span>Abrir no Hex</span>
                    </button>
                  </div>

                  {/* Mega-clue: Verdade final e imagem (visível quando desbloqueada ou para GMs) */}
                  {megaClueMeta && (
                    <div className="metadata-box" style={{ marginTop: 12 }}>
                      <h4>VERDADE FINAL</h4>
                      {((megaClueMeta.unlocked === true) || isGameMaster) ? (
                        <div style={{ color: '#ddd', fontSize: 13 }}>
                          {megaClueMeta.final_truth_text ? (
                            <div style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>{megaClueMeta.final_truth_text}</div>
                          ) : (
                            <div style={{ color: '#888' }}>Nenhuma verdade final fornecida.</div>
                          )}
                          {megaClueMeta.image_url && (
                            <div style={{ marginTop: 8 }}>
                              <img src={megaClueMeta.image_url} alt="Verdade final" loading="lazy" style={{ maxWidth: '100%', borderRadius: 6 }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: '#888' }}>Verdade final bloqueada — colecione os códigos para desbloquear.</div>
                      )}
                    </div>
                  )}

                  {/* METADADOS LIMPOS E ORGANIZADOS */}
                  {card.metadata && card.metadata.field_values && Object.keys(card.metadata.field_values).length > 0 && (
                    <div className="metadata-box">
                      <h4>METADADOS TÉCNICOS</h4>

                      {/* Mostrar APENAS field_values com valores reais */}
                      <div className="im-meta-group">
                        <div className="im-meta-subhead">Informações do Arquivo</div>
                        {Object.entries(card.metadata.field_values || {}).map(([key, val]: any) => {
                          // Só mostra se tem valor real
                          if (!val && val !== 0) return null;

                          const labelMap: Record<string, string> = {
                            date_created: 'Data',
                            gps_coords: 'Localização',
                            device_owner: 'Proprietário',
                            camera_model: 'Câmera',
                            technical_note: 'Nota Técnica',
                            chat_contact_name: 'Contato',
                            stamp: 'Carimbo',
                            external_link: 'Link Externo'
                          };
                          const label = labelMap[key] || key;
                          return (
                            <div key={key} className="im-meta-row">
                              <span className="im-meta-row-label">{label}</span>
                              <div className="im-meta-row-value">
                                {key === 'gps_coords' && typeof val === 'string' ? (
                                  <a href={`https://maps.google.com/?q=${val}`} target="_blank" rel="noreferrer" className="im-meta-link">
                                    {val}
                                  </a>
                                ) : key === 'external_link' && typeof val === 'string' && /^https?:\/\//i.test(val) ? (
                                  <a href={val} target="_blank" rel="noreferrer" className="im-meta-link">
                                    {val}
                                  </a>
                                ) : (
                                  String(val)
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mostrar person/person_meta se houver */}
                  {card.metadata && (card.metadata.person || card.metadata.person_meta) && (
                    <div className="metadata-box" style={{ marginTop: 12 }}>
                      <h4>PERFIL DE PESSOA</h4>
                      {(() => {
                        const personData = card.metadata.person || card.metadata.person_meta;
                        return (
                          <div className="im-meta-group">
                            <div className="im-meta-row">
                              <span className="im-meta-row-label">Nome</span>
                              <div className="im-meta-row-value">{personData.name || '—'}</div>
                            </div>
                            <div className="im-meta-row">
                              <span className="im-meta-row-label">Profissão</span>
                              <div className="im-meta-row-value">{personData.occupation || '—'}</div>
                            </div>
                            <div className="im-meta-row">
                              <span className="im-meta-row-label">Status</span>
                              <div className="im-meta-row-value">
                                <span style={{ color: personData.status && String(personData.status).toLowerCase().includes('dead') ? '#f87171' : '#34d399', fontWeight: 600 }}>
                                  {personData.status || '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Coluna de Botões Fixos */}
                <div className="controls-col">
                  {isGameMaster && (
                    <button className="btn-edit-ref" onClick={() => { onClose(); onEdit?.(); }}>
                      <Pencil className="lucide-icon inline-icon" size={14} /> EDITAR DADOS
                    </button>
                  )}

                  {/* Status da Pista */}
                  <div className="clue-status-control">
                    <span className="control-label" style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>STATUS DA PISTA:</span>
                    <div className="status-button-group">
                      <button
                        type="button"
                        className={`btn-status pending ${(currentCard.status === 'pending' || !currentCard.status) ? 'active' : ''}`}
                        onClick={() => handleUpdateStatus('pending')}
                        title="Marcar como pendente"
                      >
                        <Clock className="lucide-icon inline-icon" size={14} /> PENDENTE
                      </button>
                      <button
                        type="button"
                        className={`btn-status confirmed ${currentCard.status === 'confirmed' ? 'active' : ''}`}
                        onClick={() => handleUpdateStatus('confirmed')}
                        title="Marcar como confirmada"
                      >
                        <CheckCircle2 className="lucide-icon inline-icon" size={14} /> CONFIRMADA
                      </button>
                      <button
                        type="button"
                        className={`btn-status debunked ${currentCard.status === 'debunked' ? 'active' : ''}`}
                        onClick={() => handleUpdateStatus('debunked')}
                        title="Marcar como descartada"
                      >
                        <XCircle className="lucide-icon inline-icon" size={14} /> DESCARTADA
                      </button>
                    </div>
                  </div>

                  {/* Ordem de Camada Z */}
                  <div className="z-order-controls">
                    <span className="control-label" style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>ORDEM Z:</span>
                    <div className="z-button-group">
                      <button
                        type="button"
                        className="btn-z-order"
                        onClick={() => handleUpdateZIndex(1)}
                        title="Trazer para frente"
                      >
                        <ArrowUp size={16} /> ELEVAR (Z: {currentCard.z_index ?? 1})
                      </button>
                      <button
                        type="button"
                        className="btn-z-order"
                        onClick={() => handleUpdateZIndex(-1)}
                        title="Enviar para trás"
                      >
                        <ArrowDown size={16} /> REBAIXAR
                      </button>
                    </div>
                  </div>

                  {/* Exemplo de botão extra se for pessoa */}
                  {card.metadata?.type === 'person' && (
                    <div style={{ padding: 10, background: '#222', border: '1px solid #444', textAlign: 'center', fontSize: 10 }}>
                      STATUS: <br />
                      <strong style={{
                        color: card.metadata.person?.status === 'DEAD' ? '#e74c3c' : card.metadata.person?.status === 'MIA' ? '#f39c12' : '#2ecc71',
                        fontSize: 14
                      }}>
                        {card.metadata.person?.status === 'ALIVE' ? 'VIVO' : card.metadata.person?.status === 'DEAD' ? 'MORTO' : card.metadata.person?.status === 'MIA' ? 'DESAPARECIDO' : 'DESCONHECIDO'}
                      </strong>
                    </div>
                  )}
                </div>

              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const glitchSolverConfig = React.useMemo(() => {
    if (!parsedMetadata?.glitch_puzzle) {
      console.debug('[InspectionModal] No glitchSolverConfig - parsedMetadata.glitch_puzzle is missing', {
        hasMetadata: !!parsedMetadata,
        type: currentCard?.type,
        cardType: parsedMetadata?.card_type,
        metadataKeys: parsedMetadata ? Object.keys(parsedMetadata) : []
      });
      return null;
    }

    const security = parsedMetadata.glitch_puzzle.security_layer || parsedMetadata.security_layer;
    const config = security ? { ...parsedMetadata.glitch_puzzle, security_layer: security } : parsedMetadata.glitch_puzzle;

    console.debug('[InspectionModal] glitchSolverConfig created:', {
      hasOriginalImage: !!config.original_image_url,
      hasRewardCode: !!config.reward_code,
      hasSecurity: !!security,
      solved: config.solved
    });

    return config;
  }, [parsedMetadata, currentCard]);

  const glitchPortal = showGlitchSolver && glitchSolverConfig && !glitchSolverConfig.solved
    ? createPortal(
      <div className="glitch-solver-backdrop" onClick={() => setShowGlitchSolver(false)}>
        <div className="glitch-solver-modal" onClick={(e) => e.stopPropagation()}>
          <div className="glitch-solver-header">
            <div>
              <span className="glitch-pill">GLITCH</span>
              <span className="glitch-title">Painel de Sincronização</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-tool-tab" onClick={() => setShowGlitchSolver(false)} aria-label="Fechar"><X size={15} /></button>
            </div>
          </div>
          <div className="glitch-solver-body">
            <React.Suspense fallback={<div style={{ color: '#0f0', padding: 20, textAlign: 'center' }}>CARREGANDO DECODIFICADOR...</div>}>
              <GlitchPuzzleSolverLazy
                config={glitchSolverConfig}
                fullMetadata={parsedMetadata}
                investigationId={currentCard.investigation_id}
                cardId={currentCard.id}
                onSolved={handleSecuritySolved}
              />
            </React.Suspense>
          </div>
        </div>
      </div>, document.body)
    : null;

  return (
    <>
      {createPortal(modal, document.body)}
      {glitchPortal}

      {/* MODO EXPANDIR (FULLSCREEN) RENOVADO */}
      {fullscreenOpen && createPortal(
        <div className="fullscreen-viewer">

          {/* HUD SUPERIOR: Título e Fechar */}
          <div className="fullscreen-hud-top">
            <div>
              <div style={{ color: '#fff', fontWeight: 'bold', letterSpacing: 1 }}>EVIDÊNCIA #{String(currentCard.id || '').slice(0, 4)}</div>
              <div style={{ color: '#00f3ff', fontSize: 10, marginTop: 2 }}>{localUV ? 'LUZ UV ATIVA' : 'MODO PADRÃO'}</div>
            </div>
            <button className="btn-hud-close" onClick={() => setFullscreenOpen(false)}>×</button>
          </div>

          {/* ÁREA DA IMAGEM (STAGE) */}
          {/* A classe fullscreen-stage é alvo do nosso useEffect de Zoom novo */}
          <div
            className="fullscreen-stage"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={visualMode === 'phone' ? undefined : handleEvidencePointerMove}
            onPointerMove={visualMode === 'phone' ? undefined : handleEvidencePointerMove}
            onTouchStart={visualMode === 'phone' ? undefined : handleEvidenceTouchMove}
            onTouchMove={visualMode === 'phone' ? undefined : handleEvidenceTouchMove}
            style={{ touchAction: visualMode === 'phone' ? 'auto' : 'none' }}
          >
            {visualMode === 'phone' ? (
              <div className="w-full h-full min-h-0 flex items-center justify-center p-0 md:p-6 overflow-hidden">
                <PhoneViewer
                  chatData={headerChatList}
                  contactName={currentCard.title}
                  isLocked={phoneIsLocked}
                  password={phonePassword}
                  passwordType={parsedMetadata?.phone_lock_type || 'pin'}
                  deviceData={parsedMetadata?.device_extraction || null}
                  cardId={currentCard.id}
                  fullscreen={true}
                  hideInlinePinList={true}
                  showPins={showPhonePins}
                  onToggleShowPins={() => setShowPhonePins((s) => !s)}
                />
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* MysteryImage Renderizado aqui dentro */}
                <div className="image-zoom-wrapper">
                  <MysteryImage
                    baseSrc={unifiedMedia.imageUrl || currentCard.image_url}
                    hiddenSrc={currentCard.image_uv_url}
                    filterLayerSrc={filterLayerSrc}
                    filterLayerTransform={filterLayerTransform}
                    filters={{ brightness: filters.brightness, contrast: filters.contrast, saturate: filters.saturation }}
                    revealSettings={fullscreenOnlyTreatment ? null : filterRevealSettings}
                    isUVMode={localUV}
                    fit="contain"
                    className="large-evidence-img"
                    style={{ maxHeight: '100%', maxWidth: '100%' }}
                    forensicChannel={forensicChannel}
                  />
                </div>

                {/* Camada Termal sobreposta (se ativa) */}
                {localThermal && (
                  <canvas ref={thermalCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 40 }} />
                )}
              </div>
            )}
          </div>

          {/* HUD INFERIOR: Ferramentas (Só aparece se não for celular/chat) */}
          {visualMode !== 'phone' && (
            <div className="fullscreen-hud-bottom">

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className={`btn-hud ${localUV ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setLocalUV(!localUV) }}>
                  <Flashlight className="lucide-icon inline-icon" size={15} /> LUZ UV
                </button>

                <button className={`btn-hud ${localThermal ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setLocalThermal(!localThermal) }}>
                  <Thermometer className="lucide-icon inline-icon" size={16} /> TERMAL
                </button>

                <button className={`btn-hud ${forensicMode !== 'none' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setForensicMode(p => p === 'channel' ? 'none' : 'channel') }}>
                  <Microscope className="lucide-icon inline-icon" size={15} /> FORENSE
                </button>

                {forensicMode === 'channel' && (
                  <select
                    className="btn-hud"
                    value={forensicChannel}
                    onChange={e => setForensicChannel(e.target.value as any)}
                    onClick={e => e.stopPropagation()}
                    style={{ appearance: 'none', paddingRight: 30 }}
                  >
                    <option value="all">RGB (Todos)</option>
                    <option value="r">RED (Vermelho)</option>
                    <option value="g">GREEN (Verde)</option>
                    <option value="b">BLUE (Azul)</option>
                  </select>
                )}
              </div>

              {/* Sliders de Tratamento */}
              <div className="hud-sliders">
                <div className="hud-slider-group">
                  <span>BRI</span>
                  <input type="range" min={IMAGE_FILTER_LIMITS.brightness.min} max={IMAGE_FILTER_LIMITS.brightness.max} value={filters.brightness} onChange={e => setFilters(prev => ({ ...prev, brightness: clampImageFilterValue('brightness', Number(e.target.value)) }))} onTouchStart={e => e.stopPropagation()} />
                </div>
                <div className="hud-slider-group">
                  <span>CON</span>
                  <input type="range" min={IMAGE_FILTER_LIMITS.contrast.min} max={IMAGE_FILTER_LIMITS.contrast.max} value={filters.contrast} onChange={e => setFilters(prev => ({ ...prev, contrast: clampImageFilterValue('contrast', Number(e.target.value)) }))} onTouchStart={e => e.stopPropagation()} />
                </div>
                <div className="hud-slider-group">
                  <span>SAT</span>
                  <input type="range" min={IMAGE_FILTER_LIMITS.saturate.min} max={IMAGE_FILTER_LIMITS.saturate.max} value={filters.saturation} onChange={e => setFilters(prev => ({ ...prev, saturation: clampImageFilterValue('saturate', Number(e.target.value)) }))} onTouchStart={e => e.stopPropagation()} />
                </div>
                <button className="btn-hud" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => { setFilters({ brightness: DEFAULT_IMAGE_FILTERS.brightness, contrast: DEFAULT_IMAGE_FILTERS.contrast, saturation: DEFAULT_IMAGE_FILTERS.saturate }); }}>RESET</button>
              </div>
            </div>
          )}
        </div>, document.body
      )}

      {audioExpanderOpen && <AudioViewerModal isOpen={audioExpanderOpen} onClose={() => setAudioExpanderOpen(false)} audioSrc={expanderAudioSrc} title={currentCard?.title || 'REPRODUTOR DE ÁUDIO'} />}

      {shredderModalOpen && <ShredderPuzzleModal isOpen={shredderModalOpen} onClose={() => setShredderModalOpen(false)} imgSrc={unifiedMedia.imageUrl || currentCard.image_url} rows={parsedMetadata?.shred_rows || 1} cols={parsedMetadata?.shred_cols || 8} isGameMaster={isGameMaster} investigationId={currentCard.investigation_id} cardId={currentCard.id} evidenceTitle={currentCard?.title || 'DOCUMENTO TRITURADO'} onPuzzleSolved={() => setPuzzleSolved(true)} />}

      {activeDispatch && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 11500,
            background: 'rgba(4, 8, 14, 0.88)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={clearDispatch}
        >
          <div
            style={{ width: 'min(920px, 100%)', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={clearDispatch}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 10,
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              Fechar Perícia
            </button>
            {activeDispatch.target === 'acoustic_workbench' && activeDispatch.asset.url && (
              <AcousticWorkbench
                audioSrc={activeDispatch.asset.url}
                title={activeDispatch.asset.sourceLabel}
                cardId={activeDispatch.asset.sourceCardId}
              />
            )}
            {activeDispatch.target === 'document_table' && activeDispatch.asset.url && (
              <PhysicalDocumentTable
                title={activeDispatch.asset.sourceLabel}
                cardId={activeDispatch.asset.sourceCardId}
                documentData={{
                  version: 2,
                  frontBaseUrl: activeDispatch.asset.url,
                  layers: [],
                  fragmentation: { mode: 'intact', cols: 1, rows: 1, allowRotation: false, allowFlip: false },
                }}
              />
            )}
          </div>
        </div>
      )}

      <OrdoFieldManualModal isOpen={manualOpen} onClose={closeFieldManual} initialTab={manualInitialTab} />
    </>
  );
}
