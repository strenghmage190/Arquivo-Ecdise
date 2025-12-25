import React from 'react';
import '../../components/board/investigation.css';

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
}

export default function Toast({ message, actionLabel, onAction, onClose }: ToastProps) {
  return (
    <div className="toast">
      <div className="toast-message">{message}</div>
      <div className="toast-actions">
        {actionLabel && onAction && <button className="toast-action" onClick={onAction}>{actionLabel}</button>}
        {onClose && <button className="toast-close" onClick={onClose}>×</button>}
      </div>
    </div>
  );
}
