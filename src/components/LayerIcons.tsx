import React from 'react';

export function LayerIcon({ type, className = '' }: { type: string; className?: string }) {
  const baseProps = { className, width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true } as any;
  const stroke = { stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as any;
  switch (type) {
    case 'text':
      return (
        <svg {...baseProps}>
          <path d="M4 6h16M12 6v12" {...stroke} />
        </svg>
      );
    case 'image':
      return (
        <svg {...baseProps}>
          <rect x="3" y="3" width="18" height="14" rx="1.5" {...stroke} />
          <circle cx="9" cy="9" r="1.5" {...stroke} />
          <path d="M21 17l-5-5-6 6" {...stroke} />
        </svg>
      );
    case 'drawing':
      return (
        <svg {...baseProps}>
          <path d="M3 21l7-7 7-7 4 4-7 7-7 7" {...stroke} />
        </svg>
      );
    case 'group':
      return (
        <svg {...baseProps}>
          <path d="M3 7h6l2 2h8v8a1 1 0 0 1-1 1H3V7z" {...stroke} />
        </svg>
      );
    default:
      return (
        <svg {...baseProps}>
          <path d="M3 12h18M12 3v18" {...stroke} />
        </svg>
      );
  }
}

export function MaskIcon({ className = '' }: { className?: string }) {
  const baseProps = { className, width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true } as any;
  const stroke = { stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as any;
  return (
    <svg {...baseProps}>
      <path d="M12 2C7.5 2 4 5.5 4 10s3.5 8 8 12c4.5-4 8-7.5 8-12s-3.5-8-8-8z" {...stroke} />
      <path d="M9 11s1-2 3-2 3 2 3 2" {...stroke} />
    </svg>
  );
}

export default LayerIcon;
