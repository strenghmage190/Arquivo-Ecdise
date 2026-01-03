import { useState, useEffect, useCallback } from 'react';

// Função utilitária para debounce
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    checkMobile();
    const debouncedCheck = debounce(checkMobile, 150); // 150ms debounce
    window.addEventListener('resize', debouncedCheck);
    return () => window.removeEventListener('resize', debouncedCheck);
  }, [checkMobile]);

  return isMobile;
};

export const useIsTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsTouchDevice(Boolean('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)));
  }, []);

  return isTouchDevice;
};

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const useDeviceType = (): DeviceType => {
  const isMobile = useIsMobile();
  const isTouch = useIsTouchDevice();

  if (isMobile) return 'mobile';
  if (isTouch) return 'tablet'; // Assume tablets são touch sem ser mobile width
  return 'desktop';
};