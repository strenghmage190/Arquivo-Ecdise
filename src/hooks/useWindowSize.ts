import { useState, useEffect } from 'react';

export const useWindowSize = () => {
  const isClient = typeof window === 'object';
  const getSize = () => ({
    width: isClient ? window.innerWidth : 0,
    height: isClient ? window.innerHeight : 0,
  });

  const [size, setSize] = useState(getSize);

  useEffect(() => {
    if (!isClient) return;
    let rafId: number | null = null;
    const handle = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setSize(getSize()));
    };

    window.addEventListener('resize', handle);
    // initial
    handle();
    return () => {
      window.removeEventListener('resize', handle);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isClient]);

  return size;
};

export default useWindowSize;
