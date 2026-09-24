import { create } from 'zustand';

interface BoardState {
  cards: any[];
  connections: any[];
  localPositions: Record<string, { x: number; y: number }>;
  setCards: (cards: any[] | ((prev: any[]) => any[])) => void;
  setConnections: (conns: any[] | ((prev: any[]) => any[])) => void;
  setLocalPositions: (pos: Record<string, { x: number; y: number }> | ((prev: Record<string, { x: number; y: number }>) => Record<string, { x: number; y: number }>)) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  cards: [],
  connections: [],
  localPositions: {},
  setCards: (updater) => set((state) => ({ 
    cards: typeof updater === 'function' ? updater(state.cards) : updater 
  })),
  setConnections: (updater) => set((state) => ({ 
    connections: typeof updater === 'function' ? updater(state.connections) : updater 
  })),
  setLocalPositions: (updater) => set((state) => ({ 
    localPositions: typeof updater === 'function' ? updater(state.localPositions) : updater 
  }))
}));
