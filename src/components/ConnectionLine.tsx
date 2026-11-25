import React, { useRef } from 'react';
import { useHaptics } from '../hooks/useHaptics';
import './ConnectionLine.css';

interface ConnectionLineProps {
  pathData: string;
  midpoint?: { x: number; y: number } | null;
  label?: string | null;
  onSelect: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onTouchContextMenu?: (pos: { clientX: number; clientY: number }) => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  pathData,
  midpoint,
  label,
  onSelect,
  onContextMenu,
  onTouchContextMenu,
  isSelected = false,
  isHighlighted = false,
  isDimmed = false,
  style,
  className,
  onDoubleClick,
}) => {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTouchRef = useRef<{ x: number; y: number } | null>(null);
  const { medium } = useHaptics();

  const clearTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      clearTimer();
      return;
    }
    const touch = e.touches[0];
    if (!touch) return;
    startTouchRef.current = { x: touch.clientX, y: touch.clientY };
    clearTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      medium();
      if (onTouchContextMenu && startTouchRef.current) {
        onTouchContextMenu({
          clientX: startTouchRef.current.x,
          clientY: startTouchRef.current.y,
        });
      }
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !startTouchRef.current) return;
    const dx = Math.abs(touch.clientX - startTouchRef.current.x);
    const dy = Math.abs(touch.clientY - startTouchRef.current.y);
    if (dx > 12 || dy > 12) {
      clearTimer();
    }
  };

  const handleTouchEnd = () => {
    clearTimer();
  };

  const trimmedLabel = (label || '').trim();
  const pillWidth = Math.max(48, Math.min(180, trimmedLabel.length * 7.2 + 18));

  const classes = [
    'connection-group',
    isSelected ? 'selected' : '',
    isHighlighted ? 'highlighted' : '',
    isDimmed ? 'dimmed' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <g
      className={classes}
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick && onDoubleClick(e);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={style}
    >
      {/* Visible connection line */}
      <path
        className={`connection-path ${isSelected ? 'selected' : ''}`}
        d={pathData}
        fill="none"
      />
      {/* Subtle luminous pulse for confirmed / mystic connections */}
      <path
        className="connection-pulse"
        d={pathData}
        fill="none"
      />
      {/* Invisible hitbox for better touch interaction (rendered after so it sits on top) */}
      <path
        className="connection-hitbox"
        d={pathData}
        stroke="transparent"
        strokeWidth="24"
        fill="none"
      />
      {/* Optional short label pill at wire midpoint */}
      {trimmedLabel && midpoint && (
        <g
          className="connection-label-group"
          transform={`translate(${midpoint.x}, ${midpoint.y})`}
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e);
          }}
        >
          <rect
            className="connection-label-bg"
            x={-pillWidth / 2}
            y={-11}
            width={pillWidth}
            height={22}
            rx={3}
          />
          <text
            className="connection-label-text"
            x={0}
            y={4}
            textAnchor="middle"
          >
            {trimmedLabel.length > 22 ? `${trimmedLabel.slice(0, 20)}…` : trimmedLabel}
          </text>
        </g>
      )}
    </g>
  );
};

export default ConnectionLine;
