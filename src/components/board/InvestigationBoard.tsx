import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BoxSelect,
  CalendarDays,
  Check,
  CircleHelp,
  Crown,
  Eye,
  FileText,
  Flashlight,
  FolderOpen,
  Glasses,
  Grid,
  LayoutGrid,
  LayoutPanelTop,
  Layers2,
  Lightbulb,
  KeyRound,
  Keyboard,
  Link2,
  Lock,
  LocateFixed,
  Mail,
  Maximize2,
  Menu,
  Navigation,
  Pin,
  Plus,
  Radar,
  Radio,
  Redo2,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  StickyNote,
  Unlock,
  SquareDashed,
  Tag,
  Terminal,
  Trash2,
  Undo2,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../api/investigations';
import * as connApi from '../../api/connections';
import InvestigationCardModal from '../modals/InvestigationCardModal';
import InviteModal from '../modals/InviteModal';
// CreateClueModal é pesado — import estático para evitar falhas de carregamento dinâmico em produção
import CreateClueModal from '../modals/CreateClueModal_Refactored';
const CreateClueModalLegacy = React.lazy(() => import('../modals/CreateClueModal'));
import Sketchpad from '../tools/Sketchpad';
import TerminalSearch from './TerminalSearch';
import { playAudio } from '../../utils/audio';
import { uploadInvestigationImage, uploadInvestigationFile } from '../../utils/storage';
import { supabase } from '../../supabaseClient';
import Toast from '../../components/ui/Toast';

import MysteryImage from './MysteryImage';
import './MysteryEffects.css';
import './EvidenceCard.css';
import './investigation.css';
import './investigation.lenses.css';
import './InvestigationBoard.css';
import EvidenceCard from './EvidenceCard';
import TacticalMinimap from './TacticalMinimap';
import BoardZonesLayer, { MagneticGuides } from './BoardZonesLayer';
import { useBoardStore, BoardZone } from '../../store/boardStore';
import {
  organizeByTimeline,
  organizeByElement,
  organizeByGrid,
  organizeByVeracity,
  unstackCards,
} from '../../utils/layoutAlgorithms';
import InspectionModal from '../modals/InspectionModal';
import { ForensicDispatchProvider } from '../../contexts/ForensicDispatchContext';
import { CollaborationProvider, useCollaboration } from '../../contexts/CollaborationContext';
import { useAuth } from '../auth/AuthProvider';
import FindingsDrawer from '../collaboration/FindingsDrawer';
import { useTacticalPings } from '../../hooks/useTacticalPings';
import { TEAM_STATUS_META, TeamCardStatus } from '../../types/collaboration';
import { TeamStatusIcon } from '../collaboration/CollaborationIcons';
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
import ConnectionLine from '../ConnectionLine';
import InteractionToggleButton from '../InteractionToggleButton';
import { FloatingNudgePad } from '../ui/FloatingNudgePad';
import { TouchContextMenu } from '../ui/TouchContextMenu';
import {
  getUnlockedCodes,
  markCardSeen,
  PLAYER_TRACKING_EVENT,
  recordUnlockedCode,
  shouldShowNewBadge,
  UnlockedCodeEntry,
} from '../../utils/playerTracking';
// Local fallback for BoardButton (avoids missing module error)
const CrosshairIconProxy = () => <LocateFixed size={18} />;
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

const GlobalUVOverlay = ({ isUV, performanceMode, boardRef, zoom, origin, uvTouchPos }: any) => {
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number; over: boolean } | null>(null);

  useEffect(() => {
    if (!isUV || !boardRef.current) return;
    const el = boardRef.current;
    
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const lx = e.clientX - rect.left;
      const ly = e.clientY - rect.top;
      setOverlayPos({ x: lx, y: ly, over: true });
    };
    
    const onLeave = () => setOverlayPos(o => o ? { ...o, over: false } : null);
    
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [isUV, boardRef]);

  // Se houver toque ativo na lente UV, ele prevalece
  const activePos = (uvTouchPos && uvTouchPos.active)
    ? { x: uvTouchPos.x, y: uvTouchPos.y, over: true }
    : overlayPos;

  if (!activePos || !activePos.over) return null;

  const worldX = origin.x + (activePos.x / zoom);
  const worldY = origin.y + (activePos.y / zoom);

  if (performanceMode) {
    return (
      <div className="global-uv-overlay-lite" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 'var(--z-uv, 800)' }}>
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

  return (
    <div className="global-uv-overlay" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 'var(--z-uv, 800)' }}>
      <div style={{ position: 'absolute', left: worldX, top: worldY, transform: 'translate(-50%, -50%)', width: 220, height: 220, borderRadius: '50%', pointerEvents: 'none', mixBlendMode: 'screen', filter: 'blur(12px)', boxShadow: '0 0 120px 40px rgba(179,102,255,0.45)' }} />
      <div style={{ position: 'absolute', left: worldX, top: worldY, transform: 'translate(-50%, -50%)', width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(180,102,255,0.18) 40%, rgba(80,10,120,0.5) 80%, transparent 100%)`, pointerEvents: 'none' }} />
      {uvTouchPos?.active && <div className="global-uv-touch-ring" style={{ left: worldX, top: worldY }} />}
    </div>
  );
};

function InvestigationBoardInner({
  investigationId,
  onRegisterNavigateToCard,
}: Props & { onRegisterNavigateToCard?: (fn: (cardId: string) => void) => void }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const user = session?.user;
  const {
    pinsByCardId,
    cardStatuses,
    setCardTeamStatus,
    findings,
    isDrawerOpen,
    setDrawerOpen,
  } = useCollaboration();
  const authorName =
    (user as any)?.user_metadata?.code_name ||
    (user as any)?.email?.split('@')[0] ||
    'Agente';
  const { tacticalPings, sendTacticalPing } = useTacticalPings(
    investigationId,
    (user as any)?.id,
    authorName
  );
  const [teamStatusFilter, setTeamStatusFilter] = useState<'all' | TeamCardStatus>('all');
  const [mobilePingMode, setMobilePingMode] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  // Context menu state for connection right-click
  const [connectionContextMenu, setConnectionContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [pins, setPins] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<{id: string, type: 'pin', x: number, y: number} | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [pinType, setPinType] = useState<'vermelho'|'azul'|'verde'>('vermelho');
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [createModalPos, setCreateModalPos] = useState<{ x: number; y: number } | null>(null);
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [showLegacyModal, setShowLegacyModal] = useState(false);

  const [zoom, setZoom] = useState(0.9);
  const [isUV, setIsUV] = useState(false);
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

  // rAF batching to reduce state churn while dragging/panning/zooming
  const positionFrameRef = useRef<number | null>(null);
  const pendingPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const originFrameRef = useRef<number | null>(null);
  const pendingOriginRef = useRef<{ x: number; y: number } | null>(null);
  const pendingZoomRef = useRef<number | null>(null);
  const [cameraAnimating, setCameraAnimating] = useState(false);
  const cameraAnimTimerRef = useRef<number | null>(null);

  const triggerCameraAnimation = useCallback(() => {
    if (cameraAnimTimerRef.current !== null) {
      window.clearTimeout(cameraAnimTimerRef.current);
    }
    setCameraAnimating(true);
    cameraAnimTimerRef.current = window.setTimeout(() => {
      cameraAnimTimerRef.current = null;
      setCameraAnimating(false);
    }, 210);
  }, []);

  const cancelCameraAnimation = useCallback(() => {
    if (cameraAnimTimerRef.current !== null) {
      window.clearTimeout(cameraAnimTimerRef.current);
      cameraAnimTimerRef.current = null;
      setCameraAnimating(false);
    }
  }, []);

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

  const flushPendingCamera = () => {
    const nextOrigin = pendingOriginRef.current;
    const nextZoom = pendingZoomRef.current;
    pendingOriginRef.current = null;
    pendingZoomRef.current = null;
    if (nextZoom !== null) setZoom(nextZoom);
    if (nextOrigin !== null) setOrigin(nextOrigin);
  };

  const scheduleOriginUpdate = (x: number, y: number) => {
    const next = { x, y };
    originRef.current = next;
    pendingOriginRef.current = next;
    if (originFrameRef.current === null) {
      originFrameRef.current = requestAnimationFrame(() => {
        originFrameRef.current = null;
        flushPendingCamera();
      });
    }
  };

  const scheduleCameraUpdate = (nextZoom: number, nextOrigin: { x: number; y: number }) => {
    zoomRef.current = nextZoom;
    originRef.current = nextOrigin;
    pendingZoomRef.current = nextZoom;
    pendingOriginRef.current = nextOrigin;
    if (originFrameRef.current === null) {
      originFrameRef.current = requestAnimationFrame(() => {
        originFrameRef.current = null;
        flushPendingCamera();
      });
    }
  };

  useEffect(() => {
    return () => {
      if (positionFrameRef.current !== null) cancelAnimationFrame(positionFrameRef.current);
      if (originFrameRef.current !== null) cancelAnimationFrame(originFrameRef.current);
      if (cameraAnimTimerRef.current !== null) window.clearTimeout(cameraAnimTimerRef.current);
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
  const [membraneState, setMembraneState] = useState<'calm' | 'amber' | 'crimson'>('calm');

  useEffect(() => {
    const computeFromDoomsday = () => {
      if (!doomsdayTarget) return null;
      const remainingMs = Math.max(0, doomsdayTarget - Date.now());
      // Considera janela de 60 min para tensão progressiva (0% -> 100%)
      const tensionPct = Math.min(100, Math.max(0, (1 - remainingMs / (60 * 60 * 1000)) * 100));
      if (tensionPct > 75) return 'crimson' as const;
      if (tensionPct >= 41) return 'amber' as const;
      return 'calm' as const;
    };

    const next = computeFromDoomsday();
    if (next) {
      setMembraneState(next);
      if (performanceMode) return;
      const iv = window.setInterval(() => {
        const updated = computeFromDoomsday();
        if (updated) setMembraneState(updated);
      }, 5000);
      return () => window.clearInterval(iv);
    }

    const onMembraneEvent = (ev: Event) => {
      const detail = (ev as CustomEvent<{ state?: 'calm' | 'amber' | 'crimson'; value?: number } | 'calm' | 'amber' | 'crimson'>).detail;
      const nextState = typeof detail === 'string' ? detail : detail?.state;
      if (nextState === 'calm' || nextState === 'amber' || nextState === 'crimson') {
        setMembraneState(nextState);
      }
    };
    window.addEventListener('ordo:membrane-state', onMembraneEvent);
    return () => window.removeEventListener('ordo:membrane-state', onMembraneEvent);
  }, [doomsdayTarget, performanceMode]);
  const [playerView, setPlayerView] = useState<boolean>(() => true);
  const isMobile = useIsMobile();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  // Mobile touch mode: 'pan' = move camera (1 finger pan), 'edit' = select/drag cards (2 finger pan)
  const isMobileDevice = isMobile;
  const [touchMode, setTouchMode] = useState<'pan' | 'edit'>(isMobileDevice ? 'pan' : 'edit');
  const [touchModeNotice, setTouchModeNotice] = useState<string | null>(null);
  const [marqueeTouchMode, setMarqueeTouchMode] = useState(false);
  const [tapToPlaceMode, setTapToPlaceMode] = useState(false);
  const [uvFollowTouch, setUvFollowTouch] = useState(false);
  const [uvTouchPos, setUvTouchPos] = useState<{ x: number; y: number; active: boolean } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'theory' | 'false'>('all');
  const [magneticGuides, setMagneticGuides] = useState<MagneticGuides>({ x: null, y: null });
  const [connectionLabelDraft, setConnectionLabelDraft] = useState('');
  const bgLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const {
    snapToGrid,
    gridSize,
    toggleSnapToGrid,
    minimapOpen,
    toggleMinimapOpen,
    zonesByInvestigation,
    setZonesForInvestigation,
  } = useBoardStore();
  const zones = zonesByInvestigation[investigationId] || [];
  // Pinch-to-zoom ref (synchronous to avoid stale closures and re-attaching listeners)
  const pinchRef = useRef<{
    initialDist: number;
    initialZoom: number;
    worldMidX: number;
    worldMidY: number;
  } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const selectedIdsRef = useRef<string[]>([]);

  // LÓGICA DE PERMISSÕES CONSOLIDADA
  // canEdit: usuário é GM E não está em modo player view
  const canEdit = isGameMaster && !playerView;
  // viewerMode: modo visualização (jogadores sempre veem assim, GMs veem quando ativam playerView)
  const viewerMode = !isGameMaster || playerView;

  const [inspectCard, setInspectCard] = useState<any | null>(null);
  const [unlockingCard, setUnlockingCard] = useState<any | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [decoderOpen, setDecoderOpen] = useState(false);
  const [decoderInitialInput, setDecoderInitialInput] = useState<string>('');
  const [decoderInitialMode, setDecoderInitialMode] = useState<string | undefined>(undefined);
  const [inspectInitialForensicMode, setInspectInitialForensicMode] = useState<'none' | 'channel' | 'hex' | 'lens' | 'decoder'>('none');
  const [codesPanelOpen, setCodesPanelOpen] = useState(false);
  const [, setTrackingVersion] = useState(0);
  const [unlockedCodes, setUnlockedCodes] = useState<UnlockedCodeEntry[]>(() =>
    investigationId ? getUnlockedCodes(investigationId) : []
  );
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const [quickNotePos, setQuickNotePos] = useState<{ x: number; y: number } | null>(null);
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteColor, setQuickNoteColor] = useState('#fef08a');
  const [quickNoteTag, setQuickNoteTag] = useState('Teoria');
  const [quickNoteSaving, setQuickNoteSaving] = useState(false);
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

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [gmOverwatchOpen, setGmOverwatchOpen] = useState(false);
  const [showHiddenClues, setShowHiddenClues] = useState(false);
  const [showFinder, setShowFinder] = useState(false);
  const [showOrganizeMenu, setShowOrganizeMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showGmMenu, setShowGmMenu] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [contextMenu, setContextMenu] = useState<null | { type: 'card' | 'bg'; targetId?: string; x: number; y: number }>(null);
  
  // Terminal search feedback
  const [terminalMessage, setTerminalMessage] = useState<string | null>(null);
  
  // Decodificador de Anomalias - Sistema de desbloqueio
  const [decoderUnlocked, setDecoderUnlocked] = useState(false);
  const [showDecoderModal, setShowDecoderModal] = useState(false);
  const [showCodePrompt, setShowCodePrompt] = useState(false);
  const anyModalOpen = modalOpen || createModalOpen || inviteOpen || Boolean(inspectCard) || Boolean(unlockingCard) || terminalOpen || decoderOpen || showDecoderModal || showCodePrompt || sketchOpen || quickNoteOpen || codesPanelOpen;

  useEffect(() => {
    if (!investigationId) return;
    const refreshTracking = () => {
      setUnlockedCodes(getUnlockedCodes(investigationId));
      setTrackingVersion((v) => v + 1);
    };
    refreshTracking();
    window.addEventListener(PLAYER_TRACKING_EVENT, refreshTracking);
    return () => window.removeEventListener(PLAYER_TRACKING_EVENT, refreshTracking);
  }, [investigationId]);

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
  const bgClickStartRef = useRef<{ x: number; y: number } | null>(null);
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

  const handleConnectionContextMenu = (e: React.MouseEvent | { clientX: number; clientY: number }, connectionId: string) => {
    if ('preventDefault' in e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const existing = connections.find((c) => c.id === connectionId);
    setConnectionLabelDraft(existing?.metadata?.label || '');
    setConnectionContextMenu({ x: e.clientX, y: e.clientY, id: connectionId });
  };

  const handleSaveConnectionLabel = async () => {
    if (!connectionContextMenu) return;
    const existing = connections.find((c) => c.id === connectionContextMenu.id);
    const nextMeta = { ...(existing?.metadata || {}), label: connectionLabelDraft.trim() || undefined };
    try {
      await (supabase as any)
        .from('investigation_connections')
        .update({ metadata: nextMeta })
        .eq('id', connectionContextMenu.id);
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionContextMenu.id ? { ...c, metadata: nextMeta } : c))
      );
      setConnectionContextMenu(null);
      showToast({ id: 'conn-label-updated', message: 'Rótulo da conexão atualizado' });
    } catch (err) {
      console.error('Erro ao salvar rótulo da conexão', err);
    }
  };

  const handleDeleteConnection = async () => {
    if (!connectionContextMenu) return;
    try {
      await connApi.deleteInvestigationConnection(connectionContextMenu.id);
      setConnectionContextMenu(null);
      await loadBoard();
    } catch (err) {
      console.error('Erro ao deletar conexão', err);
    }
  };

  const handleChangeConnectionType = async (type: 'confirmed' | 'theory' | 'mystic') => {
    if (!connectionContextMenu) return;
    const color = type === 'theory' ? '#f9a825' : type === 'mystic' ? '#7e57c2' : '#c62828';
    try {
      await (supabase as any)
        .from('investigation_connections')
        .update({
          color,
          metadata: { type }
        })
        .eq('id', connectionContextMenu.id);
      setConnectionContextMenu(null);
      await loadBoard();
      showToast({ id: 'conn-type-updated', message: `Conexão alterada para ${type}` });
    } catch (err) {
      console.error('Erro ao atualizar tipo de conexão', err);
    }
  };

  const closeConnectionContextMenu = () => setConnectionContextMenu(null);

  // Delete a connection by id (used for double-click delete)
  const handleDeleteConnectionById = async (id: string) => {
    try {
      await connApi.deleteInvestigationConnection(id);
      await loadBoard();
    } catch (err) {
      console.error('Erro ao deletar conexão (double-click)', err);
    }
  };

  // Close custom context menu when clicking anywhere else
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      // Close only on left-click (button === 0). Ignore right-clicks.
      if (ev.button === 0 && connectionContextMenu) setConnectionContextMenu(null);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [connectionContextMenu]);

  // Terminal / ARG search: reveals a hidden card based on keyword_unlock (exact or ilike)
  const handleThermalUnlock = async (keyword: string): Promise<{ success: boolean; message: string; card?: any }> => {
    const q = keyword.trim();
    if (!q) {
      return { success: false, message: 'Palavra-chave vazia.' };
    }
    try {
      // Server-side filter: ask Postgres to match JSON metadata ->> thermal_keyword (case-insensitive)
      const { data, error } = await supabase
        .from('investigation_cards')
        .select('id, metadata')
        .eq('investigation_id', investigationId)
        .ilike('metadata->>thermal_keyword', q)
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: false, message: 'Palavra-chave não reconhecida pelo sistema.' };
      }

      const thermalCard = data[0] as any;
      try {
        const meta = typeof thermalCard.metadata === 'string' ? JSON.parse(thermalCard.metadata) : (thermalCard.metadata || {});
        meta.thermal_unlocked = true;
        // Persist change
        await api.updateInvestigationCard(thermalCard.id, { metadata: meta } as any);
        try { playAudio('/sounds/success_chime.mp3'); } catch {}

        // Update local state to avoid reloading the whole board
        setCards((prev) => prev.map((c) => (c.id === thermalCard.id ? { ...c, metadata: meta } : c)));
        return { success: true, message: 'Modo termal desbloqueado com sucesso.', card: thermalCard };
      } catch (err) {
        console.error('Error unlocking thermal mode', err);
        return { success: false, message: 'Erro ao processar desbloqueio.' };
      }
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
        message: '⚠️ DECODIFICADOR DE ANOMALIAS v1.7 DESBLOQUEADO',
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

  // Carregar zonas do localStorage por investigação
  useEffect(() => {
    if (!investigationId) return;
    try {
      const raw = localStorage.getItem(`ordo_zones_${investigationId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setZonesForInvestigation(investigationId, parsed);
      }
    } catch {
      // ignore
    }
  }, [investigationId, setZonesForInvestigation]);

  const persistZones = useCallback(
    (nextZones: BoardZone[]) => {
      setZonesForInvestigation(investigationId, nextZones);
      try {
        localStorage.setItem(`ordo_zones_${investigationId}`, JSON.stringify(nextZones));
      } catch {
        // ignore
      }
    },
    [investigationId, setZonesForInvestigation]
  );

  const handleAddZone = useCallback(() => {
    const boardRect = boardRef.current?.getBoundingClientRect();
    const viewW = boardRect?.width ?? windowWidth;
    const viewH = boardRect?.height ?? windowHeight;
    const cx = originRef.current.x + viewW / (2 * (zoomRef.current || 1));
    const cy = originRef.current.y + viewH / (2 * (zoomRef.current || 1));
    const newZone: BoardZone = {
      id: `zone-${Date.now()}`,
      title: `ZONA ${zones.length + 1}`,
      x: Math.round(cx - 260),
      y: Math.round(cy - 180),
      width: 520,
      height: 360,
      color: '#64748b',
    };
    persistZones([...zones, newZone]);
    showToast({ id: 'zone-created', message: 'Moldura de zona criada. Duplo clique no título para renomear.' });
  }, [zones, persistZones, windowWidth, windowHeight]);

  const handleUpdateZone = useCallback(
    (id: string, patch: Partial<BoardZone>) => {
      persistZones(zones.map((z) => (z.id === id ? { ...z, ...patch } : z)));
    },
    [zones, persistZones]
  );

  const handleDeleteZone = useCallback(
    (id: string) => {
      persistZones(zones.filter((z) => z.id !== id));
    },
    [zones, persistZones]
  );

  const pendingUpdatesRef = useRef<Record<string, any>>({});
  const realtimeUpdateTimeout = useRef<any>(null);

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
              pendingUpdatesRef.current[newRow.id] = newRow;
              if (!realtimeUpdateTimeout.current) {
                realtimeUpdateTimeout.current = setTimeout(() => {
                  if (!mounted) return;
                  realtimeUpdateTimeout.current = null;
                  const updates = pendingUpdatesRef.current;
                  pendingUpdatesRef.current = {};
                  const updateIds = Object.keys(updates);
                  if (updateIds.length === 0) return;

                  setCards((prev: any[]) => prev.map((c: any) => updates[c.id] ? updates[c.id] : c));
                  setLocalPositions((prev: Record<string, { x: number; y: number }>) => {
                    const next = { ...prev };
                    updateIds.forEach(id => {
                      const row = updates[id];
                      const has = prev[id] || { x: row.x ?? 100, y: row.y ?? 100 };
                      next[id] = {
                        x: (row.x !== undefined && row.x !== null) ? row.x : has.x,
                        y: (row.y !== undefined && row.y !== null) ? row.y : has.y
                      };
                    });
                    return next;
                  });
                }, 300);
              }
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
      setMagneticGuides({ x: null, y: null });
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

  // <Check className="lucide-icon inline-icon" size={16} /> MIGRADO: useGlobalMouseEvents - sem recreação de listeners
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

  // Update marquee selection rectangle and selected cards from pointer/touch coordinates
  const updateMarqueeSelection = useCallback((clientX: number, clientY: number) => {
    const start = marqueeStartRef.current;
    const board = boardRef.current?.getBoundingClientRect();
    if (!start || !board) return;
    const z = zoomRef.current || 1;
    const orig = originRef.current;
    const sx = clientX - board.left;
    const sy = clientY - board.top;
    const left = Math.min(start.sx, sx);
    const top = Math.min(start.sy, sy);
    const width = Math.abs(sx - start.sx);
    const height = Math.abs(sy - start.sy);
    setMarqueeRect({ left, top, width, height });

    const bx1 = Math.min(start.bx, sx / z + orig.x);
    const by1 = Math.min(start.by, sy / z + orig.y);
    const bx2 = Math.max(start.bx, sx / z + orig.x);
    const by2 = Math.max(start.by, sy / z + orig.y);
    const sel: string[] = [];
    const CARD_W = 220;
    const CARD_H = 160;
    (cardsRef.current || []).forEach((c) => {
      const p = localPositionsRef.current[c.id] || { x: c.x || 100, y: c.y || 100 };
      const cx1 = p.x;
      const cy1 = p.y;
      const cx2 = p.x + CARD_W;
      const cy2 = p.y + CARD_H;
      const overlap = !(cx2 < bx1 || cx1 > bx2 || cy2 < by1 || cy1 > by2);
      if (overlap) sel.push(c.id);
    });
    setSelectedIds(sel);
  }, []);

  // Global mouse/touch handler using refs to avoid stale closures
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 0. Marquee selection
      if (marqueeStartRef.current) {
        updateMarqueeSelection(e.clientX, e.clientY);
        return;
      }

      // 1. Panning
      if (panningRef.current) {
        cancelCameraAnimation();
        const z = zoomRef.current || 1;
        const dx = (e.clientX - panningRef.current.startX) / z;
        const dy = (e.clientY - panningRef.current.startY) / z;
        scheduleOriginUpdate(panningRef.current.originX - dx, panningRef.current.originY - dy);
      }

      // 2. Dragging
      if (draggingRef.current && draggingRef.current.isDragging) {
        const d = draggingRef.current as any;
        const worldNow = getWorldPosition(e.clientX, e.clientY);
        let nextX = worldNow.x - (d.offsetX || 0);
        let nextY = worldNow.y - (d.offsetY || 0);
        if (snapToGrid && gridSize > 0) {
          nextX = Math.round(nextX / gridSize) * gridSize;
          nextY = Math.round(nextY / gridSize) * gridSize;
        }
        // Magnetic alignment guides against other cards (threshold 8px)
        let guideX: number | null = null;
        let guideY: number | null = null;
        const SNAP_THRESHOLD = 8;
        const allCards = cardsRef.current || [];
        for (let i = 0; i < allCards.length; i += 1) {
          const other = allCards[i];
          if (!other || other.id === d.id) continue;
          const op = localPositionsRef.current[other.id] || { x: other.x ?? 100, y: other.y ?? 100 };
          if (Math.abs(op.x - nextX) <= SNAP_THRESHOLD) {
            nextX = op.x;
            guideX = op.x;
          }
          if (Math.abs(op.y - nextY) <= SNAP_THRESHOLD) {
            nextY = op.y;
            guideY = op.y;
          }
        }
        setMagneticGuides({ x: guideX, y: guideY });
        schedulePositionUpdate(d.id, { x: nextX, y: nextY });
        // schedule save (debounced)
        if (d.id) scheduleDebouncedSave(d.id);
      }
    };

    const handleMouseUp = () => {
      if (marqueeStartRef.current) {
        marqueeStartRef.current = null;
        setMarqueeRect(null);
      }
      if (draggingRef.current) {
        setMagneticGuides({ x: null, y: null });
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
      if (ev.touches.length >= 2 || pinchRef.current) {
        panningRef.current = null;
        return;
      }
      ev.preventDefault();
      const t = ev.touches[0];
      if (!t) return;

      // 0. Marquee selection
      if (marqueeStartRef.current) {
        updateMarqueeSelection(t.clientX, t.clientY);
        return;
      }

      // 1. Panning
      if (panningRef.current) {
        cancelCameraAnimation();
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

  const toggleCardStatus = useCallback(async (cardId: string, status: string, currentTags: string[]) => {
    // compute newStatus from current cards state to avoid race between setState and API call
    setCards(prev => {
      const existing = prev.find(c => c.id === cardId);
      const newStatus = (existing?.metadata?.status === status) ? null : status;
      
      const doUpdate = async () => {
        try {
          const updated = await api.updateInvestigationCard(cardId, { metadata: { ...(existing?.metadata || {}), status: newStatus } } as any);
          console.debug('toggleCardStatus: server response', updated);
          showToast({ id: `status-${cardId}`, message: `Status atualizado: ${newStatus || 'removido'}` }, 2500);
          try {
            await loadBoard();
          } catch (loadErr) {
            console.warn('toggleCardStatus: loadBoard failed after update', loadErr);
            setCards(prev2 => prev2.map(c => (c.id !== cardId ? c : { ...c, ...(updated || {}), metadata: (updated as any)?.metadata || { ...(c.metadata || {}), status: newStatus } })));
          }
        } catch (e) {
          console.error('Erro ao salvar status', e);
          showToast({ id: `status-err-${cardId}`, message: 'Falha ao salvar status', connectionId: undefined }, 4000);
          setCards(prev2 => prev2.map(c => (c.id !== cardId ? c : { ...c, metadata: { ...(c.metadata || {}), status: existing?.metadata?.status || null } })));
        }
      };
      
      doUpdate();
      return prev.map(c => (c.id !== cardId ? c : { ...c, metadata: { ...(c.metadata || {}), status: newStatus } }));
    });
  }, [investigationId]);

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

  const cardsRef = useRef<any[]>([]);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  const handleAutoOrganize = async (mode: 'timeline' | 'element' | 'grid' | 'veracity' | 'unstack') => {
    if (cards.length === 0) return;

    setIsOrganizing(true);
    try {
      const newLayout =
        mode === 'timeline'
          ? organizeByTimeline(cards)
          : mode === 'element'
            ? organizeByElement(cards)
            : mode === 'veracity'
              ? organizeByVeracity(cards)
              : mode === 'unstack'
                ? unstackCards(cards, localPositions)
                : organizeByGrid(cards);

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

  // Keyboard shortcut: E to edit selected card
  useEffect(() => {
    const handleEditShortcut = (e: KeyboardEvent) => {
      // Only trigger if GM, not in player view, not typing in an input, and "E" key pressed
      if (!isGameMaster || playerView || !canEdit) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const selectedIds = selectedIdsRef.current;
        if (selectedIds.length === 1) {
          const cardId = selectedIds[0];
          const cardToEdit = cards.find(c => c.id === cardId);
          if (cardToEdit) {
            e.preventDefault();
            setEditingCard(cardToEdit);
            setShowLegacyModal(true);
          }
        } else if (inspectCard) {
          // If inspection modal is open, edit that card
          e.preventDefault();
          setEditingCard(inspectCard);
          setInspectCard(null);
          setShowLegacyModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleEditShortcut);
    return () => window.removeEventListener('keydown', handleEditShortcut);
  }, [isGameMaster, playerView, canEdit, cards, inspectCard]);

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

  const panToPosition = useCallback((x: number, y: number) => {
    const boardRect = boardRef.current?.getBoundingClientRect();
    const viewW = boardRect?.width ?? windowWidth;
    const viewH = boardRect?.height ?? windowHeight;
    const z = zoomRef.current || 1;
    const nextOrigin = { x: x - viewW / (2 * z), y: y - viewH / (2 * z) };
    originRef.current = nextOrigin;
    triggerCameraAnimation();
    setOrigin(nextOrigin);
  }, [windowWidth, windowHeight, triggerCameraAnimation]);

  const panToCard = useCallback((cardId: string) => {
    const pos = localPositionsRef.current[cardId] || cardsRef.current.find((c) => c.id === cardId);
    if (!pos) return;
    const cx = (pos.x ?? 100) + 122;
    const cy = (pos.y ?? 100) + 143;
    panToPosition(cx, cy);
    setSelectedIds([cardId]);
  }, [panToPosition]);

  useEffect(() => {
    if (!onRegisterNavigateToCard) return;
    onRegisterNavigateToCard((cardId: string) => {
      panToCard(cardId);
      const target = cardsRef.current.find((c) => c.id === cardId);
      if (target) {
        setInspectCard(target);
      }
    });
  }, [onRegisterNavigateToCard, panToCard]);

  const zoomToFit = useCallback(() => {
    const canSeeHidden = isGameMaster && !playerView && showHiddenClues;
    const visible = (cardsRef.current || []).filter((c) => c && (!c.is_hidden || canSeeHidden));
    if (visible.length === 0) {
      setZoom(1);
      setOrigin({ x: 0, y: 0 });
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    visible.forEach((c) => {
      const p = localPositionsRef.current[c.id] || { x: c.x ?? 100, y: c.y ?? 100 };
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + 244);
      maxY = Math.max(maxY, p.y + 286);
    });
    const boardRect = boardRef.current?.getBoundingClientRect();
    const viewW = boardRect?.width ?? windowWidth;
    const viewH = boardRect?.height ?? windowHeight;
    const boxW = Math.max(1, maxX - minX);
    const boxH = Math.max(1, maxY - minY);
    const padding = 180;
    const nextZoom = Math.min(2.2, Math.max(0.15, Math.min(viewW / (boxW + padding), viewH / (boxH + padding))));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const nextOrigin = { x: centerX - viewW / (2 * nextZoom), y: centerY - viewH / (2 * nextZoom) };
    zoomRef.current = nextZoom;
    originRef.current = nextOrigin;
    triggerCameraAnimation();
    setZoom(nextZoom);
    setOrigin(nextOrigin);
  }, [isGameMaster, playerView, showHiddenClues, windowWidth, windowHeight, triggerCameraAnimation]);

  // Ouvir evento global de Toast "Localizar" / centralizar pista
  useEffect(() => {
    const onLocate = (ev: Event) => {
      const cardId = (ev as CustomEvent<{ cardId?: string }>).detail?.cardId;
      if (cardId) panToCard(cardId);
    };
    window.addEventListener('ordo:locate-card', onLocate);
    return () => window.removeEventListener('ordo:locate-card', onLocate);
  }, [panToCard]);

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

  const openEvidenceViewer = useCallback((card: any, initialForensic: 'none' | 'channel' | 'hex' | 'lens' | 'decoder' = 'none') => {
    try {
      const pos = localPositionsRef.current[card?.id];
      if (pos) {
        const rectWidth = 220;
        const rectHeight = 160;
        panToPosition(pos.x + rectWidth / 2, pos.y + rectHeight / 2);
      }
    } catch {
      // ignore centering failures
    }
    if (card?.id && investigationId) {
      markCardSeen(String(investigationId), String(card.id), { isGameMaster, playerView });
    }
    setInspectInitialForensicMode(initialForensic);
    setInspectCard(card);
  }, [investigationId, isGameMaster, playerView]);

  const getSafeDecoderText = useCallback((card: any): string => {
    if (!card) return '';
    const meta = parseCardMetadata(card);
    if (!canEdit && isCardLocked(card, meta)) return '';
    return String(meta?.cipher_text || card?.description_public || '');
  }, [canEdit]);

  const handleSendCardToDecoder = useCallback((card: any) => {
    const safeText = getSafeDecoderText(card);
    if (!safeText && !canEdit && isCardLocked(card, parseCardMetadata(card))) {
      showToast({ id: 'decoder-locked', message: 'Desbloqueie a evidência antes de enviar para o Decoder.' }, 3000);
      return;
    }
    setDecoderInitialInput(safeText);
    setDecoderInitialMode(undefined);
    setDecoderOpen(true);
  }, [getSafeDecoderText, canEdit, showToast]);

  const handleOpenCardInHex = useCallback((card: any) => {
    const meta = parseCardMetadata(card);
    if (!canEdit && isCardLocked(card, meta)) {
      handleCardOpen(card);
      return;
    }
    const hydratedMedia = resolveUnifiedMedia(card, meta, { revealBase: true });
    openEvidenceViewer({ ...card, ...hydratedMedia, metadata: meta }, 'hex');
  }, [canEdit, openEvidenceViewer]);

  const getViewportCenterWorldPos = useCallback(() => {
    const boardRect = boardRef.current?.getBoundingClientRect();
    const viewW = boardRect?.width ?? windowWidth;
    const viewH = boardRect?.height ?? window.innerHeight;
    const CARD_W = 220;
    const CARD_H = 160;
    return {
      x: Math.round(originRef.current.x + (viewW / 2) / zoom - CARD_W / 2),
      y: Math.round(originRef.current.y + (viewH / 2) / zoom - CARD_H / 2),
    };
  }, [windowWidth, zoom]);

  const handleOpenQuickNote = useCallback((pos?: { x: number; y: number }) => {
    if (!canEdit) return;
    setQuickNotePos(pos || getViewportCenterWorldPos());
    setQuickNoteTitle('');
    setQuickNoteText('');
    setQuickNoteColor('#fef08a');
    setQuickNoteTag('Teoria');
    setQuickNoteOpen(true);
  }, [canEdit, getViewportCenterWorldPos]);

  const handleCreateQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !investigationId) return;
    const title = quickNoteTitle.trim() || 'Nota Rápida';
    const text = quickNoteText.trim();
    if (!text) {
      showToast({ id: 'quick-note-empty', message: 'Escreva o texto da nota.' }, 2500);
      return;
    }
    setQuickNoteSaving(true);
    try {
      const pos = quickNotePos || getViewportCenterWorldPos();
      const created: any = await api.createInvestigationCard({
        investigation_id: investigationId,
        title,
        description_public: text,
        x: pos.x,
        y: pos.y,
        type: 'text',
        is_hidden: false,
        tags: quickNoteTag ? [quickNoteTag] : [],
        insights: [],
        metadata: {
          quick_note: true,
          note_color: quickNoteColor,
          theory_tag: quickNoteTag,
        },
      } as any);
      setQuickNoteOpen(false);
      await loadBoard();
      if (created?.id) {
        setLastCreatedId(created.id);
        setTimeout(() => setLastCreatedId(null), 5000);
      }
      showToast({ id: 'quick-note-ok', message: '📝 Nota rápida adicionada ao quadro!' }, 2500);
    } catch (err) {
      console.error('Erro ao criar nota rápida:', err);
      showToast({ id: 'quick-note-err', message: 'Falha ao criar nota rápida.' }, 3200);
    } finally {
      setQuickNoteSaving(false);
    }
  };

  // Ctrl+V: Colar imagem diretamente no quadro (apenas Mestre ativo com canEdit === true)
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      if (!canEdit || !investigationId) return;
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        const tag = active.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || active.isContentEditable) {
          return;
        }
      }
      if (anyModalOpen) return;

      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      let imageFile: File | null = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          imageFile = items[i].getAsFile();
          if (imageFile) break;
        }
      }
      if (!imageFile) return;

      e.preventDefault();
      const pos = getViewportCenterWorldPos();
      showToast({ id: 'paste-upload', message: 'Colando imagem no quadro...' }, 4000);
      try {
        const uploadedUrl = await uploadInvestigationImage(imageFile, investigationId);
        const baseName = imageFile.name ? imageFile.name.replace(/\.[^.]+$/, '') : '';
        const title = baseName && baseName !== 'image' ? baseName : `Evidência Colada`;
        const created: any = await api.createInvestigationCard({
          investigation_id: investigationId,
          title,
          image_url: uploadedUrl,
          x: pos.x,
          y: pos.y,
          type: 'image',
          is_hidden: false,
          tags: [],
          insights: [],
          metadata: { pasted_from_clipboard: true },
        } as any);
        await loadBoard();
        if (created?.id) {
          setLastCreatedId(created.id);
          setTimeout(() => setLastCreatedId(null), 5000);
        }
        showToast({ id: 'paste-ok', message: '✓ Imagem colada como nova pista!' }, 2800);
      } catch (err) {
        console.error('Erro ao colar imagem no quadro:', err);
        showToast({ id: 'paste-err', message: 'Falha ao colar imagem no quadro.' }, 3400);
      }
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [canEdit, investigationId, anyModalOpen, getViewportCenterWorldPos, showToast]);

  const handleCardOpen = useCallback((card: any) => {
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
  }, [isGameMaster, playerView, openEvidenceViewer]);

  const handleEditCard = useCallback((card: any) => {
    setEditingCard(card);
    setShowLegacyModal(true);
  }, []);

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

        if (investigationId) {
          recordUnlockedCode(
            investigationId,
            {
              cardId: String(unlockingCard.id),
              cardTitle: unlockingCard.title || 'Mega-Pista',
              code,
              lockType: 'mega_clue',
            },
            { isGameMaster, playerView }
          );
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
      if (investigationId) {
        recordUnlockedCode(
          investigationId,
          {
            cardId: String(unlockingCard.id),
            cardTitle: unlockingCard.title || 'Evidência Protegida',
            code,
            lockType: 'prompt',
          },
          { isGameMaster, playerView }
        );
      }
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

  // Zoom helpers: multiplicative scaling centered on viewport, using refs to avoid stale closures
  const zoomToFactor = useCallback((factor: number) => {
    const prev = zoomRef.current || 1;
    const newZoom = Math.min(Math.max(prev * factor, 0.1), 3);
    if (Math.abs(newZoom - prev) < 0.0001) return;
    const boardRect = boardRef.current?.getBoundingClientRect();
    const originNow = originRef.current;
    let nextOrigin = originNow;
    if (boardRect && originNow) {
      const centerX = originNow.x + (boardRect.width / 2) / prev;
      const centerY = originNow.y + (boardRect.height / 2) / prev;
      nextOrigin = {
        x: centerX - (boardRect.width / 2) / newZoom,
        y: centerY - (boardRect.height / 2) / newZoom,
      };
    }
    zoomRef.current = newZoom;
    originRef.current = nextOrigin;
    triggerCameraAnimation();
    setZoom(newZoom);
    setOrigin(nextOrigin);
  }, [triggerCameraAnimation]);

  const zoomIn = useCallback(() => zoomToFactor(1.2), [zoomToFactor]);
  const zoomOut = useCallback(() => zoomToFactor(1 / 1.2), [zoomToFactor]);
  const resetZoom = useCallback(() => {
    const prev = zoomRef.current || 1;
    const boardRect = boardRef.current?.getBoundingClientRect();
    const originNow = originRef.current;
    let nextOrigin = { x: 0, y: 0 };
    if (boardRect && originNow) {
      const centerX = originNow.x + (boardRect.width / 2) / prev;
      const centerY = originNow.y + (boardRect.height / 2) / prev;
      nextOrigin = {
        x: centerX - boardRect.width / 2,
        y: centerY - boardRect.height / 2,
      };
    }
    zoomRef.current = 1;
    originRef.current = nextOrigin;
    triggerCameraAnimation();
    setZoom(1);
    setOrigin(nextOrigin);
  }, [triggerCameraAnimation]);

  // Wheel-based zoom (Ctrl/Cmd + wheel) and scroll-pan when not holding Ctrl, plus pinch-to-zoom
  useEffect(() => {
    const normalizeDelta = (delta: number, mode: number) => {
      if (mode === 1) return delta * 16; // DOM_DELTA_LINE
      if (mode === 2) return delta * 100; // DOM_DELTA_PAGE
      return delta;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelCameraAnimation();

      const dx = normalizeDelta(e.deltaX, e.deltaMode);
      const dyRaw = normalizeDelta(e.deltaY, e.deltaMode);

      // Shift + wheel => pan; horizontal-only trackpad swipe => horizontal pan
      if (e.shiftKey || (dyRaw === 0 && dx !== 0)) {
        const z = zoomRef.current || 1;
        const curr = pendingOriginRef.current || originRef.current;
        scheduleOriginUpdate(curr.x + dx / z, curr.y + dyRaw / z);
        return;
      }

      if (dyRaw === 0) return;

      const dy = Math.max(-120, Math.min(120, dyRaw));
      const prevZoom = zoomRef.current || 1;
      const factor = Math.exp(-dy * 0.0022);
      const newZoom = Math.min(Math.max(prevZoom * factor, 0.1), 3);
      const boardRect = boardRef.current?.getBoundingClientRect();
      const currOrigin = pendingOriginRef.current || originRef.current;

      if (boardRect) {
        const offsetX = e.clientX - boardRect.left;
        const offsetY = e.clientY - boardRect.top;
        const worldX = currOrigin.x + offsetX / prevZoom;
        const worldY = currOrigin.y + offsetY / prevZoom;
        const nextOrigin = {
          x: worldX - offsetX / newZoom,
          y: worldY - offsetY / newZoom,
        };
        scheduleCameraUpdate(newZoom, nextOrigin);
      } else {
        scheduleCameraUpdate(newZoom, currOrigin);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        cancelCameraAnimation();
        panningRef.current = null;
        draggingRef.current = null;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        const boardRect = boardRef.current?.getBoundingClientRect();
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        const currZoom = zoomRef.current || 1;
        const currOrigin = pendingOriginRef.current || originRef.current;
        const worldMidX = boardRect ? currOrigin.x + (midX - boardRect.left) / currZoom : currOrigin.x;
        const worldMidY = boardRect ? currOrigin.y + (midY - boardRect.top) / currZoom : currOrigin.y;
        pinchRef.current = {
          initialDist: Math.max(dist, 1),
          initialZoom: currZoom,
          worldMidX,
          worldMidY,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const ps = pinchRef.current;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        const newZoom = Math.max(0.1, Math.min(3, ps.initialZoom * (dist / ps.initialDist)));
        const boardRect = boardRef.current?.getBoundingClientRect();
        if (boardRect) {
          const midX = (touch1.clientX + touch2.clientX) / 2;
          const midY = (touch1.clientY + touch2.clientY) / 2;
          const nextOrigin = {
            x: ps.worldMidX - (midX - boardRect.left) / newZoom,
            y: ps.worldMidY - (midY - boardRect.top) / newZoom,
          };
          scheduleCameraUpdate(newZoom, nextOrigin);
        } else {
          scheduleCameraUpdate(newZoom, originRef.current);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchRef.current = null;
      }
    };

    const boardEl = boardRef.current;
    if (boardEl) {
      boardEl.addEventListener('wheel', handleWheel, { passive: false });
      boardEl.addEventListener('touchstart', handleTouchStart, { passive: false });
      boardEl.addEventListener('touchmove', handleTouchMove, { passive: false });
      boardEl.addEventListener('touchend', handleTouchEnd, { passive: false });
      boardEl.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }
    return () => {
      if (boardEl) {
        boardEl.removeEventListener('wheel', handleWheel as any);
        boardEl.removeEventListener('touchstart', handleTouchStart as any);
        boardEl.removeEventListener('touchmove', handleTouchMove as any);
        boardEl.removeEventListener('touchend', handleTouchEnd as any);
        boardEl.removeEventListener('touchcancel', handleTouchEnd as any);
      }
    };
  }, [cancelCameraAnimation]);

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
        case 'fit-view':
          zoomToFit();
          break;
        case 'minimap':
          toggleMinimapOpen();
          break;
        case 'marquee':
          setMarqueeTouchMode((prev) => {
            const next = !prev;
            showToast({ id: 'mob-marquee', message: next ? 'Seleção em Área: arraste no fundo' : 'Seleção em Área desativada' });
            return next;
          });
          break;
        case 'snap-grid':
          toggleSnapToGrid();
          showToast({ id: 'mob-snap', message: !snapToGrid ? 'Snap to Grid: ATIVADO' : 'Snap to Grid: DESATIVADO' });
          break;
        case 'organize':
          setShowOrganizeMenu(true);
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
  }, [connectionMode, isUV, undo, redo, togglePerformanceMode, zoomToFit, toggleMinimapOpen, toggleSnapToGrid, snapToGrid]);

  // Cross-Highlight: compute connected neighbor IDs when 1 card is selected
  const activeCrossHighlightIds = React.useMemo(() => {
    if (selectedIds.length !== 1) return null;
    const focusId = selectedIds[0];
    const connected = new Set<string>([focusId]);
    connections.forEach((c) => {
      if (c.from_card_id === focusId && c.to_card_id) connected.add(c.to_card_id);
      if (c.to_card_id === focusId && c.from_card_id) connected.add(c.from_card_id);
    });
    return connected;
  }, [selectedIds, connections]);

  const connectedNeighborsForSingle = React.useMemo(() => {
    if (selectedIds.length !== 1) return [];
    const focusId = selectedIds[0];
    const ids = new Set<string>();
    connections.forEach((c) => {
      if (c.from_card_id === focusId && c.to_card_id) ids.add(c.to_card_id);
      if (c.to_card_id === focusId && c.from_card_id) ids.add(c.from_card_id);
    });
    return Array.from(ids)
      .map((id) => cards.find((c) => c.id === id))
      .filter((c): c is any => Boolean(c && (!c.is_hidden || (isGameMaster && !playerView && showHiddenClues))));
  }, [selectedIds, connections, cards, isGameMaster, playerView, showHiddenClues]);

  return (
    <div
      className="investigation-board"
      data-performance-mode={performanceMode ? 'on' : 'off'}
      data-membrane-state={membraneState}
    >
      {terminalMessage && <div className="reveal-hud">{terminalMessage}</div>}
      <header className="investigation-header">
        <div className="header-left">
          <button className="board-back-btn" onClick={() => navigate('/')}><ArrowLeft size={14} /> ARQUIVOS</button>
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
         <div className="board-context-menu" style={{ left, top }}>
          {contextMenu.type === 'card' ? (
            <>
             <div className="context-menu-title">GERENCIAR EVIDÊNCIA</div>
             <div className="context-status-row">
               <button className="hud-btn" onClick={() => { toggleCardStatus(contextMenu.targetId!, 'verified', []); setContextMenu(null); }} title="Confirmar Fato"><Check size={16} /></button>
               <button className="hud-btn" onClick={() => { toggleCardStatus(contextMenu.targetId!, 'theory', []); setContextMenu(null); }} title="Marcar como Teoria"><CircleHelp size={16} /></button>
               <button className="hud-btn" onClick={() => { toggleCardStatus(contextMenu.targetId!, 'false', []); setContextMenu(null); }} title="Descartar / Falso"><X size={16} /></button>
             </div>
             <hr style={{borderColor:'#333', margin:'4px 0'}} />
             {(() => {
               const targetCard = cards.find((c) => c.id === contextMenu.targetId);
               if (!targetCard) return null;
               const targetMeta = parseCardMetadata(targetCard);
               const isTargetLockedForViewer = !canEdit && isCardLocked(targetCard, targetMeta);
               if (isTargetLockedForViewer) return null;
               return (
                 <>
                   <button className="hud-btn" onClick={() => { handleSendCardToDecoder(targetCard); setContextMenu(null); }}><KeyRound size={15} /> Enviar para Decoder</button>
                   <button className="hud-btn" onClick={() => { handleOpenCardInHex(targetCard); setContextMenu(null); }}><Keyboard size={15} /> Abrir no Hex</button>
                   <hr style={{borderColor:'#333', margin:'4px 0'}} />
                 </>
               );
             })()}
             <button className="hud-btn" onClick={() => { api.updateInvestigationCard(contextMenu.targetId!, { z_index: 1000 }); loadBoard(); setContextMenu(null); }}><ArrowUp size={15} /> Trazer para Frente</button>
             <button className="hud-btn" onClick={() => { api.updateInvestigationCard(contextMenu.targetId!, { z_index: 1 }); loadBoard(); setContextMenu(null); }}><ArrowDown size={15} /> Mandar para Trás</button>
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
                 className="context-danger"
               >
                 <Trash2 size={15} /> Queimar Arquivo
               </button>
             )}
            </>
          ) : (
            <>
             <div className="context-menu-title">MESA DE INVESTIGAÇÃO</div>
             {canEdit && (
               <>
                 <button className="hud-btn" onClick={() => { const CARD_W = 220; const CARD_H = 160; setCreateModalPos({ x: Math.round(contextMenu.x - CARD_W/2), y: Math.round(contextMenu.y - CARD_H/2) }); setCreateModalOpen(true); setContextMenu(null); }}><Plus size={15} /> Nova Pista Aqui</button>
                 <button className="hud-btn" onClick={() => { const CARD_W = 220; const CARD_H = 160; handleOpenQuickNote({ x: Math.round(contextMenu.x - CARD_W/2), y: Math.round(contextMenu.y - CARD_H/2) }); setContextMenu(null); }}><StickyNote size={15} /> Nota Rápida</button>
               </>
             )}
             <button className="hud-btn" onClick={() => { handleAutoOrganize('timeline'); setContextMenu(null); }}><CalendarDays size={15} /> Organizar Timeline</button>
             <button className="hud-btn" onClick={() => { setOrigin({x:0, y:0}); setContextMenu(null); }}><LocateFixed size={15} /> Resetar Câmera</button>
            </>
          )}
         </div>
        );
      })()}
      {/* Header moved to dedicated element above */}

      {/* BARRA DE NAVEGAÇÃO MOBILE */}
      {isMobileDevice && (
        <>
          <BottomNavigationBar
            isGameMaster={isGameMaster}
            activeTools={{
              search: showFinder,
              uv: isUV,
              connect: connectionMode,
              marquee: marqueeTouchMode,
              'snap-grid': snapToGrid,
              minimap: minimapOpen,
              terminal: terminalOpen,
              performance: performanceMode,
            }}
          />
          <InteractionToggleButton
            mode={touchMode}
            onToggle={() => {
              setTouchMode(prev => {
                const next = prev === 'pan' ? 'edit' : 'pan';
                setTouchModeNotice(next === 'pan' ? 'Modo Panorâmica: arraste com 1 dedo' : 'Modo Edição: toque e mova pistas');
                setTimeout(() => setTouchModeNotice(null), 3000);
                return next;
              });
            }}
          />
        </>
      )}

      {/* SIDEBAR: Modos & Criação */}
      {!isMobileDevice && (
        <nav className="investigation-sidebar" aria-label="Modos e Criação do Quadro">
          <button
            className={`tbtn ${!connectionMode && !noteMode && !pinMode && !tapToPlaceMode && !isUV && !marqueeTouchMode ? 'on' : ''}`}
            onClick={() => {
              setConnectionMode(false);
              setNoteMode(false);
              setPinMode(false);
              setTapToPlaceMode(false);
              setIsUV(false);
              setMarqueeTouchMode(false);
            }}
            title="Mover / Selecionar (V)"
          >
            <LocateFixed size={18} />MOVER
          </button>
          {canEdit && (
            <>
              <button className="tbtn" onClick={handleCreateClue} title="Criar Nova Pista no Centro (P)">
                <Plus size={18} />PISTA
              </button>
              <button
                className={`tbtn ${tapToPlaceMode ? 'on' : ''}`}
                onClick={() => {
                  setConnectionMode(false);
                  setNoteMode(false);
                  setPinMode(false);
                  setMarqueeTouchMode(false);
                  setTapToPlaceMode((v) => !v);
                }}
                title="Toque no quadro para posicionar nova pista"
              >
                <CrosshairIconProxy />INSERIR
              </button>
              <button className={`tbtn ${noteMode ? 'on' : ''}`} onClick={() => { setConnectionMode(false); setPinMode(false); setTapToPlaceMode(false); setMarqueeTouchMode(false); setNoteMode((v) => !v); }} title="Nota (N)">
                <FileText size={18} />NOTA
              </button>
              <div className="tbtn-wrap">
                <button
                  className={`tbtn ${pinMode ? 'on' : ''}`}
                  onClick={() => { setConnectionMode(false); setNoteMode(false); setTapToPlaceMode(false); setMarqueeTouchMode(false); setPinMode((v) => !v); }}
                  title="Pin"
                >
                  <Pin size={18} />PIN
                </button>
                {pinMode && (
                  <div className="sidebar-flyout" role="group" aria-label="Cor do Pin">
                    <span className="sidebar-flyout-label">COR DO PIN</span>
                    <div className="sidebar-flyout-dots">
                      <button type="button" className={`pin-dot ${pinType === 'vermelho' ? 'active' : ''}`} style={{ background: '#e63946' }} onClick={() => setPinType('vermelho')} title="Pino vermelho" aria-label="Pino vermelho" />
                      <button type="button" className={`pin-dot ${pinType === 'azul' ? 'active' : ''}`} style={{ background: '#3b82f6' }} onClick={() => setPinType('azul')} title="Pino azul" aria-label="Pino azul" />
                      <button type="button" className={`pin-dot ${pinType === 'verde' ? 'active' : ''}`} style={{ background: '#eab308' }} onClick={() => setPinType('verde')} title="Pino amarelo" aria-label="Pino amarelo" />
                    </div>
                  </div>
                )}
              </div>
              <button className="tbtn" onClick={handleAddZone} title="Criar Moldura / Zona de Grupo">
                <SquareDashed size={18} />ZONA
              </button>
            </>
          )}
          <div className="sdiv" />
          <div className="tbtn-wrap">
            <button
              className={`tbtn ${connectionMode ? 'on' : ''}`}
              onClick={() => {
                setNoteMode(false);
                setPinMode(false);
                setTapToPlaceMode(false);
                setMarqueeTouchMode(false);
                setConnectionMode((prev) => {
                  const next = !prev;
                  if (!next) setConnectionStart(null);
                  return next;
                });
              }}
              title="Conectar Pistas (C)"
            >
              <Link2 size={18} />FIO
            </button>
            {connectionMode && (
              <div className="sidebar-flyout" role="group" aria-label="Tipo de Fio">
                <span className="sidebar-flyout-label">TIPO DE FIO</span>
                <button
                  type="button"
                  className={`sidebar-flyout-btn ${connectionType === 'confirmed' ? 'active' : ''}`}
                  onClick={() => { setConnectionType('confirmed'); setConnectionColor('#c62828'); }}
                >
                  <span className="flyout-swatch" style={{ background: '#c62828' }} />FATO
                </button>
                <button
                  type="button"
                  className={`sidebar-flyout-btn ${connectionType === 'theory' ? 'active' : ''}`}
                  onClick={() => { setConnectionType('theory'); setConnectionColor('#f9a825'); }}
                >
                  <span className="flyout-swatch" style={{ background: '#f9a825' }} />TEORIA
                </button>
                <button
                  type="button"
                  className={`sidebar-flyout-btn ${connectionType === 'mystic' ? 'active' : ''}`}
                  onClick={() => { setConnectionType('mystic'); setConnectionColor('#7e57c2'); }}
                >
                  <span className="flyout-swatch" style={{ background: '#7e57c2' }} />SOBRENATURAL
                </button>
              </div>
            )}
          </div>
          <button
            className={`tbtn ${marqueeTouchMode ? 'on' : ''}`}
            onClick={() => {
              setConnectionMode(false);
              setNoteMode(false);
              setPinMode(false);
              setTapToPlaceMode(false);
              setMarqueeTouchMode((v) => !v);
            }}
            title="Seleção em Área — arraste no quadro para selecionar várias pistas (ou Shift + arrastar)"
          >
            <BoxSelect size={18} />ÁREA
          </button>
        </nav>
      )}

      {!isMobileDevice && (
        <div
          className="investigation-toolbar"
          data-game-master={isGameMaster ? 'true' : 'false'}
          data-player-view={playerView ? 'true' : 'false'}
        >
          {/* Grupo 1: Criação */}
          {canEdit && (
            <div className="toolbar-group" role="group" aria-label="Ações Principais">
              <button
                className="hud-btn primary"
                onClick={() => { console.debug('HUD: CreatorHub opened', { isGameMaster, playerView, canEdit }); setCreateModalOpen(true); }}
                data-tooltip="Criar Nova Evidência: pistas, puzzles, mega-pistas"
                data-gm-only="true"
              >
                <Settings size={16} /> HUB DE CRIAÇÃO
              </button>
            </div>
          )}

          {/* Grupo 2: Controle do Mestre (Dropdown compacto) */}
          {isGameMaster && (
            <div className="toolbar-group" role="group" aria-label="Controle do Mestre" style={{ position: 'relative' }}>
              <button
                className={`hud-btn ${(playerView || showHiddenClues || gmOverwatchOpen) ? 'active' : ''}`}
                onClick={() => { setShowGmMenu(!showGmMenu); setShowToolsMenu(false); }}
                data-tooltip="Opções do Mestre (Convite, Visão Jogador, Ocultas, Overwatch)"
                data-gm-only="true"
                aria-expanded={showGmMenu}
              >
                <Crown size={16} /> Mestre
              </button>
              {showGmMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">CONTROLE DO MESTRE</div>
                  <button
                    onClick={async () => {
                      setShowGmMenu(false);
                      try {
                        const invite = await api.createInviteLink(investigationId);
                        if (invite?.invite_code) {
                          setInviteLink(`${window.location.origin}/invite/${invite.invite_code}`);
                        }
                      } catch (e) {
                        console.error('Falha ao gerar link de convite', e);
                        alert('Falha ao gerar link de convite');
                      }
                      setInviteOpen(true);
                    }}
                  >
                    <Mail size={15} /> Convidar Jogadores
                  </button>
                  <button
                    onClick={() => { setPlayerView(!playerView); setShowGmMenu(false); }}
                    style={playerView ? { color: '#38bdf8' } : undefined}
                  >
                    {playerView ? <Eye size={15} /> : <Glasses size={15} />}
                    {playerView ? 'Voltar à Visão Mestre' : 'Visão do Jogador'}
                  </button>
                  <button
                    onClick={() => { setShowHiddenClues(!showHiddenClues); setShowGmMenu(false); }}
                    style={showHiddenClues ? { color: '#38bdf8' } : undefined}
                  >
                    <Eye size={15} />
                    {showHiddenClues ? 'Ocultar Pistas Escondidas' : 'Mostrar Pistas Escondidas'}
                  </button>
                  <button
                    onClick={() => { setGmOverwatchOpen(!gmOverwatchOpen); setShowGmMenu(false); }}
                    style={gmOverwatchOpen ? { color: '#f9a825' } : undefined}
                  >
                    <Crown size={15} /> GM Overwatch
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Grupo 3: Investigação, Filtros & Busca */}
          <div className="toolbar-group" role="group" aria-label="Investigação e Filtros">
            <button
              className="hud-btn"
              onClick={() => setCodesPanelOpen(true)}
              data-tooltip="Códigos e Senhas Desbloqueados"
            >
              <KeyRound size={15} /> Códigos{unlockedCodes.length > 0 ? ` (${unlockedCodes.length})` : ''}
            </button>
            <button
              className={`hud-btn ${isDrawerOpen ? 'active' : ''}`}
              onClick={() => setDrawerOpen(!isDrawerOpen)}
              data-tooltip="Gaveta de Achados da Equipe"
            >
              <Archive size={15} /> Gaveta{findings.length > 0 ? ` (${findings.length})` : ''}
            </button>
            {isMobileDevice && (
              <button
                className={`hud-btn ${mobilePingMode ? 'active' : ''}`}
                onClick={() => setMobilePingMode((m) => !m)}
                data-tooltip="Toque no quadro para enviar Ping Tático ao vivo"
              >
                <LocateFixed size={15} /> {mobilePingMode ? 'Toque no Quadro...' : 'Pingar'}
              </button>
            )}
            <button
              className={`hud-btn icon-only ${isUV ? 'active-uv' : ''}`}
              onClick={() => setIsUV(!isUV)}
              data-tooltip={isUV ? 'Desativar Luz Ultravioleta (UV)' : 'Ativar Luz Ultravioleta (UV)'}
              aria-label="Alternar Luz Ultravioleta (UV)"
              aria-pressed={isUV}
            >
              <Flashlight size={16} />
            </button>
            <button
              className={`hud-btn ${statusFilter !== 'all' ? 'active' : ''}`}
              onClick={() => {
                const order: Array<'all' | 'verified' | 'theory' | 'false'> = ['all', 'verified', 'theory', 'false'];
                const next = order[(order.indexOf(statusFilter) + 1) % order.length];
                setStatusFilter(next);
              }}
              data-tooltip="Filtrar por Status (Esmaecimento)"
              aria-label="Filtrar por Status"
            >
              {statusFilter === 'all' ? 'TODOS' : statusFilter === 'verified' ? 'FATOS' : statusFilter === 'theory' ? 'TEORIAS' : 'FALSOS'}
            </button>
            <button
              className={`hud-btn ${teamStatusFilter !== 'all' ? 'active' : ''}`}
              onClick={() => {
                const order: Array<'all' | TeamCardStatus> = ['all', 'unexplored', 'has_clue', 'stuck', 'exhausted'];
                const next = order[(order.indexOf(teamStatusFilter) + 1) % order.length];
                setTeamStatusFilter(next);
              }}
              data-tooltip="Filtrar por Progresso da Equipe"
              aria-label="Filtrar por Progresso da Equipe"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              {teamStatusFilter === 'all' ? (
                'EQUIPE: TODOS'
              ) : (
                <>
                  <TeamStatusIcon status={teamStatusFilter} size={13} />{' '}
                  {TEAM_STATUS_META[teamStatusFilter].shortLabel.toUpperCase()}
                </>
              )}
            </button>
            <button className={`hud-btn icon-only ${showFinder ? 'active' : ''}`} onClick={() => setShowFinder(!showFinder)} data-tooltip="Buscar pistas (Ctrl+F)" aria-label="Buscar pistas">
              <Search size={16} />
            </button>
          </div>

          {/* Grupo 4: Histórico & Mais Ferramentas */}
          <div className="toolbar-group" role="group" aria-label="Histórico e Ferramentas">
            <button className="hud-btn icon-only" onClick={() => undo()} disabled={undoStack.length === 0} data-tooltip="Desfazer (Ctrl+Z)" aria-label="Desfazer">
              <Undo2 size={16} />
            </button>
            <button className="hud-btn icon-only" onClick={() => redo()} disabled={redoStack.length === 0} data-tooltip="Refazer (Ctrl+Y)" aria-label="Refazer">
              <Redo2 size={16} />
            </button>
            <div style={{ position: 'relative' }}>
              <button
                className={`hud-btn icon-only ${(showToolsMenu || terminalOpen || snapToGrid || performanceMode) ? 'active' : ''}`}
                onClick={() => { setShowToolsMenu(!showToolsMenu); setShowGmMenu(false); }}
                data-tooltip="Mais ferramentas (Terminal, Decodificador, Organizar, Grid)"
                aria-label="Mais ferramentas"
                aria-expanded={showToolsMenu}
              >
                <SlidersHorizontal size={16} />
              </button>
              {showToolsMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">FERRAMENTAS</div>
                  <button
                    onClick={() => { setTerminalOpen(!terminalOpen); setShowToolsMenu(false); }}
                    style={terminalOpen ? { color: '#38bdf8' } : undefined}
                  >
                    <Terminal size={15} /> Terminal C.R.I.S.
                  </button>
                  <button onClick={() => { setDecoderOpen(true); setShowToolsMenu(false); }}>
                    <Lock size={15} /> Decodificador de Texto
                  </button>
                  <button
                    onClick={() => { toggleSnapToGrid(); setShowToolsMenu(false); }}
                    style={snapToGrid ? { color: '#38bdf8' } : undefined}
                  >
                    <Grid size={15} /> Snap to Grid: {snapToGrid ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => { togglePerformanceMode(); setShowToolsMenu(false); }}
                    style={performanceMode ? { color: '#f9a825' } : undefined}
                  >
                    <Zap size={15} /> Modo Performance: {performanceMode ? 'ON' : 'OFF'}
                  </button>
                  <div className="dropdown-header" style={{ marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 6 }}>ORGANIZAR PISTAS</div>
                  <button onClick={() => { handleAutoOrganize('timeline'); setShowToolsMenu(false); }}><CalendarDays size={15} /> Por Data</button>
                  <button onClick={() => { handleAutoOrganize('element'); setShowToolsMenu(false); }}><LayoutGrid size={15} /> Por Elemento</button>
                  <button onClick={() => { handleAutoOrganize('veracity'); setShowToolsMenu(false); }}><Check size={15} /> Por Status</button>
                  <button onClick={() => { handleAutoOrganize('grid'); setShowToolsMenu(false); }}><Grid size={15} /> Em Grade</button>
                  <button onClick={() => { handleAutoOrganize('unstack'); setShowToolsMenu(false); }}><Layers2 size={15} /> Desempilhar</button>
                </div>
              )}
            </div>
          </div>

          {/* Grupo 5: Câmera */}
          <div className="toolbar-group toolbar-zoom" role="group" aria-label="Câmera">
            <button className="hud-btn icon-only" onClick={zoomOut} data-tooltip="Diminuir Zoom" aria-label="Diminuir Zoom"><ZoomOut size={16} /></button>
            <button
              type="button"
              className="hud-btn tabular-nums toolbar-zoom-value"
              onClick={resetZoom}
              data-tooltip="Resetar Zoom para 100%"
              aria-label="Resetar Zoom para 100%"
              style={{ fontSize: 11, fontWeight: 700, minWidth: 46, justifyContent: 'center', padding: '0 6px' }}
            >
              {(zoom * 100).toFixed(0)}%
            </button>
            <button className="hud-btn icon-only" onClick={zoomIn} data-tooltip="Aumentar Zoom" aria-label="Aumentar Zoom"><ZoomIn size={16} /></button>
            <button className="hud-btn icon-only" onClick={zoomToFit} data-tooltip="Enquadrar Tudo (Zoom to Fit)" aria-label="Enquadrar Tudo"><Maximize2 size={16} /></button>
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
        <TerminalSearch
          cards={cards.filter((c) => !c.is_hidden || (isGameMaster && !playerView && showHiddenClues))}
          onSelectCard={(cardId) => panToCard(cardId)}
          onSearch={handleTerminalSearch}
          onClose={() => { setShowFinder(false); setTerminalMessage(null); }}
        />
      )}

      {/* Modais */}
      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} investigationId={investigationId} inviteLink={inviteLink} />
      {inspectCard && (
        <ForensicDispatchProvider
          onDispatchToDecoder={(text) => {
            setInspectCard(null);
            setDecoderInitialInput(text);
            setDecoderOpen(true);
          }}
          onSaveSnippet={async (snippet) => {
            try {
              let uploadedUrl: string | null = snippet.imageUrl || null;
              if (snippet.imageBlob) {
                const file = new File([snippet.imageBlob], `recorte-${Date.now()}.png`, { type: 'image/png' });
                uploadedUrl = await uploadInvestigationImage(file, investigationId);
              }
              const srcCard = cards.find((c: any) => c.id === snippet.sourceCardId);
              await api.createCard({
                investigation_id: investigationId,
                title: snippet.title,
                description_public: snippet.description || 'Recorte extraído na bancada forense.',
                image_url: uploadedUrl,
                x: typeof srcCard?.x === 'number' ? srcCard.x + 280 : 240,
                y: typeof srcCard?.y === 'number' ? srcCard.y : 240,
                tags: ['recorte-forense', 'recorte-jogador'],
                metadata: {
                  is_player_snippet: true,
                  source_card_id: snippet.sourceCardId || null,
                },
              });
              await loadBoard();
            } catch (err) {
              console.error('Erro ao salvar recorte no mural:', err);
            }
          }}
        >
          <InspectionModal
            isOpen={!!inspectCard}
            card={inspectCard}
            isGameMaster={isGameMaster}
            playerView={viewerMode}
            performanceMode={performanceMode}
            initialForensicMode={inspectInitialForensicMode}
            onSendToDecoder={(text, mode) => {
              setInspectCard(null);
              setDecoderInitialInput(text);
              if (mode) setDecoderInitialMode(mode);
              setDecoderOpen(true);
            }}
            onClose={() => { setInspectCard(null); setInspectInitialForensicMode('none'); }}
            onEdit={() => {
              // Open legacy CreateClueModal (full editor) in edit mode instead of CreatorHub
              setEditingCard(inspectCard);
              setInspectCard(null);
              setShowLegacyModal(true);
            }}
            externalBaseId={inspectCard ? `card-base-${inspectCard.id}` : undefined}
            externalHiddenId={inspectCard ? `card-hidden-${inspectCard.id}` : undefined}
          />
        </ForensicDispatchProvider>
      )}

      {tapToPlaceMode && (
        <div className="tap-to-place-banner" role="status">
          <span>TOQUE NO QUADRO PARA POSICIONAR A PISTA</span>
          <button type="button" onClick={() => setTapToPlaceMode(false)}>CANCELAR</button>
        </div>
      )}

      <div
        ref={boardRef}
        className={[
          'corkboard-canvas',
          zoom < 0.48 ? 'semantic-zoom-low' : '',
          activeCrossHighlightIds ? 'cross-highlight-active' : '',
          statusFilter !== 'all' ? 'filtering-active' : '',
          snapToGrid ? 'snap-grid-active' : '',
          isUV && uvFollowTouch ? 'uv-touch-locked' : '',
          marqueeTouchMode ? 'marquee-mode' : '',
        ].filter(Boolean).join(' ')}
        onTouchStart={(e) => {
          try {
            if (bgLongPressTimerRef.current) {
              clearTimeout(bgLongPressTimerRef.current);
              bgLongPressTimerRef.current = null;
            }
            // Se modo UV estiver ativo com Seguir o Toque, toque move a lente e trava pan
            if (isUV && uvFollowTouch) {
              const t0 = e.touches[0];
              if (t0 && boardRef.current) {
                const rect = boardRef.current.getBoundingClientRect();
                setUvTouchPos({ x: t0.clientX - rect.left, y: t0.clientY - rect.top, active: true });
                return;
              }
            }

            // Toque para posicionar nova pista
            if (tapToPlaceMode && e.touches.length === 1 && boardRef.current && (e.target === boardRef.current || e.target === e.currentTarget)) {
              const t0 = e.touches[0];
              const rect = boardRef.current.getBoundingClientRect();
              const worldX = origin.x + (t0.clientX - rect.left) / zoom;
              const worldY = origin.y + (t0.clientY - rect.top) / zoom;
              setCreateModalPos({ x: Math.round(worldX - 122), y: Math.round(worldY - 143) });
              setTapToPlaceMode(false);
              setCreateModalOpen(true);
              return;
            }

            // Marquee selection via touch
            if (marqueeTouchMode && e.touches.length === 1 && boardRef.current) {
              const t0 = e.touches[0];
              const rect = boardRef.current.getBoundingClientRect();
              const sx = t0.clientX - rect.left;
              const sy = t0.clientY - rect.top;
              const bx = sx / zoom + origin.x;
              const by = sy / zoom + origin.y;
              marqueeStartRef.current = { sx, sy, bx, by };
              setMarqueeRect({ left: sx, top: sy, width: 0, height: 0 });
              return;
            }

            const t = (e.touches && e.touches[0]) as Touch | undefined;
            if (!t) return;
            // Long-press no fundo abre menu contextual
            if ((e.target === boardRef.current || e.target === e.currentTarget) && e.touches.length === 1 && boardRef.current) {
              bgTouchStartRef.current = { x: t.clientX, y: t.clientY };
              const rect = boardRef.current.getBoundingClientRect();
              const wx = origin.x + (t.clientX - rect.left) / zoom;
              const wy = origin.y + (t.clientY - rect.top) / zoom;
              bgLongPressTimerRef.current = setTimeout(() => {
                bgLongPressTimerRef.current = null;
                panningRef.current = null;
                setContextMenu({ type: 'bg', x: wx, y: wy });
              }, 520);
            }
            // No modo 'pan', 1 dedo move a câmera no fundo
            // No modo 'edit', 2 dedos movem a câmera (1 dedo edita/arrasta)
            if (e.target === boardRef.current || e.target === e.currentTarget) {
              if (touchMode === 'pan' && e.touches.length === 1) {
                panningRef.current = { startX: t.clientX, startY: t.clientY, originX: origin.x, originY: origin.y } as any;
              } else if (touchMode === 'edit' && e.touches.length === 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const midX = (t1.clientX + t2.clientX) / 2;
                const midY = (t1.clientY + t2.clientY) / 2;
                panningRef.current = { startX: midX, startY: midY, originX: origin.x, originY: origin.y } as any;
              }
            }
          } catch (err) { /* ignore */ }
        }}
        onTouchMove={(e) => {
          if (bgLongPressTimerRef.current && bgTouchStartRef.current && e.touches[0]) {
            const dx = Math.abs(e.touches[0].clientX - bgTouchStartRef.current.x);
            const dy = Math.abs(e.touches[0].clientY - bgTouchStartRef.current.y);
            if (dx > 10 || dy > 10) {
              clearTimeout(bgLongPressTimerRef.current);
              bgLongPressTimerRef.current = null;
            }
          }
          if (isUV && uvFollowTouch && boardRef.current) {
            const t0 = e.touches[0];
            if (t0) {
              const rect = boardRef.current.getBoundingClientRect();
              setUvTouchPos({ x: t0.clientX - rect.left, y: t0.clientY - rect.top, active: true });
            }
          }
        }}
        onTouchEnd={(e) => {
          const wasPendingLongPress = Boolean(bgLongPressTimerRef.current);
          if (bgLongPressTimerRef.current) {
            clearTimeout(bgLongPressTimerRef.current);
            bgLongPressTimerRef.current = null;
          }
          const t = e.changedTouches?.[0];
          if ((e.target === boardRef.current || e.target === e.currentTarget) && bgTouchStartRef.current && t && wasPendingLongPress) {
            const dist = Math.hypot(t.clientX - bgTouchStartRef.current.x, t.clientY - bgTouchStartRef.current.y);
            if (dist < 10) {
              clearSelection();
            }
          }
          bgTouchStartRef.current = null;
          if (uvTouchPos) {
            setUvTouchPos(prev => prev ? { ...prev, active: false } : null);
          }
        }}
        onMouseMove={(e) => {
          // UV overlay now handled by GlobalUVOverlay component natively
        }}
        onMouseLeave={() => { }}
        onClick={(e) => {
          if ((e.target === boardRef.current || e.target === e.currentTarget) && bgClickStartRef.current) {
            const dist = Math.hypot(e.clientX - bgClickStartRef.current.x, e.clientY - bgClickStartRef.current.y);
            if (dist < 6) {
              clearSelection();
            }
          }
          bgClickStartRef.current = null;
        }}
        onMouseDown={(e) => {
          if (e.target === boardRef.current || e.target === e.currentTarget) {
            bgClickStartRef.current = (e.button === 0 && !e.shiftKey && !e.ctrlKey && !e.metaKey && !marqueeTouchMode)
              ? { x: e.clientX, y: e.clientY }
              : null;
            // close any open context menu when clicking the background
            setContextMenu(null);
            setSelectedItem(null);
            setShowGmMenu(false);
            setShowToolsMenu(false);
            const board = boardRef.current?.getBoundingClientRect();
            if (!board) return;
            const sx = e.clientX - board.left;
            const sy = e.clientY - board.top;
            const worldX = origin.x + sx / zoom;
            const worldY = origin.y + sy / zoom;

            if (tapToPlaceMode) {
              setCreateModalPos({ x: Math.round(worldX - 122), y: Math.round(worldY - 143) });
              setTapToPlaceMode(false);
              setCreateModalOpen(true);
              return;
            }
            if (e.altKey || mobilePingMode) {
              sendTacticalPing(worldX, worldY);
              if (mobilePingMode) setMobilePingMode(false);
              return;
            }
            if (noteMode) {
              const newNote = { id: Date.now().toString(), x: worldX, y: worldY, text: '', color: '#fcd34d' };
              setNotes([...notes, newNote]);
              setNoteMode(false);
              return;
            }
            if (pinMode) {
              const newPin = { id: Date.now().toString(), x: worldX, y: worldY, type: pinType };
              setPins([...pins, newPin]);
              setPinMode(false);
              return;
            }

            const isLeft = e.button === 0;
            const isMiddle = e.button === 1;
            // Shift + left-drag or Marquee touch mode => marquee selection
            if (isLeft && (e.shiftKey || marqueeTouchMode)) {
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
        <div className="board-ambient-scanline" aria-hidden="true" />
        <div className="board-membrane-vignette" aria-hidden="true" />
        {marqueeRect && <div className="marquee-rect" style={{ left: marqueeRect.left, top: marqueeRect.top, width: marqueeRect.width, height: marqueeRect.height }} />}
        <div
          className={`board-transform-layer${cameraAnimating ? ' camera-animating' : ''}`}
          style={{ transform: `scale(${zoom}) translate3d(${-origin.x}px, ${-origin.y}px, 0)`, transformOrigin: '0 0' }}
        >
          <BoardZonesLayer
            zones={zones}
            zoom={zoom}
            canEdit={canEdit}
            guides={magneticGuides}
            onUpdateZone={handleUpdateZone}
            onDeleteZone={handleDeleteZone}
          />
          {isUV && (
            <GlobalUVOverlay isUV={isUV} performanceMode={performanceMode} boardRef={boardRef} zoom={zoom} origin={origin} uvTouchPos={uvTouchPos} />
          )}
          {/* overflow visible prevents SVG clipping for lines that extend past view */}
          <svg className="connections-layer" style={{ overflow: 'visible' }}>
            {connections.map((conn) => {
              const a = getCardCenter(conn.from_card_id);
              const b = getCardCenter(conn.to_card_id);
              if (!a || !b) return null;
              const savedColor = (conn.color || (conn.metadata && conn.metadata.color) || null) as string | null;
              const type = (conn.metadata && conn.metadata.type) || 'confirmed';
              const stroke = savedColor || (type === 'theory' ? '#f9a825' : type === 'mystic' ? '#7e57c2' : '#c62828');
              const cls = `connection-line type-${type}`;
              const isHighlighted = activeCrossHighlightIds
                ? (activeCrossHighlightIds.has(conn.from_card_id) && activeCrossHighlightIds.has(conn.to_card_id))
                : false;
              const isDimmed = activeCrossHighlightIds ? !isHighlighted : false;
              return (
                <ConnectionLine
                  key={conn.id}
                  pathData={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
                  midpoint={{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }}
                  label={conn.metadata?.label || null}
                  onSelect={(e) => {
                    e.stopPropagation();
                    handleConnectionContextMenu(e, conn.id);
                  }}
                  onContextMenu={(e) => handleConnectionContextMenu(e, conn.id)}
                  onTouchContextMenu={(pos) => handleConnectionContextMenu(pos, conn.id)}
                  onDoubleClick={(e) => { e.stopPropagation(); handleDeleteConnectionById(conn.id); }}
                  style={{ color: stroke }}
                  className={cls}
                  isSelected={connectionContextMenu?.id === conn.id}
                  isHighlighted={isHighlighted}
                  isDimmed={isDimmed}
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

          {connectionContextMenu && (() => {
            const activeConn = connections.find((c) => c.id === connectionContextMenu.id);
            const fromCard = activeConn ? cards.find((c) => c.id === activeConn.from_card_id) : null;
            const toCard = activeConn ? cards.find((c) => c.id === activeConn.to_card_id) : null;
            return (
              <div
                className="connection-context-menu"
                style={{
                  position: 'fixed',
                  top: Math.min(connectionContextMenu.y, Math.max(12, windowHeight - 280)),
                  left: Math.min(connectionContextMenu.x, Math.max(12, windowWidth - 230)),
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <div className="context-menu-title">CONEXÃO / FIO</div>
                <div style={{ display: 'flex', gap: 4, padding: '2px 4px 6px' }}>
                  <input
                    type="text"
                    value={connectionLabelDraft}
                    onChange={(e) => setConnectionLabelDraft(e.target.value)}
                    placeholder="Rótulo curto no fio..."
                    maxLength={24}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '4px 6px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontFamily: 'var(--font-system)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveConnectionLabel}
                    style={{ width: 'auto', minWidth: 40, justifyContent: 'center', color: '#38bdf8' }}
                  >
                    OK
                  </button>
                </div>
                <button onClick={() => handleChangeConnectionType('confirmed')} style={{ color: '#ff6b77' }}>
                  <div style={{ width: 8, height: 8, background: '#c62828', borderRadius: '50%' }} /> Fato Confirmado
                </button>
                <button onClick={() => handleChangeConnectionType('theory')} style={{ color: '#f9a825' }}>
                  <div style={{ width: 8, height: 8, background: '#f9a825', borderRadius: '50%' }} /> Teoria / Hipótese
                </button>
                <button onClick={() => handleChangeConnectionType('mystic')} style={{ color: '#b366ff' }}>
                  <div style={{ width: 8, height: 8, background: '#7e57c2', borderRadius: '50%' }} /> Sobrenatural / Oculto
                </button>
                {(fromCard || toCard) && (
                  <>
                    <div className="context-menu-divider" />
                    {fromCard && (
                      <button onClick={() => { panToCard(fromCard.id); setConnectionContextMenu(null); }} style={{ color: '#38bdf8' }}>
                        <Navigation size={14} /> Ir para: {String(fromCard.title || 'Origem').slice(0, 18)}
                      </button>
                    )}
                    {toCard && (
                      <button onClick={() => { panToCard(toCard.id); setConnectionContextMenu(null); }} style={{ color: '#38bdf8' }}>
                        <Navigation size={14} /> Ir para: {String(toCard.title || 'Destino').slice(0, 18)}
                      </button>
                    )}
                  </>
                )}
                <div className="context-menu-divider" />
                <button onClick={handleDeleteConnection} className="context-danger"><Trash2 size={15} /> Apagar Conexão</button>
              </div>
            );
          })()}

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
            const cardStatus = (card as any)?.metadata?.status || '';
            const cardPins = pinsByCardId[card.id] || [];
            const unresolvedPinCount = cardPins.filter((p) => !p.is_resolved).length;
            const teamStatus: TeamCardStatus = cardStatuses[card.id] || 'unexplored';
            const matchesStatusFilter =
              (statusFilter === 'all' || cardStatus === statusFilter) &&
              (teamStatusFilter === 'all' || teamStatus === teamStatusFilter);
            const isCrossHighlighted = activeCrossHighlightIds ? activeCrossHighlightIds.has(card.id) : false;
            const isDimmed = (activeCrossHighlightIds && !isCrossHighlighted) || ((statusFilter !== 'all' || teamStatusFilter !== 'all') && !matchesStatusFilter);
            return (
                <div
                key={card.id}
                  className={[
                    'card-node',
                    isSelected ? 'selected' : '',
                    isNew ? 'newly-created' : '',
                    touchMode === 'edit' ? 'mobile-interactive' : '',
                    card.is_hidden && showHiddenClues ? 'hidden-clue' : '',
                    matchesStatusFilter && statusFilter !== 'all' ? 'match-filter' : '',
                    isCrossHighlighted ? 'cross-highlighted' : '',
                    isDimmed ? 'dimmed-card' : '',
                  ].filter(Boolean).join(' ')}
                  data-status={cardStatus}
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
                  // Se for gesto multi-toque (ex: pinch-to-zoom com 2 dedos), não intercepta nem seleciona o card
                  if (ev.touches.length > 1) {
                    draggingRef.current = null;
                    return;
                  }
                  ev.stopPropagation();
                  if (connectionMode) {
                    onCardClickWhenConnecting(card.id);
                    return;
                  }
                  const t = ev.touches[0];
                  // If in pan touchMode, do not drag cards; let pan take precedence
                  if (touchMode === 'pan') {
                    // Just select on tap
                    if (!selectedIds.includes(card.id)) {
                      setSelectedIds([card.id]);
                    }
                    return;
                  }
                  // In edit mode:
                  const isMulti = selectedIds.length > 1 && selectedIds.includes(card.id);
                  const newSelected = isMulti ? selectedIds : [card.id];
                  if (!isMulti) setSelectedIds(newSelected);
                  const affected = newSelected;
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
                    element={metadata?.element || metadata?.elemento || card?.element || null}
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
                    onEdit={() => handleEditCard(card)}
                    isNew={shouldShowNewBadge(investigationId, card, { isGameMaster, playerView })}
                    onSendToDecoder={() => handleSendCardToDecoder(card)}
                    onOpenHex={() => handleOpenCardInHex(card)}
                    performanceMode={performanceMode}
                    semanticCompact={zoom < 0.48}
                    pinCount={cardPins.length}
                    unresolvedPinCount={unresolvedPinCount}
                    teamStatus={teamStatus}
                    onChangeTeamStatus={(nextStatus) => setCardTeamStatus(card.id, nextStatus)}
                  />
                </div>
              </div>
            );
          })}

          {tacticalPings.map((ping) => (
            <div
              key={ping.id}
              className="tactical-ping-pulse"
              style={{ left: ping.x, top: ping.y }}
            >
              <span className="tactical-ping-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Radio size={11} /> {ping.authorName}
              </span>
            </div>
          ))}

          {notes.map(note => (
            <div 
              key={`note-${note.id}`} 
              className="note-node" 
              style={{ left: note.x, top: note.y }}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest('button, [contenteditable="true"]')) return;
                e.stopPropagation();
                setSelectedItem(null);
                const target = e.currentTarget;
                target.setPointerCapture(e.pointerId);
                const startX = e.clientX;
                const startY = e.clientY;
                const origX = note.x;
                const origY = note.y;
                const onMove = (ev: PointerEvent) => {
                  const dx = (ev.clientX - startX) / zoom;
                  const dy = (ev.clientY - startY) / zoom;
                  setNotes(prev => prev.map(n => n.id === note.id ? { ...n, x: origX + dx, y: origY + dy } : n));
                };
                const onUp = (ev: PointerEvent) => {
                  target.removeEventListener('pointermove', onMove);
                  target.removeEventListener('pointerup', onUp);
                  target.releasePointerCapture(ev.pointerId);
                };
                target.addEventListener('pointermove', onMove);
                target.addEventListener('pointerup', onUp);
              }}
            >
              <div className="note-hdr">
                <span>NOTA</span>
                <button
                  type="button"
                  className="n-close"
                  aria-label="Apagar nota"
                  title="Apagar nota"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotes(prev => prev.filter(n => n.id !== note.id));
                  }}
                >
                  x
                </button>
              </div>
              <div className="note-content" contentEditable suppressContentEditableWarning onBlur={(e) => {
                const text = e.currentTarget.textContent;
                setNotes(prev => prev.map(n => n.id === note.id ? { ...n, text } : n));
              }} onPointerDown={(e) => e.stopPropagation()}>{note.text}</div>
            </div>
          ))}

          {pins.map(pin => {
            const size = pin.size || 24;
            let pPos = { x: pin.x, y: pin.y };
            if (pin.attachedTo && localPositionsRef.current[pin.attachedTo]) {
              pPos = { 
                x: localPositionsRef.current[pin.attachedTo].x + pin.offsetX, 
                y: localPositionsRef.current[pin.attachedTo].y + pin.offsetY 
              };
            }
            return (
              <div 
                key={`pin-${pin.id}`} 
                className="pin-3d" 
                style={{ position: 'absolute', left: pPos.x, top: pPos.y, width: size, height: size, background: `url(/pins/pin-${pin.type}.png) no-repeat center center / contain`, transform: 'translate(-50%, -100%)', zIndex: 5000, cursor: 'pointer' }} 
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPins(pins.filter(p => p.id !== pin.id));
                  if (selectedItem?.id === pin.id) setSelectedItem(null);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (connectionMode) {
                    onCardClickWhenConnecting(`pin-${pin.id}`);
                    return;
                  }
                  if (e.button === 0) setSelectedItem({ id: pin.id, type: 'pin', x: pPos.x, y: pPos.y });
                  const target = e.currentTarget;
                  target.setPointerCapture(e.pointerId);
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const origX = pPos.x;
                  const origY = pPos.y;
                  let moved = false;
                  const onMove = (ev: PointerEvent) => {
                    if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 5) moved = true;
                    const dx = (ev.clientX - startX) / zoom;
                    const dy = (ev.clientY - startY) / zoom;
                    setPins(prev => prev.map(p => p.id === pin.id ? { ...p, x: origX + dx, y: origY + dy, attachedTo: undefined } : p));
                    if (moved) setSelectedItem(null);
                  };
                  const onUp = (ev: PointerEvent) => {
                    target.removeEventListener('pointermove', onMove);
                    target.removeEventListener('pointerup', onUp);
                    target.releasePointerCapture(ev.pointerId);
                    if (moved) {
                      const dx = (ev.clientX - startX) / zoom;
                      const dy = (ev.clientY - startY) / zoom;
                      const finalX = origX + dx;
                      const finalY = origY + dy;
                      const CARD_W = 220; const CARD_H = 160;
                      const parentCard = cards.find(c => {
                        const cPos = localPositionsRef.current[c.id] || { x: c.x || 100, y: c.y || 100 };
                        return finalX >= cPos.x && finalX <= cPos.x + CARD_W && finalY >= cPos.y && finalY <= cPos.y + CARD_H;
                      });
                      if (parentCard) {
                        const cPos = localPositionsRef.current[parentCard.id] || { x: parentCard.x || 100, y: parentCard.y || 100 };
                        setPins(prev => prev.map(p => p.id === pin.id ? { ...p, x: finalX, y: finalY, attachedTo: parentCard.id, offsetX: finalX - cPos.x, offsetY: finalY - cPos.y } : p));
                      }
                    }
                  };
                  target.addEventListener('pointermove', onMove);
                  target.addEventListener('pointerup', onUp);
                }}
              />
            );
          })}

          {selectedItem && selectedItem.type === 'pin' && (
            <div 
              className="pin-context-menu" 
              style={{ position: 'absolute', left: selectedItem.x + 20, top: selectedItem.y - 40, background: '#1c1917', color: '#fff', padding: 16, borderRadius: 12, zIndex: 9999, width: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.7)', border: '1px solid #333' }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', marginBottom: 12, color: '#fcd34d' }}>ALFINETE</div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 700 }}>COR</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                 <div onClick={() => setPins(pins.map(p => p.id === selectedItem.id ? {...p, type: 'vermelho'} : p))} style={{width: 24, height: 24, borderRadius: '50%', background: '#e63946', cursor: 'pointer', border: pins.find(p=>p.id===selectedItem.id)?.type === 'vermelho' ? '3px solid white' : 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                 <div onClick={() => setPins(pins.map(p => p.id === selectedItem.id ? {...p, type: 'azul'} : p))} style={{width: 24, height: 24, borderRadius: '50%', background: '#3b82f6', cursor: 'pointer', border: pins.find(p=>p.id===selectedItem.id)?.type === 'azul' ? '3px solid white' : 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                 <div onClick={() => setPins(pins.map(p => p.id === selectedItem.id ? {...p, type: 'verde'} : p))} style={{width: 24, height: 24, borderRadius: '50%', background: '#eab308', cursor: 'pointer', border: pins.find(p=>p.id===selectedItem.id)?.type === 'verde' ? '3px solid white' : 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 700, marginTop: 12 }}>TAMANHO</div>
              <input 
                type="range" min="12" max="64" 
                value={pins.find(p=>p.id===selectedItem.id)?.size || 24} 
                onChange={(e) => setPins(pins.map(p => p.id === selectedItem.id ? {...p, size: parseInt(e.target.value)} : p))} 
                style={{ width: '100%', marginBottom: 16 }} 
              />
              <button 
                onClick={() => { setPins(pins.filter(p => p.id !== selectedItem.id)); setSelectedItem(null); }}
                style={{ width: '100%', padding: '10px 0', background: '#c62828', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
              >
                Apagar alfinete
              </button>
              <div style={{ fontSize: 11, color: '#999', marginTop: 12, lineHeight: 1.4 }}>
                Arraste o alfinete para outro item. Botão direito também apaga.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BARRA CONTEXTUAL DE MULTISSELEÇÃO / TOUCH SELECTION (fora de .board-transform-layer para position: fixed funcionar no viewport) */}
      {selectedIds.length > 0 && (
        <div
          className="selection-context-toolbar"
          style={{
            position: 'fixed',
            bottom: isMobileDevice ? 'calc(env(safe-area-inset-bottom, 0px) + 64px)' : '64px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 'var(--z-hud, 1000)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--surface, #11141b)',
            border: '1px solid var(--border, #29313d)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '8px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            maxWidth: '95vw',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {selectedIds.length} {selectedIds.length === 1 ? 'PISTA' : 'PISTAS'}
          </span>

          {/* Status Rápido */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className="hud-btn icon-only control-sm"
              style={{ minWidth: 32, minHeight: 32 }}
              title="Confirmar Fato"
              onClick={() => {
                selectedIds.forEach(id => toggleCardStatus(id, 'verified', []));
              }}
            >
              <Check size={14} color="#2ecc71" />
            </button>
            <button
              type="button"
              className="hud-btn icon-only control-sm"
              style={{ minWidth: 32, minHeight: 32 }}
              title="Marcar Teoria"
              onClick={() => {
                selectedIds.forEach(id => toggleCardStatus(id, 'theory', []));
              }}
            >
              <CircleHelp size={14} color="#f9a825" />
            </button>
            <button
              type="button"
              className="hud-btn icon-only control-sm"
              style={{ minWidth: 32, minHeight: 32 }}
              title="Descartar / Falso"
              onClick={() => {
                selectedIds.forEach(id => toggleCardStatus(id, 'false', []));
              }}
            >
              <X size={14} color="#e63946" />
            </button>
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

          {/* Ordem Z */}
          <button
            type="button"
            className="hud-btn icon-only control-sm"
            style={{ minWidth: 32, minHeight: 32 }}
            title="Trazer para frente"
            onClick={() => {
              selectedIds.forEach(id => api.updateInvestigationCard(id, { z_index: 1000 }));
              loadBoard();
            }}
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            className="hud-btn icon-only control-sm"
            style={{ minWidth: 32, minHeight: 32 }}
            title="Mandar para trás"
            onClick={() => {
              selectedIds.forEach(id => api.updateInvestigationCard(id, { z_index: 1 }));
              loadBoard();
            }}
          >
            <ArrowDown size={14} />
          </button>

          {/* Botão Editar (substitui atalho 'E') quando 1 pista selecionada */}
          {canEdit && selectedIds.length === 1 && (
            <button
              type="button"
              className="hud-btn control-sm"
              style={{ minHeight: 32, padding: '0 8px', fontSize: 11 }}
              title="Editar pista (E)"
              onClick={() => {
                const card = cards.find(c => c.id === selectedIds[0]);
                if (card) handleEditCard(card);
              }}
            >
              EDITAR
            </button>
          )}

          {/* Botão Centralizar câmera na pista */}
          <button
            type="button"
            className="hud-btn control-sm"
            style={{ minHeight: 32, padding: '0 8px', fontSize: 11 }}
            title="Centralizar nesta pista"
            onClick={() => {
              const targetId = selectedIds[0];
              const center = getCardCenter(targetId);
              if (center) panToPosition(center.x, center.y);
            }}
          >
            <LocateFixed size={14} /> FOCAR
          </button>

          {/* Pular para nó ligado quando 1 pista com conexões estiver selecionada */}
          {connectedNeighborsForSingle.slice(0, 2).map((neighbor) => (
            <button
              key={`jump-${neighbor.id}`}
              type="button"
              className="hud-btn control-sm"
              style={{ minHeight: 32, padding: '0 8px', fontSize: 10, color: '#38bdf8' }}
              title={`Pular para nó ligado: ${neighbor.title || 'Pista'}`}
              onClick={() => panToCard(neighbor.id)}
            >
              <Navigation size={12} /> {String(neighbor.title || 'Nó').slice(0, 12)}
            </button>
          ))}

          {/* Excluir (se GM) */}
          {canEdit && (
            <button
              type="button"
              className="hud-btn icon-only control-sm context-danger"
              style={{ minWidth: 32, minHeight: 32, color: 'var(--institutional-red)' }}
              title="Excluir selecionadas"
              onClick={async () => {
                if (window.confirm(`Excluir permanentemente ${selectedIds.length} pista(s)?`)) {
                  for (const id of selectedIds) {
                    try { await api.deleteInvestigationCard(id); } catch (e) {}
                  }
                  setSelectedIds([]);
                  await loadBoard();
                }
              }}
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Desmarcar */}
          <button
            type="button"
            className="hud-btn icon-only control-sm"
            style={{ minWidth: 32, minHeight: 32 }}
            title="Fechar seleção"
            onClick={() => setSelectedIds([])}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* FloatingNudgePad para mover pistas selecionadas ou câmera no mobile */}
      {selectedIds.length > 0 && isMobileDevice && (
        <FloatingNudgePad
          onNudge={(dx, dy) => {
            setLocalPositions(prev => {
              const next = { ...prev };
              selectedIds.forEach(id => {
                const cur = prev[id] || { x: 100, y: 100 };
                next[id] = { x: cur.x + dx, y: cur.y + dy };
                scheduleDebouncedSave(id);
              });
              return next;
            });
          }}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          step={20}
        />
      )}

      {touchModeNotice && (
        <div className="touch-mode-notice" role="status">{touchModeNotice}</div>
      )}

          {/* --- HUD EXCLUSIVO PARA CELULAR --- */}
          {isMobileDevice && (
            <div className="mobile-hud">

              {/* mobile mode toggles removed — pan is the default on touch devices */}

              {/* 2. BOTTOM SHEET MENU */}
              <div className="mobile-fab-container">
                <button 
                  className="main-fab-trigger" 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Abrir ferramentas"
                >
                  <Menu size={19} />
                </button>
              </div>
            </div>
          )}

          <BottomSheet isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Ferramentas de Investigação">
            <h3>Ferramentas</h3>
            {isGameMaster && (
              <button onClick={() => {setCreateModalOpen(true); setMobileMenuOpen(false)}} className="fab-item primary">
                <Settings size={16} /> HUB DE CRIAÇÃO
              </button>
            )}
            <button onClick={() => setConnectionMode(!connectionMode)} className={`fab-item ${connectionMode?'active':''}`}>
              <Link2 size={16} /> {connectionMode ? 'PARAR CONEXÃO' : 'CONECTAR'}
            </button>
            <button onClick={() => { setShowFinder(true); setMobileMenuOpen(false); }} className="fab-item">
              <Search size={16} /> BUSCAR
            </button>
            <button onClick={() => { setIsUV(!isUV); setMobileMenuOpen(false); }} className={`fab-item ${isUV?'uv-active':''}`}>
              <Flashlight size={16} /> LUZ UV {isUV ? '(LIGADA)' : '(DESLIGADA)'}
            </button>
            {isUV && (
              <button
                onClick={() => {
                  setUvFollowTouch(prev => !prev);
                  showToast({ id: 'uv-touch', message: !uvFollowTouch ? 'UV: Seguir Toque ATIVADO' : 'UV: Seguir Toque DESATIVADO' });
                  setMobileMenuOpen(false);
                }}
                className={`fab-item ${uvFollowTouch ? 'uv-active' : ''}`}
              >
                <Flashlight size={16} /> UV: SEGUIR TOQUE {uvFollowTouch ? '(ATIVO)' : '(INATIVO)'}
              </button>
            )}
            <button
              onClick={() => {
                setMarqueeTouchMode(prev => !prev);
                showToast({ id: 'marquee-touch', message: !marqueeTouchMode ? 'Seleção em Área: Arraste o dedo no fundo para selecionar' : 'Seleção em Área DESATIVADA' });
                setMobileMenuOpen(false);
              }}
              className={`fab-item ${marqueeTouchMode ? 'active' : ''}`}
            >
              <LayoutGrid size={16} /> SELEÇÃO EM ÁREA (TOUCH) {marqueeTouchMode ? '(ATIVA)' : ''}
            </button>
            <button onClick={() => { setOrigin({x:0, y:0}); setMobileMenuOpen(false); }} className="fab-item">
              <LocateFixed size={16} /> RESETAR CÂMERA (100%)
            </button>
            <button onClick={() => { setShowOrganizeMenu(true); setMobileMenuOpen(false); }} className="fab-item">
              <LayoutPanelTop size={16} /> ORGANIZAR QUADRO...
            </button>
            <button onClick={() => { setDecoderOpen(true); setMobileMenuOpen(false); }} className="fab-item">
              <Lock size={16} /> DECODIFICADOR
            </button>
            <button onClick={() => { setTerminalOpen(true); setMobileMenuOpen(false); }} className="fab-item">
              <Terminal size={16} /> TERMINAL C.R.I.S.
            </button>
            <button onClick={() => { undo(); setMobileMenuOpen(false); }} disabled={undoStack.length === 0} className="fab-item">
              <Undo2 size={16} /> DESFAZER
            </button>
            <button onClick={() => { redo(); setMobileMenuOpen(false); }} disabled={redoStack.length === 0} className="fab-item">
              <Redo2 size={16} /> REFAZER
            </button>
            <button onClick={() => { togglePerformanceMode(); setMobileMenuOpen(false); }} className={`fab-item ${performanceMode ? 'active' : ''}`}>
              <Zap size={16} /> MODO DESEMPENHO {performanceMode ? '(ATIVO)' : ''}
            </button>
            <h3>Zoom</h3>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button onClick={() => zoomOut()} className="fab-item" style={{ flex: 1, justifyContent: 'center' }}><ZoomOut size={16} /> -</button>
              <button onClick={() => resetZoom()} className="fab-item" style={{ flex: 1, justifyContent: 'center' }}><RotateCcw size={16} /> 100%</button>
              <button onClick={() => zoomIn()} className="fab-item" style={{ flex: 1, justifyContent: 'center' }}><ZoomIn size={16} /> +</button>
            </div>
          </BottomSheet>

          <TacticalMinimap
            cards={cards}
            localPositions={localPositions}
            selectedIds={selectedIds}
            origin={origin}
            zoom={zoom}
            viewportWidth={windowWidth}
            viewportHeight={windowHeight}
            isGameMaster={isGameMaster}
            playerView={playerView}
            showHiddenClues={showHiddenClues}
            performanceMode={performanceMode}
            isOpen={minimapOpen}
            onToggleOpen={toggleMinimapOpen}
            onNavigate={(worldX, worldY) => panToPosition(worldX, worldY)}
            onZoomToFit={zoomToFit}
          />

          {/* BottomSheet de Organização */}
          <BottomSheet isOpen={showOrganizeMenu} onClose={() => setShowOrganizeMenu(false)} title="Organizar Pistas">
            <h3>Layout Automático</h3>
            <button
              onClick={() => {
                handleAutoOrganize('timeline');
                setShowOrganizeMenu(false);
              }}
              className="fab-item"
            >
              <CalendarDays size={16} /> Por Linha do Tempo (Data)
            </button>
            <button
              onClick={() => {
                handleAutoOrganize('element');
                setShowOrganizeMenu(false);
              }}
              className="fab-item"
            >
              <LayoutGrid size={16} /> Por Elemento e Tipo
            </button>
            <button
              onClick={() => {
                handleAutoOrganize('veracity');
                setShowOrganizeMenu(false);
              }}
              className="fab-item"
            >
              <Check size={16} /> Por Veracidade / Status
            </button>
            <button
              onClick={() => {
                handleAutoOrganize('grid');
                setShowOrganizeMenu(false);
              }}
              className="fab-item"
            >
              <Grid size={16} /> Grade Uniforme
            </button>
            <button
              onClick={() => {
                handleAutoOrganize('unstack');
                setShowOrganizeMenu(false);
              }}
              className="fab-item"
            >
              <Layers2 size={16} /> Desempilhar
            </button>
            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              <button onClick={() => undo()} disabled={undoStack.length === 0} className="fab-item" style={{ flex: 1, justifyContent: 'center' }}>
                <Undo2 size={16} /> Desfazer
              </button>
              <button onClick={() => redo()} disabled={redoStack.length === 0} className="fab-item" style={{ flex: 1, justifyContent: 'center' }}>
                <Redo2 size={16} /> Refazer
              </button>
            </div>
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
            <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>DECODIFICADOR</div>
            <button className="hud-btn icon-only" onClick={() => setDecoderOpen(false)} aria-label="Fechar decodificador"><X size={16} /></button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <UniversalDecoder
              initialInput={decoderInitialInput}
              initialMode={decoderInitialMode}
              investigationId={investigationId}
            />
          </div>
        </div>
      )}
      {codesPanelOpen && (() => {
        const isGmMode = isGameMaster && !playerView;
        const gmClueCodes: Array<{ key: string; cardId: string; cardTitle: string; kind: string; status: string; code: string }> = [];
        if (isGmMode) {
          for (const card of cards) {
            const meta = parseCardMetadata(card?.metadata);
            const title = card?.title || 'Pista sem título';
            const status = card?.is_hidden ? 'Oculta' : card?.is_locked ? 'Bloqueada' : 'Aberta';

            const lockPass = card?.lock_password || meta?.lock_pass || meta?.lock_password;
            if (lockPass) {
              gmClueCodes.push({
                key: `${card.id}-lock`,
                cardId: card.id,
                cardTitle: title,
                kind: 'Senha da Pista',
                status,
                code: String(lockPass),
              });
            }

            if (card?.discovery_code) {
              gmClueCodes.push({
                key: `${card.id}-discovery`,
                cardId: card.id,
                cardTitle: title,
                kind: 'Código de Descoberta',
                status,
                code: String(card.discovery_code),
              });
            }

            const glitchReward = meta?.glitch_puzzle?.reward_code;
            if (glitchReward) {
              gmClueCodes.push({
                key: `${card.id}-glitch`,
                cardId: card.id,
                cardTitle: title,
                kind: 'Recompensa (Glitch)',
                status,
                code: String(glitchReward),
              });
            }

            const megaCodes = meta?.mega_clue?.required_codes;
            if (Array.isArray(megaCodes) && megaCodes.length > 0) {
              gmClueCodes.push({
                key: `${card.id}-mega`,
                cardId: card.id,
                cardTitle: title,
                kind: 'Mega-Pista (Requeridos)',
                status,
                code: megaCodes.join(', '),
              });
            }
          }
        }

        return (
          <div className="qol-modal-backdrop" onClick={() => setCodesPanelOpen(false)}>
            <div className="qol-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Códigos e Senhas">
              <div className="qol-modal-header">
                <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><KeyRound size={16} /> {isGmMode ? `Códigos e Senhas (${gmClueCodes.length})` : `Códigos Descobertos (${unlockedCodes.length})`}</h3>
                <button type="button" className="hud-btn icon-only" onClick={() => setCodesPanelOpen(false)} aria-label="Fechar"><X size={16} /></button>
              </div>
              <div className="qol-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '70vh', overflowY: 'auto' }}>
                {isGmMode && (
                  <div>
                    <div className="qol-code-sub" style={{ marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Lock size={13} /> Pistas com Senha / Código (Mestre)
                    </div>
                    {gmClueCodes.length === 0 ? (
                      <p className="qol-empty-msg">Nenhuma pista deste caso possui senha ou código configurado.</p>
                    ) : (
                      <div className="qol-codes-list">
                        {gmClueCodes.map((entry) => (
                          <div key={entry.key} className="qol-code-row">
                            <div>
                              <div className="qol-code-title">{entry.cardTitle}</div>
                              <div className="qol-code-sub">
                                {entry.kind} • {entry.status}
                              </div>
                            </div>
                            <div className="qol-code-right">
                              <code>{entry.code}</code>
                              <button
                                type="button"
                                className="hud-btn"
                                onClick={() => {
                                  navigator.clipboard?.writeText(entry.code).catch(() => {});
                                  showToast({ id: 'copy-code', message: `Código ${entry.code} copiado!` }, 2000);
                                }}
                              >
                                Copiar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  {isGmMode && (
                    <div className="qol-code-sub" style={{ marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Unlock size={13} /> Desbloqueados pelos Jogadores ({unlockedCodes.length})
                    </div>
                  )}
                  {unlockedCodes.length === 0 ? (
                    <p className="qol-empty-msg">Nenhum código ou senha foi desbloqueado por jogadores nesta investigação ainda.</p>
                  ) : (
                    <div className="qol-codes-list">
                      {unlockedCodes.map((entry) => (
                        <div key={`${entry.cardId}-${entry.lockType}-${entry.code}`} className="qol-code-row">
                          <div>
                            <div className="qol-code-title">{entry.cardTitle}</div>
                            <div className="qol-code-sub">
                              {entry.lockType} • {new Date(entry.unlockedAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="qol-code-right">
                            <code>{entry.code}</code>
                            <button
                              type="button"
                              className="hud-btn"
                              onClick={() => {
                                navigator.clipboard?.writeText(entry.code).catch(() => {});
                                showToast({ id: 'copy-code', message: `Código ${entry.code} copiado!` }, 2000);
                              }}
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {quickNoteOpen && canEdit && (
        <div className="qol-modal-backdrop" onClick={() => setQuickNoteOpen(false)}>
          <form className="qol-modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateQuickNote} role="dialog" aria-modal="true" aria-label="Nota Rápida">
            <div className="qol-modal-header">
              <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><StickyNote size={16} /> Nota Rápida / Teoria</h3>
              <button type="button" className="hud-btn icon-only" onClick={() => setQuickNoteOpen(false)} aria-label="Fechar"><X size={16} /></button>
            </div>
            <div className="qol-modal-body">
              <label className="qol-field">
                <span>Título curto</span>
                <input
                  type="text"
                  value={quickNoteTitle}
                  onChange={(e) => setQuickNoteTitle(e.target.value)}
                  placeholder="Ex: Ligação entre Suspeito A e Galpão"
                  autoFocus
                />
              </label>
              <label className="qol-field">
                <span>Texto / Observação</span>
                <textarea
                  rows={3}
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  placeholder="Escreva a nota ou hipótese..."
                  required
                />
              </label>
              <div className="qol-field-row">
                <label className="qol-field">
                  <span>Tag de Teoria</span>
                  <select value={quickNoteTag} onChange={(e) => setQuickNoteTag(e.target.value)}>
                    <option value="Teoria">Teoria</option>
                    <option value="Pista">Pista</option>
                    <option value="Urgente">Urgente</option>
                    <option value="Conexão">Conexão</option>
                  </select>
                </label>
                <div className="qol-field">
                  <span>Cor</span>
                  <div className="qol-color-swatches">
                    {[
                      { hex: '#fef08a', label: 'Amarelo' },
                      { hex: '#bae6fd', label: 'Azul' },
                      { hex: '#fecaca', label: 'Vermelho' },
                      { hex: '#bbf7d0', label: 'Verde' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className={`qol-color-swatch ${quickNoteColor === c.hex ? 'active' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => setQuickNoteColor(c.hex)}
                        title={c.label}
                        aria-label={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="qol-modal-footer">
              <button type="button" className="hud-btn" onClick={() => setQuickNoteOpen(false)}>Cancelar</button>
              <button type="submit" className="hud-btn primary" disabled={quickNoteSaving}>
                {quickNoteSaving ? 'Criando...' : 'Criar Nota'}
              </button>
            </div>
          </form>
        </div>
      )}
      {showLegacyModal && (
        <Suspense fallback={<div>Carregando...</div>}>
          <CreateClueModalLegacy
            isOpen={showLegacyModal}
            existingCard={editingCard}
            onClose={() => { setShowLegacyModal(false); setEditingCard(null); }}
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

      <FindingsDrawer
        cardTitlesById={React.useMemo(() => {
          const map: Record<string, string> = {};
          cards.forEach((c) => {
            if (c?.id) map[c.id] = c.title || 'Pista';
          });
          return map;
        }, [cards])}
      />
    </div>
  );
}

export const InvestigationBoard = React.memo(function InvestigationBoard({ investigationId }: Props) {
  const { session } = useAuth();
  const user = session?.user;
  const navigateRef = useRef<((cardId: string) => void) | null>(null);
  const authorName =
    (user as any)?.user_metadata?.code_name ||
    (user as any)?.email?.split('@')[0] ||
    'Agente';

  return (
    <CollaborationProvider
      investigationId={investigationId}
      currentUserId={(user as any)?.id || null}
      authorName={authorName}
      onNavigateToCard={(cardId) => navigateRef.current?.(cardId)}
    >
      <InvestigationBoardInner
        investigationId={investigationId}
        onRegisterNavigateToCard={(fn) => {
          navigateRef.current = fn;
        }}
      />
    </CollaborationProvider>
  );
});

InvestigationBoard.displayName = 'InvestigationBoard';

export default InvestigationBoard;
