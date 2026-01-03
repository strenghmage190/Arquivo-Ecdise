/**
 * Performance utilities for the investigation system
 */

/**
 * Check if extended performance mode is active
 */
export function isExtendedPerformanceMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('investigation_extended_performance_mode') === '1';
  } catch {
    return false;
  }
}

/**
 * Check if regular performance mode is active
 */
export function isPerformanceMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('investigation_performance_mode') === '1';
  } catch {
    return false;
  }
}

/**
 * Get optimized interval for performance mode
 * @param normalInterval Normal interval in milliseconds
 * @param performanceMultiplier Multiplier for performance mode (default: 4x slower)
 */
export function getOptimizedInterval(normalInterval: number, performanceMultiplier = 4): number {
  return isExtendedPerformanceMode() ? normalInterval * performanceMultiplier : normalInterval;
}

/**
 * Get optimized animation duration for performance mode
 * @param normalDuration Normal duration in milliseconds
 */
export function getOptimizedAnimationDuration(normalDuration: number): number {
  return isExtendedPerformanceMode() ? 1 : normalDuration;
}