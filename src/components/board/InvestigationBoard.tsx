import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../api/investigations';
import * as connApi from '../../api/connections';
import InvestigationCardModal from '../modals/InvestigationCardModal';
import InviteModal from '../modals/InviteModal';
// Lazy load do modal pesado (2214 linhas) para reduzir bundle inicial
const CreateClueModal = React.lazy(() => import('../modals/CreateClueModal_Refactored'));
const CreateClueModalLegacy = React.lazy(() => import('../modals/CreateClueModal'));
import Sketchpad from '../tools/Sketchpad';
import TerminalSearch from './TerminalSearch';
import { playAudio } from '../../utils/audio';
import { uploadInvestigationImage, uploadInvestigationFile } from '../../utils/storage';
import { supabase } from '../../supabaseClient';
import Toast from '../../components/ui/Toast';
import ConspiracyBoard from './ConspiracyBoard';
import MysteryImage from './MysteryImage';
import './MysteryEffects.css';
import './EvidenceCard.css';
import './investigation.css';
import EvidenceCard from './EvidenceCard';
import { organizeByTimeline, organizeByElement } from '../../utils/layoutAlgorithms';
import InspectionModal from '../modals/InspectionModal';
import DoomsdayClock from '../ui/DoomsdayClock';
import SystemTerminal from '../tools/SystemTerminal';
import UniversalDecoder from '../tools/UniversalDecoder';
import GlitchMaker from '../tools/GlitchMaker';
import CodePromptModal, { CodePromptResult } from '../modals/CodePromptModal';
import { useGlobalMouseEvents } from '../../hooks/useGlobalMouseEvents';
import CreatorHub from '../modals/CreatorHub';
const GMOverwatch = React.lazy(() => import('./GMOverwatch'));
import { useIsMobile } from '../../hooks/useIsMobile';
import { useWindowSize } from '../../hooks/useWindowSize';
import BottomSheet from '../ui/BottomSheet';
import usePerformanceMode from '../../utils/usePerformanceMode';
import BottomNavigationBar from '../BottomNavigationBar';
// Local fallback for BoardButton (avoids missing module error)
const BoardButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'default' }> = ({ variant, children, className, ...props }) => {
  const base = 'board-button';
  const vclass = variant === 'primary' ? 'board-button--primary' : '';
  return (
    <button {...props} className={`${base} ${vclass} ${className || ''}`.trim()}>
      {children}
    </button>
  );
};
const LOCKED_PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAwEB/aurbZkAAAAASUVORK5CYII=';
interface Props {
  investigationId: string;
}

export const InvestigationBoard = React.memo(function InvestigationBoard({ investigationId }: Props) {
  const navigate = useNavigate();
  const [cards, setCards] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [createModalPos, setCreateModalPos] = useState<{ x: number; y: number } | null>(null);
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [showLegacyModal, setShowLegacyModal] = useState(false);

  const [zoom, setZoom] = useState(0.9);
  const [isUV, setIsUV] = useState(false);
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number; over: boolean } | null>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const {
    enabled: performanceMode,
    extended: extendedPerformanceMode,
    preset: performancePreset,
    setEnabled: setPerformanceMode,
    setExtended: setExtendedPerformanceMode,
    setPreset: setPerformancePreset,
    toggle: togglePerformanceMode,
  } = usePerformanceMode();

  // rAF batching to reduce state churn while dragging/panning
  const positionFrameRef = useRef<number | null>(null);
  const pendingPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const originFrameRef = useRef<number | null>(null);
  const pendingOriginRef = useRef<{ x: number; y: number } | null>(null);

  const flushPendingPositions = () => {
    const pending = pendingPositionsRef.current;
    const keys = Object.keys(pending);
    if (!keys.length) return;
    pendingPositionsRef.current = {};
    setLocalPositions((prev) => {
      const next = { ...prev };
      keys.forEach((id) => { next[id] = pending[id]; });
      return next;
    });
  };

  const schedulePositionUpdate = (id: string, pos: { x: number; y: number }) => {
    pendingPositionsRef.current[id] = pos;
    if (positionFrameRef.current === null) {
      positionFrameRef.current = requestAnimationFrame(() => {
        positionFrameRef.current = null;
        flushPendingPositions();
      });
    }
  };

  const flushPendingOrigin = () => {
    if (!pendingOriginRef.current) return;
    const next = pendingOriginRef.current;
    pendingOriginRef.current = null;
    setOrigin(next);
  };

  const scheduleOriginUpdate = (x: number, y: number) => {
    pendingOriginRef.current = { x, y };
    if (originFrameRef.current === null) {
      originFrameRef.current = requestAnimationFrame(() => {
        originFrameRef.current = null;
        flushPendingOrigin();
      });
    }
  };

  useEffect(() => {
    return () => {
      if (positionFrameRef.current !== null) cancelAnimationFrame(positionFrameRef.current);
      if (originFrameRef.current !== null) cancelAnimationFrame(originFrameRef.current);
    };
  }, []);

  // DEV: delegated click logger for toolbar elements to diagnose inert buttons
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const toolbar = document.querySelector('.investigation-toolbar');
    if (!toolbar) return;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      const btn = target.closest && (target.closest('.hud-btn') || target.closest('.board-button')) as HTMLElement | null;
      if (btn) {
        console.debug('DEV: toolbar click detected', { tag: target.tagName, classes: btn.className, text: btn.innerText });
      }
    };
    toolbar.addEventListener('click', handler);
    return () => toolbar.removeEventListener('click', handler);
  }, []);

  // Refs to hold latest zoom and origin for global listeners (avoid stale closures)
  const zoomRef = useRef(zoom);
  const originRef = useRef(origin);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { originRef.current = origin; }, [origin]);
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [doomsdayTarget, setDoomsdayTarget] = useState<number | null>(null);
  const [playerView, setPlayerView] = useState<boolean>(() => true);
  const isMobile = useIsMobile();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  // Mobile touch mode: 'pan' = move camera, 'interact' = select/drag cards
  const isMobileDevice = isMobile;
  const [touchMode, setTouchMode] = useState<'pan' | 'interact'>(isMobileDevice ? 'pan' : 'interact');
  const [touchModeNotice, setTouchModeNotice] = useState<string | null>(null);
  // Pinch-to-zoom states
  const [isPinching, setIsPinching] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const selectedIdsRef = useRef<string[]>([]);

  const canEdit = isGameMaster && !playerView;
  const viewerMode = isGameMaster ? playerView : true;
  const [inspectCard, setInspectCard] = useState<any | null>(null);
  const [unlockingCard, setUnlockingCard] = useState<any | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [decoderOpen, setDecoderOpen] = useState(false);
  const [caseTitle, setCaseTitle] = useState('CARREGANDO...');
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const marqueeStartRef = useRef<{ sx: number; sy: number; bx: number; by: number } | null>(null);
  const [connectionColor, setConnectionColor] = useState<string>('#9a2b2b');
  const [connectionType, setConnectionType] = useState<'confirmed'|'theory'|'mystic'>('confirmed');
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // localPositions used while dragging to avoid frequent re-fetches
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);
  const [sketchOpen, setSketchOpen] = useState(false);
  const [sketchInitialData, setSketchInitialData] = useState<any | null>(null);
  const [editingSketchId, setEditingSketchId] = useState<string | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const EMBED_EXCALIDRAW_JSON_LIMIT = 8 * 1024; // 8KB
  const [showSharedBoard, setShowSharedBoard] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [gmOverwatchOpen, setGmOverwatchOpen] = useState(false);
  const [showHiddenClues, setShowHiddenClues] = useState(false);
  const [showFinder, setShowFinder] = useState(false);
  const [showOrganizeMenu, setShowOrganizeMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [contextMenu, setContextMenu] = useState<null | { type: 'card' | 'bg'; targetId?: string; x: number; y: number }>(null);
  
  // Terminal search feedback
  const [terminalMessage, setTerminalMessage] = useState<string | null>(null);
  
  // Decodificador de Anomalias - Sistema de desbloqueio
  const [decoderUnlocked, setDecoderUnlocked] = useState(false);
  const [showDecoderModal, setShowDecoderModal] = useState(false);
  const [showCodePrompt, setShowCodePrompt] = useState(false);
  const anyModalOpen = modalOpen || createModalOpen || inviteOpen || Boolean(inspectCard) || Boolean(unlockingCard) || terminalOpen || decoderOpen || showDecoderModal || showCodePrompt || sketchOpen;

  // Hide HUD/header overlays while any modal is active
  useEffect(() => {
    const eventName = anyModalOpen ? 'modal-opened' : 'modal-closed';
    window.dispatchEvent(new Event(eventName));
    return () => { window.dispatchEvent(new Event('modal-closed')); };
  }, [anyModalOpen]);

  const boardRef = useRef<HTMLDivElement>(null);
  // draggingRef stores info about the currently dragged card(s)
  const draggingRef = useRef<{
    id: string;
    // for single-card quick anchor
    offsetX?: number;
    offsetY?: number;
    isDragging?: boolean;
    hasMoved?: boolean;
    startX?: number;
    startY?: number;
    // legacy fields kept for multi-select support
    origPositions?: Record<string, { x: number; y: number }>;
    pointerOffsets?: Record<string, { ox: number; oy: number }>;
    origX?: number;
    origY?: number;
    startWorldX?: number;
    startWorldY?: number;
  } | null>(null);
  const panningRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  // Ref mirror of localPositions to avoid stale closures inside global listeners
  const localPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const saveQueueRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    localPositionsRef.current = localPositions;
  }, [localPositions]);

  // Convert screen pixel coordinates to board/world coordinates considering zoom and origin
  const getWorldPosition = (clientX: number, clientY: number) => {
    const board = boardRef.current?.getBoundingClientRect();
    if (!board) return { x: 0, y: 0 };
    // (Mouse - board.left) / zoom + origin
    return {
      x: (clientX - board.left) / zoomRef.current + originRef.current.x,
      y: (clientY - board.top) / zoomRef.current + originRef.current.y,
    };
  };

  const loadBoard = async () => {
    try {
      const [cData, connData] = await Promise.all([
        api.fetchCards(investigationId),
        connApi.fetchConnections(investigationId),
      ]);
      console.debug('InvestigationBoard.loadBoard: fetched cards', cData);
      setCards(cData || []);
      // initialize localPositions for cards
      setLocalPositions((prev) => {
        const next = { ...prev };
        (cData || []).forEach((c: any) => {
          if (!next[c.id]) next[c.id] = { x: c.x || 100, y: c.y || 100 };
        });
        console.debug('InvestigationBoard.loadBoard: initial localPositions', next);
        return next;
      });
      setConnections(connData || []);
    } catch (e) {
      console.error('Erro ao carregar quadro', e);
    }
  };

  // Terminal / ARG search: reveals a hidden card based on keyword_unlock (exact or ilike)
  const handleThermalUnlock = async (keyword: string): Promise<{ success: boolean; message: string; card?: any }> => {
    const q = keyword.trim();
    if (!q) {
      return { success: false, message: 'Palavra-chave vazia.' };
    }
    try {
      const { data, error } = await supabase
        .from('investigation_cards')
        .select('*')
        .eq('investigation_id', investigationId)
        .limit(300);

      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: false, message: 'Nenhum arquivo disponível nesta investigação.' };
      }

      const lowered = q.toLowerCase();
      const thermalCard = data.find((row: any) => {
        try {
          const meta = row.metadata || (row.data && row.data.metadata) || null;
          if (meta) {
            const km = typeof meta === 'string' ? (() => { try { return JSON.parse(meta); } catch { return null; } })() : meta;
            const thermalKeyword = km && km.thermal_keyword;
            if (thermalKeyword && String(thermalKeyword).toLowerCase() === lowered) {
              return true;
            }
          }
        } catch (e) {
          // ignore parse errors
        }
        return false;
      });

      if (thermalCard) {
        try {
          const meta = typeof (thermalCard as any).metadata === 'string' ? JSON.parse((thermalCard as any).metadata) : ((thermalCard as any).metadata || {});
          meta.thermal_unlocked = true;
          await api.updateInvestigationCard((thermalCard as any).id, { metadata: meta } as any);
          try { playAudio('/sounds/success_chime.mp3'); } catch {}
          await loadBoard();
          return { success: true, message: 'Modo termal desbloqueado com sucesso.', card: thermalCard };
        } catch (err) {
          console.error('Error unlocking thermal mode', err);
          return { success: false, message: 'Erro ao processar desbloqueio.' };
        }
      }

      return { success: false, message: 'Palavra-chave não reconhecida pelo sistema.' };
    } catch (err: any) {
      console.error('ThermalUnlock error', err);
      return { success: false, message: 'Erro de comunicação com o servidor.' };
    }
  };

  // Sistema de desbloqueio do Decodificador
  useEffect(() => {
    if (investigationId) {
      const unlocked = localStorage.getItem(`decoder_unlocked_${investigationId}`);
      if (unlocked === 'true') {
        setDecoderUnlocked(true);
      }
    }
  }, [investigationId]);

  const handleDecoderCodeSubmit = async (code: string): Promise<CodePromptResult> => {
    // Código padrão: DELTA-1977 (pode ser alterado ou tornado dinâmico)
    const correctCode = 'DELTA-1977';
    const normalized = code.trim().toUpperCase();

    if (normalized === correctCode) {
      setDecoderUnlocked(true);
      setShowCodePrompt(false);
      localStorage.setItem(`decoder_unlocked_${investigationId}`, 'true');

      showToast({
        id: 'decoder-unlock',
        message: '⚠ DECODIFICADOR DE ANOMALIAS v1.7 DESBLOQUEADO',
      });

      try {
        playAudio('/sounds/success_chime.mp3');
      } catch {}

      return { success: true, message: 'DECODIFICADOR DESBLOQUEADO', closeModal: true };
    }

    showToast({
      id: 'decoder-error',
      message: '❌ CÓDIGO INVÁLIDO - Acesso negado',
    });

    try {
      playAudio('/sounds/denied.mp3');
    } catch {}

    return { success: false, message: 'Código inválido.' };
  };

  const handleDecoderSave = async (file: File) => {
    if (!investigationId) return;
    
    try {
      const url = await uploadInvestigationImage(file, investigationId);
      showToast({
        id: 'decoder-save',
        message: '✓ Artefato extraído com sucesso',
      });
      setShowDecoderModal(false);
    } catch (err) {
      console.error('Error saving decoded file', err);
      showToast({
        id: 'decoder-save-error',
        message: '❌ Erro ao salvar artefato',
      });
    }
  };

  const handleTerminalSearch = async (query: string) => {
    setTerminalMessage(null);
    const q = query.trim();
    if (!q) {
      setTerminalMessage('Digite uma palavra-chave válida');
      return;
    }

    try {
      // Fetch candidate cards for this investigation and filter client-side
      const { data, error } = await supabase
        .from('investigation_cards')
        .select('*')
        .eq('investigation_id', investigationId)
        .limit(300);

      if (error) throw error;
      if (!data || data.length === 0) {
        setTerminalMessage('Nenhum arquivo disponível nesta investigação.');
        try { playAudio('/sounds/error_buzz.mp3'); } catch {}
        return;
      }

      const lowered = q.toLowerCase();
      
      // Busca em múltiplos campos
      const matches = data.filter((row: any) => {
        // Busca no título
        if (row.title && String(row.title).toLowerCase().includes(lowered)) return true;
        
        // Busca na descrição
        if (row.description && String(row.description).toLowerCase().includes(lowered)) return true;
        
        // Busca nas tags
        if (row.tags && Array.isArray(row.tags)) {
          if (row.tags.some((tag: string) => String(tag).toLowerCase().includes(lowered))) return true;
        }
        
        // Busca em keyword_unlock (evidências ocultas)
        if (row.keyword_unlock && String(row.keyword_unlock).toLowerCase().includes(lowered)) return true;
        
        // Busca em metadata
        const meta = row.metadata || (row.data && row.data.metadata) || null;
        try {
          if (meta) {
            const km = typeof meta === 'string' ? JSON.parse(meta) : meta;
            const key = km && (km.keyword_unlock || km.keyword || km.key);
            if (key && String(key).toLowerCase().includes(lowered)) return true;
          }
        } catch (e) {
          // ignore parse errors
        }
        return false;
      });

      // Se não encontrou nada
      if (!matches || matches.length === 0) {
        setTerminalMessage('Nenhuma pista encontrada.');
        try { playAudio('/sounds/error_buzz.mp3'); } catch {}
        return;
      }

      // Prioriza pistas ocultas, depois visíveis
      const found = matches.find((m: any) => (m as any).visibility === 'hidden') || matches[0];

      // compute center position
      const centerX = origin.x + (windowWidth / 2) / zoom;
      const centerY = origin.y + (windowHeight / 2) / zoom;

      // Se for pista oculta, revelar
      if ((found as any).visibility === 'hidden') {
        await api.updateInvestigationCard((found as any).id, { visibility: 'visible', x: Math.round(centerX), y: Math.round(centerY) } as any);
        try { playAudio('/sounds/success_chime.mp3'); } catch {}
        try { playAudio('/sounds/paper_drop.mp3'); } catch {}
        setTerminalMessage(`ARQUIVO RECUPERADO: "${(found as any).title || (found as any).id}"`);
      } else {
        // Se já está visível, apenas focar nela
        const cardX = (found as any).x || centerX;
        const cardY = (found as any).y || centerY;
        setOrigin({ x: cardX - 400, y: cardY - 300 });
        try { playAudio('/sounds/success_chime.mp3'); } catch {}
        if (matches.length === 1) {
          setTerminalMessage(`PISTA LOCALIZADA: "${(found as any).title || (found as any).id}"`);
        } else {
          setTerminalMessage(`${matches.length} PISTAS ENCONTRADAS. Focando: "${(found as any).title || (found as any).id}"`);
        }
      }
      
      // mark to animate on next render
      setLastCreatedId((found as any).id);
      await loadBoard();
      // clear highlight after a few seconds
      setTimeout(() => setLastCreatedId(null), 4200);
    } catch (err: any) {
      console.error('TerminalSearch error', err);
      setTerminalMessage('Erro ao buscar no servidor');
    }
  };

  // Hidden clues discovery: reveals a card based on discovery_code
  const handleDiscoverHidden = async (code: string): Promise<{ success: boolean; message: string; card?: any }> => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      return { success: false, message: 'Código vazio.' };
    }
    try {
      const { data, error } = await supabase
        .from('investigation_cards')
        .select('*')
        .eq('investigation_id', investigationId)
        .eq('is_hidden', true)
        .eq('discovery_code', normalizedCode)
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: false, message: 'Código não corresponde a nenhum arquivo oculto.' };
      }

      const hiddenCard = data[0] as any;

      // Compute center position for reveal
      const centerX = origin.x + (windowWidth / 2) / zoom;
      const centerY = origin.y + (windowHeight / 2) / zoom;

      // Reveal the card
      await api.updateInvestigationCard(hiddenCard.id, {
        is_hidden: false,
        x: Math.round(centerX),
        y: Math.round(centerY)
      } as any);

      try { playAudio('/sounds/success_chime.mp3'); } catch {}
      try { playAudio('/sounds/paper_drop.mp3'); } catch {}

      // Show notification toast
      showToast({ id: `discovered-${hiddenCard.id}`, message: `🔍 ARQUIVO RECUPERADO: ${hiddenCard.title || 'Documento Secreto'}` });

      // Reload board to show the revealed card
      await loadBoard();

      // Focus camera on the new card
      setOrigin({ x: Math.round(centerX) - 400, y: Math.round(centerY) - 300 });

      // Mark for animation
      setLastCreatedId(hiddenCard.id);
      setTimeout(() => setLastCreatedId(null), 4200);

      return { success: true, message: 'Arquivo revelado com sucesso.', card: hiddenCard };
    } catch (err: any) {
      console.error('DiscoverHidden error', err);
      return { success: false, message: 'Erro ao acessar o servidor.' };
    }
  };

  useEffect(() => {
    loadBoard();
  }, [investigationId]);

  // Realtime subscriptions: notes, cards, and investigation (doomsday clock)
  useEffect(() => {
    if (!investigationId) return;
    let mounted = true;
    const channels: any[] = [];

    try {
      // Notes realtime channel removed (post-it system disabled)

      // Cards channel: refresh cards on any change (simpler)
      const cardsChannel = supabase.channel(`cards:${investigationId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'investigation_cards', filter: `investigation_id=eq.${investigationId}` }, (payload) => {
          if (!mounted) return;
          try {
            const ev = payload.eventType;
            const newRow: any = payload.new;
            const oldRow: any = payload.old;
            if (ev === 'INSERT' && newRow) {
              setCards((prev: any[]) => {
                if (prev.find((c: any) => c.id === newRow.id)) return prev;
                return [...prev, newRow];
              });
              setLocalPositions((prev: Record<string, { x: number; y: number }>) => {
                if (prev[newRow.id]) return prev;
                return { ...prev, [newRow.id]: { x: newRow.x ?? 100, y: newRow.y ?? 100 } };
              });
            } else if (ev === 'UPDATE' && newRow) {
              setCards((prev: any[]) => prev.map((c: any) => c.id === newRow.id ? newRow : c));
              setLocalPositions((prev: Record<string, { x: number; y: number }>) => {
                const has = prev[newRow.id] || { x: newRow.x ?? 100, y: newRow.y ?? 100 };
                const nx = (newRow.x !== undefined && newRow.x !== null) ? newRow.x : has.x;
                const ny = (newRow.y !== undefined && newRow.y !== null) ? newRow.y : has.y;
                return { ...prev, [newRow.id]: { x: nx, y: ny } };
              });
            } else if (ev === 'DELETE' && oldRow) {
              setCards((prev: any[]) => prev.filter((c: any) => c.id !== oldRow.id));
              setLocalPositions((prev: Record<string, { x: number; y: number }>) => {
                const next = { ...prev };
                delete next[oldRow.id];
                return next;
              });
            }
          } catch (e) { console.error('cards realtime handler error', e); }
        })
        .subscribe();
      channels.push(cardsChannel);

      // Investigation channel (watch for doomsday_clock updates)
      const invChannel = supabase.channel(`investigation:${investigationId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'investigations', filter: `id=eq.${investigationId}` }, (payload) => {
          if (!mounted) return;
          try {
            const row: any = payload.new;
            if (row && row.doomsday_clock) {
              const ms = new Date(row.doomsday_clock).getTime();
              if (Number.isFinite(ms)) setDoomsdayTarget(ms);
            }
          } catch (e) { console.error('investigation realtime handler', e); }
        })
        .subscribe();
      channels.push(invChannel);
    } catch (e) {
      console.error('Failed to create realtime channels', e);
    }

    return () => {
      mounted = false;
      Object.values(saveTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout as any);
      });
      saveTimeouts.current = {};
      saveQueueRef.current.clear();
      if (positionFrameRef.current !== null) cancelAnimationFrame(positionFrameRef.current);
      if (originFrameRef.current !== null) cancelAnimationFrame(originFrameRef.current);
      try {
        channels.forEach(ch => { try { ch.unsubscribe(); } catch (e) {} });
      } catch (e) { }
    };
  }, [investigationId]);

  // Emergency spread: detect stacked cards (at origin) and disperse them into a grid
  useEffect(() => {
    if (!cards || cards.length === 0) return;
    const nextLocal = { ...localPositions };
    let changed = false;

    (cards || []).forEach((card: any, index: number) => {
      const currentX = typeof card.x === 'number' ? card.x : 0;
      const currentY = typeof card.y === 'number' ? card.y : 0;

      if ((currentX < 10 && currentY < 10) || !nextLocal[card.id]) {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const newX = 150 + (col * 250);
        const newY = 150 + (row * 300);
        nextLocal[card.id] = { x: newX, y: newY };
        changed = true;
        // persist to server (fire-and-forget)
        api.updateInvestigationCard(card.id, { x: newX, y: newY }).catch((e) => console.warn('despegar card failed', e));
      }
    });

    if (changed) setLocalPositions(nextLocal);
    // run when cards change
  }, [cards]);

  // Check whether current user is the owner (Game Master)
  useEffect(() => {
    let mounted = true;
    async function checkPermissions() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user || null;
        const details = await api.fetchInvestigationById(investigationId);
        if (!mounted) return;
        setCaseTitle(details?.title || 'CASO');
        if (user && details && details.owner_id === user.id) setIsGameMaster(true);
        else setIsGameMaster(false);
        // read doomsday clock if present
        if (details && details.doomsday_clock) {
          try {
            const ms = new Date(details.doomsday_clock).getTime();
            setDoomsdayTarget(Number.isFinite(ms) ? ms : null);
          } catch { setDoomsdayTarget(null); }
        } else setDoomsdayTarget(null);
      } catch (err) {
        console.error('Erro ao verificar permissões', err);
      }
    }
    checkPermissions();
    return () => { mounted = false; };
  }, [investigationId]);

  // Modo de visualização padrão: jogadores veem playerView, GM vê GM view
  useEffect(() => {
    setPlayerView(!isGameMaster);
  }, [isGameMaster]);

  // Debug: show cards when loaded
  useEffect(() => { console.debug('InvestigationBoard: cards changed', cards); }, [cards]);

  useEffect(() => {
    console.debug('InvestigationBoard: cards updated', cards);
  }, [cards]);

  useEffect(() => {
    console.debug('InvestigationBoard: createModalOpen changed', createModalOpen);
  }, [createModalOpen]);

  // Persist on global mouseup (finish drag / pan)
  const forceSaveCard = async (id: string) => {
    if (!id) return;
    // cancel pending debounce
    if (saveTimeouts.current[id]) {
      clearTimeout(saveTimeouts.current[id] as any);
      saveTimeouts.current[id] = null;
    }
    // prevent duplicate saves
    if (saveQueueRef.current.has(id)) return;
    saveQueueRef.current.add(id);
    try {
      const currentPos = localPositionsRef.current[id];
      if (currentPos) {
        console.debug('forceSaveCard saving', id, currentPos);
        await api.updateInvestigationCard(id, { x: Math.round(currentPos.x), y: Math.round(currentPos.y) } as any);
      }
    } catch (e) {
      console.error('Erro ao salvar posição:', e);
    } finally {
      saveQueueRef.current.delete(id);
    }
  };

  const handleGlobalMouseUp = (e?: MouseEvent) => {
    // finalize panning
    if (panningRef.current) {
      panningRef.current = null;
      document.body.style.cursor = 'default';
      return;
    }

    // finalize marquee selection
    if (marqueeStartRef.current) {
      marqueeStartRef.current = null;
      setMarqueeRect(null);
      return;
    }

    // finalize card dragging and persist positions
    if (draggingRef.current) {
      const d = draggingRef.current;
      const id = d.id;
      if (id) {
        // determine ids to save (group vs single)
        const idsToSave = (selectedIds && selectedIds.includes(id)) ? [...selectedIds] : [id];
        // push undo using original positions if available and current ref positions
        const changes: any[] = [];
        const origs: Record<string, { x: number; y: number }> = d.origPositions || (d.origX !== undefined ? { [d.id]: { x: d.origX, y: d.origY } } : {});
        for (const sid of idsToSave) {
          const pos = localPositionsRef.current[sid];
          // cancel debounce
          const to = saveTimeouts.current[sid];
          if (to) { clearTimeout(to as any); saveTimeouts.current[sid] = null; }
          if (pos) {
            changes.push({ id: sid, from: origs[sid] || { x: 0, y: 0 }, to: { x: Math.round(pos.x), y: Math.round(pos.y) } });
          }
        }
        if (changes.length) {
          pushUndo({ type: 'move', payload: { changes } });
          // persist all
          idsToSave.forEach(sid => forceSaveCard(sid));
        }
      }
      draggingRef.current = null;
    }
  };

  // ✅ MIGRADO: useGlobalMouseEvents - sem recreação de listeners
  useGlobalMouseEvents({
    onMouseUp: handleGlobalMouseUp,
    onTouchEnd: handleGlobalMouseUp as any
  });

  // Marquee: start on shift+mousedown on background, update on move, finalize on mouseup
  const startMarquee = (e: MouseEvent) => {
    const board = boardRef.current?.getBoundingClientRect();
    if (!board) return;
    const sx = e.clientX - board.left;
    const sy = e.clientY - board.top;
    const bx = sx / zoom + origin.x;
    const by = sy / zoom + origin.y;
    marqueeStartRef.current = { sx, sy, bx, by };
    setMarqueeRect({ left: sx, top: sy, width: 0, height: 0 });
  };

  // center origin on mount: prefer centering on existing cards' bounding box
  useEffect(() => {
    const initCenter = () => {
      try {
        // if we have cards, center on their bounding box and compute a fit zoom
        if (cards && cards.length > 0) {
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          cards.forEach((c) => {
            const p = localPositions[c.id] || { x: c.x ?? 0, y: c.y ?? 0 };
            const w = 220;
            const h = 160;
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x + w);
            maxY = Math.max(maxY, p.y + h);
          });
          const boardRect = boardRef.current?.getBoundingClientRect();
          const viewW = boardRect?.width ?? windowWidth;
          const viewH = boardRect?.height ?? window.innerHeight;
          const boxW = Math.max(1, maxX - minX);
          const boxH = Math.max(1, maxY - minY);
          const padding = 240; // give some breathing room so cards are not at the edges
          const fitZoomW = viewW / (boxW + padding);
          const fitZoomH = viewH / (boxH + padding);
          const fitZoom = Math.min(3, Math.max(0.2, Math.min(fitZoomW, fitZoomH)));
          // Do NOT change the current zoom automatically — only adjust origin so cards are centered
          const currentZoom = zoomRef.current ?? zoom;
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          setOrigin({ x: centerX - viewW / (2 * currentZoom), y: centerY - viewH / (2 * currentZoom) });
          return;
        }
        // otherwise place origin near 0,0 and keep the current zoom
        setOrigin({ x: -100, y: -100 });
      } catch (err) {
        console.warn('initCenter failed', err);
      }
    };
    initCenter();
    window.addEventListener('resize', initCenter);
    return () => window.removeEventListener('resize', initCenter);
  }, [cards.length]);

  // Lock page scroll while board is mounted (prevent browser scroll interfering)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev || ''; };
  }, []);

  // TODO: implement pointer/mouse move handlers that update `cards` or a localPositions map
  // Implement global move handlers to update localPositions while dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // update marquee if active
      if (marqueeStartRef.current) {
        const board = boardRef.current?.getBoundingClientRect();
        if (!board) return;
        const sx = e.clientX - board.left;
        const sy = e.clientY - board.top;
        const start = marqueeStartRef.current;
        const left = Math.min(start.sx, sx);
        const top = Math.min(start.sy, sy);
        const width = Math.abs(sx - start.sx);
        const height = Math.abs(sy - start.sy);
        setMarqueeRect({ left, top, width, height });
        // compute selection in board coords
        const bx1 = Math.min(start.bx, sx / zoom + origin.x);
        const by1 = Math.min(start.by, sy / zoom + origin.y);
        const bx2 = Math.max(start.bx, sx / zoom + origin.x);
        const by2 = Math.max(start.by, sy / zoom + origin.y);
        const sel: string[] = [];
        const CARD_W = 220;
        const CARD_H = 160;
        cards.forEach((c) => {
          const p = localPositions[c.id] || { x: c.x || 100, y: c.y || 100 };
          const cx1 = p.x;
          const cy1 = p.y;
          const cx2 = p.x + CARD_W;
          const cy2 = p.y + CARD_H;
          const overlap = !(cx2 < bx1 || cx1 > bx2 || cy2 < by1 || cy1 > by2);
          if (overlap) sel.push(c.id);
        });
        setSelectedIds(sel);
        return; // marquee handled
      }
      const p = panningRef.current;
      if (p) {
        const dx = e.clientX - p.startX;
        const dy = e.clientY - p.startY;
        setOrigin({ x: p.originX - dx / zoom, y: p.originY - dy / zoom });
        return;
      }
      const d = draggingRef.current;
      if (!d || !d.id) return;
      // Deadzone: ignore tiny mouse jitter to avoid interfering with double-clicks
      if (!d.hasMoved) {
        const sx = d.startX ?? e.clientX;
        const sy = d.startY ?? e.clientY;
        const dist = Math.hypot(e.clientX - sx, e.clientY - sy);
        if (dist < 5) return; // still a click, not a drag
        d.hasMoved = true;
      }
      // compute movement relative to the corkboard element using world coordinates
      const board = boardRef.current?.getBoundingClientRect();
      const screenX = board ? (e.clientX - board.left) : e.clientX;
      const screenY = board ? (e.clientY - board.top) : e.clientY;
      const worldX = origin.x + screenX / zoom;
      const worldY = origin.y + screenY / zoom;
      // if multiple selected and the dragged id is part of selection, move all selected
      const sel = selectedIdsRef.current || [];
      if (sel.length > 0 && sel.includes(d.id)) {
        setLocalPositions((prev) => {
          const next = { ...prev };
          sel.forEach((sid) => {
            const base = (d.origPositions && d.origPositions[sid]) ? d.origPositions[sid] : (prev[sid] || { x: d.origX, y: d.origY });
            const offset = (d.pointerOffsets && d.pointerOffsets[sid]) ? d.pointerOffsets[sid] : { ox: (d.startWorldX ?? worldX) - base.x, oy: (d.startWorldY ?? worldY) - base.y };
            next[sid] = { x: worldX - offset.ox, y: worldY - offset.oy };
          });
          return next;
        });
        // schedule saves for all
        sel.forEach((sid) => scheduleDebouncedSave(sid));
      } else {
        const offset = (d.pointerOffsets && d.pointerOffsets[d.id]) ? d.pointerOffsets[d.id] : { ox: (d.startWorldX ?? worldX) - (d.origX ?? 0), oy: (d.startWorldY ?? worldY) - (d.origY ?? 0) };
        const newX = worldX - offset.ox;
        const newY = worldY - offset.oy;
        setLocalPositions((prev) => ({ ...prev, [d.id]: { x: newX, y: newY } }));
        if (d.id) scheduleDebouncedSave(d.id);
      }
      if (connectionMode && connectionStart) setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const p = panningRef.current;
      const t = e.touches[0];
      if (p) {
        const dx = t.clientX - p.startX;
        const dy = t.clientY - p.startY;
        setOrigin({ x: p.originX - dx / zoom, y: p.originY - dy / zoom });
        return;
      }
      const d = draggingRef.current;
      if (!d || !d.id) return;
      // Deadzone for touch as well
      if (!d.hasMoved) {
        const sx = d.startX ?? t.clientX;
        const sy = d.startY ?? t.clientY;
        const dist = Math.hypot(t.clientX - sx, t.clientY - sy);
        if (dist < 5) return;
        d.hasMoved = true;
      }
      const board = boardRef.current?.getBoundingClientRect();
      const screenX = board ? (t.clientX - board.left) : t.clientX;
      const screenY = board ? (t.clientY - board.top) : t.clientY;
      const worldX = origin.x + screenX / zoom;
      const worldY = origin.y + screenY / zoom;
      const offset = (d.pointerOffsets && d.pointerOffsets[d.id]) ? d.pointerOffsets[d.id] : { ox: (d.startWorldX ?? worldX) - (d.origX ?? 0), oy: (d.startWorldY ?? worldY) - (d.origY ?? 0) };
      const newX = worldX - offset.ox;
      const newY = worldY - offset.oy;
      setLocalPositions((prev) => ({ ...prev, [d.id]: { x: newX, y: newY } }));
      if (connectionMode && connectionStart) setMousePos({ x: t.clientX, y: t.clientY });
      if (d.id) scheduleDebouncedSave(d.id);
      if (connectionMode && connectionStart) setMousePos({ x: t.clientX, y: t.clientY });
      if (d.id) scheduleDebouncedSave(d.id);
    };

    // replace with global listeners that read latest zoom/origin via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global mouse/touch handler using refs to avoid stale closures
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Panning
      if (panningRef.current) {
        const dx = (e.clientX - panningRef.current.startX) / zoomRef.current;
        const dy = (e.clientY - panningRef.current.startY) / zoomRef.current;
        scheduleOriginUpdate(panningRef.current.originX - dx, panningRef.current.originY - dy);
      }

      // 2. Dragging
      if (draggingRef.current && draggingRef.current.isDragging) {
        const d = draggingRef.current as any;
        const worldNow = getWorldPosition(e.clientX, e.clientY);
        const nextX = worldNow.x - (d.offsetX || 0);
        const nextY = worldNow.y - (d.offsetY || 0);
        schedulePositionUpdate(d.id, { x: nextX, y: nextY });
        // schedule save (debounced)
        if (d.id) scheduleDebouncedSave(d.id);
      }
    };

    const handleMouseUp = () => {
      if (draggingRef.current) {
        try { forceSaveCard((draggingRef.current as any).id); } catch (e) {}
        draggingRef.current = null;
      }
      panningRef.current = null;
    };

    // MANTIDO: mousemove precisa ser nativo para performance (rafId)
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Also handle touch events globally so dragging via touch works reliably on mobile
    const handleTouchMoveWindow = (ev: TouchEvent) => {
      ev.preventDefault();
      const t = ev.touches[0];
      if (!t) return;

      // 1. Panning
      if (panningRef.current) {
        const dx = (t.clientX - panningRef.current.startX) / (zoomRef.current || 1);
        const dy = (t.clientY - panningRef.current.startY) / (zoomRef.current || 1);
        scheduleOriginUpdate(panningRef.current.originX - dx, panningRef.current.originY - dy);
        return;
      }

      // 2. Dragging
      if (draggingRef.current && draggingRef.current.isDragging) {
        const d = draggingRef.current as any;
        const worldNow = getWorldPosition(t.clientX, t.clientY);
        const nextX = worldNow.x - (d.offsetX || 0);
        const nextY = worldNow.y - (d.offsetY || 0);
        schedulePositionUpdate(d.id, { x: nextX, y: nextY });
        if (d.id) scheduleDebouncedSave(d.id);
      }
    };

    const handleTouchEndWindow = (ev: TouchEvent) => {
      // reuse mouseup finalizer
      handleMouseUp();
    };

    window.addEventListener('touchmove', handleTouchMoveWindow, { passive: false } as AddEventListenerOptions);
    window.addEventListener('touchend', handleTouchEndWindow as any);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMoveWindow as any);
      window.removeEventListener('touchend', handleTouchEndWindow as any);
    };
  }, []);

  // MIGRADO: finalize marquee on mouseup usando hook centralizado
  useGlobalMouseEvents({
    onMouseUp: () => {
      if (marqueeStartRef.current) {
        marqueeStartRef.current = null;
        // leave selection as-is; hide marquee overlay
        setTimeout(() => setMarqueeRect(null), 10);
      }
    }
  });

  const scheduleDebouncedSave = useCallback((id: string) => {
    const existing = saveTimeouts.current[id];
    if (existing) return; // already scheduled
    // Mutex: prevent duplicate concurrent saves
    if (saveQueueRef.current.has(id)) return;
    
    saveTimeouts.current[id] = setTimeout(async () => {
      try {
        const pos = localPositions[id];
        if (pos) {
          saveQueueRef.current.add(id);
          await api.updateCard(id, { x: Math.round(pos.x), y: Math.round(pos.y) });
        }
      } catch (err) {
        console.error('Debounced save failed', err);
      } finally {
        saveTimeouts.current[id] = null;
        saveQueueRef.current.delete(id);
      }
    }, 600);
  }, [localPositions]);

  const clearSelection = () => setSelectedIds([]);

  const toggleCardStatus = async (cardId: string, status: string, currentTags: string[]) => {
    // compute newStatus from current cards state to avoid race between setState and API call
    const existing = cards.find(c => c.id === cardId);
    const newStatus = (existing?.metadata?.status === status) ? null : status;

    // optimistically update UI
    setCards(prev => prev.map(c => (c.id !== cardId ? c : { ...c, metadata: { ...(c.metadata || {}), status: newStatus } })));

    try {
      const updated = await api.updateInvestigationCard(cardId, { metadata: { ...(existing?.metadata || {}), status: newStatus } } as any);
      console.debug('toggleCardStatus: server response', updated);
      showToast({ id: `status-${cardId}`, message: `Status atualizado: ${newStatus || 'removido'}` }, 2500);
      // reload board from server to ensure UI matches canonical state (handles RLS/normalization)
      try {
        await loadBoard();
      } catch (loadErr) {
        console.warn('toggleCardStatus: loadBoard failed after update', loadErr);
        // fallback: merge server response into local state
        setCards(prev => prev.map(c => (c.id !== cardId ? c : { ...c, ...(updated || {}), metadata: (updated as any)?.metadata || { ...(c.metadata || {}), status: newStatus } })));
      }
    } catch (e) {
      console.error('Erro ao salvar status', e);
      showToast({ id: `status-err-${cardId}`, message: 'Falha ao salvar status', connectionId: undefined }, 4000);
      // revert UI change on failure
      setCards(prev => prev.map(c => (c.id !== cardId ? c : { ...c, metadata: { ...(c.metadata || {}), status: existing?.metadata?.status || null } })));
    }
  };

  const toggleSelect = (id: string, additive = false) => {
    setSelectedIds((prev) => {
      if (!additive) return [id];
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      return [...prev, id];
    });
  };

  const onCardClickWhenConnecting = async (cardId: string) => {
    if (!connectionMode) return false;
    if (!connectionStart) {
      setConnectionStart(cardId);
      return true;
    }
    if (connectionStart === cardId) {
      setConnectionStart(null);
      setConnectionMode(false);
      return true;
    }
    try {
      const payload: any = {
        investigation_id: investigationId,
        from_card_id: connectionStart,
        to_card_id: cardId,
        metadata: { type: connectionType },
        color: connectionColor,
      };
      const created = await connApi.createInvestigationConnection(payload);
      setConnections((prev) => [...prev, created]);
      // push undo action for created connection
      setUndoStack((s) => [...s, { type: 'create_connection', payload: created }]);
      setRedoStack([]);
      // show toast with undo
      showToast({ id: created.id, message: 'Conexão criada', connectionId: created.id });
    } catch (err) {
      console.error('Failed to create connection', err);
    }
    setConnectionStart(null);
    setConnectionMode(false);
    setMousePos(null);
    return true;
  };

  const pushUndo = (action: any) => {
    setUndoStack((s) => [...s, action]);
    setRedoStack([]);
  };

  const handleAutoOrganize = async (mode: 'timeline' | 'grid') => {
    if (cards.length === 0) return;
    if (!window.confirm('Isso vai reorganizar todos os cards na tela. Continuar?')) return;

    setIsOrganizing(true);
    try {
      const newLayout = mode === 'timeline' ? organizeByTimeline(cards) : organizeByElement(cards);

      // Capture previous positions for undo
      const beforePositions = newLayout.map(p => ({ id: p.id, x: (localPositions[p.id]?.x ?? cards.find(c=>c.id===p.id)?.x ?? 0), y: (localPositions[p.id]?.y ?? cards.find(c=>c.id===p.id)?.y ?? 0) }));

      const nextLocalPositions = { ...localPositions };
      newLayout.forEach(p => {
        nextLocalPositions[p.id] = { x: p.x, y: p.y };
      });
      setLocalPositions(nextLocalPositions);

      // push undo entry so user can revert the whole organization
      pushUndo({ type: 'organize', payload: { before: beforePositions, after: newLayout } });

      // Reset camera to show start
      setOrigin({ x: -50, y: -50 });

      const promises = newLayout.map(p => api.updateInvestigationCard(p.id, { x: p.x, y: p.y }));
      await Promise.all(promises);
      showToast({ id: 'org', message: 'Quadro Reorganizado com Sucesso!' });
    } catch (err) {
      console.error('Erro ao organizar', err);
      showToast({ id: 'org_err', message: 'Erro ao reorganizar quadro' });
    } finally {
      setIsOrganizing(false);
    }
  };

  const undo = async () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    setUndoStack((s) => s.slice(0, s.length - 1));
    try {
      if (last.type === 'create_connection') {
        const created = last.payload;
        await connApi.deleteInvestigationConnection(created.id);
        setConnections((prev) => prev.filter((c) => c.id !== created.id));
        setRedoStack((s) => [...s, last]);
      } else if (last.type === 'move') {
        const changes = last.payload.changes;
        setLocalPositions((prev) => {
          const next = { ...prev };
          changes.forEach((c: any) => { next[c.id] = { x: c.from.x, y: c.from.y }; });
          return next;
        });
        for (const c of changes) {
          try { await api.updateCard(c.id, { x: Math.round(c.from.x), y: Math.round(c.from.y) }); } catch (e) { console.error('undo move persist failed', e); }
        }
        setRedoStack((s) => [...s, last]);
      } else if (last.type === 'organize') {
        // restore previous positions
        const before: Array<{ id: string; x: number; y: number }> = last.payload.before || [];
        const after: Array<{ id: string; x: number; y: number }> = last.payload.after || [];
        setLocalPositions((prev) => {
          const next = { ...prev };
          before.forEach((b) => { next[b.id] = { x: b.x, y: b.y }; });
          return next;
        });
        const promises = before.map(b => api.updateInvestigationCard(b.id, { x: Math.round(b.x), y: Math.round(b.y) }));
        await Promise.all(promises);
        // push redo entry (apply 'after' to redo)
        setRedoStack((s) => [...s, { type: 'organize', payload: { before, after } }]);
      }
    } catch (err) {
      console.error('Undo failed', err);
    }
  };

  const redo = async () => {
    const last = redoStack[redoStack.length - 1];
    if (!last) return;
    setRedoStack((s) => s.slice(0, s.length - 1));
    try {
      if (last.type === 'create_connection') {
        const payload = last.payload;
        const recreated = await connApi.createInvestigationConnection({ investigation_id: payload.investigation_id, from_card_id: payload.from_card_id, to_card_id: payload.to_card_id, metadata: payload.metadata || {}, color: payload.color });
        setConnections((prev) => [...prev, recreated]);
        setUndoStack((s) => [...s, { type: 'create_connection', payload: recreated }]);
      } else if (last.type === 'move') {
        const changes = last.payload.changes;
        setLocalPositions((prev) => {
          const next = { ...prev };
          changes.forEach((c: any) => { next[c.id] = { x: c.to.x, y: c.to.y }; });
          return next;
        });
        for (const c of changes) {
          try { await api.updateCard(c.id, { x: Math.round(c.to.x), y: Math.round(c.to.y) }); } catch (e) { console.error('redo move persist failed', e); }
        }
        setUndoStack((s) => [...s, last]);
      } else if (last.type === 'organize') {
        // apply 'after' positions
        const before: Array<{ id: string; x: number; y: number }> = last.payload.before || [];
        const after: Array<{ id: string; x: number; y: number }> = last.payload.after || [];
        setLocalPositions((prev) => {
          const next = { ...prev };
          after.forEach((b) => { next[b.id] = { x: b.x, y: b.y }; });
          return next;
        });
        const promises = after.map(b => api.updateInvestigationCard(b.id, { x: Math.round(b.x), y: Math.round(b.y) }));
        await Promise.all(promises);
        setUndoStack((s) => [...s, { type: 'organize', payload: { before, after } }]);
      }
    } catch (err) {
      console.error('Redo failed', err);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (ctrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      if ((ctrl && e.key.toLowerCase() === 'y') || (ctrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        redo();
      }

      // keyboard move for selection
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const tg = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tg === 'input' || tg === 'textarea' || tg === 'select' || e.altKey) return;
        e.preventDefault();
        if (!selectedIds || selectedIds.length === 0) return;
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        setLocalPositions((prev) => {
          const next = { ...prev };
          selectedIds.forEach((id) => {
            const cur = prev[id] || { x: 100, y: 100 };
            next[id] = { x: cur.x + dx, y: cur.y + dy };
            scheduleDebouncedSave(id);
          });
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undoStack, redoStack, selectedIds]);

  // Global terminal hotkey: `~` or Ctrl+K
  useEffect(() => {
    const tHandler = (e: KeyboardEvent) => {
      const key = e.key || '';
      if ((key === '`' || key === '~') || (e.ctrlKey && key.toLowerCase() === 'k')) {
        e.preventDefault();
        setTerminalOpen((s) => !s);
      }
    };
    window.addEventListener('keydown', tHandler);
    return () => window.removeEventListener('keydown', tHandler);
  }, []);

  // Spacebar panning support: hold Space to pan (like Figma)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const tg = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tg === 'input' || tg === 'textarea' || tg === 'select') return;
        e.preventDefault();
        setIsSpacePressed(true);
        document.body.classList.add('space-panning');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        document.body.classList.remove('space-panning');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.classList.remove('space-panning');
    };
  }, []);

  const [toast, setToast] = useState<{ id: string; message: string; connectionId?: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToast = () => {
    setToast(null);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current as any);
      toastTimer.current = null;
    }
  };

  const showToast = (t: { id: string; message: string; connectionId?: string }, duration = 6000) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current as any);
    toastTimer.current = setTimeout(() => setToast(null), duration) as any;
  };



  const getCardCenter = (cardId: string | undefined | null) => {
    if (!cardId) return null;
    const pos = localPositions[cardId] || cards.find((c) => c.id === cardId && { x: c.x, y: c.y });
    if (!pos) return null;
    const rectWidth = 220;
    const rectHeight = 160;
    return { x: pos.x + rectWidth / 2, y: pos.y + rectHeight / 2 };
  };

  const panToPosition = (x: number, y: number) => {
    const boardRect = boardRef.current?.getBoundingClientRect();
    const viewW = boardRect?.width ?? windowWidth;
    const viewH = boardRect?.height ?? window.innerHeight;
    // center the given board coords (x,y) in view
    setOrigin({ x: x - viewW / (2 * zoom), y: y - viewH / (2 * zoom) });
  };

  const parseCardMetadata = (card: any) => {
    const meta = card?.metadata ?? (card?.data && card.data.metadata);
    if (!meta) return {};
    if (typeof meta === 'string') {
      try {
        return JSON.parse(meta);
      } catch {
        return {};
      }
    }
    return meta;
  };

  const resolveUnifiedMedia = (card: any, metadata: any, opts?: { revealBase?: boolean }) => {
    const revealBase = opts?.revealBase === true;
    const unified = metadata?.unified_media || {};
    const baseType = unified.base_media_type || metadata?.media_type || card?.base_media_type || null;
    const baseUrl = unified.base_media_url || card?.base_media_url || null;
    const glitchSolved = metadata?.glitch_puzzle?.solved === true;

    const masked = !glitchSolved && (metadata?.masked_preview === true || (metadata?.security_layer?.enabled && baseUrl));

    const resolvedImage = (() => {
      const baseImage = card?.image_url || baseUrl || unified.image_url || null;
      if (glitchSolved && baseUrl) return baseUrl;
      if (revealBase) return baseImage;
      if (masked) return baseImage || LOCKED_PLACEHOLDER_IMG;
      return baseImage;
    })();

    const resolvedVideo = (() => {
      if (baseType === 'video' && baseUrl) return baseUrl;
      return unified.video_url || card?.video_url || null;
    })();

    const resolvedAudio = (() => {
      if (baseType === 'audio' && baseUrl) return baseUrl;
      return unified.audio_base_url || card?.audio_url || null;
    })();

    const resolvedHiddenAudio = unified.audio_hidden_url || card?.audio_hidden_url || null;

    const resolvedType = card?.type || metadata?.card_type || (metadata?.security_layer?.enabled
      ? (baseType === 'video' ? 'encrypted_video' : baseType === 'audio' ? 'locked_audio' : 'glitch_puzzle')
      : null);

    return {
      base_media_type: baseType,
      base_media_url: baseUrl,
      image_url: resolvedImage,
      video_url: resolvedVideo,
      audio_url: resolvedAudio,
      audio_hidden_url: resolvedHiddenAudio,
      type: resolvedType || card?.type || null,
      masked_preview: masked,
    };
  };

  const isCardLocked = (card: any, metadata: any) => {
    if (card?.is_locked === false || metadata?.unlocked_at) return false;
    const lockedFlag = card?.is_locked === true || card?.is_locked === 1 || (typeof card?.is_locked === 'string' && ['true','t','1'].includes(String(card.is_locked).toLowerCase()));
    const password = card?.lock_password || metadata?.lock_pass || metadata?.lock_password;
    return Boolean(lockedFlag || password);
  };

  const openEvidenceViewer = (card: any) => {
    try {
      const center = getCardCenter(card?.id);
      if (center) panToPosition(center.x, center.y);
    } catch {
      // ignore centering failures
    }
    setInspectCard(card);
  };

  const handleCardOpen = (card: any) => {
    const metadata = parseCardMetadata(card);
    const hydratedMedia = resolveUnifiedMedia(card, metadata, { revealBase: true });
    const cardForView = { ...card, ...hydratedMedia, metadata };
    const isMegaClue = card?.type === 'mega_clue' || metadata?.mega_clue;
    const megaMeta = metadata?.mega_clue || {};
    const requiredIds = Array.isArray(megaMeta.required_puzzle_ids) ? megaMeta.required_puzzle_ids.map((id: any) => String(id)) : [];
    const solvedIds = Array.isArray(megaMeta.solved_puzzle_ids) ? megaMeta.solved_puzzle_ids.map((id: any) => String(id)) : [];
    const collectedCodes = Array.isArray(megaMeta.collected_codes) ? megaMeta.collected_codes : [];
    const progressCount = Math.max(solvedIds.length, collectedCodes.length);
    const requiredCount = megaMeta.required_code_count || requiredIds.length || collectedCodes.length || 0;
    const alreadyUnlocked = megaMeta.unlocked === true || (requiredCount > 0 && progressCount >= requiredCount);

    if (isGameMaster && !playerView) {
      openEvidenceViewer(cardForView);
      return;
    }

    if (isMegaClue && !alreadyUnlocked && requiredCount > 0) {
      setUnlockingCard(cardForView);
      return;
    }

    if (!isMegaClue && isCardLocked(card, metadata)) {
      setUnlockingCard(cardForView);
      return;
    }

    openEvidenceViewer(cardForView);
  };

  const handleUnlockSubmit = async (submittedCode: string): Promise<CodePromptResult> => {
    if (!unlockingCard) return { success: false, message: 'Nenhum card selecionado.' };
    const code = submittedCode.trim().toUpperCase();
    if (!code) return { success: false, message: 'Digite um código válido.' };

    const metadata = parseCardMetadata(unlockingCard);
    const isMegaClue = unlockingCard?.type === 'mega_clue' || metadata?.mega_clue;
    try {
      if (isMegaClue) {
        const megaMeta = metadata?.mega_clue || {};
        const requiredIds = Array.isArray(megaMeta.required_puzzle_ids) ? megaMeta.required_puzzle_ids.map((id: any) => String(id)) : [];
        const solvedIds = Array.isArray(megaMeta.solved_puzzle_ids) ? megaMeta.solved_puzzle_ids.map((id: any) => String(id)) : [];
        const requiredCount = megaMeta.required_code_count || requiredIds.length || 0;

        const puzzleMatch = cards.find((c) => {
          const m = parseCardMetadata(c);
          const reward = m?.glitch_puzzle?.reward_code;
          return reward && String(reward).toUpperCase() === code;
        });

        if (!puzzleMatch) {
          showToast({ id: 'unlock-fail', message: 'Código não corresponde a nenhum puzzle.' }, 3200);
          return { success: false, message: 'Código não corresponde a nenhum puzzle.' };
        }

        const puzzleId = String(puzzleMatch.id);
        const enforceRequiredList = requiredIds.length > 0;
        if (enforceRequiredList && !requiredIds.includes(puzzleId)) {
          showToast({ id: 'unlock-not-required', message: 'Código não está na lista de puzzles requeridos.' }, 3400);
          return { success: false, message: 'Código não está na lista de puzzles requeridos.' };
        }

        if (solvedIds.includes(puzzleId)) {
          showToast({ id: 'unlock-dup', message: 'Código já utilizado nesta mega-pista.' }, 3200);
          return { success: false, message: 'Código já utilizado nesta mega-pista.' };
        }

        const nextSolved = Array.from(new Set([...solvedIds, puzzleId]));
        const existingCodes = Array.isArray(megaMeta.collected_codes) ? megaMeta.collected_codes.map((c: any) => String(c).toUpperCase()) : [];
        const nextCodes = Array.from(new Set([...existingCodes, code]));
        const progressCount = Math.max(nextSolved.length, nextCodes.length);
        const totalRequired = requiredCount || requiredIds.length || nextCodes.length || nextSolved.length;
        const displayRequired = totalRequired || progressCount || 1;
        const unlockedNow = totalRequired > 0 ? progressCount >= totalRequired : false;

        const updatedMeta = {
          ...metadata,
          mega_clue: {
            ...megaMeta,
            required_puzzle_ids: requiredIds,
            solved_puzzle_ids: nextSolved,
            collected_codes: nextCodes,
            required_code_count: totalRequired,
            unlocked: unlockedNow,
            unlocked_at: unlockedNow ? (megaMeta.unlocked_at || new Date().toISOString()) : megaMeta.unlocked_at,
          },
        };

        await api.updateInvestigationCard(unlockingCard.id, { metadata: updatedMeta } as any);

        const updatedCard = { ...unlockingCard, metadata: updatedMeta };
        setCards((prev) => prev.map((c) => (c.id === unlockingCard.id ? { ...c, metadata: updatedMeta } : c)));

        const successMessage = unlockedNow
          ? `✓ DESBLOQUEIO COMPLETO! (${progressCount}/${displayRequired})`
          : `✓ CÓDIGO ACEITO! PROGRESSO: ${progressCount}/${displayRequired}`;

        if (unlockedNow) {
          setUnlockingCard(null);
          openEvidenceViewer({ ...updatedCard, metadata: updatedMeta });
          await loadBoard();
        } else {
          setUnlockingCard(updatedCard);
        }

        showToast({ id: `unlock-${unlockingCard.id}`, message: successMessage }, 3200);
        return { success: true, message: successMessage, closeModal: unlockedNow };
      }

      const password = (unlockingCard.lock_password || metadata?.lock_pass || metadata?.lock_password || '').toString().toUpperCase();
      console.debug('unlock attempt', { cardId: unlockingCard?.id, providedCode: code, expected: password, performanceMode });
      if (!password) {
        showToast({ id: 'unlock-missing', message: 'Nenhuma senha configurada para este card.' }, 3000);
        setUnlockingCard(null);
        openEvidenceViewer(unlockingCard);
        return { success: true, message: 'Acesso concedido', closeModal: true };
      }

      if (password !== code) {
        console.debug('unlock failed: code mismatch', { cardId: unlockingCard?.id, providedCode: code, expected: password });
        showToast({ id: 'unlock-invalid', message: 'Código inválido.' }, 3200);
        return { success: false, message: 'Código inválido.' };
      }

      const updatedMeta = { ...metadata, unlocked_at: new Date().toISOString() };
      await api.updateInvestigationCard(unlockingCard.id, { is_locked: false, metadata: updatedMeta } as any);
      showToast({ id: `unlock-${unlockingCard.id}`, message: 'Acesso concedido' }, 3200);
      setUnlockingCard(null);
      openEvidenceViewer({ ...unlockingCard, metadata: updatedMeta, is_locked: false });
      await loadBoard();
      return { success: true, message: 'Acesso concedido', closeModal: true };
    } catch (err) {
      console.error('Erro ao validar código', err);
      showToast({ id: 'unlock-error', message: 'Falha ao validar código.' }, 3600);
      return { success: false, message: 'Falha ao validar código.' };
    }
  };

  // Helper: open Create Clue modal centered on view
  const handleCreateClue = () => {
    setEditingCard(null);
    const boardRect = boardRef.current?.getBoundingClientRect();
    const viewW = boardRect?.width ?? windowWidth;
    const viewH = boardRect?.height ?? window.innerHeight;
    const cx = viewW / 2;
    const bx = origin.x + cx / zoom;
    const CARD_W = 220;
    const CARD_H = 160;
    setCreateModalPos({ x: Math.round(bx - CARD_W / 2), y: Math.round((viewH / 2) / zoom + origin.y - CARD_H / 2) });
    setCreateModalOpen(true);
  };

  // Zoom helpers: centralize math and use refs to avoid stale closures
  const zoomBy = useCallback((delta: number) => {
    setZoom((prev) => {
      const candidate = prev + delta;
      const newZoom = Math.min(Math.max(candidate, 0.1), 3);
      const boardRect = boardRef.current?.getBoundingClientRect();
      const originNow = originRef.current;
      if (boardRect && originNow) {
        const centerX = originNow.x + (boardRect.width / 2) / prev;
        const centerY = originNow.y + (boardRect.height / 2) / prev;
        const newOriginX = centerX - (boardRect.width / 2) / newZoom;
        const newOriginY = centerY - (boardRect.height / 2) / newZoom;
        setOrigin({ x: newOriginX, y: newOriginY });
      }
      return newZoom;
    });
  }, []);

  const zoomIn = useCallback(() => zoomBy(0.1), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(-0.1), [zoomBy]);
  const resetZoom = useCallback(() => {
    setZoom(1);
    setOrigin({ x: 0, y: 0 });
  }, []);

  // Wheel-based zoom (Ctrl/Cmd + wheel) and scroll-pan when not holding Ctrl, plus pinch-to-zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        const scaleFactor = 0.05;
        // compute new zoom and adjust origin so zoom centers on mouse pointer
        const boardRect = boardRef.current?.getBoundingClientRect();
        const pointerX = e.clientX;
        const pointerY = e.clientY;
        setZoom(prev => {
          const candidate = prev + (delta > 0 ? scaleFactor : -scaleFactor);
          const newZoom = Math.min(Math.max(candidate, 0.1), 3);
          if (boardRect) {
            // world coords under pointer before zoom
            const worldX = origin.x + (pointerX - boardRect.left) / prev;
            const worldY = origin.y + (pointerY - boardRect.top) / prev;
            // adjust origin so the same world point stays under the pointer after zoom
            const newOriginX = worldX - (pointerX - boardRect.left) / newZoom;
            const newOriginY = worldY - (pointerY - boardRect.top) / newZoom;
            setOrigin({ x: newOriginX, y: newOriginY });
          }
          return newZoom;
        });
        return;
      }
      e.preventDefault();
      setOrigin(prev => ({ x: prev.x + e.deltaX / zoom, y: prev.y + e.deltaY / zoom }));
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsPinching(true);
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        setInitialDistance(distance);
        setInitialZoom(zoom);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        const newZoom = initialZoom * (distance / initialDistance);
        setZoom(Math.max(0.1, Math.min(3, newZoom)));
        // Center zoom on midpoint of touches
        const boardRect = boardRef.current?.getBoundingClientRect();
        if (boardRect) {
          const midX = (touch1.clientX + touch2.clientX) / 2;
          const midY = (touch1.clientY + touch2.clientY) / 2;
          const worldX = origin.x + (midX - boardRect.left) / zoom;
          const worldY = origin.y + (midY - boardRect.top) / zoom;
          const newOriginX = worldX - (midX - boardRect.left) / newZoom;
          const newOriginY = worldY - (midY - boardRect.top) / newZoom;
          setOrigin({ x: newOriginX, y: newOriginY });
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        setIsPinching(false);
      }
    };

    const boardEl = boardRef.current;
    if (boardEl) {
      boardEl.addEventListener('wheel', handleWheel, { passive: false });
      boardEl.addEventListener('touchstart', handleTouchStart, { passive: false });
      boardEl.addEventListener('touchmove', handleTouchMove, { passive: false });
      boardEl.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    return () => {
      if (boardEl) {
        boardEl.removeEventListener('wheel', handleWheel as any);
        boardEl.removeEventListener('touchstart', handleTouchStart as any);
        boardEl.removeEventListener('touchmove', handleTouchMove as any);
        boardEl.removeEventListener('touchend', handleTouchEnd as any);
      }
    };
  }, [zoom, origin, isPinching, initialDistance, initialZoom]);

  // Listener para eventos do Menu Mobile
  useEffect(() => {
    const handleMobileTool = (e: CustomEvent) => {
      const toolId = e.detail;
      console.log('Mobile Tool Action:', toolId);

      switch (toolId) {
        case 'create':
          setCreateModalOpen(true);
          break;
        case 'connect': {
          setConnectionMode((prev) => {
            const next = !prev;
            if (!next) setConnectionStart(null); // Reset se estiver desligando
            showToast({ id: 'mob-conn', message: next ? 'Modo Conexão: ATIVADO. Toque em duas cartas.' : 'Modo Conexão: DESATIVADO' });
            return next;
          });
          break;
        }
        case 'search':
          setShowFinder((prev) => !prev);
          break;
        case 'uv':
          setIsUV((prev) => !prev);
          showToast({ id: 'mob-uv', message: isUV ? 'Luz UV: APAGADA' : 'Luz UV: ACESA' });
          break;
        case 'reset-cam':
          setOrigin({ x: 0, y: 0 });
          setZoom(1);
          break;
        case 'organize':
          // Abre o menu de organizar ou organiza direto
          if (window.confirm("Reorganizar o quadro automaticamente?")) {
             handleAutoOrganize('timeline');
          }
          break;
        case 'decoder':
          setDecoderOpen(true);
          break;
        case 'undo':
          undo();
          break;
        case 'terminal':
          setTerminalOpen((prev) => !prev);
          break;
        case 'conspiracy':
          setShowSharedBoard(true);
          break;
        case 'redo':
          redo();
          break;
        case 'performance':
          togglePerformanceMode();
          showToast({ id: 'mob-perf', message: 'Modo Performance Alternado' });
          break;
        default:
          break;
      }
    };

    window.addEventListener('investigation:tool', handleMobileTool as EventListener);
    // Expor fallback global para garantir entrega mesmo quando o evento é disparado antes do listener
    (window as any).handleInvestigationTool = (toolId: string) => handleMobileTool({ detail: toolId } as CustomEvent);
    return () => {
      window.removeEventListener('investigation:tool', handleMobileTool as EventListener);
      try { delete (window as any).handleInvestigationTool; } catch (e) {}
    };
  }, [connectionMode, isUV, undo, redo, togglePerformanceMode, handleAutoOrganize]); // Adicione dependências relevantes

  return (
    <div className="investigation-board" data-performance-mode={performanceMode ? 'on' : 'off'}>
      {terminalMessage && <div className="reveal-hud">{terminalMessage}</div>}
      <header className="investigation-header">
        <div className="header-left">
          <button className="board-back-btn" onClick={() => navigate('/')}>← ARQUIVOS</button>
        </div>
        <div className="header-center">
          <div className="case-meta">CASO // CONFIDENCIAL</div>
          <h1 className="case-title">{caseTitle}</h1>
        </div>
        <div className="header-right" />
      </header>
      {contextMenu && (() => {
        const board = boardRef.current?.getBoundingClientRect();
        const left = board ? (board.left + (contextMenu.x - origin.x) * zoom) : 120;
        const top = board ? (board.top + (contextMenu.y - origin.y) * zoom) : 120;
        return (
         <div style={{ position: 'fixed', left, top, zIndex: 11000, background: '#0b0b0d', border: '1px solid #333', padding: 8, borderRadius: 8, color: '#ddd', minWidth: 220 }}>
          {contextMenu.type === 'card' ? (
            <>
             <div style={{ fontWeight: 'bold', marginBottom: 6 }}>GERENCIAR EVIDÊNCIA</div>
             <div style={{display:'flex', gap:5, padding:'4px 0 8px 0'}}>
               <button 
                 onClick={() => { toggleCardStatus(contextMenu.targetId!, 'verified', []); setContextMenu(null); }}
                 style={{flex:1, textAlign:'center', border:'1px solid #27ae60', color:'#2ecc71', fontSize:16, background:'#111', borderRadius:4}}
                 title="Confirmar Fato"
               >
                 ✔
               </button>
               <button 
                 onClick={() => { toggleCardStatus(contextMenu.targetId!, 'theory', []); setContextMenu(null); }}
                 style={{flex:1, textAlign:'center', border:'1px solid #f39c12', color:'#f1c40f', fontSize:16, background:'#111', borderRadius:4}}
                 title="Marcar como Teoria"
               >
                 ?
               </button>
               <button 
                 onClick={() => { toggleCardStatus(contextMenu.targetId!, 'false', []); setContextMenu(null); }}
                 style={{flex:1, textAlign:'center', border:'1px solid #c0392b', color:'#e74c3c', fontSize:16, background:'#111', borderRadius:4}}
                 title="Descartar / Falso"
               >
                 ✖
               </button>
             </div>
             <hr style={{borderColor:'#333', margin:'4px 0'}} />
             <button onClick={() => { api.updateInvestigationCard(contextMenu.targetId!, { z_index: 1000 }); loadBoard(); setContextMenu(null); }} style={{display:'block', width:'100%', textAlign:'left', padding:'6px 4px', background:'transparent', border:'none', color:'#ddd'}}>🔼 Trazer para Frente</button>
             <button onClick={() => { api.updateInvestigationCard(contextMenu.targetId!, { z_index: 1 }); loadBoard(); setContextMenu(null); }} style={{display:'block', width:'100%', textAlign:'left', padding:'6px 4px', background:'transparent', border:'none', color:'#ddd'}}>🔽 Mandar para Trás</button>
             <hr style={{borderColor:'#333', margin:'4px 0'}} />
             {canEdit && (
               <button 
                 onClick={async () => {
                   if(window.confirm("Queimar esta evidência permanentemente?")) {
                     try {
                       await api.deleteInvestigationCard(contextMenu.targetId!);
                       // reload board to refresh cards and connections (avoid orphaned connections in UI)
                       await loadBoard();
                     } catch(e){
                       console.error(e);
                       alert('Erro ao apagar pista. Veja o console.');
                     }
                   }
                   setContextMenu(null);
                 }}
                 style={{display:'block', width:'100%', textAlign:'left', padding:'6px 4px', background:'transparent', border:'none', color:'#ff4444'}}
               >
                 🔥 Queimar Arquivo
               </button>
             )}
            </>
          ) : (
            <>
             <div style={{ fontWeight: 'bold', marginBottom: 6 }}>MESA DE INVESTIGAÇÃO</div>
             <button onClick={() => { const CARD_W = 220; const CARD_H = 160; setCreateModalPos({ x: Math.round(contextMenu.x - CARD_W/2), y: Math.round(contextMenu.y - CARD_H/2) }); setCreateModalOpen(true); setContextMenu(null); }} style={{display:'block', width:'100%', textAlign:'left', padding:'6px 4px', background:'transparent', border:'none', color:'#ddd'}}>+ Nova Pista Aqui</button>
             <button onClick={() => { handleAutoOrganize('timeline'); setContextMenu(null); }} style={{display:'block', width:'100%', textAlign:'left', padding:'6px 4px', background:'transparent', border:'none', color:'#ddd'}}>📅 Organizar Timeline</button>
             <button onClick={() => { setOrigin({x:0, y:0}); setContextMenu(null); }} style={{display:'block', width:'100%', textAlign:'left', padding:'6px 4px', background:'transparent', border:'none', color:'#ddd'}}>📍 Resetar Câmera</button>
            </>
          )}
         </div>
        );
      })()}
      {/* Header moved to dedicated element above */}

      {/* BARRA DE NAVEGAÇÃO MOBILE (NOVA) */}
      {isMobileDevice && (
        <BottomNavigationBar isGameMaster={isGameMaster} />
      )}

      {!isMobileDevice && (
        <div className="investigation-toolbar" data-game-master={isGameMaster ? 'true' : 'false'} data-player-view={viewerMode ? 'true' : 'false'}>
        {/* Grupo 1: Ações Principais */}
        <div className="toolbar-group">
          {/* Criar Nova Evidência - Único portal para criar pistas, puzzles e mega-pistas */}
          {isGameMaster && !playerView && (
            <button 
              className="hud-btn primary" 
              onClick={() => { console.debug('HUD: CreatorHub opened', { isGameMaster, playerView }); setCreateModalOpen(true); }}
              data-tooltip="Criar Nova Evidência: pistas, puzzles, mega-pistas"
              style={{ background: 'linear-gradient(135deg, #c6a45f 0%, #a88747 100%)', color: '#000' }}
            >
              ⚙️ HUB DE CRIAÇÃO
            </button>
          )}

          {isGameMaster && (
            <>
              <button className="hud-btn icon-only" onClick={async () => {
                 try {
                   const invite = await api.createInviteLink(investigationId);
                   if (invite?.invite_code) {
                     const url = `${window.location.origin}/invite/${invite.invite_code}`;
                     setInviteLink(url);
                   }
                 } catch (e) {
                   console.error('Falha ao gerar link de convite', e);
                   alert('Falha ao gerar link de convite');
                 }
                 setInviteOpen(true);
              }} data-tooltip="Convidar jogadores">✉️</button>
              <button 
                 className={`hud-btn icon-only ${playerView ? 'active' : ''}`}
                 onClick={() => setPlayerView(!playerView)}
                 data-tooltip={playerView ? "Visão Mestre" : "Visão Jogador"}
              >
                 {playerView ? '🕶️' : '👁️'}
              </button>
              <button 
                 className={`hud-btn icon-only ${showHiddenClues ? 'active' : ''}`}
                 onClick={() => setShowHiddenClues(!showHiddenClues)}
                 data-tooltip={showHiddenClues ? "Ocultar pistas ocultas" : "Mostrar pistas ocultas"}
              >
                 👁️‍🗨️
              </button>
              <button 
                 className={`hud-btn icon-only ${gmOverwatchOpen ? 'active' : ''}`}
                 onClick={() => setGmOverwatchOpen(!gmOverwatchOpen)}
                 data-tooltip="GM Overwatch"
              >
                 👑
              </button>
            </>
          )}
        </div>

        {/* Grupo 2: Ferramentas */}
        <div className="toolbar-group">
          <button 
            className={`hud-btn connection ${connectionMode ? 'active' : ''}`} 
            onClick={() => setConnectionMode(prev => { const next = !prev; if (!next) setConnectionStart(null); return next; })} 
            data-tooltip={connectionMode ? "Sair do modo conexão" : "Conectar pistas"}
          >
            🔗 CONECTAR
          </button>

          {connectionMode && (
            <>
              <button 
                className="hud-btn icon-only" 
                onClick={() => { setConnectionType('confirmed'); setConnectionColor('#c62828'); }}
                style={{ opacity: connectionType==='confirmed'?1:0.5, border: connectionType==='confirmed'?'1px solid #c62828':'none' }}
                data-tooltip="Fato"
              >
                <div style={{width:10, height:10, background:'#c62828', borderRadius: '50%'}} />
              </button>
              <button 
                className="hud-btn icon-only"
                onClick={() => { setConnectionType('theory'); setConnectionColor('#f9a825'); }}
                style={{ opacity: connectionType==='theory'?1:0.5, border: connectionType==='theory'?'1px solid #f9a825':'none' }}
                data-tooltip="Teoria"
              >
                <div style={{width:10, height:10, background:'#f9a825', borderRadius: '50%'}} />
              </button>
              <button 
                className="hud-btn icon-only" 
                onClick={() => { setConnectionType('mystic'); setConnectionColor('#7e57c2'); }}
                style={{ opacity: connectionType==='mystic'?1:0.5, border: connectionType==='mystic'?'1px solid #7e57c2':'none' }}
                data-tooltip="Sobrenatural"
              >
                <div style={{width:10, height:10, background:'#7e57c2', borderRadius: '50%'}} />
              </button>
            </>
          )}

          <button className="hud-btn icon-only" onClick={() => setDecoderOpen(true)} data-tooltip="Decodificador de Texto">🔐</button>
        </div>

        {/* Grupo 3: Organização & Edição */}
        <div className="toolbar-group">
          <button className={`hud-btn icon-only ${showFinder ? 'active' : ''}`} onClick={() => setShowFinder(!showFinder)} data-tooltip="Buscar">🔍</button>
          <div style={{ position: 'relative' }}>
            <button className="hud-btn icon-only" onClick={() => setShowOrganizeMenu(!showOrganizeMenu)} data-tooltip="Organizar">🗂️</button>
            {showOrganizeMenu && (
              <div className="dropdown-menu">
                <div className="dropdown-header">Organizar</div>
                <button onClick={() => { handleAutoOrganize('timeline'); setShowOrganizeMenu(false); }}>📅 Por Data</button>
                <button onClick={() => { handleAutoOrganize('grid'); setShowOrganizeMenu(false); }}>🧭 Por Elemento</button>
                <button onClick={() => {
                  const newPos: Record<string, { x: number; y: number }> = { ...localPositions };
                  cards.forEach((c, i) => {
                    const col = i % 5;
                    const row = Math.floor(i / 5);
                    const x = 100 + col * 260;
                    const y = 100 + row * 300;
                    newPos[c.id] = { x, y };
                    api.updateInvestigationCard(c.id, { x, y }).catch((e) => console.warn('force grid save failed', e));
                  });
                  setLocalPositions(newPos);
                  setOrigin({ x: -50, y: -50 });
                  setShowOrganizeMenu(false);
                }}>🔢 Desempilhar</button>
              </div>
            )}
          </div>

          <button className="hud-btn icon-only" onClick={() => undo()} disabled={undoStack.length === 0} data-tooltip="Desfazer">↩</button>
          <button className="hud-btn icon-only" onClick={() => redo()} disabled={redoStack.length === 0} data-tooltip="Refazer">↪</button>
        </div>

        {/* Grupo 4: Ferramentas Avançadas */}
        <div className="toolbar-group">
          <button className="hud-btn icon-only" onClick={() => setShowSharedBoard(true)} data-tooltip="Conspiração">🕸️</button>
          {/* Post-it button removed */}
          
          <div style={{ position: 'relative' }}>
            <button className="hud-btn icon-only" onClick={() => setShowToolsMenu(!showToolsMenu)} data-tooltip="Mais Ferramentas">⚙️</button>
            {showToolsMenu && (
              <div className="dropdown-menu">
                <div className="dropdown-header">Ferramentas</div>
                <button onClick={() => { setIsUV(!isUV); setShowToolsMenu(false); }} className={isUV ? 'active-uv' : ''}>
                  🔦 Luz UV {isUV ? '(Ativa)' : ''}
                </button>
                <button onClick={() => { setTerminalOpen(!terminalOpen); setShowToolsMenu(false); }}>
                  ⌨️ Terminal C.R.I.S.
                </button>
              </div>
            )}
          </div>
          <button
            className={`hud-btn icon-only ${performanceMode ? 'active' : ''}`}
            onClick={togglePerformanceMode}
            data-tooltip={performanceMode ? 'Modo performance ativado (reduz efeitos e processos)' : 'Ativar modo performance (reduz efeitos e processos)'}
          >
            ⚡
          </button>
        </div>

        {/* Grupo 5: Zoom */}
        <div className="toolbar-group" style={{ marginLeft: 'auto', padding: '0 8px', minWidth: 120, justifyContent: 'center', gap: 6, alignItems: 'center' }}>
          <button className="hud-btn icon-only" onClick={zoomOut} data-tooltip="Diminuir">−</button>
          <span style={{ fontSize: 11, color: '#666', minWidth: 50, textAlign: 'center' }}>{(zoom * 100).toFixed(0)}%</span>
          <button className="hud-btn icon-only" onClick={zoomIn} data-tooltip="Aumentar">+</button>
          <button className="hud-btn icon-only" onClick={resetZoom} data-tooltip="Reset">⟲</button>
        </div>
        </div>
      )}

      {/* Doomsday clock (scene timer) */}
      <DoomsdayClock targetTime={doomsdayTarget} isGameMaster={isGameMaster} onUpdate={async (minutesDelta: number) => {
        try {
          if (!doomsdayTarget) return;
          const newMs = doomsdayTarget + minutesDelta * 60 * 1000;
          // update server
          await api.updateInvestigation(investigationId, { doomsday_clock: new Date(newMs).toISOString() });
          setDoomsdayTarget(newMs);
        } catch (e) {
          console.error('failed to update doomsday', e);
        }
      }} />

      {showFinder && (
        <TerminalSearch onSearch={handleTerminalSearch} onClose={() => { setShowFinder(false); setTerminalMessage(null); }} />
      )}

      {/* Modais (mantidos) */}
      <InvestigationCardModal open={modalOpen} existing={editingCard} investigationId={investigationId} onClose={() => setModalOpen(false)} onSaved={loadBoard} isGameMaster={isGameMaster} />
      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} investigationId={investigationId} inviteLink={inviteLink} />
      {inspectCard && (
        <InspectionModal
          isOpen={!!inspectCard}
          card={inspectCard}
          isGameMaster={isGameMaster}
          onClose={() => setInspectCard(null)}
          onEdit={() => {
            setEditingCard(inspectCard);
            setInspectCard(null);
            setModalOpen(true);
          }}
          externalBaseId={inspectCard ? `card-base-${inspectCard.id}` : undefined}
          externalHiddenId={inspectCard ? `card-hidden-${inspectCard.id}` : undefined}
        />
      )}

      <div
        ref={boardRef}
        className="corkboard-canvas"
        onTouchStart={(e) => {
          try {
            const t = (e.touches && e.touches[0]) as Touch | undefined;
            if (!t) return;
            // start pan when touching the background (not a card) — always enabled on mobile
            if (e.target === boardRef.current || e.target === e.currentTarget) {
              if (e.touches.length === 1) {
                panningRef.current = { startX: t.clientX, startY: t.clientY, originX: origin.x, originY: origin.y } as any;
              }
            }
          } catch (err) { /* ignore */ }
        }}
        onMouseMove={(e) => {
          if (!isUV) return;
          const boardRect = boardRef.current?.getBoundingClientRect();
          if (!boardRect) return;
          const lx = e.clientX - boardRect.left;
          const ly = e.clientY - boardRect.top;
          console.debug('uv overlay move', { isUV, performanceMode, coords: { x: lx, y: ly } });
          setOverlayPos({ x: lx, y: ly, over: true });
        }}
        onMouseLeave={() => { console.debug('uv overlay leave', { isUV, performanceMode }); setOverlayPos((o) => o ? { ...o, over: false } : null); }}
        onMouseDown={(e) => {
          if (e.target === boardRef.current || e.target === e.currentTarget) {
            // close any open context menu when clicking the background
            setContextMenu(null);
            const board = boardRef.current?.getBoundingClientRect();
            if (!board) return;
            const isLeft = e.button === 0;
            const isMiddle = e.button === 1;
            // Shift + left-drag => marquee selection
            if (isLeft && e.shiftKey) {
              const sx = e.clientX - board.left;
              const sy = e.clientY - board.top;
              const bx = sx / zoom + origin.x;
              const by = sy / zoom + origin.y;
              marqueeStartRef.current = { sx, sy, bx, by };
              setMarqueeRect({ left: sx, top: sy, width: 0, height: 0 });
              return;
            }
            // Panning: middle-click, holding Space, or left-click (no shift)
            if (isMiddle || isSpacePressed || (isLeft && !e.shiftKey)) {
              panningRef.current = { startX: e.clientX, startY: e.clientY, originX: origin.x, originY: origin.y };
              return;
            }
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          const board = boardRef.current?.getBoundingClientRect();
          if (!board) return;
          const sx = e.clientX - board.left;
          const sy = e.clientY - board.top;
          const worldX = origin.x + sx / zoom;
          const worldY = origin.y + sy / zoom;
          setContextMenu({ type: 'bg', x: worldX, y: worldY });
        }}
      >
        {marqueeRect && <div className="marquee-rect" style={{ left: marqueeRect.left, top: marqueeRect.top, width: marqueeRect.width, height: marqueeRect.height }} />}
        <div
          className="board-transform-layer"
          style={{ transform: `translate(${-origin.x}px, ${-origin.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
        >
          {/* Global UV overlay that follows the mouse across the whole corkboard */}
          {isUV && overlayPos && overlayPos.over && (() => {
            // overlayPos is in screen-local board coords (pixels from corkboard left/top)
            // convert to world coordinates inside the transformed layer: world = origin + screen/zoom
            const worldX = origin.x + (overlayPos.x / zoom);
            const worldY = origin.y + (overlayPos.y / zoom);

            // If performance mode is enabled, render a lightweight UV halo
            if (performanceMode) {
              return (
                <div className="global-uv-overlay-lite" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3100 }}>
                  <div style={{
                    position: 'absolute',
                    left: worldX,
                    top: worldY,
                    transform: 'translate(-50%, -50%)',
                    width: 220,
                    height: 220,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(179, 102, 255, 0.48) 0%, rgba(179, 102, 255, 0) 68%)',
                    pointerEvents: 'none',
                    mixBlendMode: 'screen'
                  }} />
                  {/* center highlight to make the UV spot more visible on dark canvases */}
                  <div style={{
                    position: 'absolute',
                    left: worldX,
                    top: worldY,
                    transform: 'translate(-50%, -50%)',
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'rgba(200,140,255,0.18)',
                    pointerEvents: 'none',
                    mixBlendMode: 'screen'
                  }} />
                </div>
              );
            }

            // Full effect when not in performance mode
            return (
              <div className="global-uv-overlay" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3000 }}>
                <div style={{ position: 'absolute', left: worldX, top: worldY, transform: 'translate(-50%, -50%)', width: 220, height: 220, borderRadius: '50%', pointerEvents: 'none', mixBlendMode: 'screen', filter: 'blur(12px)', boxShadow: '0 0 120px 40px rgba(179,102,255,0.45)' }} />
                <div style={{ position: 'absolute', left: worldX, top: worldY, transform: 'translate(-50%, -50%)', width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(180,102,255,0.18) 40%, rgba(80,10,120,0.5) 80%, transparent 100%)`, pointerEvents: 'none' }} />
              </div>
            );
          })()}
          {/* overflow visible prevents SVG clipping for lines that extend past view */}
          <svg className="connections-layer" style={{ overflow: 'visible' }}>
            {connections.map((conn) => {
              const a = getCardCenter(conn.from_card_id);
              const b = getCardCenter(conn.to_card_id);
              if (!a || !b) return null;
              // prefer explicit saved color, otherwise derive from metadata.type
              const savedColor = (conn.color || (conn.metadata && conn.metadata.color) || null) as string | null;
              const type = (conn.metadata && conn.metadata.type) || 'confirmed';
              const stroke = savedColor || (type === 'theory' ? '#f9a825' : type === 'mystic' ? '#7e57c2' : '#c62828');
              const dash = type === 'theory' ? '6 6' : type === 'mystic' ? '2 6' : undefined;
              const width = type === 'mystic' ? 2.5 : 3;
              const cls = `connection-line type-${type}`;
              return (
                <line
                  key={conn.id}
                  className={cls}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={stroke}
                  strokeWidth={width}
                  strokeDasharray={dash}
                />
              );
            })}
            {connectionMode && connectionStart && mousePos && (() => {
              const a = getCardCenter(connectionStart);
              const board = boardRef.current?.getBoundingClientRect();
              if (!a || !board) return null;
              const mx = (mousePos.x - board.left) / zoom + origin.x;
              const my = (mousePos.y - board.top) / zoom + origin.y;
              const stroke = connectionColor || 'rgba(255,255,255,0.8)';
              const dash = connectionType === 'theory' ? '6 6' : connectionType === 'mystic' ? '2 8' : undefined;
              const width = connectionType === 'mystic' ? 2 : 3;
              return <line className="temp-line" x1={a.x} y1={a.y} x2={mx} y2={my} stroke={stroke} strokeWidth={width} strokeDasharray={dash} />;
            })()}
          </svg>

          {cards.filter(card => !card.is_hidden || (isGameMaster && showHiddenClues)).map((card) => {
            const pos = localPositions[card.id] || { x: card.x || 100, y: card.y || 100 };
            const metadata = parseCardMetadata(card);
            const unified = resolveUnifiedMedia(card, metadata, { revealBase: false });
            const masked = unified.masked_preview;
            const displayImage = unified.image_url || card.image_url || null;
            const fileType = unified.base_media_type || (card?.video_url || unified.video_url ? 'video' : (card?.audio_url || unified.audio_url ? 'audio' : card?.image_url ? 'image' : 'text'));
            const cardType = (() => {
              if (masked && (unified.base_media_type === 'video' || card?.type === 'encrypted_video')) return 'encrypted';
              if (unified.type === 'glitch_puzzle' || card?.type === 'glitch_puzzle') return 'glitch';
              if (unified.type === 'mega_clue' || card?.type === 'mega_clue') return 'mega-clue';
              if (card?.is_locked || card?.lock_password) return 'encrypted';
              if (card?.is_hidden && showHiddenClues) return 'hidden';
              return 'normal';
            })();
            const isSelected = selectedIds.includes(card.id);
            const isNew = lastCreatedId === card.id;
            return (
                <div
                key={card.id}
                  className={`card-node ${isSelected ? 'selected' : ''} ${isNew ? 'newly-created' : ''} ${touchMode === 'interact' ? 'mobile-interactive' : ''} ${card.is_hidden && showHiddenClues ? 'hidden-clue' : ''}`}
                  data-status={(card as any)?.metadata?.status || ''}
                  style={{ left: pos.x, top: pos.y, pointerEvents: 'auto' }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const board = boardRef.current?.getBoundingClientRect();
                  const sx = board ? e.clientX - board.left : 0;
                  const sy = board ? e.clientY - board.top : 0;
                  const worldX = origin.x + sx / zoom;
                  const worldY = origin.y + sy / zoom;
                  setContextMenu({ type: 'card', targetId: card.id, x: worldX, y: worldY });
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  // only begin drag on primary (left) mouse button
                  if (e.button !== 0) return;
                  const additive = e.shiftKey || e.ctrlKey || e.metaKey;
                  // compute the new selection synchronously so dragging uses the intended set
                  let newSelected: string[] = [];
                  if (!connectionMode) {
                    if (additive) {
                      if (selectedIds.includes(card.id)) newSelected = selectedIds.filter(s => s !== card.id);
                      else newSelected = [...selectedIds, card.id];
                    } else {
                      newSelected = [card.id];
                    }
                    setSelectedIds(newSelected);
                  }

                  // Convert click to world coordinates using zoom/origin refs
                  const worldMouse = getWorldPosition(e.clientX, e.clientY);
                  const cardX = localPositions[card.id]?.x ?? card.x ?? pos.x;
                  const cardY = localPositions[card.id]?.y ?? card.y ?? pos.y;

                  // Save origPositions for any affected selection (keeps multi-select behavior)
                  const affected = (newSelected.length > 0 && newSelected.includes(card.id)) ? newSelected : [card.id];
                  const origPositions: Record<string, { x: number; y: number }> = {};
                  affected.forEach((id) => {
                    const p = localPositions[id] || (() => {
                      const found = cards.find((cc) => cc.id === id);
                      return found ? { x: found.x || 100, y: found.y || 100 } : { x: cardX, y: cardY };
                    })();
                    origPositions[id] = { x: p.x, y: p.y };
                  });

                  // Anchor offset: where the mouse hit relative to the card
                  const offsetX = worldMouse.x - cardX;
                  const offsetY = worldMouse.y - cardY;

                  draggingRef.current = { id: card.id, offsetX, offsetY, isDragging: true, origPositions } as any;
                }}
                onClick={async (ev) => {
                  ev.stopPropagation();
                  if (connectionMode) {
                    const handled = await onCardClickWhenConnecting(card.id);
                    if (handled) return;
                  }
                  // normal click toggles selection (single click selects)
                  if (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey) toggleSelect(card.id, false);
                }}
                onTouchStart={(ev) => {
                  ev.stopPropagation();
                  const t = ev.touches[0];
                  // On touch, default to selecting this card (no modifier keys)
                  const newSelected = [card.id];
                  setSelectedIds(newSelected);
                  const affected = [card.id];
                  const origPositions: Record<string, { x: number; y: number }> = {};
                  affected.forEach((id) => {
                    const p = localPositions[id] || (() => {
                      const found = cards.find((cc) => cc.id === id);
                      return found ? { x: found.x || 100, y: found.y || 100 } : { x: pos.x, y: pos.y };
                    })();
                    origPositions[id] = { x: p.x, y: p.y };
                  });
                  const boardRect = boardRef.current?.getBoundingClientRect();
                  const startScreenX = boardRect ? t.clientX - boardRect.left : t.clientX;
                  const startScreenY = boardRect ? t.clientY - boardRect.top : t.clientY;
                  const startWorldX = origin.x + startScreenX / zoom;
                  const startWorldY = origin.y + startScreenY / zoom;
                  const pointerOffsets: Record<string, { ox: number; oy: number }> = {};
                  Object.keys(origPositions).forEach((id) => {
                    const base = origPositions[id];
                    pointerOffsets[id] = { ox: startWorldX - base.x, oy: startWorldY - base.y };
                  });
                  const primaryOffsetX = startWorldX - pos.x;
                  const primaryOffsetY = startWorldY - pos.y;
                  const next = { id: card.id, startX: t.clientX, startY: t.clientY, startScreenX, startScreenY, startWorldX, startWorldY, origPositions, origX: pos.x, origY: pos.y, pointerOffsets, offsetX: primaryOffsetX, offsetY: primaryOffsetY, hasMoved: false, isDragging: true } as any;
                  draggingRef.current = next;
                }}
                onDoubleClick={async (e) => {
                  // prevent the double-click from leaving an active drag/pan
                  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                  draggingRef.current = null;
                  panningRef.current = null;
                  // if the card contains excalidraw JSON URL or data, open Sketchpad with it
                  try {
                    const meta = card?.metadata || {};
                    if (meta.excalidraw_url) {
                      try {
                        const resp = await fetch(meta.excalidraw_url);
                        if (resp.ok) {
                          const json = await resp.json();
                          setSketchInitialData(json);
                          setEditingSketchId(card.id);
                          setSketchOpen(true);
                          return;
                        }
                      } catch (fe) { console.warn('failed to fetch excalidraw_url', fe); }
                    }
                    const data = meta.excalidraw_data;
                    if (data) {
                      setSketchInitialData(typeof data === 'string' ? JSON.parse(data) : data);
                      setEditingSketchId(card.id);
                      setSketchOpen(true);
                      return;
                    }
                  } catch (e) { console.warn('failed to parse excalidraw metadata', e); }
                  // Open inspection modal through the central unlock handler
                  handleCardOpen(card);
                }}
              >
                <div style={{ width: 280 }}>
                  <EvidenceCard
                    id={card.id}
                    image={displayImage}
                    hiddenSrc={card.image_uv_url}
                    title={card.title}
                    isUV={isUV}
                    status={(card?.metadata || {})?.status || null}
                    locked={Boolean(
                      card?.is_locked === true || card?.is_locked === 1 || (typeof card?.is_locked === 'string' && ['true','t','1'].includes(String(card.is_locked).toLowerCase())) || card?.lock_password
                    )}
                    isGameMaster={isGameMaster}
                    playerView={viewerMode}
                    fileType={fileType as any}
                    cardType={cardType as any}
                    hasRecord={Boolean(card?.metadata && (card.metadata.type === 'person' || card.metadata.person || card.metadata.person_meta))}
                    hasUV={Boolean(card?.image_uv_url)}
                    hasHiddenAudio={Boolean(unified.audio_hidden_url || card?.audio_hidden_url || (metadata && (metadata.audio_hidden_url || metadata.audio_hidden)))}
                    hasAudio={Boolean(unified.audio_url || card?.audio_url || (metadata && (metadata.audio || metadata.audio_url)))}
                    hasVideo={Boolean(unified.video_url || card?.video_url || (metadata && (metadata.type === 'video' || metadata.video)))}
                    hasChat={Boolean(card?.chat_data || (card?.metadata && (card.metadata.chat_data || card.metadata.chat)))}
                    hasThermal={Boolean(card?.metadata && card.metadata.thermal)}
                    hasStamp={Boolean(card?.stamp_text || (card?.metadata && card.metadata.stamp_text))}
                    hasExternalLink={Boolean(card?.metadata && card.metadata.external_link)}
                    blurred={masked}
                    onToggleStatus={async (newStatus) => {
                      // map directly to existing toggle function
                      try {
                        await toggleCardStatus(card.id, newStatus as any, []);
                      } catch (e) { console.error('toggle from EvidenceCard failed', e); }
                    }}
                    onOpen={() => handleCardOpen(card)}
                    performanceMode={performanceMode}
                  />
                </div>
              </div>
            );
          })}

          {/* Sticky notes layer removed */}

          {touchModeNotice && (
            <div className="touch-mode-notice" role="status">{touchModeNotice}</div>
          )}

          {/* Pinch overlay */}
          {isPinching && (
            <div className="pinch-overlay" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 1000
            }}>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>🔍 Pinch to Zoom</div>
            </div>
          )}
        </div>
      </div>

          {/* --- HUD EXCLUSIVO PARA CELULAR --- */}
          {isMobileDevice && (
            <div className="mobile-hud">

              {/* mobile mode toggles removed — pan is the default on touch devices */}

              {/* 2. BOTTOM SHEET MENU */}
              <div className="mobile-fab-container">
                <button 
                  className="main-fab-trigger" 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  ☰
                </button>
              </div>
            </div>
          )}

          <BottomSheet isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Ferramentas de Investigação">
            <h3>Ferramentas</h3>
            {isGameMaster && (
              <button onClick={() => {setCreateModalOpen(true); setMobileMenuOpen(false)}} className="fab-item primary">
                ⚙️ HUB DE CRIAÇÃO
              </button>
            )}
            <button onClick={() => setConnectionMode(!connectionMode)} className={`fab-item ${connectionMode?'active':''}`}>
              🔗 {connectionMode ? 'PARAR CONEXÃO' : 'CONECTAR'}
            </button>
            <button onClick={() => setShowFinder(true)} className="fab-item">
              🔍 BUSCAR
            </button>
            <button onClick={() => setIsUV(!isUV)} className={`fab-item ${isUV?'uv-active':''}`}>
              🔦 LUZ UV
            </button>
            <button onClick={() => setOrigin({x:0, y:0})} className="fab-item">
              🎯 LOCALIZAR
            </button>
            <h3>Zoom</h3>
            {isMobileDevice ? (
              <div style={{ padding: '8px 0', color: '#888' }}>Use dois dedos para aproximar/afastar (pinch)</div>
            ) : (
              <>
                <button onClick={() => { zoomIn(); setMobileMenuOpen(false); }} className="fab-item">🔍 ZOOM IN</button>
                <button onClick={() => { zoomOut(); setMobileMenuOpen(false); }} className="fab-item">🔍 ZOOM OUT</button>
                <button onClick={() => resetZoom()} className="fab-item">🎯 RESET ZOOM</button>
              </>
            )}
          </BottomSheet>

          <Suspense fallback={<div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',color:'var(--nexus-blue)',fontSize:18}}>CARREGANDO...</div>}>
            <CreatorHub
              isOpen={createModalOpen}
              onClose={() => { setCreateModalOpen(false); setCreateModalPos(null); }}
              investigationId={investigationId}
              onOpenLegacyModal={() => setShowLegacyModal(true)}
              onPuzzleCreated={async (created?: any) => {
                try {
                  await loadBoard();
                  if (created && created.id) {
                    const cx = (typeof created.x === 'number' ? created.x : created.x) + 220 / 2;
                    const cy = (typeof created.y === 'number' ? created.y : created.y) + 160 / 2;
                    panToPosition(cx, cy);
                    setLastCreatedId(created.id);
                    setTimeout(() => setLastCreatedId(null), 6000);
                  }
                } catch (e) {
                  console.error('Error handling created card pan', e);
                }
              }}
            />
          </Suspense>

      <InvestigationCardModal open={modalOpen} existing={editingCard} investigationId={investigationId} onClose={() => setModalOpen(false)} onSaved={loadBoard} isGameMaster={isGameMaster} />
      {sketchOpen && (
        <Sketchpad
          initialData={sketchInitialData || undefined}
          onClose={() => { setSketchOpen(false); setSketchInitialData(null); setEditingSketchId(null); }}
          onSaveImage={async (imageFile: File, jsonContent: string) => {
            try {
              // upload PNG image
              const uploaded = await uploadInvestigationImage(imageFile, investigationId);
              if (!uploaded) throw new Error('Falha ao subir imagem do rascunho');

              // upload JSON content as .json file
              const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
              const jsonFile = new File([jsonBlob], `sketch_${Date.now()}.json`, { type: 'application/json' });
              const jsonUrl = await uploadInvestigationFile(jsonFile, investigationId, 'json');
              if (!jsonUrl) throw new Error('Falha ao subir JSON do rascunho');

              // decide whether to embed JSON in DB metadata as a fallback (small JSON only)
              const jsonSize = new Blob([jsonContent]).size;
              const shouldEmbed = jsonSize <= EMBED_EXCALIDRAW_JSON_LIMIT;

              const payload: any = {
                investigation_id: investigationId,
                title: 'Rascunho',
                description_public: null,
                image_url: uploaded,
                metadata: { excalidraw_url: jsonUrl, ...(shouldEmbed ? { excalidraw_data: jsonContent } : {}) },
              };

              if (editingSketchId) {
                // update existing card
                await api.updateInvestigationCard(editingSketchId, { image_url: uploaded, metadata: { excalidraw_url: jsonUrl, ...(shouldEmbed ? { excalidraw_data: jsonContent } : {}) } } as any);
                await loadBoard();
                panToPosition((localPositions[editingSketchId]?.x || 100) + 110, (localPositions[editingSketchId]?.y || 100) + 80);
                setLastCreatedId(editingSketchId);
                setTimeout(() => setLastCreatedId(null), 6000);
              } else {
                // compute center position for new card
                const boardRect = boardRef.current?.getBoundingClientRect();
                const viewW = boardRect?.width ?? windowWidth;
                const viewH = boardRect?.height ?? window.innerHeight;
                const cx = origin.x + (viewW / 2) / zoom;
                const cy = origin.y + (viewH / 2) / zoom;
                payload.x = Math.round(cx - 220 / 2);
                payload.y = Math.round(cy - 160 / 2);
                const created = await api.createInvestigationCard(payload as any);
                await loadBoard();
                if (created && (created as any).id) {
                  panToPosition(((created as any).x || payload.x) + 110, ((created as any).y || payload.y) + 80);
                  setLastCreatedId((created as any).id);
                  setTimeout(() => setLastCreatedId(null), 6000);
                }
              }
            } catch (err) {
              console.error('Falha ao salvar rascunho', err);
              alert('Erro ao salvar rascunho. Veja console.');
            } finally {
              setSketchOpen(false);
              setSketchInitialData(null);
              setEditingSketchId(null);
            }
          }}
        />
      )}
      {showSharedBoard && (
        <ConspiracyBoard investigationId={investigationId} onClose={() => setShowSharedBoard(false)} />
      )}
      <SystemTerminal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        cards={cards}
        onOpenCard={(c: any) => { setInspectCard(c); setModalOpen(true); setTerminalOpen(false); }}
        onThermalUnlock={handleThermalUnlock}
        onDiscoverHidden={handleDiscoverHidden}
      />
      {unlockingCard && (
        <CodePromptModal
          title={unlockingCard.title || 'ACESSO REQUERIDO'}
          description={(() => {
            const meta = parseCardMetadata(unlockingCard);
            const mega = meta?.mega_clue;
            if (unlockingCard?.type === 'mega_clue' || mega) {
              const required = Array.isArray(mega?.required_puzzle_ids) ? mega.required_puzzle_ids.length : (mega?.required_code_count || 0);
              const solved = Array.isArray(mega?.solved_puzzle_ids) ? mega.solved_puzzle_ids.length : 0;
              return `Mega-Pista protegida. Progresso: ${solved}/${required || '?'} códigos. Digite um código de recompensa.`;
            }
            return 'Este arquivo está protegido. Digite o código de acesso para abrir.';
          })()}
          onSubmit={handleUnlockSubmit}
          onClose={() => setUnlockingCard(null)}
        />
      )}
      {decoderOpen && (
        <div className="decoder-overlay-wrapper">
          <div className="decoder-header-mobile">
            <div style={{ color: '#c6a45f', fontWeight: 700 }}>DECODIFICADOR</div>
            <button className="hud-btn" onClick={() => setDecoderOpen(false)}>✖</button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <UniversalDecoder />
          </div>
        </div>
      )}
      {showLegacyModal && (
        <Suspense fallback={<div>Carregando...</div>}>
          <CreateClueModalLegacy
            isOpen={showLegacyModal}
            onClose={() => setShowLegacyModal(false)}
            investigationId={investigationId}
            onSaved={(created?: any) => {
              loadBoard();
              if (created && created.id) {
                const cx = (typeof created.x === 'number' ? created.x : created.x) + 220 / 2;
                const cy = (typeof created.y === 'number' ? created.y : created.y) + 160 / 2;
                panToPosition(cx, cy);
                setLastCreatedId(created.id);
                setTimeout(() => setLastCreatedId(null), 6000);
              }
              setShowLegacyModal(false);
            }}
          />
        </Suspense>
      )}
      {/* GM Overwatch Panel */}
      {isGameMaster && (
        <GMOverwatch
          investigationId={investigationId}
          isVisible={gmOverwatchOpen}
          onToggle={() => setGmOverwatchOpen(!gmOverwatchOpen)}
        />
      )}
    </div>
  );
});

InvestigationBoard.displayName = 'InvestigationBoard';

export default InvestigationBoard;
