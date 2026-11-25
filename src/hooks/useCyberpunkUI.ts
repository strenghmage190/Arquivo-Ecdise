import { useCallback } from 'react';
import useSound from 'use-sound';

const SOUND_URLS = {
  boot: '/sounds/sys_boot.mp3',
  click: '/sounds/click_holographic.mp3',
  hover: '/sounds/key_hover.mp3',
  process: '/sounds/sys_process.mp3',
  error: '/sounds/sys_error.mp3',
  close: '/sounds/sys_close.mp3',
  success: '/sounds/sys_success.mp3',
};

function safeInvoke(fn: () => void) {
  try {
    fn();
  } catch {
    // Ignora falhas de autoplay/AudioContext bloqueado no mobile
  }
}

export function useCyberpunkUI() {
  const [rawBoot] = useSound(SOUND_URLS.boot, { volume: 0.5 });
  const [rawClick] = useSound(SOUND_URLS.click, { volume: 0.3 });
  const [rawHover] = useSound(SOUND_URLS.hover, { volume: 0.1 });
  const [rawProcess] = useSound(SOUND_URLS.process, { volume: 0.4 });
  const [rawError] = useSound(SOUND_URLS.error, { volume: 0.5 });
  const [rawClose] = useSound(SOUND_URLS.close, { volume: 0.4 });
  const [rawSuccess] = useSound(SOUND_URLS.success, { volume: 0.5 });

  const playBoot = useCallback(() => safeInvoke(rawBoot), [rawBoot]);
  const playClick = useCallback(() => safeInvoke(rawClick), [rawClick]);
  const playHover = useCallback(() => safeInvoke(rawHover), [rawHover]);
  const playProcess = useCallback(() => safeInvoke(rawProcess), [rawProcess]);
  const playError = useCallback(() => safeInvoke(rawError), [rawError]);
  const playClose = useCallback(() => safeInvoke(rawClose), [rawClose]);
  const playSuccess = useCallback(() => safeInvoke(rawSuccess), [rawSuccess]);

  return {
    playBoot,
    playClick,
    playHover,
    playProcess,
    playError,
    playClose,
    playSuccess,
  };
}
