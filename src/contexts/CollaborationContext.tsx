import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import * as collabApi from '../api/collaboration';
import {
  AnchorJumpRequest,
  CaseFinding,
  CasePin,
  FindingCategory,
  FindingSourceTool,
  PinAnchorData,
  PinTag,
  PinToolType,
  TeamCardStatus,
} from '../types/collaboration';

export interface CollaborationContextValue {
  investigationId: string | null;
  currentUserId: string | null;
  authorName: string;
  isGameMaster: boolean;
  pins: CasePin[];
  pinsByCardId: Record<string, CasePin[]>;
  findings: CaseFinding[];
  cardStatuses: Record<string, TeamCardStatus>;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  pendingAnchorJump: AnchorJumpRequest | null;
  requestAnchorJump: (cardId: string, toolType: PinToolType, anchorData: PinAnchorData) => void;
  clearAnchorJump: () => void;
  createPin: (input: {
    cardId?: string | null;
    toolType: PinToolType;
    anchorData: PinAnchorData;
    tag: PinTag;
    note: string;
  }) => Promise<CasePin | null>;
  resolvePin: (pinId: string, isResolved: boolean) => Promise<void>;
  deletePin: (pinId: string) => Promise<void>;
  addFinding: (input: {
    category: FindingCategory;
    label: string;
    details?: string;
    sourceCardId?: string | null;
    sourceTool?: FindingSourceTool | null;
    sourceAnchor?: PinAnchorData | null;
  }) => Promise<CaseFinding | null>;
  editFinding: (
    findingId: string,
    updates: { label?: string; details?: string | null; category?: FindingCategory }
  ) => Promise<void>;
  deleteFinding: (findingId: string) => Promise<void>;
  setCardTeamStatus: (cardId: string, status: TeamCardStatus) => Promise<void>;
  navigateToCard?: (cardId: string) => void;
}

const noopAsync = async () => null;
const noopVoidAsync = async () => {};

const defaultContextValue: CollaborationContextValue = {
  investigationId: null,
  currentUserId: null,
  authorName: 'Agente',
  isGameMaster: false,
  pins: [],
  pinsByCardId: {},
  findings: [],
  cardStatuses: {},
  isDrawerOpen: false,
  setDrawerOpen: () => {},
  pendingAnchorJump: null,
  requestAnchorJump: () => {},
  clearAnchorJump: () => {},
  createPin: noopAsync,
  resolvePin: noopVoidAsync,
  deletePin: noopVoidAsync,
  addFinding: noopAsync,
  editFinding: noopVoidAsync,
  deleteFinding: noopVoidAsync,
  setCardTeamStatus: noopVoidAsync,
};

const CollaborationContext = createContext<CollaborationContextValue>(defaultContextValue);

export interface CollaborationProviderProps {
  investigationId: string;
  currentUserId?: string | null;
  authorName?: string;
  isGameMaster?: boolean;
  onNavigateToCard?: (cardId: string) => void;
  children: React.ReactNode;
}

export function CollaborationProvider({
  investigationId,
  currentUserId = null,
  authorName = 'Agente',
  isGameMaster = false,
  onNavigateToCard,
  children,
}: CollaborationProviderProps) {
  const [pins, setPins] = useState<CasePin[]>([]);
  const [findings, setFindings] = useState<CaseFinding[]>([]);
  const [cardStatuses, setCardStatuses] = useState<Record<string, TeamCardStatus>>({});
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [pendingAnchorJump, setPendingAnchorJump] = useState<AnchorJumpRequest | null>(null);

  useEffect(() => {
    if (!investigationId) return;
    let cancelled = false;

    const loadAll = async () => {
      const [loadedPins, loadedFindings, loadedStatuses] = await Promise.all([
        collabApi.fetchCasePins(investigationId),
        collabApi.fetchCaseFindings(investigationId),
        collabApi.fetchCaseCardStatuses(investigationId),
      ]);
      if (cancelled) return;
      setPins(loadedPins);
      setFindings(loadedFindings);
      const statusMap: Record<string, TeamCardStatus> = {};
      for (const row of loadedStatuses) {
        statusMap[row.card_id] = row.team_status;
      }
      setCardStatuses(statusMap);
    };

    loadAll();

    const channel = supabase
      .channel(`collab:${investigationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'case_pins', filter: `investigation_id=eq.${investigationId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setPins((prev) => (prev.some((p) => p.id === payload.new.id) ? prev : [...prev, payload.new as CasePin]));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setPins((prev) => prev.map((p) => (p.id === payload.new.id ? (payload.new as CasePin) : p)));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setPins((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'case_findings', filter: `investigation_id=eq.${investigationId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setFindings((prev) =>
              prev.some((f) => f.id === payload.new.id) ? prev : [payload.new as CaseFinding, ...prev]
            );
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setFindings((prev) => prev.map((f) => (f.id === payload.new.id ? (payload.new as CaseFinding) : f)));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setFindings((prev) => prev.filter((f) => f.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'case_card_status', filter: `investigation_id=eq.${investigationId}` },
        (payload: any) => {
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            setCardStatuses((prev) => ({
              ...prev,
              [payload.new.card_id]: payload.new.team_status as TeamCardStatus,
            }));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setCardStatuses((prev) => {
              const next = { ...prev };
              delete next[payload.old.card_id];
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [investigationId]);

  const pinsByCardId = useMemo(() => {
    const map: Record<string, CasePin[]> = {};
    for (const pin of pins) {
      if (!pin.card_id) continue;
      if (!map[pin.card_id]) map[pin.card_id] = [];
      map[pin.card_id].push(pin);
    }
    return map;
  }, [pins]);

  const requestAnchorJump = useCallback(
    (cardId: string, toolType: PinToolType, anchorData: PinAnchorData) => {
      setPendingAnchorJump({
        cardId,
        toolType,
        anchorData,
        nonce: Date.now(),
      });
      if (onNavigateToCard) {
        onNavigateToCard(cardId);
      }
    },
    [onNavigateToCard]
  );

  const clearAnchorJump = useCallback(() => {
    setPendingAnchorJump(null);
  }, []);

  const createPin = useCallback(
    async (input: {
      cardId?: string | null;
      toolType: PinToolType;
      anchorData: PinAnchorData;
      tag: PinTag;
      note: string;
    }) => {
      if (!investigationId) return null;
      const created = await collabApi.createCasePin({
        investigation_id: investigationId,
        card_id: input.cardId ?? null,
        tool_type: input.toolType,
        anchor_data: input.anchorData,
        tag: input.tag,
        note: input.note,
        author_name: authorName,
        created_by: currentUserId || undefined,
      });
      setPins((prev) => (prev.some((p) => p.id === created.id) ? prev : [...prev, created]));
      return created;
    },
    [investigationId, authorName, currentUserId]
  );

  const resolvePin = useCallback(
    async (pinId: string, isResolved: boolean) => {
      setPins((prev) =>
        prev.map((p) => (p.id === pinId ? { ...p, is_resolved: isResolved } : p))
      );
      try {
        const updated = await collabApi.toggleResolveCasePin(pinId, isResolved, currentUserId);
        setPins((prev) => prev.map((p) => (p.id === pinId ? updated : p)));
      } catch (err) {
        console.error('[collaboration] resolvePin error:', err);
      }
    },
    [currentUserId]
  );

  const deletePin = useCallback(async (pinId: string) => {
    setPins((prev) => prev.filter((p) => p.id !== pinId));
    try {
      await collabApi.deleteCasePin(pinId);
    } catch (err) {
      console.error('[collaboration] deletePin error:', err);
    }
  }, []);

  const addFinding = useCallback(
    async (input: {
      category: FindingCategory;
      label: string;
      details?: string;
      sourceCardId?: string | null;
      sourceTool?: FindingSourceTool | null;
      sourceAnchor?: PinAnchorData | null;
    }) => {
      if (!investigationId) return null;
      const created = await collabApi.createCaseFinding({
        investigation_id: investigationId,
        category: input.category,
        label: input.label,
        details: input.details,
        source_card_id: input.sourceCardId ?? null,
        source_tool: input.sourceTool ?? null,
        source_anchor: input.sourceAnchor ?? null,
        author_name: authorName,
        created_by: currentUserId || undefined,
      });
      setFindings((prev) => (prev.some((f) => f.id === created.id) ? prev : [created, ...prev]));
      return created;
    },
    [investigationId, authorName, currentUserId]
  );

  const editFinding = useCallback(
    async (
      findingId: string,
      updates: { label?: string; details?: string | null; category?: FindingCategory }
    ) => {
      const updated = await collabApi.updateCaseFinding(findingId, updates);
      setFindings((prev) => prev.map((f) => (f.id === findingId ? updated : f)));
    },
    []
  );

  const deleteFinding = useCallback(async (findingId: string) => {
    setFindings((prev) => prev.filter((f) => f.id !== findingId));
    try {
      await collabApi.deleteCaseFinding(findingId);
    } catch (err) {
      console.error('[collaboration] deleteFinding error:', err);
    }
  }, []);

  const setCardTeamStatus = useCallback(
    async (cardId: string, status: TeamCardStatus) => {
      if (!investigationId) return;
      setCardStatuses((prev) => ({ ...prev, [cardId]: status }));
      try {
        await collabApi.upsertCaseCardStatus({
          investigation_id: investigationId,
          card_id: cardId,
          team_status: status,
          updated_by: currentUserId || undefined,
        });
      } catch (err) {
        console.error('[collaboration] setCardTeamStatus error:', err);
      }
    },
    [investigationId, currentUserId]
  );

  return (
    <CollaborationContext.Provider
      value={{
        investigationId,
        currentUserId,
        authorName,
        isGameMaster,
        pins,
        pinsByCardId,
        findings,
        cardStatuses,
        isDrawerOpen,
        setDrawerOpen,
        pendingAnchorJump,
        requestAnchorJump,
        clearAnchorJump,
        createPin,
        resolvePin,
        deletePin,
        addFinding,
        editFinding,
        deleteFinding,
        setCardTeamStatus,
        navigateToCard: onNavigateToCard,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  return useContext(CollaborationContext);
}
