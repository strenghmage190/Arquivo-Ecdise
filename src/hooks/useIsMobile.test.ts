/// <reference types="jest" />
import React from 'react';
import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { useIsMobile, useIsTouchDevice, useDeviceType } from './useIsMobile';

// Habilita act environment para evitar warnings do React 18
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Helper customizado para testar hooks sem depender do @testing-library/dom ausente
function renderCustomHook<T>(hook: () => T) {
  const result = { current: undefined as unknown as T };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  function TestComponent() {
    result.current = hook();
    return null;
  }

  act(() => {
    root.render(React.createElement(TestComponent));
  });

  return {
    result,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
    rerender: () => {
      act(() => {
        root.render(React.createElement(TestComponent));
      });
    }
  };
}

describe('useIsMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.innerWidth = 1024;
    (navigator as any).maxTouchPoints = 0;
    delete (window as any).ontouchstart;
  });

  it('should return false for desktop width', () => {
    window.innerWidth = 1024;
    const { result, unmount } = renderCustomHook(() => useIsMobile());
    expect(result.current).toBe(false);
    unmount();
  });

  it('should return true for mobile width with touch support', () => {
    window.innerWidth = 600;
    (navigator as any).maxTouchPoints = 1;
    const { result, unmount } = renderCustomHook(() => useIsMobile());
    expect(result.current).toBe(true);
    unmount();
  });

  it('should update on resize', async () => {
    window.innerWidth = 1024;
    (navigator as any).maxTouchPoints = 1;
    const { result, unmount } = renderCustomHook(() => useIsMobile());
    expect(result.current).toBe(false);

    window.innerWidth = 600;
    window.dispatchEvent(new Event('resize'));

    // Wait for debounce and wrap in act
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 250));
    });

    expect(result.current).toBe(true);
    unmount();
  });

  it('should return true for mobile width with pointer: coarse matchMedia', () => {
    const originalMatchMedia = window.matchMedia;
    window.innerWidth = 375;
    (navigator as any).maxTouchPoints = 0;
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { result, unmount } = renderCustomHook(() => useIsMobile());
    expect(result.current).toBe(true);
    unmount();
    window.matchMedia = originalMatchMedia;
  });
});

describe('useIsTouchDevice', () => {
  beforeEach(() => {
    (navigator as any).maxTouchPoints = 0;
    delete (window as any).ontouchstart;
  });

  it('should return false when no touch support', () => {
    const { result, unmount } = renderCustomHook(() => useIsTouchDevice());
    expect(result.current).toBe(false);
    unmount();
  });

  it('should return true when touch supported via maxTouchPoints', () => {
    (navigator as any).maxTouchPoints = 5;
    const { result, unmount } = renderCustomHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
    unmount();
  });

  it('should return true when ontouchstart exists', () => {
    (window as any).ontouchstart = jest.fn();
    const { result, unmount } = renderCustomHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
    unmount();
  });

  it('should return true when pointer: coarse matches', () => {
    const originalMatchMedia = window.matchMedia;
    (navigator as any).maxTouchPoints = 0;
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { result, unmount } = renderCustomHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
    unmount();
    window.matchMedia = originalMatchMedia;
  });
});

describe('useDeviceType', () => {
  beforeEach(() => {
    window.innerWidth = 1024;
    (navigator as any).maxTouchPoints = 0;
    delete (window as any).ontouchstart;
  });

  it('should return desktop for non-mobile non-touch', () => {
    const { result, unmount } = renderCustomHook(() => useDeviceType());
    expect(result.current).toBe('desktop');
    unmount();
  });

  it('should return mobile for small width with touch', () => {
    window.innerWidth = 600;
    (navigator as any).maxTouchPoints = 1;
    const { result, unmount } = renderCustomHook(() => useDeviceType());
    expect(result.current).toBe('mobile');
    unmount();
  });

  it('should return tablet for touch without small width', () => {
    window.innerWidth = 1024;
    (navigator as any).maxTouchPoints = 5;
    const { result, unmount } = renderCustomHook(() => useDeviceType());
    expect(result.current).toBe('tablet');
    unmount();
  });
});
