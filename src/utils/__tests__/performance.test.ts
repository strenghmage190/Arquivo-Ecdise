import { getOptimizedInterval } from '../performance';

describe('performance utilities', () => {
  beforeEach(() => {
    document.body.className = '';
    localStorage.clear();
  });

  test('getOptimizedInterval returns normal interval when extended performance mode is off', () => {
    expect(getOptimizedInterval(100, 2)).toBe(100);
  });

  test('getOptimizedInterval increases when factor > 1 and extended performance mode is enabled', () => {
    document.body.classList.add('performance-mode-extended');
    expect(getOptimizedInterval(100, 2)).toBe(200);
    expect(getOptimizedInterval(50, 3)).toBe(150);
  });
});
