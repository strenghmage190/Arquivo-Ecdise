import { useState, useCallback } from 'react';

export interface NexoMetadata {
  threatLevel: 'low' | 'medium' | 'high';
  accessLevel: 'public' | 'restricted' | 'classified';
  signalStrength: number;
  coherence: number;
  anomalyCount: number;
  lastUpdated: string;
  encryptionKey?: string;
}

const DEFAULT_METADATA: NexoMetadata = {
  threatLevel: 'low',
  accessLevel: 'public',
  signalStrength: 0,
  coherence: 100,
  anomalyCount: 0,
  lastUpdated: new Date().toISOString(),
};

export const useNexoMetadata = (initialMetadata?: Partial<NexoMetadata>) => {
  const [metadata, setMetadata] = useState<NexoMetadata>({
    ...DEFAULT_METADATA,
    ...initialMetadata,
  });

  const updateThreatLevel = useCallback(
    (level: NexoMetadata['threatLevel']) => {
      setMetadata((prev) => ({ ...prev, threatLevel: level, lastUpdated: new Date().toISOString() }));
    },
    []
  );

  const updateAccessLevel = useCallback(
    (level: NexoMetadata['accessLevel']) => {
      setMetadata((prev) => ({ ...prev, accessLevel: level, lastUpdated: new Date().toISOString() }));
    },
    []
  );

  const updateSignalStrength = useCallback((strength: number) => {
    setMetadata((prev) => ({
      ...prev,
      signalStrength: Math.max(0, Math.min(100, strength)),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const incrementAnomalies = useCallback(() => {
    setMetadata((prev) => ({
      ...prev,
      anomalyCount: prev.anomalyCount + 1,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const setEncryptionKey = useCallback((key: string) => {
    setMetadata((prev) => ({
      ...prev,
      encryptionKey: key,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  return {
    metadata,
    updateThreatLevel,
    updateAccessLevel,
    updateSignalStrength,
    incrementAnomalies,
    setEncryptionKey,
    setMetadata,
  };
};

export default useNexoMetadata;
