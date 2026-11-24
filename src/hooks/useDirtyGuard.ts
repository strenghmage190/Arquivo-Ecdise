import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

export interface UseDirtyGuardOptions {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether the guard is currently active (e.g. modal is open). Defaults to true */
  enabled?: boolean;
  /** Confirmation message shown before discarding unsaved changes */
  message?: string;
  /** Whether to attach a window beforeunload listener when dirty. Defaults to true */
  warnOnBeforeUnload?: boolean;
  /** Default close callback used by Escape key handler */
  onClose?: () => void;
  /** Whether to use inline confirmation state instead of window.confirm. Defaults to false */
  useInlineConfirm?: boolean;
  /** Whether to listen for Escape key to trigger guarded close. Defaults to true */
  listenEscape?: boolean;
}

export interface UseDirtyGuardResult {
  /** Guarded close handler: closes immediately if clean, otherwise asks for confirmation */
  guardClose: (closeFn?: () => void) => boolean;
  /** Backdrop click handler that only triggers when clicking the backdrop itself */
  handleBackdropClick: (e: React.MouseEvent<HTMLElement>, closeFn?: () => void) => void;
  /** Whether an inline confirmation prompt is currently open (when useInlineConfirm is true) */
  isConfirmOpen: boolean;
  /** Confirmation message */
  confirmMessage: string;
  /** Confirm discarding changes and invoke the pending close callback */
  confirmDiscard: () => void;
  /** Cancel discarding changes and close the inline confirmation prompt */
  cancelDiscard: () => void;
}

const DEFAULT_DIRTY_MESSAGE =
  'Você tem alterações não salvas. Deseja realmente descartar e fechar?';

/**
 * Reusable hook to protect modals and editors against accidental loss of unsaved changes.
 * Blocks Escape, backdrop clicks, close/cancel buttons, and optionally browser unload.
 */
export function useDirtyGuard({
  isDirty,
  enabled = true,
  message = DEFAULT_DIRTY_MESSAGE,
  warnOnBeforeUnload = true,
  onClose,
  useInlineConfirm = false,
  listenEscape = true,
}: UseDirtyGuardOptions): UseDirtyGuardResult {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const pendingCloseRef = useRef<(() => void) | undefined>(undefined);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Reset inline confirmation if guard becomes disabled or clean
  useEffect(() => {
    if (!enabled || !isDirty) {
      setIsConfirmOpen(false);
      pendingCloseRef.current = undefined;
    }
  }, [enabled, isDirty]);

  const guardClose = useCallback(
    (closeFn?: () => void): boolean => {
      const targetClose = closeFn ?? onCloseRef.current;
      if (!enabled || !isDirty) {
        targetClose?.();
        return true;
      }

      if (useInlineConfirm) {
        pendingCloseRef.current = targetClose;
        setIsConfirmOpen(true);
        return false;
      }

      const confirmed = window.confirm(message);
      if (confirmed) {
        targetClose?.();
        return true;
      }
      return false;
    },
    [enabled, isDirty, message, useInlineConfirm]
  );

  const confirmDiscard = useCallback(() => {
    setIsConfirmOpen(false);
    const fn = pendingCloseRef.current ?? onCloseRef.current;
    pendingCloseRef.current = undefined;
    fn?.();
  }, []);

  const cancelDiscard = useCallback(() => {
    setIsConfirmOpen(false);
    pendingCloseRef.current = undefined;
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, closeFn?: () => void) => {
      if (e.target !== e.currentTarget) return;
      guardClose(closeFn);
    },
    [guardClose]
  );

  useEffect(() => {
    if (!enabled || !listenEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      guardClose(onCloseRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, listenEscape, guardClose]);

  useEffect(() => {
    if (!enabled || !isDirty || !warnOnBeforeUnload) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, isDirty, warnOnBeforeUnload]);

  return {
    guardClose,
    handleBackdropClick,
    isConfirmOpen,
    confirmMessage: message,
    confirmDiscard,
    cancelDiscard,
  };
}

export default useDirtyGuard;
