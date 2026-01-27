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
import UniversalDecoder from '../tools/UniversalDecoder';
import NumericKeypad from '../tools/NumericKeypad';
import AudioViewerModal from './AudioViewerModal';
import WaveSurfer from 'wavesurfer.js';
import './InspectionModal.css';
import { markPerfKeep } from '../../utils/performance';
import { supabase } from '../../supabaseClient';
import { uploadInvestigationFile } from '../../utils/storage';
import { updateInvestigationCard } from '../../api/investigations';

const GlitchPuzzleSolverLazy = React.lazy(() => import('../tools/GlitchPuzzleSolver'));

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: any;
  onEdit?: () => void;
  isGameMaster: boolean;
  externalBaseId?: string;
  externalHiddenId?: string;
}

export default function InspectionModal({ isOpen, onClose, card, onEdit, isGameMaster, externalBaseId, externalHiddenId }: Props) {
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

  const [isUnlocked, setIsUnlocked] = useState(!isCardLocked(card) || isGameMaster);

  React.useEffect(() => {
    setIsUnlocked(!isCardLocked(card) || isGameMaster);
    setShowGlitchSolver(false);
    setPuzzleSolved(false);
  }, [card, isGameMaster]);

  const [localUV, setLocalUV] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenOnlyTreatment, setFullscreenOnlyTreatment] = useState(false);
  const [showGlitchSolver, setShowGlitchSolver] = useState(false);
  // audio handled as a visual mode tab now
  const [localThermal, setLocalThermal] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [showFilters, setShowFilters] = useState(false);
  const [forensicMode, setForensicMode] = useState<'none' | 'channel' | 'hex' | 'lens' | 'decoder'>('none');
  const [forensicChannel, setForensicChannel] = useState<'all' | 'r' | 'g' | 'b'>('all');
  
  const disableAllBut = (mode: string) => {
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
  };
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const fileRef = React.useRef<HTMLDivElement | null>(null);
  const backdropRef = React.useRef<HTMLDivElement | null>(null);
  const thermalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mark modal root as a performance exception so filters/animations remain functional
  useEffect(() => {
    const el = fileRef.current;
    const cleans: Array<() => void> = [];
    try {
      if (backdropRef.current) cleans.push(markPerfKeep(backdropRef.current));
    } catch {}
    try {
      if (el) cleans.push(markPerfKeep(el));
    } catch {}
    return () => cleans.forEach((c) => { try { c(); } catch {} });
  }, []);
  const [showPhoneDetails, setShowPhoneDetails] = useState(false);
  const [serverCard, setServerCard] = useState<any | null>(null);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const moreToolsBtnRef = useRef<HTMLButtonElement | null>(null);
  const [moreToolsPos, setMoreToolsPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const moreToolsDropdownRef = useRef<HTMLDivElement | null>(null);
  const DROPDOWN_VERTICAL_OFFSET = 40; // increased nudge so dropdown appears further below header buttons

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
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<any | null>(null);

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
        setServerCard(updated);
      } catch (err) {
        console.error('Falha ao persistir solução do puzzle no servidor:', err);
        // fallback: optimistic local update so UI reflects solved state
        const updatedCard: any = { ...cardObj, metadata: nextMetadata };
        if (focused) updatedCard.image_url = focused;
        setServerCard(updatedCard);
        alert('Solução aplicada localmente, mas falha ao salvar no servidor. Tente novamente ou verifique a conexão.');
      }
    })();
  };

  // Controle de qual ferramenta visual está ativa
  // 'image' | 'phone' | 'forense' | ...
  const [visualMode, setVisualMode] = useState<string>('image');

  // Atualiza o modo visual quando o cartão muda (garante que PhoneViewer apareça se houver chat)
  React.useEffect(() => {
    try {
      const unifiedMediaData = resolveUnifiedMedia(card, card?.metadata);
      if (card?.metadata?.type === 'phone' || card?.metadata?.chat_data) setVisualMode('phone');
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
      const canUseThermal = hasThermal && (!thermalKeyword || thermalUnlocked);
      setLocalThermal(canUseThermal);
    } catch (e) {}
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

  // Render thermal canvas when enabled
  React.useEffect(() => {
    const canvas = thermalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (!localThermal) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Use the visible base image for thermal rendering; fall back to UV-only layer if base missing
    const imgSrc = (card && (card.image_url || card.image_uv_url)) || null;
    if (!imgSrc) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;
    img.onload = () => {
      if (cancelled) return;
      try {
        const visual = fileRef.current?.querySelector('.inspect-visual-area') as HTMLElement | null;
        // Use intrinsic image resolution for canvas backing store to preserve aspect ratio and detail
        const naturalW = img.naturalWidth || img.width || 1024;
        const naturalH = img.naturalHeight || img.height || 768;
        canvas.width = Math.max(1, naturalW);
        canvas.height = Math.max(1, naturalH);
        // Ensure canvas element scales to fit the visual container without distorting
        try {
          canvas.style.maxWidth = '100%';
          canvas.style.maxHeight = '100%';
          canvas.style.width = 'auto';
          canvas.style.height = '100%';
          canvas.style.left = '50%';
          canvas.style.top = '50%';
          canvas.style.transform = 'translate(-50%, -50%)';
        } catch (e) {}
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        // IRONBOW mapping (tactical thermal palette)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const val = (r + g + b) / 3; // 0..255

          let red = 0, green = 0, blue = 0;

          if (val < 85) {
            // 0-85: Preto -> Roxo escuro
            const t = val / 85; // 0..1
            red = Math.round((t * 70));
            green = 0;
            blue = Math.round((t * 100));
          } else if (val < 170) {
            // 86-170: Roxo -> Vermelho/Vermelho forte
            const t = (val - 85) / 85; // 0..1
            red = Math.round(70 + (t * (255 - 70)));
            green = 0;
            blue = Math.round(100 - (t * 100));
          } else {
            // 171-255: Vermelho -> Amarelo -> Branco
            const t = (val - 170) / 85; // 0..1
            red = 255;
            green = Math.round(t * 255);
            blue = Math.round(t * 255);
          }

          // clamp and write back
          data[i] = Math.max(0, Math.min(255, red));
          data[i + 1] = Math.max(0, Math.min(255, green));
          data[i + 2] = Math.max(0, Math.min(255, blue));
          // keep alpha untouched (data[i+3])
        }
        ctx.putImageData(imageData, 0, 0);
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, 'rgba(255,80,20,0.06)');
        grad.addColorStop(1, 'rgba(255,255,255,0.02)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        
        // Render secret thermal text if present
        try {
          const thermalText = card?.metadata?.thermal_secret_text;
          if (thermalText && typeof thermalText === 'string' && thermalText.trim()) {
            // Calculate responsive font size based on canvas dimensions
            let baseFontSize = Math.max(48, Math.min(canvas.width, canvas.height) / 12);
            
            // Apply user-configured font size multiplier
            const fontSizeMultiplier = (card?.metadata?.thermal_font_size || 100) / 100;
            baseFontSize = baseFontSize * fontSizeMultiplier;
            
            ctx.font = `bold ${Math.round(baseFontSize)}px 'Courier New', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Split text into lines if too long (wrap at ~40 chars or by newlines)
            const maxLineLength = 40;
            const lines: string[] = [];
            const paragraphs = thermalText.split('\n');
            
            paragraphs.forEach(paragraph => {
              if (paragraph.length <= maxLineLength) {
                lines.push(paragraph);
              } else {
                // Simple word wrap
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
            
            // Position text based on user-configured vertical position
            const lineHeight = baseFontSize * 1.3;
            const totalHeight = lines.length * lineHeight;
            const positionYPercent = (card?.metadata?.thermal_position_y || 50) / 100;
            const startY = (canvas.height * positionYPercent) - (totalHeight / 2) + (lineHeight / 2);
            const centerX = canvas.width / 2;
            
            lines.forEach((line, index) => {
              const y = startY + (index * lineHeight);
              
              // Outer glow (multiple layers for intensity)
              ctx.shadowBlur = 30;
              ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
              ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
              ctx.fillText(line, centerX, y);
              
              // Mid glow
              ctx.shadowBlur = 15;
              ctx.shadowColor = 'rgba(255, 200, 0, 1)';
              ctx.fillStyle = 'rgba(255, 220, 0, 0.6)';
              ctx.fillText(line, centerX, y);
              
              // Core text (hot white)
              ctx.shadowBlur = 5;
              ctx.shadowColor = 'rgba(255, 255, 255, 1)';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
              ctx.fillText(line, centerX, y);
            });
            
            // Reset shadow
            ctx.shadowBlur = 0;
          }
        } catch (e) {
          // ignore thermal text rendering errors
        }
      } catch (e) {
        // ignore
      }
    };
    return () => { cancelled = true; };
  }, [localThermal, card]);

  // Lock body scroll while the modal is open and focus the modal for accessibility
  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // focus the modal container so screen readers and keyboard users land inside it
      setTimeout(() => { fileRef.current?.focus(); }, 0);
    } else {
      document.body.style.overflow = prevOverflow;
    }
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isOpen]);

    if (!isOpen || !(card || serverCard)) return null;

    const currentCard = serverCard || card;

    // Metadata pré-calculado para reuso
    let parsedMetadata: any = {};
    try {
      parsedMetadata = currentCard?.metadata && typeof currentCard.metadata === 'object'
        ? currentCard.metadata
        : (typeof currentCard?.metadata === 'string' ? JSON.parse(currentCard.metadata) : {});
    } catch { parsedMetadata = {}; }
    const isGlitchPuzzleGlobal = currentCard?.type === 'glitch_puzzle' || parsedMetadata?.type === 'glitch_puzzle' || Boolean(parsedMetadata?.glitch_puzzle);
    const unifiedMedia = resolveUnifiedMedia(currentCard, parsedMetadata);
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
        waveColor: 'rgba(0, 243, 255, 0.4)',
        progressColor: '#00f3ff',
        cursorColor: '#ff0066',
        height: 64,
        responsive: true,
        backend: 'MediaElement',
        media: audioElementRef.current || undefined,
        normalize: true,
      });

      waveSurferRef.current = ws;
      ws.load(audioSources.src);

      ws.on('ready', () => {
        const dur = ws.getDuration() || 0;
        setAudioDuration(dur);
      });

      ws.on('audioprocess', () => {
        setAudioPosition(ws.getCurrentTime() || 0);
      });

      ws.on('timeupdate', () => {
        setAudioPosition(ws.getCurrentTime() || 0);
      });

      ws.on('play', () => setAudioIsPlaying(true));
      ws.on('pause', () => setAudioIsPlaying(false));
      ws.on('finish', () => {
        setAudioIsPlaying(false);
        setAudioPosition(0);
      });

      return () => {
        ws.destroy();
        waveSurferRef.current = null;
      };
    }, [visualMode, audioSources.src]);

    // Waveform zoom controls: double-click to zoom near cursor, plus/minus buttons
    React.useEffect(() => {
      const wf = waveformRef.current;
      if (!wf) return;

      const container: HTMLElement = wf;
      container.classList.add('waveform-zoomable');
      if (!container.style.position) container.style.position = 'relative';

      // create controls overlay
      const controls = document.createElement('div');
      controls.className = 'waveform-controls';
      controls.innerHTML = '<button type="button" aria-label="Zoom in" class="zoom-btn">+</button><button type="button" aria-label="Zoom out" class="zoom-btn">−</button>';
      container.appendChild(controls);

      const btns = controls.querySelectorAll('.zoom-btn');
      let currentZoom = 1;

      const setZoom = (z: number, originPercent = 50) => {
        currentZoom = z;
        container.style.transformOrigin = `${originPercent}% 50%`;
        container.style.transition = 'transform 220ms ease';
        container.style.transform = `scale(${currentZoom})`;
        container.dataset.waveformZoom = String(currentZoom);
      };

      const handleDbl = (e: MouseEvent) => {
        try {
          e.stopPropagation();
          const rect = container.getBoundingClientRect();
          const x = (e.clientX - rect.left);
          const percent = Math.max(0, Math.min(100, (x / Math.max(1, rect.width)) * 100));
          const target = currentZoom === 1 ? 1.6 : 1;
          setZoom(target, percent);
        } catch (err) {
          // ignore
        }
      };

      const handleZoomIn = (ev: Event) => { ev.stopPropagation(); setZoom(Math.min(3, currentZoom + 0.2), 50); };
      const handleZoomOut = (ev: Event) => { ev.stopPropagation(); setZoom(Math.max(1, currentZoom - 0.2), 50); };

      container.addEventListener('dblclick', handleDbl);
      if (btns && btns[0]) btns[0].addEventListener('click', handleZoomIn);
      if (btns && btns[1]) btns[1].addEventListener('click', handleZoomOut);

      const keyHandler = (e: KeyboardEvent) => {
        if (document.activeElement && (document.activeElement === wf || wf.contains(document.activeElement))) {
          if (e.key === '+' || e.key === '=') { handleZoomIn(e as any); }
          if (e.key === '-') { handleZoomOut(e as any); }
          if (e.key === '0') { setZoom(1, 50); }
        }
      };
      window.addEventListener('keydown', keyHandler);

      return () => {
        window.removeEventListener('keydown', keyHandler);
        container.removeEventListener('dblclick', handleDbl);
        try { if (btns && btns[0]) btns[0].removeEventListener('click', handleZoomIn); if (btns && btns[1]) btns[1].removeEventListener('click', handleZoomOut); } catch (e) {}
        if (controls.parentElement === container) container.removeChild(controls);
        container.style.transform = '';
        container.style.transformOrigin = '';
        delete container.dataset.waveformZoom;
        container.classList.remove('waveform-zoomable');
      };
    }, [waveformRef, visualMode, audioSources.src]);

    // Image zoom controls: double-click to zoom centered at click, plus/minus buttons, and panning when zoomed
    React.useEffect(() => {
      if (visualMode !== 'image') return;
      const modal = fileRef.current;
      if (!modal) return;

      const container = modal.querySelector('.evidence-display-area') as HTMLElement | null;
      if (!container) return;

      // prefer inner wrapper (uv-container or large-evidence-img) so controls sit on top of the visual layer
      const innerEl = (container.querySelector('.uv-container, .large-evidence-img') as HTMLElement | null) || container;

      // target the image/canvas element inside the inner wrapper
      const imgEl = innerEl.querySelector('img.main-evidence, canvas.thermal-canvas, img') as HTMLElement | null;
      if (imgEl) imgEl.style.willChange = 'transform';

      innerEl.classList.add('image-zoomable');

      const controls = document.createElement('div');
      controls.className = 'image-controls';
      controls.innerHTML = '<button type="button" aria-label="Zoom in" class="img-zoom-btn">+</button><button type="button" aria-label="Zoom out" class="img-zoom-btn">−</button>';
      innerEl.appendChild(controls);

      let currentZoom = 1;
      let offsetX = 0;
      let offsetY = 0;
      let dragging = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let startOffsetX = 0;
      let startOffsetY = 0;

      const applyTransform = () => {
        const target = imgEl || container;
        if (!target) return;
        target.style.transition = 'transform 180ms ease';
        target.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${currentZoom})`;
        if (currentZoom > 1) target.style.cursor = dragging ? 'grabbing' : 'grab';
        else target.style.cursor = 'zoom-in';
        if (innerEl) (innerEl as any).dataset.imageZoom = String(currentZoom);
      };

      const clampOffsets = () => {
        if (!imgEl || !innerEl) return;
        const imgRect = imgEl.getBoundingClientRect();
        const contRect = innerEl.getBoundingClientRect();
        const displayW = imgRect.width * currentZoom;
        const displayH = imgRect.height * currentZoom;
        const maxX = Math.max(0, (displayW - contRect.width) / 2);
        const maxY = Math.max(0, (displayH - contRect.height) / 2);
        offsetX = Math.max(-maxX, Math.min(maxX, offsetX));
        offsetY = Math.max(-maxY, Math.min(maxY, offsetY));
      };

      const setZoom = (z: number, originPercent = 50) => {
        currentZoom = Math.max(1, Math.min(6, z));
        if (imgEl) imgEl.style.transformOrigin = `${originPercent}% 50%`;
        // if resetting to 1, clear offsets
        if (currentZoom <= 1.001) {
          offsetX = 0; offsetY = 0;
        } else {
          clampOffsets();
        }
        applyTransform();
      };

      const handleDbl = (e: MouseEvent) => {
        try {
          e.stopPropagation();
          const rect = innerEl.getBoundingClientRect();
          const x = (e.clientX - rect.left);
          const percent = Math.max(0, Math.min(100, (x / Math.max(1, rect.width)) * 100));
          const targetZoom = currentZoom === 1 ? 2 : 1;
          setZoom(targetZoom, percent);
        } catch (err) {
          // ignore
        }
      };

      const handleZoomIn = (ev: Event) => { ev.stopPropagation(); setZoom(Math.min(6, currentZoom + 0.5), 50); };
      const handleZoomOut = (ev: Event) => { ev.stopPropagation(); setZoom(Math.max(1, currentZoom - 0.5), 50); };

      const onPointerDown = (ev: PointerEvent) => {
        if (currentZoom <= 1) return;
        dragging = true;
        dragStartX = ev.clientX;
        dragStartY = ev.clientY;
        startOffsetX = offsetX;
        startOffsetY = offsetY;
        (ev.target as Element).setPointerCapture?.(ev.pointerId);
        applyTransform();
      };

      const onPointerMove = (ev: PointerEvent) => {
        if (!dragging) return;
        const dx = ev.clientX - dragStartX;
        const dy = ev.clientY - dragStartY;
        offsetX = startOffsetX + dx;
        offsetY = startOffsetY + dy;
        clampOffsets();
        applyTransform();
      };

      const onPointerUp = (ev: PointerEvent) => {
        dragging = false;
        try { (ev.target as Element).releasePointerCapture?.(ev.pointerId); } catch {}
        applyTransform();
      };

      innerEl.addEventListener('dblclick', handleDbl);
      const btns = controls.querySelectorAll('.img-zoom-btn');
      if (btns && btns[0]) btns[0].addEventListener('click', handleZoomIn);
      if (btns && btns[1]) btns[1].addEventListener('click', handleZoomOut);

      const targetForPointers = imgEl || innerEl || container;
      targetForPointers.addEventListener('pointerdown', onPointerDown as any);
      window.addEventListener('pointermove', onPointerMove as any);
      window.addEventListener('pointerup', onPointerUp as any);

      const keyHandler = (e: KeyboardEvent) => {
        if (visualMode !== 'image') return;
        if (e.key === '+' || e.key === '=') { handleZoomIn(e as any); }
        if (e.key === '-') { handleZoomOut(e as any); }
        if (e.key === '0') { setZoom(1, 50); }
      };
      window.addEventListener('keydown', keyHandler);

      // initial reset
      setZoom(1, 50);

      return () => {
        window.removeEventListener('keydown', keyHandler);
        try { innerEl.removeEventListener('dblclick', handleDbl); } catch (e) {}
        try { if (btns && btns[0]) btns[0].removeEventListener('click', handleZoomIn); if (btns && btns[1]) btns[1].removeEventListener('click', handleZoomOut); } catch (e) {}
        try { targetForPointers.removeEventListener('pointerdown', onPointerDown as any); window.removeEventListener('pointermove', onPointerMove as any); window.removeEventListener('pointerup', onPointerUp as any); } catch (e) {}
        try { if (controls.parentElement === innerEl) innerEl.removeChild(controls); } catch (e) {}
        const target = imgEl || innerEl || container;
        if (target) {
          target.style.transform = '';
          target.style.transformOrigin = '';
          target.style.cursor = '';
        }
        try { delete (innerEl as any).dataset.imageZoom; } catch (e) {}
        try { innerEl.classList.remove('image-zoomable'); } catch (e) {}
      };
    }, [visualMode, fileRef, unifiedMedia.imageUrl, currentCard?.image_url]);

    // Renderizador inteligente da Área Visual
    const renderVisualContent = () => {
      // Metadata seguro para detectar subtipos (ex: glitch_puzzle)
      const metadataObj = parsedMetadata;
      const isGlitchPuzzle = isGlitchPuzzleGlobal;

      if (visualMode === 'phone') {
        return (
          <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1a1f'}}>
            <PhoneViewer 
              chatData={_headerChatList} 
              contactName={currentCard.title}
              isLocked={phoneIsLocked}
              password={phonePassword}
              passwordType={parsedMetadata?.phone_lock_type || (typeof phonePassword === 'string' && phonePassword.includes('-') ? 'pattern' : 'pin')}
            />
          </div>
        );
      }

      // If shredded, show puzzle
      if (currentCard.is_shredded) {
        return (
          <ShredderPuzzle
            imgSrc={unifiedMedia.imageUrl || currentCard.image_url}
            rows={currentCard.metadata?.shred_rows || 1}
            cols={currentCard.metadata?.shred_cols || 8}
            onSolved={() => setPuzzleSolved(true)}
            isGameMaster={isGameMaster}
          />
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
            setServerCard(updated);
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
            setServerCard(updated);
          } catch (err) {
            console.error('Erro removendo vídeo', err);
            alert('Falha ao remover vídeo');
          } finally {
            setVideoUploadingInspection(false);
          }
        };

        const videoSrc = unifiedMedia.videoUrl || currentCard.video_url;
        return (
          <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#000'}}>
            <CCTVPlayer src={videoSrc || ''} allowManage={isGameMaster} onReplace={handleReplaceVideo} onRemove={handleRemoveVideo} />
          </div>
        );
      }

      // audio visual mode (HUD compacto)
      if (visualMode === 'audio') {
        const audioSrc = audioSources.src;

        if (!audioSrc) {
          return (<div style={{ color:'#ccc', padding:20 }}>Nenhum arquivo de áudio encontrado para esta evidência.</div>);
        }

        const formatTime = (seconds: number) => {
          if (!Number.isFinite(seconds)) return '00:00';
          const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
          const ss = Math.floor(seconds % 60).toString().padStart(2, '0');
          return `${mm}:${ss}`;
        };

        const handleTogglePlay = () => {
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
            return;
          }
          const el = audioElementRef.current;
          if (!el) return;
          el.currentTime = value;
          setAudioPosition(value);
        };

        return (
          <div style={{width:'100%', height:'100%', display:'flex', flexDirection:'column', gap:12, background:'#000', padding:'16px 18px', boxSizing:'border-box'}}>
            <audio
              ref={audioElementRef}
              src={audioSrc || undefined}
              preload="metadata"
              style={{ display: 'none' }}
              onEnded={() => setAudioIsPlaying(false)}
              onTimeUpdate={(e) => setAudioPosition((e.target as HTMLAudioElement).currentTime || 0)}
              onLoadedMetadata={(e) => setAudioDuration((e.target as HTMLAudioElement).duration || 0)}
            />

            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
              <div style={{color:'#ccc', fontSize:13}}>Reprodutor básico. Use EXPANDIR para análise avançada.</div>
              <a href={audioSrc} target="_blank" rel="noreferrer" style={{color:'#00f3ff', fontSize:12}}>baixar</a>
            </div>

            <div style={{width:'100%', minHeight:70}} ref={waveformRef} />

            <div style={{display:'flex', alignItems:'center', gap:12, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(0,243,255,0.15)', padding:'10px 12px', borderRadius:8}}>
              <button
                onClick={handleTogglePlay}
                className="btn-tool-tab"
                style={{minWidth:110}}
              >
                {audioIsPlaying ? '⏸ Pausar' : '▶ Reproduzir'}
              </button>

              <input
                type="range"
                min={0}
                max={audioDuration || 0}
                step={0.1}
                value={Math.min(audioPosition, audioDuration || 0)}
                onChange={(e) => handleSeek(Number(e.target.value))}
                style={{flex:1, accentColor:'#00f3ff'}}
                aria-label="Linha do tempo do áudio"
              />

              <div style={{display:'flex', alignItems:'center', gap:6, color:'#00f3ff', fontFamily:'Share Tech Mono, monospace', fontSize:12}}>
                <span>{formatTime(audioPosition)}</span>
                <span style={{opacity:0.6}}>/</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

            <div style={{ color: '#777', fontSize: '11px' }}>
              Dica: clique em <span role="img" aria-label="musical note">🎵</span> EXPANDIR para usar espectrograma e controles completos.
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
              <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:18, padding:24, color:'#d5d5d5', textAlign:'center', height:'100%'}}>
                <div style={{position:'relative', width:'100%', maxWidth:640, aspectRatio:'16/9', border:'1px dashed rgba(255,255,255,0.08)', overflow:'hidden', borderRadius:8, background:'#050505'}}>
                  {baseImage ? (
                    <div style={{position:'absolute', inset:0, backgroundImage:`url(${baseImage})`, backgroundSize:'contain', backgroundPosition:'center', backgroundRepeat:'no-repeat', filter:'blur(14px) brightness(0.5)', transform:'scale(1.02)'}} aria-hidden />
                  ) : (
                    <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#777', fontSize:13}}>Pré-visualização mascarada</div>
                  )}
                  <div style={{position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(0,255,255,0.06), rgba(255,0,150,0.08))'}} aria-hidden />
                  <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10}}>
                    <div style={{fontSize:18, fontWeight:700, letterSpacing:1}}>CAMADA CRIPTOGRAFADA</div>
                    <div style={{fontSize:13, maxWidth:400, color:'#c8f7ff'}}>
                      Resolva o painel de sincronização antes de revelar a imagem limpa.
                    </div>
                  </div>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'center'}}>
                  <span style={{fontSize:12, color:'#9ac4ff'}}>Lógica: {securityRevealLogic === 'aligned_keyword' ? 'Alinhar sinal + validar assinatura' : securityRevealLogic === 'always_visible' ? 'Sempre visível' : 'Alinhar sinal'}</span>
                  {securityLayer?.require_keyword && (
                    <span style={{fontSize:12, color:'#ffc78b'}}>Assinatura digital exigida</span>
                  )}
                  <button
                    className="btn-tool-tab"
                    onClick={() => {
                      // At click time we may or may not have a glitch config available.
                      // If none, surface a useful message instead of doing nothing.
                      if (!glitchSolverConfig) {
                        alert('Nenhum puzzle configurado para este cartão. Peça ao Mestre para configurar a camada de segurança.');
                        return;
                      }
                      setShowGlitchSolver(true);
                    }}
                    style={{marginTop:6}}
                  >
                    🧩 ABRIR DECODIFICADOR
                  </button>
                </div>
              </div>
            </div>
          );
        };

        if (securityLocked) return renderSecurityLocked();
        return (
          <div className={`evidence-display-area ${localThermal ? 'termal-mode' : ''}`}>
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
                  <MysteryImage
                    baseSrc={unifiedMedia.imageUrl || currentCard.image_url}
                    hiddenSrc={currentCard.image_uv_url}
                    filterLayerSrc={currentCard.image_filter_layer}
                    filters={{ brightness, contrast, saturate: saturation }}
                    revealSettings={fullscreenOnlyTreatment ? null : reveal}
                    isUVMode={localUV}
                    fit="contain"
                    className="large-evidence-img"
                    style={{ height: '100%', width: '100%' }}
                    forensicChannel={forensicChannel}
                  />
                </>
              );
            })()}

            {localThermal && !fullscreenOpen && (
              <div className="thermal-overlay" aria-hidden="true">
                <canvas className="thermal-canvas" ref={thermalCanvasRef} />
              </div>
            )}

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
      if (_headerChatList && _headerChatList.length > 0) {
        return (
          <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1a1f'}}>
            <PhoneViewer 
              chatData={_headerChatList} 
              contactName={currentCard.title}
              isLocked={phoneIsLocked}
              password={phonePassword}
              passwordType={parsedMetadata?.phone_lock_type || (typeof phonePassword === 'string' && phonePassword.includes('-') ? 'pattern' : 'pin')}
            />
          </div>
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
            <div className="actions"><button className="btn-close" onClick={onClose}>&times;</button></div>
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
  const _maybeMeta = currentCard.metadata && typeof currentCard.metadata === 'object'
    ? currentCard.metadata
    : (typeof currentCard.metadata === 'string' ? (() => { try { return JSON.parse(currentCard.metadata); } catch { return {}; } })() : {});
  const _rawChat = currentCard.chat_data ?? _maybeMeta?.chat_data ?? _maybeMeta?.chat ?? null;
  let _headerChatList: any[] | null = null;
  if (_rawChat) {
    if (typeof _rawChat === 'string') {
      try {
        const parsed = JSON.parse(_rawChat);
        if (Array.isArray(parsed)) _headerChatList = parsed;
        else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.messages)) _headerChatList = parsed.messages;
          else if (Array.isArray(parsed.chat)) _headerChatList = parsed.chat;
          else if (Array.isArray(parsed.data)) _headerChatList = parsed.data;
          else {
            for (const k of Object.keys(parsed)) { if (Array.isArray((parsed as any)[k])) { _headerChatList = (parsed as any)[k]; break; } }
          }
        }
      } catch { _headerChatList = null; }
    } else if (Array.isArray(_rawChat)) {
      _headerChatList = _rawChat;
    } else if (_rawChat && typeof _rawChat === 'object') {
      if (Array.isArray((_rawChat as any).messages)) _headerChatList = (_rawChat as any).messages;
      else if (Array.isArray((_rawChat as any).chat)) _headerChatList = (_rawChat as any).chat;
      else if (Array.isArray((_rawChat as any).data)) _headerChatList = (_rawChat as any).data;
      else {
        for (const k of Object.keys(_rawChat)) { if (Array.isArray((_rawChat as any)[k])) { _headerChatList = (_rawChat as any)[k]; break; } }
      }
    }
  }

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
    // if currently showing image but image was removed and chat exists, switch to phone
    if (visualMode === 'image' && !currentCard.image_url && effectiveHasChat) {
      setVisualMode('phone');
    }
    // if currently showing phone but there's no chat data, and an image exists, switch to image
    if (visualMode === 'phone' && !effectiveHasChat && currentCard.image_url) {
      setVisualMode('image');
    }
  // only run when these change
  }, [visualMode, currentCard.image_url, effectiveHasChat]);

  // derive contact name for header/meta display (prefer explicit column, then metadata, then chat payload)
  const contactNameFromPayload = currentCard.chat_contact_name ?? _maybeMeta?.chat_contact_name ?? null;
  let contactNameInferred: string | null = contactNameFromPayload;
  if (!contactNameInferred && _headerChatList && _headerChatList.length > 0) {
    const first = _headerChatList[0];
    contactNameInferred = first?.contact || first?.name || first?.sender || null;
  }

  const modal = (
    <div className="inspect-backdrop" ref={backdropRef} onClick={onClose}>
      {/* Dropdown portal for the 'MAIS' menu - positioned relative to modal */}
      {showMoreTools && moreToolsPos && (
        <div
          ref={moreToolsDropdownRef}
          style={{
            position: 'absolute',
            left: `${moreToolsPos.left}px`,
            top: `${moreToolsPos.top}px`,
            background: '#111',
            border: '1px solid #222',
            padding: 8,
            zIndex: 400,
            minWidth: 200,
            borderRadius: 6,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
          }}
          onClick={e => e.stopPropagation()}
        >
          {currentCard.audio_url && (
            <button type="button" className={`btn-tool-tab ${visualMode === 'audio' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { setVisualMode('audio'); setShowMoreTools(false); }}>📻 INVESTIGAR ÁUDIO</button>
          )}
          {(() => {
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
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  opacity: isLocked ? 0.5 : 1,
                  cursor: isLocked ? 'not-allowed' : 'pointer'
                }}
                onClick={() => {
                  if (isLocked) {
                    alert(`🔒 Modo Termal bloqueado. Use o Terminal de Busca para encontrar a palavra-chave.`);
                    return;
                  }
                  setLocalThermal(!localThermal);
                  setShowMoreTools(false);
                }}
                title={isLocked ? 'Use o Terminal de Busca para desbloquear' : 'Ativar visão termográfica'}
              >
                🌡️ TERMAL {isLocked ? '🔒' : ''}
              </button>
            );
          })()}
          <button type="button" className={`btn-tool-tab ${forensicMode === 'channel' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('forense'); setShowMoreTools(false); }}>🔬 FORENSE</button>
          <button type="button" className={`btn-tool-tab ${forensicMode === 'hex' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('hex'); setShowMoreTools(false); }}>⌨ INSPECIONAR CÓDIGO</button>
          <button type="button" className={`btn-tool-tab ${forensicMode === 'decoder' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('decoder'); setShowMoreTools(false); }}>🔐 DECODIFICADOR</button>
          <button type="button" className={`btn-tool-tab ${forensicMode === 'lens' ? 'active-purple' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('lens'); setShowMoreTools(false); }}>🧿 TRADUZIR</button>
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
        <div className="inspect-header">
          {(!isCardLocked(card) || isUnlocked || isGameMaster) ? (
            <>
              <div className="meta-info">
                <span className="case-stamp">EVIDÊNCIA #{String(currentCard.id || '').slice(0, 4)}</span>
                {cardLocked && (
                  <span title="Evidência protegida" style={{ marginLeft: 8, color: '#f39c12', fontWeight: 700 }}>🔒</span>
                )}
                {hasRecord && (
                  <span title="Prontuário disponível" style={{ marginLeft: 8, color: '#9ee7c8', fontWeight: 700 }}>🧾</span>
                )}
                {currentCard.metadata?.type && <span className="type-tag">{currentCard.metadata.type}</span>}
                {contactNameInferred && (
                  <span className="chat-contact">{contactNameInferred}</span>
                )}

                {/* Toggle buttons for available media types */}
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {card.image_url && <button className={`btn-tool-tab ${visualMode === 'image' ? 'active-green' : ''}`} onClick={() => setVisualMode('image')}>FOTO</button>}
                    {currentCard.video_url && <button className={`btn-tool-tab ${visualMode === 'video' ? 'active-green' : ''}`} onClick={() => setVisualMode('video')}>VÍDEO</button>}
                    {(currentCard.audio_url || unifiedMedia.audioUrl || parsedMetadata?.audio_url || parsedMetadata?.audio || parsedMetadata?.audio_base_url) && <button className={`btn-tool-tab ${visualMode === 'audio' ? 'active-green' : ''}`} onClick={() => setVisualMode('audio')}>ÁUDIO</button>}
                    {_headerChatList && _headerChatList.length > 0 && <button className={`btn-tool-tab ${visualMode === 'phone' ? 'active-green' : ''}`} onClick={() => setVisualMode('phone')}>CHATS</button>}
                </div>
              </div>
              <div className="actions">
                <button 
                  className="btn-tool-tab btn-expand" 
                  title={visualMode === 'audio' ? 'Expandir para tela cheia' : visualMode === 'phone' ? 'Expandir celular' : 'Expandir imagem'}
                  onClick={(e)=>{ 
                    e.stopPropagation();
                    
                    // Prevenir múltiplos cliques simultâneos
                    if (audioExpanderLockRef.current) {
                      console.warn('[InspectionModal] Clique bloqueado - já em processamento');
                      return;
                    }
                    
                    audioExpanderLockRef.current = true;
                    console.log('[InspectionModal] Expandir button clicked, visualMode:', visualMode);
                    
                    if (visualMode === 'audio') {
                      const meta = parsedMetadata;
                      const audioSrc = unifiedMedia.audioUrl || currentCard.audio_url || meta?.audio_url || meta?.audio || meta?.audioUrl || null;
                      console.log('[InspectionModal] Audio expand - audioSrc:', audioSrc);
                      
                      if (audioSrc) {
                        console.log('[InspectionModal] Setting expanderAudioSrc to:', audioSrc);
                        setExpanderAudioSrc(String(audioSrc));
                        
                        setTimeout(() => {
                          setAudioExpanderOpen(true);
                          console.log('[InspectionModal] Audio modal opened');
                          audioExpanderLockRef.current = false;
                        }, 50);
                      } else {
                        console.warn('[InspectionModal] No audio source found');
                        audioExpanderLockRef.current = false;
                      }
                    } else {
                      console.log('[InspectionModal] Opening fullscreen for visualMode:', visualMode);
                      setFullscreenOpen(true);
                      audioExpanderLockRef.current = false;
                    }
                  }}
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                >
                  {visualMode === 'audio' ? '🎵 EXPANDIR' : visualMode === 'phone' ? '📱 EXPANDIR' : '🔍 EXPANDIR'}
                </button>

                <button className={`btn-tool-tab ${showFilters ? 'active-green' : ''}`} onClick={() => disableAllBut('filters')}>🧪 TRATAMENTO</button>

                <button className={`btn-tool-tab ${localUV ? 'active-purple' : ''}`} onClick={() => setLocalUV(!localUV)}>🔦 LUZ UV</button>

                {isGlitchPuzzleGlobal && (
                  <button
                    className={`btn-tool-tab ${showGlitchSolver ? 'active-green' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setShowGlitchSolver(true); }}
                  >
                    🧩 DECODIFICAR
                  </button>
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

                <button className="btn-close" onClick={onClose}>&times;</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button className="btn-close" onClick={onClose}>✖</button>
            </div>
          )}
        </div>

        {/* debug overlay removed */}

        {/* --- CONTEÚDO PRINCIPAL --- */}
        {!(isUnlocked || isGameMaster) ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            {(() => {
              const lockPass = card.lock_password;
              const isNumeric = lockPass && /^\d+$/.test(String(lockPass));
              if (isNumeric) {
                return <NumericKeypad code={lockPass} onUnlock={() => setIsUnlocked(true)} />;
              }
              return (
                <HackingTerminal
                  correctPassword={lockPass}
                  onUnlock={() => setIsUnlocked(true)}
                  hint={card.description_public}
                />
              );
            })()}
          </div>
        ) : (
          <React.Fragment>
            <div className={`inspect-visual-area ${isGlitchPuzzleGlobal && showGlitchSolver ? 'is-glitching glitch-mode' : ''}`} style={{ position: 'relative' }}>
              {renderVisualContent()}
              {visualMode === 'phone' && (
                <button
                  onClick={() => setShowPhoneDetails(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: 12, zIndex: 80,
                    background: 'rgba(0,0,0,0.45)', color: '#fff', border: '1px solid rgba(255,255,255,0.06)',
                    padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12
                  }}
                >
                  {showPhoneDetails ? 'Ocultar Metadados' : 'Mostrar Metadados'}
                </button>
              )}

              {showFilters && (
                <div className="filters-overlay-panel">
                  <div className="filter-row">
                    <label>BRILHO {brightness}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min="0" max="300" value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
                      <input className="filter-number" type="number" min="0" max="300" value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="filter-row">
                    <label>CONTRASTE {contrast}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min="0" max="300" value={contrast} onChange={e => setContrast(Number(e.target.value))} />
                      <input className="filter-number" type="number" min="0" max="300" value={contrast} onChange={e => setContrast(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="filter-row">
                    <label>SATURAÇÃO {saturation}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} />
                      <input className="filter-number" type="number" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} />
                    </div>
                  </div>
                  <button className="btn-reset-filters" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}>RESET</button>
                </div>
              )}

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
                    <UniversalDecoder />
                  </div>
                </div>
              )}

              {forensicMode === 'lens' && (
                <div className="tools-hud-panel">
                  <div className="hud-title">🧿 TRADUZIR</div>
                  <div style={{ width: '100%' }}>
                    <DecipherLens realText={currentCard.metadata?.real_text} cipherText={currentCard.metadata?.cipher_text} />
                  </div>
                </div>
              )}

              {forensicMode === 'hex' && (
                <div className="tools-hud-panel">
                  <div className="hud-title">⌨️ INSPETOR HEXADECIMAL</div>
                  <div style={{ width: '100%' }}>
                    <HexViewer hiddenMessage={currentCard.metadata?.hex_code || currentCard.metadata?.hex_hidden_message || ''} />
                  </div>
                </div>
              )}

              {/* audio is displayed via the 'audio' visual mode/tab now */}
            </div>

            {visualMode !== 'phone' && (
              <div className="inspect-details">
           
           {/* Coluna com SCROLL automático */}
           <div className="text-col">
              <h2>{card.title}</h2>
              
              <span className="desc-title">DESCRIÇÃO:</span>
              <p className="public-desc">
                 {card.description_public || "Nenhuma descrição fornecida."}
              </p>

              {isGameMaster && card.description_hidden && (
                 <div className="gm-note">
                    <strong style={{color:'#c6a45f'}}>🔒 NOTAS DO MESTRE:</strong><br/>
                    {card.description_hidden}
                 </div>
              )}

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
                          <img src={megaClueMeta.image_url} alt="Verdade final" style={{ maxWidth: '100%', borderRadius: 6 }} />
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
                    <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #333' }}>
                      <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>📋 Informações do Arquivo</div>
                      {Object.entries(card.metadata.field_values || {}).map(([key, val]: any) => {
                        // Só mostra se tem valor real
                        if (!val && val !== 0) return null;
                        
                        const labelMap: Record<string, string> = {
                          date_created: '📅 Data',
                          gps_coords: '📍 Localização',
                          device_owner: '👤 Proprietário',
                          camera_model: '📷 Câmera',
                          technical_note: '🔧 Nota Técnica',
                          chat_contact_name: '💬 Contato',
                          stamp: '🔖 Carimbo',
                          external_link: '🔗 Link Externo'
                        };
                        const label = labelMap[key] || key;
                        return (
                          <div key={key} style={{display:'flex', flexDirection:'column', borderBottom:'1px solid #222', padding:'6px 0'}}>
                            <span style={{color:'#c6a45f', fontSize:11}}>{label}:</span>
                            <div style={{color:'#ddd', fontSize:12, marginTop:2}}>
                              {key === 'gps_coords' && typeof val === 'string' ? (
                                <a href={`https://maps.google.com/?q=${val}`} target="_blank" rel="noreferrer" style={{color:'#4a9eff'}}>
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
                        <div style={{display:'flex', flexDirection:'column', gap: 8}}>
                          <div><strong>Nome:</strong> {personData.name || '—'}</div>
                          <div><strong>Profissão:</strong> {personData.occupation || '—'}</div>
                          <div><strong>Status:</strong> <span style={{color: personData.status && String(personData.status).toLowerCase().includes('dead') ? '#b33' : '#2ecc71'}}>{personData.status || '—'}</span></div>
                        </div>
                      );
                    })()}
                  </div>
                )}
           </div>

           {/* Coluna de Botões Fixos */}
           <div className="controls-col" style={{display:'flex', flexDirection:'column', gap:10, width: 200, flexShrink:0}}>
              {isGameMaster && (
                 <button className="btn-edit-ref" onClick={() => { onClose(); onEdit?.(); }}>
                    ✎ EDITAR DADOS
                 </button>
              )}
              
              {/* Exemplo de botão extra se for pessoa */}
              {card.metadata?.type === 'person' && (
                 <div style={{padding:10, background:'#222', border:'1px solid #444', textAlign:'center', fontSize:10}}>
                    STATUS: <br/>
                    <strong style={{
                      color: card.metadata.person?.status === 'DEAD' ? '#e74c3c' : card.metadata.person?.status === 'MIA' ? '#f39c12' : '#2ecc71',
                      fontSize:14
                    }}>
                      {card.metadata.person?.status === 'ALIVE' ? 'VIVO' : card.metadata.person?.status === 'DEAD' ? 'MORTO' : card.metadata.person?.status === 'MIA' ? 'DESAPARECIDO' : 'DESCONHECIDO'}
                    </strong>
                 </div>
              )}
           </div>

        </div>
            )}

            {visualMode === 'phone' && showPhoneDetails && (
              <div style={{ width: '100%', borderTop: '1px solid #222', background: '#0b0b0b', padding: 16 }}>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
                    <div style={{ paddingRight: 10 }}>
                      <h2 style={{ color: '#f2f2f2', marginTop: 0 }}>{card.title}</h2>
                      <span className="desc-title">DESCRIÇÃO:</span>
                      <p className="public-desc">{card.description_public || 'Nenhuma descrição fornecida.'}</p>

                      {isGameMaster && card.description_hidden && (
                        <div className="gm-note">
                          <strong style={{color:'#c6a45f'}}>🔒 NOTAS DO MESTRE:</strong><br/>
                          {card.description_hidden}
                        </div>
                      )}

                      {card.metadata && Object.keys(card.metadata).length > 0 && (
                        <div className="metadata-box" style={{ marginTop: 12 }}>
                          <h4>METADADOS TÉCNICOS</h4>
                          {Object.entries(card.metadata || {}).map(([key, val]: any) => {
                            if(['excalidraw_data', 'chat_data', 'type', 'status', 'image_filter_reveal', 'image_filter_layer', 'image_filter', 'phone_password', 'phone_locked', 'field_values'].includes(key)) return null;
                            if (!val && val !== 0) return null;
                            let displayVal: any = val;
                            if (typeof val === 'object') {
                              if (key === 'person' || key === 'person_meta') {
                                displayVal = (
                                  <div style={{fontSize: 12, marginLeft: 5}}>
                                    <div style={{color:'#ddd'}}><b>Nome:</b> {val.name || '—'}</div>
                                    <div style={{color:'#ddd'}}><b>Profissão:</b> {val.occupation || '—'}</div>
                                    <div style={{color: val.status && String(val.status).toLowerCase().includes('dead') ? '#b33' : '#2ecc71'}}><b>Estado:</b> {val.status || '—'}</div>
                                  </div>
                                );
                              } else {
                                displayVal = JSON.stringify(val, null, 2);
                              }
                            }
                            return (
                              <div key={key} style={{display:'flex', flexDirection:'column', borderBottom:'1px solid #222', padding:'6px 0'}}>
                                <span style={{color:'#666', fontSize:11, textTransform:'uppercase'}}>{key}:</span>
                                <div style={{color:'#aaa', fontSize:12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak:'break-word', marginTop:4}}>
                                  {displayVal}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ width: 200, flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {isGameMaster && (
                        <button className="btn-edit-ref" onClick={() => { onClose(); onEdit?.(); }}>
                          ✎ EDITAR DADOS
                        </button>
                      )}
                      {card.metadata?.type === 'person' && (
                        <div style={{padding:10, background:'#222', border:'1px solid #444', textAlign:'center', fontSize:10}}>
                          STATUS: <br/>
                          <strong style={{
                            color: card.metadata.person?.status === 'DEAD' ? '#e74c3c' : card.metadata.person?.status === 'MIA' ? '#f39c12' : '#2ecc71',
                            fontSize:14
                          }}>
                            {card.metadata.person?.status === 'ALIVE' ? 'VIVO' : card.metadata.person?.status === 'DEAD' ? 'MORTO' : card.metadata.person?.status === 'MIA' ? 'DESAPARECIDO' : 'DESCONHECIDO'}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );

  const glitchSolverConfig = React.useMemo(() => {
    if (!parsedMetadata?.glitch_puzzle) return null;
    const security = parsedMetadata.glitch_puzzle.security_layer || parsedMetadata.security_layer;
    return security ? { ...parsedMetadata.glitch_puzzle, security_layer: security } : parsedMetadata.glitch_puzzle;
  }, [parsedMetadata]);

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
                <button className="btn-tool-tab" onClick={() => setShowGlitchSolver(false)}>✖</button>
              </div>
            </div>
            <div className="glitch-solver-body">
              <React.Suspense fallback={<div style={{color:'#0f0', padding:20, textAlign:'center'}}>CARREGANDO DECODIFICADOR...</div>}>
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
      
      {/* Fullscreen Modal para Imagens e Phone */}
      {fullscreenOpen && createPortal(
        <div style={{position:'fixed', inset:0, zIndex:30000, background:'rgba(0,0,0,0.95)', display:'flex', flexDirection:'column'}} onClick={() => setFullscreenOpen(false)}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:12}} onClick={(e)=>e.stopPropagation()}>
            <div style={{color:'#fff'}}>EVIDÊNCIA #{String(currentCard.id || '').slice(0,6)}</div>
            <div style={{display:'flex', gap:8}}>
              {visualMode !== 'phone' && (
                <>
                  <button className="btn-tool-tab" onClick={e=>{ e.stopPropagation(); setLocalUV(prev=>!prev); }}>{localUV? 'UV ON':'UV OFF'}</button>
                  <button className={`btn-tool-tab ${localThermal ? 'active-green' : ''}`} onClick={e=>{ e.stopPropagation(); setLocalThermal(prev=>!prev); }}>{localThermal ? 'TERMAL ON' : 'TERMAL'}</button>
                  <button className={`btn-tool-tab ${forensicMode !== 'none' ? 'active-green' : ''}`} onClick={e=>{ e.stopPropagation(); setForensicMode(prev => prev === 'channel' ? 'none' : 'channel'); }}>{forensicMode !== 'none' ? 'FORENSE ON' : 'FORENSE'}</button>
                  <select value={forensicChannel} onChange={e=>setForensicChannel(e.target.value as any)} style={{marginLeft:6}} onClick={e=>e.stopPropagation()}>
                    <option value="all">ALL</option>
                    <option value="r">R</option>
                    <option value="g">G</option>
                    <option value="b">B</option>
                  </select>
                  <button className={`btn-tool-tab ${fullscreenOnlyTreatment ? 'active-green' : ''}`} onClick={e=>{ e.stopPropagation(); setFullscreenOnlyTreatment(prev=>!prev); }}>{fullscreenOnlyTreatment ? 'TRATAR SÓ NA EXPANSÃO' : 'TRATAR NA TELA'}</button>
                  <button className="btn-tool-tab" onClick={e=>{ e.stopPropagation(); setBrightness(100); setContrast(100); setSaturation(100); }}>RESET</button>
                </>
              )}
              <button className="btn-tool-tab" onClick={e=>{ e.stopPropagation(); setFullscreenOpen(false); }}>FECHAR</button>
            </div>
          </div>
          <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={e=>e.stopPropagation()}>
            {visualMode === 'phone' ? (
              <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <PhoneViewer 
                  chatData={_headerChatList} 
                  contactName={currentCard.title}
                  isLocked={phoneIsLocked}
                  password={phonePassword}
                  passwordType={parsedMetadata?.phone_lock_type || (typeof phonePassword === 'string' && phonePassword.includes('-') ? 'pattern' : 'pin')}
                  fullscreen={true}
                />
              </div>
            ) : (
              <div style={{width:'90%', height:'90%', position:'relative'}}>
                <MysteryImage
                  baseSrc={unifiedMedia.imageUrl || currentCard.image_url}
                  hiddenSrc={currentCard.image_uv_url}
                  filterLayerSrc={currentCard.image_filter_layer}
                  filters={{ brightness, contrast, saturate: saturation }}
                  revealSettings={(() => {
                    let reveal: any = null;
                    try {
                      const m = currentCard.metadata && typeof currentCard.metadata === 'object'
                        ? currentCard.metadata
                        : (typeof currentCard.metadata === 'string' ? JSON.parse(currentCard.metadata) : {});
                      reveal = m?.image_filter_reveal ?? null;
                    } catch (e) { reveal = null; }
                    return reveal;
                  })()}
                  isUVMode={localUV}
                  fit="contain"
                  className="large-evidence-img"
                  style={{ height: '100%', width: '100%' }}
                  forensicChannel={forensicChannel}
                />
                {localThermal && (
                  <canvas ref={thermalCanvasRef} style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:40}} />
                )}
              </div>
            )}
          </div>
          {visualMode !== 'phone' && (
          <div style={{padding:12, display:'flex', gap:12, alignItems:'center', justifyContent:'center'}} onClick={e=>e.stopPropagation()}>
            <label style={{color:'#fff'}}>BRILHO {brightness}%</label>
            <input type="range" min={0} max={300} value={brightness} onChange={e=>setBrightness(Number(e.target.value))} />
            <label style={{color:'#fff'}}>CONTRASTE {contrast}%</label>
            <input type="range" min={0} max={300} value={contrast} onChange={e=>setContrast(Number(e.target.value))} />
            <label style={{color:'#fff'}}>SAT {saturation}%</label>
            <input type="range" min={0} max={300} value={saturation} onChange={e=>setSaturation(Number(e.target.value))} />
          </div>
          )}
        </div>, document.body
      )}
      
      <AudioViewerModal
        isOpen={audioExpanderOpen}
        onClose={() => setAudioExpanderOpen(false)}
        audioSrc={expanderAudioSrc}
        title={currentCard?.title || 'REPRODUTOR DE ÁUDIO'}
      />
    </>
  );
}
