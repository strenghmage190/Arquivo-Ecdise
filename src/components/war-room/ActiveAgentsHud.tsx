import React, { useState } from 'react';
import type { AgentPresence } from '../../hooks/useWarRoom';
import { useIsMobile } from '../../hooks/useIsMobile';

// Níveis que recebem glow especial
const HIGH_CLEARANCE_LEVELS = ['PRETO', 'ALFA', 'OMEGA'];

export const ActiveAgentsHud = ({ agents }: { agents: AgentPresence[] }) => {
  const isMobile = useIsMobile();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const hasNeonGlow = (clearance: string) => {
    return HIGH_CLEARANCE_LEVELS.includes(clearance?.toUpperCase());
  };

  const getGlowColor = (clearance: string, baseColor: string) => {
    if (clearance?.toUpperCase() === 'PRETO') return '#00ffff';
    return baseColor;
  };

  const maxVisible = isMobile ? 3 : 6;
  const visibleAgents = agents.slice(0, maxVisible);
  const overflowCount = Math.max(0, agents.length - visibleAgents.length);

  return (
    <div
      className="flex items-center gap-1.5 md:gap-2 p-1 md:p-2 bg-black/85 border border-[#1e40af] backdrop-blur-sm rounded shadow-[0_0_10px_rgba(30,64,175,0.45)] pointer-events-auto max-w-full"
      style={{
        zIndex: 'var(--z-hud, 1000)',
      }}
      role="region"
      aria-label={`Agentes ativos: ${agents.length}`}
    >
      <div className="flex -space-x-2">
        {visibleAgents.map((agent) => {
          const glowColor = getGlowColor(agent.clearance_level, agent.color);
          const hasGlow = hasNeonGlow(agent.clearance_level);
          const isSelected = selectedAgentId === agent.user_id;
          const onlineTime = agent.online_at?.includes('T')
            ? agent.online_at.split('T')[1].split('.')[0]
            : '';

          return (
            <div key={agent.user_id} className="relative group">
              <button
                type="button"
                onClick={() =>
                  setSelectedAgentId((prev) => (prev === agent.user_id ? null : agent.user_id))
                }
                aria-label={`${agent.code_name} (${agent.clearance_level})`}
                aria-expanded={isSelected}
                className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} rounded-full border-2 overflow-hidden bg-slate-800 transition-all cursor-pointer p-0 block`}
                style={{
                  borderColor: agent.color,
                  boxShadow: hasGlow ? `0 0 10px ${glowColor}` : 'none',
                }}
              >
                {agent.avatar_url ? (
                  <img
                    src={agent.avatar_url}
                    alt={agent.code_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-[10px] md:text-xs font-mono font-bold text-white">
                    {agent.code_name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </button>

              {/* Tooltip / Popover (hover desktop + tap mobile) */}
              <div
                className={`absolute top-10 right-0 bg-slate-900/95 text-xs font-mono px-3 py-2 rounded border backdrop-blur-sm transition-opacity whitespace-nowrap pointer-events-none min-w-[170px] ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{
                  zIndex: 'var(--z-tooltip, 4500)',
                  borderColor: agent.color,
                  boxShadow: hasGlow ? `0 0 10px ${glowColor}40` : 'none',
                }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: agent.color }}>
                      {agent.code_name}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400">{agent.specialization}</div>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-700">
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: agent.color + '20',
                        color: agent.color,
                        border: `1px solid ${agent.color}60`,
                      }}
                    >
                      {agent.clearance_level}
                    </span>
                    {onlineTime && <span className="text-[9px] text-gray-500">{onlineTime}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {overflowCount > 0 && (
          <div
            className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} rounded-full border border-slate-600 bg-slate-900 text-[10px] font-mono font-bold text-slate-200 flex items-center justify-center`}
            title={`+${overflowCount} agentes`}
          >
            +{overflowCount}
          </div>
        )}
      </div>

      <div className="ml-1 md:ml-2 flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 border-l border-gray-700">
        <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" aria-hidden="true" />
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#10b981] tabular-nums whitespace-nowrap">
          {isMobile ? `${agents.length}` : `Uplink: ${agents.length}`}
        </span>
      </div>
    </div>
  );
};
