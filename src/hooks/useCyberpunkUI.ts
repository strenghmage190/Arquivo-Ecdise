import useSound from 'use-sound';

// Placeholder URLs - in a real app, these would be in the public directory or imported assets
const SOUND_URLS = {
  boot: '/sounds/sys_boot.mp3',
  click: '/sounds/click_holographic.mp3',
  hover: '/sounds/key_hover.mp3',
  process: '/sounds/sys_process.mp3',
  error: '/sounds/sys_error.mp3',
  close: '/sounds/sys_close.mp3',
  success: '/sounds/sys_success.mp3'
};

export function useCyberpunkUI() {
  const [playBoot] = useSound(SOUND_URLS.boot, { volume: 0.5 });
  const [playClick] = useSound(SOUND_URLS.click, { volume: 0.3 });
  const [playHover] = useSound(SOUND_URLS.hover, { volume: 0.1 });
  const [playProcess] = useSound(SOUND_URLS.process, { volume: 0.4 });
  const [playError] = useSound(SOUND_URLS.error, { volume: 0.5 });
  const [playClose] = useSound(SOUND_URLS.close, { volume: 0.4 });
  const [playSuccess] = useSound(SOUND_URLS.success, { volume: 0.5 });

  return {
    playBoot,
    playClick,
    playHover,
    playProcess,
    playError,
    playClose,
    playSuccess
  };
}
