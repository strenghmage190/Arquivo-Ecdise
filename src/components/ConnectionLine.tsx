import React from 'react';
import './ConnectionLine.css';

interface ConnectionLineProps {
  pathData: string;
  onSelect: () => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ pathData, onSelect }) => {
  return (
    <g className="connection-group" onClick={onSelect}>
      {/* Invisible hitbox for better touch interaction */}
      <path 
        d={pathData} 
        stroke="transparent" 
        strokeWidth="20" 
        fill="none" 
        style={{ cursor: 'pointer' }}
      />
      {/* Visible connection line */}
      <path 
        d={pathData} 
        stroke="red" 
        strokeWidth="2" 
        fill="none" 
      />
    </g>
  );
};

export default ConnectionLine;