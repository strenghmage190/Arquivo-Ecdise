import { useCallback, useMemo } from 'react';

export type HapticPattern = number | number[];

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function isHapticsSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  );
}

/**
 * Dispara feedback háptico seguro respeitando `prefers-reduced-motion`
 * e disponibilidade de `navigator.vibrate`.
 */
export function triggerHaptic(pattern: HapticPattern = 15): boolean {
  if (!isHapticsSupported() || prefersReducedMotion()) {
    return false;
  }
  try {
    return Boolean(navigator.vibrate(pattern));
  } catch {
    return false;
  }
}

export interface HapticsApi {
  isSupported: boolean;
  vibrate: (pattern?: HapticPattern) => boolean;
  selection: () => boolean;
  light: () => boolean;
  medium: () => boolean;
  heavy: () => boolean;
  success: () => boolean;
  error: () => boolean;
}

export function useHaptics(): HapticsApi {
  const isSupported = useMemo(() => isHapticsSupported(), []);

  const vibrate = useCallback((pattern: HapticPattern = 15) => triggerHaptic(pattern), []);
  const selection = useCallback(() => triggerHaptic(10), []);
  const light = useCallback(() => triggerHaptic(15), []);
  const medium = useCallback(() => triggerHaptic(35), []);
  const heavy = useCallback(() => triggerHaptic(60), []);
  const success = useCallback(() => triggerHaptic([15, 40, 25]), []);
  const error = useCallback(() => triggerHaptic([40, 30, 40, 30, 60]), []);

  return useMemo(
    () => ({
      isSupported,
      vibrate,
      selection,
      light,
      medium,
      heavy,
      success,
      error,
    }),
    [isSupported, vibrate, selection, light, medium, heavy, success, error]
  );
}

export default useHaptics;
