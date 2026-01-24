import { useEffect, useState, useCallback } from 'react';
import { enablePerformanceMode, disablePerformanceMode, setExtendedMode, readInitialState, PRESETS } from './performance_control';

type Preset = 'low' | 'balanced' | 'high';

export default function usePerformanceMode() {
  const initial = typeof window !== 'undefined' ? readInitialState() : { enabled: false, extended: false, preset: 'balanced' as Preset };
  const [enabled, setEnabledState] = useState<boolean>(initial.enabled);
  const [extended, setExtendedState] = useState<boolean>(initial.extended);
  const [preset, setPresetState] = useState<Preset>(initial.preset as Preset);

  useEffect(() => {
    if (enabled) enablePerformanceMode(preset);
    else disablePerformanceMode();
  }, [enabled, preset]);

  useEffect(() => {
    setExtendedMode(extended);
  }, [extended]);

  const setEnabled = useCallback((v: boolean) => setEnabledState(v), []);
  const setExtended = useCallback((v: boolean) => setExtendedState(v), []);
  const setPreset = useCallback((p: Preset) => setPresetState(p), []);
  const toggle = useCallback(() => setEnabledState((s) => !s), []);

  return {
    enabled,
    extended,
    preset,
    setEnabled,
    setExtended,
    setPreset,
    toggle,
    PRESETS,
  } as const;
}

