import React from 'react';
import './ConnectionLine.css';

interface ConnectionLineProps {
  pathData: string;
  onSelect: () => void;
  isSelected?: boolean;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ pathData, onSelect, isSelected = false }) => {
  return (
    <g className={`connection-group ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      {/* Invisible hitbox for better touch interaction */}
      <path 
        className="connection-hitbox"
        d={pathData} 
        stroke="transparent" 
        strokeWidth="20" 
        fill="none" 
      />
      {/* Visible connection line */}
      <path 
        className={`connection-path ${isSelected ? 'selected' : ''}`}
        d={pathData} 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none" 
      />
    </g>
  );
};

export default ConnectionLine;