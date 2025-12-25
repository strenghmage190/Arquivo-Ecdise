import React from 'react';

export function BoardButton({ children, onClick }: any) {
  return <button onClick={onClick}>{children}</button>;
}
