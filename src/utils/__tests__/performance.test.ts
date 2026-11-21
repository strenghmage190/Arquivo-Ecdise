import { getOptimizedInterval, isPerformanceMode, isExtendedPerformanceMode, markPerfKeep } from '../performance';
import { enablePerformanceMode, disablePerformanceMode, setExtendedMode, readInitialState } from '../performance_control';
import { throttle, debounce, startAdaptiveLoop, createCanvasController } from '../perf_helpers';

describe('performance utilities', () => {
  beforeEach(() => {
    document.body.className = '';
    localStorage.clear();
    jest.useRealTimers();
  });

  test('getOptimizedInterval returns normal interval when extended performance mode is off', () => {
    expect(getOptimizedInterval(100, 2)).toBe(100);
  });

  test('getOptimizedInterval increases when factor > 1 and extended performance mode is enabled', () => {
    document.body.classList.add('performance-mode-extended');
    expect(getOptimizedInterval(100, 2)).toBe(200);
    expect(getOptimizedInterval(50, 3)).toBe(150);
  });

  test('enablePerformanceMode and disablePerformanceMode correctly toggle classes and dispatch events', () => {
    const listener = jest.fn();
    window.addEventListener('ordo:performance-mode-change', listener);

    enablePerformanceMode('high');
    expect(isPerformanceMode()).toBe(true);
    expect(localStorage.getItem('investigation_performance_mode')).toBe('1');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      detail: { enabled: true, preset: 'high' }
    }));

    disablePerformanceMode();
    expect(isPerformanceMode()).toBe(false);
    expect(localStorage.getItem('investigation_performance_mode')).toBe('0');

    window.removeEventListener('ordo:performance-mode-change', listener);
  });

  test('markPerfKeep sets and cleans up attribute', () => {
    const div = document.createElement('div');
    const cleanup = markPerfKeep(div);
    expect(div.getAttribute('data-perf-keep')).toBe('1');
    cleanup();
    expect(div.getAttribute('data-perf-keep')).toBeNull();
  });

  test('throttle and debounce support cancellation for clean memory unmount', () => {
    jest.useFakeTimers();
    const fnThrottled = jest.fn();
    const throttled = throttle(fnThrottled, 100);

    throttled();
    expect(fnThrottled).toHaveBeenCalledTimes(1);
    throttled();
    throttled.cancel();
    jest.advanceTimersByTime(200);
    expect(fnThrottled).toHaveBeenCalledTimes(1);

    const fnDebounced = jest.fn();
    const debounced = debounce(fnDebounced, 100);
    debounced();
    debounced.cancel();
    jest.advanceTimersByTime(200);
    expect(fnDebounced).toHaveBeenCalledTimes(0);
  });

  test('startAdaptiveLoop and createCanvasController stop rAF properly', () => {
    const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      return 123 as any;
    });
    const cancelRafSpy = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const loop = startAdaptiveLoop(jest.fn());
    expect(rafSpy).toHaveBeenCalled();
    loop.stop();
    expect(cancelRafSpy).toHaveBeenCalledWith(123);

    const canvas = document.createElement('canvas');
    jest.spyOn(canvas, 'getContext').mockReturnValue({
      setTransform: jest.fn(),
    } as any);
    const controller = createCanvasController(canvas, jest.fn());
    controller.start();
    controller.stop();
    expect(cancelRafSpy).toHaveBeenCalled();

    rafSpy.mockRestore();
    cancelRafSpy.mockRestore();
  });
});
