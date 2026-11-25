import { create } from 'zustand';

export interface BoardZone {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface BoardState {
  cards: any[];
  connections: any[];
  localPositions: Record<string, { x: number; y: number }>;
  snapToGrid: boolean;
  gridSize: number;
  minimapOpen: boolean;
  zonesByInvestigation: Record<string, BoardZone[]>;
  setCards: (cards: any[] | ((prev: any[]) => any[])) => void;
  setConnections: (conns: any[] | ((prev: any[]) => any[])) => void;
  setLocalPositions: (
    pos:
      | Record<string, { x: number; y: number }>
      | ((prev: Record<string, { x: number; y: number }>) => Record<string, { x: number; y: number }>)
  ) => void;
  setSnapToGrid: (enabled: boolean) => void;
  toggleSnapToGrid: () => void;
  setMinimapOpen: (open: boolean) => void;
  toggleMinimapOpen: () => void;
  setZonesForInvestigation: (investigationId: string, zones: BoardZone[]) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  cards: [],
  connections: [],
  localPositions: {},
  snapToGrid: false,
  gridSize: 20,
  minimapOpen: true,
  zonesByInvestigation: {},
  setCards: (updater) =>
    set((state) => ({
      cards: typeof updater === 'function' ? updater(state.cards) : updater,
    })),
  setConnections: (updater) =>
    set((state) => ({
      connections: typeof updater === 'function' ? updater(state.connections) : updater,
    })),
  setLocalPositions: (updater) =>
    set((state) => ({
      localPositions: typeof updater === 'function' ? updater(state.localPositions) : updater,
    })),
  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  setMinimapOpen: (open) => set({ minimapOpen: open }),
  toggleMinimapOpen: () => set((state) => ({ minimapOpen: !state.minimapOpen })),
  setZonesForInvestigation: (investigationId, zones) =>
    set((state) => ({
      zonesByInvestigation: {
        ...state.zonesByInvestigation,
        [investigationId]: zones,
      },
    })),
}));
