import React from 'react';

interface BoardButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
}

export function BoardButton({ children, onClick }: BoardButtonProps): React.ReactElement {
  return <button onClick={onClick}>{children}</button>;
}
