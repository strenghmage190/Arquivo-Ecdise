/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎯 WAR ROOM - BARREL EXPORT
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Simplifica os imports do War Room:
 * 
 * ANTES:
 * import { useWarRoom } from '../../hooks/useWarRoom';
 * import { ActiveAgentsHud } from '../war-room/ActiveAgentsHud';
 * import { CursorOverlay } from '../war-room/CursorOverlay';
 * 
 * DEPOIS:
 * import { useWarRoom, ActiveAgentsHud, CursorOverlay } from '@/components/war-room';
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export { ActiveAgentsHud } from './ActiveAgentsHud';
export { CursorOverlay } from './CursorOverlay';

// Re-export do hook para conveniência
export { useWarRoom } from '../../hooks/useWarRoom';
export type { AgentPresence, CursorPosition } from '../../hooks/useWarRoom';
