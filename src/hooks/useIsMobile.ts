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

  const detectTouchSupport = () => {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean((window as any).ontouchstart !== undefined || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (navigator as any).msMaxTouchPoints > 0);
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

    // Only consider mobile when the viewport is small AND we detect a touch-capable device
    // or the user agent reports a mobile device. This prevents forcing "mobile" mode on desktop when
    // the user toggles a mobile preview in devtools or manually resizes the window.
    setIsMobile(Boolean(smallWidth && (touch || uaMobile)));
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