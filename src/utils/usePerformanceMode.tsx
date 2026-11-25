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

  // Sync with OS prefers-reduced-motion dynamically with clean teardown
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setEnabledState(true);
        setPresetState('high');
      }
    };

    if (mediaQuery.matches && localStorage.getItem('investigation_performance_mode') !== '0') {
      setEnabledState(true);
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if ('addListener' in mediaQuery) {
      (mediaQuery as any).addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if ('removeListener' in mediaQuery) {
        (mediaQuery as any).removeListener(handleChange);
      }
    };
  }, []);

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

