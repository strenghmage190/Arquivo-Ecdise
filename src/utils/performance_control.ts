type Preset = 'low' | 'balanced' | 'high';

const LS_KEY = 'investigation_performance_mode';
const LS_EXT_KEY = 'investigation_extended_performance_mode';
const LS_PRESET_KEY = 'investigation_performance_preset';

const PRESETS: Record<Preset, Record<string, string | number>> = {
  low: {
    '--perf-shadow': '0.6',
    '--perf-blur': '2px',
    '--perf-interval-factor': '1',
    '--perf-target-fps': '30',
  },
  balanced: {
    '--perf-shadow': '0.35',
    '--perf-blur': '1px',
    '--perf-interval-factor': '2',
    '--perf-target-fps': '20',
  },
  high: {
    '--perf-shadow': '0.15',
    '--perf-blur': '0px',
    '--perf-interval-factor': '4',
    '--perf-target-fps': '10',
  },
};

function applyPresetVars(preset: Preset) {
  if (typeof window === 'undefined' || !document.documentElement) return;
  try {
    const vars = PRESETS[preset];
    const root = document.documentElement;
    Object.keys(vars).forEach((k) => root.style.setProperty(k, String(vars[k])));
  } catch (e) {
    console.error('Failed to apply performance preset:', e);
  }
}

export function enablePerformanceMode(preset: Preset = 'balanced') {
  try {
    localStorage.setItem(LS_KEY, '1');
    localStorage.setItem(LS_PRESET_KEY, preset);
  } catch {}
  try { document.body.classList.add('performance-mode'); } catch {}
  applyPresetVars(preset);
}

export function disablePerformanceMode() {
  try { localStorage.setItem(LS_KEY, '0'); } catch {}
  try { localStorage.removeItem(LS_PRESET_KEY); } catch {}
  try { document.body.classList.remove('performance-mode'); } catch {}
}

export function togglePerformanceMode(preset: Preset = 'balanced') {
  const currently = readInitialState().enabled;
  console.log(`Toggling performance mode: ${currently ? 'Disabling' : 'Enabling'} with preset ${preset}`);
  if (currently) disablePerformanceMode();
  else enablePerformanceMode(preset);
}

export function setExtendedMode(enabled: boolean) {
  try { localStorage.setItem(LS_EXT_KEY, enabled ? '1' : '0'); } catch {}
  try {
    if (enabled) document.body.classList.add('performance-mode-extended');
    else document.body.classList.remove('performance-mode-extended');
  } catch {}
}

export function readInitialState(): { enabled: boolean; extended: boolean; preset: Preset } {
  try {
    const enabled = localStorage.getItem(LS_KEY) === '1' || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches && localStorage.getItem(LS_KEY) !== '0');
    const extended = localStorage.getItem(LS_EXT_KEY) === '1';
    const preset = (localStorage.getItem(LS_PRESET_KEY) as Preset) || 'balanced';
    return { enabled, extended, preset };
  } catch {
    return { enabled: false, extended: false, preset: 'balanced' };
  }
}

export { PRESETS };
export type PerfPreset = Preset;

export function applyPreset(preset: Preset) {
  try { applyPresetVars(preset); localStorage.setItem(LS_PRESET_KEY, preset); } catch {}
}

export default {
  enablePerformanceMode,
  disablePerformanceMode,
  togglePerformanceMode,
  setExtendedMode,
  readInitialState,
  applyPreset,
};
