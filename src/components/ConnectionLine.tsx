import React from 'react';
import './ConnectionLine.css';

interface ConnectionLineProps {
  pathData: string;
  onSelect: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ pathData, onSelect, onContextMenu, isSelected = false, style, className, onDoubleClick }) => {
  return (
    <g
      className={`connection-group ${isSelected ? 'selected' : ''} ${className || ''}`.trim()}
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
      style={style}
    >
      {/* Visible connection line */}
      <path 
        className={`connection-path ${isSelected ? 'selected' : ''}`}
        d={pathData} 
        fill="none" 
      />
      {/* Invisible hitbox for better touch interaction (rendered after so it sits on top) */}
      <path 
        className="connection-hitbox"
        d={pathData} 
        stroke="transparent" 
        strokeWidth="20" 
        fill="none" 
      />
    </g>
  );
};

export default ConnectionLine;