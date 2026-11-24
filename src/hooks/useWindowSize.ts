import { useState, useEffect } from 'react';

export interface WindowSize {
  width: number;
  height: number;
}

export const useWindowSize = (): WindowSize => {
  const isClient = typeof window === 'object';
  const getSize = (): WindowSize => ({
    width: isClient ? window.innerWidth : 0,
    height: isClient ? (window.visualViewport?.height ?? window.innerHeight) : 0,
  });

  const [size, setSize] = useState<WindowSize>(getSize);

  useEffect(() => {
    if (!isClient) return;
    let rafId: number | null = null;
    const handle = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setSize(getSize());
      });
    };

    window.addEventListener('resize', handle);
    window.addEventListener('orientationchange', handle);
    window.visualViewport?.addEventListener('resize', handle);
    handle();

    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('orientationchange', handle);
      window.visualViewport?.removeEventListener('resize', handle);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isClient]);

  return size;
};

export default useWindowSize;
