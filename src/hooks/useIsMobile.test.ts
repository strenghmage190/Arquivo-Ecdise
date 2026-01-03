import { renderHook, act } from '@testing-library/react';
import { useIsMobile, useIsTouchDevice, useDeviceType } from './useIsMobile';

// Mock window and navigator
const mockWindow = {
  innerWidth: 1024,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

const mockNavigator = {
  maxTouchPoints: 0,
};

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024,
});

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(window, 'dispatchEvent', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(navigator, 'maxTouchPoints', {
  writable: true,
  value: 0,
});

describe('useIsMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.innerWidth = 1024;
  });

  it('should return false for desktop width', () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should return true for mobile width', () => {
    window.innerWidth = 600;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should update on resize', async () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());

    act(() => {
      window.innerWidth = 600;
      window.dispatchEvent(new Event('resize'));
    });

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(result.current).toBe(true);
  });
});

describe('useIsTouchDevice', () => {
  beforeEach(() => {
    navigator.maxTouchPoints = 0;
    delete (window as any).ontouchstart;
  });

  it('should return false when no touch support', () => {
    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(false);
  });

  it('should return true when touch supported via maxTouchPoints', () => {
    navigator.maxTouchPoints = 5;
    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
  });

  it('should return true when ontouchstart exists', () => {
    (window as any).ontouchstart = jest.fn();
    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
  });
});

describe('useDeviceType', () => {
  beforeEach(() => {
    window.innerWidth = 1024;
    navigator.maxTouchPoints = 0;
    delete (window as any).ontouchstart;
  });

  it('should return desktop for non-mobile non-touch', () => {
    const { result } = renderHook(() => useDeviceType());
    expect(result.current).toBe('desktop');
  });

  it('should return mobile for small width', () => {
    window.innerWidth = 600;
    const { result } = renderHook(() => useDeviceType());
    expect(result.current).toBe('mobile');
  });

  it('should return tablet for touch without small width', () => {
    navigator.maxTouchPoints = 5;
    const { result } = renderHook(() => useDeviceType());
    expect(result.current).toBe('tablet');
  });
});