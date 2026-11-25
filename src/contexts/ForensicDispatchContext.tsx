import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  ForensicAssetPayload,
  ForensicTargetTool,
  BoardSnippetRequest,
} from '../types/forensicPillars';

interface ForensicDispatchContextValue {
  activeDispatch: { target: ForensicTargetTool; asset: ForensicAssetPayload } | null;
  manualOpen: boolean;
  manualInitialTab: 'audio' | 'document' | 'device' | 'crypto';
  sendToForensics: (target: ForensicTargetTool, asset: ForensicAssetPayload) => void;
  clearDispatch: () => void;
  openFieldManual: (tab?: 'audio' | 'document' | 'device' | 'crypto') => void;
  closeFieldManual: () => void;
  saveSnippetToBoard: (snippet: BoardSnippetRequest) => Promise<void>;
}

const noopAsync = async () => {};

const ForensicDispatchContext = createContext<ForensicDispatchContextValue>({
  activeDispatch: null,
  manualOpen: false,
  manualInitialTab: 'audio',
  sendToForensics: () => {},
  clearDispatch: () => {},
  openFieldManual: () => {},
  closeFieldManual: () => {},
  saveSnippetToBoard: noopAsync,
});

export interface ForensicDispatchProviderProps {
  children: React.ReactNode;
  onDispatchToDecoder?: (text: string) => void;
  onSaveSnippet?: (snippet: BoardSnippetRequest) => Promise<void>;
}

export function ForensicDispatchProvider({
  children,
  onDispatchToDecoder,
  onSaveSnippet,
}: ForensicDispatchProviderProps) {
  const [activeDispatch, setActiveDispatch] = useState<{
    target: ForensicTargetTool;
    asset: ForensicAssetPayload;
  } | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualInitialTab, setManualInitialTab] = useState<'audio' | 'document' | 'device' | 'crypto'>('audio');

  const sendToForensics = useCallback(
    (target: ForensicTargetTool, asset: ForensicAssetPayload) => {
      if (target === 'decoder' && asset.text && onDispatchToDecoder) {
        onDispatchToDecoder(asset.text);
        return;
      }
      setActiveDispatch({ target, asset });
    },
    [onDispatchToDecoder]
  );

  const clearDispatch = useCallback(() => {
    setActiveDispatch(null);
  }, []);

  const openFieldManual = useCallback((tab: 'audio' | 'document' | 'device' | 'crypto' = 'audio') => {
    setManualInitialTab(tab);
    setManualOpen(true);
  }, []);

  const closeFieldManual = useCallback(() => {
    setManualOpen(false);
  }, []);

  const saveSnippetToBoard = useCallback(
    async (snippet: BoardSnippetRequest) => {
      if (onSaveSnippet) {
        await onSaveSnippet(snippet);
      }
    },
    [onSaveSnippet]
  );

  return (
    <ForensicDispatchContext.Provider
      value={{
        activeDispatch,
        manualOpen,
        manualInitialTab,
        sendToForensics,
        clearDispatch,
        openFieldManual,
        closeFieldManual,
        saveSnippetToBoard,
      }}
    >
      {children}
    </ForensicDispatchContext.Provider>
  );
}

export function useForensicDispatch() {
  return useContext(ForensicDispatchContext);
}
