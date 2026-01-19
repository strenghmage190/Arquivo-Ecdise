type Flags = { visualPerformanceMode: boolean; extendedPerformanceMode: boolean };
const LS_KEY = 'app:performanceFlags';

function safeParse(raw: string | null): Flags {
  try {
    if (!raw) return { visualPerformanceMode: false, extendedPerformanceMode: false };
    return JSON.parse(raw) as Flags;
  } catch (e) {
    return { visualPerformanceMode: false, extendedPerformanceMode: false };
  }
}

export function getPerformanceFlags(): Flags {
  return safeParse(localStorage.getItem(LS_KEY));
}

export function setPerformanceFlags(next: Partial<Flags>) {
  const cur = getPerformanceFlags();
  const merged = { ...cur, ...next };
  try { localStorage.setItem(LS_KEY, JSON.stringify(merged)); } catch (e) {}
  // Dispatch separate events to allow decoupled listeners
  window.dispatchEvent(new CustomEvent('performance:visual-changed', { detail: merged.visualPerformanceMode }));
  window.dispatchEvent(new CustomEvent('performance:extended-changed', { detail: merged.extendedPerformanceMode }));
  // Apply class only for visual mode
  if (merged.visualPerformanceMode) document.body.classList.add('performance-mode');
  else document.body.classList.remove('performance-mode');
  // Expose runtime flag for legacy checks
  (window as any).EXTENDED_PERFORMANCE = merged.extendedPerformanceMode;
  return merged;
}

export function togglePerformanceMode(opts?: { visual?: boolean; extended?: boolean }) {
  const cur = getPerformanceFlags();
  const next = {
    visualPerformanceMode: typeof opts?.visual === 'boolean' ? opts.visual : !cur.visualPerformanceMode,
    extendedPerformanceMode: typeof opts?.extended === 'boolean' ? opts.extended : !cur.extendedPerformanceMode,
  };
  return setPerformanceFlags(next);
}

export function isVisualPerformanceMode() {
  return getPerformanceFlags().visualPerformanceMode;
}

export function isExtendedPerformanceMode() {
  return getPerformanceFlags().extendedPerformanceMode;
}

export default {
  getPerformanceFlags,
  setPerformanceFlags,
  togglePerformanceMode,
  isVisualPerformanceMode,
  isExtendedPerformanceMode,
};
