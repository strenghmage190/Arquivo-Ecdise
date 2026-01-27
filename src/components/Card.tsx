import React from 'react';
import useLongPress from '../hooks/useLongPress';

interface CardProps {
  onDrag: (event: React.TouchEvent | React.MouseEvent) => void;
  onClick?: (event: React.MouseEvent) => void;
}

const Card: React.FC<CardProps> = ({ onDrag, onClick }) => {
  const longPressHandlers = useLongPress({
    onLongPress: onDrag,
    onClick,
    delay: 300, // 300ms delay for long press
  });

  return (
    <div className="card" {...longPressHandlers}>
      Card Content
    </div>
  );
};

export default Card;