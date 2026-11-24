import { useEffect, useRef, useState, useCallback } from 'react';
import { sanitizeTemplateData } from '../api/templates';

export interface ClueDraftPayload {
  savedAt: number;
  data: Record<string, any>;
}

export interface UseClueDraftOptions {
  isOpen: boolean;
  investigationId: string;
  cardId?: string | null;
  getSnapshot: () => Record<string, any>;
  applySnapshot: (data: Record<string, any>) => void;
  /** Changing this key triggers a debounced draft save */
  watchValue: unknown;
  debounceMs?: number;
}

export function getClueDraftStorageKey(
  investigationId: string,
  cardId?: string | null
): string {
  const inv = investigationId || 'global';
  const card = cardId || 'new';
  return `ecdise_clue_draft:${inv}:${card}`;
}

function hasMeaningfulDraftContent(data: Record<string, any>): boolean {
  if (!data || typeof data !== 'object') return false;
  const core = data.coreState || {};
  if (typeof core.title === 'string' && core.title.trim().length > 0) return true;
  if (typeof core.descPublic === 'string' && core.descPublic.trim().length > 0) return true;
  if (typeof core.descHidden === 'string' && core.descHidden.trim().length > 0) return true;
  if (typeof core.tags === 'string' && core.tags.trim().length > 0) return true;
  if (typeof core.discoveryCode === 'string' && core.discoveryCode.trim().length > 0) return true;
  if (data.securityState?.isLocked || data.securityState?.securityLayerEnabled) return true;
  if (Array.isArray(data.phoneState?.chatList) && data.phoneState.chatList.length > 0) return true;
  if (data.cipherState?.cipherText || data.cipherState?.hexCode || data.cipherState?.isShredded) {
    return true;
  }
  if (data.megaClueState?.megaFinalTruthText) return true;
  return false;
}

export function useClueDraft({
  isOpen,
  investigationId,
  cardId,
  getSnapshot,
  applySnapshot,
  watchValue,
  debounceMs = 800,
}: UseClueDraftOptions) {
  const storageKey = getClueDraftStorageKey(investigationId, cardId);
  const [pendingDraft, setPendingDraft] = useState<ClueDraftPayload | null>(null);
  const [draftPaused, setDraftPaused] = useState(false);
  const initializedRef = useRef(false);
  const getSnapshotRef = useRef(getSnapshot);
  getSnapshotRef.current = getSnapshot;

  // Check for an existing draft when the modal opens
  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
      setPendingDraft(null);
      setDraftPaused(false);
      return;
    }

    initializedRef.current = false;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ClueDraftPayload;
        if (parsed && parsed.data && hasMeaningfulDraftContent(parsed.data)) {
          setPendingDraft(parsed);
          setDraftPaused(true);
          initializedRef.current = true;
          return;
        }
      }
    } catch {
      // Ignore malformed draft or unavailable storage
    }

    setPendingDraft(null);
    setDraftPaused(false);
    // Skip the very first render after open so opening an empty/existing card doesn't immediately write
    const initTimer = window.setTimeout(() => {
      initializedRef.current = true;
    }, 50);

    return () => window.clearTimeout(initTimer);
  }, [isOpen, storageKey]);

  // Debounced auto-save
  useEffect(() => {
    if (!isOpen || draftPaused || !initializedRef.current) return;

    const timer = window.setTimeout(() => {
      try {
        const snapshot = getSnapshotRef.current();
        const sanitized = sanitizeTemplateData(snapshot);
        if (!hasMeaningfulDraftContent(sanitized)) return;

        const payload: ClueDraftPayload = {
          savedAt: Date.now(),
          data: sanitized,
        };
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        // Ignore storage quota / privacy errors
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [isOpen, draftPaused, storageKey, watchValue, debounceMs]);

  const restoreDraft = useCallback(() => {
    if (!pendingDraft?.data) return;
    applySnapshot(pendingDraft.data);
    setPendingDraft(null);
    setDraftPaused(false);
    initializedRef.current = true;
  }, [pendingDraft, applySnapshot]);

  const discardDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setPendingDraft(null);
    setDraftPaused(false);
    initializedRef.current = true;
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setPendingDraft(null);
  }, [storageKey]);

  return {
    hasDraft: Boolean(pendingDraft),
    draftTimestamp: pendingDraft?.savedAt ?? null,
    restoreDraft,
    discardDraft,
    clearDraft,
  };
}

export default useClueDraft;
