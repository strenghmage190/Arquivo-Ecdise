import React from 'react';
import type { CursorPosition, AgentPresence } from '../../hooks/useWarRoom';
import { useIsMobile } from '../../hooks/useIsMobile';

interface Props {
  cursors: Record<string, CursorPosition>;
  agents: AgentPresence[];
}

// Mapeamento de cores baseado no clearance level
const CLEARANCE_COLORS: Record<string, string> = {
  BRANCO: '#e0e0e0',
  AMARELO: '#FFD700',
  LARANJA: '#FF8C00',
  VERMELHO: '#DC143C',
  PRETO: '#333333',
  ALFA: '#4169E1',
  OMEGA: '#8B00FF',
};

// Níveis que recebem glow neon
const HIGH_CLEARANCE_LEVELS = ['PRETO', 'ALFA', 'OMEGA'];

export const CursorOverlay = ({ cursors, agents }: Props) => {
  const isMobile = useIsMobile();

  const getAgentColor = (userId: string, info?: CursorPosition['info']) => {
    if (info?.clearance_level) {
      return CLEARANCE_COLORS[info.clearance_level.toUpperCase()] || CLEARANCE_COLORS.BRANCO;
    }
    const agent = agents.find((a) => a.user_id === userId);
    return agent?.color || CLEARANCE_COLORS.BRANCO;
  };

  const getAgentName = (userId: string, info?: CursorPosition['info']) => {
    if (info?.codename) return info.codename;
    return agents.find((a) => a.user_id === userId)?.code_name || 'Agente';
  };

  const getAgentSpecialization = (userId: string, info?: CursorPosition['info']) => {
    if (info?.specialization) return info.specialization;
    return agents.find((a) => a.user_id === userId)?.specialization || '';
  };

  const getClearanceLevel = (userId: string, info?: CursorPosition['info']) => {
    if (info?.clearance_level) return info.clearance_level.toUpperCase();
    return agents.find((a) => a.user_id === userId)?.clearance_level.toUpperCase() || 'BRANCO';
  };

  const hasNeonGlow = (clearance: string) => {
    return HIGH_CLEARANCE_LEVELS.includes(clearance);
  };

  const getNeonGlowStyle = (color: string, clearance: string) => {
    if (!hasNeonGlow(clearance)) return {};
    const glowColor = clearance === 'PRETO' ? '#00ffff' : color;
    return {
      filter: `drop-shadow(0 0 8px ${glowColor})`,
    };
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 'var(--z-connections, 10)' }}
      aria-hidden="true"
    >
      {Object.values(cursors).map((cursor) => {
        const color = getAgentColor(cursor.user_id, cursor.info);
        const codename = getAgentName(cursor.user_id, cursor.info);
        const specialization = getAgentSpecialization(cursor.user_id, cursor.info);
        const clearance = getClearanceLevel(cursor.user_id, cursor.info);
        const glowStyle = getNeonGlowStyle(color, clearance);

        if (isMobile) {
          // Indicador suave de toque/presença no mobile (não obstrui leitura)
          return (
            <div
              key={cursor.user_id}
              className="absolute pointer-events-none transition-all duration-150 ease-out"
              style={{
                left: cursor.x,
                top: cursor.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="w-7 h-7 rounded-full border-2 opacity-75"
                style={{
                  borderColor: color,
                  backgroundColor: `${color}22`,
                  boxShadow: `0 0 12px ${color}55`,
                }}
              />
              <div
                className="mt-1 px-1.5 py-0.5 rounded bg-black/75 border text-[10px] font-mono whitespace-nowrap text-center"
                style={{
                  borderColor: `${color}80`,
                  color,
                }}
              >
                {codename}
              </div>
            </div>
          );
        }

        return (
          <div
            key={cursor.user_id}
            className="absolute pointer-events-none transition-all duration-100 ease-linear"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-50%, -50%)',
              ...glowStyle,
            }}
          >
            {/* Seta do Cursor Customizada */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-lg"
              style={{ fill: color }}
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19138L23.4111 1.19138L16.4855 7.15286H12.633L10.0248 12.3673H5.65376Z"
                stroke="white"
                strokeWidth="0.5"
              />
            </svg>

            {/* Label com nome e especialização */}
            <div
              className="absolute left-5 top-2 px-2 py-1 rounded text-white bg-black/80 border backdrop-blur-sm whitespace-nowrap"
              style={{
                borderColor: color,
                boxShadow: hasNeonGlow(clearance)
                  ? `0 0 10px ${clearance === 'PRETO' ? '#00ffff' : color}`
                  : 'none',
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold font-mono text-xs" style={{ color }}>
                  {codename}
                </span>
                {specialization && (
                  <span className="text-[9px] opacity-70 font-mono block text-gray-300">
                    {specialization}
                  </span>
                )}
                <span
                  className="text-[8px] font-mono font-bold uppercase mt-0.5 px-1 rounded"
                  style={{
                    backgroundColor: color + '20',
                    color: color,
                    border: `1px solid ${color}40`,
                  }}
                >
                  {clearance}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
