import { useState, useEffect, useCallback } from 'react';

const MOBILE_BREAKPOINT_PX = 768;

function detectTouchSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const matchPointerCoarse =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches;
    const hasTouchEvents = Boolean(
      'ontouchstart' in window ||
        (typeof navigator !== 'undefined' &&
          ((navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
            ((navigator as any).msMaxTouchPoints &&
              (navigator as any).msMaxTouchPoints > 0)))
    );
    return matchPointerCoarse || hasTouchEvents;
  } catch {
    return false;
  }
}

function detectMobileUA(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua);
}

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  const checkMobile = useCallback(() => {
    const smallWidth =
      typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT_PX;
    const touch = detectTouchSupport();
    const uaMobile = detectMobileUA();

    // Mobile quando largura <= 768px E dispositivo suporta touch/pointer coarse ou UA mobile
    setIsMobile(Boolean(smallWidth && (touch || uaMobile)));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    checkMobile();

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const debouncedCheck = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        checkMobile();
      }, 150);
    };

    window.addEventListener('resize', debouncedCheck);
    window.addEventListener('orientationchange', debouncedCheck);

    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)')
        : null;

    if (mediaQuery) {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', checkMobile);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(checkMobile);
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedCheck);
      window.removeEventListener('orientationchange', debouncedCheck);
      if (mediaQuery) {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', checkMobile);
        } else if (typeof mediaQuery.removeListener === 'function') {
          mediaQuery.removeListener(checkMobile);
        }
      }
    };
  }, [checkMobile]);

  return isMobile;
};

export const useIsTouchDevice = (): boolean => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setIsTouchDevice(detectTouchSupport());
    update();

    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)')
        : null;

    if (mediaQuery) {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', update);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(update);
      }
    }

    return () => {
      if (mediaQuery) {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', update);
        } else if (typeof mediaQuery.removeListener === 'function') {
          mediaQuery.removeListener(update);
        }
      }
    };
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
