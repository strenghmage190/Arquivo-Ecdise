import React from 'react';
import type { AgentPresence } from '../../hooks/useWarRoom';

// Níveis que recebem glow especial
const HIGH_CLEARANCE_LEVELS = ['PRETO', 'ALFA', 'OMEGA'];

export const ActiveAgentsHud = ({ agents }: { agents: AgentPresence[] }) => {
  const hasNeonGlow = (clearance: string) => {
    return HIGH_CLEARANCE_LEVELS.includes(clearance?.toUpperCase());
  };

  const getGlowColor = (clearance: string, baseColor: string) => {
    if (clearance?.toUpperCase() === 'PRETO') return '#00ffff';
    return baseColor;
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-2 bg-black/80 border border-[#1e40af] backdrop-blur-sm rounded shadow-[0_0_10px_#1e40af]">
      <div className="flex -space-x-2">
        {agents.map((agent) => {
          const glowColor = getGlowColor(agent.clearance_level, agent.color);
          const hasGlow = hasNeonGlow(agent.clearance_level);

          return (
            <div 
              key={agent.user_id} 
              className="relative group cursor-help"
            >
              <div 
                className="w-8 h-8 rounded-full border-2 overflow-hidden bg-slate-800 transition-all"
                style={{ 
                  borderColor: agent.color,
                  boxShadow: hasGlow ? `0 0 12px ${glowColor}, 0 0 6px ${glowColor}` : 'none'
                }}
              >
                {agent.avatar_url ? (
                  <img src={agent.avatar_url} alt={agent.code_name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-xs font-mono font-bold text-white">
                    {agent.code_name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Tooltip aprimorado */}
              <div 
                className="absolute top-10 right-0 bg-slate-900/95 text-xs font-mono px-3 py-2 rounded border backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60] min-w-[180px]"
                style={{ 
                  borderColor: agent.color,
                  boxShadow: hasGlow ? `0 0 10px ${glowColor}40` : 'none'
                }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: agent.color }}>
                      {agent.code_name}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {agent.specialization}
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-700">
                    <span 
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{ 
                        backgroundColor: agent.color + '20',
                        color: agent.color,
                        border: `1px solid ${agent.color}60`
                      }}
                    >
                      {agent.clearance_level}
                    </span>
                    <span className="text-[9px] text-gray-500">
                      {agent.online_at.split('T')[1].split('.')[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="ml-2 flex items-center gap-2 px-2 border-l border-gray-700">
        <span className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse"></span>
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#00ff00]">
          Uplink Active: {agents.length}
        </span>
      </div>
    </div>
  );
};
