import { useState, useEffect, useCallback } from 'react';

// Função utilitária para debounce
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  const detectTouchSupport = () => {
    if (typeof window === 'undefined') return false;
    try {
      const matchPointerCoarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
      const hasTouchEvents = Boolean(
        'ontouchstart' in window ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
        ((navigator as any).msMaxTouchPoints && (navigator as any).msMaxTouchPoints > 0)
      );
      return matchPointerCoarse || hasTouchEvents;
    } catch (e) {
      return false;
    }
  };

  const detectMobileUA = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua);
  };

  const checkMobile = useCallback(() => {
    const smallWidth = typeof window !== 'undefined' && window.innerWidth <= 768;
    const touch = detectTouchSupport();
    const uaMobile = detectMobileUA();

    // Mobile quando largura é <= 768px E dispositivo suporta touch/pointer coarse ou UA mobile
    setIsMobile(Boolean(smallWidth && (touch || uaMobile)));
  }, []);

  useEffect(() => {
    checkMobile();
    const debouncedCheck = debounce(checkMobile, 150);
    window.addEventListener('resize', debouncedCheck);
    return () => window.removeEventListener('resize', debouncedCheck);
  }, [checkMobile]);

  return isMobile;
};

export const useIsTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const matchPointerCoarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    const hasTouch = Boolean('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
    setIsTouchDevice(matchPointerCoarse || hasTouch);
  }, []);

  return isTouchDevice;
};

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const useDeviceType = (): DeviceType => {
  const isMobile = useIsMobile();
  const isTouch = useIsTouchDevice();

  if (isMobile) return 'mobile';
  if (isTouch) return 'tablet';
  return 'desktop';
};
