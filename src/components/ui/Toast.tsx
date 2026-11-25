import React from 'react';
import { X } from 'lucide-react';
import './Toast.css';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
}

export default function Toast({
  message,
  variant = 'info',
  actionLabel,
  onAction,
  onClose,
}: ToastProps) {
  const resolvedActionLabel = actionLabel || (onAction ? 'Localizar' : undefined);

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className={`toast toast-${variant}`}>
        <div className="toast-message">{message}</div>
        <div className="toast-actions">
          {resolvedActionLabel && onAction && (
            <button type="button" className="toast-action" onClick={onAction}>
              {resolvedActionLabel}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className="toast-close"
              onClick={onClose}
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
