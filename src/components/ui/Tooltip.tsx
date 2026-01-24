import React from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';

// Fix for ReactTooltip type issue (declare commonly used props we pass)
const ReactTooltipFixed = ReactTooltip as unknown as React.FC<{
  id: string;
  effect: string;
  place?: string;
  className?: string;
  children?: React.ReactNode;
}>;

interface TooltipProps {
  id: string;
  text: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ id, text, children }) => {
  return (
    <span style={{ display: 'inline-block' }} data-tip data-for={id} aria-describedby={id}>
      {children}
      <ReactTooltipFixed id={id} effect="solid" place="right" className="uv-tooltip" />
      {/* ReactTooltip reads the `data-tip` content from the element, so text is provided via data-tip attribute */}
    </span>
  );
};