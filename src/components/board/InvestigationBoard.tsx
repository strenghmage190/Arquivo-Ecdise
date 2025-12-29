import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../api/investigations';
import * as connApi from '../../api/connections';
import InvestigationCardModal from '../modals/InvestigationCardModal';
import InviteModal from '../modals/InviteModal';
import CreateClueModal from '../modals/CreateClueModal';
import Sketchpad from '../tools/Sketchpad';
import BootScreen from '../layout/BootScreen';
import TerminalSearch from './TerminalSearch';
import { playAudio } from '../../utils/audio';
import { uploadInvestigationImage, uploadInvestigationFile } from '../../utils/storage';
import { supabase } from '../../supabaseClient';
import Toast from '../../components/ui/Toast';
import ConspiracyBoard from './ConspiracyBoard';
import MysteryImage from './MysteryImage';
import './MysteryEffects.css';
import { organizeByTimeline, organizeByElement } from '../../utils/layoutAlgorithms';
import InspectionModal from '../modals/InspectionModal';
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
interface Props {
  investigationId: string;
}

export function InvestigationBoard({ investigationId }: Props) {
  const navigate = useNavigate();
  const [cards, setCards] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [createModalPos, setCreateModalPos] = useState<{ x: number; y: number } | null>(null);
  const [editingCard, setEditingCard] = useState<any | null>(null);

  const [zoom, setZoom] = useState(1);
  const [isUV, setIsUV] = useState(false);
  const [globalMouse, setGlobalMouse] = useState<{ clientX: number; clientY: number; overBoard: boolean } | null>(null);
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number; over: boolean } | null>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [playerView, setPlayerView] = useState(false);
  const canEdit = isGameMaster && !playerView;
  const [inspectCard, setInspectCard] = useState<any | null>(null);
  const [caseTitle, setCaseTitle] = useState('CARREGANDO...');
  // Sistema de boot C.R.I.S.: controla a exibição da tela de inicialização
  // Sempre iniciar com o boot-screen ativo para exibir a animação a cada carga
  const [systemReady, setSystemReady] = useState<boolean>(false);
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
  const [sketchOpen, setSketchOpen] = useState(false);
  const [sketchInitialData, setSketchInitialData] = useState<any | null>(null);
  const [editingSketchId, setEditingSketchId] = useState<string | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const EMBED_EXCALIDRAW_JSON_LIMIT = 8 * 1024; // 8KB
  const [showSharedBoard, setShowSharedBoard] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showFinder, setShowFinder] = useState(false);
  const [showOrganizeMenu, setShowOrganizeMenu] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [contextMenu, setContextMenu] = useState<null | { type: 'card' | 'bg'; targetId?: string; x: number; y: number }>(null);
  
  // Terminal search feedback
  const [terminalMessage, setTerminalMessage] = useState<string | null>(null);

  const corkboardRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<any>(null);
  const panningRef = useRef<any>(null);
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

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
      const found = data.find((row: any) => {
        // check explicit column if present
        if (row.keyword_unlock && String(row.keyword_unlock).toLowerCase().includes(lowered)) return true;
        // check inside metadata JSON if present
        const meta = row.metadata || (row.data && row.data.metadata) || null;
        try {
          if (meta) {
            const km = typeof meta === 'string' ? (() => { try { return JSON.parse(meta); } catch { return null; } })() : meta;
            const key = km && (km.keyword_unlock || km.keyword || km.key);
            if (key && String(key).toLowerCase().includes(lowered)) return true;
          }
        } catch (e) {
          // ignore parse errors
        }
        return false;
      });

      if (!found) {
        setTerminalMessage('Nenhum arquivo encontrado.');
        try { playAudio('/sounds/error_buzz.mp3'); } catch {}
        return;
      }
      // compute center position
      const centerX = origin.x + (window.innerWidth / 2) / zoom;
      const centerY = origin.y + (window.innerHeight / 2) / zoom;

      // Reveal the card and place near center
      await api.updateInvestigationCard(found.id, { visibility: 'visible', x: Math.round(centerX), y: Math.round(centerY) } as any);
      try { playAudio('/sounds/success_chime.mp3'); } catch {}
      try { playAudio('/sounds/paper_drop.mp3'); } catch {}
      setTerminalMessage(`ARQUIVO RECUPERADO: "${found.title || found.id}"`);
      // mark to animate on next render
      setLastCreatedId(found.id);
      await loadBoard();
      // clear highlight after a few seconds
      setTimeout(() => setLastCreatedId(null), 4200);
    } catch (err: any) {
      console.error('TerminalSearch error', err);
      setTerminalMessage('Erro ao buscar no servidor');
    }
  };

  useEffect(() => {
    loadBoard();
  }, [investigationId]);

  // Check whether current user is the owner (Game Master)
  useEffect(() => {
    let mounted = true;
    async function checkPermissions() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user || null;
        const details = await api.fetchInvestigationDetails(investigationId);
        if (!mounted) return;
        setCaseTitle(details?.title || 'CASO');
        if (user && details && details.owner_id === user.id) setIsGameMaster(true);
        else setIsGameMaster(false);
      } catch (err) {
        console.error('Erro ao verificar permissões', err);
      }
    }
    checkPermissions();
    return () => { mounted = false; };
  }, [investigationId]);

  // Debug: show cards when loaded
  useEffect(() => { console.debug('InvestigationBoard: cards changed', cards); }, [cards]);

  useEffect(() => {
    console.debug('InvestigationBoard: cards updated', cards);
  }, [cards]);

  useEffect(() => {
    console.debug('InvestigationBoard: createModalOpen changed', createModalOpen);
  }, [createModalOpen]);

  // Persist on global mouseup (finish drag / pan)
  const handleGlobalMouseUp = async (e: MouseEvent) => {
    if (panningRef.current) {
      panningRef.current = null;
      return;
    }
    if (draggingRef.current) {
      const d = draggingRef.current;
      draggingRef.current = null;
      const origs: Record<string, { x: number; y: number }> = d.origPositions || (d.origX !== undefined ? { [d.id]: { x: d.origX, y: d.origY } } : {});
      const affected = Object.keys(origs);
      const changes: any[] = [];
      for (const aid of affected) {
        const pos = localPositions[aid];
        // cancel debounce
        const to = saveTimeouts.current[aid];
        if (to) {
          clearTimeout(to as any);
          saveTimeouts.current[aid] = null;
        }
        if (pos) {
          changes.push({ id: aid, from: origs[aid], to: { x: Math.round(pos.x), y: Math.round(pos.y) } });
        }
      }
      if (changes.length) {
        // push move action
        pushUndo({ type: 'move', payload: { changes } });
        // persist all
        for (const c of changes) {
          try { await api.updateCard(c.id, { x: c.to.x, y: c.to.y }); } catch (err) { console.error('Falha ao salvar posição do card', err); }
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    // intentionally not adding cards to deps; loadBoard will refresh positions
    // and the update handler persists the final position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investigationId]);

  // Marquee: start on shift+mousedown on background, update on move, finalize on mouseup
  const startMarquee = (e: MouseEvent) => {
    const board = corkboardRef.current?.getBoundingClientRect();
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
        // if we have cards, center on their bounding box
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
          const boardRect = corkboardRef.current?.getBoundingClientRect();
          const viewW = boardRect?.width ?? window.innerWidth;
          const viewH = boardRect?.height ?? window.innerHeight;
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          setOrigin({ x: centerX - viewW / (2 * zoom), y: centerY - viewH / (2 * zoom) });
          return;
        }
        // otherwise default to a small negative origin near 0,0 to avoid huge off-screen offsets
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
        const board = corkboardRef.current?.getBoundingClientRect();
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
      // compute movement relative to the corkboard element using world coordinates
      const board = corkboardRef.current?.getBoundingClientRect();
      const screenX = board ? (e.clientX - board.left) : e.clientX;
      const screenY = board ? (e.clientY - board.top) : e.clientY;
      const worldX = origin.x + screenX / zoom;
      const worldY = origin.y + screenY / zoom;
      // if multiple selected and the dragged id is part of selection, move all selected
      if (selectedIds.length > 0 && selectedIds.includes(d.id)) {
        setLocalPositions((prev) => {
          const next = { ...prev };
          selectedIds.forEach((sid) => {
            const base = (d.origPositions && d.origPositions[sid]) ? d.origPositions[sid] : (prev[sid] || { x: d.origX, y: d.origY });
            const offset = (d.pointerOffsets && d.pointerOffsets[sid]) ? d.pointerOffsets[sid] : { ox: (d.startWorldX ?? worldX) - base.x, oy: (d.startWorldY ?? worldY) - base.y };
            next[sid] = { x: worldX - offset.ox, y: worldY - offset.oy };
          });
          return next;
        });
        // schedule saves for all
        selectedIds.forEach((sid) => scheduleDebouncedSave(sid));
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
      const board = corkboardRef.current?.getBoundingClientRect();
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

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false } as any);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, connectionMode, connectionStart]);

  // finalize marquee on mouseup
  useEffect(() => {
    const up = (e: MouseEvent) => {
      if (marqueeStartRef.current) {
        marqueeStartRef.current = null;
        // leave selection as-is; hide marquee overlay
        setTimeout(() => setMarqueeRect(null), 10);
      }
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const scheduleDebouncedSave = useCallback((id: string) => {
    const existing = saveTimeouts.current[id];
    if (existing) return; // already scheduled
    saveTimeouts.current[id] = setTimeout(async () => {
      try {
        const pos = localPositions[id];
        if (pos) await api.updateCard(id, { x: Math.round(pos.x), y: Math.round(pos.y) });
      } catch (err) {
        console.error('Debounced save failed', err);
      } finally {
        saveTimeouts.current[id] = null;
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
    const boardRect = corkboardRef.current?.getBoundingClientRect();
    const viewW = boardRect?.width ?? window.innerWidth;
    const viewH = boardRect?.height ?? window.innerHeight;
    // center the given board coords (x,y) in view
    setOrigin({ x: x - viewW / (2 * zoom), y: y - viewH / (2 * zoom) });
  };

  // Helper: open Create Clue modal centered on view
  const handleCreateClue = () => {
    setEditingCard(null);
    const boardRect = corkboardRef.current?.getBoundingClientRect();
    const viewW = boardRect?.width ?? window.innerWidth;
    const viewH = boardRect?.height ?? window.innerHeight;
    const cx = viewW / 2;
    const bx = origin.x + cx / zoom;
    const CARD_W = 220;
    const CARD_H = 160;
    setCreateModalPos({ x: Math.round(bx - CARD_W / 2), y: Math.round((viewH / 2) / zoom + origin.y - CARD_H / 2) });
    setCreateModalOpen(true);
  };

  // Wheel-based zoom (Ctrl/Cmd + wheel) and scroll-pan when not holding Ctrl
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        const scaleFactor = 0.05;
        setZoom(prev => {
          const newZoom = prev + (delta > 0 ? scaleFactor : -scaleFactor);
          return Math.min(Math.max(newZoom, 0.1), 3);
        });
        return;
      }
      e.preventDefault();
      setOrigin(prev => ({ x: prev.x + e.deltaX / zoom, y: prev.y + e.deltaY / zoom }));
    };

    const boardEl = corkboardRef.current;
    if (boardEl) boardEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (boardEl) boardEl.removeEventListener('wheel', handleWheel as any); };
  }, [zoom]);

  if (!systemReady) {
    return <BootScreen onComplete={() => setSystemReady(true)} />;
  }

  return (
    <div className="investigation-board">
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
        const board = corkboardRef.current?.getBoundingClientRect();
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
                     try { await api.deleteInvestigationCard(contextMenu.targetId!); setCards(prev => prev.filter(c => c.id !== contextMenu.targetId)); } catch(e){ console.error(e); }
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

      <div className="investigation-toolbar">
        <div className="toolbar-group">
          {canEdit && (
            <button className="hud-btn primary" onClick={handleCreateClue} data-tooltip="Criar nova evidência (Apenas Mestre)">+ NOVA PISTA</button>
          )}

          {isGameMaster && (
            <>
              <div className="toolbar-divider" />
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
              }} data-tooltip="Convidar jogadores para o caso">✉️</button>
              <button 
                 className={`hud-btn icon-only ${playerView ? 'active' : ''}`}
                 onClick={() => setPlayerView(!playerView)}
                 data-tooltip={playerView ? "Voltar para Visão do Mestre" : "Simular Visão do Jogador"}
              >
                 {playerView ? '🕶️' : '👁️'}
              </button>
            </>
          )}

           <button 
            className={`hud-btn ${connectionMode ? 'active' : ''}`} 
            onClick={() => setConnectionMode(!connectionMode)} 
            data-tooltip="Modo Conexão (Fios)"
           >
            <span>🔗</span>
            {connectionMode ? <span style={{ marginLeft: 6 }}>PARAR</span> : <span style={{ marginLeft: 6 }}>CONECTAR</span>}
           </button>

           {connectionMode && (
            <div className="toolbar-group" style={{ animation: 'slideInRight 0.2s', border: '1px solid #444' }}>
              <button 
                className="hud-btn icon-only" 
                onClick={() => { setConnectionType('confirmed'); setConnectionColor('#c62828'); }}
                style={{ opacity: connectionType==='confirmed'?1:0.4, border: connectionType==='confirmed'?'1px solid #c62828':'none' }}
                data-tooltip="Linha Sólida (Fato)"
              >
                <div style={{width:12, height:12, background:'#c62828', borderRadius: '50%'}} />
              </button>

              <button 
                className="hud-btn icon-only"
                onClick={() => { setConnectionType('theory'); setConnectionColor('#f9a825'); }}
                style={{ opacity: connectionType==='theory'?1:0.4, border: connectionType==='theory'?'1px solid #f9a825':'none' }}
                data-tooltip="Linha Pontilhada (Teoria)"
              >
                <div style={{width:12, height:12, background:'#f9a825', borderRadius: '50%'}} />
              </button>

              <button 
                className="hud-btn icon-only" 
                onClick={() => { setConnectionType('mystic'); setConnectionColor('#7e57c2'); }}
                style={{ opacity: connectionType==='mystic'?1:0.4, border: connectionType==='mystic'?'1px solid #7e57c2':'none' }}
                data-tooltip="Linha Mística (Sobrenatural)"
              >
                <div style={{width:12, height:12, background:'#7e57c2', borderRadius: '50%'}} />
              </button>
            </div>
           )}

          <div className="toolbar-sep" />

          <button className="hud-btn icon-only" onClick={() => undo()} disabled={undoStack.length === 0} data-tooltip="Desfazer (Ctrl+Z)">↩</button>
          <button className="hud-btn icon-only" onClick={() => redo()} disabled={redoStack.length === 0} data-tooltip="Refazer (Ctrl+Y)">↪</button>
        </div>

        <div className="toolbar-group">
          <button className={`hud-btn icon-only ${showFinder ? 'active' : ''}`} onClick={() => setShowFinder(!showFinder)} data-tooltip="Buscar Pista por Nome">🔍</button>
          <div style={{ position: 'relative' }}>
            <button className="hud-btn icon-only" onClick={() => setShowOrganizeMenu(!showOrganizeMenu)} data-tooltip="Organizar Pistas">🗂️</button>
            {showOrganizeMenu && (
              <div className="dropdown-menu">
                <div className="dropdown-header">Organizar</div>
                <button onClick={() => handleAutoOrganize('timeline')}>📅 Organizar por Data</button>
                <button onClick={() => handleAutoOrganize('grid')}>🧭 Organizar por Elemento</button>
              </div>
            )}
          </div>

          <button className={`hud-btn icon-only ${isUV ? 'active-uv' : ''}`} onClick={() => setIsUV(!isUV)} data-tooltip="Alternar Luz UV (Ver pistas ocultas)">🔦</button>
          <button className="hud-btn icon-only" onClick={() => setShowSharedBoard(true)} data-tooltip="Abrir Quadro de Conspiração Geral">🕸️</button>
        </div>

        <div className="toolbar-group" style={{ padding: '0 12px', minWidth: 60, justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#666' }}>ZOOM {(zoom * 100).toFixed(0)}%</span>
        </div>
      </div>

      {showFinder && (
        <TerminalSearch onSearch={handleTerminalSearch} onClose={() => { setShowFinder(false); setTerminalMessage(null); }} />
      )}

      {/* Modais (mantidos) */}
      <InvestigationCardModal open={modalOpen} existing={editingCard} investigationId={investigationId} onClose={() => setModalOpen(false)} onSaved={loadBoard} isGameMaster={canEdit} />
      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} investigationId={investigationId} inviteLink={inviteLink} />
      {inspectCard && (
        <InspectionModal
          isOpen={!!inspectCard}
          card={inspectCard}
          isGameMaster={canEdit}
          onClose={() => setInspectCard(null)}
          onEdit={() => {
            setEditingCard(inspectCard);
            setInspectCard(null);
            setModalOpen(true);
          }}
        />
      )}

      <div
        ref={corkboardRef}
        className="corkboard-canvas"
        onMouseMove={(e) => {
          const boardRect = corkboardRef.current?.getBoundingClientRect();
          if (boardRect) {
            const lx = e.clientX - boardRect.left;
            const ly = e.clientY - boardRect.top;
            setOverlayPos({ x: lx, y: ly, over: true });
            setGlobalMouse({ clientX: e.clientX, clientY: e.clientY, overBoard: true });
          } else {
            setGlobalMouse({ clientX: e.clientX, clientY: e.clientY, overBoard: true });
          }
        }}
        onMouseLeave={() => { setGlobalMouse((g) => g ? { ...g, overBoard: false } : null); setOverlayPos((o) => o ? { ...o, over: false } : null); }}
        onMouseDown={(e) => {
          if (e.target === corkboardRef.current || e.target === e.currentTarget) {
            // close any open context menu when clicking the background
            setContextMenu(null);
            const board = corkboardRef.current?.getBoundingClientRect();
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
          const board = corkboardRef.current?.getBoundingClientRect();
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
              const board = corkboardRef.current?.getBoundingClientRect();
              if (!a || !board) return null;
              const mx = (mousePos.x - board.left) / zoom + origin.x;
              const my = (mousePos.y - board.top) / zoom + origin.y;
              const stroke = connectionColor || 'rgba(255,255,255,0.8)';
              const dash = connectionType === 'theory' ? '6 6' : connectionType === 'mystic' ? '2 8' : undefined;
              const width = connectionType === 'mystic' ? 2 : 3;
              return <line className="temp-line" x1={a.x} y1={a.y} x2={mx} y2={my} stroke={stroke} strokeWidth={width} strokeDasharray={dash} />;
            })()}
          </svg>

          {cards.map((card) => {
            const pos = localPositions[card.id] || { x: card.x || 100, y: card.y || 100 };
            const isSelected = selectedIds.includes(card.id);
            const isNew = lastCreatedId === card.id;
            return (
              <div
                key={card.id}
                className={`card-node ${isSelected ? 'selected' : ''} ${isNew ? 'newly-created' : ''}`}
                data-status={(card as any)?.metadata?.status || ''}
                style={{ left: pos.x, top: pos.y }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const board = corkboardRef.current?.getBoundingClientRect();
                  const sx = board ? e.clientX - board.left : 0;
                  const sy = board ? e.clientY - board.top : 0;
                  const worldX = origin.x + sx / zoom;
                  const worldY = origin.y + sy / zoom;
                  setContextMenu({ type: 'card', targetId: card.id, x: worldX, y: worldY });
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const additive = e.shiftKey || e.ctrlKey || e.metaKey;
                  if (!connectionMode) toggleSelect(card.id, additive);
                  const affected = (selectedIds.length > 0 && selectedIds.includes(card.id)) ? selectedIds : [card.id];
                  const origPositions: Record<string, { x: number; y: number }> = {};
                  affected.forEach((id) => {
                    const p = localPositions[id] || (() => {
                      const found = cards.find((cc) => cc.id === id);
                      return found ? { x: found.x || 100, y: found.y || 100 } : { x: pos.x, y: pos.y };
                    })();
                    origPositions[id] = { x: p.x, y: p.y };
                  });
                  const boardRect = corkboardRef.current?.getBoundingClientRect();
                  const startScreenX = boardRect ? e.clientX - boardRect.left : e.clientX;
                  const startScreenY = boardRect ? e.clientY - boardRect.top : e.clientY;
                  const startWorldX = origin.x + startScreenX / zoom;
                  const startWorldY = origin.y + startScreenY / zoom;
                  const pointerOffsets: Record<string, { ox: number; oy: number }> = {};
                  Object.keys(origPositions).forEach((id) => {
                    const base = origPositions[id];
                    pointerOffsets[id] = { ox: startWorldX - base.x, oy: startWorldY - base.y };
                  });
                  const next = { id: card.id, startX: e.clientX, startY: e.clientY, startScreenX, startScreenY, startWorldX, startWorldY, origPositions, origX: pos.x, origY: pos.y, pointerOffsets };
                  draggingRef.current = next;
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
                  const t = ev.touches[0];
                  const affected = (selectedIds.length > 0 && selectedIds.includes(card.id)) ? selectedIds : [card.id];
                  const origPositions: Record<string, { x: number; y: number }> = {};
                  affected.forEach((id) => {
                    const p = localPositions[id] || (() => {
                      const found = cards.find((cc) => cc.id === id);
                      return found ? { x: found.x || 100, y: found.y || 100 } : { x: pos.x, y: pos.y };
                    })();
                    origPositions[id] = { x: p.x, y: p.y };
                  });
                  const boardRect = corkboardRef.current?.getBoundingClientRect();
                  const startScreenX = boardRect ? t.clientX - boardRect.left : t.clientX;
                  const startScreenY = boardRect ? t.clientY - boardRect.top : t.clientY;
                  const startWorldX = origin.x + startScreenX / zoom;
                  const startWorldY = origin.y + startScreenY / zoom;
                  const pointerOffsets: Record<string, { ox: number; oy: number }> = {};
                  Object.keys(origPositions).forEach((id) => {
                    const base = origPositions[id];
                    pointerOffsets[id] = { ox: startWorldX - base.x, oy: startWorldY - base.y };
                  });
                  const next = { id: card.id, startX: t.clientX, startY: t.clientY, startScreenX, startScreenY, startWorldX, startWorldY, origPositions, origX: pos.x, origY: pos.y, pointerOffsets };
                  draggingRef.current = next;
                }}
                onDoubleClick={async () => {
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
                  // Open inspection modal instead of immediate edit
                  // pan board to center the card so inspection content is visible
                  try {
                    const center = getCardCenter(card.id);
                    if (center) panToPosition(center.x, center.y);
                  } catch (e) { /* ignore */ }
                  setInspectCard(card);
                }}
              >
                <div className="card-photo-container">
                  {/* status marker (top-right) */}
                  <div className="status-marker" />
                  {card.stamp_text && (
                    <div className="card-stamp" style={{
                      position: 'absolute', top: 20, right: 10,
                      color: '#c0392b', border: '3px solid #c0392b',
                      padding: '2px 8px', fontSize: 16, fontWeight: 900,
                      fontFamily: 'Black Ops One, cursive', transform: 'rotate(-15deg)',
                      opacity: 0.85, pointerEvents: 'none', zIndex: 50, mixBlendMode: 'multiply'
                    }}>
                      {card.stamp_text}
                    </div>
                  )}
                  {/* Spectrogram download if present in metadata */}
                  {(() => {
                    const spectroUrl = (card && ((card.metadata && card.metadata.spectrogram_url) || (card.spectrogram_url))) || null;
                    if (!spectroUrl) return null;
                    return (
                      <a
                        href={spectroUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`spectrogram_${card.id}.wav`}
                        style={{
                          position: 'absolute', top: 10, left: 10,
                          zIndex: 60, background: 'rgba(10,10,10,0.9)',
                          border: '1px solid #333', color: '#c6a45f', padding: '6px 8px',
                          borderRadius: 4, fontSize: 12, textDecoration: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
                        }}
                      >
                        🎧 WAV
                      </a>
                    );
                  })()}
                  {
                    (() => {
                      // compute pointer position relative to this card in element pixels
                      let pointerLocal = undefined as undefined | { x: number; y: number; over: boolean };
                      if (overlayPos && overlayPos.over) {
                        const elScreenX = (pos.x - origin.x) * zoom; // px inside board rect
                        const elScreenY = (pos.y - origin.y) * zoom;
                        pointerLocal = { x: overlayPos.x - elScreenX, y: overlayPos.y - elScreenY, over: overlayPos.over };
                      }
                      const isLockedForUser = Boolean(card?.is_locked) && !canEdit;
                      return isLockedForUser ? (
                        <div className="card-photo" style={{
                          backgroundImage: 'none',
                          backgroundColor: '#000',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '100%', height: '100%'
                        }}>
                          <div style={{ color: '#e74c3c', fontSize: 32, textShadow: '0 0 10px red' }}>🔒</div>
                        </div>
                      ) : (
                        <MysteryImage baseSrc={card.image_url} hiddenSrc={card.image_uv_url} isUVMode={isUV} pointerLocal={pointerLocal} />
                      );
                    })()
                  }
                </div>
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 4px' }}>
                      <div className="card-title">{card.title}</div>
                      {card.description_public && <div className="card-desc">{card.description_public}</div>}
                    </div>

                    <div style={{
                      position:'absolute', top: -10, left: '50%', transform:'translateX(-50%)',
                      width: 20, height: 40, background: '#888', borderRadius: 10, zIndex: 5,
                      boxShadow: '1px 1px 3px rgba(0,0,0,0.5)'
                    }} />
              </div>
            );
          })}
        </div>
      </div>

      <CreateClueModal
        isOpen={createModalOpen}
        investigationId={investigationId}
        onClose={() => { setCreateModalOpen(false); setCreateModalPos(null); }}
        initialX={createModalPos?.x}
        initialY={createModalPos?.y}
        onSaved={async (created?: any) => {
          try {
            // reload from server first
            await loadBoard();
            if (created && created.id) {
              // center view on created card (use returned coords if present)
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

      <InvestigationCardModal open={modalOpen} existing={editingCard} investigationId={investigationId} onClose={() => setModalOpen(false)} onSaved={loadBoard} isGameMaster={canEdit} />
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
                const boardRect = corkboardRef.current?.getBoundingClientRect();
                const viewW = boardRect?.width ?? window.innerWidth;
                const viewH = boardRect?.height ?? window.innerHeight;
                const cx = origin.x + (viewW / 2) / zoom;
                const cy = origin.y + (viewH / 2) / zoom;
                payload.x = Math.round(cx - 220 / 2);
                payload.y = Math.round(cy - 160 / 2);
                const created = await api.createInvestigationCard(payload as any);
                await loadBoard();
                if (created && created.id) {
                  panToPosition((created.x || payload.x) + 110, (created.y || payload.y) + 80);
                  setLastCreatedId(created.id);
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
      <div className="toast-container">
        {toast && (
          <Toast
            message={toast.message}
            actionLabel={toast.connectionId ? 'Desfazer' : undefined}
            onAction={() => { undo(); clearToast(); }}
            onClose={() => clearToast()}
          />
        )}
      </div>
    </div>
  );
}

export default InvestigationBoard;
